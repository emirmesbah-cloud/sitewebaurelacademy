// Aurel Academy — landing live gratuit
// Flow: form submit → Google Apps Script → redirect to /merci/ → auto-redirect to WhatsApp group

(function() {
  'use strict';

  // ========== CONFIG ==========

  // URL Google Apps Script déployé en Web App (placeholder — voir README "Apps Script setup")
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

  // Lien d'invitation du groupe WhatsApp privé (placeholder)
  const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/PLACEHOLDER';

  // ============================

  // Store WhatsApp URL for the thank-you page to pick up
  try {
    sessionStorage.setItem('aurel.wb.groupUrl', WHATSAPP_GROUP_URL);
  } catch {}

  // 58 wilayas algériennes
  const WILAYAS = [
    '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna','06 - Béjaïa','07 - Biskra','08 - Béchar',
    '09 - Blida','10 - Bouira','11 - Tamanrasset','12 - Tébessa','13 - Tlemcen','14 - Tiaret','15 - Tizi Ouzou','16 - Alger',
    '17 - Djelfa','18 - Jijel','19 - Sétif','20 - Saïda','21 - Skikda','22 - Sidi Bel Abbès','23 - Annaba','24 - Guelma',
    '25 - Constantine','26 - Médéa','27 - Mostaganem','28 - M\'Sila','29 - Mascara','30 - Ouargla','31 - Oran','32 - El Bayadh',
    '33 - Illizi','34 - Bordj Bou Arreridj','35 - Boumerdès','36 - El Tarf','37 - Tindouf','38 - Tissemsilt','39 - El Oued',
    '40 - Khenchela','41 - Souk Ahras','42 - Tipaza','43 - Mila','44 - Aïn Defla','45 - Naâma','46 - Aïn Témouchent',
    '47 - Ghardaïa','48 - Relizane','49 - Timimoun','50 - Bordj Badji Mokhtar','51 - Ouled Djellal','52 - Béni Abbès',
    '53 - In Salah','54 - In Guezzam','55 - Touggourt','56 - Djanet','57 - El M\'Ghair','58 - El Meniaa'
  ];

  const el = (id) => document.getElementById(id);

  function trackEvent(name, params) {
    try {
      if (typeof fbq !== 'undefined') fbq('track', name, params);
      if (typeof gtag !== 'undefined') gtag('event', name, params);
    } catch {}
  }

  function isValidAlgerianPhone(raw) {
    const clean = raw.replace(/\D/g, '');
    if (/^0[567]\d{8}$/.test(clean)) return true;
    if (/^213[567]\d{8}$/.test(clean)) return true;
    return false;
  }

  function normalizePhone(raw) {
    const clean = raw.replace(/\D/g, '');
    if (clean.startsWith('213')) return '+' + clean;
    if (clean.startsWith('0')) return '+213' + clean.slice(1);
    return '+' + clean;
  }

  async function submitLead(data) {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn('Apps Script post failed', err);
    }

    try {
      const leads = JSON.parse(localStorage.getItem('aurel.webinar.leads') || '[]');
      leads.push({ ...data, ts: new Date().toISOString() });
      localStorage.setItem('aurel.webinar.leads', JSON.stringify(leads.slice(-50)));
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Populate wilaya dropdown
    const wilayaSelect = el('wbWilaya');
    if (wilayaSelect) {
      WILAYAS.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        wilayaSelect.appendChild(opt);
      });
    }

    const form = el('wbForm');
    const submit = el('wbSubmit');
    const submitLabel = el('wbSubmitLabel');
    const phoneInput = el('wbPhone');
    const phoneError = el('phoneError');

    phoneInput.addEventListener('input', () => phoneError.classList.add('hidden'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstname = el('wbFirstname').value.trim();
      const phoneRaw = phoneInput.value.trim();
      const wilaya = el('wbWilaya').value;
      const german = el('wbGerman').value;
      const profile = el('wbProfile').value;

      if (!firstname || !phoneRaw || !wilaya || !german || !profile) return;

      if (!isValidAlgerianPhone(phoneRaw)) {
        phoneError.classList.remove('hidden');
        phoneInput.focus();
        return;
      }

      submit.disabled = true;
      submitLabel.textContent = 'Enregistrement…';

      const data = {
        firstname,
        phone: normalizePhone(phoneRaw),
        wilaya,
        german_level: german,
        health_profile: profile,
        source: 'pflege-webinar-landing',
        landing_url: location.href,
        referrer: document.referrer || 'direct',
        user_agent: navigator.userAgent.substring(0, 150),
        submitted_at: new Date().toISOString()
      };

      await submitLead(data);

      trackEvent('Lead', { content_name: 'pflege-live' });
      trackEvent('CompleteRegistration', { content_name: 'pflege-live' });

      // Redirect to thank-you page (which will auto-forward to WhatsApp group after 1s)
      location.href = '/pflege/webinar/merci/';
    });
  });
})();
