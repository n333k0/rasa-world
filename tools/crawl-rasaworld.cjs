// Structured pass: each page's main content as sections of ordered blocks (headings, text, lists, images, videos,
// buttons, form fields, and groups of repeated cards), header/nav/footer left out.
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2]; const routes = Object.keys(JSON.parse(fs.readFileSync(out + '/crawl.json')));
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  const res = {};
  for (const r of routes) {
    if (r === '/privacy') continue;
    const p = await ctx.newPage();
    try {
      await p.goto('https://rasaworld.com' + r, { waitUntil: 'load', timeout: 45000 }); await p.waitForTimeout(2500);
      for (let y = 0; y < 30000; y += 700) { const h = await p.evaluate(v => { scrollTo(0, v); return document.body.scrollHeight; }, y); await p.waitForTimeout(60); if (y > h) break; }
      await p.waitForTimeout(700);
      res[r] = await p.evaluate(() => {
        const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
        const T = e => (e.innerText || '').replace(/\s+\n/g, '\n').trim();
        const vis = e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && (e.offsetWidth || e.offsetHeight || e.getClientRects().length); };
        const skip = e => e.closest('header, nav, footer, [role="banner"], [role="contentinfo"], [aria-label*="nnouncement"]');
        const root = document.querySelector('main') || document.body;
        // repeated card groups: a parent whose element children (>=2) share a class and each contain a heading or image
        const cardParents = new Set();
        root.querySelectorAll('*').forEach(el => {
          const kids = [...el.children].filter(vis); if (kids.length < 2) return;
          const sig = k => k.tagName + '.' + (typeof k.className === 'string' ? k.className.split(' ').slice(0, 3).join('.') : '');
          const s0 = sig(kids[0]); if (!kids.every(k => sig(k) === s0)) return;
          if (!kids.every(k => k.querySelector('h2,h3,h4,h5,img,video') )) return;
          if (kids.some(k => k.querySelector('section'))) return;
          cardParents.add(el);
        });
        const card = k => ({
          title: [...k.querySelectorAll('h2,h3,h4,h5')].map(h => h.getAttribute('aria-label') || T(h) || h.textContent.trim()).join(' / '),
          text: [...k.querySelectorAll('p,li,span')].filter(x => !x.querySelector('p,li') && !x.closest('h2,h3,h4,h5')).map(T).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('\n'),
          img: (k.querySelector('img') && abs(k.querySelector('img').currentSrc || k.querySelector('img').src)) || (k.querySelector('video') && abs(k.querySelector('video').currentSrc || k.querySelector('video source')?.src || '')) || '',
          href: (k.matches('a') ? k : k.querySelector('a'))?.getAttribute('href') || '',
        });
        const blocks = []; const done = new Set();
        const walk = el => {
          if (skip(el) || !vis(el)) return;
          if (cardParents.has(el)) { blocks.push({ cards: [...el.children].filter(vis).map(card) }); return; }
          const tg = el.tagName;
          if (/^H[1-6]$/.test(tg)) { blocks.push({ h: +tg[1], t: el.getAttribute('aria-label') || T(el) || el.textContent.trim() }); return; }
          if (tg === 'P' || tg === 'BLOCKQUOTE') { const t = T(el); if (t) blocks.push({ p: t }); return; }
          if (tg === 'LI') { blocks.push({ li: T(el) }); return; }
          if (tg === 'IMG') { const s = abs(el.currentSrc || el.src); if (!s.startsWith('data:')) blocks.push({ img: s, alt: el.alt }); return; }
          if (tg === 'VIDEO') { blocks.push({ video: abs(el.currentSrc || el.querySelector('source')?.src || el.src || ''), poster: el.poster }); return; }
          if (tg === 'A' && !el.querySelector('h1,h2,h3,h4,p,img')) { const t = T(el); if (t) blocks.push({ a: t, href: el.getAttribute('href') }); return; }
          if (tg === 'BUTTON') { const t = T(el); if (t) blocks.push({ btn: t }); return; }
          if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') { blocks.push({ field: tg.toLowerCase(), type: el.type, name: el.name, ph: el.placeholder, label: el.closest('label')?.innerText?.trim() || el.labels?.[0]?.innerText?.trim() || '', opts: tg === 'SELECT' ? [...el.options].map(o => o.text) : undefined }); return; }
          const kids = [...el.children];
          if (!kids.length) { const t = T(el); if (t && t.length < 400) blocks.push({ s: t }); return; }
          // loose text directly in a div with element children
          for (const n of el.childNodes) { if (n.nodeType === 1) walk(n); else if (n.nodeType === 3 && n.textContent.trim().length > 1) blocks.push({ s: n.textContent.trim() }); }
        };
        walk(root);
        return { title: document.title, desc: document.querySelector('meta[name="description"]')?.content || '', blocks };
      });
      console.log('ok', r, res[r].blocks.length);
    } catch (e) { console.log('fail', r, e.message.slice(0, 80)); }
    await p.close();
  }
  fs.writeFileSync(out + '/pages.json', JSON.stringify(res)); await b.close();
})();
