// RASA World v9: page logic, after the effects of bleibtgleich.dev (studied 2026-11-12, nothing copied).
//  - goo: every .goo block melts like liquid (an SVG blur + alpha-contrast filter) as it arrives and while the page is
//    scrolling fast, and sets crisp when it rests (the filter is removed at rest, so text renders normally);
//  - smoke: a violet smoke trail follows the pointer over the film (a 2D canvas, additive);
//  - the world of moments: RASA's photos and a few empty frames on a turning sphere you can drag; a click opens the photo;
//  - portals: the universes open through a circle with a violet rim; the header shrinks into a pill as on every version.
// Without JS (or with reduced motion) the page is the plain layout in rasa9.css.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const o3 = t => 1 - (1 - t) ** 3;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const setVar = (el, k, v) => { if (!el) return; const c = el._v || (el._v = {}); if (c[k] !== v) { c[k] = v; el.style.setProperty(k, v); } };
const pinP = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); const t = id.length > 1 && $(id); if (!t) return; e.preventDefault(); setMenu(false); lenis.scrollTo(t, { duration: 1.6 }); }));
}

/* ---------------------------------------------------------------- header */
const header = $('.site-header'), burger = $('.burger-btn'), navLinks = $$('.d-nav a'), navT = navLinks.map(a => $(a.getAttribute('href')));
function setMenu(open) { header.toggleAttribute('data-menu', open); burger.setAttribute('aria-expanded', String(open)); burger.textContent = open ? 'Close' : 'Menu'; open ? lenis?.stop() : lenis?.start(); }
burger.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu')));
$$('.m-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && header.hasAttribute('data-menu') && setMenu(false));
function onHeader() {
  header.toggleAttribute('data-scrolled', scrollY > 24);
  let cur = -1; navT.forEach((t, i) => { if (t) { const r = t.getBoundingClientRect(); if (r.top <= innerHeight / 2 && r.bottom > innerHeight / 2) cur = i; } });
  navLinks.forEach((a, i) => a.toggleAttribute('aria-current', i === cur));
}

/* ---------------------------------------------------------------- goo: words that melt and set */
const defs = $('.defs defs'), SVGNS = 'http://www.w3.org/2000/svg';
const goos = $$('.goo').map((el, i) => {
  const f = document.createElementNS(SVGNS, 'filter');
  f.setAttribute('id', 'goo-' + i); f.setAttribute('x', '-20%'); f.setAttribute('y', '-60%'); f.setAttribute('width', '140%'); f.setAttribute('height', '220%'); f.setAttribute('filterUnits', 'objectBoundingBox');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  const b = document.createElementNS(SVGNS, 'feGaussianBlur'); b.setAttribute('in', 'SourceGraphic'); b.setAttribute('stdDeviation', '0'); b.setAttribute('result', 'b');
  const m = document.createElementNS(SVGNS, 'feColorMatrix'); m.setAttribute('in', 'b'); m.setAttribute('mode', 'matrix'); m.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9');
  f.append(b, m); defs.append(f);
  return { el, blur: b, id: 'goo-' + i, r: reduced ? 1 : 0, seen: el.dataset.goo === 'load', t0: performance.now() + (el.dataset.goo === 'load' ? 250 : 0), cur: -1 };
});
let lastY = scrollY, vel = 0;
function gooScene(now, dt) {
  const dy = scrollY - lastY; lastY = scrollY;
  vel = lerp(vel, Math.abs(dy) / Math.max(dt, .001), 1 - Math.exp(-dt * 8));          // px per second, smoothed
  const H = innerHeight;
  goos.forEach(g => {
    const rc = g.el.getBoundingClientRect();
    const inView = rc.bottom > 0 && rc.top < H;
    if (!g.seen && rc.top < H * .85 && rc.bottom > 0) { g.seen = true; g.t0 = now; }
    if (g.seen && g.r < 1) g.r = clamp((now - g.t0) / 1900);
    const fs = parseFloat(getComputedStyle(g.el).fontSize) || 40;
    // arriving: a thick melt that drains away; scrolling fast: the words go soft again
    const melt = g.seen ? (1 - o3(g.r)) * fs * .28 : fs * .28;
    const flow = reduced ? 0 : Math.min(fs * .12, vel * .005 * fs / 60);
    const sd = inView ? Math.max(melt, flow) : 0;
    const q = Math.round(sd * 10) / 10;
    if (q !== g.cur) {
      g.cur = q;
      if (q > .15) { g.blur.setAttribute('stdDeviation', String(q)); g.el.style.filter = `url(#${g.id})`; }
      else g.el.style.filter = '';
    }
    g.el.style.opacity = g.seen ? String(clamp(g.r * 3)) : (inView ? '0' : '');
  });
}

/* ---------------------------------------------------------------- smoke over the film */
const smoke = $('.smoke'), hero = $('.hero');
const sctx = smoke?.getContext('2d');
const puffs = [];
let sp = { x: -1, y: -1, px: -1, py: -1, on: false };
hero?.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); sp.x = e.clientX - r.left; sp.y = e.clientY - r.top; sp.on = true; });
hero?.addEventListener('pointerleave', () => { sp.on = false; sp.px = -1; });
function smokeScene(dt) {
  if (!sctx) return;
  const r = hero.getBoundingClientRect(); if (r.bottom < 0) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (smoke.width !== W || smoke.height !== H) { smoke.width = W; smoke.height = H; }
  // the trail: puffs along the pointer's path; a slow ambient wisp so the film is never still
  if (sp.on && !reduced) {
    if (sp.px < 0) { sp.px = sp.x; sp.py = sp.y; }
    const d = Math.hypot(sp.x - sp.px, sp.y - sp.py), n = Math.min(10, Math.ceil(d / 10));
    for (let i = 0; i < n; i++) { const t = (i + 1) / n; puffs.push({ x: lerp(sp.px, sp.x, t), y: lerp(sp.py, sp.y, t), vx: (sp.x - sp.px) * .8 + (Math.random() - .5) * 30, vy: (sp.y - sp.py) * .8 - 20 - Math.random() * 20, r: 22 + Math.random() * 18, a: .9, life: 0 }); }
    sp.px = sp.x; sp.py = sp.y;
  }
  if (!reduced && Math.random() < dt * 6) puffs.push({ x: r.width * (.2 + Math.random() * .6), y: r.height * (.92 + Math.random() * .1), vx: (Math.random() - .5) * 16, vy: -30 - Math.random() * 25, r: 40 + Math.random() * 40, a: .22, life: 0 });
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.clearRect(0, 0, r.width, r.height);
  sctx.globalCompositeOperation = 'lighter';
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .985; p.r += dt * 46;
    const k = 1 - p.life / 2.4; if (k <= 0) { puffs.splice(i, 1); continue; }
    const g = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, `rgba(190, 168, 255, ${p.a * k * .55})`); g.addColorStop(.5, `rgba(150, 120, 255, ${p.a * k * .22})`); g.addColorStop(1, 'rgba(120, 90, 255, 0)');
    sctx.fillStyle = g; sctx.beginPath(); sctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); sctx.fill();
  }
  if (puffs.length > 600) puffs.splice(0, puffs.length - 600);
}
const filmV = $('.film-v');

