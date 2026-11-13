// RASA World v8 (2026-11-12), after emotion-agency.com: one persistent 3D world behind the whole page, which the camera
// travels through as you scroll, with a particle sculpture that re-forms for each chapter.
//  - The world, at night: a violet sky with stars and slow clouds, a field of glowing grass points on rolling ground,
//    dark low-poly spires, a still lake that mirrors the sky, drifting petals. The camera dollies forward with the scroll
//    and leans towards the pointer.
//  - The sculpture: ~9k points that morph between shapes, one per chapter: the RASA mark (hero), three orbs (the three
//    arms), a globe (outcome, the world), a ring (the portals), a data cube (Tabulah), a spiral galaxy (the close).
//    Between shapes the points burst outwards and re-gather, like Emotion's sculpture.
//  - Positions come from window.RW (page8.js writes the hero progress); chapters from the sections in view.
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const RW = window.RW || (window.RW = {});
const ACC = new THREE.Color('#a37bff');
const cv = document.querySelector('.world8');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !cv) { document.documentElement.classList.add('no-gl'); throw new Error('RASA v8: no WebGL'); }

const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
R.setClearColor(0x07050d, 1);
R.autoClear = false;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x120a24, .018);
const cam = new THREE.PerspectiveCamera(48, 1, .1, 400);
const ui = new THREE.Scene();                                     // the sculpture, drawn in screen pixels on its own canvas, above the page
const cv2 = document.querySelector('.sculpt8');
const R2 = new THREE.WebGLRenderer({ canvas: cv2, antialias: true, alpha: true });
R2.setClearColor(0, 0);
const ortho = new THREE.OrthographicCamera(0, 1, 0, -1, -4000, 4000);

/* ---------------------------------------------------------------- the sky */
const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec3 vP; void main() { vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform float uTime; varying vec3 vP;
    float h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    float n(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
    void main() {
      float y = vP.y;
      vec3 c = mix(vec3(.19, .09, .34), vec3(.03, .02, .08), smoothstep(-.02, .55, y));
      c = mix(c, vec3(.36, .16, .5), exp(-pow(y * 9., 2.)) * .55);                     // the glow on the horizon
      float cl = n(vP * 5. + vec3(uTime * .02, 0., 0.)) * .6 + n(vP * 11. - vec3(uTime * .03, 0., 0.)) * .4;
      c += vec3(.42, .2, .55) * smoothstep(.55, .85, cl) * smoothstep(0., .35, y) * .35;   // slow clouds
      vec3 q = floor(vP * 260.); float s = h(q);
      c += vec3(.9, .85, 1.) * step(.9965, s) * smoothstep(.05, .3, y) * (.5 + .5 * sin(uTime * 2. + s * 90.));
      float m = max(dot(vP, normalize(vec3(-.35, .32, -.88))), 0.);                     // a moon
      c += vec3(.95, .85, 1.) * (smoothstep(.9992, .9996, m) * 1.2 + pow(m, 120.) * .35);
      gl_FragColor = vec4(c, 1.);
    }` }));
scene.add(sky);

/* ---------------------------------------------------------------- the ground: a field of light */
const terrainH = (x, z) => Math.sin(x * .08) * 1.4 + Math.cos(z * .06 + x * .03) * 1.6 + Math.sin(x * .21 + z * .17) * .5 - 2.6;
const lakeAt = (x, z) => Math.exp(-((x - 6) ** 2 / 60 + (z + 40) ** 2 / 180));
{
  const N = 60000, pos = new Float32Array(N * 3), sz = new Float32Array(N), col = new Float32Array(N * 3), c = new THREE.Color();
  let k = 0;
  for (let i = 0; i < N; i++) {
    const x = (Math.random() - .5) * 140, z = 20 - Math.random() * 170;
    if (lakeAt(x, z) > .45) continue;
    pos[k * 3] = x; pos[k * 3 + 1] = terrainH(x, z) + Math.random() * .35; pos[k * 3 + 2] = z;
    sz[k] = .5 + Math.random() * 1.4;
    c.setHSL(.74 + Math.random() * .08, .85, .3 + Math.random() * .35); col.set([c.r, c.g, c.b], k * 3);
    k++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, k * 3), 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz.slice(0, k), 1));
  g.setAttribute('aCol', new THREE.BufferAttribute(col.slice(0, k * 3), 3));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
    vertexShader: `attribute float aSize; attribute vec3 aCol; uniform float uTime, uDpr; varying vec3 vC; varying float vF;
      void main() { vec3 p = position; p.x += sin(uTime * 1.3 + p.z * .4 + p.x * .2) * .08 * (p.y + 3.);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uDpr * 70. / -mv.z; vC = aCol * 1.8; vF = exp(-.0004 * mv.z * mv.z); }`,
    fragmentShader: `varying vec3 vC; varying float vF; void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vC * smoothstep(.5, .1, d) * vF, 1.); }` });
  scene.add(new THREE.Points(g, m)); scene.userData.grass = m;
}
// the ground under the grass, so the field reads as solid
{
  const g = new THREE.PlaneGeometry(160, 190, 80, 95); g.rotateX(-Math.PI / 2); g.translate(0, 0, -75);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, terrainH(p.getX(i), p.getZ(i)) - .05 - lakeAt(p.getX(i), p.getZ(i)) * 2.5);
  g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1c0f33, roughness: 1, flatShading: true })));
}
// the lake: a dark mirror of the sky with slow ripples
const lake = new THREE.Mesh(new THREE.PlaneGeometry(40, 70, 1, 1), new THREE.ShaderMaterial({
  transparent: true, uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uTime; varying vec3 vW; void main() {
    float r = sin(vW.x * 1.7 + uTime * .7) * sin(vW.z * 1.3 - uTime * .5) * .5 + .5;
    float e = smoothstep(0., .5, 1. - max(abs(vW.x - 6.) / 20., abs(vW.z + 40.) / 35.));
    vec3 c = mix(vec3(.05, .03, .11), vec3(.28, .14, .42), r * .35 + .15);
    gl_FragColor = vec4(c, e * .92); }` }));
