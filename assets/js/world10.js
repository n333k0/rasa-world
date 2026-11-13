// RASA World v10: the universe you fly through (after mesh3d.gallery's "The state of the gallery").
//  - A violet aurora of particles (a terrain of points that breathes) runs under the whole flight; stars above.
//  - Bodies along the path: the RASA world (Not Human glass with v6's rainbow rim, wrapped in a shell of light points),
//    its three moons (Atelier, RASA Creates, Tabulah), then the four universes, each with its own form: Thrill City
//    (glass planet ringed by a coaster of light), Pier Play (a planet of points moving like waves), Portalverse (a glass
//    portal ring with a vortex inside), Monuments (glass planet in a ring of columns).
//  - Scroll (window.RW10.s from page10.js) flies the camera from stop to stop on an arc; drag looks around; a click on a
//    body flies there (RW10.goTo). Small labels name every body like a map.
//  - Behind each stop's title a cloud of particles draws its figure (12K, 150K+, ...), as mesh3d's digits of dust.
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const root = document.documentElement;
const RW = window.RW10 || (window.RW10 = { s: 0, mode: 'hero', heroP: 0, fig: '' });
const ACC = [.71, .61, 1];

const roomCv = document.querySelector('.room'), cv = document.querySelector('.u-scene');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !roomCv || !cv) { root.classList.add('no-gl'); dispatchEvent(new Event('rw10-nogl')); throw new Error('RASA v10: no WebGL'); }
root.classList.add('u-gl');

/* ---------------------------------------------------------------- the room: dark, a violet glow on the horizon, an orb */
const ROOM = /* glsl */`
uniform vec2 uRes; uniform float uTime; uniform vec4 uOrb; uniform float uHorizon;
vec3 room(vec2 px) {
  vec2 uv = vec2(px.x / uRes.x, 1. - px.y / uRes.y), asp = vec2(uRes.x / uRes.y, 1.);
  vec3 c = vec3(.03, .031, .045);
  // the aurora's glow on the horizon
  float hz = exp(-pow((uv.y - uHorizon) / .16, 2.));
  c += vec3(.22, .14, .5) * hz * .55 * (.7 + .3 * sin(uv.x * 6. + uTime * .2));
  c += vec3(.1, .08, .26) * smoothstep(.6, 0., uv.y) * .35;
  // a soft orb behind the body we look at
  float d = length((uv - uOrb.xy) * asp), r = uOrb.w;
  c += uOrb.z * (vec3(.5, .42, .85) * exp(-d * d / (r * r)) * .3 + vec3(.22, .2, .55) * exp(-d * d / (r * r * 6.)) * .2);
  c *= 1. - .5 * smoothstep(.35, 1.1, length((uv - .5) * vec2(1., 1.25)));
  return c;
}`;
const U = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uOrb: { value: new THREE.Vector4(.5, .5, 0, .2) }, uHorizon: { value: .42 }, uRp: { value: .75 } };
const roomR = new THREE.WebGLRenderer({ canvas: roomCv, antialias: false, alpha: false });
roomR.setPixelRatio(.75);
const roomScene = new THREE.Scene(), flat = new THREE.Camera();
roomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: ROOM + `uniform float uRp; void main() { vec2 px = vec2(gl_FragCoord.x, uRes.y * uRp - gl_FragCoord.y) / uRp; gl_FragColor = vec4(room(px), 1.); }` })));

const R3 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R3.setClearColor(0, 0);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(45, 1, .1, 3000);
scene.add(cam);

