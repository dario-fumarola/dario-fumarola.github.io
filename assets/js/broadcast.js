(() => {
  const duration = 9400;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const progress = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const project = (x, y, z = 0) => [270 + (x - y) * .86, 155 + (x + y) * .43 - z];
  // The clock runs through report arrivals; the switch and clearance receive a slow beat.
  function environmentStep(time) {
    if (time < 2000) return time * 6 / 2000;
    if (time < 4700) return 6 + (time - 2000) / 150;
    if (time < 5400) return 24;
    return Math.min(26, 24 + (time - 5400) / 300);
  }
  function sample(time) {
    const step = environmentStep(time);
    const agents = [
      {id: 'A', axis: 'x', x: -116 + 268 * progress(time, 100, 980), y: -18, heading: Math.PI / 2},
      {id: 'B', axis: 'x', x: 132 - 284 * progress(time, 1030, 1910), y: 18, heading: -Math.PI / 2},
      {id: 'C', axis: 'y', x: 18, y: 110 - 262 * progress(time, 6110, 7310), heading: 0},
      {id: 'D', axis: 'y', x: -18, y: -110 + 262 * progress(time, 7380, 8580), heading: Math.PI}
    ].map(a => {
      const position = a.axis === 'x' ? a.x : a.y;
      const served = a.id === 'A' ? position > 52 : a.id === 'B' ? position < -52 : a.id === 'C' ? position < -52 : position > 52;
      const waiting = a.id === 'C' ? a.y === 110 : a.id === 'D' ? a.y === -110 : false;
      return {...a, served, waiting};
    });
    const phase = step < 6 ? 'waiting' : step < 24 ? 'received' : step < 26 ? 'clearance' : 'open';
    const reports = Math.min(Math.floor(step / 6), 4), age = step - reports * 6;
    const packets = ['C', 'D'].map((id, i) => {
      const cyclePart = step % 6, start = 3 + i * .6;
      return {id, progress: cyclePart >= start && step < 24 ? (cyclePart - start) / (6 - start) : -1};
    });
    return {local: time, step, switchAt: 24, openAt: 26, phase, reports, agents, packets,
      freshness: Math.exp(-age / 6),
      xOpen: 1 - progress(time, 4700, 4980), yOpen: progress(time, 6000, 6280)};
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
  const carts = [...figure.querySelectorAll('.bg-cart')].map(node => ({node, id: node.dataset.agent,
    top: node.querySelector('.bg-cart-top'), east: node.querySelector('.bg-cart-side-east'), south: node.querySelector('.bg-cart-side-south'), load: node.querySelector('.bg-cart-load'), nose: node.querySelector('.bg-cart-nose'), shadow: node.querySelector('.bg-cart-shadow'), label: node.querySelector('.bg-cart-id'), wheels: [...node.querySelectorAll('.bg-cart-wheels circle')]}));
  const records = [...figure.querySelectorAll('.bg-report')].map(node => ({node, id: node.dataset.agent, card: node.querySelector('.bg-report-card'), value: node.querySelector('.bg-report-value'), receipt: node.querySelector('.bg-receipt')}));
  const messages = [...figure.querySelectorAll('.bg-message-flow')].map(node => ({node, id: node.dataset.agent, path: node.querySelector('.bg-message-path'), packet: node.querySelector('.bg-message')}));
  const traces = ['deadline'].map(rule => {
    const node = find('.bg-trace-' + rule);
    return {rule, node, base: node.querySelector('.bg-trace-base'), progress: node.querySelector('.bg-trace-progress'), clearance: node.querySelector('.bg-trace-clearance'), end: node.querySelector('.bg-trace-end'), number: node.querySelector('.bg-trace-number'), cursor: node.querySelector('.bg-trace-cursor'), label: node.querySelector('.bg-trace-label')};
  });
  const dynamic = [...figure.querySelectorAll('.bg-carts,.bg-receiver,.bg-rule-title,.bg-message-flow,.bg-gates-back,.bg-gates-front')];
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
    const ry = mobile ? wy + 265 * scale + 18 : 72;
    const ty = mobile ? ry + 210 : wy + 265 * scale + 28;
    const traceStart = mobile ? 4 : 142, traceLength = w - traceStart - (mobile ? 42 : 62);
    const rows = mobile ? [43] : [37];
    const height = ty + (mobile ? 74 : 68);
    layout = {w, mobile, scale, wx, wy, rx, ry, cardWidth, traceStart, traceLength, ty, rows};
    svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
    svg.style.height = `${height}px`;
    find('.bg-world').setAttribute('transform', `translate(${wx} ${wy}) scale(${scale})`);
    find('.bg-receiver').setAttribute('transform', `translate(${rx} ${ry})`);
    records.forEach(record => {record.card.setAttribute('width', cardWidth);record.receipt.setAttribute('cx', cardWidth - 18);});
    find('.bg-rule-title').setAttribute('x', mobile ? w / 2 : wx + 270 * scale);
    find('.bg-traces').setAttribute('transform', `translate(0 ${ty})`);
    find('.bg-traces-title').setAttribute('x', mobile ? 4 : 16);
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
  function drawCart(cart, agent) {
    const {x: px, y, axis, heading} = agent, a = axis === 'x' ? 18 : 13, b = axis === 'x' ? 13 : 18, low = 4, high = 16;
    cart.top.setAttribute('points', polygon([[px - a, y - b, high], [px + a, y - b, high], [px + a, y + b, high], [px - a, y + b, high]].map(p => project(...p))));
    cart.east.setAttribute('points', polygon([[px + a, y - b, low], [px + a, y + b, low], [px + a, y + b, high], [px + a, y - b, high]].map(p => project(...p))));
    cart.south.setAttribute('points', polygon([[px - a, y + b, low], [px + a, y + b, low], [px + a, y + b, high], [px - a, y + b, high]].map(p => project(...p))));
    cart.load.setAttribute('points', polygon([[px - 8, y - 8, high + 4], [px + 8, y - 8, high + 4], [px + 8, y + 8, high + 4], [px - 8, y + 8, high + 4]].map(p => project(...p))));
    const rotate = (u, v, z) => project(px + u * Math.cos(heading) - v * Math.sin(heading), y + u * Math.sin(heading) + v * Math.cos(heading), z);
    setPath(cart.nose, line([rotate(-8, -13, high + .5), rotate(8, -13, high + .5)]));
    const shadow = project(px, y), label = project(px, y, 21);
    cart.shadow.setAttribute('cx', shadow[0]);cart.shadow.setAttribute('cy', shadow[1] + 4);
    cart.label.setAttribute('x', label[0]);cart.label.setAttribute('y', label[1]);
    cart.wheels.forEach((wheel, i) => {const p = rotate(i < 2 ? -13 : 13, i % 2 ? -11 : 11, 3);wheel.setAttribute('cx', p[0]);wheel.setAttribute('cy', p[1]);});
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
    [...model.agents].sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach(agent => {
      const cart = carts.find(c => c.id === agent.id);drawCart(cart, agent);cart.node.parentNode.appendChild(cart.node);
    });
    barriers.forEach(gate => {
      const points = barrier(gate.axis, gate.position, gate.axis === 'x' ? model.xOpen : model.yOpen);
      setPath(gate.post, line([points.base, points.hinge]));
      setPath(gate.arm, line([points.hinge, points.tip]));
      gate.hinge.setAttribute('cx', points.hinge[0]);gate.hinge.setAttribute('cy', points.hinge[1]);
    });
    messages.forEach((flow, i) => {
      const agent = model.agents.find(a => a.id === flow.id), sender = project(agent.x, agent.y, 23);
      const a = [layout.wx + sender[0] * layout.scale, layout.wy + sender[1] * layout.scale];
      const b = [layout.rx + layout.cardWidth, layout.ry + 62 + i * 49];
      if (layout.mobile) {
        const side = layout.w - 5;
        setPath(flow.path, `M${a}C${side},${a[1] - 30} ${side},${b[1] - 45} ${b}`);
      } else setPath(flow.path, `M${a}C${a[0] - 70},${a[1]} ${b[0] + 75},${b[1]} ${b}`);
      const packet = model.packets[i].progress, sending = packet >= 0;
      flow.path.style.opacity = sending ? .45 : 0;flow.packet.style.opacity = sending ? 1 : 0;
      if (sending) {const p = flow.path.getPointAtLength(flow.path.getTotalLength() * packet);flow.packet.setAttribute('transform', `translate(${p.x} ${p.y})`);}
    });
    records.forEach(record => {
      const agent = model.agents.find(a => a.id === record.id), received = model.reports > 0;
      record.card.classList.toggle('has-report', received && !agent.served);
      record.receipt.style.opacity = received && !agent.served ? .45 + .55 * model.freshness : 0;
      record.value.textContent = agent.served ? 'Served' : !agent.waiting ? 'Crossing' : received ? 'Waiting' : 'No report yet';
    });
    traces.forEach(trace => {
      setPath(trace.progress, `M${x(0)} 0H${x(Math.min(step, 24))}`);
      trace.clearance.style.opacity = step >= 24 ? 1 : .2;
      trace.end.classList.toggle('is-open', step >= 26);
      trace.cursor.setAttribute('transform', `translate(${x(Math.min(step, 26))} 0)`);
      trace.cursor.style.opacity = phase !== 'open' ? .7 : 0;
    });
    find('.bg-deadline-marker').classList.toggle('is-reached', step >= 24);
    find('.bg-rule-title').textContent = phase === 'open' ? 'North–south · green' : phase === 'clearance' ? 'Clearance · both closed' : 'East–west · green';
    if (phase === lastPhase) return;
    const copy = {
      waiting: ['A and B have the crossing', 'C and D wait for their turn'],
      received: ['Two senders · reports refreshed', 'Evidence stays below the threshold'],
      clearance: ['Deadline reached at step 24', 'Both directions close for clearance'],
      open: ['C and D get the crossing', 'One agent enters at a time']
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
  reducedMotion.addEventListener('change', () => {pause();elapsed = reducedMotion.matches ? 6750 : 0;hasLooped = false;lastPhase = '';render(elapsed);figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';updateToggle();play();});
  if (reducedMotion.matches) elapsed = 6750;
  resize();new ResizeObserver(resize).observe(svg);
  figure.dataset.playback = reducedMotion.matches ? 'static' : 'ready';updateToggle();
})();
