// Aurel Academy — profile page
(function() {
  'use strict';
  const API = '/api';
  const el = (id) => document.getElementById(id);
  const coupon = localStorage.getItem('aurel.coupon');
  const tier = localStorage.getItem('aurel.tier') || (coupon && coupon.startsWith('AC-') ? 'AC' : 'AU');
  // TODO: set real Aurel WhatsApp support number
  const WHATSAPP_SUPPORT = 'https://wa.me/213555290826';

  if (!coupon) {
    location.href = '/';
    return;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  function fmtRelative(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    return fmtDate(iso).split(' à ')[0];
  }

  async function load() {
    // Set static stuff first
    el('profileCode').textContent = coupon;
    el('profileInitials').textContent = coupon.slice(0, 2);
    const tierEl = el('profileTier');
    tierEl.className = 'tier-badge ' + (tier === 'AC' ? 'tier-ac' : 'tier-au');
    tierEl.textContent = tier === 'AC' ? 'ACCOMPAGNÉ' : 'AUTONOME';
    el('waContact').href = WHATSAPP_SUPPORT + '?text=' + encodeURIComponent(`Salut, j'ai besoin d'aide avec mon code ${coupon}`);

    try {
      const r = await fetch(API + '/load-progress.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon })
      });
      const data = await r.json();
      if (!data.success) {
        localStorage.removeItem('aurel.coupon');
        location.href = '/';
        return;
      }
      const p = data.progress || {};

      // Load coupon meta (activated, ip) from profile endpoint if available — fallback: leave placeholders
      try {
        const r2 = await fetch(API + '/my-info.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon })
        });
        const info = await r2.json();
        if (info.success) {
          el('activatedDate').textContent = fmtDate(info.activated);
          el('lastActivity').textContent = fmtRelative(info.lastActivity);
          el('deviceIP').textContent = info.ip || '—';
        }
      } catch {}

      const pflege = (p.courses && p.courses.pflege) || { completed: [] };
      const done = (pflege.completed || []).length;
      el('modulesDone').textContent = done + ' / 10';
    } catch {}
  }

  el('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(coupon);
      el('copyBtn').textContent = '✓ Copié !';
      setTimeout(() => el('copyBtn').textContent = '📋 Copier le code', 1800);
    } catch {}
  });

  const doLogout = () => {
    localStorage.removeItem('aurel.coupon');
    localStorage.removeItem('aurel.tier');
    location.href = '/';
  };
  el('logoutBtn').addEventListener('click', doLogout);
  el('logoutBtn2').addEventListener('click', doLogout);

  load();
})();