/* ---------------------------------------------------------------- counters */
const fmt = (v, suf) => (v >= 1000 ? Math.round(v).toLocaleString('en-US') : Math.round(v)) + (suf || '');
if ('IntersectionObserver' in window) {
  const ob = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; ob.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = reduced ? 0 : 1500;
    const tick = now => { const t = dur ? clamp((now - t0) / dur) : 1; el.textContent = fmt(to * o3(t), suf); if (t < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .4 });
  $$('[data-count]').forEach(c => ob.observe(c));
}

/* ---------------------------------------------------------------- portals */
const portals = $('.portals'), worlds = $$('.world'), pin = $('.portal-pin'), puN = $('.pu-n'), puBar = $('.pu-bar'), pierV = $('.world[data-w="1"] video');
const ring = document.createElement('div'); ring.className = 'portal-ring'; pin?.append(ring);
function portalScene() {
  if (!portals) return;
  const r = portals.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const live = r.top <= 1 && r.bottom >= H - 1;
  const u = pinP(portals) * 3.6;
  const sx = W >= 900 ? W * .72 : W * .7, sy = W >= 900 ? H * .42 : H * .22, seed = Math.min(W, H) * .06;
  const Rmax = Math.hypot(Math.max(sx, W - sx), Math.max(sy, H - sy)) + 40;
  const ks = worlds.map((w, i) => i === 0 ? 1 : io(seg(u, i - .7, i)));
  const away = i => 1 - seg(ks[i + 1] ?? 0, 0, .3);
  let open = 0, opening = -1, kO = 0;
  worlds.forEach((w, i) => {
    setVar(w, '--cx', (sx / W * 100).toFixed(2) + '%'); setVar(w, '--cy', (sy / H * 100).toFixed(2) + '%');
    const k = ks[i]; if (k >= .5) open = i; if (i > 0 && k > 0 && k < 1) { opening = i; kO = k; }
    setVar(w, '--r', i === 0 || k >= 1 ? '150%' : k <= 0 ? '0px' : (seed + (Rmax - seed) * k).toFixed(1) + 'px');
    setVar(w, '--ti', ((i === 0 ? 1 : seg(k, .55, 1)) * away(i)).toFixed(3));
    setVar(w.firstElementChild, '--z', (i === 0 ? 1 : 1.25 - .25 * k).toFixed(3));
  });
  // the rim: a seed waiting at the next portal, then the edge of the opening circle
  const next = Math.floor(u) + 1, rr = opening > 0 ? seed + (Rmax - seed) * kO : seed;
  const show = live && (opening > 0 ? 1 - seg(kO, .8, 1) : (next <= 3 && u >= .02 ? 1 : 0));
  ring.style.cssText = `left:${sx - rr}px;top:${sy - rr}px;width:${rr * 2}px;height:${rr * 2}px;opacity:${show}`;
  setVar(puBar, '--p', (u / 3.6).toFixed(3));
  if (puN) { const t = String(open + 1).padStart(2, '0'); if (puN.textContent !== t) puN.textContent = t; }
  if (pierV) { const on = live && u > .3 && u < 2.05; if (on) { if (!pierV.src) pierV.src = pierV.dataset.src; if (pierV.paused) pierV.play().catch(() => {}); } else if (!pierV.paused) pierV.pause(); }
}

