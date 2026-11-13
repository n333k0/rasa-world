// RASA World concept: the lists the page builds from (logos, moments, cases). Every image is RASA's own, loaded from
// rasaworld.com; each subject appears once on the page (Thrill City and Pier Play photos live in their universes).
(() => {
  const R = 'https://rasaworld.com';
  const LOGOS = [
    ['/assets/logo-01-DZCC9xT9.svg', 'Google'], ['/assets/logo-05-C6PciuE7.svg', 'Aston Martin'],
    ['/assets/logo-honeybirdette-D5xiYCtl.webp', 'Honey Birdette'], ['/assets/logo-playboy-BgjDph_v.webp', 'Playboy'],
    ['/assets/logo-pioneer-DaCm5N56.webp', 'Pioneer DJ'], ['/assets/logo-cocacola-4LufY7pb.webp', 'Coca-Cola'],
    ['/__l5e/assets-v1/542f8518-3b28-4a9a-9c49-eba0a5047ee5/logo-oakley.webp', 'Oakley'], ['/assets/logo-hornitos-CnqmGS2z.webp', 'Hornitos'],
    ['/assets/logo-haku-CojirZ36.webp', 'Haku Vodka'], ['/assets/logo-196-D3HaoAe0.webp', '-196 Vodka Seltzer'],
    ['/assets/logo-vitaminwater-C7W6XLjo.webp', 'Vitaminwater'], ['/assets/logo-six-CR2wz6Dq.webp', 'Six Flags'],
    ['/assets/logo-07-eBOm7Brk.webp', 'Partner'], ['/assets/logo-09-DDKYYC6E.svg', 'Partner'], ['/assets/logo-10-OrgLCHE_.svg', 'Partner'],
    ['/assets/logo-11-GUM3paBh.svg', 'Partner'], ['/assets/logo-alphatheta-BycpWPpi.webp', 'AlphaTheta'],
    ['/assets/logo-lafw-DM3Ie9aH.webp', 'LA Fashion Week'], ['/assets/logo-hawkemedia-white-C1XveWkB.webp', 'Hawke Media'],
    ['/assets/logo-bioderma-DCXUeg0X.webp', 'Bioderma'], ['/assets/logo-hlorenzo-box-BZl_FP8N.webp', 'H. Lorenzo'],
    ['/assets/logo-100thieves-BovwdfpI.svg', '100 Thieves'],
  ];
  // the wall of moments; `main` is the one that fills the screen first
  const MOMENTS = [
    ['/assets/gallery-1-CS34uoOq.webp', 'Candlelit Vibes'],
    ['/assets/gallery-2-BWx7be6z.webp', 'Goddess Hour'],
    ['/assets/gallery-3-DtZvYu6H.webp', 'Neon Nights'],
    ['/assets/gallery-4-BgxMr3gP.webp', 'Electric Soul'],
    ['/assets/gallery-lacc-BqGUZ9Zz.webp', 'LA Comic Con'],
    ['/assets/gallery-5-DGEtzWCb.webp', 'Future Vision'],
    ['/__l5e/assets-v1/3122c96b-074b-4156-9708-3e03bc4cc5cf/rasa-purple-stage.webp', 'RASA Main Stage', 'main'],
    ['/__l5e/assets-v1/92f360ab-ca24-40be-ae3e-4c767de8239d/pier-play-seahorse.webp', 'Pier Play Creatures'],
    ['/assets/gallery-6-BwHXiwlQ.webp', 'Stage Takeover'],
    ['/__l5e/assets-v1/049d8989-030d-4067-9c39-43d199b8ff82/rasa-red-lasers.webp', 'Laser Storm'],
    ['/assets/gallery-7-DFsBW9ve.webp', 'Festival Magic'],
    ['/assets/gallery-8-fIX-X96N.webp', 'Crowd Energy'],
    ['/assets/gallery-venue-C9Y8klu-.webp', 'Cathedral Vibes'],
  ];
  const CASES = [
    ['Santa Monica Pier, CA', 'Hawkefest 2026', 'A Renaissance takeover of the Santa Monica Pier', '/__l5e/assets-v1/eb0d7f7a-d5ab-4af2-aa88-7bb977730846/hawkefest-card.webp'],
    ['H. Lorenzo, Los Angeles', 'H. Lorenzo', 'Mowalola × Miss Sixty launch', '/__l5e/assets-v1/bcb95da5-9a0b-455c-b3c2-0acde9cf8035/hlorenzo-mowalola-cover.webp'],
    ['Mountain View', 'Google', 'Visitor Experience: Endless Summer Festival', '/assets/case-google--RZdNVEq.webp'],
    ['Los Angeles', 'Portalverse', "L.A. Comic Con's official closing", '/assets/case-portalverse-Bd66J1Ry.webp'],
    ['Miami', 'Delta', '80 years of service in Miami', '/__l5e/assets-v1/b7ca131a-774d-4bf6-88e0-feae76b0970a/delta-hero-collage.webp'],
    ['Los Angeles', 'Honey Birdette × Playboy', "'Club Honey'", '/assets/case-honeybirdette-Cv8kaL8w.webp'],
    ['Los Angeles, CA', 'Rivian', 'During Frieze Los Angeles', '/assets/case-rivian-CJPJIk3o.webp'],
    ['Los Angeles', 'Aston Martin Galpin', 'A private brand experience', '/assets/astonmartin-3-BaHCbhlY.webp'],
    ['Six Flags Magic Mountain', 'Thrill City', 'Roller coasters and music, two nights', null],
  ];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const track = document.querySelector('[data-logos]');
  if (track) for (let k = 0; k < 2; k++) {                    // two copies so the marquee loops without a seam
    const set = el('div', 'logos-set'); if (k) set.setAttribute('aria-hidden', 'true');
    LOGOS.forEach(([src, alt]) => { const i = el('img'); i.src = R + src; i.alt = k ? '' : alt; i.loading = 'lazy'; i.decoding = 'async'; set.append(i); });
    track.append(set);
  }

  // v3 onwards (owner, 2026-11-12: the zoomed photo must be sharp): the photo that fills the screen is RASA's one HD frame
  // (1920 px, Google's Endless Summer Festival); the main stage joins the wall and L.A. Comic Con leaves it (Portalverse
  // already shows it)
  if (document.documentElement.classList.contains('v3')) {
    const i = MOMENTS.findIndex(m => m[2] === 'main'); MOMENTS[i] = [MOMENTS[i][0], MOMENTS[i][1]];
    MOMENTS.splice(MOMENTS.findIndex(m => m[1] === 'LA Comic Con'), 1, ['/assets/stats-google-hd-t8VwnFEH.webp', 'Endless Summer Festival', 'main']);
  }
  window.RASA_MOMENTS = MOMENTS.map(([src, name]) => ({ src: R + src, name }));
  const grid = document.querySelector('[data-moments]');
  if (grid) MOMENTS.forEach(([src, name, main]) => {
    const f = el('figure', 'mo' + (main ? ' mo-main' : ''));
    f.innerHTML = `<img src="${R + src}" alt="${name}" loading="${main ? 'eager' : 'lazy'}" decoding="async"><figcaption>${name}</figcaption>`;
    grid.append(f);
  });

  const list = document.querySelector('[data-cases]');
  if (list) CASES.forEach(([where, who, what, img], n) => {
    const li = el('li', 'case');
    li.innerHTML = `<a href="#work"${img ? ` data-img="${R + img}"` : ''}><span class="c-n">${String(n + 1).padStart(2, '0')}</span><span class="c-where">${where}</span><span class="c-t"><b>${who}</b> <span>${what}</span></span>${img ? `<img class="c-thumb" src="${R + img}" alt="" loading="lazy" decoding="async">` : ''}<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg></a>`;
    list.append(li);
  });
})();
