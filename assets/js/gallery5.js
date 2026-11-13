// RASA World v5: the ring of moments. Each photo is a card on a ring in 3D that turns with the scroll (and a little on its
// own). Cards are drawn at most ~300 px wide, well under the photos' 1000 px, so nothing is ever blown up; a click opens the
// photo big (page2.js's lightbox). The list comes from content.js (window.RASA_MOMENTS).
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sec = document.querySelector('.gal'), ring = document.querySelector('[data-gal]');
if (sec && ring && window.RASA_MOMENTS) {
  const list = window.RASA_MOMENTS;
  ring.innerHTML = list.map(m => `<figure class="gal-card"><img src="${m.src}" alt="${m.name}" loading="lazy" decoding="async"><figcaption>${m.name}</figcaption></figure>`).join('');
  const cards = [...ring.children], N = cards.length;
  let t = 0, last = performance.now();
  const tick = now => {
    const dt = Math.min(.1, (now - last) / 1000); last = now; t += reduced ? 0 : dt;
    const r = sec.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    const w = cards[0].offsetWidth, R = Math.max(w * N / (2 * Math.PI) * 1.18, innerWidth * .38);
    const turn = p * 300 + t * 3;
    ring.style.setProperty('--R', R.toFixed(0) + 'px');
    cards.forEach((c, i) => {
      const a = i / N * 360 + turn, rad = a * Math.PI / 180, front = Math.cos(rad);
      c.style.transform = `rotateY(${a.toFixed(2)}deg) translateZ(${R.toFixed(0)}px)`;
      c.style.opacity = (.25 + .75 * clamp((front + .35) / 1.1)).toFixed(3);
      c.style.zIndex = String(Math.round(front * 100) + 100);
      c.style.pointerEvents = front > .2 ? 'auto' : 'none';
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
