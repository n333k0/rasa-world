// RASA World v7: page logic, from page2.js (v2-v6). New here: the universes as cockpit windows (winsScene) instead of
// the glass portals, and the 3D layer in front of the film in the hero. page2.js notes:
// RASA World v2 / v3: page logic (from page.js, v1). New here: the three arms are cards that pass by while the world
// holds the left, each card with a dot-grid drawing (Not Human's How cards) and a glare under the pointer.
// v1 notes: Smooth scroll (Lenis), the header pill (Not Human pattern), and every scroll scene. It writes
// window.RW each frame (hero progress, active arm, portal geometry) for world.js. Every scene has a readable static
// default in CSS; this file only refines it.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const o4 = t => 1 - (1 - t) ** 4;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const RW = window.RW || (window.RW = {});
const setVar = (el, k, v) => { if (!el) return; const c = el._v || (el._v = {}); if (c[k] !== v) { c[k] = v; el.style.setProperty(k, v); } };
const pinP = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: 1.6 });
  }));
}

/* ---------------------------------------------------------------- header: detaches into a floating pill */
const header = $('.site-header'), phone = matchMedia('(max-width: 767px)');
const navLinks = $$('.d-nav a'), navTargets = navLinks.map(a => $(a.getAttribute('href')));
function onHeader() {
  header.toggleAttribute('data-scrolled', phone.matches || scrollY > 24);
  header.toggleAttribute('data-top', scrollY <= 24);   // under the ticker while it is on screen
  let cur = -1; navTargets.forEach((t, i) => { if (t) { const r = t.getBoundingClientRect(); if (r.top <= innerHeight * .5 && r.bottom > innerHeight * .5) cur = i; } });
  navLinks.forEach((a, i) => a.toggleAttribute('aria-current', i === cur));
}
const burger = $('.burger-btn');
const setMenu = open => {
  header.setAttribute('data-anim', '');
  header.toggleAttribute('data-menu', open);
  open ? lenis?.stop() : lenis?.start();
  root.style.overflow = open ? 'hidden' : '';
  burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
burger.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu')));
$$('.m-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && header.hasAttribute('data-menu') && setMenu(false));
matchMedia('(min-width: 1024px)').addEventListener('change', m => m.matches && setMenu(false));

/* ---------------------------------------------------------------- 01 hero: the film closes into a circle, the circle becomes the world */
const hero = $('.hero'), heroPin = $('.hero-pin'), film = $('.film'), filmV = $('.film-v');
function heroScene() {
  const p = pinP(hero); RW.hero = p;
  const W = innerWidth, H = innerHeight, D = Math.min(W, H) * .44;
  const c = o4(seg(p, 0, .16));
  setVar(heroPin, '--co', (1 - c).toFixed(3)); setVar(heroPin, '--cy', (-c * 80).toFixed(1) + 'px');
  const k = io(seg(p, .06, .58));
  const w = lerp(W, D, k), h = lerp(H, D, k);
  setVar(film, '--it', ((H - h) / 2).toFixed(1) + 'px'); setVar(film, '--il', ((W - w) / 2).toFixed(1) + 'px');
  setVar(film, '--ir', (lerp(0, D / 2, k)).toFixed(1) + 'px'); setVar(film, '--fs', (1 + k * .35).toFixed(3));
  setVar(film, '--fo', (1 - seg(p, .56, .68)).toFixed(3));
  const a = seg(p, .62, .74) * (1 - seg(p, .9, 1));
  setVar(heroPin, '--ao', a.toFixed(3)); setVar(heroPin, '--ay', ((1 - a) * 30).toFixed(1));
  if (filmV) { const vis = p < .7; if (vis && filmV.paused) filmV.play().catch(() => {}); else if (!vis && !filmV.paused) filmV.pause(); }
}

/* ---------------------------------------------------------------- 02 ecosystem: three cards pass while the world holds the left */
const eco = $('.eco'), track = $('.arms-track'), cards = $$('.acard'), ticks = $$('.arm-ticks i');
// each card's drawing: a dot grid with the path that arm takes (a brief, a stage, a data loop)
const ART = [
  'M40 200 L100 200 L140 150 L200 150 L240 100 L320 100 L360 60',
  'M200 130 L120 60 M200 130 L280 60 M200 130 L120 200 M200 130 L280 200 M120 60 L280 60 L280 200 L120 200 Z',
  'M160 90 L240 90 L240 170 L160 170 Z M240 90 L320 50 M160 170 L80 210 M240 170 L320 210 M160 90 L80 50',
];
$$('[data-art]').forEach(svg => {
  const d = ART[+svg.dataset.art] || ART[0];
  let h = '';
  for (let y = 50; y <= 210; y += 40) for (let x = 40; x <= 360; x += 40) h += `<circle class="g" cx="${x}" cy="${y}" r="2.2"/>`;
  const pts = [...d.matchAll(/(-?\d+) (-?\d+)/g)].map(m => [m[1], m[2]]);
  h += `<path class="trace" pathLength="1" d="${d}"/>`;
  [...new Set(pts.map(p => p.join(',')))].forEach(p => { const [x, y] = p.split(','); h += `<circle class="on" cx="${x}" cy="${y}" r="4"/>`; });
  const run = d.split(/ ?M/)[0] || d;
  h += `<circle class="runner" r="4.5"><animateMotion dur="4.5s" repeatCount="indefinite" path="${d.split(' M')[0]}"/></circle>`;
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.innerHTML = h;
});
cards.forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  setVar(c, '--gx', (x * 100).toFixed(1) + '%'); setVar(c, '--gy', (y * 100).toFixed(1) + '%');
  setVar(c, '--ry', ((x - .5) * 8).toFixed(2) + 'deg'); setVar(c, '--rx', ((.5 - y) * 6).toFixed(2) + 'deg');
}));
cards.forEach(c => c.addEventListener('pointerleave', () => { setVar(c, '--ry', '0deg'); setVar(c, '--rx', '0deg'); }));
function ecoScene() {
  if (!eco || !cards.length) return;
  const p = pinP(eco), n = cards.length;
  // hold each card a while, glide between them
  const f = p * (n - 1) * 1.25 - .12, i0 = Math.floor(clamp(f, 0, n - 1)), fr = clamp(f - i0);
  const pos = Math.min(n - 1, i0 + io(seg(fr, .35, 1)));
  const step = Math.round(pos); RW.arm = step;
  const w = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 20);
  setVar(track, '--tx', (-pos * w).toFixed(1) + 'px');
  cards.forEach((c, i) => {
    const d = Math.abs(i - pos);
    c.classList.toggle('on', i === step);
    // cards still to come wait dimmed on the right; a card that has passed leaves before it reaches the world
    setVar(c, '--op', (i < pos ? 1 - clamp((pos - i) * 1.6) : 1 - clamp(d) * .55).toFixed(3));
    setVar(c, '--sc', (1 - clamp(d) * .05).toFixed(3));
    const art = c.querySelector('.acard-art'); if (art) setVar(art, '--draw', (1 - clamp(d)).toFixed(3));
  });
  ticks.forEach((t, i) => setVar(t, '--p', clamp(pos + 1 - i).toFixed(3)));
}

