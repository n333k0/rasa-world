// RASA World v4: a different world (owner, 2026-11-12: "try a different world and universe, a different style... a 3D world").
// Instead of v2/v3's glass ball, the world is a planet made of light: thousands of points on a turning sphere, brighter
// where there is land, with RASA's real event cities lit (Los Angeles, Santa Monica, San Francisco, Mountain View, Miami,
// Paris) and arcs of light travelling between them. A violet atmosphere hugs the limb. The three arms are three small dotted
// moons on dotted orbits; the portals are a ring of particles; the close is a spiral galaxy. The room behind is Not
// Human's (world2.js), so the page keeps the same light. Same journey and window.RW contract as world2.js.
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const root = document.documentElement;
const RW = window.RW || (window.RW = {});
const ACC = [.71, .61, 1];   // #B49CFF

/* ---------------------------------------------------------------- the room: Not Human's, quieter */
const ROOM = /* glsl */`
uniform vec2 uRes; uniform float uTime; uniform vec4 uOrb; uniform vec4 uHalo; uniform float uRing, uAura, uVig, uScroll;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 room(vec2 px) {
  vec2 uv = vec2(px.x / uRes.x, 1. - px.y / uRes.y), asp = vec2(uRes.x / uRes.y, 1.);
  vec3 c = vec3(.032, .032, .04);
  float d = length((uv - uOrb.xy) * asp), r = uOrb.w;
  c += uOrb.z * (vec3(.42, .36, .7) * exp(-d * d / (r * r)) * .5 + vec3(.2, .22, .5) * exp(-d * d / (r * r * 5.)) * .2);
  vec2 rc = .5 + (uOrb.xy - .5) * -.18; float rd = length((uv - rc) * asp), R = .62;
  c += uRing * vec3(exp(-pow((rd - R - .012) / .018, 2.)), exp(-pow((rd - R) / .016, 2.)), exp(-pow((rd - R + .012) / .02, 2.))) * vec3(.05, .055, .075);
  float e = smoothstep(.42, .95, length((uv - .5) * vec2(1., 1.15)));
  c += uAura * e * mix(vec3(.24, .1, .5), vec3(.08, .12, .42), uv.y) * .25;
  vec2 sp = px + vec2(0., uScroll * .08); vec2 cell = floor(sp / 40.); float h = hash(cell);
  if (h > .88) { vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 40.; float sr = length(sp - cell * 40. - o);
    c += vec3(.85, .85, 1.) * smoothstep(1.3, 0., sr) * (.5 + .5 * sin(uTime * (1. + h * 2.) + h * 40.)) * (h - .88) * 4.; }
  vec2 hp = (uv - uHalo.xy) * asp;
  c *= 1. - uHalo.w * .7 * exp(-dot(hp, hp) / max(1e-4, uHalo.z * uHalo.z));
  c *= 1. - uVig * smoothstep(.3, 1.05, length((uv - .5) * vec2(1., 1.25)));
  return c;
}`;
const roomCv = document.querySelector('.room'), glassCv = document.querySelector('.glass');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !roomCv || !glassCv) { root.classList.add('no-gl'); throw new Error('RASA World: no WebGL'); }
const U = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uOrb: { value: new THREE.Vector4(.5, .5, 0, .2) }, uHalo: { value: new THREE.Vector4(.5, .5, .1, 0) },
  uRing: { value: .5 }, uAura: { value: .6 }, uVig: { value: .45 }, uScroll: { value: 0 }, uRp: { value: .75 } };
const roomR = new THREE.WebGLRenderer({ canvas: roomCv, antialias: false, alpha: false });
roomR.setPixelRatio(.75);
const roomScene = new THREE.Scene(), flatCam = new THREE.Camera();
roomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: ROOM + `uniform float uRp; void main() { vec2 px = vec2(gl_FragCoord.x, uRes.y * uRp - gl_FragCoord.y) / uRp; gl_FragColor = vec4(room(px), 1.); }` })));

const R3 = new THREE.WebGLRenderer({ canvas: glassCv, antialias: true, alpha: true });
R3.setClearColor(0, 0);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -8000, 8000);

