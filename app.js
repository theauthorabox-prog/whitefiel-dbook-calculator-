(() => {
  'use strict';

  /* ---------- Site config ---------- */
  const CONFIG = {
    whatsapp: '2348131513534', // WhatsApp only, used by the order and contact forms
  };
  const whatsappLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

  /* Pricing, in Naira. Quantity picks the tier; every copy pays the base
     (cover & binding) plus a rate per page. Text-page rate is the paper rate
     minus the tier discount. */
  const PRICING = {
    minCopies: 15,
    paper: { white: 9, cream: 12 },
    imagePage: 15,
    colourPage: 30,
    tiers: [
      { min: 15, max: 100, base: 250, discount: 0 },
      { min: 101, max: 300, base: 225, discount: 2 },
      { min: 301, max: 600, base: 190, discount: 4 },
      { min: 601, max: Infinity, base: 175, discount: 5 },
    ],
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const naira = (n) => '₦' + Math.round(n).toLocaleString('en-NG');

  /* ---------- Animated dot field ---------- */
  const TAU = Math.PI * 2;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // Dot colour by vertical position: deep red on wine, pale in the middle, orange again on white.
  const HERO_STOPS = [
    [0.00, [196, 44, 52, 0.45]],
    [0.30, [238, 92, 80, 0.70]],
    [0.52, [255, 192, 160, 0.85]],
    [0.70, [255, 176, 112, 0.80]],
    [0.86, [236, 104, 48, 0.55]],
    [1.00, [236, 104, 48, 0.00]],
  ];
  const CTA_STOPS = [
    [0.00, [255, 150, 120, 0.38]],
    [1.00, [255, 150, 120, 0.20]],
  ];
  const FOOTER_STOPS = [
    [0.00, [214, 70, 66, 0.50]],
    [1.00, [170, 34, 44, 0.10]],
  ];
  function colorAt(stops, y) {
    for (let i = 1; i < stops.length; i++) {
      if (y <= stops[i][0]) {
        const [y0, c0] = stops[i - 1], [y1, c1] = stops[i];
        const t = (y - y0) / (y1 - y0);
        return `rgba(${c0.slice(0, 3).map((v, k) => Math.round(lerp(v, c1[k], t))).join(',')},${lerp(c0[3], c1[3], t).toFixed(3)})`;
      }
    }
    const c = stops[stops.length - 1][1];
    return `rgba(${c.join(',')})`;
  }

  /* ---------- Dot shapes (home hero) ----------
     Each shape is a 0..1 value per grid dot. The mic and book are drawn once to an
     offscreen canvas and sampled; the globe is computed every frame so it can spin. */
  function drawMic(c) {
    c.fillStyle = c.strokeStyle = '#fff';
    c.lineCap = 'round';
    // Capsule head
    const x = 0.5, top = 0.07, bottom = 0.53, r = 0.135;
    c.beginPath();
    c.arc(x, top + r, r, Math.PI, 0);
    c.lineTo(x + r, bottom - r);
    c.arc(x, bottom - r, r, 0, Math.PI);
    c.closePath();
    c.fill();
    // Grille slots
    c.globalCompositeOperation = 'destination-out';
    c.lineWidth = 0.022;
    for (let y = 0.17; y < 0.46; y += 0.07) { c.beginPath(); c.moveTo(x - 0.07, y); c.lineTo(x + 0.07, y); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    // Holder, stem and base
    c.lineWidth = 0.045;
    c.beginPath(); c.arc(x, 0.37, 0.215, -0.12, Math.PI + 0.12); c.stroke();
    c.beginPath(); c.moveTo(x, 0.6); c.lineTo(x, 0.81); c.stroke();
    c.lineWidth = 0.05;
    c.beginPath(); c.moveTo(x - 0.15, 0.85); c.lineTo(x + 0.15, 0.85); c.stroke();
  }

  function drawBook(c) {
    c.fillStyle = c.strokeStyle = '#fff';
    c.lineCap = c.lineJoin = 'round';
    const page = (dir) => {
      // dir = -1 for the left page, 1 for the right page (mirrored around x = 0.5)
      const X = (v) => 0.5 + dir * v;
      c.beginPath();
      c.moveTo(X(0.02), 0.36);
      c.bezierCurveTo(X(0.1), 0.27, X(0.24), 0.22, X(0.45), 0.22);
      c.lineTo(X(0.45), 0.7);
      c.bezierCurveTo(X(0.24), 0.7, X(0.1), 0.74, X(0.02), 0.82);
      c.closePath();
      c.fill();
      // Lines of text, following the curve of the page
      c.globalCompositeOperation = 'destination-out';
      c.lineWidth = 0.03;
      for (let i = 0; i < 4; i++) {
        const b = 0.32 + i * 0.09;
        c.beginPath();
        c.moveTo(X(0.09), b + 0.055);
        c.bezierCurveTo(X(0.15), b + 0.01, X(0.25), b - 0.015, X(0.39), b - 0.015);
        c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    };
    page(-1);
    page(1);
    // Cover, peeking out below the pages
    c.lineWidth = 0.032;
    c.beginPath();
    c.moveTo(0.03, 0.7);
    c.lineTo(0.03, 0.76);
    c.bezierCurveTo(0.26, 0.76, 0.4, 0.8, 0.5, 0.89);
    c.bezierCurveTo(0.6, 0.8, 0.74, 0.76, 0.97, 0.76);
    c.lineTo(0.97, 0.7);
    c.stroke();
  }

  const GLOBE_TILT = 0, GT_C = Math.cos(GLOBE_TILT), GT_S = Math.sin(GLOBE_TILT);
  const PARALLELS = [-0.62, 0, 0.62];
  function globeValue(d, time, lw) {
    const line = (dist) => 1 - smooth(lw * 0.35, lw, dist);
    const u = (d.u - 0.5) / 0.41, v = (d.v - 0.5) / 0.41;
    const r = Math.hypot(u, v);
    if (r > 1 + lw) return 0;
    const ring = line(Math.abs(r - 1));
    if (r >= 1) return ring;
    const uu = u * GT_C - v * GT_S, vv = u * GT_S + v * GT_C;
    const z = Math.sqrt(Math.max(0, 1 - uu * uu - vv * vv));
    const lat = Math.asin(Math.max(-1, Math.min(1, vv)));
    const lon = Math.atan2(uu, z) + time * 0.4;
    // Meridians every 45 degrees, spinning; faded near the edge where they bunch up
    const step = Math.PI / 4;
    const fm = ((lon / step) % 1 + 1) % 1;
    const mer = line(Math.min(fm, 1 - fm) * step * z) * smooth(0.08, 0.4, z);
    // Equator and two parallels
    let par = 0;
    for (const p of PARALLELS) par = Math.max(par, line(Math.abs(lat - p) * Math.cos(lat)));
    return Math.max(ring, mer, par, 0.08 + 0.1 * z);
  }

  function createShaper(cfg) {
    const order = cfg.order;
    const n = order.length;
    let idx = 0, next = 0, phase = 'hold', phaseT = 0, clock = 0;
    let dots = [], lw = 0.1;
    const ANG = 180;
    const profiles = {};

    // Walk outward from the centre at each angle and keep the furthest filled pixel.
    function outlineProfile(data, N) {
      const prof = new Float32Array(ANG);
      for (let a = 0; a < ANG; a++) {
        const th = (a / ANG) * TAU - Math.PI;
        const cx = Math.cos(th), cy = Math.sin(th);
        let last = 0.06 * N;
        for (let step = 0; step < N * 0.72; step++) {
          const x = Math.round(N / 2 + cx * step), y = Math.round(N / 2 + cy * step);
          if (x < 0 || y < 0 || x >= N || y >= N) break;
          if (data[(y * N + x) * 4 + 3] > 90) last = step;
        }
        prof[a] = last / N;
      }
      // Soften notches (e.g. between the mic stand and holder) with a few circular blurs
      for (let pass = 0; pass < 3; pass++) {
        const copy = prof.slice();
        for (let a = 0; a < ANG; a++) {
          let sum = 0;
          for (let k = -3; k <= 3; k++) sum += copy[(a + k + ANG) % ANG];
          prof[a] = sum / 7;
        }
      }
      return prof;
    }

    function build(rows, box, cell) {
      dots = [];
      if (!box) return;
      const N = Math.max(64, Math.min(720, Math.round(box.size)));
      const masks = {};
      for (const [name, fn] of [['mic', drawMic], ['book', drawBook]]) {
        const off = document.createElement('canvas');
        off.width = off.height = N;
        const c = off.getContext('2d');
        c.setTransform(N, 0, 0, N, 0, 0);
        fn(c);
        masks[name] = c.getImageData(0, 0, N, N).data;
        profiles[name] = outlineProfile(masks[name], N);
      }
      profiles.globe = new Float32Array(ANG).fill(0.42);
      const sampleR = Math.max(1, Math.round((cell * 0.3) * N / box.size));
      const sample = (data, px, py) => {
        let sum = 0, cnt = 0;
        for (const [ox, oy] of [[0, 0], [sampleR, 0], [-sampleR, 0], [0, sampleR], [0, -sampleR]]) {
          const x = Math.round(px + ox), y = Math.round(py + oy);
          if (x >= 0 && y >= 0 && x < N && y < N) sum += data[(y * N + x) * 4 + 3] / 255;
          cnt++;
        }
        return sum / cnt;
      };
      lw = (cell * 1.35) / (box.size * 0.41);
      for (const row of rows) {
        for (const d of row) {
          const u = (d.x - box.x) / box.size, v = (d.y - box.y) / box.size;
          const rr = Math.hypot(u - 0.5, v - 0.5);
          d.region = smooth(0.62, 0.3, rr);
          d.ru = rr;
          d.ab = Math.floor(((Math.atan2(v - 0.5, u - 0.5) + Math.PI) / TAU) * ANG) % ANG;
          if (u < -0.02 || v < -0.02 || u > 1.02 || v > 1.02) continue;
          d.u = u; d.v = v;
          d.m = { mic: sample(masks.mic, u * N, v * N), book: sample(masks.book, u * N, v * N) };
          d.delay = Math.min(1, Math.max(0, v * 0.75 + Math.random() * 0.25));
          d.seed = Math.random() * TAU;
          dots.push(d);
        }
      }
    }

    const value = (name, d) => (name === 'globe' ? globeValue(d, clock, lw) : d.m[name]);

    const outline = (d, st) => {
      const a = profiles[st.from][d.ab];
      if (st.from === st.to) return a;
      return a + (profiles[st.to][d.ab] - a) * smooth(0, 1, st.p);
    };

    return {
      build,
      get dots() { return dots; },
      value,
      outline,
      tick(dt, auto) {
        clock += dt; phaseT += dt;
        if (phase === 'hold' && auto && phaseT >= cfg.hold) this.goTo((idx + 1) % n);
        else if (phase === 'morph' && phaseT >= cfg.morph) { idx = next; phase = 'hold'; phaseT = 0; }
        return { from: order[idx], to: order[phase === 'morph' ? next : idx], p: phase === 'morph' ? phaseT / cfg.morph : 1, time: clock };
      },
      goTo(i, instant) {
        if (phase === 'morph') idx = next;
        if (i === idx && phase === 'hold') return;
        next = i; phaseT = 0;
        if (instant) { idx = i; phase = 'hold'; } else phase = 'morph';
        cfg.onChange && cfg.onChange(i);
      },
    };
  }

  function dotField(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    let W = 0, H = 0, dpr = 1, rows = [], rowColors = [], cell = 14, maxR = 6;
    let running = false, raf = 0, start = performance.now(), last = start;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const shaper = opts.shapes ? createShaper(opts.shapes) : null;

    // Rounded box around the hero headline and subtext (ignoring the entrance animation offset).
    function textZone() {
      const els = host.querySelectorAll('.hero-copy h1, .hero-copy p');
      if (!els.length) return null;
      const hr = host.getBoundingClientRect();
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      els.forEach((el) => {
        const e = el.getBoundingClientRect();
        l = Math.min(l, e.left); t = Math.min(t, e.top); r = Math.max(r, e.right); b = Math.max(b, e.bottom);
      });
      const tf = getComputedStyle(host.querySelector('.hero-copy')).transform;
      const shift = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).m42 : 0;
      return {
        cx: (l + r) / 2 - hr.left, cy: (t + b) / 2 - hr.top - shift,
        hw: (r - l) / 2 + 30, hh: (b - t) / 2 + 22,
      };
    }

    function build() {
      const rect = host.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cell = opts.cell ? opts.cell(W) : W < 640 ? 12 : W < 1100 ? 14 : 15;
      maxR = cell * 0.4;
      const cols = Math.ceil(W / cell) + 1, nRows = Math.ceil(H / cell) + 1;
      const ox = (W - (cols - 1) * cell) / 2, oy = cell / 2;
      const L = opts.layout ? opts.layout(W, H, host) : { origin: [W / 2, H * 0.46] };
      const tz = opts.clearing ? textZone() : null;

      const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([px, py]) => Math.hypot(px - L.origin[0], py - L.origin[1])));
      rows = []; rowColors = [];
      for (let r = 0; r < nRows; r++) {
        const y = oy + r * cell;
        rowColors.push(colorAt(opts.stops, Math.min(1, y / H)));
        const row = [];
        for (let c = 0; c < cols; c++) {
          const x = ox + c * cell;
          const dc = Math.hypot(x - L.origin[0], y - L.origin[1]);
          // Super faded (not empty) around the text: a rounded superellipse with a long, soft falloff,
          // so there is no visible edge.
          let clear = 1;
          if (tz) {
            const ex = Math.abs(x - tz.cx) / tz.hw, ey = Math.abs(y - tz.cy) / tz.hh;
            const de = Math.pow(ex ** 4 + ey ** 4, 0.25);
            clear = 0.12 + 0.88 * smooth(0.85, 1.7, de);
          }
          row.push({ x, y, dc, clear, region: 0, ru: 0, ab: 0, lr: Math.log(dc + 30), depth: Math.min(1, dc / far) });
        }
        rows.push(row);
      }
      if (shaper) shaper.build(rows, L.box, cell);
      if (!running) draw(reduceMotion ? 0 : (performance.now() - start) / 1000, !reduceMotion, 0);
    }

    function mouseBoost(d) {
      const mdx = d.x - mouse.x, mdy = d.y - mouse.y;
      const m2 = mdx * mdx + mdy * mdy;
      return m2 < 40000 ? maxR * 0.7 * Math.exp(-m2 / 9000) : 0;
    }

    function draw(t, intro, dt) {
      ctx.clearRect(0, 0, W, H);
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      const front = intro && opts.intro ? t * 1100 - 120 : Infinity;
      const reveal = (d) => {
        if (front === Infinity) return 1;
        const k = Math.min(1, Math.max(0, (front - d.dc) / 220));
        return 1 - (1 - k) * (1 - k) * (1 - k);
      };
      const ts = t * opts.speed;
      const st = shaper ? shaper.tick(dt, !reduceMotion) : null;

      // Background field
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        ctx.fillStyle = rowColors[r];
        ctx.beginPath();
        for (let i = 0; i < row.length; i++) {
          const d = row[i];
          const drift = (
            Math.sin(d.x * 0.011 + ts * 0.8) +
            Math.sin(d.y * 0.017 - ts * 0.55) +
            Math.sin((d.x - d.y) * 0.0065 + ts * 0.35) +
            Math.sin(d.dc * 0.021 - ts * 1.15)
          ) * 0.25;
          let n = drift, persp = 1;
          if (opts.rings) {
            // Rings spaced on a log scale: tight at the centre, wider and faster as they
            // travel out, like moving forward through a tunnel toward the viewer.
            const phase = st ? Math.log(d.ru / shaper.outline(d, st) + 0.06) : d.lr;
            const ring = Math.sin(phase * 10.5 - ts * 1.7);
            n = 0.8 * ring + 0.2 * drift;
            persp = 0.72 + 0.4 * d.depth;
          }
          const v = 0.5 + 0.5 * n;
          let rad = maxR * (0.22 + 0.78 * v * v) * persp * d.clear * (1 - 0.4 * d.region);
          rad += mouseBoost(d) * d.clear;
          rad *= reveal(d);
          if (rad > maxR) rad = maxR;
          if (rad < 0.35) continue;
          ctx.moveTo(d.x + rad, d.y);
          ctx.arc(d.x, d.y, rad, 0, TAU);
        }
        ctx.fill();
      }

      // Shape layer: the same grid positions, lit a little brighter where the current shape is
      if (!shaper) return;
      const morphing = st.from !== st.to;
      ctx.fillStyle = 'rgba(255, 236, 224, 0.72)';
      ctx.beginPath();
      for (const d of shaper.dots) {
        const a = shaper.value(st.from, d);
        let s = a;
        if (morphing) {
          const b = shaper.value(st.to, d);
          const k = smooth(0, 1, (st.p - d.delay * 0.55) / 0.42);
          s = a + (b - a) * k + 4 * k * (1 - k) * Math.max(a, b) * 0.25;
        }
        if (s < 0.06) continue;
        const pulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(st.time * 2.2 - (d.u + d.v) * 7 + d.seed * 0.15));
        let rad = (maxR * 0.62 * Math.min(1, s) * pulse + mouseBoost(d) * 0.3 * Math.min(1, s * 2)) * d.clear;
        rad *= reveal(d);
        if (rad > maxR * 0.7) rad = maxR * 0.7;
        if (rad < 0.4) continue;
        ctx.moveTo(d.x + rad, d.y);
        ctx.arc(d.x, d.y, rad, 0, TAU);
      }
      ctx.fill();
    }

    function loop(now) {
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(t, t < 3, dt);
      raf = requestAnimationFrame(loop);
    }
    function play() {
      if (running || reduceMotion) return;
      running = true; last = performance.now();
      host.classList.remove('is-paused');
      raf = requestAnimationFrame(loop);
    }
    function pause() { running = false; cancelAnimationFrame(raf); host.classList.add('is-paused'); }

    if (opts.interactive && !reduceMotion) {
      host.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = canvas.getBoundingClientRect();
        mouse.tx = e.clientX - rect.left; mouse.ty = e.clientY - rect.top;
        if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      });
      host.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -9999; mouse.x = mouse.y = -9999; });
    }

    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible && !document.hidden ? play() : pause();
    }).observe(host);
    document.addEventListener('visibilitychange', () => (document.hidden || !visible ? pause() : play()));
    new ResizeObserver(build).observe(host);
    const copy = host.querySelector('.hero-copy');
    if (copy) copy.addEventListener('animationend', build);
    if (document.fonts) document.fonts.ready.then(build);
    build();
  }

  /* Home hero: the headline stays centred; the shape sits large and quiet behind it. */
  function homeLayout(W, H) {
    const cx = W / 2, cy = H * 0.46;
    const size = W >= 900 ? Math.min(W * 0.62, H * 0.78, 660) : Math.min(W * 0.96, H * 0.56);
    return {
      origin: [cx, cy],
      box: { x: cx - size / 2, y: cy - size / 2, size },
    };
  }

  const fields = [
    ['#field', { stops: HERO_STOPS, clearing: true, intro: true, interactive: true, speed: 1 }],
    ['.cta-field', { stops: CTA_STOPS, clearing: false, intro: false, interactive: true, speed: 0.7 }],
    ['#footer-field', { stops: FOOTER_STOPS, clearing: false, intro: false, interactive: true, speed: 0.6 }],
  ];

  // Home hero: smaller dots, and the mic, book and globe drift in and out of the field.
  if ($('.hero[data-shapes]')) {
    fields[0][1] = {
      ...fields[0][1],
      cell: (w) => (w < 640 ? 11 : w < 1100 ? 12 : 13),
      layout: homeLayout,
      rings: true,
      shapes: { order: ['mic', 'book', 'globe'], hold: 4.2, morph: 2 },
    };
  }

  fields.forEach(([sel, opts]) => document.querySelectorAll(sel).forEach((el) => dotField(el, opts)));

  /* ---------- Top bar ---------- */
  const topbar = $('#topbar');
  const hero = $('.hero');
  const onScroll = () => topbar.classList.toggle('is-solid', topbar.classList.contains('is-open') || window.scrollY > hero.offsetHeight * 0.42);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menu-btn');
  const setMenu = (open) => {
    topbar.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) topbar.classList.add('is-solid'); else onScroll();
  };
  menuBtn.addEventListener('click', () => setMenu(!topbar.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && topbar.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  $('#nav').addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const siblings = [...e.target.parentElement.children];
      e.target.style.transitionDelay = siblings.indexOf(e.target) * 80 + 'ms';
      e.target.classList.add('is-in');
      revealer.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  /* ---------- Statement tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const target = document.getElementById(group.dataset.tabs);
    const tabs = group.querySelectorAll('.pill');
    tabs.forEach((pill) => pill.addEventListener('click', () => {
      if (pill.classList.contains('is-active')) return;
      tabs.forEach((p) => { p.classList.toggle('is-active', p === pill); p.setAttribute('aria-selected', p === pill); });
      target.classList.add('is-swapping');
      setTimeout(() => { target.textContent = pill.dataset.text; target.classList.remove('is-swapping'); }, reduceMotion ? 0 : 220);
    }));
  });

  /* ---------- Features filter ---------- */
  document.querySelectorAll('[data-filter]').forEach((bar) => {
    const groups = document.getElementById(bar.dataset.filter).querySelectorAll('.fgroup');
    const buttons = bar.querySelectorAll('.pill');
    buttons.forEach((btn) => btn.addEventListener('click', () => {
      const key = btn.dataset.group;
      buttons.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
      groups.forEach((g) => {
        const show = key === 'all' || g.dataset.group === key;
        g.hidden = !show;
        g.classList.remove('is-entering');
        if (show && !reduceMotion) { void g.offsetWidth; g.classList.add('is-entering'); }
      });
    }));
  });

  /* ---------- Contact form (sends via WhatsApp) ---------- */
  const messageForm = $('#message-form');
  if (messageForm) {
    const err = $('#message-error');
    messageForm.addEventListener('input', (e) => {
      const f = e.target.closest('.field');
      if (f && e.target.checkValidity()) f.classList.remove('is-invalid');
      err.hidden = true;
    });
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstBad = null;
      messageForm.querySelectorAll('[required]').forEach((input) => {
        const bad = !input.value.trim() || !input.checkValidity();
        input.closest('.field').classList.toggle('is-invalid', bad);
        if (bad && !firstBad) firstBad = input;
      });
      if (firstBad) { err.hidden = false; firstBad.focus(); return; }
      err.hidden = true;
      const v = (n) => messageForm.elements[n].value.trim();
      window.open(whatsappLink(`Hello WhitefieldHouse, my name is ${v('name')} (${v('email')}).\n\n${v('message')}`), '_blank', 'noopener');
    });
  }

  /* ---------- Pricing table ---------- */
  const tierLabel = (t) => (t.max === Infinity ? `${t.min.toLocaleString()}+ copies` : `${t.min} to ${t.max} copies`);
  const tbody = $('#tiers tbody');
  if (tbody) tbody.innerHTML = PRICING.tiers.map((t) => `
    <tr>
      <td>${tierLabel(t)}</td>
      <td>${naira(t.base)}</td>
      <td>${naira(PRICING.paper.white - t.discount)}</td>
      <td>${naira(PRICING.paper.cream - t.discount)}</td>
      <td>${naira(PRICING.imagePage)}</td>
      <td>${naira(PRICING.colourPage)}</td>
    </tr>`).join('');
  const tierRows = tbody ? [...tbody.rows] : [];

  /* ---------- Quote calculator (order page) ---------- */
  const form = $('#order-form');
  if (form) initOrder();

  function initOrder() {
    const els = {
      perBook: $('#per-book'), total: $('#total'), badge: $('#tier-badge'),
      breakdown: $('#breakdown'), nudge: $('#nudge'), error: $('#form-error'), barTotal: $('#bar-total'),
    };
    const int = (name) => { const v = parseInt(form.elements[name].value, 10); return Number.isFinite(v) && v > 0 ? v : 0; };

    function tierFor(copies) { return PRICING.tiers.find((t) => copies >= t.min && copies <= t.max) || PRICING.tiers[0]; }

    function quote(copies, spec) {
      const tier = tierFor(copies);
      const textRate = PRICING.paper[spec.paper] - tier.discount;
      const lines = {
        base: tier.base,
        text: spec.textPages * textRate,
        image: spec.imagePages * PRICING.imagePage,
        colour: spec.colourPages * PRICING.colourPage,
      };
      const perBook = lines.base + lines.text + lines.image + lines.colour;
      return { tier, textRate, lines, perBook, total: perBook * copies };
    }

    function readSpec() {
      return {
        copies: int('copies'),
        textPages: int('textPages'),
        imagePages: int('imagePages'),
        colourPages: int('colourPages'),
        paper: form.elements.paper.value,
      };
    }

    function breakdownHTML(spec, q) {
      const rows = [[`Cover & binding`, naira(q.lines.base)]];
      if (spec.textPages) rows.push([`${spec.textPages} text pages × ${naira(q.textRate)}`, naira(q.lines.text)]);
      if (spec.imagePages) rows.push([`${spec.imagePages} image pages × ${naira(PRICING.imagePage)}`, naira(q.lines.image)]);
      if (spec.colourPages) rows.push([`${spec.colourPages} colour pages × ${naira(PRICING.colourPage)}`, naira(q.lines.colour)]);
      rows.push([`Copies`, `× ${spec.copies.toLocaleString()}`]);
      return rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    }

    let lastTotal = null;
    function bump(el) { if (reduceMotion) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }

    function update() {
      const spec = readSpec();
      const copiesField = form.elements.copies.closest('.field');
      const belowMin = spec.copies < PRICING.minCopies;
      copiesField.classList.toggle('is-invalid', belowMin && form.elements.copies.value !== '');
      copiesField.querySelector('.hint').textContent = belowMin && form.elements.copies.value !== '' ? `Minimum order is ${PRICING.minCopies} copies` : `Minimum ${PRICING.minCopies}`;

      const qty = Math.max(spec.copies, PRICING.minCopies);
      const q = quote(qty, spec);
      tierRows.forEach((row, i) => row.classList.toggle('is-current', PRICING.tiers[i] === q.tier));
      els.badge.textContent = tierLabel(q.tier);

      if (belowMin) {
        els.perBook.textContent = naira(q.perBook);
        els.total.textContent = els.barTotal.textContent = '₦—';
        els.breakdown.innerHTML = breakdownHTML({ ...spec, copies: qty }, q).replace(/× [\d,]+<\/dd>$/, 'min. 15</dd>');
        els.nudge.hidden = true;
        lastTotal = null;
        return;
      }

      els.perBook.textContent = naira(q.perBook);
      els.total.textContent = els.barTotal.textContent = naira(q.total);
      els.breakdown.innerHTML = breakdownHTML(spec, q);
      if (lastTotal !== null && lastTotal !== q.total) { bump(els.perBook); bump(els.total); }
      lastTotal = q.total;

      const next = PRICING.tiers[PRICING.tiers.indexOf(q.tier) + 1];
      if (next) {
        const nq = quote(next.min, spec);
        const save = q.perBook - nq.perBook;
        els.nudge.hidden = save <= 0;
        els.nudge.innerHTML = `Order <b>${next.min}</b> or more copies and each book drops to <b>${naira(nq.perBook)}</b>, a saving of ${naira(save)} per copy.`;
      } else {
        els.nudge.hidden = true;
      }
    }

    form.addEventListener('input', (e) => {
      update();
      const f = e.target.closest('.field');
      if (f && e.target.name !== 'copies' && e.target.checkValidity()) f.classList.remove('is-invalid');
      els.error.hidden = true;
    });

    /* ---------- Draft (per-browser convenience) ---------- */
    const DRAFT_KEY = 'whitefield-order-draft';
    const draftStatus = $('#draft-status');
    const FIELDS = ['copies', 'textPages', 'imagePages', 'colourPages', 'paper', 'firstName', 'lastName', 'email', 'phone', 'address', 'notes', 'payment'];

    $('#save-draft').addEventListener('click', () => {
      const data = Object.fromEntries(FIELDS.map((n) => [n, form.elements[n].value]));
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        draftStatus.textContent = 'Draft saved on this device.';
      } catch {
        draftStatus.textContent = "Couldn't save a draft in this browser.";
      }
    });
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved) {
        FIELDS.forEach((n) => { if (saved[n] != null) form.elements[n].value = saved[n]; });
        draftStatus.textContent = 'Your saved draft has been restored.';
      }
    } catch { /* storage unavailable */ }

    update();

    /* Mobile: sticky total while the form is on screen but the quote card is not. */
    const bar = $('#quote-bar');
    const seen = { fields: false, quote: false };
    const barIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { seen[e.target === form.querySelector('.order-fields') ? 'fields' : 'quote'] = e.isIntersecting; });
      bar.classList.toggle('is-shown', seen.fields && !seen.quote);
    });
    barIO.observe(form.querySelector('.order-fields'));
    barIO.observe($('#quote'));

    /* ---------- Submit ---------- */
    const dialog = $('#confirm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const spec = readSpec();
      let firstBad = null;

      form.querySelectorAll('input[required], textarea[required]').forEach((input) => {
        const bad = !input.checkValidity() || (input.name === 'copies' && spec.copies < PRICING.minCopies);
        input.closest('.field').classList.toggle('is-invalid', bad);
        if (bad && !firstBad) firstBad = input;
      });
      const pages = spec.textPages + spec.imagePages + spec.colourPages;
      if (!firstBad && pages === 0) firstBad = form.elements.textPages;

      if (firstBad) {
        els.error.textContent = pages === 0 && firstBad === form.elements.textPages
          ? 'Add at least one page to your book.'
          : 'Please complete the highlighted fields.';
        els.error.hidden = false;
        firstBad.focus({ preventScroll: true });
        firstBad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return;
      }

      els.error.hidden = true;
      const q = quote(spec.copies, spec);
      const d = new Date();
      const ref = `WH-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const v = (n) => form.elements[n].value.trim();
      const payment = v('payment') === 'paystack' ? 'Online payment (Paystack)' : 'Offline payment (bank transfer or deposit)';

      $('#ref').textContent = ref;
      $('#confirm-text').textContent = `${v('firstName')}, send us your order on WhatsApp and we'll reply with ${v('payment') === 'paystack' ? 'your Paystack payment link' : 'our bank details'} and the upload link for your cover and content.`;
      $('#confirm-breakdown').innerHTML = breakdownHTML(spec, q) + `<dt><b>Total</b></dt><dd><b>${naira(q.total)}</b></dd>`;

      const body = [
        `Order reference: ${ref}`,
        '',
        'BOOK DETAILS',
        `Copies: ${spec.copies}`,
        `B&W text-only pages: ${spec.textPages}`,
        `Pages with B&W images: ${spec.imagePages}`,
        `Colour pages: ${spec.colourPages}`,
        `Inner paper: ${spec.paper === 'white' ? 'White' : 'Cream'} (80gsm)`,
        `Cost per book: ${naira(q.perBook)}`,
        `Total cost: ${naira(q.total)}`,
        '',
        'CUSTOMER',
        `Name: ${v('firstName')} ${v('lastName')}`,
        `Email: ${v('email')}`,
        `Phone: ${v('phone')}`,
        `Delivery address: ${v('address') || '-'}`,
        `Payment method: ${payment}`,
        `Notes: ${v('notes') || '-'}`,
      ].join('\n');
      $('#send-order').href = whatsappLink(`Hello WhitefieldHouse, I'd like to place a book printing order.\n\n${body}`);

      dialog.showModal();
    });
  }

  /* ---------- Footer ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
