(() => {
  'use strict';
  function text(value, label, required = false, limit = 4000) {
    if (value === undefined && !required) return '';
    if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new Error(`${label} is missing or exceeds the length limit.`);
    return value.trim();
  }
  function link(value, label) {
    const s = text(value, label, false, 2048); if (!s) return '';
    try { const url = new URL(s); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); return url.href; }
    catch { throw new Error(`${label}: enter a full https:// or http:// URL.`); }
  }
  function photo(value, limit = 4500000) {
    const s = text(value, 'Image', false, limit); if (!s) return '';
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(s)) return s;
    if (/^assets\/[\w\-./]+\.(png|jpe?g|webp)$/i.test(s) && !s.includes('..')) return s;
    return link(s, 'Photo URL');
  }
  const defaults = { name:'NEXUS CITY LAB', subtitle:'Future Cities Laboratory', description:'Exploring digital twins, clean energy and intelligent mobility.', headline:'Sense the city.\nShape tomorrow.', introduction:'Where data, places and human imagination meet.\nExploring smarter, greener, more liveable urban futures.', aboutTitle:'The next chapter of cities.\nBuilt around people.', about:'We explore the relationship between cities, technology and people. Our work connects digital twins, low-carbon systems and urban intelligence, making future possibilities tangible and open to discussion.\n\nWhat kind of city do we want to create together?' };
  function validate(input) {
    if (!input || input.version !== 1 || !Array.isArray(input.members) || !Array.isArray(input.publications)) throw new Error('Invalid file format. Choose a content file exported by this editor.');
    if (input.members.length > 300 || input.publications.length > 2000) throw new Error('Up to 300 members and 2,000 publications are supported.');
    const members = input.members.map(m => {
      if (!m || typeof m !== 'object') throw new Error('Invalid member record.');
      const orcid=text(m.orcid,'ORCID',false,80).replace(/^https?:\/\/orcid\.org\//i,'');
      if(orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) throw new Error('ORCID must use the format 0000-0000-0000-0000.');
      return { name: text(m.name,'Name',true,120), role:text(m.role,'Role',true,200), research:text(m.research,'Research interests',false,600), bio:text(m.bio,'Biography',false,2000), photo:photo(m.photo), url:link(m.url,'Personal website'), orcid };
    });
    const publications = input.publications.map(p => {
      if (!p || typeof p !== 'object' || !Number.isInteger(p.year) || p.year < 1900 || p.year > 2100) throw new Error('Publication year must be an integer from 1900 to 2100.');
      const doi = text(p.doi,'DOI',false,300).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
      if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi)) throw new Error('Enter a DOI such as 10.1234/example, or paste its full URL.');
      return { title:text(p.title,'Paper title',true,600), authors:text(p.authors,'Authors',true,1500), venue:text(p.venue,'Journal or conference',true,400), year:p.year, doi, url:link(p.url,'Publication URL'), pdf:link(p.pdf,'Full text URL'), abstract:text(p.abstract,'Abstract',false,6000) };
    });
    const appearance={heroImage:photo(input.appearance?.heroImage,4500000),heroAlt:text(input.appearance?.heroAlt ?? 'Homepage background','Image description',false,600),heroCaption:text(input.appearance?.heroCaption ?? '','Image caption',false,160)};
    const site={}; for(const [key,fallback] of Object.entries(defaults)) site[key]=text(input.site?.[key] ?? fallback,key,true,key==='about'?6000:key==='name'?80:key==='subtitle'?100:1000);
    return { version:1, site, appearance, members, publications };
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
    if(!data.publications.length) papers.append(element('p','content-empty','Publications will be available soon.'));
    [...data.publications].sort((a,b)=>b.year-a.year).forEach(paper => {
      const article=element('article','publication'); const year=element('div','publication-year',String(paper.year)); const body=element('div','publication-body');
      body.append(element('h3','',paper.title),element('p','publication-authors',paper.authors),element('p','publication-venue',paper.venue));
      const links=element('div','publication-links');
      if(paper.doi) links.append(anchor('https://doi.org/'+paper.doi,'DOI'));
      if(paper.url) links.append(anchor(paper.url,'Publication page'));
      if(paper.pdf) links.append(anchor(paper.pdf,'Full text'));
      body.append(links);
      if(paper.abstract) { const details=element('details','publication-abstract'); details.append(element('summary','','Read abstract'),element('p','',paper.abstract)); body.append(details); }
      article.append(year,body); papers.append(article);
    });
  }
  function applySite(data) {
    document.querySelectorAll('[data-site]').forEach(node=>{const key=node.dataset.site;if(Object.hasOwn(data.site,key)) node.textContent=data.site[key];});
    const hero=document.querySelector('.hero-image'); if(hero) {hero.src=data.appearance.heroImage || 'assets/city-hero.webp';hero.alt=data.appearance.heroAlt;hero.addEventListener('error',()=>{if(hero.getAttribute('src')!=='assets/city-hero.webp') {hero.src='assets/city-hero.webp';hero.alt='Default AI-generated city concept';const caption=document.querySelector('#hero-caption');if(caption)caption.textContent='AI-generated city concept';}});}
    const caption=document.querySelector('#hero-caption');if(caption)caption.textContent=data.appearance.heroCaption;
    document.title=data.site.name+' · '+data.site.subtitle;
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=data.site.description;
    document.querySelectorAll('.brand-mark').forEach(node=>{node.textContent=Array.from(data.site.name)[0].toUpperCase();});
    document.querySelectorAll('.brand').forEach(node=>node.setAttribute('aria-label',data.site.name+' home'));
  }
  window.LabContent = { validate, render, defaults };
  const team=document.querySelector('#team-list'), papers=document.querySelector('#publication-list');
  if(team && papers) { try { const data=validate(window.LAB_CONTENT);render(data,team,papers);applySite(data); } catch { team.replaceChildren(element('p','content-empty','Team information is temporarily unavailable. Please try again later.')); papers.replaceChildren(element('p','content-empty','Publications are temporarily unavailable. Please try again later.')); } }
})();