/* ---------------------------------------------------------------- 03 the long sentence lights up word by word */
const lede = $('[data-focus]'); let words = [];
if (lede) { lede.innerHTML = lede.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); words = $$('.w', lede); }
function ledeScene() {
  if (!words.length) return;
  const r = lede.getBoundingClientRect(), H = innerHeight;
  const p = seg(H * .85 - r.top, 0, r.height + H * .35);
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
}

/* ---------------------------------------------------------------- 04 counters */
const fmt = (v, suf) => (v >= 1000 ? Math.round(v).toLocaleString('en-US') : Math.round(v)) + (suf || '');
const counters = $$('[data-count]');
if ('IntersectionObserver' in window) {
  const ob = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; ob.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = reduced ? 0 : 1600;
    const tick = now => { const t = dur ? clamp((now - t0) / dur) : 1; el.textContent = fmt(to * o4(t), suf); if (t < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .4 });
  counters.forEach(c => ob.observe(c));
}

/* ---------------------------------------------------------------- 05 universes (v7): cockpit windows slide past, one universe each
   (after Cyera's "explore the worlds" windows). The pinned section holds each window a while and glides to the next. */
const winsSec = $('.wins'), winsTrack = $('.wins-track'), winEls = $$('.win'), winDots = $$('.wins-dots i');
const winNext = $('.wins-next'), pierV7 = $('.win[data-w="1"] video');
winNext?.addEventListener('click', () => {
  const n = winEls.length, cur = RW.win ?? 0, r = winsSec.getBoundingClientRect(), span = winsSec.offsetHeight - innerHeight;
  const top = scrollY + r.top + span * Math.min(1, ((cur + 1) / (n - 1) + .1 / 1.2) / 1.2);
  lenis ? lenis.scrollTo(top, { duration: 1.2 }) : scrollTo({ top, behavior: 'smooth' });
});
function winsScene() {
  if (!winsSec || !winEls.length) return;
  const n = winEls.length, p = pinP(winsSec);
  const f = p * (n - 1) * 1.2 - .1, i0 = Math.floor(clamp(f, 0, n - 1)), fr = clamp(f - i0);
  const pos = Math.min(n - 1, i0 + io(seg(fr, .4, 1)));
  const act = Math.round(pos); RW.win = act;
  const w = winEls[0].offsetWidth, gap = parseFloat(getComputedStyle(winsTrack).columnGap) || 40;
  setVar(winsTrack, '--tx', (innerWidth / 2 - w / 2 - pos * (w + gap)).toFixed(1) + 'px');
  winEls.forEach((el, i) => {
    const d = i - pos;
    el.classList.toggle('on', i === act);
    setVar(el, '--d', d.toFixed(3));
    setVar(el, '--ad', Math.min(1, Math.abs(d)).toFixed(3));
  });
  winDots.forEach((d, i) => d.classList.toggle('on', i === act));
  const r = winsSec.getBoundingClientRect(), live = r.top < innerHeight && r.bottom > 0;
  if (pierV7) {
    const show = live && act === 1;
    if (show) { if (!pierV7.src) pierV7.src = pierV7.dataset.src; if (pierV7.paused) pierV7.play().catch(() => {}); }
    else if (!pierV7.paused) pierV7.pause();
  }
}

