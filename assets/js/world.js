// RASA World: one glass world travels the whole page (the Not Human v8/v9 idea, rebuilt for RASA).
//  - The room (.room canvas): near-black space with RASA pink and violet light pools, a star field that drifts with the
//    scroll, and a halo behind the globe. It is a GLSL function, so the glass can sample it too.
//  - The glass (.glass canvas): spheres drawn in screen pixels (orthographic camera). Each one refracts the room per colour
//    channel (dispersion), with a lavender rim and two highlights. The globe carries engraved meridians; the three moons
//    are RASA's three arms; in the portals the globe turns hollow and its rim frames each universe as it opens; at the
//    close a galaxy of small glass bodies orbits it.
//  - Where it goes is set per section (STATIONS below) and read from window.RW, which page.js writes every frame.
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const root = document.documentElement;
const RW = window.RW || (window.RW = {});

/* ---------------------------------------------------------------- the room, shared by both canvases */
const ROOM = /* glsl */`
uniform vec2 uRes; uniform float uTime; uniform vec3 uGlobe; uniform float uHalo; uniform vec2 uPtr; uniform float uScroll;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 room(vec2 px) {
  float a = uRes.x / uRes.y;
  vec2 q = (px - .5 * uRes) / uRes.y;
  float t = uTime * .06;
  vec3 c = vec3(.034, .031, .040);
  vec2 p1 = vec2(-.48 * a + .06 * sin(t * 2.3), .34 + .05 * cos(t * 1.7));
  vec2 p2 = vec2(.44 * a + .05 * cos(t * 1.9), -.40 + .06 * sin(t * 2.1));
  vec2 p3 = vec2(.10 * sin(t), .62);
  c += vec3(.93, .59, .78) * .20 * exp(-dot(q - p1, q - p1) * 2.6);
  c += vec3(.42, .28, .95) * .22 * exp(-dot(q - p2, q - p2) * 2.2);
  c += vec3(.55, .42, .85) * .07 * exp(-dot(q - p3, q - p3) * 4.);
  // the halo behind the globe: a soft pink core and a lavender ring the glass can bend
  float d = length(px - uGlobe.xy) / max(uGlobe.z, 1.);
  c += vec3(.80, .72, 1.) * .20 * exp(-pow((d - 1.28) * 2.4, 2.)) * uHalo;
  c += vec3(.93, .59, .78) * .07 * exp(-d * d * .6) * uHalo;
  // the pointer carries a faint light
  vec2 dp = (px - uPtr) / uRes.y;
  c += vec3(.75, .66, 1.) * .05 * exp(-dot(dp, dp) * 18.);
  // stars, drifting with the scroll
  vec2 sp = px + vec2(0., uScroll * .12);
  vec2 cell = floor(sp / 42.); float h = hash(cell);
  if (h > .86) {
    vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 42.;
    float r = length(sp - cell * 42. - o);
    float tw = .55 + .45 * sin(uTime * (1. + h * 3.) + h * 40.);
    c += vec3(.9, .86, 1.) * smoothstep(1.7, 0., r) * tw * (h - .86) * 7.;
  }
  float v = length((px / uRes) - .5);
  return c * (1. - .45 * v * v);
}`;

/* ---------------------------------------------------------------- the two renderers */
const roomCv = document.querySelector('.room'), glassCv = document.querySelector('.glass');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !roomCv || !glassCv) { root.classList.add('no-gl'); throw new Error('RASA World: no WebGL'); }

const U = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uGlobe: { value: new THREE.Vector3(-1e4, -1e4, 1) }, uHalo: { value: 0 },
  uPtr: { value: new THREE.Vector2(-1e4, -1e4) }, uScroll: { value: 0 }, uDpr: { value: 1 } };

const roomR = new THREE.WebGLRenderer({ canvas: roomCv, antialias: false, alpha: false, powerPreference: 'high-performance' });
roomR.setPixelRatio(1);
const roomScene = new THREE.Scene(), flatCam = new THREE.Camera();
roomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: U, depthTest: false, depthWrite: false,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: ROOM + `void main() { vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); gl_FragColor = vec4(room(px), 1.); }`,
})));

