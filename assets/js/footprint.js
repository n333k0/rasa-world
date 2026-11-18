// The footprint map plays in (land, pins, lines, names) the first time it comes into view.
const sec = document.querySelector('.footprint');
if (sec) {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) sec.classList.add('in');
  else { const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { sec.classList.add('in'); ob.disconnect(); } }), { threshold: .25 }); ob.observe(sec); }
}