/* ---------------------------------------------------------------- the world of moments */
const sphere = $('[data-sphere]'), sIn = sphere?.querySelector('.sphere-in');
const items = [];
if (sIn && window.RASA_MOMENTS) {
  const photos = window.RASA_MOMENTS, N = 34, ga = Math.PI * (3 - Math.sqrt(5));
  // photos spread evenly through the sphere, empty frames in between (as the reference's quiet tiles)
  const slots = Array.from({ length: N }, (_, i) => i), photoAt = new Map();
  photos.forEach((p, j) => photoAt.set(Math.round(j * N / photos.length + 1) % N, p));
  slots.forEach(i => {
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), th = ga * i;
    const v = { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    const p = photoAt.get(i), f = document.createElement('figure');
    f.className = 'ph' + (p ? '' : ' ghost');
    if (p) { f.innerHTML = `<img src="${p.src}" alt="${p.name}" loading="lazy" decoding="async"><figcaption>${p.name}</figcaption>`; f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Open photo: ' + p.name); }
    sIn.append(f); items.push({ f, v, lon: Math.atan2(v.x, v.z), lat: Math.asin(v.y), photo: !!p, scale: p ? 1 : .7 + Math.random() * .4 });
  });
}
const sp3 = { ax: -.25, ay: 0, vx: 0, vy: .18, drag: false, lx: 0, ly: 0, moved: 0 };
// no pointer capture: it would retarget the click to the sphere, and a photo could not be opened
sphere?.addEventListener('pointerdown', e => { sp3.drag = true; sp3.lx = e.clientX; sp3.ly = e.clientY; sp3.moved = 0; });
addEventListener('pointermove', e => { if (!sp3.drag) return; const dx = e.clientX - sp3.lx, dy = e.clientY - sp3.ly; sp3.lx = e.clientX; sp3.ly = e.clientY; sp3.moved += Math.abs(dx) + Math.abs(dy); sp3.vy = dx * .3; sp3.vx = -dy * .3; sp3.ay += dx * .005; sp3.ax = clamp(sp3.ax - dy * .005, -1.1, 1.1); });
addEventListener('pointerup', () => { sp3.drag = false; });
// the world stops turning while the pointer rests on a photo, so it can be clicked
sIn?.addEventListener('pointerover', e => { sp3.hover = !!e.target.closest('.ph:not(.ghost)'); });
sIn?.addEventListener('pointerleave', () => { sp3.hover = false; });
function sphereScene(dt) {
  if (!sIn || !items.length) return;
  const rc = sphere.getBoundingClientRect(); if (rc.bottom < 0 || rc.top > innerHeight) return;
  const W = innerWidth, R = Math.min(W * (W < 720 ? .42 : .3), rc.height * .42), w = clamp(W * .085, 80, 150);
  if (!sp3.drag) { sp3.vy = lerp(sp3.vy, reduced || sp3.hover ? 0 : .18, 1 - Math.exp(-dt * (sp3.hover ? 8 : 1.5))); sp3.vx = lerp(sp3.vx, 0, 1 - Math.exp(-dt * 2)); sp3.ay += sp3.vy * dt; sp3.ax = clamp(sp3.ax + sp3.vx * dt * .2, -1.1, 1.1); sp3.ax = lerp(sp3.ax, -.25, 1 - Math.exp(-dt * .6)); }
  const tilt = (rc.top + rc.height / 2 - innerHeight / 2) / innerHeight * .4;     // the scroll tips it a little
  const ax = sp3.ax + tilt, ay = sp3.ay;
  sIn.style.transform = `rotateX(${ax}rad) rotateY(${ay}rad)`;
  // which way each frame faces, worked out with the same matrices CSS uses (+z points at the viewer)
  const C = new DOMMatrix().rotateAxisAngle(1, 0, 0, ax * 57.2958).rotateAxisAngle(0, 1, 0, ay * 57.2958);
  items.forEach(it => {
    if (!it.M) it.M = new DOMMatrix().rotateAxisAngle(0, 1, 0, it.lon * 57.2958).rotateAxisAngle(1, 0, 0, -it.lat * 57.2958);
    const n = C.multiply(it.M).transformPoint(new DOMPoint(0, 0, 1, 0));
    const face = clamp((n.z + .1) / .8);
    if (!it.set || it.R !== R) { it.f.style.setProperty('--w', (w * it.scale).toFixed(0) + 'px'); it.f.style.transform = `rotateY(${it.lon}rad) rotateX(${-it.lat}rad) translateZ(${R.toFixed(0)}px) translate(-50%, -50%)`; it.set = true; it.R = R; }
    it.f.style.opacity = (it.photo ? .12 + .88 * face : .55 * face + .12).toFixed(3);
    it.f.style.pointerEvents = it.photo && face > .5 ? 'auto' : 'none';
  });
}

/* ---------------------------------------------------------------- lightbox (photos of the world) */
let lb = null, lbI = 0;
const lbList = () => items.filter(i => i.photo).map(i => i.f.querySelector('img'));
function showLb(i) { const l = lbList(); lbI = (i + l.length) % l.length; const im = l[lbI], big = lb.querySelector('img'); big.src = im.src; big.alt = im.alt; lb.querySelector('.lb-cap').textContent = im.alt; }
function openLb(img) {
  if (!lb) {
    lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo');
    lb.innerHTML = '<img alt=""><p class="lb-cap"></p><button class="lb-x" type="button">Close</button><button class="lb-p" type="button" aria-label="Previous photo">←</button><button class="lb-n" type="button" aria-label="Next photo">→</button>';
    document.body.append(lb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) closeLb(); });
    lb.querySelector('.lb-p').addEventListener('click', () => showLb(lbI - 1)); lb.querySelector('.lb-n').addEventListener('click', () => showLb(lbI + 1));
    addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });
  }
  showLb(lbList().indexOf(img)); lb.classList.add('on'); lenis?.stop(); lb.querySelector('.lb-x').focus();
}
function closeLb() { lb.classList.remove('on'); lenis?.start(); }
sIn?.addEventListener('click', e => { const f = e.target.closest('.ph:not(.ghost)'); if (!f || sp3.moved > 6) return; openLb(f.querySelector('img')); });
sIn?.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const f = e.target.closest('.ph:not(.ghost)'); if (f) { e.preventDefault(); openLb(f.querySelector('img')); } });

