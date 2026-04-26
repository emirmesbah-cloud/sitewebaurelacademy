// js/lead-form.js — 9-field qualified lead capture → WhatsApp redirect
(() => {
  const WA_NUMBER = '213555290826';
  const form = document.getElementById('lead-form');
  if (!form) return;

  const PHONE_REGEX = /^(\+213|0)[567]\d{8}$/;

  const fields = {
    prenom:     { el: form.querySelector('[name="prenom"]'),     required: true,  label: 'Prénom' },
    nom:        { el: form.querySelector('[name="nom"]'),        required: true,  label: 'Nom' },
    phone:      { el: form.querySelector('[name="phone"]'),      required: true,  label: 'Numéro WhatsApp',
                  validate: (v) => PHONE_REGEX.test(v.replace(/\s|-|\./g, '')) ? null : 'Format invalide (ex : +213 555 12 34 56)' },
    age:        { el: form.querySelector('[name="age"]'),        required: true,  label: 'Âge' },
    profession: { el: form.querySelector('[name="profession"]'), required: true,  label: 'Profession' },
    niveau:     { el: form.querySelector('[name="niveau"]'),     required: true,  label: 'Niveau d\'allemand' },
    objectif:   { el: form.querySelector('[name="objectif"]'),   required: true,  label: 'Objectif' },
    interet:    { el: form.querySelector('[name="interet"]'),    required: true,  label: 'Intérêt' },
    message:    { el: form.querySelector('[name="message"]'),    required: false, label: 'Message' },
  };

  const setError = (name, msg) => {
    const f = fields[name];
    if (!f) return;
    const err = form.querySelector(`.field-error[data-for="${name}"]`);
    if (msg) {
      f.el.classList.add('is-invalid');
      f.el.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.classList.add('is-visible'); }
    } else {
      f.el.classList.remove('is-invalid');
      f.el.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.classList.remove('is-visible'); }
    }
  };

  Object.keys(fields).forEach((name) => {
    const f = fields[name];
    if (!f.el) return;
    f.el.addEventListener('input',  () => setError(name, null));
    f.el.addEventListener('change', () => setError(name, null));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const values = {};
    let firstInvalid = null;

    for (const name of Object.keys(fields)) {
      const f = fields[name];
      if (!f.el) continue;
      const raw = (f.el.value || '').trim();
      values[name] = raw;

      if (f.required && !raw) {
        setError(name, 'Ce champ est requis');
        if (!firstInvalid) firstInvalid = f.el;
        continue;
      }
      if (f.validate && raw) {
        const err = f.validate(raw);
        if (err) {
          setError(name, err);
          if (!firstInvalid) firstInvalid = f.el;
          continue;
        }
      }
      setError(name, null);
    }

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const messageLines = [
      'Bonjour Aurel Academy !',
      '',
      `Je suis ${values.prenom} ${values.nom}, ${values.age}.`,
      `Profession : ${values.profession}`,
      `Niveau d'allemand : ${values.niveau}`,
      `Objectif : ${values.objectif}`,
      `Intérêt : ${values.interet}`,
    ];
    if (values.message) {
      messageLines.push('', values.message);
    }
    messageLines.push('', 'Merci de me rappeler sur WhatsApp.');

    const waMessage = messageLines.join('\n');
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;
    window.location.href = url;
  });
})();
