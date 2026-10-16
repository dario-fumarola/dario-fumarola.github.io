(() => {
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = figure.querySelector('.memory-motion-toggle');
  const scene = figure.querySelector('.memory-usecase');
  const explanation = figure.querySelector('.memory-step-explanation');
  const steps = [...figure.querySelectorAll('[data-step]')];
  const panels = [...figure.querySelectorAll('.memory-route-panel')].map(panel => ({
    panel,
    reference:panel.querySelector('.memory-safe-reference'),
    proposal:panel.querySelector('.memory-current-proposal'),
    executed:panel.querySelector('.memory-executed-move'),
    reveal:panel.querySelector('.memory-move-reveal'),
    robot:panel.querySelector('.memory-robot'),
    blocked:panel.querySelector('.memory-blocked-mark'),
    state:panel.querySelector('.memory-state'),
    stateName:panel.querySelector('.memory-state-name'),
    status:panel.querySelector('.memory-route-status'),
    obstacleLabel:panel.querySelector('.memory-world-label')
  }));
  const cycleDuration = 14400;
  const original = [[28,100],[76,100],[96,100],[156,100],[202,100],[224,100],[276,100]];
  const clear = [[28,100],[76,100],[96,36],[156,36],[202,36],[224,100],[276,100]];
  const clamp = x => Math.max(0,Math.min(1,x));
  const ease = x => x*x*(3-2*x);
  const progress = (t,a,b) => ease(clamp((t-a)/(b-a)));
  const mix = (a,b,p) => a.map((v,i)=>v+(b[i]-v)*p);
  const pair = p => p.map(v=>v.toFixed(2)).join(' ');
  function curve(points) {
    return 'M'+pair(points[0])+points.slice(0,-1).map((p,i) => {
      const prev=points[Math.max(0,i-1)], next=points[i+1], after=points[Math.min(points.length-1,i+2)];
      const c1=p.map((v,j)=>v+(next[j]-prev[j])/6);
      const c2=next.map((v,j)=>v-(after[j]-p[j])/6);
      return 'C'+pair(c1)+' '+pair(c2)+' '+pair(next);
    }).join('');
  }
  let elapsed=0, startTime=0, frame=null, manuallyPaused=false, hasLooped=false, variant=0, lastDraw=-Infinity, lastPhase='';
  let safePoints, anchor, futurePoints, badFuture, routeLength;
  function prepare() {
    const reflect=p=>[p[0],variant?200-p[1]:p[1]];
    safePoints=clear.map(reflect);
    const d=curve(safePoints);
    panels.forEach(p => {
      [p.reference,p.executed,p.reveal].forEach(path=>path.setAttribute('d',d));
      p.obstacleLabel.setAttribute('y',variant?24:166);
    });
    routeLength=panels[0].reference.getTotalLength();
    const point=panels[0].reference.getPointAtLength(.25*routeLength);
    anchor=[point.x,point.y];
    futurePoints=[anchor,...[[105,35],[162,35],[199,35],[226,100],[276,100]].map(reflect)];
    badFuture=futurePoints.map((p,i)=>mix(anchor,[276,100],i/(futurePoints.length-1)));
    lastPhase='';
  }
  function render(time) {
    const phase=time<2000?'propose':time<4700?'correct':time<6200?'store':'next';
    const adjustment=progress(time,2000,3600);
    const movement=progress(time,3600,4600);
    const next=progress(time,6200,7400);
    scene.style.opacity=String(Math.min(hasLooped?clamp(time/200):1,clamp((cycleDuration-time)/300)));
    panels.forEach((p,index) => {
      const points=phase==='next' ? futurePoints.map((point,i)=>index===0?point:mix(point,badFuture[i],next)) : original.map((point,i)=>mix(point,safePoints[i],adjustment));
      p.proposal.setAttribute('d',curve(points));
      p.reveal.style.strokeDashoffset=String(1-.25*movement);
      const pos=p.reference.getPointAtLength(.25*movement*routeLength);
      p.robot.setAttribute('transform',`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`);
      const blockedY=phase==='next'?anchor[1]+(100-anchor[1])*(155-anchor[0])/(276-anchor[0]):100;
      p.blocked.setAttribute('transform',`translate(155 ${blockedY.toFixed(2)})`);
      p.blocked.style.opacity=String(phase==='next'?(index===0?0:next):1-adjustment);
    });
    if(phase===lastPhase) return;
    figure.dataset.phase=phase;
    const selected=phase==='store'?'correct':phase;
    steps.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.step===selected)));
    const copy={
      propose:["The model's hidden state produces a route that hits the obstacle.",'Original state','Original state','Route hits the obstacle','Route hits the obstacle'],
      correct:['The solver edits that state. Both branches take the same corrected first move.','Corrected state','Corrected state','Same corrected move','Same corrected move'],
      store:['After the same move, only the state saved for the next decision differs.','Corrected state saved','Original state restored','Keep the local work','Discard the state edit'],
      next:['At the next decision, the saved state produces a new route before another solve.','Corrected state','Original state','Useful next proposal','Needs another repair']
    }[phase];
    explanation.textContent=copy[0];
    panels.forEach((p,i)=>{
      p.stateName.textContent=copy[i+1];
      p.state.dataset.state=phase==='propose'||i===1&&(phase==='store'||phase==='next')?'original':'corrected';
      p.status.textContent=copy[i+3];
    });
    lastPhase=phase;
  }
  function pause() {
    if (frame!==null) cancelAnimationFrame(frame);
    frame=null;
  }
  function tick(timestamp) {
    elapsed=timestamp-startTime;
    if (elapsed>=cycleDuration) {
      const cycles=Math.floor(elapsed/cycleDuration);
      variant=(variant+cycles)%2;
      startTime+=cycles*cycleDuration;
      elapsed%=cycleDuration;
      hasLooped=true;
      prepare();
    }
    if (timestamp-lastDraw>=32) {
      render(elapsed);
      lastDraw=timestamp;
    }
    frame=requestAnimationFrame(tick);
  }
  function play() {
    if (frame!==null || document.hidden || manuallyPaused || reduceMotion.matches) return;
    const bounds=figure.getBoundingClientRect();
    const shownHeight=Math.max(0,Math.min(bounds.bottom,innerHeight)-Math.max(bounds.top,0));
    if (!bounds.height || shownHeight/bounds.height<.35) return;
    figure.dataset.playback='playing';
    startTime=performance.now()-elapsed;
    frame=requestAnimationFrame(tick);
  }
  function updateToggle() {
    toggle.hidden=reduceMotion.matches;
    toggle.setAttribute('aria-pressed',String(manuallyPaused));
    toggle.querySelector('span').textContent=manuallyPaused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('path').setAttribute('d',manuallyPaused ? 'M5 3 12 8 5 13Z' : 'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click',() => {
    manuallyPaused=!manuallyPaused;
    if (manuallyPaused) {pause();scene.style.opacity='1';figure.dataset.playback='paused';} else {pause();play();}
    updateToggle();
  });
  steps.forEach(button=>button.addEventListener('click',()=>{
    pause(); manuallyPaused=true;
    elapsed={propose:900,correct:4400,next:9200}[button.dataset.step];
    render(elapsed);scene.style.opacity='1';figure.dataset.playback='paused';updateToggle();
  }));
  const observer=new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && entries[0].intersectionRatio>=.35) play(); else pause();
  },{threshold:.35});
  observer.observe(figure);
  document.addEventListener('visibilitychange',() => {if(document.hidden) pause();else play();});
  reduceMotion.addEventListener('change',() => {
    pause();lastPhase='';
    if(reduceMotion.matches) {render(9500);figure.dataset.playback='static';}
    else {elapsed=0;hasLooped=false;render(0);figure.dataset.playback=manuallyPaused ? 'paused' : 'ready';play();}
    updateToggle();
  });
  prepare();
  figure.dataset.playback=reduceMotion.matches ? 'static' : 'ready';
  render(reduceMotion.matches ? 9500 : 0);
  updateToggle();
})();