/* ---------------------------------------------------------------- noise for the land */
const perm = new Uint8Array(512); { const p = [...Array(256).keys()]; let s = 7; for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y, z) => { const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z); return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
function noise(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z), A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  return lerp(lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u), lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
    lerp(lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u), lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
}
const fbm = (x, y, z) => noise(x, y, z) * .6 + noise(x * 2.1, y * 2.1, z * 2.1) * .28 + noise(x * 4.3, y * 4.3, z * 4.3) * .12;
const ll = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
// RASA's cities (from rasaworld.com's case studies and events)
const CITIES = { la: ll(34.05, -118.24), sm: ll(34.01, -118.5), sf: ll(37.77, -122.42), mv: ll(37.39, -122.08), mia: ll(25.76, -80.19), par: ll(48.86, 2.35) };
const C = Object.values(CITIES);
const landAt = v => { let n = fbm(v.x * 1.6 + 3, v.y * 1.6, v.z * 1.6); for (const c of C) n += .5 * Math.exp(-v.distanceToSquared(c) / .02); return n; };

/* ---------------------------------------------------------------- the points shader (planet, moons, arcs, rings, galaxy) */
const PV = /* glsl */`
attribute float aSize; attribute float aB; attribute float aT;
uniform vec3 uC; uniform float uR; uniform mat3 uRot; uniform float uDpr, uFade, uScale, uTime, uMode;
varying float vA; varying float vZ; varying float vB; varying float vT;
void main() {
  vec3 p = uRot * position;
  vec3 w = vec3(uC.x + p.x * uR, -uC.y + p.y * uR, p.z * uR);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  float r = length(position);
  vZ = clamp(p.z / max(r, 1e-3), -1., 1.); vB = aB; vT = aT;
  float front = uMode > .5 ? 1. : smoothstep(-.35, .25, vZ);
  vA = uFade * mix(.16, 1., front);
  gl_PointSize = aSize * uDpr * uScale;
}`;
const PF = /* glsl */`
uniform vec3 uCol; uniform vec3 uAcc; uniform float uTime, uMode;
varying float vA; varying float vZ; varying float vB; varying float vT;
void main() {
  vec2 q = gl_PointCoord - .5; float d = length(q);
  float disc = smoothstep(.5, .2, d);
  float a = vA * disc;
  vec3 col = mix(uCol, uAcc, clamp(1. - abs(vZ) * 1.6, 0., 1.) * .8);          // the limb turns violet
  if (uMode > 1.5) {                                                            // arcs: a travelling head with a tail
    float h = fract(uTime * .22 + vB);
    float k = vT - h; k = k < 0. ? k + 1. : k;
    a *= .12 + 1.6 * exp(-pow(k * 9., 2.)) + smoothstep(.0, .25, 1. - k) * .0;
    col = mix(uAcc, vec3(1.), exp(-pow(k * 14., 2.)));
  } else {
    a *= vB;
    col = mix(col, vec3(1., .96, .9), step(1.5, vB) * .9);                      // cities: warm white
  }
  if (a < .003) discard;
  gl_FragColor = vec4(col * a, a);
}`;
const v3a = a => new THREE.Vector3(...a);
function pointsMat(col, mode = 0) {
  return new THREE.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: new THREE.Vector3() }, uR: { value: 1 }, uRot: { value: new THREE.Matrix3() }, uDpr: { value: 1 }, uFade: { value: 1 }, uScale: { value: 1 },
      uTime: { value: 0 }, uMode: { value: mode }, uCol: { value: v3a(col) }, uAcc: { value: v3a(ACC) } } });
}
function makePoints(pos, size, b, t, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(b, 1));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t || new Array(size.length).fill(0), 1));
  const p = new THREE.Points(g, mat); p.frustumCulled = false; scene.add(p); return p;
}
// the planet: a Fibonacci sphere, land brighter and bigger
const planet = (() => {
  const N = 14000, pos = [], size = [], b = [], v = new THREE.Vector3(), ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), th = ga * i;
    v.set(Math.cos(th) * r, y, Math.sin(th) * r);
    const land = landAt(v) > .02;
    pos.push(v.x, v.y, v.z); size.push(land ? 3 : 1.9); b.push(land ? 1 : .32);
  }
  // cities: bright, warm, a few points each
  for (const c of C) for (let k = 0; k < 6; k++) { const j = c.clone().add(new THREE.Vector3((Math.random() - .5) * .02, (Math.random() - .5) * .02, (Math.random() - .5) * .02)).normalize().multiplyScalar(1.003); pos.push(j.x, j.y, j.z); size.push(k ? 3 : 6); b.push(2); }
  return makePoints(pos, size, b, null, pointsMat([.86, .84, 1]));
})();
// arcs between cities, lifted off the surface
const arcs = (() => {
  const pairs = [['la', 'par'], ['sf', 'mia'], ['mv', 'par'], ['sm', 'mia'], ['la', 'sf']];
  const pos = [], size = [], b = [], t = [], M = 140;
  pairs.forEach(([a, z], j) => {
    const A = CITIES[a], Z = CITIES[z], ang = A.angleTo(Z);
    for (let i = 0; i <= M; i++) {
      const s = i / M, q = new THREE.Vector3().copy(A).multiplyScalar(Math.sin((1 - s) * ang) / Math.sin(ang)).add(Z.clone().multiplyScalar(Math.sin(s * ang) / Math.sin(ang)));
      q.normalize().multiplyScalar(1 + Math.sin(Math.PI * s) * (.08 + ang * .12));
      pos.push(q.x, q.y, q.z); size.push(2.2); b.push(j * .37); t.push(s);
    }
  });
  return makePoints(pos, size, b, t, pointsMat([1, 1, 1], 2));
})();
// the atmosphere: a rim of light on a slightly larger sphere
const atmo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: { uAcc: { value: v3a(ACC) }, uFade: { value: 1 } },
  vertexShader: `varying vec3 vN; void main() { vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform vec3 uAcc; uniform float uFade; varying vec3 vN; void main() { float f = 1. - clamp(vN.z, 0., 1.);
    vec3 c = uAcc * pow(f, 3.2) * 1.1 + vec3(.55, .8, 1.) * pow(f, 9.) * .9 + uAcc * .05 * (1. - f) + vec3(1., .7, .9) * pow(f, 1.6) * .06; gl_FragColor = vec4(c * uFade, 1.); }` }));
