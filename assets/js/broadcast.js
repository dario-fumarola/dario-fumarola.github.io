(() => {
  const figure=document.querySelector('.bg-demo');
  if(!figure) return;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene=figure.querySelector('.bg-demo-scene');
  const caption=figure.querySelector('.bg-demo-caption');
  const toggle=figure.querySelector('.bg-motion-toggle');
  const scenarios=[...figure.querySelectorAll('[data-delivery]')];
  const clock=figure.querySelector('.bg-step');
  const fill=figure.querySelector('.bg-time-fill');
  const panels=[...figure.querySelectorAll('.bg-junction-panel')].map(panel=>({panel,vehicle:panel.querySelector('.bg-vehicle'),packet:panel.querySelector('.bg-packet'),report:panel.querySelector('.bg-report-route'),status:panel.querySelector('.bg-junction-status'),switchAt:panel.querySelector('.bg-switch-at'),openAt:panel.querySelector('.bg-open-at')}));
  const cycleDuration=15400;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>x*x*(3-2*x);
  let elapsed=0,startTime=0,frame=null,manuallyPaused=false,hasLooped=false,delivery=1,lastDraw=-Infinity,lastRenderedStep=-1,lastCaption='';
  function prepare() {
    figure.dataset.scenario=delivery?'delivered':'missing';
    scenarios.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.delivery)===delivery)));
    panels.forEach((p,i)=>{const sw=i===0&&delivery?48:24;p.switchAt.textContent=sw;p.openAt.textContent=sw+2;});
    lastRenderedStep=-1;lastCaption='';
  }
  function environmentStep(time) {
    if(time<6400) return time/200;
    if(time<8800) return 32;
    if(time<13200) return 32+(time-8800)/200;
    return 54;
  }
  function render(time) {
    scene.style.opacity=String(Math.min(hasLooped?clamp(time/200):1,clamp((cycleDuration-time)/300)));
    const step=environmentStep(time);
    if(step===lastRenderedStep) return;
    lastRenderedStep=step;
    clock.textContent=Math.floor(step);
    fill.style.width=(100*step/54).toFixed(2)+'%';
    panels.forEach((p,i)=>{
      const sw=i===0&&delivery?48:24;
      const open=sw+2;
      p.panel.dataset.green=step<sw?'horizontal':step<open?'clearance':'vertical';
      const motion=ease(clamp((step-open)/4));
      p.vehicle.setAttribute('transform',`translate(144 ${(150-104*motion).toFixed(2)})`);
      const reportProgress=clamp((step%6-4.3)/1.7);
      const transmitting=delivery&&step<sw&&step%6>4.3;
      p.report.style.opacity=transmitting?'.7':'0';
      p.packet.style.opacity=transmitting?'1':'0';
      const u=1-reportProgress;
      const x=u*u*144+2*u*reportProgress*171+reportProgress*reportProgress*138;
      const y=u*u*150+2*u*reportProgress*114+reportProgress*reportProgress*103;
      p.packet.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      const text=step>=open?`Green returns at step ${open}`:step>=sw?'Two-step clearance':i===1?step<6?'Deadline active from phase start':delivery?'Report cannot postpone deadline':'Deadline active without reports':!delivery?'No reports; fallback at step 24':step<6?'Waiting on the unserved axis':step<24?'Report received; evidence too weak':'Fallback bypassed; still waiting';
      if(p.status.textContent!==text) p.status.textContent=text;
    });
    const text=delivery?(step<6?'A waiting agent reports every six steps. The green axis has no traffic.':step<24?'A delivered report keeps the cache nonempty, but one sender cannot satisfy the evidence test.':step<26?'The deadline forces a switch at step 24. Original BG bypasses its fallback.':step<48?'Green returns at step 26 with the deadline. Original BG still holds the empty axis.':step<50?'Original BG switches at step 48. Two clearance steps follow.':'Under reliable delivery, the protected deadline restores green 24 steps sooner.'):(step<24?'Without reports, the original fallback and the protected deadline both point to step 24.':step<26?'Both switch at step 24 and begin two steps of clearance.':'Both return green at step 26. The original fallback survives because no reports arrived.');
    if(text!==lastCaption){caption.textContent=text;lastCaption=text;}
  }
  function pause(){if(frame!==null)cancelAnimationFrame(frame);frame=null;}
  function tick(timestamp){
    elapsed=timestamp-startTime;
    if(elapsed>=cycleDuration){const cycles=Math.floor(elapsed/cycleDuration);delivery=(delivery+cycles)%2;startTime+=cycles*cycleDuration;elapsed%=cycleDuration;hasLooped=true;prepare();}
    if(timestamp-lastDraw>=32){render(elapsed);lastDraw=timestamp;}
    frame=requestAnimationFrame(tick);
  }
  function play(){
    if(frame!==null||document.hidden||manuallyPaused||reduceMotion.matches)return;
    const bounds=figure.getBoundingClientRect();const visible=Math.max(0,Math.min(bounds.bottom,innerHeight)-Math.max(bounds.top,0));
    if(!bounds.height||visible/bounds.height<.35)return;
    figure.dataset.playback='playing';startTime=performance.now()-elapsed;frame=requestAnimationFrame(tick);
  }
  function updateToggle(){
    toggle.hidden=reduceMotion.matches;
    toggle.setAttribute('aria-pressed',String(manuallyPaused));
    toggle.querySelector('span').textContent=manuallyPaused?'Resume motion':'Pause motion';
    toggle.querySelector('path').setAttribute('d',manuallyPaused?'M5 3 12 8 5 13Z':'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;if(manuallyPaused){pause();figure.dataset.playback='paused';scene.style.opacity='1';}else{pause();play();}updateToggle();});
  scenarios.forEach(b=>b.addEventListener('click',()=>{pause();delivery=Number(b.dataset.delivery);elapsed=6400;manuallyPaused=true;prepare();render(elapsed);scene.style.opacity='1';figure.dataset.playback=reduceMotion.matches?'static':'paused';updateToggle();}));
  new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&entries[0].intersectionRatio>=.35)play();else pause();},{threshold:.35}).observe(figure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
  reduceMotion.addEventListener('change',()=>{pause();lastRenderedStep=-1;if(reduceMotion.matches){render(6400);figure.dataset.playback='static';}else{elapsed=0;hasLooped=false;render(0);figure.dataset.playback=manuallyPaused?'paused':'ready';play();}updateToggle();});
  prepare();render(reduceMotion.matches?6400:0);figure.dataset.playback=reduceMotion.matches?'static':'ready';updateToggle();
})();
