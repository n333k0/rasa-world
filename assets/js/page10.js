// RASA World v10: page logic for the interactive universe (mesh3d-style). Smooth scroll (Lenis), the header pill, the
// hero film closing into a point, and the journey: each stop is one screen of scroll (the gallery stop, four), the first
// part of it holds still and the rest flies the camera to the next stop. Writes window.RW10 every frame for world10.js:
//   s      continuous stop position (2.4 = flying from stop 2 to 3)
//   mode   'hero' | 'journey' | 'after'
//   heroP  hero progress 0..1     fig  the figure the particles should draw (or '')
// world10.js calls RW10.goTo(i) when a body is clicked. Overlays get .on when their stop holds; titles build letter by
// letter (rise and turn in, power4-like ease); every overlay is readable as plain HTML when there is no WebGL.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const o4 = t => 1 - (1 - t) ** 4;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const RW = window.RW10 || (window.RW10 = { s: 0, mode: 'hero', heroP: 0, fig: '' });
const setVar = (el, k, v) => { if (!el) return; const c = el._v || (el._v = {}); if (c[k] !== v) { c[k] = v; el.style.setProperty(k, v); } };

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reduced && window.Lenis) lenis = new window.Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
const scrollToY = (y, d = 1.8) => lenis ? lenis.scrollTo(y, { duration: d }) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });

