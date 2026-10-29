(() => {
  // C-alpha coordinates from PDB 1YRF. The folding sequence is an illustration,
  // not an experiment or molecular dynamics trajectory from the paper.
  const geometry = {
    hinge: 12,
    clashPair: [3, 17],
    angles: {start: 1.6, bad: -2.4, corrected: .32, step: .72, next: 0},
    points: [
      [-3.35145, 7.06135, -6.50449],
      [-6.46789, 5.52424, -8.06056],
      [-7.09954, 1.91847, -7.17879],
      [-10.03095, 3.08868, -5.08974],
      [-7.90365, 5.55476, -3.15007],
      [-5.19763, 2.9504, -2.63364],
      [-7.66709, 0.54104, -1.12224],
      [-9.00172, 3.29163, 1.15641],
      [-5.50385, 4.3211, 2.33942],
      [-3.98974, 0.86738, 2.79941],
      [-7.0409, -1.25446, 3.60021],
      [-6.49301, -3.79166, 0.84919],
      [-6.12603, -3.88401, -2.90162],
      [-2.86513, -3.2998, -4.75883],
      [-2.83075, -6.94863, -5.62863],
      [-3.04105, -7.91628, -1.96228],
      [-0.41341, -5.41129, -0.91117],
      [1.95872, -6.70504, -3.53404],
      [2.06781, -10.05164, -1.65883],
      [3.58037, -8.47545, 1.43749],
      [7.39368, -8.48034, 1.94148],
      [9.02855, -5.75758, -0.07352],
      [10.44879, -4.00132, 2.98094],
      [6.96641, -4.01985, 4.51359],
      [5.38509, -2.48766, 1.41214],
      [8.02375, 0.25618, 1.63204],
      [7.36657, 0.7535, 5.35035],
      [3.613, 0.90469, 5.02334],
      [3.81106, 3.40447, 2.21172],
      [6.31198, 5.63299, 4.05757],
      [4.19794, 5.52052, 7.20983],
      [1.315, 6.96448, 5.14136],
      [3.58635, 9.60208, 3.55972],
      [3.62706, 7.87478, 0.11774],
      [6.34164, 6.45225, -2.1655],
    ]
  };
  const duration = 14000;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const progress = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, p) => a + (b - a) * p;
  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const average = points => [0, 1, 2].map(i => points.reduce((sum, p) => sum + p[i], 0) / points.length);
  // Rotate the chain about one backbone bond. All bond lengths remain unchanged.
  function positions(angle) {
    const h = geometry.hinge, pivot = geometry.points[h];
    const axis = subtract(pivot, geometry.points[h - 1]);
    const length = Math.hypot(...axis), u = axis.map(v => v / length);
    const c = Math.cos(angle), s = Math.sin(angle);
    return geometry.points.map((point, i) => {
      if (i <= h) return [...point];
      const v = subtract(point, pivot), dot = u.reduce((sum, n, j) => sum + n * v[j], 0);
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      return v.map((n, j) => pivot[j] + n * c + cross[j] * s + u[j] * dot * (1 - c));
    });
  }
  function project(points, center, variant) {
    const yaw = variant ? -.35 : .35, c = Math.cos(yaw), s = Math.sin(yaw);
    return points.map(point => {
      const [x, y, z] = subtract(point, center);
      return [250 + (x * c + z * s) * 9.2, 210 - y * 9.2, z * c - x * s];
    });
  }
  function sample(t) {
    const a = geometry.angles;
    const phase = t < 2000 ? 'propose' : t < 5000 ? 'correct' : t < 7000 ? 'move' : 'next';
    const correction = progress(t, 2200, 4000);
    let physical = mix(a.start, a.step, progress(t, 5200, 6700));
    if (t >= 10000) physical = mix(a.step, a.next, progress(t, 10000, 12600));
    const proposal = t < 7000 ? mix(a.bad, a.corrected, correction) : mix(a.corrected, a.next, progress(t, 7100, 7600));
    return {phase, correction, physical, proposal, edited: progress(t, 3700, 4650)};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {geometry, duration, positions, project, average, sample};
  if (typeof document === 'undefined') return;
  const figure = document.querySelector('.memory-demo');
  if (!figure) return;
  const svg = figure.querySelector('.memory-fold-experiment');
  const find = selector => figure.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = find('.memory-motion-toggle');
  const world = find('.fold-world');
  const current = find('.fold-current');
  const proposal = find('.fold-proposal');
  find('.fold-static').style.display = 'none';
  const clash = find('.fold-clash');
  const segments = [...figure.querySelectorAll('.fold-segment')].map(node => ({node, outline: node.querySelector('.fold-outline'), backbone: node.querySelector('.fold-backbone')}));
  const cells = [...figure.querySelectorAll('.memory-state-cells rect')];
  const stages = [...figure.querySelectorAll('[data-stage]')];
  const writePath = find('.fold-write'), readPath = find('.fold-read');
  const allDrawing = [...svg.children].filter(node => !['title', 'desc', 'defs'].includes(node.tagName));
  let layout, elapsed = 0, variant = 0, frame = null, startTime = 0;
  let manuallyPaused = false, hasLooped = false, lastDraw = -Infinity, lastPhase = '';
  const pair = p => p.slice(0, 2).map(n => n.toFixed(2)).join(' ');
  function setPath(node, d) { node.setAttribute('d', d); }
  function scenePoint(point) { return [layout.wx + point[0] * layout.scale, layout.wy + point[1] * layout.scale]; }
  function curveSegment(points, i) {
    const a = points[i], b = points[i + 1], previous = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 2)];
    const c1 = a.map((v, j) => v + (b[j] - previous[j]) / 6);
    const c2 = b.map((v, j) => v - (after[j] - a[j]) / 6);
    return `M${pair(a)}C${pair(c1)} ${pair(c2)} ${pair(b)}`;
  }
  function resize() {
    const w = svg.clientWidth;
    if (!w) return;
    const mobile = w < 700;
    const mw = mobile ? Math.min(w - 12, 380) : Math.min(330, w * .34);
    const mx = mobile ? (w - mw) / 2 : 16;
    const scale = mobile ? Math.min(1.05, (w - 8) / 450) : Math.min(1.10, (w - mw - 60) / 450);
    const wx = mobile ? w / 2 - 250 * scale : (w + mw + 35) / 2 - 250 * scale;
    const wy = 42;
    const sy = mobile ? wy + 350 * scale + 12 : 135;
    const height = mobile ? sy + 148 : Math.max(410, wy + 350 * scale + 12);
    layout = {w, mobile, mw, mx, scale, wx, wy, sy};
    svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
    svg.style.height = `${height}px`;
    world.setAttribute('transform', `translate(${wx} ${wy}) scale(${scale})`);
    find('.fold-clash text').style.fontSize = `${11 / Math.min(1, scale)}px`;
    find('.memory-state').setAttribute('transform', `translate(${mx} ${sy})`);
    const title = find('.fold-scene-title');
    title.setAttribute('x', mobile ? w / 2 : wx + 250 * scale);
    title.setAttribute('y', 22);
    const capsuleX = Math.max(62, (mw - 168) / 2);
    find('.memory-state-capsule').setAttribute('transform', `translate(${capsuleX} 49)`);
    setPath(find('.memory-state-input'), `M34 77H${capsuleX - 8}m-5-4 5 4-5 4`);
    find('.memory-observation').setAttribute('transform', 'translate(4 66)');
    find('.memory-state-lane-status').setAttribute('y', 139);
    layout.statePort = [mx + capsuleX + 168, sy + 77];
    layout.stateEdit = [mx + capsuleX + 145, sy + 95];
    lastPhase = '';
    render(elapsed);
  }
  function prepare() {
    lastPhase = '';
    figure.dataset.arrangement = variant ? 'second-view' : 'first-view';
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
    const model = sample(t), actual3d = positions(model.physical), center = average(actual3d);
    const actual = project(actual3d, center, variant), proposed = project(positions(model.proposal), center, variant);
    segments.forEach((segment, i) => {
      const d = curveSegment(actual, i);
      setPath(segment.outline, d);
      setPath(segment.backbone, d);
      segment.backbone.style.stroke = i >= geometry.hinge && model.edited > .65 ? 'var(--memory-ink)' : 'var(--fold-chain)';
      segment.depth = (actual[i][2] + actual[i + 1][2]) / 2;
      segment.backbone.style.opacity = .62 + .38 * clamp((segment.depth + 12) / 24);
    });
    [...segments].sort((a, b) => a.depth - b.depth).forEach(segment => current.appendChild(segment.node));
    setPath(proposal, proposed.slice(geometry.hinge, -1).map((_, i) => curveSegment(proposed, i + geometry.hinge)).join(''));
    proposal.classList.toggle('is-corrected', model.correction > .05);
    proposal.style.opacity = .85 * (1 - progress(t, 11200, 12600));
    const a = proposed[geometry.clashPair[0]], b = proposed[geometry.clashPair[1]];
    clash.setAttribute('transform', `translate(${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2})`);
    clash.style.opacity = progress(t, 350, 950) * (1 - progress(t, 2300, 3200));
    const fade = Math.min(hasLooped ? progress(t, 0, 300) : 1, 1 - progress(t, 13600, 14000));
    allDrawing.forEach(node => node.style.opacity = fade);
    const write = progress(t, 3250, 3650) * (1 - progress(t, 4700, 4950));
    const read = progress(t, 7150, 7600) * (1 - progress(t, 9500, 9950));
    const anchor = scenePoint(proposed[20]);
    if (layout.mobile) {
      const x = layout.w - 4;
      setPath(writePath, `M${anchor}C${x},${anchor[1]} ${x},${layout.stateEdit[1] - 20} ${layout.stateEdit}`);
      setPath(readPath, `M${layout.statePort}C${x},${layout.statePort[1]} ${x},${anchor[1]} ${anchor}`);
    } else {
      setPath(writePath, `M${anchor}C${anchor[0] - 70},${anchor[1]} ${layout.stateEdit[0] + 90},${layout.stateEdit[1]} ${layout.stateEdit}`);
      setPath(readPath, `M${layout.statePort}C${layout.statePort[0] + 90},${layout.statePort[1]} ${anchor[0] - 100},${anchor[1]} ${anchor}`);
    }
    signal(writePath, find('.fold-write-signal'), write, clamp((t - 3450) / 1150));
    signal(readPath, find('.fold-read-signal'), read, clamp((t - 7550) / 1600));
    find('.memory-state-edit').style.opacity = model.edited;
    find('.memory-state-frame').classList.toggle('is-corrected', model.edited > .1);
    cells.forEach((cell, i) => {
      const heights = [16, 25, 19, 13, 23, 18], edits = [9, -7, 5, 10, -5, 4];
      const h = heights[i] + edits[i] * model.edited;
      cell.setAttribute('height', h);
      cell.setAttribute('y', (56 - h) / 2);
      cell.style.opacity = [.5, .7, .45, .8, .5, .65][i];
    });
    find('.memory-state-input').style.opacity = .25 + .75 * read;
    const phase = t >= 10000 ? 'continue' : model.phase;
    if (phase === lastPhase) return;
    const copy = {
      propose: ['A proposed fold creates a clash', 'The state before correction'],
      correct: ['Edit the state to change the fold', 'Write the correction into state'],
      move: ['Take one folding step', 'The edit stays after the move'],
      next: ['Use the edited state for the next fold', 'Start from the corrected state'],
      continue: ['Continue from the correction', 'The correction remains in memory']
    }[phase];
    find('.fold-scene-title').textContent = copy[0];
    find('.memory-state-lane-status').textContent = copy[1];
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
  function inView() {
    const bounds = svg.getBoundingClientRect();
    return bounds.height > 0 && bounds.bottom > 40 && bounds.top < window.innerHeight - 40;
  }
  function syncVisibility() {
    if (inView()) play();else pause();
  }
  function play() {
    if (frame !== null || document.hidden || manuallyPaused || reducedMotion.matches || !inView()) return;
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
  new IntersectionObserver(syncVisibility, {rootMargin: '-40px 0px', threshold: 0}).observe(svg);
  // Scroll can precede the observer callback, including an immediate Resume click.
  window.addEventListener('scroll', syncVisibility, {passive: true});
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
