// RASA World v7: the world drawn in Cyera's manner (secure-the-unknown.cyera.com), with RASA's concept.
// Cel-shaded line art instead of glass: flat fills in three tones, dark plum outlines, no gradients. The RASA world is a
// lilac planet with outlined continents that turns; it wears three orbit rings laid flat to the screen (one solid lime,
// one dotted, one thin), carries the three arms as cel moons, and is surrounded all page long by drifting outlined
// crystals and asteroids. Screen-pixel orthographic camera; where it sits per section follows window.RW (page7.js).
import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const root = document.documentElement;
const RW = window.RW || (window.RW = {});
const cv = document.querySelector('.glass');
const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!ok || !cv) { root.classList.add('no-gl'); throw new Error('RASA World v7: no WebGL'); }

const COL = { line: 0x1a0a2b, lilac: 0xe7b8ff, mid: 0xb06ee6, deep: 0x5a2381, plum: 0x3a1656, lime: 0xc6f36b, pink: 0xf2a6ff };
const R3 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R3.setClearColor(0, 0);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -8000, 8000);
const L = new THREE.Vector3(-.55, .65, .55).normalize();

/* ---------------------------------------------------------------- the planet: three flat tones, outlined continents */
const planetMat = new THREE.ShaderMaterial({
  uniforms: { uSpin: { value: new THREE.Matrix3() }, uL: { value: L }, uFade: { value: 1 } },
  transparent: true,
  vertexShader: `varying vec3 vN; varying vec3 vO; void main() { vN = normalize(mat3(modelMatrix) * normal); vO = normal; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
  fragmentShader: /* glsl */`
  uniform mat3 uSpin; uniform vec3 uL; uniform float uFade; varying vec3 vN; varying vec3 vO;
  float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vn(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p) { return vn(p) * .55 + vn(p * 2.1) * .3 + vn(p * 4.3) * .15; }
  void main() {
    vec3 n = normalize(vN), o = uSpin * vO;
    float d = dot(n, uL);
    float land = fbm(o * 2.3 + 4.);
    float isLand = step(.52, land);
    // three flat tones per surface, lit from the upper left
    vec3 sea = d > .45 ? vec3(.69, .43, .9) : d > -.05 ? vec3(.55, .29, .79) : vec3(.36, .15, .53);
    vec3 grd = d > .45 ? vec3(.91, .72, 1.) : d > -.05 ? vec3(.78, .55, .95) : vec3(.5, .27, .7);
    vec3 c = mix(sea, grd, isLand);
    // a soft light shaft across the face, as in the reference's beam
    c += vec3(.06, .04, .08) * smoothstep(.2, .0, abs(n.x + n.y * .4 + .1)) ;
    // line art: continent edges, two latitude lines, and the silhouette
    float e = abs(land - .52), fw = fwidth(land) * 1.4;
    float line = 1. - smoothstep(0., fw, e);
    float lat = abs(o.y - .42), lat2 = abs(o.y + .55);
    line = max(line, 1. - smoothstep(0., fwidth(o.y) * 1.2, lat));
    line = max(line, 1. - smoothstep(0., fwidth(o.y) * 1.2, lat2));
    float rim = 1. - smoothstep(.0, fwidth(n.z) * 2.2, n.z - .02);
    c = mix(c, vec3(.1, .04, .17), max(line * .85, rim));
    gl_FragColor = vec4(c, uFade);
  }`,
});
const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), planetMat);
scene.add(planet);

/* ---------------------------------------------------------------- orbit rings, flat to the screen: lime, dotted, thin */
const ringLime = new THREE.Mesh(new THREE.RingGeometry(1, 1.012, 256), new THREE.MeshBasicMaterial({ color: COL.lime, transparent: true }));
const dotsGeo = new THREE.BufferGeometry(); { const p = []; for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2; p.push(Math.cos(a), Math.sin(a), 0); } dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); }
const ringDots = new THREE.Points(dotsGeo, new THREE.PointsMaterial({ color: COL.lime, size: 2.4, sizeAttenuation: false, transparent: true, opacity: .7 }));
const thinGeo = new THREE.BufferGeometry(); { const p = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; p.push(Math.cos(a), Math.sin(a), 0); } thinGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); }
const ringThin = new THREE.Line(thinGeo, new THREE.LineBasicMaterial({ color: COL.lilac, transparent: true, opacity: .35 }));
[ringLime, ringDots, ringThin].forEach(m => { m.frustumCulled = false; m.renderOrder = -1; scene.add(m); });

/* ---------------------------------------------------------------- outlined, flat-shaded solids (moons, crystals, asteroids) */
const flatMat = color => new THREE.ShaderMaterial({
  uniforms: { uC: { value: new THREE.Color(color) }, uL: { value: L }, uFade: { value: 1 } }, transparent: true,
  vertexShader: `varying vec3 vN; void main() { vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform vec3 uC; uniform vec3 uL; uniform float uFade; varying vec3 vN; void main() { float d = dot(normalize(vN), uL);
    float k = d > .5 ? 1. : d > 0. ? .78 : .56; gl_FragColor = vec4(uC * k, uFade); }`,
});
function solid(geo, color, edge = COL.line) {
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  const m = new THREE.Mesh(g, flatMat(color));
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 18), new THREE.LineBasicMaterial({ color: edge, transparent: true }));
  const grp = new THREE.Group(); grp.add(m, e); grp.userData = { m, e }; grp.frustumCulled = false; scene.add(grp); return grp;
}
const setFade = (grp, f) => { grp.userData.m.material.uniforms.uFade.value = f; grp.userData.e.material.opacity = f; grp.visible = f > .01; };
// a rock: a dodecahedron pushed about a little
const rockGeo = seed => { const g = new THREE.DodecahedronGeometry(1, 0), p = g.attributes.position; let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!seen.has(k)) seen.set(k, .78 + rnd() * .38); const f = seen.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * .85, p.getZ(i) * f); }
  return g; };
const moons = [solid(new THREE.IcosahedronGeometry(1, 1), COL.lilac), solid(new THREE.IcosahedronGeometry(1, 1), COL.pink), solid(new THREE.IcosahedronGeometry(1, 1), COL.lime)];

// the drifting field: crystals (lilac, pink, a few lime) and dark asteroids, each with a screen spot, a size, a depth
const KINDS = [
  () => solid(new THREE.OctahedronGeometry(1, 0), COL.lilac),
  () => solid(new THREE.BoxGeometry(2.4, .5, .5), COL.pink),
  () => solid(new THREE.OctahedronGeometry(1, 0).scale(.45, 1.2, .45), COL.mid),
  () => solid(new THREE.IcosahedronGeometry(1, 0), COL.lime),
  () => solid(rockGeo(11), COL.plum),
  () => solid(rockGeo(29), COL.deep),
  () => solid(new THREE.BoxGeometry(1, 1, 1), COL.lilac),
];
const FIELD = [];
{ let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const order = [0, 4, 1, 5, 2, 0, 4, 6, 1, 5, 3, 4, 2, 0, 5, 1, 4, 6, 3, 5];
  order.forEach((k, i) => {
    // keep the middle of the screen clear for the words: spots sit in the outer bands
    let x = rnd(), y = rnd(); if (x > .3 && x < .7 && y > .25 && y < .78) x = x < .5 ? x - .26 : x + .26;
    const rock = k === 4 || k === 5;
    FIELD.push({ g: KINDS[k](), x, y, s: (rock ? 26 + rnd() * 54 : 9 + rnd() * 18), dz: .25 + rnd() * .9, rx: rnd() * 6, ry: rnd() * 6, w: (rnd() - .5) * .6, bob: rnd() * 6 });
  });
}

/* ---------------------------------------------------------------- where the world goes */
const $ = s => document.querySelector(s);
const SEC = { hero: $('.hero'), eco: $('.eco'), outcome: $('.outcome'), numbers: $('.numbers'), intro: $('.uni-intro'), wins: $('.wins'),
  tabulah: $('.tabulah'), moments: $('.gal, .moments'), work: $('.work'), close: $('.close'), foot: $('.foot') };
const tags = [...document.querySelectorAll('.moon-tags span')];
const S = { x: innerWidth / 2, y: innerHeight / 2, R: 0, fade: 0, moons: 0, orbit: 1.8, rings: 0, field: 1, act: -1 };
const T = Object.assign({}, S);
function station() { const mid = innerHeight / 2; for (const [k, el] of Object.entries(SEC)) { if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return k; } return 'hero'; }
function target(st) {
  const W = innerWidth, H = innerHeight, m = Math.min(W, H), wide = W >= 900;
  Object.assign(T, { act: -1, moons: 0, orbit: 1.8, rings: 0, field: 1 });
  if (st === 'hero') { const p = RW.hero || 0, D = m * .44, a = seg(p, .52, .66); Object.assign(T, { x: W / 2, y: H / 2, R: D / 2, fade: a, rings: seg(p, .6, .8), moons: seg(p, .78, .98) }); }
  else if (st === 'eco') Object.assign(T, { x: wide ? W * .25 : W * .5, y: wide ? H * .6 : H * .375, R: wide ? m * .16 : Math.min(W * .15, H * .07), fade: 1, moons: 1, act: RW.arm ?? 0, orbit: 2, rings: .45 });
  else if (st === 'outcome') Object.assign(T, { x: wide ? W * .84 : W * .9, y: H * .5, R: m * (wide ? .3 : .26), fade: 1, moons: .5, orbit: 1.5, rings: 1 });
  else if (st === 'numbers') Object.assign(T, { x: wide ? W * .84 : W * .9, y: H * .3, R: 0, fade: 0 });
  else if (st === 'intro') Object.assign(T, { x: wide ? W * .74 : W * .76, y: wide ? H * .5 : H * .22, R: wide ? m * .2 : W * .16, fade: 1, rings: 1 });
  else if (st === 'close' || st === 'foot') Object.assign(T, { x: wide ? W * .73 : W * .5, y: wide ? H * .5 : H * .2, R: wide ? m * .17 : W * .2, fade: st === 'foot' ? 0 : 1, moons: .9, orbit: 1.7, rings: 1 });
  else Object.assign(T, { R: S.R * .6, fade: 0, field: st === 'wins' || st === 'moments' ? .35 : .7 });
  return st;
}

/* ---------------------------------------------------------------- frame */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { ptr.tx = e.clientX / innerWidth - .5; ptr.ty = e.clientY / innerHeight - .5; }, { passive: true });
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const PLANES = [[-.32, -.18], [-.42, .32], [-.24, .62]].map(([tx, tz]) => new THREE.Quaternion().setFromAxisAngle(Z, tz).multiply(new THREE.Quaternion().setFromAxisAngle(X, tx)));
const RADII = [1, 1.28, 1.56], moonS = [1, 1, 1];
const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), eu = new THREE.Euler();
let W = 0, H = 0, last = performance.now(), time = 0;
function size() { W = innerWidth; H = innerHeight; R3.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R3.setSize(W, H, false); cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix(); }
size(); addEventListener('resize', size);

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.12, (now - last) / 1000); last = now;
  if (document.hidden) return;
  time += reduced ? 0 : dt;
  const st = target(station());
  const k = st === 'hero' ? 1 : 1 - Math.exp(-dt * 4.2);
  for (const key of ['x', 'y', 'R', 'fade', 'moons', 'orbit', 'rings', 'field']) S[key] = lerp(S[key], T[key], k);
  S.act = T.act;
  ptr.x = lerp(ptr.x, ptr.tx, 1 - Math.exp(-dt * 4)); ptr.y = lerp(ptr.y, ptr.ty, 1 - Math.exp(-dt * 4));
  const R = Math.max(S.R, .001), fd = clamp(S.fade);

  // the planet turns slowly on a tilted axis and leans to the pointer
  q.setFromAxisAngle(Y, time * .15 + ptr.x * .5).premultiply(q2.setFromAxisAngle(X, .35 + ptr.y * .3));
  m4.makeRotationFromQuaternion(q); planetMat.uniforms.uSpin.value.setFromMatrix4(m4).transpose();
  planet.position.set(S.x, -S.y, 0); planet.scale.setScalar(R); planetMat.uniforms.uFade.value = fd; planet.visible = fd > .01 && R > .5;
  const rg = clamp(S.rings) * fd, breathe = 1 + Math.sin(time * .8) * .01;
  ringLime.position.set(S.x, -S.y, -R * 3); ringLime.scale.setScalar(R * 1.24 * breathe); ringLime.material.opacity = rg; ringLime.visible = rg > .01;
  ringDots.position.set(S.x, -S.y, -R * 3); ringDots.scale.setScalar(R * 1.62); ringDots.rotation.z = time * .05; ringDots.material.opacity = rg * .75; ringDots.visible = rg > .01;
  ringThin.position.set(S.x, -S.y, -R * 3); ringThin.scale.setScalar(R * 2.1); ringThin.material.opacity = rg * .35; ringThin.visible = rg > .01;

  const mA = clamp(S.moons) * fd;
  for (let i = 0; i < 3; i++) {
    const on = S.act === i;
    moonS[i] = lerp(moonS[i], on ? 1.8 : S.act >= 0 ? .8 : 1, 1 - Math.exp(-dt * 5));
    const a = time * (.3 - i * .07) + i * 2.1, ro = R * S.orbit * RADII[i] / RADII[1];
    v3.set(Math.cos(a) * ro, 0, Math.sin(a) * ro).applyQuaternion(PLANES[i]);
    const r = R * .13 * moonS[i];
    const g = moons[i]; g.position.set(S.x + v3.x, -S.y + v3.y, v3.z); g.scale.setScalar(Math.max(r, .001)); g.rotation.set(time * .4 + i, time * .6, 0);
    setFade(g, mA);
    const tg = tags[i];
    if (tg) { tg.style.setProperty('--x', clamp(S.x + v3.x, 44, W - 44).toFixed(1) + 'px'); tg.style.setProperty('--y', (S.y - v3.y).toFixed(1) + 'px');
      tg.style.setProperty('--o', (r + 12).toFixed(1) + 'px'); tg.style.setProperty('--a', ((st === 'eco' ? mA : 0) * (v3.z > -R * .2 ? 1 : .3)).toFixed(2)); tg.classList.toggle('on', on); }
  }

  // the drifting field: each piece rises with the scroll at its own depth and wraps round, bobbing and turning
  const fA = clamp(S.field), sy = scrollY, span = H * 1.5;
  const phone = W < 700;
  FIELD.forEach((f, i) => {
    if (phone && i % 2) { setFade(f.g, 0); return; }          // a phone gets half the field, smaller

    let y = f.y * span - sy * f.dz * .35; y = ((y % span) + span) % span - H * .25;
    const x = f.x * W + ptr.x * -40 * f.dz + Math.sin(time * .3 + f.bob) * 8;
    // rocks and most crystals pass behind the world; only the nearest few small crystals cross in front of it
    f.g.position.set(x, -(y + Math.sin(time * .5 + f.bob) * 10), f.dz > .95 && f.s < 22 ? 2000 : -2000);
    f.g.rotation.set(f.rx + time * f.w, f.ry + time * f.w * .7, time * f.w * .3);
    f.g.scale.setScalar(f.s * (.75 + f.dz * .4) * (phone ? .5 : 1));
    setFade(f.g, fA);
  });
  R3.render(scene, cam);
}
requestAnimationFrame(frame);
