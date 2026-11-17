// RASA World, the client site (2026-11-17): v8's starburst brought into Prism (client: "we like the starburst effect from v8").
// One cloud of ~9k points that bursts outwards and re-gathers into a new shape per chapter, as in world8.js, but coloured
// with Prism's thin-film rainbow instead of v8's violet. It only shows where the glass world rests, so the two never meet:
//  - RASA by the numbers: the RASA mark (it bursts out of the globe as the globe fades)
//  - Tabulah: a small data cube
//  - Explore our work: a spiral galaxy
// The pointer pushes the points aside. Drawn in screen pixels on its own canvas (.burst).
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const cv = document.querySelector('.burst');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !cv) throw new Error('RASA site: no WebGL for the starburst');

const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R.setClearColor(0, 0);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -4000, 4000);

/* ---------------------------------------------------------------- shapes: 0 the RASA mark, 1 the globe, 2 the data cube, 3 the galaxy */
const NP = 9000;
const fib = (i, n) => { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), t = Math.PI * (3 - Math.sqrt(5)) * i; return [Math.cos(t) * r, y, Math.sin(t) * r]; };
const SH = Array.from({ length: 4 }, () => new Float32Array(NP * 3));
for (let i = 0; i < NP; i++) {
  const g = fib(i, NP), gr = .98 + Math.random() * .04; SH[1].set([g[0] * gr, g[1] * gr, g[2] * gr], i * 3);
  const q = () => Math.round((Math.random() * 2 - 1) * 6) / 6 * .78; const e = Math.random();
  let cx = q(), cy = q(), cz = q();
  if (e < .55) { const ax = Math.floor(Math.random() * 3), s1 = Math.random() < .5 ? -.78 : .78, s2 = Math.random() < .5 ? -.78 : .78, t = Math.random() * 1.56 - .78; [cx, cy, cz] = ax === 0 ? [t, s1, s2] : ax === 1 ? [s1, t, s2] : [s1, s2, t]; }
  SH[2].set([cx, cy, cz], i * 3);
  const arm = i % 2, tt = Math.pow(Math.random(), .7), r2 = .15 + tt * 1.3, ga = arm * Math.PI + tt * 4.4 + (Math.random() - .5) * .45;
  SH[3].set([Math.cos(ga) * r2, (Math.random() - .5) * .07 * (1.4 - tt), Math.sin(ga) * r2], i * 3);
  SH[0].set(SH[1].subarray(i * 3, i * 3 + 3), i * 3);                    // the globe, until the logo is sampled
}
const geo = new THREE.BufferGeometry();
SH.forEach((s, k) => geo.setAttribute(k ? 'aS' + k : 'position', new THREE.BufferAttribute(s, 3)));
const rnd = new Float32Array(NP * 4); for (let i = 0; i < NP * 4; i++) rnd[i] = Math.random();
geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: { uFrom: { value: 1 }, uTo: { value: 1 }, uK: { value: 1 }, uC: { value: new THREE.Vector3() }, uSize: { value: 100 }, uRot: { value: new THREE.Matrix3() },
    uTime: { value: 0 }, uDpr: { value: 1 }, uFade: { value: 0 }, uPtr: { value: new THREE.Vector2(-1e4, -1e4) } },
  vertexShader: `attribute vec3 aS1, aS2, aS3; attribute vec4 aRnd;
    uniform float uFrom, uTo, uK, uSize, uTime, uDpr, uFade; uniform vec3 uC; uniform mat3 uRot; uniform vec2 uPtr;
    varying float vA; varying vec3 vCol;
    vec3 shape(float s) { return s < .5 ? position : s < 1.5 ? aS1 : s < 2.5 ? aS2 : aS3; }
    // Prism's thin-film rainbow: violet, sky, mint, peach, pink
    vec3 holo(float t) { t = fract(t) * 5.;
      vec3 c0 = vec3(.71, .61, 1.), c1 = vec3(.56, .83, 1.), c2 = vec3(.79, .97, .89), c3 = vec3(1., .84, .66), c4 = vec3(1., .62, .85);
      return t < 1. ? mix(c0, c1, t) : t < 2. ? mix(c1, c2, t - 1.) : t < 3. ? mix(c2, c3, t - 2.) : t < 4. ? mix(c3, c4, t - 3.) : mix(c4, c0, t - 4.); }
    void main() {
      vec3 a = shape(uFrom), b = shape(uTo);
      float k = smoothstep(aRnd.x * .35, .65 + aRnd.x * .35, uK);               // points leave at different times
      vec3 burst = normalize(aRnd.yzw - .5 + 1e-3) * (.45 + aRnd.x * .9) * sin(3.14159 * k);
      vec3 p = mix(a, b, k) + burst;
      p += .012 * vec3(sin(uTime * 1.3 + aRnd.y * 40.), cos(uTime * 1.1 + aRnd.z * 40.), sin(uTime * .9 + aRnd.w * 40.));
      p = uRot * p;
      vec2 s = vec2(uC.x + p.x * uSize, uC.y - p.y * uSize);
      vec2 dp = s - uPtr; float pd = length(dp); s += dp / max(pd, 1.) * 40. * exp(-pd * pd / 9000.);
      gl_Position = projectionMatrix * viewMatrix * vec4(s.x, -s.y, p.z * uSize, 1.);
      float depth = clamp(p.z * .5 + .5, 0., 1.);
      gl_PointSize = uDpr * (1.3 + aRnd.y * 2.4) * (.7 + depth * .7) * clamp(uSize / 220., .6, 1.5);
      vCol = mix(holo(aRnd.z + p.x * .25 + p.y * .15 + uTime * .05), vec3(1.), aRnd.w * .3);
      vA = uFade * (.3 + depth * .7) * (1. + sin(3.14159 * k) * .6);             // a flash while the points fly
    }`,
  fragmentShader: `varying float vA; varying vec3 vCol; void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = vA * smoothstep(.5, .12, d); gl_FragColor = vec4(vCol * a, a); }`,
});
const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
// the RASA mark: sample the logo (same-origin SVG) into points
{
  const img = new Image(); img.src = 'assets/rasa-logo.svg';
  img.onload = () => {
    const W = 434, H = 264, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.drawImage(img, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data, on = [];
    for (let y = 0; y < H; y += 2) for (let X = 0; X < W; X += 2) if (d[(y * W + X) * 4 + 3] > 128) on.push([X, y]);
    if (!on.length) return;
    const s = geo.attributes.position;
    for (let i = 0; i < NP; i++) { const [X, Y] = on[Math.floor(Math.random() * on.length)]; s.setXYZ(i, (X / W - .5) * 2.4 + (Math.random() - .5) * .008, -(Y / H - .5) * 2.4 * H / W, (Math.random() - .5) * .12); }
    s.needsUpdate = true;
  };
}

/* ---------------------------------------------------------------- chapters */
const $ = s => document.querySelector(s);
const CH = [['.hero', -1], ['.eco', -1], ['.numbers', 0], ['.uni-intro', -1], ['.portals', -1], ['.tabulah', 2], ['.gal', -1], ['.work', 3], ['.close', -1], ['.foot', -1]]
  .map(([s, k]) => ({ el: $(s), k, s })).filter(c => c.el);
const S = { x: innerWidth * .8, y: innerHeight * .3, size: 0, fade: 0 }, T = Object.assign({}, S);
let shape = 1, from = 1, k = 1;
function chapter() { const mid = innerHeight / 2; for (const c of CH) { const r = c.el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return c; } return CH[0]; }
function place(c) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  if (c.s === '.numbers') Object.assign(T, { x: wide ? W * .74 : W * .5, y: wide ? H * .24 : H * .19, size: wide ? m * .16 : W * .19, fade: 1 });
  else if (c.s === '.tabulah') Object.assign(T, { x: wide ? W * .88 : W * .84, y: wide ? H * .87 : H * .1, size: wide ? m * .07 : W * .09, fade: .9 });
  else if (c.s === '.work') Object.assign(T, { x: wide ? W * .88 : W * .8, y: H * .55, size: m * .22, fade: .35 });
  else Object.assign(T, { fade: 0 });
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: -1e4, y: -1e4, nx: 0, ny: 0 };
addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.nx = e.clientX / innerWidth - .5; ptr.ny = e.clientY / innerHeight - .5; }, { passive: true });
let dpr = 1, last = performance.now(), time = 0, lnx = 0, lny = 0;
function size() {
  const W = innerWidth, H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75);
  R.setPixelRatio(dpr); R.setSize(W, H, false);
  cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix();
}
size(); addEventListener('resize', size);
const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m4 = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.12, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt;
  lnx = lerp(lnx, ptr.nx, 1 - Math.exp(-dt * 3)); lny = lerp(lny, ptr.ny, 1 - Math.exp(-dt * 3));
  const c = chapter(); place(c);
  // a new chapter with a shape: burst from the last shape into the new one (from the globe the first time)
  if (c.k >= 0 && c.k !== shape) { from = k > .5 ? shape : from; shape = c.k; k = 0; }
  k = Math.min(1, k + dt / (reduced ? .01 : 1.8));
  const e = 1 - Math.exp(-dt * 4);
  for (const key of ['x', 'y', 'size', 'fade']) S[key] = lerp(S[key], T[key], e);
  if (S.size < 1 && T.size) S.size = T.size;                                // appear in place, not grow from a dot
  const tilt = shape === 3 ? -1.05 : -.25;
  q.setFromAxisAngle(Y, (shape === 0 ? Math.sin(time * .5) * .35 : time * .25) + lnx * .8).premultiply(q2.setFromAxisAngle(X, tilt + lny * .4));
  const u = mat.uniforms;
  u.uRot.value.setFromMatrix4(m4.makeRotationFromQuaternion(q));
  u.uFrom.value = from; u.uTo.value = shape; u.uK.value = k;
  u.uC.value.set(S.x, S.y, 0); u.uSize.value = S.size; u.uFade.value = clamp(S.fade);
  u.uTime.value = time; u.uDpr.value = dpr; u.uPtr.value.set(ptr.x, ptr.y);
  pts.visible = S.fade > .01;
  R.clear(); if (pts.visible) R.render(scene, cam);
}
requestAnimationFrame(frame);
