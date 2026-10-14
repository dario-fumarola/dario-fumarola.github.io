(() => {
  const figures = [...document.querySelectorAll('.mood-scene')];
  if (!figures.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4800;
  const cautionAt = 1100;
  const resumeAt = 3600;
  const stories = {
    pac: {
      routes: [[[196,168],[196,136]], [[196,136],[100,136],[100,40],[196,40]], [[196,40],[260,40]]],
      captions: ['Collecting pellets along the corridor.', 'A ghost approaches. The policy takes the longer route.', 'Clear of the ghost, the policy returns to seeking.'],
      complete: 'The agent detours around the ghost, then resumes collecting pellets.'
    },
    rooms: {
      routes: [[[68,152],[68,128]], [[68,128],[68,56],[244,56]], [[244,56],[292,56]]],
      captions: ['Moving toward the amulet.', 'A detour avoids the spikes and uses a key to open the door.', 'Beyond the hazard, seeking resumes toward the amulet.'],
      complete: 'The agent avoids the spikes, unlocks the door, then continues to the amulet.'
    }
  };
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  function position(points, progress) {
    const lengths = points.slice(1).map((point, index) => Math.hypot(point[0]-points[index][0], point[1]-points[index][1]));
    let distance = clamp(progress) * lengths.reduce((sum, value) => sum + value, 0);
    for (let index = 0; index < lengths.length; index++) {
      if (distance <= lengths[index] || index === lengths.length-1) {
        const fraction = distance / lengths[index];
        return points[index].map((value, axis) => value + fraction * (points[index+1][axis]-value));
      }
      distance -= lengths[index];
    }
  }
  const scenes = figures.map(figure => {
    const story = stories[figure.dataset.world];
    const actor = figure.querySelector('.mood-moving-agent');
    const caption = figure.querySelector('.mood-scene-caption');
    const trails = [...figure.querySelectorAll('.mood-trail')];
    const steps = [...figure.querySelectorAll('.mood-story li')];
    const replay = figure.querySelector('.mood-replay');
    let elapsed = 0;
    let startTime = 0;
    let frame = null;
    let visible = false;
    let played = false;
    let lastPhase = -1;
    function render(time) {
      const progress = [clamp(time / 750), clamp((time-cautionAt)/(resumeAt-cautionAt)), clamp((time-resumeAt)/(duration-resumeAt))];
      const phase = time < cautionAt ? 0 : time < resumeAt ? 1 : 2;
      const point = position(story.routes[phase], ease(progress[phase]));
      actor.setAttribute('transform', `translate(${point[0].toFixed(2)} ${point[1].toFixed(2)})`);
      trails.forEach((trail, index) => trail.style.strokeDashoffset = String(1-ease(progress[index])));
      if (phase !== lastPhase) {
        figure.dataset.phase = ['seeking','cautious','resume'][phase];
        caption.textContent = story.captions[phase];
        steps.forEach((step, index) => {step.classList.toggle('is-current', index === phase); step.classList.toggle('is-past', index < phase);});
        lastPhase = phase;
      }
      if (figure.dataset.world === 'pac') {
        const ghost = position([[260,104],[228,104],[228,136],[292,136]], clamp(time/resumeAt));
        figure.querySelector('.mood-moving-ghost').setAttribute('transform', `translate(${ghost[0].toFixed(2)} ${ghost[1].toFixed(2)})`);
        const collected = {first:progress[0] >= .5, turn:progress[1] >= 1, middle:progress[2] >= .5, last:progress[2] >= 1};
        Object.entries(collected).forEach(([name, value]) => figure.querySelector(`[data-pellet="${name}"]`).classList.toggle('is-collected', value));
      } else {
        const hasKey = ease(progress[1]) >= 24/248;
        const doorOpen = ease(progress[1]) >= 118/248;
        figure.classList.toggle('has-key', hasKey);
        figure.classList.toggle('door-open', doorOpen);
        figure.querySelector('.mood-key').classList.toggle('is-collected', hasKey);
        figure.querySelector('.mood-door-leaf').setAttribute('d', doorOpen ? 'M0-12 18-17' : 'M0-12V12');
        figure.querySelector('.mood-amulet').classList.toggle('is-collected', progress[2] >= 1);
      }
      if (time >= duration) {
        figure.dataset.playback = 'complete';
        caption.textContent = story.complete;
        replay.disabled = false;
      }
    }
    function tick(timestamp) {
      elapsed = Math.min(duration, timestamp-startTime);
      render(elapsed);
      frame = elapsed < duration ? requestAnimationFrame(tick) : null;
    }
    function pause() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }
    function play(reset = false) {
      pause();
      if (reset) {elapsed = 0; lastPhase = -1; render(0);}
      if (reduceMotion.matches) {render(duration); replay.hidden = true; played = true; return;}
      if (elapsed >= duration || document.hidden) return;
      played = true;
      replay.hidden = false;
      replay.disabled = true;
      figure.dataset.playback = 'playing';
      startTime = performance.now()-elapsed;
      frame = requestAnimationFrame(tick);
    }
    replay.addEventListener('click', () => play(true));
    figure.dataset.playback = 'ready';
    render(reduceMotion.matches ? duration : 0);
    replay.hidden = reduceMotion.matches;
    replay.disabled = !reduceMotion.matches;
    return {
      figure,
      setVisible(value) {visible = value; if (!value) pause(); else if (!played || elapsed < duration) play();},
      visibilityChanged() {if (document.hidden) pause(); else if (visible && elapsed < duration) play();},
      motionChanged() {pause(); if (reduceMotion.matches) {render(duration); replay.hidden = true; elapsed = duration;} else {replay.hidden = false; if (!played && visible) play();}}
    };
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => scenes.find(scene => scene.figure === entry.target).setVisible(entry.isIntersecting && entry.intersectionRatio >= .35)), {threshold:.35});
  scenes.forEach(scene => observer.observe(scene.figure));
  document.addEventListener('visibilitychange', () => scenes.forEach(scene => scene.visibilityChanged()));
  reduceMotion.addEventListener('change', () => scenes.forEach(scene => scene.motionChanged()));
})();
