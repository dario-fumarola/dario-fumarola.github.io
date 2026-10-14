(() => {
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = figure.querySelector('.memory-motion-toggle');
  const scene = figure.querySelector('.memory-usecase');
  const caption = figure.querySelector('.memory-demo-caption');
  const keptStatus = figure.querySelector('.memory-kept-status');
  const discardedStatus = figure.querySelector('.memory-discarded-status');
  const stage = figure.querySelector('.memory-refinement-stage');
  const models = [...figure.querySelectorAll('.memory-protein')].map(svg => ({
    sites: [...svg.querySelectorAll('.protein-site')].map(site => ({
      site,
      loop: site.querySelector('.protein-loop'),
      atom: site.querySelector('.protein-moving-atom'),
      fixed: site.querySelector('.protein-fixed-atom'),
      clash: site.querySelector('.protein-clash'),
      check: site.querySelector('.protein-check'),
      focus: site.querySelector('.protein-focus')
    }))
  }));

  // A schematic fold, not molecular simulation or a protein benchmark.
  // Only the two flexible loops change. Both models receive the same first fix.
  const sites = [
    {start:[-48,-43,7], end:[8,-37,14], clash:[-27,-36,18], clear:[-20,-83,6], fixed:[-33,-37,17]},
    {start:[9,54,6], end:[80,38,6], clash:[27,47,16], clear:[56,88,2], fixed:[22,48,14]}
  ];
  const cycleDuration = 11600;
  const clamp = value => Math.max(0, Math.min(1,value));
  const ease = value => value*value*(3-2*value);
  const progress = (time,start,end) => ease(clamp((time-start)/(end-start)));
  const mix = (first,second,amount) => first.map((value,index) => value+(second[index]-value)*amount);
  const project = point => [160+1.28*(.968*point[0]+.25*point[2]),126+1.15*(point[1]+.12*point[2])];
  const pair = point => point.map(value => value.toFixed(2)).join(' ');
  let elapsed = 0;
  let startTime = 0;
  let frame = null;
  let manuallyPaused = false;
  let hasLooped = false;
  let firstSite = 0;
  let lastPhase = '';
  let lastDraw = -Infinity;

  function renderSite(model,index,amount,active,time) {
    const nodes = model.sites[index];
    if (nodes.amount===amount && !active && !nodes.active) return;
    nodes.amount=amount;
    nodes.active=active;
    const geometry = sites[index];
    const midpoint = mix(geometry.clash,geometry.clear,amount);
    const start = project(geometry.start);
    const end = project(geometry.end);
    const center = project(midpoint);
    const fixed = project(geometry.fixed);
    const control = center.map((value,axis) => 2*value-(start[axis]+end[axis])/2);
    nodes.loop.setAttribute('d',`M${pair(start)}Q${pair(control)} ${pair(end)}`);
    nodes.loop.style.opacity = String(.55+.45*amount);
    nodes.site.classList.toggle('is-clear',amount>.88);
    nodes.site.classList.toggle('has-clash',amount<.22);
    nodes.atom.setAttribute('transform',`translate(${pair(center)})`);
    nodes.fixed.setAttribute('transform',`translate(${pair(fixed)})`);
    const separation = Math.hypot(center[0]-fixed[0],center[1]-fixed[1]);
    const severity = clamp((29-separation)/17);
    const clashCenter = mix(center,fixed,.5);
    nodes.clash.setAttribute('transform',`translate(${pair(clashCenter)})`);
    nodes.clash.style.opacity = severity.toFixed(3);
    nodes.check.setAttribute('transform',`translate(${pair(center)})`);
    nodes.check.style.opacity = String(clamp((amount-.82)/.18));
    nodes.focus.setAttribute('cx',center[0]);
    nodes.focus.setAttribute('cy',center[1]);
    nodes.focus.setAttribute('r',15+3*Math.sin(time/180));
    nodes.focus.style.opacity = active ? '.6' : '0';
  }

  function render(time) {
    const phase = time<1300 ? 'start' : time<3300 ? 'common' : time<4800 ? 'next' : time<6800 ? 'repair' : 'outcome';
    scene.style.opacity = String(Math.min(hasLooped ? clamp(time/220) : 1,clamp((cycleDuration-time)/300)));
    const firstFix = progress(time,1300,2900);
    const secondFix = progress(time,4800,6500);
    const lostFirstFix = firstFix*(1-progress(time,3500,4300));
    const repeatedFix = secondFix*(1-progress(time,6800,7600));
    const kept = firstSite===0 ? [firstFix,secondFix] : [secondFix,firstFix];
    const discarded = firstSite===0 ? [Math.max(lostFirstFix,repeatedFix),0] : [0,Math.max(lostFirstFix,repeatedFix)];
    models.forEach((model,modelIndex) => {
      const values = modelIndex===0 ? kept : discarded;
      values.forEach((amount,index) => {
        const active = phase==='common' && index===firstSite || phase==='repair' && index===(modelIndex===0 ? 1-firstSite : firstSite);
        renderSite(model,index,amount,active,time);
      });
    });
    if (phase===lastPhase) return;
    figure.dataset.phase = phase;
    const phases = {
      start: ['A proposed structure','Two local clashes','Two local clashes','Two regions of the same proposed protein structure need a local repair.'],
      common: ['The same first repair','Resolving the first clash','Resolving the first clash','Both versions make the same first repair. Only the memory they keep will differ.'],
      next: ['The next proposal','First fix preserved','First clash returns','The corrected memory preserves the fix. The original memory proposes the clash again.'],
      repair: ['The next repair step','Fixing the other region','Repeating the first repair','One version repairs the other region. The other spends its next step repeating the first repair.'],
      outcome: ['What carries forward','Both local fixes preserved','Earlier clash returns','Keeping the correction leaves a better next proposal, with less local work to repeat.']
    };
    const copy = phases[phase];
    stage.textContent = copy[0];
    keptStatus.textContent = copy[1];
    discardedStatus.textContent = copy[2];
    caption.textContent = copy[3];
    lastPhase = phase;
  }

  function pause() {
    if (frame!==null) cancelAnimationFrame(frame);
    frame=null;
  }
  function tick(timestamp) {
    elapsed=timestamp-startTime;
    if (elapsed>=cycleDuration) {
      const cycles=Math.floor(elapsed/cycleDuration);
      firstSite=(firstSite+cycles)%2;
      startTime+=cycles*cycleDuration;
      elapsed%=cycleDuration;
      hasLooped=true;
      lastPhase='';
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
  figure.dataset.playback=reduceMotion.matches ? 'static' : 'ready';
  render(reduceMotion.matches ? 9500 : 0);
  updateToggle();
})();
