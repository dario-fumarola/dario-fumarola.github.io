(() => {
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = figure.querySelector('.memory-motion-toggle');
  const sourceLabel = figure.querySelector('.memory-source-label');
  const sourceVector = figure.querySelector('.memory-source .memory-vector');
  const retainedVector = figure.querySelector('.memory-retain .memory-vector');
  const flow = figure.querySelector('.memory-flow');
  const caption = figure.querySelector('.memory-demo-caption');
  const steps = [...figure.querySelectorAll('.memory-sequence li')];
  const pulses = [...figure.querySelectorAll('.memory-branch-pulse')];
  const phaseStarts = [0,1800,3600,5600];
  const phases = ['propose','correct','store','next'];
  const captions = [
    'The controller proposes a state and a short action plan.',
    'One local solve corrects the state. Both branches execute the same corrected action.',
    'One branch keeps the correction. The other stores the original proposal.',
    'The next observation is identical. Each branch starts from a different memory.'
  ];
  const cycleDuration = 9200;
  let elapsed = 0;
  let startTime = 0;
  let frame = null;
  let visible = false;
  let manuallyPaused = false;
  let lastPhase = -1;
  let hasLooped = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function render(time) {
    const phase = time < phaseStarts[1] ? 0 : time < phaseStarts[2] ? 1 : time < phaseStarts[3] ? 2 : 3;
    flow.style.opacity = String(Math.min(hasLooped ? clamp(time/300) : 1, clamp((cycleDuration-time)/300)));
    if (phase !== lastPhase) {
      figure.dataset.phase = phases[phase];
      sourceLabel.textContent = phase === 0 ? 'Proposed state' : 'Corrected state';
      sourceVector.classList.toggle('is-corrected', phase >= 1);
      retainedVector.classList.toggle('is-corrected', phase >= 2);
      caption.textContent = captions[phase];
      steps.forEach((step, index) => {step.classList.toggle('is-current',index === phase); step.classList.toggle('is-past',index < phase);});
      lastPhase = phase;
    }
    const progress = clamp((time-phaseStarts[2])/(phaseStarts[3]-phaseStarts[2]));
    pulses.forEach((pulse, index) => {
      const target = index ? 75 : 25;
      const distance = progress*49;
      const point = distance < 8 ? [50,distance] : distance < 33 ? [50+(target-50)*(distance-8)/25,8] : [target,8+distance-33];
      pulse.style.left = `${point[0]}%`;
      pulse.style.top = `${point[1]}px`;
    });
  }
  function pause() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  function tick(timestamp) {
    elapsed = timestamp-startTime;
    if (elapsed >= cycleDuration) {
      const cycles = Math.floor(elapsed/cycleDuration);
      startTime += cycles*cycleDuration;
      elapsed %= cycleDuration;
      hasLooped = true;
      lastPhase = -1;
    }
    render(elapsed);
    frame = requestAnimationFrame(tick);
  }
  function play() {
    if (frame !== null || !visible || document.hidden || manuallyPaused || reduceMotion.matches) return;
    figure.dataset.playback = 'playing';
    startTime = performance.now()-elapsed;
    frame = requestAnimationFrame(tick);
  }
  function updateToggle() {
    toggle.hidden = reduceMotion.matches;
    toggle.setAttribute('aria-pressed',String(manuallyPaused));
    toggle.querySelector('span').textContent = manuallyPaused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('path').setAttribute('d',manuallyPaused ? 'M5 3 12 8 5 13Z' : 'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    if (manuallyPaused) {pause(); flow.style.opacity = '1'; figure.dataset.playback = 'paused';} else play();
    updateToggle();
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
    if (visible) play(); else pause();
  }, {threshold:.35});
  observer.observe(figure);
  document.addEventListener('visibilitychange', () => {if (document.hidden) pause(); else play();});
  reduceMotion.addEventListener('change', () => {
    pause(); lastPhase = -1;
    if (reduceMotion.matches) {render(7800); figure.dataset.playback = 'static';}
    else {elapsed = 0; hasLooped = false; render(0); figure.dataset.playback = manuallyPaused ? 'paused' : 'ready'; play();}
    updateToggle();
  });
  figure.dataset.playback = reduceMotion.matches ? 'static' : 'ready';
  render(reduceMotion.matches ? 7800 : 0);
  updateToggle();
})();