atmo.frustumCulled = false; scene.add(atmo);
// three moons, each a small dotted sphere, on dotted orbits
const moon = () => { const N = 700, pos = [], size = [], b = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < N; i++) { const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), th = ga * i; pos.push(Math.cos(th) * r, y, Math.sin(th) * r); size.push(2.4); b.push(1); } return makePoints(pos, size, b, null, pointsMat([.9, .88, 1])); };
const moons = [moon(), moon(), moon()];
const orbitPts = () => { const pos = [], size = [], b = []; for (let i = 0; i < 260; i++) { const a = i / 260 * Math.PI * 2; pos.push(Math.cos(a), 0, Math.sin(a)); size.push(2.2); b.push(.7); } return makePoints(pos, size, b, null, pointsMat([.8, .76, 1], 1)); };
const orbits = [orbitPts(), orbitPts(), orbitPts()];
// the portal: a ring of particles with a little scatter
const ring = (() => { const pos = [], size = [], b = []; for (let i = 0; i < 2400; i++) { const a = Math.random() * Math.PI * 2, r = 1 + (Math.random() - .5) * .025 * (1 + Math.random() * 3); pos.push(Math.cos(a) * r, Math.sin(a) * r, 1); size.push(Math.random() < .1 ? 3 : 1.6); b.push(.35 + Math.random() * .65); } return makePoints(pos, size, b, null, pointsMat([.95, .93, 1], 1)); })();
// the galaxy at the close: a two-arm spiral
const galaxy = (() => { const pos = [], size = [], b = []; for (let i = 0; i < 5200; i++) { const arm = i % 2, t = Math.pow(Math.random(), .6), r = 1.35 + t * 2.6, a = arm * Math.PI + t * 4.2 + (Math.random() - .5) * .5 * (1 - t * .5);
  pos.push(Math.cos(a) * r, (Math.random() - .5) * .08, Math.sin(a) * r); size.push(Math.random() < .06 ? 2.6 : 1.3); b.push(.25 + Math.random() * .6 * (1 - t * .5)); } return makePoints(pos, size, b, null, pointsMat([.85, .82, 1], 1)); })();

