// Online editor for team pages, the network overview and the shared publication library.
// What each login may change is decided by the database (Row Level Security);
// this page only shows the areas that the signed-in account is allowed to edit.
(() => {
  'use strict';
  // Never run the editor inside another site's frame (click-jacking protection).
  if (window.top !== window.self) { document.body.textContent = 'Open the editor directly: ' + location.href; return; }
  const api = window.TeamCloud;
  const $ = selector => document.querySelector(selector);
  const clone = value => JSON.parse(JSON.stringify(value));
  const definitions = window.LAB_DEFINITIONS || [];
  const DEFAULT_HERO = 'assets/city-hero.webp';
  const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  const state = { account: null, pages: new Map(), library: null, area: null, draft: null, revision: 0, updatedAt: null, dirty: false, busy: false };

  // ---------------------------------------------------------------- helpers
  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (name === 'class') node.className = value;
      else if (name.startsWith('on') && typeof value === 'function') node.addEventListener(name.slice(2), value);
      else node.setAttribute(name, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }
  let sequence = 0;
  const nextId = () => 'field-' + (++sequence);

  function field({ label, value, onInput, multiline = false, rows = 3, required = false, max, hint, type = 'text', placeholder }) {
    const id = nextId();
    const input = multiline ? h('textarea', { id, rows }) : h('input', { id, type });
    input.value = value === undefined || value === null ? '' : value;
    if (max) input.maxLength = max;
    if (required) input.required = true;
    if (placeholder) input.placeholder = placeholder;
    if (type === 'number') { input.min = '1900'; input.max = '2100'; input.step = '1'; }
    input.addEventListener('input', () => onInput(input.value));
    return h('div', { class: 'field' },
      h('label', { for: id }, label, required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
      input, hint ? h('p', { class: 'hint' }, hint) : null);
  }

  function section({ title, lead, action }, ...children) {
    return h('section', { class: 'section' },
      h('div', { class: 'section-head' }, h('div', {}, h('h2', {}, title), lead ? h('p', { class: 'lead' }, lead) : null), action || null),
      ...children);
  }

  function show(view) {
    for (const id of ['view-loading', 'view-config', 'view-login', 'view-workspace']) $('#' + id).hidden = id !== view;
  }

  let toastTimer = null;
  function toast(message, { error = false, link = null, action = null, timeout = 6000 } = {}) {
    const box = $('#toast');
    box.replaceChildren(message);
    if (link) box.append(h('a', { href: link.href, target: '_blank', rel: 'noopener' }, link.text));
    if (action) box.append(' ', h('button', { type: 'button', class: 'ghost small', onclick: () => { box.hidden = true; action.onClick(); } }, action.label));
    box.classList.toggle('error', error);
    box.hidden = false;
    clearTimeout(toastTimer);
    if (timeout) toastTimer = setTimeout(() => { box.hidden = true; }, timeout);
  }

  const teamName = id => {
    const page = state.pages.get(id);
    const def = definitions.find(d => d.id === id);
    const fallback = def ? def.name : id;
    if (!page) return fallback;
    try { return api.cleanPage(page.content).site.name; } catch { return fallback; }
  };

  // ------------------------------------------------------------ images
  function canvasBlob(canvas, type, quality) { return new Promise(resolve => canvas.toBlob(resolve, type, quality)); }
  async function readImage(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch { /* fall back */ } }
    const url = URL.createObjectURL(file);
    try { const img = new Image(); img.src = url; await img.decode(); return img; }
    finally { URL.revokeObjectURL(url); }
  }
  // Keep uploads light: photos larger than 2000 px or 1.5 MB are resized and compressed.
  async function prepareImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
    if (file.size > 25 * 1024 * 1024) throw new Error('This file is larger than 25 MB. Choose a smaller image.');
    let image;
    try { image = await readImage(file); } catch { throw new Error('This file could not be read as an image.'); }
    const width = image.width, height = image.height;
    const scale = Math.min(1, 2000 / Math.max(width, height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    for (const quality of [0.86, 0.78, 0.68, 0.58]) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let blob = await canvasBlob(canvas, 'image/webp', quality);
      if (!blob || blob.type !== 'image/webp') { // browsers without WebP encoding
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        blob = await canvasBlob(canvas, 'image/jpeg', quality);
      }
      if (blob && blob.size <= 2.9 * 1024 * 1024) return blob;
    }
    throw new Error('The image could not be reduced below 3 MB. Choose a smaller image.');
  }
  function checkImageUrl(url) {
    window.LabContent.validate({ version: 1, members: [{ name: 'check', role: 'check', photo: url }] });
  }

  function imagePicker({ value, fallback = '', folder, onChange, portrait = false, removeLabel = 'Remove image', emptyText = 'No image' }) {
    let current = value || '';
    const preview = h('div', { class: 'image-preview' + (portrait ? ' portrait' : '') });
    const progress = h('p', { class: 'progress', hidden: true });
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const fileInput = h('input', { type: 'file', accept: IMAGE_TYPES.join(','), hidden: true });
    const urlInput = h('input', { type: 'url', placeholder: 'https://…', 'aria-label': 'Image URL' });
    const removeButton = h('button', { type: 'button', class: 'ghost small', onclick: () => set('') }, removeLabel);
    const urlRow = h('div', { class: 'url-row', hidden: true }, urlInput, h('button', { type: 'button', class: 'ghost small', onclick: applyUrl }, 'Use URL'));
    function paint() {
      preview.replaceChildren();
      const src = current || fallback;
      if (src) {
        const img = h('img', { alt: '' });
        img.addEventListener('error', () => preview.replaceChildren(h('span', {}, 'Image unavailable')));
        img.src = src;
        preview.append(img);
      } else preview.append(h('span', {}, emptyText));
      removeButton.hidden = !current;
    }
    function set(next) { current = next; paint(); onChange(next); }
    function applyUrl() {
      const url = urlInput.value.trim();
      try { checkImageUrl(url); set(url); urlRow.hidden = true; error.hidden = true; }
      catch (problem) { error.textContent = problem.message; error.hidden = false; }
    }
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      error.hidden = true; progress.hidden = false; progress.textContent = 'Preparing image…';
      try {
        const blob = await prepareImage(file);
        progress.textContent = 'Uploading…';
        const url = await withAuth(() => api.upload(blob, folder));
        set(url);
        progress.textContent = 'Uploaded. Remember to publish.';
        setTimeout(() => { progress.hidden = true; }, 4000);
      } catch (problem) { progress.hidden = true; error.textContent = problem.message; error.hidden = false; }
    });
    paint();
    return h('div', { class: 'image-picker' }, preview,
      h('div', { class: 'image-controls' },
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'ghost small', onclick: () => { fileInput.value = ''; fileInput.click(); } }, 'Upload image…'),
          h('button', { type: 'button', class: 'ghost small', onclick: () => { urlRow.hidden = !urlRow.hidden; if (!urlRow.hidden) urlInput.focus(); } }, 'Use image URL…'),
          removeButton),
        urlRow, progress, error, fileInput,
        h('p', { class: 'hint' }, 'JPG, PNG or WebP. Large photos are resized automatically.')));
  }

  function figureEditor(images) {
    const list = h('div', { class: 'figure-list' });
    const progress = h('p', { class: 'progress', hidden: true });
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const fileInput = h('input', { type: 'file', accept: IMAGE_TYPES.join(','), multiple: true, hidden: true });
    const uploadButton = h('button', { type: 'button', class: 'ghost small', onclick: () => { fileInput.value = ''; fileInput.click(); } }, 'Upload figures…');
    const urlInput = h('input', { type: 'url', placeholder: 'https://… (image address)', 'aria-label': 'Figure image URL' });
    const urlButton = h('button', { type: 'button', class: 'ghost small', onclick: () => {
      const url = urlInput.value.trim();
      try { checkImageUrl(url); images.push({ src: url, alt: '', caption: '' }); urlInput.value = ''; error.hidden = true; paint(); }
      catch (problem) { error.textContent = problem.message; error.hidden = false; }
    } }, 'Add image URL');
    fileInput.addEventListener('change', async () => {
      const files = [...fileInput.files].slice(0, Math.max(0, 6 - images.length));
      error.hidden = true;
      for (const [index, file] of files.entries()) {
        progress.hidden = false; progress.textContent = `Uploading figure ${index + 1} of ${files.length}…`;
        try { const blob = await prepareImage(file); images.push({ src: await withAuth(() => api.upload(blob, 'publications')), alt: '', caption: '' }); paint(); }
        catch (problem) { error.textContent = file.name + ': ' + problem.message; error.hidden = false; }
      }
      progress.hidden = true;
    });
    function paint() {
      list.replaceChildren();
      images.forEach((image, index) => {
        const preview = h('div', { class: 'image-preview' });
        const img = h('img', { alt: '' });
        img.addEventListener('error', () => preview.replaceChildren(h('span', {}, 'Image unavailable')));
        img.src = image.src; preview.append(img);
        list.append(h('div', { class: 'figure-item' }, preview,
          h('div', {},
            field({ label: 'Image description (for screen readers)', value: image.alt, max: 600, onInput: v => { image.alt = v; } }),
            field({ label: 'Caption / credit', value: image.caption, max: 1200, multiline: true, rows: 2, onInput: v => { image.caption = v; } })),
          h('div', { class: 'figure-buttons' },
            h('button', { type: 'button', class: 'icon-button', title: 'Move up', 'aria-label': 'Move figure up', disabled: index === 0, onclick: () => { [images[index - 1], images[index]] = [images[index], images[index - 1]]; paint(); } }, '↑'),
            h('button', { type: 'button', class: 'icon-button', title: 'Move down', 'aria-label': 'Move figure down', disabled: index === images.length - 1, onclick: () => { [images[index + 1], images[index]] = [images[index], images[index + 1]]; paint(); } }, '↓'),
            h('button', { type: 'button', class: 'danger small', onclick: () => { images.splice(index, 1); paint(); } }, 'Remove'))));
      });
      const full = images.length >= 6;
      uploadButton.disabled = full; urlButton.disabled = full; urlInput.disabled = full;
    }
    paint();
    return h('div', { class: 'field' }, h('label', {}, 'Figures (up to 6)'), list,
      h('div', { class: 'image-controls' }, h('div', { class: 'row' }, uploadButton), h('div', { class: 'url-row' }, urlInput, urlButton), progress, error, fileInput));
  }

  // ------------------------------------------------------------ dialogs
  function itemDialog(title, nodes, onSubmit) {
    const dialog = $('#item-dialog');
    const error = $('#item-dialog-error');
    $('#item-dialog-title').textContent = title;
    $('#item-dialog-body').replaceChildren(...nodes);
    error.hidden = true;
    $('#item-form').onsubmit = event => {
      event.preventDefault();
      try { onSubmit(); dialog.close(); }
      catch (problem) { error.textContent = problem.message; error.hidden = false; }
    };
    $('#item-cancel').onclick = () => dialog.close();
    dialog.showModal();
    const first = dialog.querySelector('#item-dialog-body input, #item-dialog-body textarea');
    if (first) first.focus();
  }

  const validateOne = (kind, item) => {
    const V = window.LabContent.validate;
    if (kind === 'member') return V({ version: 1, members: [item] }).members[0];
    if (kind === 'research') return V({ version: 1, members: [], research: [item] }).research[0];
    if (kind === 'contributor') return V({ version: 1, members: [], contributors: [item] }).contributors[0];
    return V({ version: 1, members: [], publications: [item] }).publications[0];
  };

  function memberForm(item, done) {
    const m = item || { name: '', role: '', research: '', bio: '', photo: '', url: '', orcid: '' };
    itemDialog(item ? 'Edit member' : 'Add member', [
      h('div', { class: 'grid-2' },
        field({ label: 'Name', value: m.name, required: true, max: 120, onInput: v => { m.name = v; } }),
        field({ label: 'Role / position', value: m.role, required: true, max: 200, placeholder: 'PhD researcher', onInput: v => { m.role = v; } })),
      field({ label: 'Research interests', value: m.research, max: 600, multiline: true, rows: 2, onInput: v => { m.research = v; } }),
      field({ label: 'Affiliation / short biography', value: m.bio, max: 2000, multiline: true, rows: 4, onInput: v => { m.bio = v; } }),
      h('div', { class: 'grid-2' },
        field({ label: 'Personal website', value: m.url, max: 2048, type: 'url', placeholder: 'https://…', onInput: v => { m.url = v; } }),
        field({ label: 'ORCID iD', value: m.orcid, max: 80, placeholder: '0000-0000-0000-0000', onInput: v => { m.orcid = v; } })),
      h('div', { class: 'field' }, h('label', {}, 'Portrait photo'),
        imagePicker({ value: m.photo, folder: state.area.id, portrait: true, removeLabel: 'Remove photo', emptyText: 'No photo', onChange: v => { m.photo = v; } }))
    ], () => done(validateOne('member', m)));
  }

  function researchForm(item, done) {
    const r = item || { title: '', tag: '', summary: '', detail: '', keywords: '' };
    itemDialog(item ? 'Edit research topic' : 'Add research topic', [
      h('div', { class: 'grid-2' },
        field({ label: 'Title', value: r.title, required: true, max: 200, onInput: v => { r.title = v; } }),
        field({ label: 'Label', value: r.tag, max: 80, placeholder: 'e.g. DIGITAL TWINS', onInput: v => { r.tag = v; } })),
      field({ label: 'Summary', value: r.summary, required: true, max: 1500, multiline: true, rows: 3, onInput: v => { r.summary = v; } }),
      field({ label: 'Details (shown under “Explore the questions”)', value: r.detail, max: 4000, multiline: true, rows: 4, onInput: v => { r.detail = v; } }),
      field({ label: 'Keywords (comma separated)', value: r.keywords, max: 300, onInput: v => { r.keywords = v; } })
    ], () => done(validateOne('research', r)));
  }

  function contributorForm(item, done) {
    const c = item || { name: '', contribution: '' };
    itemDialog(item ? 'Edit contributor' : 'Add contributor', [
      field({ label: 'Name', value: c.name, required: true, max: 120, onInput: v => { c.name = v; } }),
      field({ label: 'Contribution to the website', value: c.contribution, required: true, max: 600, multiline: true, rows: 3, onInput: v => { c.contribution = v; } })
    ], () => done(validateOne('contributor', c)));
  }

  function paperForm(item, done) {
    const p = item || { title: '', authors: '', venue: '', year: new Date().getFullYear(), doi: '', url: '', pdf: '', abstract: '', body: '', images: [] };
    p.images = p.images || [];
    itemDialog(item ? 'Edit paper' : 'Add paper', [
      field({ label: 'Title', value: p.title, required: true, max: 600, multiline: true, rows: 2, onInput: v => { p.title = v; } }),
      field({ label: 'Authors', value: p.authors, required: true, max: 1500, placeholder: 'First Author, Second Author, …', onInput: v => { p.authors = v; } }),
      h('div', { class: 'grid-2' },
        field({ label: 'Journal / conference', value: p.venue, required: true, max: 400, onInput: v => { p.venue = v; } }),
        field({ label: 'Year', value: p.year, required: true, type: 'number', onInput: v => { p.year = v === '' ? NaN : Number(v); } })),
      h('div', { class: 'grid-2' },
        field({ label: 'DOI', value: p.doi, max: 300, placeholder: '10.xxxx/…', hint: 'A DOI or its full https://doi.org/ link.', onInput: v => { p.doi = v; } }),
        field({ label: 'Publication page', value: p.url, max: 2048, type: 'url', placeholder: 'https://…', onInput: v => { p.url = v; } })),
      field({ label: 'Full text (PDF) link', value: p.pdf, max: 2048, type: 'url', placeholder: 'https://…', onInput: v => { p.pdf = v; } }),
      field({ label: 'Abstract', value: p.abstract, max: 6000, multiline: true, rows: 5, onInput: v => { p.abstract = v; } }),
      field({ label: 'Research content / details', value: p.body, max: 16000, multiline: true, rows: 7, hint: 'Leave an empty line between paragraphs.', onInput: v => { p.body = v; } }),
      figureEditor(p.images)
    ], () => done(validateOne('paper', p)));
  }

  // ------------------------------------------------------------ lists
  function listSection({ title, lead, items, max, addLabel, empty, describe, edit, reorder = true, thumb = true, afterChange }) {
    const list = h('ul', { class: 'list' });
    const changed = () => { if (afterChange) afterChange(); setDirty(true); paint(); };
    const addButton = h('button', { type: 'button', class: 'ghost small', onclick: () => edit(null, created => { items.push(created); changed(); }) }, '+ ' + addLabel);
    function paint() {
      list.replaceChildren();
      addButton.disabled = items.length >= max;
      if (!items.length) { list.append(h('li', { class: 'empty' }, empty)); return; }
      items.forEach((item, index) => {
        const d = describe(item);
        let thumbNode = null;
        if (thumb) {
          thumbNode = h('div', { class: 'list-thumb', 'aria-hidden': 'true' });
          if (d.image) { const img = h('img', { alt: '' }); img.addEventListener('error', () => thumbNode.replaceChildren(d.initial || '•')); img.src = d.image; thumbNode.append(img); }
          else thumbNode.append(d.initial || '•');
        }
        list.append(h('li', { class: 'list-item' }, d.lead || null, thumbNode,
          h('div', { class: 'list-text' }, h('strong', {}, d.title || '(untitled)'), d.subtitle ? h('span', {}, d.subtitle) : null),
          h('div', { class: 'list-actions' },
            reorder ? h('button', { type: 'button', class: 'icon-button', title: 'Move up', 'aria-label': 'Move up: ' + d.title, disabled: index === 0, onclick: () => { [items[index - 1], items[index]] = [items[index], items[index - 1]]; changed(); } }, '↑') : null,
            reorder ? h('button', { type: 'button', class: 'icon-button', title: 'Move down', 'aria-label': 'Move down: ' + d.title, disabled: index === items.length - 1, onclick: () => { [items[index + 1], items[index]] = [items[index], items[index + 1]]; changed(); } }, '↓') : null,
            h('button', { type: 'button', class: 'ghost small', 'aria-label': 'Edit ' + d.title, onclick: () => edit(clone(item), updated => { items[index] = updated; changed(); }) }, 'Edit'),
            h('button', { type: 'button', class: 'danger small', 'aria-label': 'Remove ' + d.title, onclick: () => { if (confirm('Remove “' + d.title + '”? (It disappears from the website when you publish.)')) { items.splice(index, 1); changed(); } } }, 'Remove'))));
      });
    }
    paint();
    return section({ title, lead, action: addButton }, list);
  }

  // ------------------------------------------------------------ editors
  function siteSection() {
    const s = state.draft.site;
    const set = key => value => { s[key] = value; setDirty(true); };
    const network = state.area.id === 'network';
    return section({ title: 'Home & About', lead: 'Names and text for the header, the top of the page and the About section.' },
      h('div', { class: 'grid-2' },
        field({ label: network ? 'Website name' : 'Team name', value: s.name, required: true, max: 80, onInput: set('name') }),
        field({ label: 'Subtitle', value: s.subtitle, required: true, max: 100, onInput: set('subtitle') })),
      field({ label: 'Headline', value: s.headline, required: true, max: 1000, multiline: true, rows: 2, hint: 'Press Enter for a line break.', onInput: set('headline') }),
      field({ label: 'Introduction', value: s.introduction, required: true, max: 1000, multiline: true, rows: 3, hint: network ? '' : 'Also shown on this team’s card in the team directory.', onInput: set('introduction') }),
      field({ label: 'Search description', value: s.description, required: true, max: 1000, multiline: true, rows: 2, hint: 'Used by search engines and link previews.', onInput: set('description') }),
      field({ label: 'About heading', value: s.aboutTitle, required: true, max: 1000, multiline: true, rows: 2, onInput: set('aboutTitle') }),
      field({ label: 'About text', value: s.about, required: true, max: 6000, multiline: true, rows: 6, onInput: set('about') }));
  }

  function backgroundSection() {
    const a = state.draft.appearance;
    return section({ title: 'Background image', lead: 'The large picture at the top of the page. Wide images (about 16:9) work best.' },
      imagePicker({ value: a.heroImage, fallback: DEFAULT_HERO, folder: state.area.id, removeLabel: 'Use default image', onChange: v => { a.heroImage = v; setDirty(true); } }),
      h('div', { class: 'grid-2' },
        field({ label: 'Image description (for screen readers)', value: a.heroAlt, max: 600, onInput: v => { a.heroAlt = v; setDirty(true); } }),
        field({ label: 'Caption / credit', value: a.heroCaption, max: 160, onInput: v => { a.heroCaption = v; setDirty(true); } })));
  }

  function peopleSection() {
    return listSection({
      title: 'People', lead: 'Members shown on this team page, in this order.', items: state.draft.members, max: 300,
      addLabel: 'Add member', empty: 'No members yet.', edit: memberForm,
      describe: m => ({ title: m.name, subtitle: [m.role, m.bio].filter(Boolean).join(' · '), image: m.photo, initial: Array.from(m.name || '?')[0] })
    });
  }

  function researchSection() {
    return listSection({
      title: 'Research topics', lead: 'Cards in the Research section.', items: state.draft.research, max: 30, thumb: false,
      addLabel: 'Add topic', empty: 'No research topics yet.', edit: researchForm,
      describe: r => ({ title: r.title, subtitle: [r.tag, r.summary].filter(Boolean).join(' · ') })
    });
  }

  function observatorySection() {
    const o = state.draft.observatory;
    return section({ title: 'Observatory', lead: 'Heading and introduction above the interactive simulation. The simulation itself is fixed.' },
      field({ label: 'Heading', value: o.title, required: true, max: 200, onInput: v => { o.title = v; setDirty(true); } }),
      field({ label: 'Introduction', value: o.description, required: true, max: 1500, multiline: true, rows: 3, onInput: v => { o.description = v; setDirty(true); } }));
  }

  function contributorsSection() {
    return listSection({
      title: 'Website contributors', lead: 'Shown on the network overview (names and contributions only).', items: state.draft.contributors, max: 300, thumb: false,
      addLabel: 'Add contributor', empty: 'No contributors listed.', edit: contributorForm,
      describe: c => ({ title: c.name, subtitle: c.contribution })
    });
  }

  function publicationsSection() {
    const papers = state.draft;
    const sort = () => papers.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    sort();
    return listSection({
      title: 'Papers', lead: 'Displayed on the shared Publications page, newest first.', items: papers, max: 2000, thumb: false, reorder: false,
      addLabel: 'Add paper', empty: 'No papers yet.', edit: paperForm, afterChange: sort,
      describe: p => ({ lead: h('span', { class: 'year-pill' }, String(p.year)), title: p.title, subtitle: [p.authors, p.venue].filter(Boolean).join(' · ') + (p.images && p.images.length ? ' · ' + p.images.length + ' figure(s)' : '') })
    });
  }

  // ------------------------------------------------------------ workspace
  function areas() {
    const account = state.account;
    const list = [];
    if (account.role === 'admin') list.push({ id: 'network', kind: 'page', label: 'Network overview', kicker: 'NETWORK OVERVIEW', color: '#6cf5cc', live: 'index.html', note: 'Website name, homepage text, background image and website contributors.' });
    definitions.forEach((def, index) => {
      if (!account.editableScopes.includes(def.id)) return;
      list.push({ id: def.id, kind: 'page', label: teamName(def.id), kicker: 'TEAM 0' + (index + 1) + ' · ' + def.code, color: def.color, live: 'lab.html?lab=' + encodeURIComponent(def.id),
        note: account.role === 'admin' ? 'Team page: introduction, background, people, research topics and observatory text.' : 'You can edit this team page. Publications and the network overview are managed by the administrator.' });
    });
    if (account.canEditPublications) list.push({ id: 'publications', kind: 'library', label: 'Shared publications', kicker: 'ALL TEAMS · ONE LIBRARY', color: '#ffffff', live: 'publications.html', note: 'One library shared by all six teams. Only the administrator can change it.' });
    return list;
  }

  function loadDraft() {
    if (state.area.kind === 'library') {
      state.revision = state.library ? state.library.revision : 0;
      state.updatedAt = state.library ? state.library.updated_at : null;
      try { state.draft = api.cleanPublications(state.library ? state.library.content : []); }
      catch (problem) { state.draft = []; toast('The stored publication list could not be read: ' + problem.message, { error: true, timeout: 0 }); }
    } else {
      const page = state.pages.get(state.area.id);
      state.revision = page ? page.revision : 0;
      state.updatedAt = page ? page.updated_at : null;
      try { state.draft = api.cleanPage(page && page.content); }
      catch (problem) { state.draft = api.cleanPage({ members: [] }); toast('The stored page could not be read (' + problem.message + '). Publishing will replace it.', { error: true, timeout: 0 }); }
    }
    state.dirty = false;
  }

  function openArea(id, { force = false } = {}) {
    if (!force && state.dirty && state.area && state.area.id !== id && !confirm('You have unpublished changes. Discard them and switch?')) return;
    const list = areas();
    state.area = list.find(area => area.id === id) || list[0];
    loadDraft();
    history.replaceState(null, '', '#' + state.area.id);
    renderWorkspace();
    window.scrollTo(0, 0);
  }

  function dot(color) { const node = h('span', { class: 'area-dot', 'aria-hidden': 'true' }); node.style.setProperty('--dot', color); return node; }

  function renderSidebar() {
    const nav = $('#area-list');
    nav.replaceChildren();
    for (const area of areas()) {
      const active = state.area && area.id === state.area.id;
      nav.append(h('button', { type: 'button', class: 'area-button', 'aria-current': active ? 'true' : 'false', onclick: () => openArea(area.id) },
        dot(area.color), h('span', {}, area.label),
        active && state.dirty ? h('span', { class: 'badge' }, 'draft') : null));
    }
    $('#sidebar-title').textContent = state.account.role === 'admin' ? 'All areas' : 'Your team';
    $('#admin-tools').hidden = state.account.role !== 'admin';
  }

  function renderStatus() {
    const status = $('#publish-status');
    const when = state.updatedAt ? new Date(state.updatedAt).toLocaleString() : '—';
    status.replaceChildren(
      state.busy ? h('span', { class: 'badge' }, 'PUBLISHING…') : state.dirty ? h('span', { class: 'badge' }, 'UNPUBLISHED CHANGES') : h('span', { class: 'status-live' }, '● Live'),
      '  Version ' + state.revision + ' · last published ' + when);
    $('#publish').disabled = !state.dirty || state.busy;
    $('#discard').disabled = !state.dirty || state.busy;
  }

  function setDirty(value) { const changed = state.dirty !== value; state.dirty = value; renderStatus(); if (changed) renderSidebar(); }

  function renderWorkspace() {
    const area = state.area;
    $('#area-kicker').textContent = area.kicker;
    $('#area-title').textContent = area.kind === 'library' ? 'Shared publications' : area.id === 'network' ? 'Network overview' : teamName(area.id);
    $('#area-note').textContent = area.note;
    $('#view-live').href = area.live;
    const body = $('#editor-body');
    body.replaceChildren();
    if (area.kind === 'library') body.append(publicationsSection());
    else {
      body.append(siteSection(), backgroundSection());
      if (area.id === 'network') body.append(contributorsSection());
      else body.append(peopleSection(), researchSection(), observatorySection());
    }
    renderSidebar();
    renderStatus();
  }

  function locateProblem() {
    const label = (prefix, index, name) => prefix + ' · ' + (name ? '“' + name + '”' : 'item ' + (index + 1));
    try {
      if (state.area.kind === 'library') {
        state.draft.forEach((p, i) => { try { validateOne('paper', p); } catch (e) { throw new Error(label('Paper', i, p.title) + ': ' + e.message); } });
      } else {
        const d = state.draft;
        d.members.forEach((m, i) => { try { validateOne('member', m); } catch (e) { throw new Error(label('People', i, m.name) + ': ' + e.message); } });
        d.research.forEach((r, i) => { try { validateOne('research', r); } catch (e) { throw new Error(label('Research', i, r.title) + ': ' + e.message); } });
        d.contributors.forEach((c, i) => { try { validateOne('contributor', c); } catch (e) { throw new Error(label('Contributors', i, c.name) + ': ' + e.message); } });
        api.cleanPage(d);
      }
    } catch (problem) { return problem.message; }
    return '';
  }

  async function refreshPublished() {
    const remote = await api.fetchPublished();
    state.pages = new Map(remote.pages.map(page => [page.scope, page]));
    state.library = remote.library;
  }

  async function publish() {
    if (!state.dirty || state.busy) return;
    const problem = locateProblem();
    if (problem) { toast('Not published — please fix: ' + problem, { error: true, timeout: 12000 }); return; }
    state.busy = true; renderStatus();
    try {
      if (state.area.kind === 'library') state.library = await withAuth(() => api.savePublications(state.draft, state.revision));
      else { const row = await withAuth(() => api.savePage(state.area.id, state.draft, state.revision)); state.pages.set(row.scope, row); }
      state.busy = false;
      loadDraft();
      renderWorkspace();
      toast('Published. The live website now shows these changes. ', { link: { href: state.area.live, text: 'View page ↗' } });
    } catch (error) {
      state.busy = false; renderStatus();
      if (error.code === 'CONFLICT') toast(error.message, { error: true, timeout: 0, action: { label: 'Load latest version', onClick: reloadLatest } });
      else toast(error.message, { error: true, timeout: 12000 });
    }
  }

  async function reloadLatest() {
    try { await refreshPublished(); openArea(state.area.id, { force: true }); toast('Loaded the latest published version.'); }
    catch (error) { toast(error.message, { error: true }); }
  }

  async function downloadBackup() {
    const button = $('#download-backup');
    button.disabled = true;
    try {
      const { bundle, problems } = api.mergePublished(await api.fetchPublished(), null);
      if (problems.length) throw new Error('Some published content could not be read: ' + problems.join('; '));
      const final = window.LabContent.validateBundle(bundle);
      const text = '// Website content snapshot downloaded from admin.html on ' + new Date().toISOString() + '.\n' +
        '// Replace content-data.js in GitHub with this file to refresh the offline snapshot.\n' +
        'window.LAB_CONTENT = ' + JSON.stringify(final, null, 2) + ';\n';
      const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
      const link = h('a', { href: url, download: 'content-data.js' });
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Backup downloaded: content-data.js');
    } catch (error) { toast(error.message, { error: true, timeout: 12000 }); }
    finally { button.disabled = false; }
  }

  // ------------------------------------------------------------ sign-in
  let reauthWaiter = null;
  function reauthenticate() {
    if (reauthWaiter) return reauthWaiter.promise;
    let resolve, reject;
    const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
    reauthWaiter = { promise, resolve, reject };
    $('#reauth-email').textContent = state.account.email;
    $('#reauth-password').value = '';
    $('#reauth-error').hidden = true;
    $('#reauth-dialog').showModal();
    $('#reauth-password').focus();
    return promise;
  }
  function cancelReauth() {
    if ($('#reauth-dialog').open) $('#reauth-dialog').close();
    if (reauthWaiter) { reauthWaiter.reject(new Error('Sign-in cancelled. Your changes are still here but have not been published.')); reauthWaiter = null; }
  }
  async function withAuth(task) {
    try { return await task(); }
    catch (error) {
      if (!error || error.code !== 'AUTH') throw error;
      await reauthenticate();
      return task();
    }
  }

  function showLoginError(message) { const box = $('#login-error'); box.textContent = message; box.hidden = !message; }

  async function enter(account) {
    state.account = account;
    $('#account-email').textContent = account.email;
    $('#account').hidden = false;
    show('view-loading');
    try { await refreshPublished(); }
    catch (error) { show('view-login'); showLoginError(error.message); return; }
    $('#account-role').textContent = account.role === 'admin' ? 'Administrator · all content' : 'Team editor · ' + teamName(account.teamId);
    const network = state.pages.get('network');
    try { if (network) $('#site-name').textContent = api.cleanPage(network.content).site.name; } catch { /* keep the default label */ }
    show('view-workspace');
    const requested = decodeURIComponent(location.hash.slice(1));
    const list = areas();
    openArea(list.some(area => area.id === requested) ? requested : list[0].id, { force: true });
  }

  function bind() {
    $('#login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;
      if (!email || !password) { showLoginError('Enter your email and password.'); return; }
      const button = $('#login-submit');
      button.disabled = true; button.textContent = 'Signing in…'; showLoginError('');
      try { const account = await api.login(email, password); $('#login-password').value = ''; await enter(account); }
      catch (error) { showLoginError(error.message); }
      finally { button.disabled = false; button.textContent = 'Sign in'; }
    });

    $('#sign-out').addEventListener('click', async () => {
      if (state.dirty && !confirm('You have unpublished changes. Sign out and discard them?')) return;
      await api.logout();
      Object.assign(state, { account: null, area: null, draft: null, dirty: false });
      $('#account').hidden = true;
      history.replaceState(null, '', location.pathname);
      show('view-login');
      $('#login-email').focus();
    });

    $('#publish').addEventListener('click', publish);
    $('#discard').addEventListener('click', () => { if (confirm('Discard all unpublished changes on this page?')) { loadDraft(); renderWorkspace(); } });
    $('#download-backup').addEventListener('click', downloadBackup);

    const passwordDialog = $('#password-dialog');
    $('#open-password').addEventListener('click', () => {
      $('#password-form').reset(); $('#password-error').hidden = true;
      passwordDialog.showModal(); $('#password-current').focus();
    });
    $('#password-cancel').addEventListener('click', () => passwordDialog.close());
    $('#password-form').addEventListener('submit', async event => {
      event.preventDefault();
      const current = $('#password-current').value, next = $('#password-new').value, again = $('#password-confirm').value;
      const error = $('#password-error');
      const fail = message => { error.textContent = message; error.hidden = false; };
      if (next.length < 12) return fail('Use at least 12 characters for the new password.');
      if (next !== again) return fail('The two new passwords do not match.');
      if (next === current) return fail('Choose a password that is different from the current one.');
      const button = $('#password-save');
      button.disabled = true;
      try { await api.changePassword(current, next); passwordDialog.close(); toast('Password changed. Use the new password next time you sign in.'); }
      catch (problem) { fail(problem.message); }
      finally { button.disabled = false; }
    });

    $('#reauth-form').addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const account = await api.login(state.account.email, $('#reauth-password').value);
        if (account.role !== state.account.role || account.teamId !== state.account.teamId) { location.reload(); return; }
        $('#reauth-dialog').close();
        if (reauthWaiter) { reauthWaiter.resolve(); reauthWaiter = null; }
      } catch (error) { $('#reauth-error').textContent = error.message; $('#reauth-error').hidden = false; }
    });
    $('#reauth-cancel').addEventListener('click', cancelReauth);
    $('#reauth-dialog').addEventListener('cancel', event => { event.preventDefault(); cancelReauth(); });

    window.addEventListener('beforeunload', event => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } });
  }

  async function init() {
    bind();
    if (!api || !window.LabContent) { $('#config-message').textContent = 'The editor files did not load completely. Make sure config.js, cloud-api.js, content.js and lab-config.js are uploaded next to admin.html.'; show('view-config'); return; }
    if (!api.configured()) { $('#config-message').textContent = api.configurationError(); show('view-config'); return; }
    try { const account = await api.restore(); if (account) { await enter(account); return; } }
    catch (error) { showLoginError(error.message); }
    show('view-login');
    $('#login-email').focus();
  }

  init();
})();