const glassR = new THREE.WebGLRenderer({ canvas: glassCv, antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
glassR.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -6000, 6000);

const GLASS_V = /* glsl */`
attribute float aKind; attribute vec3 aTint;
varying vec3 vN; varying vec3 vObjN; varying float vKind; varying vec3 vTint; varying float vR;
void main() {
  mat4 im = mat4(1.);
  #ifdef USE_INSTANCING
  im = instanceMatrix;
  #endif
  vR = length(im[0].xyz);
  vN = normalize(mat3(viewMatrix) * mat3(im) * normal);
  vObjN = normal; vKind = aKind; vTint = aTint;
  gl_Position = projectionMatrix * viewMatrix * im * vec4(position, 1.);
}`;
const GLASS_F = ROOM + /* glsl */`
uniform float uDpr; uniform float uHollow; uniform float uFade; uniform mat3 uSpin;
varying vec3 vN; varying vec3 vObjN; varying float vKind; varying vec3 vTint; varying float vR;
void main() {
  vec3 n = normalize(vN);
  float nz = clamp(n.z, 0., 1.);
  float edge = 1. - nz;
  vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  // a ball lens: the room behind is bent and split per colour channel
  float k = vR * (.95 + .25 * edge);
  vec2 off = vec2(n.x, -n.y) * k;
  vec3 col;
  col.r = room(px - off * 1.00).r;
  col.g = room(px - off * 1.07).g;
  col.b = room(px - off * 1.15).b;
  col *= 1.55;
  col += vTint * (.02 + .08 * edge);
  // engraved meridians and parallels on the globe
  if (vKind < .5) {
    vec3 o = uSpin * vObjN;
    float lat = asin(clamp(o.y, -1., 1.)), lon = atan(o.z, o.x);
    float gl = abs(fract(lon / .3927) - .5), gp = abs(fract(lat / .3927) - .5);
    float w = fwidth(lon / .3927) * 1.2, wp = fwidth(lat / .3927) * 1.2;
    float line = max(1. - smoothstep(0., w, .5 - gl), 1. - smoothstep(0., wp, .5 - gp));
    col += vec3(.85, .78, 1.) * line * .16 * (.4 + .6 * nz);
  }
  // rim and two highlights, lights fixed on the screen
  float fres = pow(edge, 2.6);
  col += mix(vec3(.80, .72, 1.), vTint, .35) * fres * 1.15;
  vec3 h1 = normalize(vec3(-.45, .62, .64) + vec3(0., 0., 1.));
  vec3 h2 = normalize(vec3(.7, -.5, .45) + vec3(0., 0., 1.));
  col += vec3(1.) * pow(max(dot(n, h1), 0.), 90.) * 1.3;
  col += vec3(.93, .59, .78) * pow(max(dot(n, h2), 0.), 26.) * .45;
  float a = 1.;
  if (vKind < .5 && uHollow > 0.) {
    // the portal: only a thin rim stays, whatever the size
    float band = pow(edge, 1.2 + vR / 45.);
    col += vec3(.85, .78, 1.) * band * .8 * uHollow;
    a = mix(1., clamp(band * 3., 0., 1.), uHollow);
  }
  gl_FragColor = vec4(col, a * uFade);
}`;
const glassMat = new THREE.ShaderMaterial({
  uniforms: Object.assign({}, U, { uHollow: { value: 0 }, uFade: { value: 1 }, uSpin: { value: new THREE.Matrix3() } }),
  vertexShader: GLASS_V, fragmentShader: GLASS_F, transparent: true, extensions: { derivatives: true },
});
// the globe is its own mesh (it fades and turns hollow on its own); moons and the galaxy share one instanced mesh
const GAL = 110, MOONS = 3;
const geoHi = new THREE.SphereGeometry(1, 96, 64), geoLo = new THREE.SphereGeometry(1, 28, 18);
const globe = new THREE.InstancedMesh(geoHi, glassMat, 1);
globe.geometry = geoHi.clone();
globe.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([0]), 1));
globe.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array([.8, .7, 1]), 3));
scene.add(globe);
const bodyMat = glassMat.clone();
bodyMat.uniforms = Object.assign({}, U, { uHollow: { value: 0 }, uFade: { value: 1 }, uSpin: { value: new THREE.Matrix3() } });
const bodies = new THREE.InstancedMesh(geoLo.clone(), bodyMat, MOONS + GAL);
const kinds = new Float32Array(MOONS + GAL).fill(2), tints = new Float32Array((MOONS + GAL) * 3);
const MOON_TINT = [[1, .93, .82], [.93, .59, .78], [.62, .58, 1]];   // Atelier (warm), Creates (RASA pink), Tabulah (violet)
for (let i = 0; i < MOONS + GAL; i++) {
  const t = i < MOONS ? MOON_TINT[i] : (i % 3 === 0 ? [.93, .59, .78] : [.8, .74, 1]);
  if (i < MOONS) kinds[i] = 1;
  tints.set(t, i * 3);
}
bodies.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
bodies.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
bodies.frustumCulled = false; globe.frustumCulled = false;
scene.add(bodies);
// orbit lines, one per moon
const orbits = MOON_TINT.map(() => {
  const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xece1fd, transparent: true, opacity: .2, depthWrite: false }));
  line.frustumCulled = false; scene.add(line); return line;
});
// galaxy: each body has its own radius, phase, size and lift out of the disc
const G = Array.from({ length: GAL }, (_, i) => { const r = 1.35 + Math.pow(Math.random(), .7) * 2.4; return { r, a: Math.random() * Math.PI * 2, s: .018 + Math.random() * .05, w: .5 / Math.sqrt(r), y: (Math.random() - .5) * .18 * r }; });