/* ---------------------------------------------------------------- where the world goes (as world2.js) */
const $ = s => document.querySelector(s);
const SEC = { hero: $('.hero'), eco: $('.eco'), outcome: $('.outcome'), numbers: $('.numbers'), intro: $('.uni-intro'), portals: $('.portals'),
  tabulah: $('.tabulah'), moments: $('.moments, .gal'), work: $('.work'), close: $('.close'), foot: $('.foot') };
const tags = [...document.querySelectorAll('.moon-tags span')];
const S = { x: innerWidth / 2, y: innerHeight / 2, R: 0, fade: 0, moons: 0, orbit: 1.8, gal: 0, hollow: 0, act: -1 };
const T = Object.assign({}, S);
function station() { const mid = innerHeight / 2; for (const [k, el] of Object.entries(SEC)) { if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return k; } return 'hero'; }
function target(st) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  Object.assign(T, { hollow: 0, act: -1, gal: 0, moons: 0, orbit: 1.8 });
  if (st === 'hero') { const p = RW.hero || 0, D = m * .44, a = seg(p, .52, .66); Object.assign(T, { x: W / 2, y: H / 2, R: D / 2, fade: a, moons: seg(p, .7, .95) }); }
  else if (st === 'eco') Object.assign(T, { x: wide ? W * .25 : W * .5, y: wide ? H * .6 : H * .375, R: wide ? m * .17 : Math.min(W * .16, H * .075), fade: 1, moons: 1, act: RW.arm ?? 0, orbit: 1.9 });
  else if (st === 'outcome') Object.assign(T, { x: wide ? W * .84 : W * .88, y: H * .5, R: m * (wide ? .3 : .25), fade: 1, moons: .6, orbit: 1.5 });
  else if (st === 'numbers') Object.assign(T, { x: wide ? W * .84 : W * .88, y: H * .3, R: 0, fade: 0 });
  else if (st === 'intro') Object.assign(T, { x: wide ? W * .74 : W * .76, y: wide ? H * .5 : H * .22, R: wide ? m * .22 : W * .17, fade: 1 });
  else if (st === 'portals') { const P = RW.portal || {}; Object.assign(T, { x: P.x ?? W / 2, y: P.y ?? H / 2, R: P.r ?? 0, fade: P.fade ?? 0, hollow: P.hollow ?? 0 }); }
  else if (st === 'close' || st === 'foot') Object.assign(T, { x: wide ? W * .72 : W * .5, y: wide ? H * .5 : H * .3, R: wide ? m * .14 : W * .16, fade: st === 'foot' ? 0 : 1, moons: .8, orbit: 1.6, gal: 1 });
  else Object.assign(T, { R: S.R * .6, fade: 0 });
  return st;
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
addEventListener('pointermove', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; if (ptr.x < -1e3) { ptr.x = ptr.tx; ptr.y = ptr.ty; } }, { passive: true });
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const PLANES = [[-.32, -.18], [-.42, .32], [-.24, .62]].map(([tx, tz]) => new THREE.Quaternion().setFromAxisAngle(Z, tz).multiply(new THREE.Quaternion().setFromAxisAngle(X, tx)));
const RADII = [1, 1.28, 1.56], moonS = [1, 1, 1];
const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), m3 = new THREE.Matrix3();
let W = 0, H = 0, dpr = 1, last = performance.now(), time = 0;
function size() { W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2); roomR.setSize(W, H, false); R3.setPixelRatio(dpr); R3.setSize(W, H, false);
  cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix(); U.uRes.value.set(W, H); }