/* ---------------------------------------------------------------- glass (Not Human's, refracting the room in screen space) */
const GV = /* glsl */`varying vec3 vN; varying vec3 vV; varying vec3 vO;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vV = mv.xyz; vN = normalize(normalMatrix * normal); vO = normal; gl_Position = projectionMatrix * mv; }`;
const GF = ROOM + /* glsl */`
uniform float uDpr, uRpx, uFade, uHolo, uBody, uRim, uLines, uGlow; uniform vec3 uTint; uniform mat3 uSpin;
varying vec3 vN; varying vec3 vV; varying vec3 vO;
vec3 hue(float h) { return clamp(abs(fract(h + vec3(0., 2. / 3., 1. / 3.)) * 6. - 3.) - 1., 0., 1.); }
float band(float x, float c, float w) { return exp(-pow((x - c) / w, 2.)); }
void main() {
  vec3 N = normalize(vN), V = normalize(-vV);
  float ndv = clamp(dot(N, V), 0., 1.), f = 1. - ndv, rho = sqrt(max(0., 1. - ndv * ndv));
  vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 off = vec2(N.x, -N.y) * uRpx * (.9 + .3 * f);
  vec3 seen = vec3(room(px - off).r, room(px - off * 1.08).g, room(px - off * 1.17).b);
  vec3 body = seen * mix(vec3(1.), uTint, .4) * 1.3 + uTint * .02;
  vec3 L1 = normalize(vec3(-.5, .6, .62)), L2 = normalize(vec3(.6, -.4, -.7)), H1 = normalize(L1 + V);
  vec3 light = vec3(1.) * pow(max(dot(N, H1), 0.), 60.) * 1.1 * (.05 + .95 * pow(f, 2.)) + vec3(1.) * pow(max(dot(N, H1), 0.), 420.) * .6;
  light += uTint * pow(max(dot(-L2, V), 0.), 2.) * pow(f, 3.) * .8;
  light += pow(f, 3.) * uRim * (.35 + min(seen * 2.5, vec3(.8))) * mix(vec3(1.), uTint, .3);
  float w = .03 * clamp(120. / max(uRpx, 1.), .08, 1.);
  light += vec3(band(rho, 1. - 2.6 * w, w * 1.3) * .55 + band(rho, 1. - w, w) * .5, band(rho, 1. - 1.6 * w, w) * .5 + band(rho, 1. - .6 * w, w * .8) * .3, band(rho, 1. - .5 * w, w * 1.1) * 1.05);
  if (uHolo > 0.) { float hh = atan(N.y, N.x) / 6.2832 + uTime * .04 + rho * .35; light += uHolo * mix(hue(hh), vec3(1.), .25) * (pow(f, 2.2) * .5 + band(rho, 1. - w * 1.5, w * 2.5) * .6); }
  if (uLines > 0.) { vec3 o = uSpin * vO; float lat = asin(clamp(o.y, -1., 1.)), lon = atan(o.z, o.x);
    float gl = abs(fract(lon / .3927) - .5), gp = abs(fract(lat / .3927) - .5);
    float ln = max(1. - smoothstep(0., fwidth(lon / .3927) * 1.3, .5 - gl), 1. - smoothstep(0., fwidth(lat / .3927) * 1.3, .5 - gp));
    light += uTint * ln * uLines * (.25 + .75 * ndv); }
  light += uTint * uGlow * pow(ndv, 3.) * .25;
  float a = uBody * (.55 + .45 * f);
  gl_FragColor = vec4(body * a + light, clamp(a + dot(light, vec3(.3)) * .6, 0., 1.)) * uFade;
}`;
const glassMat = (tint, o = {}) => new THREE.ShaderMaterial({ vertexShader: GV, fragmentShader: GF, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  uniforms: Object.assign({}, U, { uDpr: { value: 1 }, uRpx: { value: 50 }, uFade: { value: 1 }, uHolo: { value: o.holo || 0 }, uBody: { value: .24 }, uRim: { value: .7 },
    uLines: { value: o.lines || 0 }, uGlow: { value: o.glow || 0 }, uTint: { value: new THREE.Vector3(...tint) }, uSpin: { value: new THREE.Matrix3() } }) });

