// Records a scroll-through video of one RASA World page, for the hub's laptop mockups (2026-11-13).
// Usage: node tools/record.mjs <page.html> <out.mp4> [seconds=24]
// Starts headless Chrome with its debugging port, scrolls the page from top to bottom in small steps (with short holds at
// the top and bottom), screenshots every step and joins the frames with ffmpeg. Node 24 standard library only (fetch,
// WebSocket); needs the local preview server on 127.0.0.1:8792 and ffmpeg.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [page, out, secs = '24'] = process.argv.slice(2);
if (!page || !out) { console.error('usage: node tools/record.mjs <page.html> <out.mp4> [seconds]'); process.exit(1); }
const FPS = 30, W = 1440, H = 900, FRAMES = Math.round(+secs * FPS), PORT = 9300 + Math.floor(Math.random() * 600);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'rasa-rec-')), frames = mkdtempSync(join(tmpdir(), 'rasa-frames-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`,
  '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

try {
  let list;
  for (let t = 0; t < 60; t++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (e) {} await sleep(250); }
  const tab = list.find(x => x.type === 'page');
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:8792/${page}` });
  await sleep(6000);
  // gates and loaders: press any "Enter" button the page shows, then let it settle
  await evalJs(`(() => { const b = [...document.querySelectorAll('button, a')].find(x => /enter the rasa|^enter$/i.test(x.textContent.trim())); b && b.click(); return !!b; })()`);
  await sleep(2500);
  const total = await evalJs('Math.max(0, document.documentElement.scrollHeight - innerHeight)');
  const HOLD = Math.round(FPS * 1.2), MOVE = FRAMES - HOLD * 2;
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  for (let f = 0; f < FRAMES; f++) {
    const t = f < HOLD ? 0 : f >= HOLD + MOVE ? 1 : (f - HOLD) / MOVE;
    // gentle ease only at the very ends, steady speed in between
    const p = t < .06 ? ease(t / .12) * .12 * .5 : t > .94 ? 1 - ease((1 - t) / .12) * .12 * .5 : t;
    const y = Math.round(p * total);
    await evalJs(`new Promise(r => { window.scrollTo(0, ${y}); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 70))); })`);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(join(frames, `f${String(f).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
    if (f % 60 === 0) process.stdout.write(`${page} ${f}/${FRAMES}\n`);
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-vf', 'scale=1280:-2', '-movflags', '+faststart', '-an', out]);
  console.log(`done ${out}`);
} catch (e) { console.error(`failed ${page}: ${e.message}`); process.exitCode = 1; }
finally { try { ws?.close(); } catch (e) {} chrome.kill('SIGKILL'); await sleep(300); rmSync(prof, { recursive: true, force: true }); rmSync(frames, { recursive: true, force: true }); }
