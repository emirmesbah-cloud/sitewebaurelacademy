// Aurel Academy — main app (login, dashboard, admin)
(function() {
  'use strict';

  const API = '/api';
  const STORAGE_COUPON = 'aurel.coupon';
  const STORAGE_TIER = 'aurel.tier';
  const STORAGE_ADMIN = 'aurel.admin';

  const el = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  // --- Courses catalog ---
  const CATALOG = [
    {
      id: 'pflege',
      titleKey: 'course.pflege.title',
      descKey: 'course.pflege.desc',
      durationKey: 'course.pflege.duration',
      modulesKey: 'course.pflege.modules',
      icon: '🏥',
      totalModules: 10,
      url: '/pflege/',
      flag: 'POPULAR',
      available: true
    },
    {
      id: 'allemand',
      titleKey: 'course.allemand.title',
      descKey: 'course.allemand.desc',
      icon: '🇩🇪',
      totalModules: 0,
      flag: 'SOON',
      available: false
    },
    {
      id: 'ausbildung',
      titleKey: 'course.ausbildung.title',
      descKey: 'course.ausbildung.desc',
      icon: '🎓',
      totalModules: 0,
      flag: 'SOON',
      available: false
    }
  ];

  // --- Router ---
  function route() {
    const hash = location.hash.replace('#', '');
    const hasSession = !!localStorage.getItem(STORAGE_COUPON);

    if (hash === 'admin') {
      showView('adminView');
      initAdmin();
      return;
    }
    if (hasSession) {
      showView('dashboardView');
      initDashboard();
    } else {
      showView('loginView');
    }
  }

  function showView(id) {
    $$('.view').forEach(v => v.classList.add('hidden'));
    el(id).classList.remove('hidden');
    const logout = el('logoutBtn');
    if (logout) logout.classList.toggle('hidden', id !== 'dashboardView');
    $$('.nav-private').forEach(n => n.classList.toggle('hidden', id !== 'dashboardView'));
    $$('.nav-public').forEach(n => n.classList.toggle('hidden', id === 'dashboardView'));
  }

  // --- Login ---
  function initLogin() {
    const form = el('loginForm');
    const input = el('coupon');
    const errBox = el('loginError');
    const submit = el('loginSubmit');

    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/\s/g, '');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      const coupon = input.value.trim().toUpperCase();
      if (!coupon) return;

      submit.disabled = true;
      submit.innerHTML = '<span>...</span>';

      try {
        const res = await fetch(API + '/validate-coupon.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem(STORAGE_COUPON, coupon);
          localStorage.setItem(STORAGE_TIER, data.tier || (coupon.startsWith('AC-') ? 'AC' : 'AU'));
          location.hash = '';
          route();
        } else {
          const errKey = data.error === 'ip_mismatch' ? 'login.err.ip'
                        : data.error === 'invalid' ? 'login.err.invalid'
                        : 'login.err.server';
          errBox.textContent = window.AurelT(errKey);
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.textContent = window.AurelT('login.err.network');
        errBox.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.innerHTML = '<span>' + window.AurelT('login.submit') + '</span><span class="arrow">→</span>';
      }
    });
  }

  // --- Dashboard ---
  async function initDashboard() {
    const coupon = localStorage.getItem(STORAGE_COUPON);
    const tier = localStorage.getItem(STORAGE_TIER) || (coupon && coupon.startsWith('AC-') ? 'AC' : 'AU');
    const tierBadge = el('tierBadge');
    tierBadge.className = 'tier-badge ' + (tier === 'AC' ? 'tier-ac' : 'tier-au');
    tierBadge.textContent = tier === 'AC' ? 'ACCOMPAGNÉ' : 'AUTONOME';

    let progress = { courses: {} };
    try {
      const res = await fetch(API + '/load-progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon })
      });
      const data = await res.json();
      if (data.success) progress = data.progress;
    } catch (e) {}

    renderCourses(progress);
    renderStats(progress);
  }

  function renderCourses(progress) {
    const grid = el('coursesGrid');
    grid.innerHTML = '';
    const courses = progress.courses || {};

    CATALOG.forEach(c => {
      const cProgress = courses[c.id] || { completed: [], lastLesson: 0 };
      const done = (cProgress.completed || []).length;
      const pct = c.totalModules ? Math.round((done / c.totalModules) * 100) : 0;
      const started = done > 0;
      const completed = c.totalModules && done >= c.totalModules;

      const ctaKey = !c.available ? 'course.soon'
                    : completed ? 'course.completed'
                    : started ? 'course.continue'
                    : 'course.start';

      const card = document.createElement('div');
      card.className = 'course-card glass' + (c.available ? '' : ' locked');
      card.innerHTML = `
        <div class="course-cover">
          <span>${c.icon}</span>
          <div class="course-flag${c.flag === 'SOON' ? '' : ' new'}">${c.flag === 'SOON' ? (window.AurelT('course.soon')) : c.flag}</div>
        </div>
        <div class="course-body">
          <div class="course-title">${window.AurelT(c.titleKey)}</div>
          <div class="course-desc">${window.AurelT(c.descKey)}</div>
          ${c.available ? `
          <div class="course-meta">
            <span>${window.AurelT(c.durationKey)}</span>
            <span class="dot"></span>
            <span>${window.AurelT(c.modulesKey)}</span>
          </div>
          <div class="course-progress">
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="progress-label"><span>${done}/${c.totalModules}</span><span>${pct}%</span></div>
          </div>
          <div class="course-cta">
            <span>${window.AurelT(ctaKey)}</span>
            <span class="arrow">→</span>
          </div>` : `
          <div class="course-cta" style="color:var(--text-muted)">
            <span>${window.AurelT('course.soon')}</span>
          </div>`}
        </div>
      `;
      if (c.available && c.url) {
        card.addEventListener('click', () => { location.href = c.url; });
      }
      grid.appendChild(card);
    });
  }

  function renderStats(progress) {
    const courses = progress.courses || {};
    const availableCourses = CATALOG.filter(c => c.available).length;
    let totalDone = 0, totalModules = 0;
    CATALOG.forEach(c => {
      if (!c.available) return;
      totalModules += c.totalModules;
      const p = courses[c.id];
      if (p && Array.isArray(p.completed)) totalDone += p.completed.length;
    });
    const pct = totalModules ? Math.round((totalDone / totalModules) * 100) : 0;
    el('statCourses').textContent = availableCourses;
    el('statProgress').textContent = pct + '%';
  }

  // --- Logout ---
  function initLogout() {
    const btn = el('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_COUPON);
      localStorage.removeItem(STORAGE_TIER);
      location.hash = '';
      route();
    });
  }

  // --- Lang switch ---
  function initLang() {
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('aurel.lang', btn.dataset.lang);
        window.AurelApplyI18n();
        // re-render dashboard if visible
        if (!el('dashboardView').classList.contains('hidden')) initDashboard();
      });
    });
  }

  // --- Admin ---
  function initAdmin() {
    const loginBox = el('adminLogin');
    const panel = el('adminPanel');
    const hasAdmin = sessionStorage.getItem(STORAGE_ADMIN);

    if (hasAdmin) {
      loginBox.classList.add('hidden');
      panel.classList.remove('hidden');
      loadAdminData(hasAdmin);
      return;
    }
    loginBox.classList.remove('hidden');
    panel.classList.add('hidden');

    const form = el('adminLoginForm');
    const err = el('adminError');
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.classList.add('hidden');
      const pwd = el('adminPwd').value;
      try {
        const r = await fetch(API + '/admin.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        const data = await r.json();
        if (data.success) {
          sessionStorage.setItem(STORAGE_ADMIN, pwd);
          loginBox.classList.add('hidden');
          panel.classList.remove('hidden');
          renderAdmin(data);
          wireAdmin(pwd);
        } else {
          err.textContent = 'Mot de passe invalide.';
          err.classList.remove('hidden');
        }
      } catch {
        err.textContent = 'Erreur de connexion.';
        err.classList.remove('hidden');
      }
    };
  }

  async function loadAdminData(pwd) {
    try {
      const r = await fetch(API + '/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await r.json();
      if (data.success) {
        renderAdmin(data);
        wireAdmin(pwd);
      } else {
        sessionStorage.removeItem(STORAGE_ADMIN);
        initAdmin();
      }
    } catch {}
  }

  function renderAdmin(data) {
    const s = data.stats || {};
    el('aTotal').textContent = s.total || 0;
    el('aUsed').textContent = s.used || 0;
    el('aAvail').textContent = s.available || 0;
    el('aAvgProg').textContent = (s.avgProgress || 0) + '%';
    el('auTotal').textContent = s.auTotal || 0;
    el('auSold').textContent = s.auUsed || 0;
    el('acTotal').textContent = s.acTotal || 0;
    el('acSold').textContent = s.acUsed || 0;

    renderAdminTable(data.coupons || []);
    window.__adminCoupons = data.coupons || [];
  }

  function renderAdminTable(coupons) {
    const tb = el('adminTbody');
    tb.innerHTML = '';
    coupons.forEach(c => {
      const tr = document.createElement('tr');
      const tierClass = c.tier === 'AC' ? 'tier-ac' : 'tier-au';
      const statusClass = c.status === 'revoked' ? 'status-revoked'
                        : c.status === 'used' ? 'status-used' : 'status-available';
      const statusLabel = c.status === 'revoked' ? 'Révoqué'
                        : c.status === 'used' ? 'Utilisé' : 'Disponible';
      const activated = c.activated ? new Date(c.activated).toLocaleDateString('fr-FR') : '—';
      tr.innerHTML = `
        <td class="code">${c.code}</td>
        <td><span class="tier-badge ${tierClass}">${c.tier}</span></td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
        <td>${c.ip || '—'}</td>
        <td>${activated}</td>
        <td>${c.completed !== null && c.completed !== undefined ? c.completed : '—'}</td>
      `;
      tr.addEventListener('click', () => openCouponModal(c.code));
      tb.appendChild(tr);
    });
  }

  // --- Coupon detail modal ---
  let currentAdminPwd = null;

  async function openCouponModal(code) {
    const pwd = currentAdminPwd || sessionStorage.getItem(STORAGE_ADMIN);
    if (!pwd) return;
    try {
      const r = await fetch(API + '/coupon-detail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd, code })
      });
      const data = await r.json();
      if (!data.success) return;
      const c = data.coupon;
      const p = data.progress;

      el('modalCode').textContent = c.code;
      const tier = c.tier || (c.code.startsWith('AC-') ? 'AC' : 'AU');
      el('modalTierLine').textContent = tier === 'AC' ? 'Pack Accompagné' : 'Pack Autonome';
      const statusLabel = c.status === 'revoked' ? '🚫 Révoqué'
                        : c.status === 'used' ? '✓ Utilisé' : '○ Disponible';
      el('modalStatus').textContent = statusLabel;
      el('modalTier').textContent = tier;
      el('modalActivated').textContent = c.activated ? new Date(c.activated).toLocaleString('fr-FR') : '—';
      el('modalLast').textContent = c.lastActivity ? new Date(c.lastActivity).toLocaleString('fr-FR') : '—';
      el('modalIP').textContent = c.ip || '—';

      // Modules grid
      const mods = el('modalModules');
      mods.innerHTML = '';
      const completed = (p && p.courses && p.courses.pflege && p.courses.pflege.completed) || [];
      const MODS = [0,1,2,3,4,5,6,7,8,9];
      MODS.forEach(i => {
        const d = document.createElement('div');
        d.className = 'modal-mod' + (completed.includes(i) ? ' done' : '');
        d.textContent = completed.includes(i) ? '✓' : (i + 1);
        mods.appendChild(d);
      });
      el('modalProgCount').textContent = completed.length + '/10';

      // Show / hide revoke
      const revBtn = el('modalRevoke');
      revBtn.style.display = c.status === 'revoked' ? 'none' : '';
      revBtn.onclick = async () => {
        if (!confirm(`Révoquer définitivement le coupon ${c.code} ?\nL'étudiant ne pourra plus se connecter.`)) return;
        const rr = await fetch(API + '/revoke-coupon.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, code: c.code })
        });
        const rd = await rr.json();
        if (rd.success) {
          closeCouponModal();
          loadAdminData(pwd);
          loadLogs(pwd);
        } else {
          alert('Erreur : ' + (rd.error || 'inconnue'));
        }
      };

      el('couponModal').classList.add('open');
    } catch (e) {
      console.error(e);
    }
  }

  function closeCouponModal() {
    el('couponModal').classList.remove('open');
  }

  // --- Logs ---
  async function loadLogs(pwd) {
    try {
      const r = await fetch(API + '/logs.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await r.json();
      if (!data.success) return;
      renderLogs(data.logs || []);
    } catch {}
  }

  function renderLogs(logs) {
    const tb = el('logsTbody');
    tb.innerHTML = '';
    if (!logs.length) {
      tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">Aucun événement pour le moment</td></tr>';
      return;
    }
    const eventLabels = {
      login_success: { label: '✓ Connexion', cls: 'success' },
      login_activated: { label: '🎉 Activation', cls: 'success' },
      login_invalid: { label: '✗ Code invalide', cls: 'fail' },
      login_ip_mismatch: { label: '⚠ IP différente', cls: 'fail' },
      login_revoked: { label: '🚫 Code révoqué', cls: 'error' },
      admin_revoke: { label: '🗑 Révocation admin', cls: 'info' },
      admin_login: { label: '🔑 Admin connecté', cls: 'info' }
    };
    logs.forEach(l => {
      const tr = document.createElement('tr');
      const meta = eventLabels[l.event] || { label: l.event, cls: 'info' };
      const d = new Date(l.ts);
      const time = d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td style="white-space:nowrap;color:var(--text-muted)">${time}</td>
        <td><span class="log-event ${meta.cls}">${meta.label}</span></td>
        <td class="code">${l.code || '—'}</td>
        <td style="font-family:monospace;font-size:.78rem;color:var(--text-muted)">${l.ip || '—'}</td>
      `;
      tb.appendChild(tr);
    });
  }

  function wireAdmin(pwd) {
    currentAdminPwd = pwd;
    el('adminRefresh').onclick = () => { loadAdminData(pwd); loadLogs(pwd); };
    el('logsRefresh').onclick = () => loadLogs(pwd);
    el('modalClose').onclick = closeCouponModal;
    el('modalCancel').onclick = closeCouponModal;
    el('couponModal').addEventListener('click', (e) => {
      if (e.target.id === 'couponModal') closeCouponModal();
    });
    loadLogs(pwd);

    el('adminSearch').oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = (window.__adminCoupons || []).filter(c =>
        c.code.toLowerCase().includes(q) || (c.ip && c.ip.includes(q))
      );
      renderAdminTable(filtered);
    };

    el('exportCsv').onclick = () => {
      window.open(API + '/export-csv.php?password=' + encodeURIComponent(pwd), '_blank');
    };

    el('genBtn').onclick = async () => {
      const au = parseInt(el('genAU').value) || 0;
      const ac = parseInt(el('genAC').value) || 0;
      if (!au && !ac) return;
      const out = el('genOutput');
      out.classList.remove('hidden');
      out.textContent = 'Génération…';
      try {
        const r = await fetch(API + '/generate-coupons.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, countAU: au, countAC: ac })
        });
        const data = await r.json();
        if (data.success) {
          out.textContent = `✓ ${data.generated} coupons générés :\n\n` + data.codes.join('\n');
          loadAdminData(pwd);
        } else {
          out.textContent = '✗ Erreur : ' + (data.error || 'inconnue');
        }
      } catch (e) {
        out.textContent = '✗ Erreur réseau';
      }
    };
  }

  // --- Boot ---
  document.addEventListener('DOMContentLoaded', () => {
    window.AurelApplyI18n();
    initLang();
    initLogin();
    initLogout();
    route();
    window.addEventListener('hashchange', route);
  });
})();