/* ---------------------------------------------------------------- 06 tabulah: the phones settle as they arrive */
const tabImg = $('.tab-fig img');
function tabScene() { if (!tabImg) return; const r = tabImg.parentElement.getBoundingClientRect(); const p = seg(innerHeight - r.top, 0, innerHeight + r.height); setVar(tabImg, '--tz', (1.18 - .18 * o4(p)).toFixed(3)); }

/* ---------------------------------------------------------------- 07 moments: one photo fills the screen, then shrinks into the wall */
const moSec = $('.moments'), moGrid = $('.mo-grid'), moCopy = $('.mo-copy'); let moMain = null, moGeo = null;
function measureMoments() {
  moMain = $('.mo-main'); if (!moMain || !moGrid) return;
  const g = moGrid.getBoundingClientRect(), s = parseFloat(moGrid.style.getPropertyValue('--s')) || 1;
  // measure untransformed: offsets inside the grid ignore the scale
  const cx = moMain.offsetLeft + moMain.offsetWidth / 2, cy = moMain.offsetTop + moMain.offsetHeight / 2;
  moGeo = { cx, cy, w: moMain.offsetWidth, h: moMain.offsetHeight, gl: moGrid.offsetLeft, gt: moGrid.offsetTop };
}
function momentsScene() {
  if (!moGeo) measureMoments(); if (!moGeo) return;
  const p = pinP(moSec), W = innerWidth, H = innerHeight;
  const S0 = Math.max(W / moGeo.w, H / moGeo.h) * 1.02;
  const k = io(seg(p, .08, .78));
  const s = lerp(S0, 1, k);
  // scale round the main photo's centre, and carry that centre from the middle of the screen to its place in the grid
  const ax = moGeo.gl + moGeo.cx, ay = moGeo.gt + moGeo.cy;
  const tx = (W / 2 - ax) * (1 - k), ty = (H / 2 - ay) * (1 - k);
  moGrid.style.transformOrigin = `${moGeo.cx}px ${moGeo.cy}px`;
  moGrid.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
  setVar(moGrid, '--s', s.toFixed(3));
  setVar(moCopy, '--mc', seg(p, .7, .86).toFixed(3));
}
addEventListener('resize', () => { moGeo = null; });

