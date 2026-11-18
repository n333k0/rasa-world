// Builds assets/img/world-dots.svg (the footprint map's land as a dot grid) and prints each city's position in %.
// Run from a folder with world-atlas@2, topojson-client@3 and d3-geo@3 installed:
//   node tools/footprint-map.mjs <node_modules dir> <repo dir>
import { createRequire } from 'module';
import fs from 'fs';
const [nm, repo] = process.argv.slice(2);
const req = createRequire(nm + '/');
const { feature } = req('topojson-client');
const { geoEquirectangular, geoContains } = req('d3-geo');
const land = feature(...(t => [t, t.objects.land])(JSON.parse(fs.readFileSync(nm + '/world-atlas/land-50m.json'))));
const W = 1000, TOP = 75, BOT = -52, H = Math.round(W * (TOP - BOT) / 360); // crop: no Antarctica, little Arctic
const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H * TOP / (TOP - BOT)]);
const STEP = 6.2; let d = '', n = 0;
for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) {
  const ll = proj.invert([x, y]); if (geoContains(land, ll)) { d += `M${x.toFixed(1)} ${y.toFixed(1)}h0`; n++; }
}
fs.writeFileSync(repo + '/assets/img/world-dots.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><path d="${d}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>\n`);
const cities = { 'San Francisco': [-122.42, 37.77], 'Los Angeles': [-118.24, 34.05], 'San Diego': [-117.16, 32.72], 'New York': [-74.0, 40.71],
  'Miami': [-80.19, 25.76], 'London': [-0.13, 51.51], 'Paris': [2.35, 48.86], 'Milan': [9.19, 45.46], 'Ibiza': [1.43, 38.91], 'Dubai': [55.27, 25.2] };
console.log(`${n} dots, ${W}x${H}`);
for (const [k, c] of Object.entries(cities)) { const [x, y] = proj(c); console.log(k, (x / W * 100).toFixed(2), (y / H * 100).toFixed(2)); }
