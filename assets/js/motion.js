import { proteinPose, proteinSegment } from './protein-shape.js?v=2';

(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const chartResets = new Set();
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const phase = (p, start, end) => ease(clamp((p - start) / (end - start)));
  const ns = 'http://www.w3.org/2000/svg';
  function animate(duration, render, settle) {
    let frame, start;
    const stop = () => { cancelAnimationFrame(frame); running.delete(stop); settle(); };
    if (reduced.matches || document.hidden) { settle(); return stop; }
    running.add(stop);
    const tick = time => {
      if (start === undefined) start = time;
      const p = clamp((time - start) / duration);
      render(p);
      if (p < 1) frame = requestAnimationFrame(tick); else stop();
    };
    frame = requestAnimationFrame(tick);
    return stop;
  }
  function stopAll() { [...running].forEach(stop => stop()); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    stopAll(); chartResets.forEach(reset => reset());
  });
  const place = (circle, x, y) => { circle.setAttribute('cx', x); circle.setAttribute('cy', y); };
  const follow = (circle, path, p) => { const point = path.getPointAtLength(path.getTotalLength() * clamp(p)); place(circle, point.x, point.y); };

  document.querySelectorAll('[data-project-mark]').forEach(svg => {
    let visible = false, frame = null, base = 0, elapsed = 0, lastDraw = -Infinity, cycle = -1;
    let render, duration;
    const fade = p => phase(p, 0, .035) * (1 - phase(p, .965, 1));
    if (svg.dataset.projectMark === 'mood') {
      duration = 7200;
      const route = svg.querySelector('.mark-route'), dot = svg.querySelector('.mark-traveller');
      const approach = document.createElementNS(ns, 'path'); approach.setAttribute('d', 'M14 78H106V62');
      const detour = document.createElementNS(ns, 'path'); detour.setAttribute('d', 'M106 62V78H74V18H106');
      render = p => {
        follow(dot, p < .27 ? approach : detour, p < .27 ? phase(p, .03, .24) : phase(p, .32, .82));
        dot.style.opacity = fade(p);
        const cautious = p >= .27 && p < .77;
        svg.dataset.phase = cautious ? 'caution' : 'seeking';
        route.style.opacity = .2 + .7 * phase(p, .25, .34) * (1 - phase(p, .91, .99));
        svg.querySelector('.mark-ghost').setAttribute('transform', `translate(106 ${44 + 4 * Math.sin(p * Math.PI * 2)})`);
      };
    } else if (svg.dataset.projectMark === 'memory') {
      duration = 14000;
      const group = svg.querySelector('.mark-protein'), backbone = svg.querySelector('.mark-protein-base');
      const segments = [...svg.querySelectorAll('.mark-protein-segment')].map((node, i) => ({node, i, path:node.querySelector('path')}));
      render = p => {
        const bend = .3 + .85 * (.5 - .5 * Math.cos(p * Math.PI * 2));
        const points = proteinPose(bend, .35 + .55 * Math.sin(p * Math.PI * 2));
        const depths = points.map(point => point[2]), low = Math.min(...depths), span = Math.max(...depths) - low;
        segments.forEach(segment => {
          segment.depth = (points[segment.i][2] + points[segment.i + 1][2]) / 2;
          const path = proteinSegment(points, segment.i);
          segment.path.setAttribute('d', path);
          segment.path.style.opacity = .4 + .6 * (segment.depth - low) / span;
        });
        backbone.setAttribute('d', segments.map(segment => segment.path.getAttribute('d')).join(''));
        [...segments].sort((a,b) => a.depth-b.depth).forEach(segment => group.append(segment.node));
      };
    } else {
      duration = 9600;
      const a = svg.querySelector('.mark-agent-a'), b = svg.querySelector('.mark-agent-b');
      const c = svg.querySelector('.mark-agent-c'), d = svg.querySelector('.mark-agent-d');
      const packets = [...svg.querySelectorAll('.mark-packet')];
      render = p => {
        place(a, 12 + 96 * phase(p, .16, .33), 42); place(b, 108 - 96 * phase(p, .35, .52), 54);
        place(c, 54, 10 + 76 * phase(p, .58, .74)); place(d, 66, 86 - 76 * phase(p, .76, .92));
        [a,b,c,d].forEach(agent => { agent.style.opacity = fade(p); });
        packets.forEach((packet, i) => {
          const t = phase(p, .04 + i * .025, .17);
          place(packet, i ? 66 : 54, i ? 86 - 38*t : 10 + 38*t);
          packet.style.opacity = p > .04 && p < .17 ? Math.sin(Math.PI*t) : 0;
        });
        svg.querySelector('.mark-controller').style.opacity = p > .53 && p < .92 ? 1 : .5;
      };
    }
    const pause = () => { cancelAnimationFrame(frame); frame = null; svg.dataset.motion = reduced.matches ? 'still' : 'paused'; };
    const tick = now => {
      elapsed = now - base;
      if (now - lastDraw >= 32) {
        render((elapsed % duration) / duration); lastDraw = now;
        const nextCycle = Math.floor(elapsed / duration);
        if (nextCycle !== cycle) { cycle = nextCycle; svg.dataset.cycle = String(cycle); }
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (!visible || document.hidden || reduced.matches) { pause(); if (reduced.matches) render(.2); return; }
      if (frame !== null) return;
      base = performance.now() - elapsed; svg.dataset.motion = 'playing'; frame = requestAnimationFrame(tick);
    };
    render(.2); svg.dataset.motion = 'paused';
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; sync();
    }, {threshold:.1}).observe(svg);
  });

  const nav = document.querySelector('.section-nav');
  if (nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map(link => document.getElementById(link.hash.slice(1)));
    let current = -1, frame;
    const move = index => {
      if (current !== index) {
        links.forEach((link, i) => { if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
        current = index;
      }
    };
    const update = () => {
      frame = null;
      const threshold = nav.getBoundingClientRect().bottom + 50;
      let index = 0;
      sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= threshold) index = i; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) index = links.length - 1;
      move(index);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule);
    new ResizeObserver(schedule).observe(nav);
    document.fonts.ready.then(schedule);
    update();
  }

  // Inline only the existing line figures. Their paths, markers, labels and full-size files stay intact.
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  let chartNumber = 0;
  const states = new Map();
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = states.get(entry.target);
      if (!state) return;
      if (!entry.isIntersecting) { if (state.started) state.stop(); return; }
      if (state.started) return;
      state.started = true;
      entry.target.dataset.reveal = 'playing';
      state.stop = animate(1500, p => {
        state.clips.forEach((clip, i) => { clip.rect.setAttribute('width', clip.width * phase(p, i * .035, 1)); });
      }, state.finish);
    });
  }, {threshold:.25});
  const prepareObserver = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target; prepareObserver.unobserve(img);
      let svg;
      try {
        const url = new URL(img.getAttribute('src'), location.href);
        if (url.origin !== location.origin || !url.pathname.endsWith('.svg')) return;
        const response = await fetch(url);
        if (!response.ok || reduced.matches) return;
        const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        if (parsed.querySelector('parsererror') || reduced.matches) return;
        svg = document.importNode(parsed.documentElement, true);
        const traces = [...svg.querySelectorAll('path[stroke]')].filter(path => {
          const d = path.getAttribute('d') || '';
          return (d.match(/[Mm]/g) || []).length === 1 && (d.match(/[Ll]/g) || []).length >= 3 && !/[CcZz]/.test(d);
        });
        if (!traces.length) return;
        const prefix = `paper-plot-${chartNumber++}-`, ids = new Map();
        svg.querySelectorAll('[id]').forEach(node => { const id = node.id; ids.set(id, prefix + id); node.id = prefix + id; });
        svg.querySelectorAll('*').forEach(node => [...node.attributes].forEach(attribute => {
          let value = attribute.value;
          if (value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
          value = value.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${ids.get(id) || id})`);
          if (value !== attribute.value) node.setAttributeNS(attribute.namespaceURI, attribute.name, value);
        }));
        svg.setAttribute('class', 'paper-plot'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', img.alt);
        svg.setAttribute('focusable', 'false'); svg.dataset.reveal = 'ready';
        img.replaceWith(svg);
        const defs = document.createElementNS(ns, 'defs'); svg.prepend(defs);
        const clips = traces.map((path, i) => {
          const box = path.getBBox(), id = `${prefix}reveal-${i}`;
          const clip = document.createElementNS(ns, 'clipPath'), rect = document.createElementNS(ns, 'rect');
          clip.id = id; clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
          rect.setAttribute('x', box.x - 3); rect.setAttribute('y', box.y - 3);
          rect.setAttribute('width', 0); rect.setAttribute('height', box.height + 6);
          clip.append(rect); defs.append(clip); path.setAttribute('clip-path', `url(#${id})`);
          return {path, rect, width:box.width + 6};
        });
        const finish = () => {
          clips.forEach(clip => clip.path.removeAttribute('clip-path')); defs.remove();
          svg.dataset.reveal = 'still'; chartResets.delete(finish); revealObserver.unobserve(svg); states.delete(svg);
        };
        const state = {clips, finish, started:false, stop:finish}; states.set(svg, state); chartResets.add(finish);
        if (reduced.matches) finish(); else revealObserver.observe(svg);
      } catch (_) { if (svg?.isConnected) svg.replaceWith(img); }
    });
  }, {rootMargin:'300px 0px'});
  document.querySelectorAll('img[data-chart-reveal]').forEach(img => prepareObserver.observe(img));
})();