/* ---------------------------------------------------------------- 08 work: the photo follows the pointer */
const peek = $('.case-peek'), peekImg = peek?.querySelector('img'); const pk = { x: 0, y: 0, tx: 0, ty: 0 };
$$('.case a').forEach(a => {
  a.addEventListener('pointerenter', () => { const src = a.dataset.img; if (!src) { peek.classList.remove('on'); return; } if (peekImg.src !== src) peekImg.src = src; peek.classList.add('on'); });
  a.addEventListener('pointerleave', () => peek.classList.remove('on'));
});
addEventListener('pointermove', e => { pk.tx = e.clientX; pk.ty = e.clientY; }, { passive: true });
function peekScene(dt) { if (!peek) return; const k = 1 - Math.exp(-dt * 10); pk.x = lerp(pk.x, pk.tx, k); pk.y = lerp(pk.y, pk.ty, k); peek.style.left = pk.x.toFixed(1) + 'px'; peek.style.top = pk.y.toFixed(1) + 'px'; }


/* ---------------------------------------------------------------- lightbox: every moment opens big on click (v2 onwards) */
const lbImgs = () => $$('.mo img, .gal-card img');
let lb = null, lbI = 0;
function openLb(i) {
  const list = lbImgs(); if (!list.length) return;
  if (!lb) {
    lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo');
    lb.innerHTML = '<img alt=""><p class="lb-cap"></p><button class="lb-x" type="button" aria-label="Close">×</button><button class="lb-p" type="button" aria-label="Previous photo">←</button><button class="lb-n" type="button" aria-label="Next photo">→</button>';
    document.body.append(lb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) closeLb(); });
    lb.querySelector('.lb-p').addEventListener('click', () => showLb(lbI - 1));
    lb.querySelector('.lb-n').addEventListener('click', () => showLb(lbI + 1));
    addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });
  }
  showLb(i); lb.classList.add('on'); lenis?.stop();
  lb.querySelector('.lb-x').focus();
}
function showLb(i) { const list = lbImgs(); lbI = (i + list.length) % list.length; const im = list[lbI]; const big = lb.querySelector('img'); big.src = im.currentSrc || im.src; big.alt = im.alt; lb.querySelector('.lb-cap').textContent = im.alt; }
function closeLb() { lb.classList.remove('on'); lenis?.start(); }
document.addEventListener('click', e => { const im = e.target.closest('.mo, .gal-card'); if (!im) return; const img = im.querySelector('img'); const i = lbImgs().indexOf(img); if (i >= 0) { e.preventDefault(); openLb(i); } });

/* ---------------------------------------------------------------- one loop */
let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  lenis?.raf(now);
  onHeader(); heroScene(); ecoScene(); ledeScene(); winsScene(); tabScene(); momentsScene(); peekScene(dt);
  // the 3D floats over the film in the hero (crystals round the headline) and sits behind the page everywhere else
  { const hr = hero.getBoundingClientRect(); const v = innerWidth >= 700 && hr.bottom > innerHeight * .5 && (RW.hero ?? 0) < .6 ? 'front' : 'behind'; if (root.dataset.glass !== v) root.dataset.glass = v; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
