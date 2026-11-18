// RASA World inner pages (round 3, 2026-11-18): smooth scroll, the menu, reveals and the forms. No WebGL here.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement; root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }

  // the header is a pill from the start; on a phone it opens into the menu
  const header = $('.site-header'), burger = $('.burger-btn');
  const setMenu = open => {
    header.setAttribute('data-anim', ''); header.toggleAttribute('data-menu', open);
    open ? lenis?.stop() : lenis?.start(); root.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger?.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu')));
  addEventListener('keydown', e => e.key === 'Escape' && header.hasAttribute('data-menu') && setMenu(false));

  // sections fade up as they arrive
  const rv = $$('[data-rv]');
  if ('IntersectionObserver' in window && !reduced) {
    const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    rv.forEach(s => ob.observe(s));
  } else rv.forEach(s => s.classList.add('in'));

  // contact: the partnership question only shows for partnerships
  const topic = $('[data-form="contact"] select[name="topic"]');
  topic?.addEventListener('change', () => $$('[data-when]').forEach(f => f.classList.toggle('on', f.dataset.when === topic.value)));

  // forms: checked here, then thanked. Sending needs RASA's own inbox or CRM wired in (see docs/client-log.md).
  $$('form[data-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    f.querySelectorAll('[required]').forEach(i => { const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
    if (!ok) { f.querySelector('[aria-invalid="true"]')?.focus(); return; }
    f.classList.add('sent');
  }));
})();
