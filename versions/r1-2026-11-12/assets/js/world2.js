// RASA World v2 / v3: the glass world, rebuilt on Not Human's shader (landing-nh9.js) instead of v1's milky lens.
// What changed against v1 (owner, 2026-11-12: "I don't like the glow... what we had, like Not Human, looks much better"):
//  - The room is Not Human's: near-black, a soft light orb that keeps to the globe's rim, a faint lens ring, colour only at
//    the frame, a shade (not a glow) around the object, a vignette. v1's pink halo is gone.
//  - The glass is Not Human's: a see-through body that refracts the room per colour channel, lights fixed in the world
//    (a backlit rig) that glint and glow through the rim, and a colour-split edge (blue outside, warm inside) standing in
//    for Not Human's lens post pass. Pieces combine with max blending, so moons passing behind the globe show through it.
//  - Same journey as v1, set per section; v3 uses Not Human's own cool palette, v2 RASA's violet.
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const root = document.documentElement;
const RW = window.RW || (window.RW = {});
const V3 = root.classList.contains('v3');

// the two looks: v2 leans violet (RASA's accent), v3 is Not Human's own cool light
const LOOK = V3
  ? { tint: [.85, .87, 1], light: [.86, .8, 1.12], aura: [[.16, .09, .42], [.05, .2, .45]], glowC: [.3, .42, 1], orb: [.62, .64, .78], body: .24, rim: .62, edge: 1 }
  : { tint: [.82, .74, 1], light: [.9, .78, 1.15], aura: [[.26, .1, .5], [.12, .08, .42]], glowC: [.48, .34, 1], orb: [.7, .6, .9], body: .24, rim: .7, edge: 1 };

/* ---------------------------------------------------------------- the room (Not Human's), in screen pixels */
const ROOM = /* glsl */`
uniform vec2 uRes; uniform float uTime; uniform vec4 uOrb; uniform vec4 uHalo; uniform vec3 uGlobe; uniform float uRing, uAura, uVig, uGlow, uScroll, uStars;
uniform vec3 uOrbC, uAuraA, uAuraB, uGlowC, uLCol;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 room(vec2 px) {
  vec2 uv = vec2(px.x / uRes.x, 1. - px.y / uRes.y);
  vec2 asp = vec2(uRes.x / uRes.y, 1.);
  vec3 c = vec3(.035, .035, .043);
  // the orb: a soft light without a hard core
  float d = length((uv - uOrb.xy) * asp), r = uOrb.w;
  c += uOrb.z * uLCol * (uOrbC * exp(-d * d / (r * r * .12)) + uOrbC * .7 * exp(-d * d / (r * r)) * .55 + vec3(.25, .3, .62) * exp(-d * d / (r * r * 6.)) * .22);
  // a lens ring, very large and very faint, colour split
  vec2 rc = .5 + (uOrb.xy - .5) * -.18;
  float rd = length((uv - rc) * asp), R = .62;
  c += uRing * vec3(exp(-pow((rd - R - .012) / .018, 2.)), exp(-pow((rd - R) / .016, 2.)), exp(-pow((rd - R + .012) / .02, 2.))) * vec3(.05, .055, .075);
  // colour only at the frame
  float e = smoothstep(.42, .95, length((uv - .5) * vec2(1., 1.15)));
  c += uAura * e * mix(uAuraA, uAuraB, uv.y) * .25;
  // the faint bloom that hugs the globe's edge (Not Human's lens pass, as light in the room)
  float gd = length(px - uGlobe.xy) / max(uGlobe.z, 1.);
  c += uGlow * uGlowC * (exp(-pow((gd - 1.) / .05, 2.)) * .22 + exp(-pow((gd - 1.) / .3, 2.)) * .05);
  // stars: few and faint, drifting with the scroll
  vec2 sp = px + vec2(0., uScroll * .1);
  vec2 cell = floor(sp / 48.); float h = hash(cell);
  if (h > .9) {
    vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 48.;
    float sr = length(sp - cell * 48. - o);
    c += vec3(.85, .85, 1.) * smoothstep(1.4, 0., sr) * (.5 + .5 * sin(uTime * (1. + h * 2.) + h * 40.)) * (h - .9) * 5. * uStars;
  }
  // a shade around the object, then the vignette
  vec2 hp = (uv - uHalo.xy) * asp;
  c *= 1. - uHalo.w * .75 * exp(-dot(hp, hp) / max(1e-4, uHalo.z * uHalo.z)) * smoothstep(0., .6, length(hp) / max(1e-4, uHalo.z));
  c *= 1. - uVig * smoothstep(.3, 1.05, length((uv - .5) * vec2(1., 1.25)));
  return c;
}`;

