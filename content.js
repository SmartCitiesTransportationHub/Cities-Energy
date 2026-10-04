(() => {
  'use strict';
  function text(value, label, required = false, limit = 4000) {
    if (value === undefined && !required) return '';
    if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new Error(`${label} is missing or exceeds the length limit.`);
    return value.trim();
  }
  function link(value, label) {
    const s = text(value, label, false, 2048); if (!s) return '';
    try { const url = new URL(s); if (!['https:', 'http:'].includes(url.protocol) || url.href.length > 2048) throw new Error(); return url.href; }
    catch { throw new Error(`${label}: enter a full https:// or http:// URL.`); }
  }
  function photo(value, limit = 4500000) {
    const s = text(value, 'Image', false, limit); if (!s) return '';
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(s)) return s;
    if (/^assets\/[\w\-./]+\.(png|jpe?g|webp)$/i.test(s) && !s.includes('..')) return s;
    return link(s, 'Photo URL');
  }
  const defaults = { name:'NEXUS CITY TEAM', subtitle:'Future Cities Team', description:'Exploring digital twins, clean energy and intelligent mobility.', headline:'Sense the city.\nShape tomorrow.', introduction:'Where data, places and human imagination meet.\nExploring smarter, greener, more liveable urban futures.', aboutTitle:'The next chapter of cities.\nBuilt around people.', about:'We explore the relationship between cities, technology and people. Our work connects digital twins, low-carbon systems and urban intelligence, making future possibilities tangible and open to discussion.\n\nWhat kind of city do we want to create together?' };
  function validate(input) {
    if (!input || input.version !== 1 || !Array.isArray(input.members) || !Array.isArray(input.publications ?? [])) throw new Error('Invalid file format. Choose a content file exported by this editor.');
    if (input.members.length > 300 || (input.publications ?? []).length > 2000) throw new Error('Up to 300 members and 2,000 publications are supported.');
    const members = input.members.map(m => {
      if (!m || typeof m !== 'object') throw new Error('Invalid member record.');
      const orcid=text(m.orcid,'ORCID',false,80).replace(/^https?:\/\/orcid\.org\//i,'');
      if(orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) throw new Error('ORCID must use the format 0000-0000-0000-0000.');
      return { name: text(m.name,'Name',true,120), role:text(m.role,'Role',true,200), research:text(m.research,'Research interests',false,600), bio:text(m.bio,'Biography',false,2000), photo:photo(m.photo), url:link(m.url,'Personal website'), orcid };
    });
    const credits=input.contributors ?? [];
    if(!Array.isArray(credits)||credits.length>300)throw new Error('Up to 300 website contributors are supported.');
    const contributors=credits.map(c=>{if(!c||typeof c!=='object')throw new Error('Invalid contributor record.');return {name:text(c.name,'Contributor name',true,120),contribution:text(c.contribution,'Website contribution',true,600)};});
    const publications = (input.publications ?? []).map(p => {
      if (!p || typeof p !== 'object' || !Number.isInteger(p.year) || p.year < 1900 || p.year > 2100) throw new Error('Publication year must be an integer from 1900 to 2100.');
      const doi = text(p.doi,'DOI',false,300).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
      if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi)) throw new Error('Enter a DOI such as 10.1234/example, or paste its full URL.');
      const images=p.images ?? [];if(!Array.isArray(images)||images.length>6)throw new Error('Each publication supports up to six images.');
      const gallery=images.map(image=>{if(!image||typeof image!=='object')throw new Error('Invalid publication image.');const src=photo(image.src);if(!src)throw new Error('A publication image must have a source.');return {src,alt:text(image.alt,'Image description',false,600),caption:text(image.caption,'Image caption',false,1200)};});
      return { title:text(p.title,'Paper title',true,600), authors:text(p.authors,'Authors',true,1500), venue:text(p.venue,'Journal or conference',true,400), year:p.year, doi, url:link(p.url,'Publication URL'), pdf:link(p.pdf,'Full text URL'), abstract:text(p.abstract,'Abstract',false,6000),body:text(p.body,'Research content',false,16000),images:gallery };
    });
    const appearance={heroImage:photo(input.appearance?.heroImage,4500000),heroAlt:text(input.appearance?.heroAlt ?? 'Homepage background','Image description',false,600),heroCaption:text(input.appearance?.heroCaption ?? '','Image caption',false,160)};
    const site={}; for(const [key,fallback] of Object.entries(defaults)) site[key]=text(input.site?.[key] ?? fallback,key,true,key==='about'?6000:key==='name'?80:key==='subtitle'?100:1000);
    const research=(input.research ?? []).map(r=>({title:text(r.title,'Research title',true,200),tag:text(r.tag,'Research label',false,80),summary:text(r.summary,'Research summary',true,1500),detail:text(r.detail,'Research detail',false,4000),keywords:text(r.keywords,'Keywords',false,300)}));
    if(research.length>30)throw new Error('A team may have up to 30 research topics.');
    const observatory={title:text(input.observatory?.title ?? 'Explore urban systems.','Observatory heading',true,200),description:text(input.observatory?.description ?? 'Adjust a parameter and compare illustrative daily scenarios.','Observatory introduction',true,1500)};
    return { version:1, site, appearance, members, contributors, publications, research, observatory };
  }
  function seedLaboratory(definition) {
    return {id:definition.id,...validate({version:1,site:{name:definition.name,subtitle:'Future Urban Energy / '+definition.code,description:definition.introduction,headline:definition.headline,introduction:definition.introduction,aboutTitle:'About '+definition.name,about:definition.about},appearance:{heroImage:'',heroAlt:'A conceptual waterfront city at night.',heroCaption:'AI-generated city concept'},members:[],publications:[],research:definition.research,observatory:definition.observatory})};
  }
  function validateBundle(input, existing) {
    const definitions=window.LAB_DEFINITIONS;
    function cleanLab(lab){const {publications,...unit}=validate(lab);return {id:lab.id,...unit};}
    if(input?.version===1) return {version:3,network:validate(input),labs:existing ? existing.labs.map(cleanLab) : definitions.map(def=>cleanLab(seedLaboratory(def)))};
    if(![2,3].includes(input?.version) || !Array.isArray(input.labs))throw new Error('Choose a valid team content file.');
    const ids=new Set(input.labs.map(lab=>lab?.id));
    const required=input.version===2?definitions.filter(def=>def.id!=='clean-energy'):definitions;
    if(ids.size!==input.labs.length || required.some(def=>!ids.has(def.id)) || [...ids].some(id=>!definitions.some(def=>def.id===id)))throw new Error('Each team must have a unique recognised ID; required teams cannot be omitted.');
    const network=validate(input.network),papers=[...network.publications];
    // Import older per-laboratory lists into the shared library without losing unique records.
    input.labs.forEach(lab=>papers.push(...validate(lab).publications));
    const unique=new Map();papers.forEach(p=>{const key=(p.doi?'doi:'+p.doi:p.url?'url:'+p.url:'title:'+p.title+'|'+p.year).toLowerCase();if(!unique.has(key))unique.set(key,p);else{const saved=unique.get(key);for(const field of ['abstract','body','pdf','url','doi'])if(!saved[field]&&p[field])saved[field]=p[field];if(!saved.images.length&&p.images.length)saved.images=p.images;}});
    network.publications=[...unique.values()];
    if(network.publications.length>2000)throw new Error('The shared library exceeds 2,000 publications.');
    return {version:3,network,labs:definitions.map(def=>cleanLab(input.labs.find(lab=>lab.id===def.id)||seedLaboratory(def)))};
  }
  function element(tag, className, content) { const node=document.createElement(tag); if(className) node.className=className; if(content) node.textContent=content; return node; }
  function anchor(url, label) { const a=element('a','content-link',label+' ↗'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; return a; }
  function render(data, team, papers) {
    team.replaceChildren(); papers.replaceChildren();
    if (!data.members.length) team.append(element('p','content-empty','Team profiles will be available soon.'));
    data.members.forEach(member => {
      const card=element('article','member-card');
      const avatar=element('div','member-avatar',Array.from(member.name)[0]); avatar.setAttribute('aria-hidden','true');
      if (member.photo) { const img=element('img'); img.src=member.photo; img.alt=member.name+': portrait'; avatar.removeAttribute('aria-hidden'); img.loading='lazy'; img.addEventListener('error',()=>{img.remove();avatar.setAttribute('aria-label',member.name+': photo unavailable');}); avatar.append(img); }
      const role=element('p','member-role',member.role); card.append(avatar,role,element('h3','',member.name));
      if(member.research) card.append(element('p','member-research',member.research));
      if(member.bio) card.append(element('p','member-bio',member.bio));
      if(member.url) card.append(anchor(member.url,'Personal website'));
      if(member.orcid) card.append(anchor('https://orcid.org/'+member.orcid,'ORCID '+member.orcid)); team.append(card);
    });
    if(!(data.publications ?? []).length) papers.append(element('p','content-empty','Publications will be available soon.'));
    [...(data.publications ?? [])].sort((a,b)=>b.year-a.year).forEach(paper => {
      const article=element('article','publication'); const year=element('div','publication-year',String(paper.year)); const body=element('div','publication-body');
      body.append(element('h3','',paper.title),element('p','publication-authors',paper.authors),element('p','publication-venue',paper.venue));
      const links=element('div','publication-links');
      if(paper.doi) links.append(anchor('https://doi.org/'+paper.doi,'DOI'));
      if(paper.url) links.append(anchor(paper.url,'Publication page'));
      if(paper.pdf) links.append(anchor(paper.pdf,'Full text'));
      body.append(links);
      if(paper.abstract) { const details=element('details','publication-abstract'); details.append(element('summary','','Read abstract'),element('p','',paper.abstract)); body.append(details); }
      if(paper.body){const details=element('details','publication-content');details.append(element('summary','','Read research details'),element('div','paper-prose',paper.body));body.append(details);}
      if(paper.images?.length){const gallery=element('div','publication-gallery');paper.images.forEach((image,index)=>{const figure=element('figure','paper-figure'),img=element('img');img.src=image.src;img.alt=image.alt||`Figure ${index+1} for ${paper.title}`;img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;figure.prepend(element('p','image-unavailable','Image unavailable.'));});figure.append(img);if(image.caption)figure.append(element('figcaption','',image.caption));gallery.append(figure);});body.append(gallery);}
      article.append(year,body); papers.append(article);
    });
  }
  function renderContributors(contributors,target) {
    target.replaceChildren();
    if(!contributors.length)target.append(element('p','content-empty','Website contributor credits will be added soon.'));
    contributors.forEach(credit=>{const card=element('article','contributor-card');card.append(element('h3','',credit.name),element('p','',credit.contribution));target.append(card);});
  }
  function renderResearch(topics,target) {
    target.replaceChildren();
    if(!topics.length){target.append(element('p','content-empty','Research topics will be available soon.'));return;}
    topics.forEach((topic,index)=>{const card=element('article','research-card');const top=element('div','card-top');top.append(element('span','research-number',String(index+1).padStart(2,'0')),element('span','research-tag',topic.tag));card.append(top,element('h3','',topic.title),element('p','',topic.summary));
      if(topic.keywords){const tags=element('div','keywords');topic.keywords.split(',').filter(s=>s.trim()).forEach(tag=>tags.append(element('span','',tag.trim())));card.append(tags);}
      if(topic.detail){const details=element('details');const summary=element('summary','','Explore the questions');summary.append(element('span','','＋'));details.append(summary,element('div','research-detail',topic.detail));card.append(details);}target.append(card);
    });
  }
  function applySite(data) {
    document.querySelectorAll('[data-site]').forEach(node=>{const key=node.dataset.site;if(Object.hasOwn(data.site,key)) node.textContent=data.site[key];});
    const hero=document.querySelector('.hero-image'); if(hero) {hero.src=data.appearance.heroImage || 'assets/city-hero.webp';hero.alt=data.appearance.heroAlt;hero.addEventListener('error',()=>{if(hero.getAttribute('src')!=='assets/city-hero.webp') {hero.src='assets/city-hero.webp';hero.alt='Default AI-generated city concept';const caption=document.querySelector('#hero-caption');if(caption)caption.textContent='AI-generated city concept';}});}
    const caption=document.querySelector('#hero-caption');if(caption)caption.textContent=data.appearance.heroCaption;
    document.title=(document.body.dataset.page==='publications'?'Publications · ':'')+data.site.name+' · '+data.site.subtitle;
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=data.site.description;
    document.querySelectorAll('.brand-mark').forEach(node=>{node.textContent=Array.from(data.site.name)[0].toUpperCase();});
    document.querySelectorAll('.brand').forEach(node=>node.setAttribute('aria-label',data.site.name+' home'));
  }
  function renderDirectory(bundle) {
    const target=document.querySelector('#laboratory-grid');if(!target)return;
    target.replaceChildren();bundle.labs.forEach((lab,index)=>{const def=window.LAB_DEFINITIONS[index];const card=element('a','laboratory-card');card.href='lab.html?lab='+def.id;card.style.setProperty('--lab-color',def.color);const top=element('div','lab-card-top');top.append(element('span','lab-number','0'+(index+1)),element('span','lab-code',def.code));card.append(top,element('h3','',lab.site.name),element('p','',lab.site.introduction),element('span','lab-card-modules','Home · Observatory · Research\nPeople · Publications · About'),element('span','lab-card-action','Enter team ↗'));target.append(card);});
  }
  window.LabContent = { validate, validateBundle, render, renderContributors, renderResearch, defaults };
  const team=document.querySelector('#team-list'), papers=document.querySelector('#publication-list');
  function start() {
  try {
  if(team || papers) {
    try {
      const bundle=validateBundle(window.LAB_CONTENT);let data=bundle.network;
      if(document.body.dataset.page==='laboratory'){
        const id=new URLSearchParams(location.search).get('lab');const index=bundle.labs.findIndex(lab=>lab.id===id);
        if(index<0){window.LAB_PAGE_FAILED=true;document.querySelector('main').replaceChildren(element('h1','','Team not found'),element('p','','Choose one of the six teams from the directory.'),anchor('index.html#laboratories','All teams'));return;}
        data=bundle.labs[index];const def=window.LAB_DEFINITIONS[index];window.ACTIVE_LAB={id,index,scenarios:def.scenarios,name:data.site.name};document.documentElement.style.setProperty('--accent',def.color);
        const select=document.querySelector('#lab-switch');bundle.labs.forEach(lab=>{const option=element('option','',lab.site.name);option.value=lab.id;select.append(option);});select.value=id;select.addEventListener('change',()=>{location.href='lab.html?lab='+select.value;});
        document.querySelector('#lab-number').textContent='TEAM 0'+(index+1)+' / 06';document.querySelector('#observatory-title').textContent=data.observatory.title;document.querySelector('#observatory-intro').textContent=data.observatory.description;
        document.querySelector('#research-intro').textContent='Research themes in '+data.site.name+'.';renderResearch(data.research,document.querySelector('#research-topics'));
      }
      const isNetwork=document.body.dataset.page==='network';
      render(data,isNetwork?element('div'):(team||element('div')),papers||element('div'));
      if(isNetwork&&team)renderContributors(data.contributors,team);
      applySite(data);renderDirectory(bundle);
    }catch(error){window.LAB_PAGE_FAILED=true;if(team)team.replaceChildren(element('p','content-empty',document.body.dataset.page==='network'?'Website credits are temporarily unavailable. Check the content file.':'Team information is temporarily unavailable. Check the content file.'));if(papers)papers.replaceChildren(element('p','content-empty','Publications are temporarily unavailable. Check the content file.'));const directory=document.querySelector('#laboratory-grid');if(directory)directory.replaceChildren(element('p','content-empty','Team content could not be loaded. Please check the content file.'));}
  }
  } finally { document.documentElement.classList.remove('content-pending'); }
  }
  // When online publishing is active (online-loader.js), render the published content once it has loaded.
  const ready=window.TEAM_CONTENT_READY;
  if(ready && typeof ready.then==='function') ready.then(start,start); else start();
})();
