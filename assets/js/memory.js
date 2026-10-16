(() => {
  // Poses are illustrative; only the dashed, unexecuted proposal intersects an obstacle.
  const geometry = {
    base: [70.0, 292.0], length: 30.0, goal: [360.0, 130.0],
    obstacles: [[235.0, 200.0, 30.0], [70.0, 115.0, 18.0], [372.0, 282.0, 23.0], [424.0, 83.0, 18.0]],
    poses: {
      start: [-1.299785302, -1.256912261, -1.212716559, -1.128817378, -1.007010448, -0.924024301, -0.845997552, -0.792153766, -0.617702291, -0.415196415, -0.164817067, -0.001375787],
      bad: [-0.518658083, -0.518679457, -0.518726452, -0.517624746, -0.510298706, -0.551124159, -1.175225387, -1.050463119, -0.842640835, -0.259634757, 0.102866414, 0.289006381],
      corrected: [-0.999785302, -0.926912261, -0.862716559, -0.798817378, -0.727010448, -0.654024301, -0.565997552, -0.472153766, -0.297702291, -0.115196415, 0.105182933, 0.288624213],
      step: [-1.134785302, -1.075412261, -1.020216559, -0.947317378, -0.853010448, -0.775524301, -0.691997552, -0.616153766, -0.441702291, -0.250196415, -0.016317067, 0.158124213],
      next: [-1.002254495, -0.918903016, -0.847166213, -0.819924642, -0.755384761, -0.619135392, -0.548468657, -0.488365926, -0.308892745, -0.105553073, 0.087854475, 0.30072148],
    }
  };
  const duration = 14000;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const progress = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
  function positions(angles, variant = 0) {
    let [x, y] = geometry.base;
    const points = [[x, y]];
    angles.forEach(a => {
      x += geometry.length * Math.cos(a);
      y += geometry.length * Math.sin(a);
      points.push([x, y]);
    });
    return variant ? points.map(([px, py]) => [500 - px, py]) : points;
  }
  // Interpolate joint orientations, never joint positions: every link stays rigid.
  function sample(t) {
    const p = geometry.poses;
    const phase = t < 2000 ? 'propose' : t < 5000 ? 'correct' : t < 7000 ? 'move' : 'next';
    const correction = progress(t, 2200, 4000);
    let physical = mix(p.start, p.step, progress(t, 5200, 6700));
    if (t >= 10000) physical = mix(p.step, p.next, progress(t, 10000, 12600));
    const proposal = t < 7000 ? mix(p.bad, p.corrected, correction) : mix(p.corrected, p.next, progress(t, 7100, 7600));
    return {phase, correction, physical, proposal, edited: progress(t, 3700, 4650)};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {geometry, duration, positions, sample};
  if (typeof document === 'undefined') return;
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const svg = figure.querySelector('.memory-arm-experiment');
  const find = selector => figure.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = find('.memory-motion-toggle');
  const world = find('.arm-world');
  const physical = find('.arm-physical');
  const original = find('.arm-ghost-original');
  const corrected = find('.arm-ghost-corrected');
  const joints = [...figure.querySelectorAll('.arm-joints circle')];
  const obstacleGroups = [...figure.querySelectorAll('.arm-obstacles > g')];
  const records = [...figure.querySelectorAll('.arm-record')];
  const historyLinks = [...figure.querySelectorAll('.arm-history-links path')];
  const cells = [...figure.querySelectorAll('.arm-state-cells rect')];
  const stages = [...figure.querySelectorAll('[data-stage]')];
  const writePath = find('.arm-write');
  const attentionPath = find('.arm-attention-read');
  const statePath = find('.arm-state-read');
  const allDrawing = [...svg.children].filter(node => !['title', 'desc', 'defs'].includes(node.tagName));
  let layout, elapsed = 0, variant = 0, frame = null, startTime = 0;
  let manuallyPaused = false, onScreen = false, hasLooped = false, lastDraw = -Infinity, lastPhase = '';
  const pointsText = points => points.map(p => p.map(n => n.toFixed(2)).join(',')).join(' ');
  function setPath(node, d) { node.setAttribute('d', d); }
  function scenePoint(point) { return [layout.wx + point[0] * layout.scale, layout.wy + point[1] * layout.scale]; }
  function connector(a, b, bend) {
    return `M${a}C${a[0] + bend},${a[1]} ${b[0] - bend},${b[1]} ${b}`;
  }
  function thumbnail(angles, width, height) {
    const points = positions(angles, variant);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const scale = Math.min((width - 9) / (Math.max(...xs) - minX), (height - 9) / (Math.max(...ys) - minY));
    return pointsText(points.map(([x, y]) => [4.5 + (x - minX) * scale, height - 4.5 - (Math.max(...ys) - y) * scale]));
  }
  function resize() {
    const w = svg.clientWidth;
    if (!w) return;
    const mobile = w < 700;
    const mw = mobile ? Math.min(w - 12, 420) : Math.min(365, w * .36);
    const mx = mobile ? (w - mw) / 2 : 4;
    const scale = mobile ? Math.min(1.05, (w - 8) / 430) : Math.min(1.18, (w - mw - 75) / 430);
    const wx = mobile ? w / 2 - 250 * scale : (w + mw + 50) / 2 - 250 * scale;
    const wy = 43;
    const ay = mobile ? wy + 312 * scale + 22 : 48;
    const sy = mobile ? ay + 163 : 245;
    const height = mobile ? sy + 142 : Math.max(414, wy + 322 * scale + 16);
    layout = {w, mobile, mw, mx, scale, wx, wy, ay, sy};
    svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
    svg.style.height = `${height}px`;
    world.setAttribute('transform', `translate(${wx} ${wy}) scale(${scale})`);
    find('.arm-goal-label').style.fontSize = `${11 / Math.min(1, scale)}px`;
    find('.arm-attention').setAttribute('transform', `translate(${mx} ${ay})`);
    find('.arm-state').setAttribute('transform', `translate(${mx} ${sy})`);
    const title = find('.arm-scene-title');
    title.setAttribute('x', mobile ? w / 2 : wx + 250 * scale);
    title.setAttribute('y', 23);
    const rw = Math.min(35, (mw - 7 * 5) / 8), gap = (mw - rw * 8) / 7;
    records.forEach((record, i) => {
      record.setAttribute('transform', `translate(${i * (rw + gap)} 43)`);
      record.querySelector('rect').setAttribute('width', rw);
      let pose = mix(geometry.poses.start, geometry.poses.step, i / 13);
      if (i === 5) pose = geometry.poses.corrected;
      if (i > 5) pose = i === 6 ? geometry.poses.step : geometry.poses.next;
      record.querySelector('polyline').setAttribute('points', thumbnail(pose, rw, 38));
      const x = i * (rw + gap) + rw / 2;
      setPath(historyLinks[i], `M${x} 84Q${x} 103 ${mw / 2} 106`);
    });
    find('.arm-history-port').setAttribute('cx', mw / 2);
    find('.arm-history-port').setAttribute('cy', 106);
    figure.querySelectorAll('.arm-lane-status').forEach(node => node.setAttribute('y', 132));
    const capsuleX = Math.max(66, (mw - 132) / 2);
    find('.arm-state-capsule').setAttribute('transform', `translate(${capsuleX} 49)`);
    setPath(find('.arm-state-input'), `M34 72H${capsuleX - 8}m-5-4 5 4-5 4`);
    const loopX = Math.min(mw - 5, capsuleX + 163);
    setPath(find('.arm-state-loop'), `M${capsuleX + 139} 72H${loopX}V113H${capsuleX + 66}V101m-4 5 4-5 4 5`);
    layout.statePort = [mx + capsuleX + 132, sy + 72];
    layout.stateEdit = [mx + capsuleX + 110, sy + 87];
    layout.attentionPort = [mx + mw / 2, ay + 106];
    lastPhase = '';
    render(elapsed);
  }
  function prepare() {
    const flip = x => variant ? 500 - x : x;
    obstacleGroups.forEach((group, i) => {
      const [x, y] = geometry.obstacles[i];
      group.querySelectorAll('circle').forEach(circle => {circle.setAttribute('cx', flip(x));circle.setAttribute('cy', y);});
    });
    find('.arm-base').setAttribute('transform', `translate(${flip(70)} 292)`);
    setPath(find('.arm-floor'), `M${flip(45)} 306H${flip(95)}`);
    find('.arm-goal').setAttribute('transform', `translate(${flip(360)} 130)`);
    const goalLabel = find('.arm-goal-label');
    goalLabel.setAttribute('x', flip(378));
    goalLabel.setAttribute('text-anchor', variant ? 'end' : 'start');
    find('.arm-collision').setAttribute('transform', `translate(${flip(224)} 203)`);
    original.setAttribute('points', pointsText(positions(geometry.poses.bad, variant)));
    lastPhase = '';
    figure.dataset.arrangement = variant ? 'left' : 'right';
  }
  function signal(path, dot, amount, time) {
    path.style.opacity = amount;
    dot.style.opacity = amount;
    if (amount < .01) return;
    const p = path.getPointAtLength(path.getTotalLength() * clamp(time));
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
  }
  function render(t) {
    if (!layout) return;
    const model = sample(t);
    const actual = positions(model.physical, variant);
    const proposed = positions(model.proposal, variant);
    physical.setAttribute('points', pointsText(actual));
    corrected.setAttribute('points', pointsText(proposed));
    joints.forEach((joint, i) => {joint.setAttribute('cx', actual[i][0]);joint.setAttribute('cy', actual[i][1]);});
    original.style.opacity = .65 * (1 - progress(t, 3000, 4500));
    corrected.style.opacity = progress(t, 2050, 2600) * (1 - .85 * progress(t, 11800, 13000));
    find('.arm-collision').style.opacity = progress(t, 400, 1000) * (1 - progress(t, 2400, 3400));
    const fade = Math.min(hasLooped ? progress(t, 0, 300) : 1, 1 - progress(t, 13600, 14000));
    allDrawing.forEach(node => node.style.opacity = fade);
    const write = progress(t, 3250, 3650) * (1 - progress(t, 4700, 4950));
    const read = progress(t, 7150, 7600) * (1 - progress(t, 9500, 9950));
    const anchor = scenePoint(proposed[6]);
    if (layout.mobile) {
      const bendX = layout.w - 4;
      setPath(writePath, `M${anchor}C${bendX},${anchor[1]} ${bendX},${layout.stateEdit[1] - 20} ${layout.stateEdit}`);
      setPath(attentionPath, `M${layout.attentionPort}C${layout.attentionPort[0]},${layout.attentionPort[1] + 10} 3,${layout.attentionPort[1] + 10} 3,${layout.attentionPort[1] - 8}V${anchor[1] + 18}Q3,${anchor[1]} ${anchor}`);
      setPath(statePath, `M${layout.statePort}C${bendX},${layout.statePort[1]} ${bendX},${anchor[1]} ${anchor}`);
    } else {
      setPath(writePath, connector(anchor, layout.stateEdit, -70));
      setPath(attentionPath, connector(layout.attentionPort, anchor, 90));
      setPath(statePath, connector(layout.statePort, anchor, 85));
    }
    signal(writePath, find('.arm-write-signal'), write, clamp((t - 3450) / 1150));
    signal(attentionPath, find('.arm-attention-signal'), read * .85, clamp((t - 7550) / 1600));
    signal(statePath, find('.arm-state-signal'), read, clamp((t - 7550) / 1600));
    const arrivals = [-1, -1, -1, -1, -1, 4000, 6800, 10300];
    records.forEach((record, i) => {
      const present = arrivals[i] < 0 ? 1 : progress(t, arrivals[i], arrivals[i] + 400);
      record.style.opacity = .10 + .90 * present;
      record.classList.toggle('is-correction', i === 5 && model.edited > .1);
      record.classList.toggle('is-read', (i === 5 || i === 6) && read > .15);
      const weight = i === 5 ? 1 : i === 6 ? .8 : .13;
      historyLinks[i].style.opacity = present * read * weight;
      historyLinks[i].style.strokeWidth = .7 + read * weight;
    });
    find('.arm-history-port').style.opacity = .2 + .8 * read;
    find('.arm-state-edit').style.opacity = model.edited;
    find('.arm-state-frame').classList.toggle('is-corrected', model.edited > .1);
    cells.forEach((cell, i) => {
      const heights = [12, 21, 15, 9, 19, 14], edits = [9, -7, 5, 10, -5, 4];
      const h = heights[i] + edits[i] * model.edited;
      cell.setAttribute('height', h);
      cell.setAttribute('y', (46 - h) / 2);
      cell.style.opacity = [.5, .7, .45, .8, .5, .65][i];
    });
    find('.arm-state-loop').style.opacity = .2 + .8 * Math.max(write, read);
    find('.arm-state-input').style.opacity = .3 + .7 * read;
    const phase = t >= 10000 ? 'continue' : model.phase;
    if (phase === lastPhase) return;
    const copy = {
      propose: ['A blocked proposal', 'Store the observed reach', 'Start from the current state'],
      correct: ['Correct the reach', 'Save the corrected proposal', 'Write the correction into state'],
      move: ['Take one safe step', 'The corrected plan is saved', 'The state edit stays'],
      next: ['Plan from the corrected state', 'Read relevant records', 'Reuse the edited state'],
      continue: ['Continue to the same goal', 'The plan remains in history', 'The correction remains in state']
    }[phase];
    find('.arm-scene-title').textContent = copy[0];
    find('.arm-attention .arm-lane-status').textContent = copy[1];
    find('.arm-state .arm-lane-status').textContent = copy[2];
    stages.forEach(stage => {
      if (stage.dataset.stage === model.phase) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
    });
    figure.dataset.phase = phase;
    lastPhase = phase;
  }
  function pause() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  function tick(timestamp) {
    elapsed = timestamp - startTime;
    if (elapsed >= duration) {
      const loops = Math.floor(elapsed / duration);
      variant = (variant + loops) % 2;
      startTime += loops * duration;
      elapsed %= duration;
      hasLooped = true;
      prepare();
      resize();
    }
    if (timestamp - lastDraw >= 32) {render(elapsed);lastDraw = timestamp;}
    frame = requestAnimationFrame(tick);
  }
  function play() {
    if (frame !== null || !onScreen || document.hidden || manuallyPaused || reducedMotion.matches) return;
    figure.dataset.playback = 'playing';
    startTime = performance.now() - elapsed;
    frame = requestAnimationFrame(tick);
  }
  function updateToggle() {
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.querySelector('span').textContent = manuallyPaused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('path').setAttribute('d', manuallyPaused ? 'M5 3 12 8 5 13Z' : 'M5 3v10M11 3v10');
  }
  toggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    if (manuallyPaused) {pause();figure.dataset.playback = 'paused';}
    else play();
    updateToggle();
  });
  new IntersectionObserver(entries => {
    onScreen = entries[0].isIntersecting;
    if (onScreen) play();else pause();
  }, {rootMargin: '-40px 0px', threshold: 0}).observe(svg);
  document.addEventListener('visibilitychange', () => {if (document.hidden) pause();else play();});
  reducedMotion.addEventListener('change', () => {
    pause();
    elapsed = reducedMotion.matches ? 8700 : 0;
    hasLooped = false;
    render(elapsed);
    figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';
    updateToggle();
    play();
  });
  prepare();
  if (reducedMotion.matches) elapsed = 8700;
  resize();
  new ResizeObserver(resize).observe(svg);
  figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';
  updateToggle();
})();