const roomCv = document.querySelector('.room'), glassCv = document.querySelector('.glass');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !roomCv || !glassCv) { root.classList.add('no-gl'); throw new Error('RASA World: no WebGL'); }

const v3a = a => new THREE.Vector3(...a);
const U = {
  uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uOrb: { value: new THREE.Vector4(.5, .5, 0, .16) }, uHalo: { value: new THREE.Vector4(.5, .5, .1, 0) },
  uGlobe: { value: new THREE.Vector3(-1e4, -1e4, 1) }, uRing: { value: .6 }, uAura: { value: .6 }, uVig: { value: .45 }, uGlow: { value: 0 }, uScroll: { value: 0 }, uStars: { value: 1 },
  uOrbC: { value: v3a(LOOK.orb) }, uAuraA: { value: v3a(LOOK.aura[0]) }, uAuraB: { value: v3a(LOOK.aura[1]) }, uGlowC: { value: v3a(LOOK.glowC) }, uLCol: { value: v3a(LOOK.light) },
};

const roomR = new THREE.WebGLRenderer({ canvas: roomCv, antialias: false, alpha: false, powerPreference: 'high-performance' });
roomR.setPixelRatio(.75);
const roomScene = new THREE.Scene(), flatCam = new THREE.Camera();
roomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: U, depthTest: false, depthWrite: false,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: ROOM + `uniform float uRp; void main() { vec2 px = vec2(gl_FragCoord.x, uRes.y * uRp - gl_FragCoord.y) / uRp; gl_FragColor = vec4(room(px), 1.); }`,
})));
roomScene.children[0].material.uniforms.uRp = { value: .75 };

const glassR = new THREE.WebGLRenderer({ canvas: glassCv, antialias: true, alpha: true, powerPreference: 'high-performance' });
glassR.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -8000, 8000);

/* ---------------------------------------------------------------- the glass (Not Human's), in screen pixels */
const GLASS_V = /* glsl */`
attribute float aKind; attribute vec3 aTint;
varying vec3 vN; varying vec3 vW; varying vec3 vObjN; varying float vKind; varying vec3 vTint; varying float vR;
void main() {
  mat4 im = mat4(1.);
  #ifdef USE_INSTANCING
  im = instanceMatrix;
  #endif
  vR = length(im[0].xyz);
  vec4 w = modelMatrix * im * vec4(position, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
  vObjN = normal; vKind = aKind; vTint = aTint;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLASS_F = ROOM + /* glsl */`
