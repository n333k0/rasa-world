// RASA World forms (round 3, owner 2026-11-18: "for now they go to an email"): the event brief, contact and newsletter
// forms send to RASA's inbox through FormSubmit (formsubmit.co), a form-to-email service, so the site needs no server.
// The first submission sends an activation email to the inbox; one click there turns delivery on.
// To change the address, edit TO. To move to a CRM later, replace send() only.
(() => {
  const TO = 'team@rasa.world';
  const ENDPOINT = 'https://formsubmit.co/ajax/' + TO;
  const SUBJECT = {
    brief: d => `New event brief: ${d['Company / brand'] || d['Full name'] || 'website'}`,
    contact: d => `Website contact: ${d['Topic'] || 'general'}`,
    newsletter: d => `Newsletter opt-in: ${d['Email'] || ''}`,
  };

  // a readable label for each field: its visible label, else its name
  const label = f => (f.closest('label')?.querySelector('span')?.textContent || f.closest('label')?.textContent || f.placeholder || f.name || 'Field').trim().replace(/\s+/g, ' ');

  function collect(form) {
    const d = {};
    form.querySelectorAll('input, select, textarea').forEach(f => {
      if (!f.name && f.type !== 'email' || f.name === '_honey') return;
      if (f.type === 'checkbox') { if (f.checked) { const k = 'Services'; d[k] = d[k] ? d[k] + ', ' + f.value : f.value; } return; }
      if (f.closest('[data-when]') && !f.closest('[data-when]').classList.contains('on')) return;
      const v = f.tagName === 'SELECT' ? (f.value ? f.options[f.selectedIndex].text : '') : f.value.trim();
      if (!v) return;
      const k = f.name === 'topic' ? 'Topic' : f.type === 'email' ? 'Email' : label(f);
      d[k] = v;
    });
    return d;
  }

  async function send(kind, data) {
    const body = { ...data, _subject: SUBJECT[kind](data), _template: 'table', _captcha: 'false', 'Sent from': location.href };
    if (data.Email) body._replyto = data.Email;
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || String(j.success) !== 'true') throw new Error(j.message || 'send failed');
  }

  function valid(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.setAttribute('aria-invalid', String(bad)); if (bad) ok = false;
    });
    if (!ok) form.querySelector('[aria-invalid="true"]')?.focus();
    return ok;
  }

  document.querySelectorAll('form[data-form]').forEach(form => {
    const kind = form.dataset.form;
    // a field people never see; bots fill it and FormSubmit drops those
    const hp = document.createElement('input'); hp.type = 'text'; hp.name = '_honey'; hp.tabIndex = -1; hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true'); hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.append(hp);
    form.removeAttribute('onsubmit');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (hp.value || form.classList.contains('busy') || !valid(form)) return;
      const btn = form.querySelector('[type="submit"]'), was = btn?.innerHTML;
      form.classList.add('busy'); form.classList.remove('failed');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try { await send(kind, collect(form)); form.classList.add('sent'); form.reset(); }
      catch (err) {
        form.classList.add('failed');
        let msg = form.querySelector('.form-err');
        if (!msg) { msg = document.createElement('p'); msg.className = 'form-err'; msg.setAttribute('role', 'alert'); (btn?.parentElement === form ? btn : form.lastElementChild).after(msg); }
        msg.innerHTML = `That didn't go through. Please try again, or write to <a href="mailto:${TO}">${TO}</a>.`;
      } finally {
        form.classList.remove('busy'); if (btn) { btn.disabled = false; btn.innerHTML = was; }
      }
    });
  });
})();