size(); addEventListener('resize', size);
const set = (pts, cx, cy, R, rot, fadeV, scale = 1) => { const u = pts.material.uniforms; u.uC.value.set(cx, cy, 0); u.uR.value = R; u.uRot.value.copy(rot); u.uDpr.value = dpr; u.uFade.value = fadeV; u.uScale.value = scale; u.uTime.value = time; pts.visible = fadeV > .005 && R > .5; };

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.12, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt;
  const st = target(station());
  const exact = st === 'hero' || (st === 'portals' && RW.portal && RW.portal.exact);
  const k = exact ? 1 : 1 - Math.exp(-dt * (st === 'portals' ? 9 : 4.2));
  for (const key of ['x', 'y', 'R', 'fade', 'moons', 'orbit', 'gal']) S[key] = lerp(S[key], T[key], k);
  S.hollow = T.hollow; S.act = T.act;
  ptr.x = lerp(ptr.x, ptr.tx, 1 - Math.exp(-dt * 6)); ptr.y = lerp(ptr.y, ptr.ty, 1 - Math.exp(-dt * 6));
  const R = Math.max(S.R, .001), fd = clamp(S.fade), solid = fd * (1 - S.hollow);
  const lx = ptr.x > -1e3 ? (ptr.x / W - .5) : 0, ly = ptr.y > -1e3 ? (ptr.y / H - .5) : 0;
  U.uTime.value = time; U.uScroll.value = scrollY;
  U.uOrb.value.set((S.x - R * .3) / W, 1 - (S.y - R * .4) / H, solid * .8, Math.max(.05, R / H * 1.6));
  U.uHalo.value.set(S.x / W, 1 - S.y / H, R / H * 1.05, .2 * solid);

  // the planet turns on a tilted axis, leaning a touch towards the pointer; the size of a dot follows the planet's size
  q.setFromAxisAngle(Y, time * .12 + 2.2 + lx * .6).premultiply(q2.setFromAxisAngle(X, .42 + ly * .3)).premultiply(q2.setFromAxisAngle(Z, -.2));
  m3.setFromMatrix4(m4.makeRotationFromQuaternion(q));
  const sc = clamp(R / 240, .8, 1.3);
  set(planet, S.x, S.y, R, m3, solid, sc); set(arcs, S.x, S.y, R, m3, solid, sc);
  atmo.position.set(S.x, -S.y, 0); atmo.scale.setScalar(R * 1.03); atmo.material.uniforms.uFade.value = solid; atmo.visible = solid > .005;
  set(ring, S.x, S.y, R, m3.identity(), fd * S.hollow, 1);

  const mA = clamp(S.moons) * solid;
  for (let i = 0; i < 3; i++) {
    const on = S.act === i;
    moonS[i] = lerp(moonS[i], on ? 1.9 : S.act >= 0 ? .8 : 1, 1 - Math.exp(-dt * 5));
    const a = time * (.3 - i * .07) + i * 2.1, ro = R * S.orbit * RADII[i] / RADII[1];
    v3.set(Math.cos(a) * ro, 0, Math.sin(a) * ro).applyQuaternion(PLANES[i]);
    const r = R * .13 * moonS[i];
    m3.setFromMatrix4(m4.makeRotationFromQuaternion(q2.setFromAxisAngle(Y, time * .5 + i)));
    set(moons[i], S.x + v3.x, S.y - v3.y, r, m3, mA * (v3.z < -R * .2 ? .35 : 1), clamp(r / 30, .8, 1.2));
    m3.setFromMatrix4(m4.makeRotationFromQuaternion(PLANES[i]));
    set(orbits[i], S.x, S.y, ro, m3, mA * (on ? .9 : .35), 1);
    const tg = tags[i];
    if (tg) { tg.style.setProperty('--x', clamp(S.x + v3.x, 44, W - 44).toFixed(1) + 'px'); tg.style.setProperty('--y', (S.y - v3.y).toFixed(1) + 'px');
      tg.style.setProperty('--o', (r + 12).toFixed(1) + 'px'); tg.style.setProperty('--a', ((st === 'eco' ? mA : 0) * (v3.z > -R * .2 ? 1 : .3)).toFixed(2)); tg.classList.toggle('on', on); }
  }
  m3.setFromMatrix4(m4.makeRotationFromQuaternion(q2.setFromAxisAngle(Y, time * .05).premultiply(PLANES[1])));
  set(galaxy, S.x, S.y, R, m3, clamp(S.gal) * solid, 1);

  roomR.render(roomScene, flatCam);
  R3.render(scene, cam);
}
requestAnimationFrame(frame);