uniform float uDpr, uRefract, uDisperse, uBody, uRim, uRimPow, uSpec, uFade, uHollow, uEdge, uLines;
uniform vec3 uLP[3]; uniform vec3 uLC[3]; uniform float uLS[3]; uniform mat3 uSpin;
varying vec3 vN; varying vec3 vW; varying vec3 vObjN; varying float vKind; varying vec3 vTint; varying float vR;
vec2 px(vec3 w) { return vec2(w.x, -w.y); }
float band(float x, float c, float w) { return exp(-pow((x - c) / w, 2.)); }
void main() {
  vec3 N = normalize(vN), V = vec3(0., 0., 1.);
  float ndv = clamp(N.z, 0., 1.), f = 1. - ndv;
  float rho = sqrt(max(0., 1. - ndv * ndv));
  // refraction through a thick ball, once per colour channel
  float th = vR * uRefract * 4.;
  vec3 rr = refract(-V, N, 1. / (1.45 - uDisperse)), rg = refract(-V, N, 1. / 1.45), rb = refract(-V, N, 1. / (1.45 + uDisperse));
  vec3 seen = vec3(room(px(vW + rr * th)).r, room(px(vW + rg * th)).g, room(px(vW + rb * th)).b);
  vec3 body = seen * mix(vec3(1.), vTint, .4) * 1.1;
  // the lights live in the world, around the globe
  vec3 light = vec3(0.);
  for (int i = 0; i < 3; i++) {
    vec3 L = normalize(uLP[i] - vW), H = normalize(L + V);
    float s = uLS[i];
    float front = pow(max(dot(N, H), 0.), s) * (s + 2.) / 18. * smoothstep(0., .25, dot(N, L));
    float back = pow(max(dot(-L, V), 0.), 2.) * pow(f, 3.) * .7;
    float F = .05 + .95 * pow(f, 4.);
    float glint = pow(max(dot(N, H), 0.), 420.) * smoothstep(0., .25, dot(N, L));
    light += uLC[i] * ((front * F + glint * .5) * uSpec + back * .9);
  }
  float rimPow = uRimPow + uHollow * vR / 60.;
  light += pow(f, rimPow) * uRim * (.35 + min(seen * 2.5, vec3(.8))) * mix(vec3(1.), vTint, .3);
  // the colour-split edge: warm inside, white, blue outside; it stays a few pixels wide whatever the size
  float w = .028 * clamp(140. / max(vR, 1.), .06, 1.);
  light += uEdge * vec3(band(rho, 1. - 2.6 * w, w * 1.3) * .55 + band(rho, 1. - w, w) * .5,
                        band(rho, 1. - 1.6 * w, w) * .5 + band(rho, 1. - .6 * w, w * .8) * .3,
                        band(rho, 1. - .5 * w, w * 1.1) * 1.05);
  // the world's meridians: faint lines that turn with it
  if (vKind < .5 && uLines > 0.) {
    vec3 o = uSpin * vObjN;
    float lat = asin(clamp(o.y, -1., 1.)), lon = atan(o.z, o.x);
    float gl = abs(fract(lon / .5236) - .5), gp = abs(fract(lat / .5236) - .5);
    float line = max(1. - smoothstep(0., fwidth(lon / .5236) * 1.3, .5 - gl), 1. - smoothstep(0., fwidth(lat / .5236) * 1.3, .5 - gp));
    light += vec3(.75, .72, 1.) * line * uLines * (.25 + .75 * ndv) * (1. - uHollow);
  }
  float a = uBody * (.55 + .45 * f) * (1. - uHollow);
  vec3 col = body * a + light;
  gl_FragColor = vec4(col, clamp(a + dot(light, vec3(.3)) * .6, 0., 1.)) * uFade;
}`;
const mkMat = () => new THREE.ShaderMaterial({
  uniforms: Object.assign({}, U, {
    uDpr: { value: 1 }, uRefract: { value: .55 }, uDisperse: { value: .07 }, uBody: { value: LOOK.body }, uRim: { value: LOOK.rim }, uRimPow: { value: 3 },
    uSpec: { value: .95 }, uFade: { value: 1 }, uHollow: { value: 0 }, uEdge: { value: LOOK.edge }, uLines: { value: 0 }, uSpin: { value: new THREE.Matrix3() },
    uLP: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uLC: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uLS: { value: [5, 5, 40] },
  }),
  vertexShader: GLASS_V, fragmentShader: GLASS_F, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
});
const globeMat = mkMat(), bodyMat = mkMat();
bodyMat.uniforms.uEdge.value = LOOK.edge * .7;

const GAL = 120, MOONS = 3;
const geoHi = new THREE.SphereGeometry(1, 128, 96), geoLo = new THREE.SphereGeometry(1, 36, 24);
geoHi.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([0]), 1));
geoHi.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(LOOK.tint), 3));
const globe = new THREE.InstancedMesh(geoHi, globeMat, 1);
const kinds = new Float32Array(MOONS + GAL).fill(2), tints = new Float32Array((MOONS + GAL) * 3);
const MOON_TINT = V3 ? [[1, .95, .88], [.85, .8, 1], [.72, .82, 1]] : [[1, .93, .86], [.8, .66, 1], [.66, .7, 1]];
for (let i = 0; i < MOONS + GAL; i++) { if (i < MOONS) kinds[i] = 1; tints.set(i < MOONS ? MOON_TINT[i] : LOOK.tint, i * 3); }
geoLo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
geoLo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
const bodies = new THREE.InstancedMesh(geoLo, bodyMat, MOONS + GAL);
globe.frustumCulled = bodies.frustumCulled = false;
scene.add(globe, bodies);
const orbits = MOON_TINT.map(() => {
  const pts = []; for (let i = 0; i <= 200; i++) { const a = i / 200 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: V3 ? 0xdfe2ff : 0xd8c8ff, transparent: true, opacity: .2, depthWrite: false, depthTest: false }));
  line.frustumCulled = false; scene.add(line); return line;
});
const G = Array.from({ length: GAL }, () => { const r = 1.4 + Math.pow(Math.random(), .7) * 2.3; return { r, a: Math.random() * Math.PI * 2, s: .02 + Math.random() * .045, w: .45 / Math.sqrt(r), y: (Math.random() - .5) * .16 * r }; });

/* ---------------------------------------------------------------- where the world goes, per section */
const $ = s => document.querySelector(s);
const SEC = { hero: $('.hero'), eco: $('.eco'), outcome: $('.outcome'), numbers: $('.numbers'), intro: $('.uni-intro'), portals: $('.portals'),
  tabulah: $('.tabulah'), moments: $('.moments'), work: $('.work'), close: $('.close'), foot: $('.foot') };
const tags = [...document.querySelectorAll('.moon-tags span')];
window.RWS = null; const S = { x: innerWidth / 2, y: innerHeight / 2, R: 0, fade: 0, moons: 0, orbit: 1.8, gal: 0, hollow: 0, act: -1, lines: 1 };
const T = Object.assign({}, S); window.RWS = S;
function station() {
  const mid = innerHeight / 2;
  for (const [k, el] of Object.entries(SEC)) { if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return k; }
  return 'hero';
}
function target(st) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  Object.assign(T, { hollow: 0, act: -1, gal: 0, moons: 0, orbit: 1.8, lines: 1 });
  if (st === 'hero') {
    const p = RW.hero || 0, D = m * .44, a = seg(p, .52, .66);
    Object.assign(T, { x: W / 2, y: H / 2, R: D / 2, fade: a, moons: seg(p, .7, .95) });
  } else if (st === 'eco') {
    const R = wide ? m * .17 : Math.min(W * .16, H * .075);
    Object.assign(T, { x: wide ? W * .25 : W * .5, y: wide ? H * .6 : H * .375, R, fade: 1, moons: 1, act: RW.arm ?? 0, orbit: 1.9 });
  } else if (st === 'outcome') {
    Object.assign(T, { x: wide ? W * .84 : W * .88, y: H * .5, R: m * (wide ? .28 : .24), fade: 1, moons: .6, orbit: 1.5 });
  } else if (st === 'numbers') {
    Object.assign(T, { x: wide ? W * .84 : W * .88, y: H * .3, R: 0, fade: 0 });
  } else if (st === 'intro') {
    Object.assign(T, { x: wide ? W * .74 : W * .76, y: wide ? H * .5 : H * .22, R: wide ? m * .2 : W * .16, fade: 1 });
  } else if (st === 'portals') {
    const P = RW.portal || {};
    Object.assign(T, { x: P.x ?? W / 2, y: P.y ?? H / 2, R: P.r ?? 0, fade: P.fade ?? 0, hollow: P.hollow ?? 0, lines: 0 });
  } else if (st === 'close' || st === 'foot') {
    Object.assign(T, { x: wide ? W * .72 : W * .5, y: wide ? H * .5 : H * .3, R: wide ? m * .15 : W * .17, fade: st === 'foot' ? 0 : 1, moons: .8, orbit: 1.6, gal: 1 });
  } else {
    Object.assign(T, { R: S.R * .6, fade: 0 });
  }
  return st;
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
addEventListener('pointermove', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; if (ptr.x < -1e3) { ptr.x = ptr.tx; ptr.y = ptr.ty; } }, { passive: true });
const dummy = new THREE.Object3D(), spinQ = new THREE.Quaternion(), tiltQ = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const PLANES = [[-.32, -.18], [-.42, .32], [-.24, .62]].map(([tx, tz]) => new THREE.Quaternion().setFromAxisAngle(Z, tz).multiply(new THREE.Quaternion().setFromAxisAngle(X, tx)));
const RADII = [1, 1.28, 1.56];
const moonS = [1, 1, 1];
// Not Human's "backlit" rig, in units of the globe's radius: two lights behind and a broad one in front
const RIG = [{ p: [-4, 3, -5], c: 1.5, s: 5 }, { p: [5, -2, -4], c: 1.1, s: 5 }, { p: [-1.5, 2.2, 4], c: .45, s: 40 }];
let W = 0, H = 0, dpr = 1, last = performance.now(), time = 0, spin = 0;
function size() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75);
  roomR.setSize(W, H, false); glassR.setPixelRatio(dpr); glassR.setSize(W, H, false);
  cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix();
  U.uRes.value.set(W, H);
}
size(); addEventListener('resize', size);

function lights(mat, cx, cy, R) {
  const u = mat.uniforms;
  RIG.forEach((l, i) => {
    u.uLP.value[i].set(cx + l.p[0] * R, -cy + l.p[1] * R, l.p[2] * R);
    u.uLC.value[i].set(LOOK.light[0] * l.c, LOOK.light[1] * l.c, LOOK.light[2] * l.c);
    u.uLS.value[i] = l.s;
  });
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.12, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt; spin += (reduced ? 0 : dt) * .1;
  const st = target(station());
  const exact = st === 'hero' || (st === 'portals' && RW.portal && RW.portal.exact);
  const k = exact ? 1 : 1 - Math.exp(-dt * (st === 'portals' ? 9 : 4.2));
  for (const key of ['x', 'y', 'R', 'fade', 'moons', 'orbit', 'gal', 'lines']) S[key] = lerp(S[key], T[key], k);
  S.hollow = T.hollow; S.act = T.act;
  ptr.x = lerp(ptr.x, ptr.tx, 1 - Math.exp(-dt * 6)); ptr.y = lerp(ptr.y, ptr.ty, 1 - Math.exp(-dt * 6));

  const R = Math.max(S.R, .001), fade = clamp(S.fade);
  // the room: the orb keeps to the globe's upper rim and leans towards the pointer; the shade sits round the globe
  const lx = ptr.x > -1e3 ? (ptr.x / W - .5) : 0, ly = ptr.y > -1e3 ? (ptr.y / H - .5) : 0;
  const ox = S.x + R * (-.35 + lx * .5), oy = S.y + R * (-.45 + ly * .4);
  U.uTime.value = time; U.uScroll.value = scrollY;
  U.uOrb.value.set(ox / W, 1 - oy / H, fade * (1 - S.hollow), Math.max(.04, R / H * 1.15));
  U.uHalo.value.set(S.x / W, 1 - S.y / H, R / H * 2.2, .65 * fade * (1 - S.hollow));
  U.uGlobe.value.set(S.x, S.y, R); U.uGlow.value = fade * (1 - S.hollow * .5);

  spinQ.setFromAxisAngle(Y, spin * Math.PI * .5 + lx * .5).premultiply(tiltQ.setFromAxisAngle(X, -.38 + ly * .3));
  m4.makeRotationFromQuaternion(spinQ); globeMat.uniforms.uSpin.value.setFromMatrix4(m4).transpose();
  dummy.position.set(S.x, -S.y, 0); dummy.quaternion.identity(); dummy.scale.setScalar(R); dummy.updateMatrix();
  globe.setMatrixAt(0, dummy.matrix); globe.instanceMatrix.needsUpdate = true;
  globe.visible = fade > .01 && S.R > .5;
  globeMat.uniforms.uHollow.value = S.hollow; globeMat.uniforms.uFade.value = fade;
  globeMat.uniforms.uLines.value = .07 * S.lines;
  lights(globeMat, S.x, S.y, R); lights(bodyMat, S.x, S.y, R);

  const mA = clamp(S.moons) * fade;
  for (let i = 0; i < MOONS; i++) {
    const on = S.act === i;
    moonS[i] = lerp(moonS[i], on ? 1.9 : S.act >= 0 ? .8 : 1, 1 - Math.exp(-dt * 5));
    const a = time * (.3 - i * .07) + i * 2.1;
    const ro = R * S.orbit * RADII[i] / RADII[1];
    v3.set(Math.cos(a) * ro, 0, Math.sin(a) * ro).applyQuaternion(PLANES[i]);
    const r = R * .14 * moonS[i] * mA;
    dummy.position.set(S.x + v3.x, -S.y + v3.y, v3.z); dummy.scale.setScalar(Math.max(r, .001)); dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    const o = orbits[i];
    o.position.set(S.x, -S.y, 0); o.quaternion.copy(PLANES[i]); o.scale.setScalar(Math.max(ro, .001));
    o.material.opacity = (on ? .5 : .14) * mA * (1 - S.hollow); o.visible = mA > .01;
    const tg = tags[i];
    if (tg) {
      tg.style.setProperty('--x', clamp(S.x + v3.x, 44, W - 44).toFixed(1) + 'px'); tg.style.setProperty('--y', (S.y - v3.y).toFixed(1) + 'px');
      tg.style.setProperty('--o', (r + 12).toFixed(1) + 'px'); tg.style.setProperty('--a', ((st === 'eco' ? mA : 0) * (v3.z > -R * .2 ? 1 : .3)).toFixed(2));
      tg.classList.toggle('on', on);
    }
  }
  const gA = clamp(S.gal) * fade;
  for (let j = 0; j < GAL; j++) {
    const g = G[j], a = g.a + time * g.w;
    v3.set(Math.cos(a) * g.r * R, g.y * R, Math.sin(a) * g.r * R).applyQuaternion(PLANES[1]);
    const s = g.s * R * gA;
    dummy.position.set(S.x + v3.x, -S.y + v3.y, v3.z); dummy.scale.setScalar(Math.max(s, .001)); dummy.updateMatrix();
    bodies.setMatrixAt(MOONS + j, dummy.matrix);
  }
  bodies.instanceMatrix.needsUpdate = true;
  bodies.visible = mA > .01 || gA > .01;

  roomR.render(roomScene, flatCam);
  glassR.render(scene, cam);
}
requestAnimationFrame(frame);
