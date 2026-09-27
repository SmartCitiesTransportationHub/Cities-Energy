(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const svgNS = 'http://www.w3.org/2000/svg';
  const profiles = {
    energy: { title:'Urban energy transition', description:'How could a cleaner energy mix change the carbon intensity of everyday energy use?', label:'Clean energy share', note:'Move the slider to compare energy mixes.', chart:'Daily energy profile', series:'Carbon intensity', unit:'gCO₂/kWh', initial:64, max:800, base:[.62,.58,.55,.54,.58,.68,.83,.97,1,.95,.89,.87,.85,.83,.82,.86,.95,1,.97,.90,.82,.76,.70,.65] },
    mobility: { title:'Rethinking urban mobility', description:'How could a greater public transport share change road loads throughout the day?', label:'Public transport share', note:'Move the slider to explore different travel patterns.', chart:'Daily road load', series:'Road load index', unit:'index', initial:48, max:100, base:[.25,.21,.18,.17,.23,.48,.83,1,.88,.69,.60,.63,.67,.64,.63,.73,.96,1,.85,.65,.50,.42,.34,.28] },
    environment: { title:'A greener urban environment', description:'Explore illustrative summer conditions as green space becomes part of the urban fabric.', label:'Green space coverage', note:'Explore green coverage and apparent temperature.', chart:'Daily summer heat profile', series:'Apparent temperature', unit:'°C', initial:35, max:45, base:[.63,.61,.60,.59,.59,.60,.65,.70,.77,.84,.91,.96,1,1,.98,.94,.88,.82,.77,.73,.69,.67,.65,.64] }
  };
  let active = 'energy';
  let current = null;
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const menu = $('.menu-toggle');
  function closeMenu() { $('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Open navigation'); }
  menu.addEventListener('click', () => { const opened = menu.getAttribute('aria-expanded') !== 'true'; $('#navigation').classList.toggle('open',opened); menu.setAttribute('aria-expanded',String(opened)); menu.setAttribute('aria-label',opened ? 'Close navigation' : 'Open navigation'); });
  document.querySelectorAll('nav a').forEach(a => a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e => { if(e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  const media = window.matchMedia('(min-width:761px)');
  media.addEventListener('change', e => { if(e.matches) closeMenu(); });
  function svgElement(tag, attributes, content) { const el = document.createElementNS(svgNS, tag); Object.entries(attributes).forEach(([key,value]) => el.setAttribute(key,String(value))); if(content !== undefined) el.textContent = content; return el; }
  function calculate(key, year, share) {
    const p = profiles[key], factor = 1 - (year - 2030) * .004;
    let metrics, values, formula;
    if(key === 'energy') {
      const intensity = (720 * (1 - share / 100) + 40 * share / 100) * factor;
      values = p.base.map(v => intensity * v);
      metrics = [['Mean carbon intensity', (values.reduce((a,b)=>a+b,0)/24).toFixed(0), 'g/kWh', 'Illustrative 24-hour mean'],['Reduction vs baseline', ((1 - intensity / 720) * 100).toFixed(1), '%', 'Vs 2030 all-fossil baseline'],['Clean energy share',share,'%', 'Current scenario setting']];
      formula = 'Hourly intensity = [720 × (1 − clean energy fraction) + 40 × clean energy fraction] × year factor × hourly load factor. Year factor = 1 − (year − 2030) × 0.004. The daily mean averages 24 values; the reduction compares with the same daily profile using a 2030 all-fossil baseline. 720 and 40 are illustrative constants.';
    } else if(key === 'mobility') {
      const peak = (95 - share * .58) * factor;
      values = p.base.map(v => peak * v);
      metrics = [['Mean commute',(18 + peak * .36).toFixed(1),'min','Illustrative: 18 + peak × 0.36'],['Peak road load',peak.toFixed(1),'/100','Lower index, lighter load'],['Public transport share',share,'%','Current scenario setting']];
      formula = 'Peak road load = (95 − public transport percentage × 0.58) × year factor. Hourly load = peak × hourly travel factor. Mean commute = 18 + peak × 0.36. Year factor = 1 − (year − 2030) × 0.004. All coefficients are illustrative.';
    } else {
      const cooling = share * .065 + (year - 2030) * .025;
      values = p.base.map(v => 22 + v * 16 - cooling);
      metrics = [['Peak apparent temperature',Math.max(...values).toFixed(1),'°C','Illustrative summer day'],['Peak cooling effect',cooling.toFixed(1),'°C','Vs 2030 zero-green baseline'],['Green space coverage',share,'%','Current scenario setting']];
      formula = 'Hourly apparent temperature = 22 + hourly temperature factor × 16 − cooling. Cooling = green coverage percentage × 0.065 + (year − 2030) × 0.025. The baseline is the 2030 scenario with 0% green coverage. This linear illustration excludes humidity, wind and vegetation differences and is not a climate forecast.';
    }
    return { key, year, share, values, metrics, formula };
  }
  function drawChart(p, values) {
    const left = 47, right = 699, top = 22, bottom = 184;
    const points = values.map((v,i) => [left + i / 23 * (right-left), bottom - v / p.max * (bottom-top)]);
    const path = points.map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    $('#chart-line').setAttribute('d',path);
    $('#chart-area').setAttribute('d',`${path} L${right},${bottom} L${left},${bottom} Z`);
    const grid = $('#chart-grid'), labels = $('#chart-labels'); grid.replaceChildren(); labels.replaceChildren();
    for(let i=0; i<4; i++) { const y=bottom-i/3*(bottom-top); grid.append(svgElement('line',{x1:left,x2:right,y1:y,y2:y,stroke:'#263640','stroke-dasharray':'3 5'})); labels.append(svgElement('text',{x:left-10,y:y+4,'text-anchor':'end'},Math.round(p.max*i/3))); }
    [0,6,12,18,23].forEach(hour => labels.append(svgElement('text',{x:left+hour/23*(right-left),y:208,'text-anchor':'middle'},String(hour).padStart(2,'0')+':00')));
    labels.append(svgElement('text',{x:left,y:11},p.unit));
    $('#chart-svg-title').textContent = `Simulated ${p.chart}`;
    $('#chart-svg-description').textContent = `${current.year}, ${p.label} ${current.share}%。${current.metrics.map(m=>m[0]+m[1]+m[2]).join('；')}。All values are simulated. Hourly data can be exported.`;
  }
  function render() {
    const p=profiles[active], share=Number($('#intensity').value), year=Number($('#horizon').value);
    current=calculate(active,year,share);
    $('#intensity-value').textContent=share+'%'; $('#intensity').setAttribute('aria-valuetext',share+'%');
    $('#result-metrics').replaceChildren(...current.metrics.map(([label,value,unit,note]) => { const element=document.createElement('div'); element.className='result-metric'; const name=document.createElement('span'); name.textContent=label; const strong=document.createElement('strong'); strong.textContent=value; const small=document.createElement('small'); small.textContent=unit; strong.append(small); const hint=document.createElement('span'); hint.className='metric-note'; hint.textContent=note; element.append(name,strong,hint); return element; }));
    $('#result-context').textContent=`${year} scenario · Illustrative model`; $('#model-formula').textContent=current.formula; drawChart(p,current.values);
    return current;
  }
  function setScenario(key) {
    if(!Object.hasOwn(profiles,key)) throw new Error('Unknown city scenario');
    active=key; const p=profiles[key];
    tabs.forEach(tab => { const selected=tab.dataset.scenario===key; tab.setAttribute('aria-selected',String(selected)); tab.tabIndex=selected?0:-1; });
    $('#scenario-panel').setAttribute('aria-labelledby','tab-'+key);
    $('#scenario-title').textContent=p.title; $('#scenario-description').textContent=p.description; $('#intensity-label').textContent=p.label; $('#control-note').textContent=p.note; $('#chart-title').textContent=p.chart; $('#series-name').textContent=p.series; $('#intensity').value=p.initial;
    return render();
  }
  tabs.forEach((tab,index) => { tab.addEventListener('click',()=>setScenario(tab.dataset.scenario)); tab.addEventListener('keydown',e=> { let target; if(e.key==='ArrowRight') target=(index+1)%tabs.length; if(e.key==='ArrowLeft') target=(index+tabs.length-1)%tabs.length; if(e.key==='Home') target=0; if(e.key==='End') target=tabs.length-1; if(target!==undefined) { e.preventDefault(); tabs[target].focus(); setScenario(tabs[target].dataset.scenario); } }); });
  $('#intensity').addEventListener('input',render); $('#horizon').addEventListener('change',render);
  $('#reset-scenario').addEventListener('click',()=> { $('#horizon').value='2035'; setScenario(active); });
  $('#download-data').addEventListener('click',()=> {
    const p=profiles[active];
    const rows=[['Data type','Scenario','Year',p.label+'(%)','Hour',p.series+'('+p.unit+')'],...current.values.map((value,hour)=>['Simulated data',p.title,current.year,current.share,String(hour).padStart(2,'0')+':00',value.toFixed(2)])];
    const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); const link=document.createElement('a'); link.href=url; link.download=`nexus-${active}-${current.year}-simulation.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  if('IntersectionObserver' in window) { const observer=new IntersectionObserver(entries=> { entries.forEach(entry=> { if(entry.isIntersecting) document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id)); }); },{rootMargin:'-15% 0px -55% 0px',threshold:0}); document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section)); }
  render();
  // Progressive enhancement: regular browsers use the visible controls above.
  const context=document.modelContext;
  if(context?.registerTool) {
    const lifecycle=new AbortController();
    try { Promise.resolve(context.registerTool({name:'configure_city_simulation',title:'Configure city simulation',description:'Configure the illustrative city scenario, year and share. Updates the visible chart and returns simulated metrics, not real forecasts.',inputSchema:{type:'object',properties:{scenario:{type:'string',enum:['energy','mobility','environment']},year:{type:'integer',enum:[2030,2035,2040]},share:{type:'integer',minimum:0,maximum:100}},required:['scenario','year','share'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input) { if(!input || !Object.hasOwn(profiles,input.scenario) || ![2030,2035,2040].includes(input.year) || !Number.isInteger(input.share) || input.share<0 || input.share>100) throw new Error('Invalid scenario, year or share'); setScenario(input.scenario); $('#horizon').value=String(input.year); $('#intensity').value=String(input.share); const result=render(); return {dataType:'simulation',scenario:active,year:result.year,share:result.share,metrics:result.metrics.map(([label,value,unit])=>({label,value,unit}))}; }},{signal:lifecycle.signal})).catch(()=>{}); } catch { /* Optional API; the standard interface remains available. */ }
    window.addEventListener('pagehide',event=>{if(!event.persisted) lifecycle.abort();},{once:true});
  }
})();