/* ---------------------------------------------------------------- points */
const PV = /* glsl */`attribute float aSize; attribute float aB; uniform float uDpr, uFade, uScale, uTime, uWave, uFlat;
varying float vA; varying float vZ; varying float vB;
void main() {
  vec3 p = position;
  if (uWave > 0.) p *= 1. + uWave * sin(p.y * 6. + uTime * 1.6) * sin(p.x * 3. + uTime);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  vZ = uFlat > .5 ? 1. : normalize(normalMatrix * normalize(position)).z; vB = aB;
  vA = uFade * mix(.15, 1., smoothstep(-.3, .25, vZ));
  gl_PointSize = aSize * uDpr * uScale * (60. / -mv.z);
}`;
const PF = /* glsl */`uniform vec3 uCol; uniform vec3 uAcc; varying float vA; varying float vZ; varying float vB;
void main() { float d = length(gl_PointCoord - .5); float a = vA * vB * smoothstep(.5, .15, d); if (a < .004) discard;
  vec3 c = mix(uCol, uAcc, clamp(1. - abs(vZ) * 1.6, 0., 1.) * .8); gl_FragColor = vec4(c * a, a); }`;
const ptsMat = (col, o = {}) => new THREE.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: { uDpr: { value: 1 }, uFade: { value: 1 }, uScale: { value: o.scale || 1 }, uTime: { value: 0 }, uWave: { value: o.wave || 0 }, uFlat: { value: o.flat || 0 }, uCol: { value: new THREE.Vector3(...col) }, uAcc: { value: new THREE.Vector3(...ACC) } } });
function points(pos, size, b, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(b, 1));
  const p = new THREE.Points(g, mat); p.frustumCulled = false; return p;
}
const fib = (N, fn) => { const ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < N; i++) { const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), t = ga * i; fn(Math.cos(t) * r, y, Math.sin(t) * r, i); } };
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y, z) => Math.sin(x * 1.7 + Math.sin(y * 2.3)) * Math.cos(z * 1.9 + Math.sin(x * 1.3)) + .5 * Math.sin(y * 3.1 + z * 2.2 + x);

/* ---------------------------------------------------------------- the aurora terrain and the stars */
const terrain = (() => {
  const CX = 170, CZ = 240, pos = [], size = [], b = [];
  for (let iz = 0; iz < CZ; iz++) for (let ix = 0; ix < CX; ix++) {
    const x = (ix / (CX - 1) - .5) * 260 + (hash(ix * 7 + iz) - .5) * 1.2, z = 50 - iz / (CZ - 1) * 420 + (hash(ix + iz * 13) - .5) * 1.2;
    pos.push(x, 0, z); size.push(hash(ix * 31 + iz * 17) < .04 ? 3.2 : 1.3); b.push(.4 + hash(ix * 3 + iz * 5) * .6);
  }
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uCam: { value: new THREE.Vector3() }, uFade: { value: 1 } },
    vertexShader: `attribute float aSize; attribute float aB; uniform float uTime, uDpr, uFade; uniform vec3 uCam; varying float vA; varying float vH;
      void main() { vec3 p = position; float t = uTime;
        float side = pow(abs(p.x) / 70., 2.) * 16.;
        float h = 2.6 * sin(p.x * .07 + t * .25) * cos(p.z * .045 - t * .1) + 1.6 * sin(p.z * .11 + p.x * .05 - t * .35) + .8 * sin(p.x * .3 + p.z * .2 + t * .6);
        p.y = -9. + h + side; vH = h + side * .5;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float dist = length(p - uCam);
        vA = uFade * aB * smoothstep(240., 30., dist) * smoothstep(1., 9., dist);
        gl_PointSize = aSize * uDpr * (55. / -mv.z); }`,
    fragmentShader: `varying float vA; varying float vH; void main() { float d = length(gl_PointCoord - .5); float a = vA * smoothstep(.5, .1, d); if (a < .004) discard;
      vec3 c = mix(vec3(.32, .2, .7), vec3(.82, .74, 1.), clamp(vH * .12 + .3, 0., 1.)); gl_FragColor = vec4(c * a * .9, a); }` });
  const p = points(pos, size, b, m); scene.add(p); return p;
})();
const stars = (() => { const pos = [], size = [], b = []; for (let i = 0; i < 2600; i++) { const u = hash(i * 1.3) * 2 - 1, th = hash(i * 7.1) * Math.PI * 2, r = 500 + hash(i * 3.7) * 400, s = Math.sqrt(1 - u * u);
  pos.push(Math.cos(th) * s * r, Math.abs(u) * r * .8 + 10, Math.sin(th) * s * r - 150); size.push(hash(i) < .05 ? 7 : 3.5); b.push(.3 + hash(i * 9.9) * .7); }
  const p = points(pos, size, b, ptsMat([.9, .9, 1], { flat: 1, scale: 1.2 })); scene.add(p); return p; })();

