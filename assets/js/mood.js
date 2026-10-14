(() => {
  const figures = [...document.querySelectorAll('.mood-scene')];
  if (!figures.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.mood-motion-toggle');
  const cautionAt = 1400;
  const resumeAt = 5000;
  const duration = 6400;
  const cycleDuration = 7900;
  const fadeDuration = 300;
  let manuallyPaused = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  const path = points => points.map((point, index) => `${index ? 'L' : 'M'}${point.join(' ')}`).join('');

  function pacStory(mirrored) {
    const reflect = point => [mirrored ? 360-point[0] : point[0], point[1]];
    return {
      name: mirrored ? 'Ghost from the left' : 'Ghost from the right',
      routes: [[[196,168],[196,136]], [[196,136],[100,136],[100,40],[196,40]], [[196,40],[260,40]]].map(route => route.map(reflect)),
      alternative: [[196,136],[228,136],[228,40],[196,40]].map(reflect),
      ghost: [[260,104],[228,104],[228,136],[292,136]].map(reflect),
      pellets: [[196,152],[196,40],[228,40],[260,40]].map(reflect),
      wallX: mirrored ? 148 : 116,
      mirrored,
      captions: ['Collecting pellets along the corridor.', 'A ghost approaches. The policy takes the longer route.', 'Clear of the ghost, the policy returns to seeking.'],
      complete: 'The agent detours around the ghost, then resumes collecting pellets.'
    };
  }
  function roomsStory(upper) {
    const startY = upper ? 56 : 152;
    const goalY = upper ? 148 : 56;
    return {
      name: upper ? 'Spikes in the upper passage' : 'Spikes in the lower passage',
      routes: [[[68,startY],[100,startY]], [[100,startY],[68,startY],[68,goalY],[244,goalY]], [[244,goalY],[292,goalY]]],
      alternative: [[100,startY],[292,startY],[292,goalY]],
      goalY,
      upper,
      keyAt: (32+Math.abs(startY-104))/(32+Math.abs(startY-goalY)+176),
      doorAt: (32+Math.abs(startY-goalY)+46)/(32+Math.abs(startY-goalY)+176),
      captions: ['Moving toward the amulet.', 'Turning back for a key and a clear route around the spikes.', 'Beyond the door, seeking resumes toward the amulet.'],
      complete: 'The agent uses the key to avoid the spike passage, then reaches the amulet.'
    };
  }
  const stories = {pac:[pacStory(false), pacStory(true)], rooms:[roomsStory(false), roomsStory(true)]};

  function travelled(points, progress) {
    const lengths = points.slice(1).map((point, index) => Math.hypot(point[0]-points[index][0], point[1]-points[index][1]));
    let distance = clamp(progress) * lengths.reduce((sum, value) => sum+value, 0);
    const visited = [points[0]];
    if (distance === 0) return visited;
    for (let index = 0; index < lengths.length; index++) {
      if (distance < lengths[index]) {
        const fraction = distance/lengths[index];
        visited.push(points[index].map((value, axis) => value+fraction*(points[index+1][axis]-value)));
        break;
      }
      visited.push(points[index+1]);
      distance -= lengths[index];
    }
    return visited;
  }
  const position = (points, progress) => travelled(points, progress).at(-1);

  const scenes = figures.map(figure => {
    const world = figure.dataset.world;
    const variants = stories[world];
    const actor = figure.querySelector('.mood-moving-agent');
    const map = figure.querySelector('.mood-scene-map');
    const caption = figure.querySelector('.mood-scene-caption');
    const trails = [...figure.querySelectorAll('.mood-trail')];
    const steps = [...figure.querySelectorAll('.mood-story li')];
    const ghost = figure.querySelector('.mood-moving-ghost');
    const pellets = [...figure.querySelectorAll('.mood-pellets circle')];
    const key = figure.querySelector('.mood-key');
    const doorLeaf = figure.querySelector('.mood-door-leaf');
    const amulet = figure.querySelector('.mood-amulet');
    let storyIndex = 0;
    let story = variants[storyIndex];
    let elapsed = 0;
    let startTime = 0;
    let frame = null;
    let visible = false;
    let hasLooped = false;
    let lastPhase = -1;

    function prepare() {
      story = variants[storyIndex];
      lastPhase = -1;
      figure.querySelector('.mood-scenario').textContent = story.name;
      trails.forEach((trail, index) => trail.setAttribute('d', path(story.routes[index])));
      figure.querySelector('.mood-alternative').setAttribute('d', path(story.alternative));
      const shortLabel = figure.querySelector('.mood-short-label');
      if (world === 'pac') {
        figure.querySelector('.mood-central-wall').setAttribute('x', story.wallX);
        pellets.forEach((pellet, index) => {
          pellet.setAttribute('cx', story.pellets[index][0]);
          pellet.setAttribute('cy', story.pellets[index][1]);
        });
        figure.querySelector('.mood-pellets-label').setAttribute('x', story.mirrored ? 114 : 246);
        shortLabel.setAttribute('x', story.mirrored ? 124 : 236);
        shortLabel.setAttribute('text-anchor', story.mirrored ? 'end' : 'start');
        ghost.querySelector('text').setAttribute('x', story.mirrored ? -14 : 14);
        ghost.querySelector('text').setAttribute('text-anchor', story.mirrored ? 'end' : 'start');
      } else {
        figure.querySelector('.mood-spike-passage').setAttribute('transform', `translate(0 ${story.upper ? -92 : 0})`);
        figure.querySelector('.mood-door').setAttribute('transform', `translate(128 ${story.goalY})`);
        amulet.setAttribute('transform', `translate(292 ${story.goalY})`);
        figure.querySelector('.mood-door-label').setAttribute('y', story.upper ? 201 : 16);
        figure.querySelector('.mood-amulet-label').setAttribute('y', story.upper ? 201 : 16);
        figure.querySelector('.mood-spikes-label').setAttribute('y', story.upper ? 85 : 177);
        shortLabel.setAttribute('y', story.upper ? 49 : 169);
      }
    }

    function render(time) {
      const progress = [clamp((time-250)/800), clamp((time-cautionAt)/(resumeAt-cautionAt)), clamp((time-resumeAt)/(duration-resumeAt))];
      const phase = time < cautionAt ? 0 : time < resumeAt ? 1 : 2;
      const point = position(story.routes[phase], ease(progress[phase]));
      actor.setAttribute('transform', `translate(${point[0].toFixed(2)} ${point[1].toFixed(2)})`);
      trails.forEach((trail, index) => trail.setAttribute('d', path(travelled(story.routes[index], ease(progress[index])))));
      map.style.opacity = String(Math.min(hasLooped ? clamp(time/fadeDuration) : 1, clamp((cycleDuration-time)/fadeDuration)));
      if (phase !== lastPhase) {
        figure.dataset.phase = ['seeking','cautious','resume'][phase];
        caption.textContent = story.captions[phase];
        steps.forEach((step, index) => {
          step.classList.toggle('is-current', index === phase);
          step.classList.toggle('is-past', index < phase);
        });
        lastPhase = phase;
      }
      if (world === 'pac') {
        const point = position(story.ghost, clamp(time/resumeAt));
        ghost.setAttribute('transform', `translate(${point[0].toFixed(2)} ${point[1].toFixed(2)})`);
        const collected = [progress[0] >= .5, progress[1] >= 1, progress[2] >= .5, progress[2] >= 1];
        pellets.forEach((pellet, index) => pellet.classList.toggle('is-collected', collected[index]));
      } else {
        const hasKey = ease(progress[1]) >= story.keyAt;
        const doorOpen = ease(progress[1]) >= story.doorAt;
        figure.classList.toggle('has-key', hasKey);
        figure.classList.toggle('door-open', doorOpen);
        key.classList.toggle('is-collected', hasKey);
        doorLeaf.setAttribute('d', doorOpen ? 'M0-12 18-17' : 'M0-12V12');
        amulet.classList.toggle('is-collected', progress[2] >= 1);
      }
      if (time >= duration) caption.textContent = story.complete;
    }

    function tick(timestamp) {
      elapsed = timestamp-startTime;
      if (elapsed >= cycleDuration) {
        const cycles = Math.floor(elapsed/cycleDuration);
        storyIndex = (storyIndex+cycles)%variants.length;
        startTime += cycles*cycleDuration;
        elapsed %= cycleDuration;
        hasLooped = true;
        prepare();
      }
      render(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function pause() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }
    function play() {
      if (frame !== null || !visible || manuallyPaused || reduceMotion.matches || document.hidden) return;
      figure.dataset.playback = 'playing';
      startTime = performance.now()-elapsed;
      frame = requestAnimationFrame(tick);
    }
    prepare();
    figure.dataset.playback = reduceMotion.matches ? 'static' : 'ready';
    render(reduceMotion.matches ? duration : 0);
    return {
      figure,
      setVisible(value) {visible = value; if (value) play(); else pause();},
      setPaused(value) {if (value) {pause(); map.style.opacity = '1'; figure.dataset.playback = 'paused';} else play();},
      visibilityChanged() {if (document.hidden) pause(); else play();},
      motionChanged() {
        pause();
        if (reduceMotion.matches) {render(duration); figure.dataset.playback = 'static';}
        else {elapsed = 0; hasLooped = false; lastPhase = -1; figure.dataset.playback = manuallyPaused ? 'paused' : 'ready'; render(0); play();}
      }
    };
  });

  function updateToggle() {
    toggle.hidden = reduceMotion.matches;
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.querySelector('span').textContent = manuallyPaused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('path').setAttribute('d', manuallyPaused ? 'M5 3 12 8 5 13Z' : 'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    scenes.forEach(scene => scene.setPaused(manuallyPaused));
    updateToggle();
  });
  updateToggle();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => scenes.find(scene => scene.figure === entry.target).setVisible(entry.isIntersecting && entry.intersectionRatio >= .35));
  }, {threshold:.35});
  scenes.forEach(scene => observer.observe(scene.figure));
  document.addEventListener('visibilitychange', () => scenes.forEach(scene => scene.visibilityChanged()));
  reduceMotion.addEventListener('change', () => {scenes.forEach(scene => scene.motionChanged()); updateToggle();});
})();