/* ---------------------------------------------------------------- where the world goes */
const $ = s => document.querySelector(s);
const SEC = { hero: $('.hero'), eco: $('.eco'), outcome: $('.outcome'), numbers: $('.numbers'), intro: $('.uni-intro'), portals: $('.portals'),
  tabulah: $('.tabulah'), moments: $('.moments'), work: $('.work'), close: $('.close'), foot: $('.foot') };
const tags = [...document.querySelectorAll('.moon-tags span')];
const S = { x: innerWidth / 2, y: innerHeight / 2, R: 0, fade: 0, moons: 0, orbit: 1.8, gal: 0, hollow: 0, halo: 0, act: -1 };
const T = Object.assign({}, S);
function station() {
  const mid = innerHeight / 2;
  for (const [k, el] of Object.entries(SEC)) { if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return k; }
  return 'hero';
}
function target(st) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  Object.assign(T, { hollow: 0, act: -1, gal: 0, moons: 0, orbit: 1.8, halo: 1 });
  if (st === 'hero') {
    const p = RW.hero || 0, D = m * .44, a = seg(p, .52, .66);
    Object.assign(T, { x: W / 2, y: H / 2, R: D / 2, fade: a, moons: seg(p, .7, .95), halo: a });
  } else if (st === 'eco') {
    const R = wide ? m * .2 : Math.min(W * .25, H * .14);
    Object.assign(T, { x: wide ? W * .38 : W * .5, y: wide ? H * .55 : H * .44, R, fade: 1, moons: 1, act: RW.arm ?? 0, orbit: wide ? 1.85 : 1.75 });
  } else if (st === 'outcome') {
    Object.assign(T, { x: wide ? W * .86 : W * .9, y: H * .5, R: m * (wide ? .3 : .26), fade: 1, moons: .6, orbit: 1.5 });
  } else if (st === 'numbers') {
    Object.assign(T, { x: wide ? W * .86 : W * .9, y: H * .3, R: 0, fade: 0, moons: 0, halo: 0 });
  } else if (st === 'intro') {
    Object.assign(T, { x: wide ? W * .74 : W * .78, y: wide ? H * .5 : H * .22, R: wide ? m * .2 : W * .16, fade: 1, moons: 0, halo: 1 });
  } else if (st === 'portals') {
    const P = RW.portal || {};
    Object.assign(T, { x: P.x ?? W / 2, y: P.y ?? H / 2, R: P.r ?? 0, fade: P.fade ?? 0, hollow: P.hollow ?? 0, moons: 0, halo: P.hollow ? 0 : .6 });
  } else if (st === 'close' || st === 'foot') {
    Object.assign(T, { x: wide ? W * .72 : W * .5, y: wide ? H * .5 : H * .3, R: wide ? m * .15 : W * .17, fade: st === 'foot' ? .0 : 1, moons: .8, orbit: 1.6, gal: 1 });
  } else {
    Object.assign(T, { R: S.R * .6, fade: 0, halo: 0 });
  }
  return st;
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
addEventListener('pointermove', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; if (ptr.x < -1e3) { ptr.x = ptr.tx; ptr.y = ptr.ty; } }, { passive: true });
const dummy = new THREE.Object3D(), spinQ = new THREE.Quaternion(), tiltQ = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
// each orbit plane: a tilt towards the viewer and a turn in the screen plane
const PLANES = [[-.32, -.18], [-.42, .32], [-.24, .62]].map(([tx, tz]) => new THREE.Quaternion().setFromAxisAngle(Z, tz).multiply(new THREE.Quaternion().setFromAxisAngle(X, tx)));
const RADII = [1, 1.28, 1.56];
const moonS = [1, 1, 1];
let W = 0, H = 0, dpr = 1, last = performance.now(), time = 0, spin = 0;
function size() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75);
  roomR.setSize(W, H, false); glassR.setPixelRatio(dpr); glassR.setSize(W, H, false);
  cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix();
  U.uRes.value.set(W, H); U.uDpr.value = dpr;
}
size(); addEventListener('resize', size);

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt; spin += (reduced ? 0 : dt) * .12;
  const st = target(station());
  // the hero and an opening portal are driven exactly by the scroll; everywhere else the world glides to its place
  const exact = st === 'hero' || (st === 'portals' && RW.portal && RW.portal.exact);
  const k = exact ? 1 : 1 - Math.exp(-dt * (st === 'portals' ? 9 : 4.2));
  for (const key of ['x', 'y', 'R', 'fade', 'moons', 'orbit', 'gal', 'halo']) S[key] = lerp(S[key], T[key], k);
  S.hollow = T.hollow; S.act = T.act;
  ptr.x = lerp(ptr.x, ptr.tx, 1 - Math.exp(-dt * 6)); ptr.y = lerp(ptr.y, ptr.ty, 1 - Math.exp(-dt * 6));

  U.uTime.value = time; U.uScroll.value = scrollY; U.uPtr.value.set(ptr.x, ptr.y);
  U.uGlobe.value.set(S.x, S.y, Math.max(S.R, 1)); U.uHalo.value = S.halo * S.fade;

  // the globe: a slow turn, leaning a little towards the pointer
  const lean = ptr.x > -1e3 ? (ptr.x / W - .5) * .5 : 0, leanY = ptr.y > -1e3 ? (ptr.y / H - .5) * .3 : 0;
  spinQ.setFromAxisAngle(Y, spin * Math.PI * 2 * .25 + lean).premultiply(tiltQ.setFromAxisAngle(X, -.38 + leanY));
  // uSpin turns the screen-space normal back into the globe's own frame (the meridians turn with it)
  m4.makeRotationFromQuaternion(spinQ); glassMat.uniforms.uSpin.value.setFromMatrix4(m4).transpose();
  const R = Math.max(S.R, .001);
  dummy.position.set(S.x, -S.y, 0); dummy.quaternion.identity(); dummy.scale.setScalar(R); dummy.updateMatrix();
  globe.setMatrixAt(0, dummy.matrix); globe.instanceMatrix.needsUpdate = true;
  globe.visible = S.fade > .01 && S.R > .5;
  glassMat.uniforms.uHollow.value = S.hollow; glassMat.uniforms.uFade.value = clamp(S.fade);

  // moons: three orbits, the active arm's moon swells and its orbit lights up
  const mA = clamp(S.moons) * clamp(S.fade);
  for (let i = 0; i < MOONS; i++) {
    const on = S.act === i;
    moonS[i] = lerp(moonS[i], on ? 1.9 : S.act >= 0 ? .8 : 1, 1 - Math.exp(-dt * 5));
    const a = time * (.32 - i * .07) + i * 2.1;
    const ro = R * S.orbit * RADII[i] / RADII[1];
    v3.set(Math.cos(a) * ro, 0, Math.sin(a) * ro).applyQuaternion(PLANES[i]);
    const r = R * .13 * moonS[i] * mA;
    dummy.position.set(S.x + v3.x, -S.y + v3.y, v3.z); dummy.scale.setScalar(Math.max(r, .001)); dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    const o = orbits[i];
    o.position.set(S.x, -S.y, 0); o.quaternion.copy(PLANES[i]); o.scale.setScalar(Math.max(ro, .001));
    o.material.opacity = (on ? .55 : .16) * mA * (1 - S.hollow); o.visible = mA > .01;
    const tg = tags[i];
    if (tg) {
      const vis = st === 'eco' ? mA : 0;
      tg.style.setProperty('--x', clamp(S.x + v3.x, 44, W - 44).toFixed(1) + 'px'); tg.style.setProperty('--y', (S.y - v3.y).toFixed(1) + 'px');
      tg.style.setProperty('--o', (r + 12).toFixed(1) + 'px'); tg.style.setProperty('--a', (vis * (v3.z > -R * .2 ? 1 : .25)).toFixed(2));
      tg.classList.toggle('on', on);
    }
  }
  // the galaxy at the close
  const gA = clamp(S.gal) * clamp(S.fade);
  for (let j = 0; j < GAL; j++) {
    const g = G[j], a = g.a + time * g.w;
    v3.set(Math.cos(a) * g.r * R, g.y * R, Math.sin(a) * g.r * R).applyQuaternion(PLANES[1]);
    const s = g.s * R * gA * (1 + .25 * Math.sin(time * 2 + j));
    dummy.position.set(S.x + v3.x, -S.y + v3.y, v3.z); dummy.scale.setScalar(Math.max(s, .001)); dummy.updateMatrix();
    bodies.setMatrixAt(MOONS + j, dummy.matrix);
  }
  bodies.instanceMatrix.needsUpdate = true;
  bodyMat.uniforms.uFade.value = 1;
  bodies.visible = mA > .01 || gA > .01;

  roomR.render(roomScene, flatCam);
  glassR.render(scene, cam);
}
requestAnimationFrame(frame);
