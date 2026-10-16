(() => {
  const duration = 7300;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const progress = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const project = (x, y, z = 0) => [270 + (x - y) * .86, 155 + (x + y) * .43 - z];
  // The clock runs through report arrivals; the switch and clearance receive a slow beat.
  function environmentStep(time) {
    if (time < 3600) return time / 150;
    if (time < 4300) return 24;
    return Math.min(26, 24 + (time - 4300) / 300);
  }
  function sample(time) {
    const step = environmentStep(time), motion = progress(time, 5010, 6010);
    const cartY = 98 - 248 * motion;
    const phase = step < 6 ? 'waiting' : step < 24 ? 'received' : step < 26 ? 'clearance' : 'open';
    const reports = Math.min(Math.floor(step / 6), 4), age = step - reports * 6;
    const cyclePart = step % 6;
    const packet = cyclePart >= 3 && step < 24 && cartY === 98 ? (cyclePart - 3) / 3 : -1;
    return {local: time, step, switchAt: 24, openAt: 26, phase, reports, reportPresent: reports > 0 && cartY > 0,
      freshness: Math.exp(-age / 6), packet, cartY, motion,
      xOpen: 1 - progress(time, 3600, 3880), yOpen: progress(time, 4900, 5180)};
  }
  function barrier(axis, position, openness) {
    const angle = openness * Math.PI / 2;
    const direction = position > 0 ? 1 : -1;
    const hinge = axis === 'y' ? [-34 * direction, position] : [position, -34 * direction];
    const tip = [...hinge];
    tip[axis === 'y' ? 0 : 1] += 68 * direction * Math.cos(angle);
    return {base: project(...hinge), hinge: project(...hinge, 5), tip: project(...tip, 5 + 68 * Math.sin(angle)), worldHinge: [...hinge, 5], worldTip: [...tip, 5 + 68 * Math.sin(angle)]};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {duration, environmentStep, sample, project, barrier};
  if (typeof document === 'undefined') return;
  const figure = document.querySelector('.bg-demo');
  if (!figure) return;
  const find = selector => figure.querySelector(selector);
  const svg = find('.bg-crossing-scene');
  const toggle = find('.bg-motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const barriers = [...figure.querySelectorAll('.bg-barrier')].map(node => ({node, axis: node.dataset.axis, position: Number(node.dataset.position), post: node.querySelector('.bg-barrier-post'), arm: node.querySelector('.bg-barrier-arm'), hinge: node.querySelector('.bg-barrier-hinge')}));
  const wheels = [...figure.querySelectorAll('.bg-cart-wheels circle')];
  const traces = ['deadline'].map(rule => {
    const node = find('.bg-trace-' + rule);
    return {rule, node, base: node.querySelector('.bg-trace-base'), progress: node.querySelector('.bg-trace-progress'), clearance: node.querySelector('.bg-trace-clearance'), end: node.querySelector('.bg-trace-end'), number: node.querySelector('.bg-trace-number'), cursor: node.querySelector('.bg-trace-cursor'), label: node.querySelector('.bg-trace-label')};
  });
  const dynamic = ['.bg-cart', '.bg-receiver', '.bg-rule-title', '.bg-message-flow', '.bg-gates-back', '.bg-gates-front'].map(find);
  const messagePath = find('.bg-message-path'), message = find('.bg-message');
  const line = points => 'M' + points.map(p => p.map(v => v.toFixed(2)).join(' ')).join('L');
  const polygon = points => points.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
  const setPath = (node, d) => node.setAttribute('d', d);
  let layout, elapsed = 0, startTime = 0, frame = null, lastDraw = -Infinity, lastPhase = '', manuallyPaused = false, hasLooped = false;
  function resize() {
    const w = svg.clientWidth;
    if (!w) return;
    const mobile = w < 700, cardWidth = mobile ? Math.min(290, w - 24) : 230;
    const scale = mobile ? Math.min(1, (w - 12) / 390) : Math.min(1.2, (w - cardWidth - 80) / 400);
    const wx = mobile ? w / 2 - 270 * scale : (w + cardWidth + 50) / 2 - 270 * scale;
    const wy = 26, rx = mobile ? (w - cardWidth) / 2 : 16;
    const ry = mobile ? wy + 265 * scale + 18 : 112;
    const ty = mobile ? ry + 164 : wy + 265 * scale + 28;
    const traceStart = mobile ? 4 : 142, traceLength = w - traceStart - (mobile ? 42 : 62);
    const rows = mobile ? [43] : [37];
    const height = ty + (mobile ? 74 : 68);
    layout = {w, mobile, scale, wx, wy, rx, ry, cardWidth, traceStart, traceLength, ty, rows};
    svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
    svg.style.height = `${height}px`;
    find('.bg-world').setAttribute('transform', `translate(${wx} ${wy}) scale(${scale})`);
    find('.bg-receiver').setAttribute('transform', `translate(${rx} ${ry})`);
    find('.bg-report-card').setAttribute('width', cardWidth);
    find('.bg-receipt').setAttribute('cx', cardWidth - 18);
    find('.bg-rule-title').setAttribute('x', mobile ? w / 2 : wx + 270 * scale);
    find('.bg-traces').setAttribute('transform', `translate(0 ${ty})`);
    find('.bg-traces-title').setAttribute('x', mobile ? 4 : 16);
    figure.querySelectorAll('.bg-empty-label text,.bg-robot-label').forEach(node => node.style.fontSize = `${11 / Math.min(1, scale)}px`);
    traces.forEach((trace, i) => {
      trace.node.setAttribute('transform', `translate(0 ${rows[i]})`);
      trace.label.setAttribute('x', mobile ? 4 : 16);
      trace.label.setAttribute('y', mobile ? -13 : 4);
      const sw = 24, open = 26;
      setPath(trace.base, `M${x(0)} 0H${x(26)}`);
      trace.clearance.setAttribute('x', x(sw));
      trace.clearance.setAttribute('width', x(open) - x(sw));
      trace.end.setAttribute('cx', x(open));
      trace.number.setAttribute('x', x(open) + 10);
    });
    find('.bg-deadline-marker').setAttribute('transform', `translate(${x(24)} 0)`);
    find('.bg-deadline-label').setAttribute('x', x(24));
    find('.bg-deadline-label').setAttribute('y', mobile ? -13 : -14);
    lastPhase = '';
    render(elapsed);
  }
  function x(step) {return layout.traceStart + layout.traceLength * step / 26;}
  function drawCart(y) {
    const px = 18, a = 13, b = 18, low = 4, high = 16;
    const top = [[px - a, y - b, high], [px + a, y - b, high], [px + a, y + b, high], [px - a, y + b, high]];
    find('.bg-cart-top').setAttribute('points', polygon(top.map(p => project(...p))));
    find('.bg-cart-side-east').setAttribute('points', polygon([[px + a, y - b, low], [px + a, y + b, low], [px + a, y + b, high], [px + a, y - b, high]].map(p => project(...p))));
    find('.bg-cart-side-south').setAttribute('points', polygon([[px - a, y + b, low], [px + a, y + b, low], [px + a, y + b, high], [px - a, y + b, high]].map(p => project(...p))));
    find('.bg-cart-load').setAttribute('points', polygon([[px - 8, y - 8, high + 4], [px + 8, y - 8, high + 4], [px + 8, y + 8, high + 4], [px - 8, y + 8, high + 4]].map(p => project(...p))));
    setPath(find('.bg-cart-nose'), line([project(px - 8, y - 13, high + .5), project(px + 8, y - 13, high + .5)]));
    const shadow = project(px, y);
    find('.bg-cart-shadow').setAttribute('cx', shadow[0]);find('.bg-cart-shadow').setAttribute('cy', shadow[1] + 4);
    wheels.forEach((wheel, i) => {const p = project(px + (i < 2 ? -13 : 13), y + (i % 2 ? -11 : 11), 3);wheel.setAttribute('cx', p[0]);wheel.setAttribute('cy', p[1]);});
  }
  function render(time) {
    if (!layout) return;
    const model = sample(time), {local, step, phase} = model;
    figure.dataset.rule = 'deadline';
    figure.dataset.step = Math.floor(step);
    figure.dataset.elapsed = Math.round(time);
    figure.dataset.gate = phase === 'clearance' ? 'clearance' : phase === 'open' ? 'vertical' : 'horizontal';
    const fade = Math.min(hasLooped ? progress(local, 0, 230) : 1, 1 - progress(local, duration - 230, duration));
    dynamic.forEach(node => node.style.opacity = fade);
    drawCart(model.cartY);
    barriers.forEach(gate => {
      const points = barrier(gate.axis, gate.position, gate.axis === 'x' ? model.xOpen : model.yOpen);
      setPath(gate.post, line([points.base, points.hinge]));
      setPath(gate.arm, line([points.hinge, points.tip]));
      gate.hinge.setAttribute('cx', points.hinge[0]);gate.hinge.setAttribute('cy', points.hinge[1]);
    });
    find('.bg-empty-label').style.opacity = 1 - progress(step, model.switchAt, model.switchAt + 1);
    find('.bg-robot-label').style.opacity = 1 - clamp(model.motion * 5);
    const sender = project(18, model.cartY, 23);
    const a = [layout.wx + sender[0] * layout.scale, layout.wy + sender[1] * layout.scale];
    const b = [layout.rx + layout.cardWidth, layout.ry + 64];
    if (layout.mobile) {
      const side = layout.w - 5;
      setPath(messagePath, `M${a}C${side},${a[1] - 30} ${side},${b[1] - 45} ${b}`);
    } else setPath(messagePath, `M${a}C${a[0] - 70},${a[1]} ${b[0] + 75},${b[1]} ${b}`);
    const sending = model.packet >= 0;
    messagePath.style.opacity = sending ? .55 : 0;
    message.style.opacity = sending ? 1 : 0;
    if (sending) {
      const p = messagePath.getPointAtLength(messagePath.getTotalLength() * model.packet);
      message.setAttribute('transform', `translate(${p.x} ${p.y})`);
    }
    find('.bg-report-card').classList.toggle('has-report', model.reportPresent);
    find('.bg-receipt').style.opacity = model.reportPresent ? .45 + .55 * model.freshness : 0;
    const owner = model.reportPresent ? '1 sender · latest report' : model.motion > .4 ? 'Request status' : 'Latest report';
    find('.bg-report-owner').textContent = owner;
    find('.bg-report-value').textContent = model.reportPresent ? 'Waiting' : model.motion > .4 ? 'Served' : 'No reports yet';
    traces.forEach(trace => {
      setPath(trace.progress, `M${x(0)} 0H${x(Math.min(step, 24))}`);
      trace.clearance.style.opacity = step >= 24 ? 1 : .2;
      trace.end.classList.toggle('is-open', step >= 26);
      trace.cursor.setAttribute('transform', `translate(${x(Math.min(step, 26))} 0)`);
      trace.cursor.style.opacity = phase !== 'open' ? .7 : 0;
    });
    find('.bg-deadline-marker').classList.toggle('is-reached', step >= 24);
    find('.bg-rule-title').textContent = 'BG-D · Step ' + Math.floor(step);
    if (phase === lastPhase) return;
    const copy = {
      waiting: ['Deadline active from the start', 'The open corridor is empty'],
      received: ['Report received', 'One sender cannot trigger a switch'],
      clearance: ['Deadline reached at step 24', 'Both directions clear'],
      open: ['Green returns at step 26', 'The robot can cross']
    }[phase];
    find('.bg-receiver-status').textContent = copy[0];
    find('.bg-receiver-reason').textContent = copy[1];
    figure.dataset.stage = phase;
    lastPhase = phase;
  }
  function pause() {if (frame !== null) cancelAnimationFrame(frame);frame = null;}
  function inView() {const b = svg.getBoundingClientRect();return b.height > 0 && b.bottom > 40 && b.top < window.innerHeight - 40;}
  function play() {
    if (frame !== null || document.hidden || manuallyPaused || reducedMotion.matches || !inView()) return;
    figure.dataset.playback = 'playing';startTime = performance.now() - elapsed;frame = requestAnimationFrame(tick);
  }
  function tick(timestamp) {
    elapsed = timestamp - startTime;
    if (elapsed >= duration) {const loops = Math.floor(elapsed / duration);startTime += loops * duration;elapsed %= duration;hasLooped = true;lastPhase = '';}
    if (timestamp - lastDraw >= 32) {render(elapsed);lastDraw = timestamp;}
    frame = requestAnimationFrame(tick);
  }
  function updateToggle() {
    toggle.hidden = reducedMotion.matches;toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.querySelector('span').textContent = manuallyPaused ? 'Resume motion' : 'Pause motion';
    toggle.querySelector('path').setAttribute('d', manuallyPaused ? 'M5 3 12 8 5 13Z' : 'M5 3v10M11 3v10');
  }
  function syncVisibility() {if (inView()) play();else pause();}
  toggle.addEventListener('click', () => {manuallyPaused = !manuallyPaused;if (manuallyPaused) {pause();figure.dataset.playback = 'paused';} else play();updateToggle();});
  new IntersectionObserver(syncVisibility, {rootMargin: '-40px 0px', threshold: 0}).observe(svg);
  window.addEventListener('scroll', syncVisibility, {passive: true});
  document.addEventListener('visibilitychange', () => {if (document.hidden) pause();else play();});
  reducedMotion.addEventListener('change', () => {pause();elapsed = reducedMotion.matches ? 5600 : 0;hasLooped = false;lastPhase = '';render(elapsed);figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';updateToggle();play();});
  if (reducedMotion.matches) elapsed = 5600;
  resize();new ResizeObserver(resize).observe(svg);
  figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';updateToggle();
})();