lake.rotation.x = -Math.PI / 2; lake.position.set(6, -3.3, -40); scene.add(lake);
// spires: dark low-poly rocks around the field
{
  const geo = new THREE.DodecahedronGeometry(1, 0), mat = new THREE.MeshStandardMaterial({ color: 0x2a1840, roughness: .9, flatShading: true });
  const N = 70, inst = new THREE.InstancedMesh(geo, mat, N), d = new THREE.Object3D();
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1, x = side * (14 + Math.random() * 40), z = 10 - Math.random() * 170;
    const h = 1.5 + Math.pow(Math.random(), 2) * 9;
    d.position.set(x, terrainH(x, z) + h * .45, z); d.scale.set(1 + Math.random() * 1.8, h, 1 + Math.random() * 1.6);
    d.rotation.set(Math.random() * .2, Math.random() * 6, Math.random() * .2); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
  }
  scene.add(inst);
}
scene.add(new THREE.HemisphereLight(0x9f7bff, 0x10081c, 1.1));
const moonL = new THREE.DirectionalLight(0xd9c8ff, 1.2); moonL.position.set(-30, 40, -80); scene.add(moonL);
// petals drifting through the air
const petals = (() => {
  const N = 900, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 80; pos[i * 3 + 1] = Math.random() * 30 - 2; pos[i * 3 + 2] = 15 - Math.random() * 160; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
    vertexShader: `uniform float uTime, uDpr; void main() { vec3 p = position; p.y = mod(p.y - uTime * .6, 32.) - 2.; p.x += sin(uTime * .5 + p.z) * 1.5;
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = uDpr * 60. / -mv.z; }`,
    fragmentShader: `void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(.78, .6, 1.) * smoothstep(.5, 0., d) * .55, 1.); }` });
  const p = new THREE.Points(g, m); scene.add(p); return m;
})();