/* ---------------------------------------------------------------- the case photo follows the pointer */
const peek = $('.case-peek'), peekImg = peek?.querySelector('img'); const pk = { x: 0, y: 0, tx: 0, ty: 0 };
$$('.case a').forEach(a => {
  a.addEventListener('pointerenter', () => { const s = a.dataset.img; if (!s) { peek.classList.remove('on'); return; } if (peekImg.src !== s) peekImg.src = s; peek.classList.add('on'); });
  a.addEventListener('pointerleave', () => peek.classList.remove('on'));
});
addEventListener('pointermove', e => { pk.tx = e.clientX; pk.ty = e.clientY; }, { passive: true });

/* ---------------------------------------------------------------- one loop */
let last = performance.now();
function loop(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  lenis?.raf(now);
  onHeader(); gooScene(now, dt); smokeScene(dt); portalScene(); sphereScene(dt);
  if (peek) { const k = 1 - Math.exp(-dt * 10); pk.x = lerp(pk.x, pk.tx, k); pk.y = lerp(pk.y, pk.ty, k); peek.style.left = pk.x.toFixed(1) + 'px'; peek.style.top = pk.y.toFixed(1) + 'px'; }
  if (filmV) { const vis = hero.getBoundingClientRect().bottom > 0; if (vis && filmV.paused) filmV.play().catch(() => {}); else if (!vis && !filmV.paused) filmV.pause(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
