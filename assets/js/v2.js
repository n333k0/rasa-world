// RASA World v2 (owner's review, 2026-11-26): the live parts of the page. Each runs only while it is on screen and stops
// for visitors who ask for reduced motion.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  // run fn every ms while el is visible
  const whileSeen = (el, ms, fn) => {
    if (!el) return; let t = null;
    const start = () => { if (!t && !reduced) t = setInterval(fn, ms); }, stop = () => { clearInterval(t); t = null; };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: .2 }).observe(el);
    else start();
  };

  /* ---------------------------------------------------------------- Tabulah's hub: one capability at a time, with what it does */
  const CAPS = [
    ['Ticketing & RSVP', 'Free RSVP and paid ticketing, set up in minutes for high-end, community-driven events.'],
    ['Guest lists', 'Guest-list management with AI-enhanced profiles and seamless audience curation.'],
    ['CRM', 'Every guest\'s history and preferences in one profile your brand owns outright.'],
    ['Segmentation', 'Audiences sorted by what they did before, so each offer reaches the right people.'],
    ['Real-time engagement', 'One-to-one moments during the event, timed by what is happening in the room.'],
    ['Marketing outreach', 'Email and SMS that run on their own, from the first invite to the recap.'],
    ['Smart check-in', 'Guest data captured at the door, enriching every profile as people arrive.'],
    ['Loyalty & upsells', 'History and referrals tracked across every event and city; upgrades offered to the right guests.'],
  ];
  const hub = $('.tab-hub'), nodes = $$('.hub-nodes li'), lines = $$('.hub-lines line'), det = $('.hub-detail');
  if (hub && nodes.length && det) {
    let cur = 0, hold = false;
    const show = i => {
      cur = (i + nodes.length) % nodes.length;
      nodes.forEach((n, k) => n.classList.toggle('on', k === cur)); lines.forEach((l, k) => l.classList.toggle('on', k === cur));
      const [t, d] = CAPS[cur] || [nodes[cur].textContent, ''];
      det.classList.remove('in'); void det.offsetWidth;
      $('.hd-k', det).textContent = `${String(cur + 1).padStart(2, '0')} / ${String(nodes.length).padStart(2, '0')}`;
      $('.hd-t', det).textContent = t; $('.hd-d', det).textContent = d; det.classList.add('in');
    };
    nodes.forEach((n, k) => { n.tabIndex = 0; n.addEventListener('pointerenter', () => { hold = true; show(k); }); n.addEventListener('focus', () => show(k)); n.addEventListener('click', () => show(k)); });
    hub.addEventListener('pointerleave', () => { hold = false; });
    show(0);
    whileSeen(hub, 2600, () => { if (!hold) show(cur + 1); });
  }

  /* ---------------------------------------------------------------- the dashboard: guests keep arriving */
  const NAMES = [['LB', 'Luca B.', 'General admission'], ['NT', 'Nina T.', 'VIP · Table 9'], ['OH', 'Omar H.', 'Guest list'], ['CW', 'Chloe W.', 'Early bird'],
    ['DV', 'Diego V.', 'General admission'], ['AK', 'Aya K.', 'VIP · Coaster pass'], ['RB', 'Ruben B.', 'Guest list +1'], ['EF', 'Elena F.', 'General admission']];
  const feed = $('[data-feed]'), big = $('[data-count-live]');
  if (feed) {
    let n = 0, min = 41, count = big ? +big.dataset.countLive : 0; const to = big ? +big.dataset.to : 0;
    whileSeen(feed, 1900, () => {
      const [ini, who, type] = NAMES[n++ % NAMES.length]; if (n % 3 === 0) min++;
      const li = document.createElement('li'); li.className = 'fresh';
      li.innerHTML = `<i>${ini}</i><span class="tu-who"><b>${who}</b><small>${type}</small></span><em class="${type.startsWith('VIP') ? 'vip' : 'ok'}">9:${String(min % 60).padStart(2, '0')} PM</em>`;
      feed.prepend(li); while (feed.children.length > 5) feed.lastElementChild.remove();
      if (big && count < to) { count = Math.min(to, count + 7 + Math.floor(Math.random() * 9)); big.textContent = fmt(count); }
    });
  }
  const bars = $('[data-bars]');
  if (bars) whileSeen(bars, 1400, () => {
    const b = $$('i', bars), last = b[b.length - 1];
    b.forEach((x, i) => { if (i < b.length - 1) x.style.setProperty('--h', b[i + 1].style.getPropertyValue('--h')); });
    last.style.setProperty('--h', (.25 + Math.random() * .7).toFixed(2));
  });

  /* ---------------------------------------------------------------- v3's three cards: they rise in turn, tilt under the
     pointer with a glare, and their photos drift with the scroll */
  const pl = $$('.pillars-v3 .pl-card');
  if (pl.length) {
    const grid = pl[0].parentElement;
    if ('IntersectionObserver' in window && !reduced) new IntersectionObserver((es, ob) => es.forEach(e => { if (e.isIntersecting) { grid.classList.add('in'); ob.disconnect(); } }), { threshold: .2 }).observe(grid);
    else grid.classList.add('in');
    if (!reduced && matchMedia('(hover: hover)').matches) pl.forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    if (!reduced) {
      const drift = () => { pl.forEach((c, i) => { const r = c.getBoundingClientRect(); const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; c.style.setProperty('--py', (p * (24 + i * 10)).toFixed(1) + 'px'); }); requestAnimationFrame(drift); };
      requestAnimationFrame(drift);
    }
  }

  /* ---------------------------------------------------------------- the intro's app: automations run one after another */
  const app = $('.tri-app'), flows = $$('.ta-flow'), tick = $('[data-tick]');
  if (app) {
    let f = 0, c = tick ? +tick.dataset.tick : 0; const to = tick ? +tick.dataset.to : 0;
    whileSeen(app, 1500, () => {
      flows.forEach((x, k) => x.classList.toggle('on', k === f % flows.length)); f++;
      if (tick && c < to) { c = Math.min(to, c + 23 + Math.floor(Math.random() * 30)); tick.textContent = fmt(c); }
    });
  }
})();