/* ---------------------------------------------------------------- the sculpture: one cloud of points, six shapes */
const NP = 9000;
const fib = (i, n) => { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), t = Math.PI * (3 - Math.sqrt(5)) * i; return [Math.cos(t) * r, y, Math.sin(t) * r]; };
const SH = Array.from({ length: 6 }, () => new Float32Array(NP * 3));
for (let i = 0; i < NP; i++) {
  // 1 three orbs (the arms): each point belongs to one of three spheres side by side
  const o = i % 3, f = fib(Math.floor(i / 3), NP / 3), rr = .42 * Math.cbrt(.55 + Math.random() * .45);
  SH[1].set([(o - 1) * 1.15 + f[0] * rr, f[1] * rr + (o === 1 ? .18 : -.08), f[2] * rr], i * 3);
  // 2 the globe: a shell with a little depth
  const g = fib(i, NP), gr = .98 + Math.random() * .04; SH[2].set([g[0] * gr, g[1] * gr, g[2] * gr], i * 3);
  // 3 the portal ring
  const a = Math.random() * Math.PI * 2, w = 1 + (Math.random() - .5) * .07 * (1 + Math.random() * 2); SH[3].set([Math.cos(a) * w, Math.sin(a) * w, (Math.random() - .5) * .06], i * 3);
  // 4 the data cube (Tabulah): points on a 3D grid, edges denser
  const q = () => Math.round((Math.random() * 2 - 1) * 6) / 6 * .78; const e = Math.random();
  let cx = q(), cy = q(), cz = q(); if (e < .55) { const ax = Math.floor(Math.random() * 3); const s1 = Math.random() < .5 ? -.78 : .78, s2 = Math.random() < .5 ? -.78 : .78, t = Math.random() * 1.56 - .78; [cx, cy, cz] = ax === 0 ? [t, s1, s2] : ax === 1 ? [s1, t, s2] : [s1, s2, t]; }
  SH[4].set([cx, cy, cz], i * 3);
  // 5 the galaxy: two arms
  const arm = i % 2, tt = Math.pow(Math.random(), .7), gr2 = .15 + tt * 1.3, ga = arm * Math.PI + tt * 4.4 + (Math.random() - .5) * .45;
  SH[5].set([Math.cos(ga) * gr2, (Math.random() - .5) * .07 * (1.4 - tt), Math.sin(ga) * gr2], i * 3);
  // 0 the RASA mark, until the logo is sampled: the globe
  SH[0].set(SH[2].subarray(i * 3, i * 3 + 3), i * 3);
}
const sg = new THREE.BufferGeometry();
SH.forEach((s, k) => sg.setAttribute(k ? 'aS' + k : 'position', new THREE.BufferAttribute(s, 3)));
const rnd = new Float32Array(NP * 4); for (let i = 0; i < NP * 4; i++) rnd[i] = Math.random(); sg.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
const smat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: { uFrom: { value: 0 }, uTo: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Vector3() }, uSize: { value: 100 }, uRot: { value: new THREE.Matrix3() },
    uTime: { value: 0 }, uDpr: { value: 1 }, uFade: { value: 0 }, uAcc: { value: ACC }, uPtr: { value: new THREE.Vector2(-1e4, -1e4) } },
  vertexShader: `attribute vec3 aS1, aS2, aS3, aS4, aS5; attribute vec4 aRnd;
    uniform float uFrom, uTo, uK, uSize, uTime, uDpr, uFade; uniform vec3 uC; uniform mat3 uRot; uniform vec2 uPtr;
    varying float vA; varying vec3 vCol; uniform vec3 uAcc;
    vec3 shape(float s) { return s < .5 ? position : s < 1.5 ? aS1 : s < 2.5 ? aS2 : s < 3.5 ? aS3 : s < 4.5 ? aS4 : aS5; }
    void main() {
      vec3 a = shape(uFrom), b = shape(uTo);
      float k = smoothstep(aRnd.x * .35, .65 + aRnd.x * .35, uK);               // points leave at different times
      vec3 burst = normalize(aRnd.yzw - .5 + 1e-3) * (.35 + aRnd.x * .6) * sin(3.14159 * k);
      vec3 p = mix(a, b, k) + burst;
      p += .012 * vec3(sin(uTime * 1.3 + aRnd.y * 40.), cos(uTime * 1.1 + aRnd.z * 40.), sin(uTime * .9 + aRnd.w * 40.));
      p = uRot * p;
      vec2 s = vec2(uC.x + p.x * uSize, uC.y - p.y * uSize);
      // the pointer pushes the points aside
      vec2 dp = s - uPtr; float pd = length(dp); s += dp / max(pd, 1.) * 40. * exp(-pd * pd / 9000.);
      gl_Position = projectionMatrix * viewMatrix * vec4(s.x, -s.y, p.z * uSize, 1.);
      float depth = clamp(p.z * .5 + .5, 0., 1.);
      gl_PointSize = uDpr * (1.4 + aRnd.y * 2.6) * (.7 + depth * .7) * clamp(uSize / 220., .6, 1.5);
      vCol = mix(uAcc, mix(vec3(1., .82, 1.), vec3(1.), aRnd.z), aRnd.w * .55 + depth * .25);
      vA = uFade * (.35 + depth * .65);
    }`,
  fragmentShader: `varying float vA; varying vec3 vCol; void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = vA * smoothstep(.5, .15, d); gl_FragColor = vec4(vCol * a, a); }`,
});
const sculpt = new THREE.Points(sg, smat); sculpt.frustumCulled = false; ui.add(sculpt);
// the RASA mark: sample the logo into points (same-origin SVG, drawn to a canvas)
{
  const img = new Image(); img.src = 'assets/rasa-logo.svg';
  img.onload = () => {
    const W = 434, H = 264, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.drawImage(img, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data, on = [];
    for (let y = 0; y < H; y += 2) for (let X = 0; X < W; X += 2) if (d[(y * W + X) * 4 + 3] > 128) on.push([X, y]);
    if (!on.length) return;
    const s = sg.attributes.position;
    for (let i = 0; i < NP; i++) { const [X, Y] = on[Math.floor(Math.random() * on.length)]; s.setXYZ(i, (X / W - .5) * 2.4 + (Math.random() - .5) * .008, -(Y / H - .5) * 2.4 * H / W, (Math.random() - .5) * .12); }
    s.needsUpdate = true;
  };
}

/* ---------------------------------------------------------------- chapters */
const $ = s => document.querySelector(s);
const CH = [['.hero', 0], ['.eco', 1], ['.outcome', 2], ['.numbers', 2], ['.uni-intro', 3], ['.portals', 3], ['.tabulah', 4], ['.moments', 5], ['.work', 5], ['.close', 5], ['.foot', 5]]
  .map(([s, k]) => ({ el: $(s), k, s })).filter(c => c.el);
const S = { x: innerWidth / 2, y: innerHeight / 2, size: 0, fade: 0, rx: 0, ry: 0 }, T = Object.assign({}, S);
let shape = 0, from = 0, k = 1;
function chapter() { const mid = innerHeight / 2; for (const c of CH) { const r = c.el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return c; } return CH[0]; }
function place(c) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  const s = c.s;
  if (s === '.hero') { const p = RW.hero || 0, a = seg(p, .5, .66); Object.assign(T, { x: W / 2, y: H * .42, size: m * .24, fade: a * (1 - seg(p, .96, 1)) }); }
  else if (s === '.eco') Object.assign(T, { x: wide ? W * .27 : W * .5, y: wide ? H * .6 : H * .36, size: wide ? m * .24 : W * .26, fade: 1 });
  else if (s === '.outcome') Object.assign(T, { x: wide ? W * .78 : W * .82, y: H * .5, size: m * .26, fade: 1 });
  else if (s === '.numbers') Object.assign(T, { x: wide ? W * .82 : W * .86, y: H * .22, size: m * .1, fade: .5 });
  else if (s === '.uni-intro') Object.assign(T, { x: wide ? W * .72 : W * .5, y: wide ? H * .5 : H * .24, size: wide ? m * .24 : W * .25, fade: 1 });
  else if (s === '.portals') { const P = RW.portal || {}; Object.assign(T, { x: P.x ?? W / 2, y: P.y ?? H / 2, size: Math.max(P.r ?? m * .07, 1), fade: P.fade ?? 0 }); }
  else if (s === '.tabulah') Object.assign(T, { x: wide ? W * .44 : W * .82, y: wide ? H * .8 : H * .1, size: wide ? m * .08 : W * .09, fade: .9 });   // a small data cube, clear of the copy and the phones
  else if (s === '.moments') Object.assign(T, { x: W / 2, y: H / 2, size: m * .3, fade: 0 });
  else if (s === '.work') Object.assign(T, { x: W * .85, y: H * .5, size: m * .2, fade: .25 });
  else if (s === '.close') Object.assign(T, { x: wide ? W * .72 : W * .5, y: wide ? H * .5 : H * .3, size: wide ? m * .32 : W * .38, fade: 1 });
  else Object.assign(T, { fade: 0 });
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: -1e4, y: -1e4, nx: 0, ny: 0 };
addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.nx = e.clientX / innerWidth - .5; ptr.ny = e.clientY / innerHeight - .5; }, { passive: true });
let W = 0, H = 0, dpr = 1, last = performance.now(), time = 0, camZ = 12, lnx = 0, lny = 0;
function size() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75);
  R.setPixelRatio(dpr); R.setSize(W, H, false); R2.setPixelRatio(dpr); R2.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
  ortho.left = 0; ortho.right = W; ortho.top = 0; ortho.bottom = -H; ortho.updateProjectionMatrix();
}
size(); addEventListener('resize', size);
const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m4 = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.12, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt;
  // the camera travels through the field with the whole page, and leans towards the pointer
  const doc = Math.max(1, document.documentElement.scrollHeight - innerHeight), pg = clamp(scrollY / doc);
  camZ = lerp(camZ, 12 - pg * 110, 1 - Math.exp(-dt * 3));
  lnx = lerp(lnx, ptr.nx, 1 - Math.exp(-dt * 3)); lny = lerp(lny, ptr.ny, 1 - Math.exp(-dt * 3));
  cam.position.set(Math.sin(pg * 6) * 3 + lnx * 2, 1.4 + Math.sin(pg * 9) * .6 - lny * .8, camZ);
  cam.lookAt(cam.position.x * .6 - lnx * 4, .8 - lny * 2, camZ - 30);
  sky.position.copy(cam.position);
  scene.userData.grass.uniforms.uTime.value = time; scene.userData.grass.uniforms.uDpr.value = dpr;
  sky.material.uniforms.uTime.value = time; lake.material.uniforms.uTime.value = time; petals.uniforms.uTime.value = time; petals.uniforms.uDpr.value = dpr;

  // the sculpture: change shape when the chapter changes, glide to its place
  const c = chapter(); place(c);
  if (c.k !== shape) { from = (k >= 1) ? shape : (k > .5 ? shape : from); shape = c.k; k = 0; }
  k = Math.min(1, k + dt / (reduced ? .01 : 1.6));
  const exact = c.s === '.hero' || c.s === '.portals';
  const e = exact ? 1 : 1 - Math.exp(-dt * 4);
  for (const key of ['x', 'y', 'size', 'fade']) S[key] = lerp(S[key], T[key], e);
  const tilt = shape === 5 ? -1.05 : shape === 3 ? 0 : -.25;
  q.setFromAxisAngle(Y, (shape === 0 ? Math.sin(time * .5) * .35 : time * .25) + lnx * .8).premultiply(q2.setFromAxisAngle(X, tilt + lny * .4));
  if (c.s === '.portals') q.identity();               // the ring faces the camera, so its rim sits exactly on the opening circle
  smat.uniforms.uRot.value.setFromMatrix4(m4.makeRotationFromQuaternion(q));
  smat.uniforms.uFrom.value = from; smat.uniforms.uTo.value = shape; smat.uniforms.uK.value = k;
  smat.uniforms.uC.value.set(S.x, S.y, 0); smat.uniforms.uSize.value = S.size; smat.uniforms.uFade.value = clamp(S.fade);
  smat.uniforms.uTime.value = time; smat.uniforms.uDpr.value = dpr; smat.uniforms.uPtr.value.set(ptr.x, ptr.y);
  sculpt.visible = S.fade > .01;

  R.clear(); R.render(scene, cam); R2.render(ui, ortho);
}
requestAnimationFrame(frame);