/* ---------------------------------------------------------------- preloader: a big counter */
const pre = $('.pre'), preN = $('.pre-n');
(() => {
  if (!pre) return;
  const t0 = performance.now(); let loaded = document.readyState === 'complete';
  addEventListener('load', () => { loaded = true; });
  const tick = now => {
    const t = (now - t0) / 1000, cap = loaded ? 100 : 86, v = Math.min(cap, Math.round(100 * (1 - Math.exp(-t * 1.6))));
    preN.textContent = String(v);
    if (v >= 100 || t > 6) { pre.classList.add('done'); setTimeout(() => pre.remove(), 1200); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---------------------------------------------------------------- header pill (Not Human pattern) */
const header = $('.site-header'), phone = matchMedia('(max-width: 767px)');
const burger = $('.burger-btn');
const setMenu = open => {
  header.setAttribute('data-anim', ''); header.toggleAttribute('data-menu', open);
  open ? lenis?.stop() : lenis?.start(); root.style.overflow = open ? 'hidden' : '';
  burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
burger.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu')));
$$('.m-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && header.hasAttribute('data-menu') && setMenu(false));

/* ---------------------------------------------------------------- the journey: stops and their scroll spans */
const journey = $('.journey'), stops = $$('.stop');
const SPAN = stops.map(s => s.classList.contains('stop-gal') ? 4 : 1);   // the gallery holds for four screens
const TRAVEL = .7;                                                     // the last 0.7 screen of a stop flies to the next
const cum = SPAN.reduce((a, v) => (a.push(a[a.length - 1] + v), a), [0]);
const N = stops.length;
const gl = () => root.classList.contains('u-gl');
function layout() { if (journey) journey.style.setProperty('--jh', (cum[N - 1] + 1) * 100 + 'vh'); }
layout();
const jTop = () => journey.getBoundingClientRect().top + scrollY;
RW.goTo = i => { i = clamp(i | 0, 0, N - 1); scrollToY(jTop() + cum[i] * innerHeight + 2, 1.6 + Math.abs(i - RW.s) * .12); };
$$('[data-go]').forEach(a => a.addEventListener('click', e => { if (!gl()) return; e.preventDefault(); RW.goTo(+a.dataset.go); }));
// plain anchors still smooth-scroll
$$('a[href^="#"]:not([data-go])').forEach(a => a.addEventListener('click', e => { const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href')); if (!t || !lenis) return; e.preventDefault(); lenis.scrollTo(t, { duration: 1.6 }); }));

// titles: split into letters once; each letter rises and turns in with its own delay
$$('[data-split]').forEach(h => {
  const words = h.textContent.trim().split(' ');
  h.setAttribute('aria-label', h.textContent.trim());
  h.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ');
  let i = 0; h.querySelectorAll('.ch').forEach(c => c.style.setProperty('--i', i++));
});

// the ruler at the bottom: one tick per stop, labelled, clickable
const ruler = $('.ruler');
const NAMES = ['Universe', 'RASA world', 'Atelier', 'RASA Creates', 'Tabulah', 'Thrill City', 'Pier Play', 'Portalverse', 'Monuments', 'Moments', 'Movement'];
if (ruler) ruler.innerHTML = stops.map((s, i) => `<button type="button" class="rt" data-i="${i}" aria-label="Fly to ${NAMES[i] || i}"><i></i><span>${NAMES[i] || ''}</span></button>`).join('');
const ticks = $$('.rt');
ticks.forEach(t => t.addEventListener('click', () => RW.goTo(+t.dataset.i)));
const status = $('.fr-status');

/* ---------------------------------------------------------------- the gallery stop: works that assemble from tiles */
const gw = $('[data-works]'), gwI = $('.gw-i'), gwN = $('.gw-n');
const WORKS = (window.RASA_MOMENTS || []).slice();
const TX = 8, TY = 5;
let workShown = -1;
function showWork(i) {
  if (!gw || !WORKS.length || i === workShown) return;
  workShown = i; const w = WORKS[i];
  const tiles = [];
  for (let y = 0; y < TY; y++) for (let x = 0; x < TX; x++) {
    const d = (Math.abs(x - TX / 2) + Math.abs(y - TY / 2)) * .035 + Math.random() * .08;
    tiles.push(`<i style="--x:${x};--y:${y};--d:${d.toFixed(3)}s"></i>`);
  }
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'gw-work'; el.dataset.src = w.src; el.setAttribute('aria-label', 'Open ' + w.name);
  el.style.setProperty('--img', `url("${w.src}")`); el.style.setProperty('--tx', TX); el.style.setProperty('--ty', TY);
  el.innerHTML = `<span class="gw-tiles">${tiles.join('')}</span><span class="gw-name">${w.name}</span><img src="${w.src}" alt="${w.name}" class="gw-src">`;
  const old = gw.querySelector('.gw-work:not(.out)');
  if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 700); }
  gw.append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  if (gwI) gwI.textContent = String(i + 1).padStart(2, '0');
}
if (gwN) gwN.textContent = String(WORKS.length).padStart(2, '0');
// without WebGL the gallery is a plain grid of every work
if (gw) gw.dataset.all = WORKS.map(w => w.src).join('|');

/* ---------------------------------------------------------------- lightbox (every photo opens big) */
let lb = null, lbList = [], lbI = 0;
function openLb(list, i) {
  lbList = list;
  if (!lb) {
    lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo');
    lb.innerHTML = '<img alt=""><p class="lb-cap"></p><button class="lb-x" type="button" aria-label="Close">×</button><button class="lb-p" type="button" aria-label="Previous photo">←</button><button class="lb-n" type="button" aria-label="Next photo">→</button>';
    document.body.append(lb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) closeLb(); });
    lb.querySelector('.lb-p').addEventListener('click', () => showLb(lbI - 1));
    lb.querySelector('.lb-n').addEventListener('click', () => showLb(lbI + 1));
    addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });
  }
  showLb(i); lb.classList.add('on'); lenis?.stop(); lb.querySelector('.lb-x').focus();
}
function showLb(i) { lbI = (i + lbList.length) % lbList.length; const it = lbList[lbI]; const im = lb.querySelector('img'); im.src = it.src; im.alt = it.name; lb.querySelector('.lb-cap').textContent = it.name; }
function closeLb() { lb.classList.remove('on'); lenis?.start(); }
document.addEventListener('click', e => {
  const work = e.target.closest('.gw-work'); if (work) { const i = WORKS.findIndex(w => w.src === work.dataset.src); openLb(WORKS, Math.max(0, i)); return; }
  const ph = e.target.closest('.sc-ph'); if (ph) { const all = $$('.sc-ph img').map(im => ({ src: im.currentSrc || im.src, name: im.alt })); openLb(all, $$('.sc-ph').indexOf(ph)); }
  const fig = e.target.closest('.gw-all img'); if (fig) openLb(WORKS, +fig.dataset.i);
});

/* ---------------------------------------------------------------- work: the photo follows the pointer */
const peek = $('.case-peek'), peekImg = peek?.querySelector('img'); const pk = { x: 0, y: 0, tx: 0, ty: 0 };
$$('.case a').forEach(a => {
  a.addEventListener('pointerenter', () => { const src = a.dataset.img; if (!src) { peek.classList.remove('on'); return; } if (peekImg.src !== src) peekImg.src = src; peek.classList.add('on'); });
  a.addEventListener('pointerleave', () => peek.classList.remove('on'));
});
addEventListener('pointermove', e => { pk.tx = e.clientX; pk.ty = e.clientY; }, { passive: true });

/* ---------------------------------------------------------------- hero: the film closes into a point of light */
const hero = $('.hero10'), heroPin = $('.hero-pin'), film = $('.film'), filmV = $('.film-v');
function heroScene() {
  const r = hero.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - innerHeight)); RW.heroP = p;
  const W = innerWidth, H = innerHeight;
  const c = o4(seg(p, 0, .3));
  setVar(heroPin, '--co', (1 - c).toFixed(3)); setVar(heroPin, '--cy', (-c * 60).toFixed(1) + 'px');
  const k = io(seg(p, .1, .85)), D = lerp(Math.hypot(W, H), 0, k);
  setVar(film, '--fr', (D / 2).toFixed(1) + 'px');
  setVar(film, '--fo', (1 - seg(p, .7, .95)).toFixed(3));
  if (filmV) { const vis = p < .95; if (vis && filmV.paused) filmV.play().catch(() => {}); else if (!vis && !filmV.paused) filmV.pause(); }
}

/* ---------------------------------------------------------------- one loop */
let active = -2, last = performance.now();
function loop(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  lenis?.raf(now);
  header.toggleAttribute('data-scrolled', phone.matches || scrollY > 24);
  header.toggleAttribute('data-top', scrollY <= 24);
  heroScene();
  if (journey && gl()) {
    const H = innerHeight, y = (scrollY - jTop()) / H;
    let i = 0; while (i < N - 1 && y >= cum[i + 1]) i++;
    const local = y - cum[i], hold = SPAN[i] - TRAVEL;
    const k = i < N - 1 ? seg(local, hold, SPAN[i]) : 0;
    RW.s = y < 0 ? 0 : i + io(k);
    const after = y > cum[N - 1] + .6;
    RW.mode = y < -.15 ? 'hero' : after ? 'after' : 'journey';
    // which overlay shows: the stop we hold at, or the next one as we arrive
    let a = -1;
    if (RW.mode === 'journey') { if (k < .38) a = i; else if (k > .9 && i < N - 1) a = i + 1; }
    if (a !== active) {
      stops.forEach((s, j) => s.classList.toggle('on', j === a));
      ticks.forEach((t, j) => t.classList.toggle('on', j === a));
      active = a; RW.fig = a >= 0 ? (stops[a].dataset.fig || '') : '';
      if (status) status.textContent = RW.mode === 'after' ? 'Back up to fly again' : a <= 0 ? 'Scroll to dive in' : a >= N - 2 ? 'Almost there' : 'Keep going';
    }
    ticks.forEach((t, j) => setVar(t, '--near', clamp(1 - Math.abs(j - RW.s) / 2).toFixed(3)));
    root.classList.toggle('u-after', RW.mode === 'after');
    root.classList.toggle('u-hero', RW.mode === 'hero');
    // the gallery stop: step through the works while it holds
    const g = stops.findIndex(s => s.classList.contains('stop-gal'));
    if (g === i && WORKS.length) showWork(Math.min(WORKS.length - 1, Math.floor(clamp(local / hold) * WORKS.length)));
    else if (g === i + 1 && k > .9) showWork(0);
  }
  if (peek) { const kk = 1 - Math.exp(-dt * 10); pk.x = lerp(pk.x, pk.tx, kk); pk.y = lerp(pk.y, pk.ty, kk); peek.style.left = pk.x.toFixed(1) + 'px'; peek.style.top = pk.y.toFixed(1) + 'px'; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// without WebGL (world10.js could not start) the gallery becomes a plain grid of every work
addEventListener('rw10-nogl', () => {
  if (!gw) return;
  gw.innerHTML = `<div class="gw-all">${WORKS.map((w, i) => `<img loading="lazy" src="${w.src}" alt="${w.name}" data-i="${i}">`).join('')}</div>`;
});
