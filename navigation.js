(() => {
  'use strict';
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');if(!menu||!nav)return;
  function close(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
  menu.addEventListener('click',()=>{const opened=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',opened);menu.setAttribute('aria-expanded',String(opened));menu.setAttribute('aria-label',opened?'Close navigation':'Open navigation');});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){close();menu.focus();}});matchMedia('(min-width:1001px)').addEventListener('change',event=>{if(event.matches)close();});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)nav.querySelectorAll('a').forEach(a=>{const active=a.getAttribute('href')==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{rootMargin:'-15% 0px -55% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));}
})();