/* ---------------------------------------------------------------- bodies */
const BODIES = [];
function body(name, stop, pos, R, extra) { const g = new THREE.Group(); g.position.set(...pos); scene.add(g); const b = { name, stop, g, R, base: new THREE.Vector3(...pos), parts: [] }; extra(b); BODIES.push(b); return b; }
const sphere = (R, mat) => { const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat); m.frustumCulled = false; return m; };

// the RASA world: glass core + a shell of light points (land brighter) + rainbow rim
const world = body('RASA world', 1, [0, 4, -60], 5, b => {
  const glass = sphere(b.R, glassMat([.82, .74, 1], { holo: 1, lines: .05 })); b.g.add(glass); b.glass = glass;
  const pos = [], size = [], br = [];
  fib(9000, (x, y, z) => { const land = vnoise(x * 2.2, y * 2.2, z * 2.2) > .35; pos.push(x * b.R * 1.12, y * b.R * 1.12, z * b.R * 1.12); size.push(land ? 2.6 : 1.4); br.push(land ? .9 : .18); });
  const shell = points(pos, size, br, ptsMat([.86, .84, 1])); b.g.add(shell); b.shell = shell;
});
// the three moons, on tilted orbits round the world
const MOONS = [['Atelier', 2, [1, .93, .86], 9, 1.15, [-.3, -.2]], ['RASA Creates', 3, [.78, .64, 1], 11.6, 1.35, [-.42, .3]], ['Tabulah', 4, [.66, .74, 1], 14.2, 1.15, [-.24, .62]]];
const moons = MOONS.map(([name, stop, tint, orbit, R, [tx, tz]], i) => {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tz).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tx));
  const b = body(name, stop, [0, 0, 0], R, b => { const g = sphere(R, glassMat(tint, { lines: i === 2 ? .35 : 0, glow: 1 })); b.g.add(g); b.glass = g; });
  b.orbit = orbit; b.q = q; b.phase = i * 2.1; b.speed = .05 - i * .01;
  const pts = []; for (let k = 0; k <= 200; k++) { const a = k / 200 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit).applyQuaternion(q)); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: .18, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  line.position.copy(world.base); line.frustumCulled = false; scene.add(line); b.line = line;
  return b;
});
// Thrill City: a glass planet ringed by a coaster of light
const thrill = body('Thrill City', 5, [-16, 6, -112], 3, b => {
  const g = sphere(b.R, glassMat([1, .9, .8], { glow: .6 })); b.g.add(g); b.glass = g;
  const pts = []; for (let i = 0; i < 64; i++) { const t = i / 64 * Math.PI * 2, r = b.R * (1.55 + .22 * Math.sin(t * 3)); pts.push(new THREE.Vector3(Math.cos(t) * r, b.R * (.35 * Math.sin(t * 2) + .45 * Math.sin(t * 5) * .5), Math.sin(t) * r)); }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 500, .07, 8, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime, uFade; varying vec2 vUv; void main() { float h = fract(vUv.x - uTime * .12); float run = exp(-h * 18.) + exp(-fract(vUv.x - uTime * .12 + .5) * 18.);
      vec3 c = vec3(.55, .45, .95) * .35 + vec3(1., .95, .9) * run * 1.4; gl_FragColor = vec4(c * uFade, 1.); }` }));
  tube.rotation.x = .35; tube.frustumCulled = false; b.g.add(tube); b.tube = tube;
});
// Pier Play: a planet of points, moving like waves
const pier = body('Pier Play', 6, [16, 5, -152], 3.2, b => {
  const pos = [], size = [], br = [];
  fib(7000, (x, y, z, i) => { const band = Math.abs(Math.sin(y * 9)) > .55; pos.push(x * b.R, y * b.R, z * b.R); size.push(band ? 2.4 : 1.4); br.push(band ? .95 : .3); });
  const p = points(pos, size, br, ptsMat([.92, .9, 1], { wave: .045 })); b.g.add(p); b.pts = p;
  const core = sphere(b.R * .82, glassMat([.7, .8, 1], { glow: .4 })); b.g.add(core); b.glass = core;
});
// Portalverse: a glass ring with a vortex inside
const portal = body('Portalverse', 7, [-14, 8, -192], 3.6, b => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(b.R, b.R * .09, 48, 220), glassMat([.8, .7, 1], { holo: 1 })); ring.frustumCulled = false; b.g.add(ring); b.glass = ring; b.ringR = b.R * .09;
  const pos = [], size = [], br = [];
  for (let i = 0; i < 5000; i++) { const t = Math.pow(hash(i * 1.7), .7), a = t * 12 + (i % 3) * 2.09 + hash(i) * .4, r = b.R * (.05 + t * .88); pos.push(Math.cos(a) * r, Math.sin(a) * r, (hash(i * 5.3) - .5) * .3); size.push(hash(i * 2.2) < .05 ? 3 : 1.5); br.push(.3 + (1 - t) * .7); }
  const v = points(pos, size, br, ptsMat([.9, .85, 1], { flat: 1 })); b.g.add(v); b.vortex = v;
});
// Monuments: a glass planet inside a ring of columns
const monuments = body('Monuments', 8, [14, 6, -232], 3, b => {
  const g = sphere(b.R, glassMat([1, .95, .88], { glow: .5 })); b.g.add(g); b.glass = g;
  const n = 30, col = new THREE.InstancedMesh(new THREE.CylinderGeometry(.07, .07, b.R * .9, 8), new THREE.MeshBasicMaterial({ color: 0x9a86ff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }), n);
  const d = new THREE.Object3D(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; d.position.set(Math.cos(a) * b.R * 1.45, 0, Math.sin(a) * b.R * 1.45); d.updateMatrix(); col.setMatrixAt(i, d.matrix); }
  col.frustumCulled = false; b.g.add(col);
  for (const y of [-.47, .47]) { const t = new THREE.Mesh(new THREE.TorusGeometry(b.R * 1.45, .03, 6, 160), new THREE.MeshBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })); t.rotation.x = Math.PI / 2; t.position.y = y * b.R; t.frustumCulled = false; b.g.add(t); }
  b.g.rotation.x = .25;
});

/* ---------------------------------------------------------------- the figure cloud: dust that draws each stop's number */
const FIGN = 4200;
const fig = (() => {
  const pos = new Float32Array(FIGN * 3), size = [], b = [];
  for (let i = 0; i < FIGN; i++) { size.push(hash(i * 3.3) < .06 ? 2.8 : 1.6); b.push(.35 + hash(i * 8.1) * .65); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1)); g.setAttribute('aB', new THREE.Float32BufferAttribute(b, 1));
  const p = new THREE.Points(g, ptsMat([.9, .86, 1], { flat: 1, scale: 1 })); p.frustumCulled = false; p.position.set(0, 0, -20); cam.add(p);
  return { p, pos, dust: new Float32Array(FIGN * 3), tgt: new Float32Array(FIGN * 3), cur: '', has: 0, k: 0 };
})();
const fc = document.createElement('canvas'), fctx = fc.getContext('2d', { willReadFrequently: true });
const figCache = {};
function sampleText(txt) {
  if (figCache[txt]) return figCache[txt];
  fc.width = 1400; fc.height = 420; fctx.clearRect(0, 0, 1400, 420); fctx.fillStyle = '#fff';
  fctx.font = '200 330px "Hanken Grotesk", Helvetica, Arial, sans-serif'; fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
  fctx.fillText(txt, 700, 215);
  const d = fctx.getImageData(0, 0, 1400, 420).data, pts = [];
  for (let y = 0; y < 420; y += 3) for (let x = 0; x < 1400; x += 3) if (d[(y * 1400 + x) * 4 + 3] > 120) pts.push([x / 1400 - .5, .5 - y / 420]);
  return (figCache[txt] = pts);
}
function fillDust(w, h) { for (let i = 0; i < FIGN; i++) { fig.dust[i * 3] = (hash(i * 1.1) - .5) * w * 1.8; fig.dust[i * 3 + 1] = (hash(i * 2.7) - .5) * h * 1.6; fig.dust[i * 3 + 2] = (hash(i * 4.9) - .5) * 14; } }
function setFigure(txt, w, h) {
  fig.cur = txt;
  if (!txt) { fig.tgt.set(fig.dust); fig.has = 0; return; }
  const pts = sampleText(txt); if (!pts.length) return;
  const sw = Math.min(w * .78, h * 2.6), sh = sw * 420 / 1400;
  for (let i = 0; i < FIGN; i++) { const p = pts[Math.floor(hash(i * 3.17 + txt.length) * pts.length)];
    fig.tgt[i * 3] = p[0] * sw + (hash(i * 9.1) - .5) * .12; fig.tgt[i * 3 + 1] = p[1] * sh + h * .12 + (hash(i * 6.3) - .5) * .12; fig.tgt[i * 3 + 2] = (hash(i * 5.5) - .5) * .8; }
  fig.has = 1;
}

/* ---------------------------------------------------------------- stops: where the camera goes */
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const DIR = v(-.22, .2, 1).normalize();
function view(i, out) {
  // returns { p: camera position, t: look target } for stop i, live (moons move)
  const b = BODIES.find(b => b.stop === i);
  if (i === 0) { out.p.set(W < 700 ? 260 : 185, 64, -146); out.t.set(0, W < 700 ? 30 : 26, -146); return out; }   // the map: the universe laid out side on
  if (i === 9) { out.p.set(0, 6, -268); out.t.set(0, 4, -340); return out; }   // the gallery: open dark space
  if (i === 10) { out.p.set(42, 70, -120); out.t.set(0, 0, -150); return out; } // the movement: the whole universe from above
  if (!b) { out.p.set(0, 10, 30); out.t.set(0, 0, -60); return out; }
  const c = b.g.getWorldPosition(out.t);
  const dist = b.R * (b === world ? 8.5 : b.stop >= 2 && b.stop <= 4 ? 8 : 6.2) * (W < 700 ? 1.25 : 1);
  out.p.copy(c).addScaledVector(DIR, dist);
  out.t.y -= b.R * .35;           // the body sits a little above the centre, under the title
  return out;
}
const A = { p: v(0, 0, 0), t: v(0, 0, 0) }, B = { p: v(0, 0, 0), t: v(0, 0, 0) };
const camP = v(0, 12, 60), camT = v(0, 2, -90);

/* ---------------------------------------------------------------- labels (the map) and interaction */
const labels = BODIES.map(b => { const el = document.createElement('button'); el.type = 'button'; el.className = 'u-label'; el.textContent = b.name; el.setAttribute('aria-label', 'Fly to ' + b.name); el.addEventListener('click', () => RW.goTo?.(b.stop)); document.body.append(el); return el; });
const look = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
let drag = null, hover = null;
cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: look.ty, pitch: look.tp, moved: 0, touch: e.pointerType === 'touch' }; if (!drag.touch) cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    look.ty = clamp(drag.yaw - dx * .0022, -.9, .9); if (!drag.touch) look.tp = clamp(drag.pitch - dy * .0018, -.4, .4);
  } else { hover = pick(e.clientX, e.clientY); cv.style.cursor = hover ? 'pointer' : 'grab'; }
});
const end = e => { if (!drag) return; if (drag.moved < 6) { const b = pick(e.clientX, e.clientY); if (b) RW.goTo?.(b.stop); } drag = null; };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', () => { drag = null; });
const sv = v(0, 0, 0);
function screenOf(b, out) { b.g.getWorldPosition(sv); const d = sv.distanceTo(cam.position); sv.project(cam); out.x = (sv.x * .5 + .5) * W; out.y = (-sv.y * .5 + .5) * H; out.z = sv.z; out.r = b.R / (d * Math.tan(cam.fov * Math.PI / 360)) * H / 2; return out; }
const so = {};
function pick(x, y) { let best = null, bd = 1e9; for (const b of BODIES) { screenOf(b, so); if (so.z > 1) continue; const d = Math.hypot(so.x - x, so.y - y); if (d < Math.max(so.r * 1.3, 22) && d < bd) { bd = d; best = b; } } return best; }

/* ---------------------------------------------------------------- frame */
let W = 0, H = 0, dpr = 1, last = performance.now(), time = 0;
function size() { W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75); roomR.setSize(W, H, false); R3.setPixelRatio(dpr); R3.setSize(W, H, false);
  cam.aspect = W / H; cam.fov = W < 700 ? 58 : 45; cam.updateProjectionMatrix(); U.uRes.value.set(W, H);
  const fh = 2 * 20 * Math.tan(cam.fov * Math.PI / 360), fw = fh * cam.aspect; fillDust(fw, fh); if (!fig.k) { fig.pos.set(fig.dust); fig.tgt.set(fig.dust); fig.k = 1; } if (fig.cur) setFigure(fig.cur, fw, fh); }
size(); addEventListener('resize', size);
const allMats = []; scene.traverse(o => { if (o.material && o.material.uniforms) allMats.push(o.material); });
const m3 = new THREE.Matrix3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler();
let op = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt;
  U.uTime.value = time;

  // bodies move: moons orbit the world, planets turn
  moons.forEach(m => { const a = time * m.speed + m.phase; m.g.position.set(Math.cos(a) * m.orbit, 0, Math.sin(a) * m.orbit).applyQuaternion(m.q).add(world.base); });
  world.shell.rotation.y = time * .05; world.glass.rotation.y = time * .05;
  thrill.g.rotation.y = time * .12; pier.g.rotation.y = -time * .08; portal.vortex.rotation.z = -time * .35; portal.g.rotation.y = Math.sin(time * .2) * .4; monuments.g.rotation.y = time * .06;

  // the camera: hold at a stop, then fly on an arc to the next
  const s = clamp(RW.s || 0, 0, BODIES.length + 10), i = Math.floor(s), k = s - i;
  view(i, A); view(Math.min(i + 1, 10), B);
  const tp = v(0, 0, 0).lerpVectors(A.p, B.p, k); tp.y += Math.sin(Math.PI * k) * (6 + A.p.distanceTo(B.p) * .06);
  const tt = v(0, 0, 0).lerpVectors(A.t, B.t, k);
  if (RW.mode === 'hero') tp.z += (1 - seg(RW.heroP, .3, 1)) * 40;   // diving in as the film closes
  if (RW.mode === 'after') { const a = time * .03; tp.set(Math.cos(a) * 90, 55, -150 + Math.sin(a) * 90); tt.set(0, 0, -150); }
  const ck = RW.mode === 'journey' ? 1 - Math.exp(-dt * 7) : 1 - Math.exp(-dt * 3);
  camP.lerp(tp, ck); camT.lerp(tt, ck);
  // drag: look around; it eases back when you scroll on
  if (!drag && Math.abs(RW._ls - s) > .002) { look.ty *= Math.exp(-dt * 2.5); look.tp *= Math.exp(-dt * 2.5); }
  RW._ls = s;
  look.yaw = lerp(look.yaw, look.ty, 1 - Math.exp(-dt * 8)); look.pitch = lerp(look.pitch, look.tp, 1 - Math.exp(-dt * 8));
  cam.position.copy(camP); cam.lookAt(camT);
  cam.rotateY(look.yaw + (reduced ? 0 : Math.sin(time * .15) * .015)); cam.rotateX(look.pitch);
  cam.updateMatrixWorld();

  // per-body uniforms: the glass needs its radius on screen; the moon lines turn with the moon
  for (const b of BODIES) { if (!b.glass) continue; screenOf(b, so); const u = b.glass.material.uniforms; u.uDpr.value = dpr; u.uRpx.value = Math.max(2, (b.ringR ? so.r * .09 / 1 : so.r)); u.uTime = U.uTime;
    if (u.uLines.value > 0) { m4.makeRotationFromQuaternion(q.setFromEuler(e3.set(0, time * .1, 0))); u.uSpin.value.setFromMatrix4(m4).transpose(); } }
  allMats.forEach(m => { if (m.uniforms.uDpr) m.uniforms.uDpr.value = dpr; if (m.uniforms.uTime && m.uniforms.uTime !== U.uTime) m.uniforms.uTime.value = time; });
  terrain.material.uniforms.uCam.value.copy(cam.position);

  // the room: horizon line follows the camera's pitch; the orb sits behind the body we hold at
  const near = BODIES.reduce((a, b) => { const d = b.g.getWorldPosition(sv).distanceTo(cam.position); return d < a.d ? { b, d } : a; }, { b: null, d: 1e9 });
  if (near.b) { screenOf(near.b, so); U.uOrb.value.set(so.x / W, 1 - so.y / H, clamp(1.4 - near.d / 60) * (so.z < 1 ? 1 : 0), Math.max(.06, so.r / H * 2.2)); }
  U.uHorizon.value = .42 + clamp(cam.position.y / 120, -.2, .3) * -.4 + look.pitch * .5;

  // the figure cloud
  const fh = 2 * 20 * Math.tan(cam.fov * Math.PI / 360), fw = fh * cam.aspect;
  const want = RW.mode === 'journey' ? (RW.fig || '') : '';
  if (want !== fig.cur) setFigure(want, fw, fh);
  const fk = 1 - Math.exp(-dt * (fig.has ? 3.2 : 1.2));
  for (let j = 0; j < FIGN * 3; j += 3) {
    const wob = fig.has ? 0 : Math.sin(time * .3 + j) * .02;
    const dl = clamp(fk * (.6 + hash(j) * .8));
    fig.pos[j] += (fig.tgt[j] - fig.pos[j]) * dl + wob; fig.pos[j + 1] += (fig.tgt[j + 1] - fig.pos[j + 1]) * dl; fig.pos[j + 2] += (fig.tgt[j + 2] - fig.pos[j + 2]) * dl;
  }
  fig.p.geometry.attributes.position.needsUpdate = true;
  fig.p.material.uniforms.uFade.value = fig.has ? (W < 700 ? .38 : .95) : .3;   // phones: the figure stays a faint layer behind the title

  // the map labels
  const holdB = BODIES.find(b => b.stop === Math.round(s) && Math.abs(s - Math.round(s)) < .3);
  // phones: the map labels show on the overview and in flight, not over a stop's title
  const quiet = W < 700 && Math.abs(s - Math.round(s)) < .3 && Math.round(s) > 0 && Math.round(s) < 10;
  BODIES.forEach((b, j) => { screenOf(b, so); const el = labels[j]; const on = !quiet && RW.mode !== 'hero' && so.z < 1 && so.x > 20 && so.x < W - 20 && so.y > 70 && so.y < H - 60 && b !== holdB;
    el.style.transform = `translate(${so.x.toFixed(1)}px, ${(so.y + so.r + 12).toFixed(1)}px) translateX(-50%)`; el.classList.toggle('on', on); el.classList.toggle('hot', hover === b); });

  // the scene shows as the film closes; it dims under the case studies
  const target = RW.mode === 'hero' ? seg(RW.heroP, .25, .8) : RW.mode === 'after' ? .4 : 1;
  op = lerp(op, target, 1 - Math.exp(-dt * 6)); cv.style.opacity = op.toFixed(3);

  roomR.render(roomScene, flat);
  R3.render(scene, cam);
}
document.fonts?.ready.then(() => { for (const k in figCache) delete figCache[k]; if (fig.cur) { const t = fig.cur; fig.cur = '#'; } });
requestAnimationFrame(frame);
