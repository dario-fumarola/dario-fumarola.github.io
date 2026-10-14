(() => {
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = figure.querySelector('.memory-motion-toggle');
  const scene = figure.querySelector('.memory-usecase');
  const caption = figure.querySelector('.memory-demo-caption');
  const keptStatus = figure.querySelector('.memory-kept-status');
  const discardedStatus = figure.querySelector('.memory-discarded-status');
  const commonPath = figure.querySelector('.memory-executed-route');
  const futurePath = figure.querySelector('.memory-kept-route');
  const revealPaths = [...figure.querySelectorAll('.memory-reveal')];
  const sharedAgent = figure.querySelector('.memory-shared-agent');
  const keptAgent = figure.querySelector('.memory-kept-agent');
  const discardedAgent = figure.querySelector('.memory-discarded-agent');
  const repair = figure.querySelector('.memory-plan-repair');
  const oldProposal = figure.querySelector('.memory-old-proposal');
  const candidateProposal = figure.querySelector('.memory-candidate-proposal');
  const blockedMark = figure.querySelector('.memory-blocked-mark');
  const ring = figure.querySelector('.memory-repair-ring');
  const commonEnd = 2600;
  const keptEnd = 7000;
  const discardedEnd = 10700;
  const cycleDuration = 12200;
  const variants = [
    {name:'Upper passage', common:'M52 100H216Q232 100 240 88L244 76', future:'M244 76V52Q244 40 256 40H400Q412 40 412 52V88Q412 100 424 100H588'},
    {name:'Lower passage', common:'M52 100H216Q232 100 240 112L244 124', future:'M244 124V148Q244 160 256 160H400Q412 160 412 148V112Q412 100 424 100H588'}
  ];
  const repairTargets = [
    {blocked:[280,82], initialControl:[262,79], clearControl:[244,40], clearEnd:[290,40]},
    {blocked:[309,64], initialControl:[304,52], clearControl:[324,40], clearEnd:[350,40]},
    {blocked:[355,64], initialControl:[352,52], clearControl:[412,40], clearEnd:[412,76]}
  ];
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value < .5 ? 2*value*value : 1-Math.pow(-2*value+2,2)/2;
  const mix = (first,second,progress) => first.map((value,index) => value+(second[index]-value)*progress);
  let elapsed = 0;
  let startTime = 0;
  let frame = null;
  let manuallyPaused = false;
  let hasLooped = false;
  let variantIndex = 0;
  let commonLength = 0;
  let futureLength = 0;
  let checkpoints = [];
  let lastPhase = '';

  function distanceAtX(x) {
    let low = 0;
    let high = futureLength;
    for (let index=0; index<20; index++) {
      const middle = (low+high)/2;
      if (futurePath.getPointAtLength(middle).x < x) low=middle; else high=middle;
    }
    return (low+high)/2;
  }
  function prepare() {
    const variant = variants[variantIndex];
    figure.querySelector('.memory-scenario').textContent = variant.name;
    figure.dataset.passage = variantIndex ? 'lower' : 'upper';
    figure.querySelectorAll('.memory-route, .memory-reveal').forEach(route => {
      route.setAttribute('d', route.dataset.route === 'common' ? variant.common : variant.future);
    });
    commonLength = commonPath.getTotalLength();
    futureLength = futurePath.getTotalLength();
    checkpoints = [0,distanceAtX(300),distanceAtX(350)];
    lastPhase = '';
  }
  function discardedState(time) {
    if (time<3800) return {distance:0, repairIndex:0, progress:clamp((time-commonEnd)/1200)};
    if (time<4900) return {distance:checkpoints[1]*ease(clamp((time-3800)/1100))};
    if (time<6100) return {distance:checkpoints[1], repairIndex:1, progress:clamp((time-4900)/1200)};
    if (time<6700) return {distance:checkpoints[1]+(checkpoints[2]-checkpoints[1])*ease(clamp((time-6100)/600))};
    if (time<7900) return {distance:checkpoints[2], repairIndex:2, progress:clamp((time-6700)/1200)};
    return {distance:checkpoints[2]+(futureLength-checkpoints[2])*ease(clamp((time-7900)/2800))};
  }
  function place(agent,point) {
    agent.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
  }
  function renderRepair(state,point) {
    const reflect = value => [value[0],variantIndex ? 200-value[1] : value[1]];
    const target = repairTargets[state.repairIndex];
    const blocked = reflect(target.blocked);
    const progress = state.progress;
    const adjustment = ease(clamp((progress-.12)/.88));
    const control = reflect(mix(target.initialControl,target.clearControl,adjustment));
    const end = reflect(mix(target.blocked,target.clearEnd,adjustment));
    repair.style.opacity = String(Math.min(clamp(progress/.1),clamp((1-progress)/.12)));
    oldProposal.setAttribute('d',`M${point.x} ${point.y}L${blocked.join(' ')}`);
    oldProposal.style.opacity = String(1-clamp(progress/.8));
    candidateProposal.setAttribute('d',`M${point.x} ${point.y}Q${control.join(' ')} ${end.join(' ')}`);
    blockedMark.setAttribute('transform',`translate(${blocked.join(' ')})`);
    blockedMark.style.opacity = String(1-clamp(progress/.85));
    ring.setAttribute('cx',point.x);
    ring.setAttribute('cy',point.y);
    ring.setAttribute('r',10+7*Math.sin(progress*Math.PI));
    ring.style.opacity = String(.25+.45*Math.sin(progress*Math.PI));
  }
  function render(time) {
    const phase = time<commonEnd ? 'common' : time<discardedEnd ? 'carry' : 'complete';
    scene.style.opacity = String(Math.min(hasLooped ? clamp(time/250) : 1,clamp((cycleDuration-time)/300)));
    if (phase !== lastPhase) {
      figure.dataset.phase = phase;
      caption.textContent = phase==='common' ? 'Both robots start with the same detour around the shelf.' : phase==='carry' ? 'One carries the detour forward. The other repairs proposals pointing back into the shelf.' : 'Both reach the goal. Keeping the correction changes the work needed along the way.';
      lastPhase = phase;
    }
    const commonProgress = ease(clamp((time-150)/(commonEnd-150)));
    const keptProgress = clamp((time-commonEnd)/(keptEnd-commonEnd));
    const discarded = discardedState(time);
    const keptPoint = futurePath.getPointAtLength(keptProgress*futureLength);
    const discardedPoint = futurePath.getPointAtLength(discarded.distance);
    place(sharedAgent,commonPath.getPointAtLength(commonProgress*commonLength));
    place(keptAgent,keptPoint);
    place(discardedAgent,discardedPoint);
    const progress = [commonProgress,keptProgress,time<commonEnd ? 0 : discarded.distance/futureLength];
    revealPaths.forEach((route,index) => route.style.strokeDashoffset=String(1-progress[index]));
    const isRepairing = phase==='carry' && discarded.repairIndex!==undefined;
    figure.classList.toggle('is-repairing',isRepairing);
    if (isRepairing) renderRepair(discarded,discardedPoint); else repair.style.opacity='0';
    const keptText = phase==='common' ? 'Same first detour' : time<keptEnd ? 'Using the corrected route' : 'At the goal';
    const discardedText = phase==='common' ? 'Same first detour' : time>=discardedEnd ? 'At the goal' : isRepairing ? 'Repairing a new proposal' : 'Continuing after a repair';
    if (keptStatus.textContent!==keptText) keptStatus.textContent=keptText;
    if (discardedStatus.textContent!==discardedText) discardedStatus.textContent=discardedText;
  }
  function pause() {
    if (frame!==null) cancelAnimationFrame(frame);
    frame=null;
  }
  function tick(timestamp) {
    elapsed=timestamp-startTime;
    if (elapsed>=cycleDuration) {
      const cycles=Math.floor(elapsed/cycleDuration);
      variantIndex=(variantIndex+cycles)%variants.length;
      startTime+=cycles*cycleDuration;
      elapsed%=cycleDuration;
      hasLooped=true;
      prepare();
    }
    render(elapsed);
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
  const observer=new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && entries[0].intersectionRatio>=.35) play(); else pause();
  },{threshold:.35});
  observer.observe(figure);
  document.addEventListener('visibilitychange',() => {if(document.hidden) pause();else play();});
  reduceMotion.addEventListener('change',() => {
    pause();lastPhase='';
    if(reduceMotion.matches) {render(7200);figure.dataset.playback='static';}
    else {elapsed=0;hasLooped=false;render(0);figure.dataset.playback=manuallyPaused ? 'paused' : 'ready';play();}
    updateToggle();
  });
  prepare();
  figure.dataset.playback=reduceMotion.matches ? 'static' : 'ready';
  render(reduceMotion.matches ? 7200 : 0);
  updateToggle();
})();
