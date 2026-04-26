// Aurel Academy — Pflege course page
(function() {
  'use strict';
  const API = '/api';
  const COURSE_ID = 'pflege';

  // --- 10 modules spec ---
  const MODULES = [
    { id: 0, num: '0', title: 'Introduction', duration: '8 min', videoId: '',
      desc: '<p>Bienvenue dans <strong>Deutsch für Pflegekräfte</strong>. Ce module d\'introduction te présente ton parcours et ce que tu vas apprendre dans les 10 modules.</p><h3>Ce que tu vas apprendre</h3><ul><li>Vocabulaire médical essentiel en allemand</li><li>Communication avec patients et équipe soignante</li><li>Documentation Pflege (Pflegedokumentation)</li><li>Préparation entretien + reconnaissance de diplôme</li></ul>' },
    { id: 1, num: 'A', title: 'La réalité du secteur Pflege en Allemagne', duration: '25-30 min', videoId: '',
      desc: '<p>Avant d\'apprendre la langue, comprends le terrain : conditions de travail réelles, salaires, types d\'établissements, pénurie, ce qu\'on attend de toi en tant que soignant étranger.</p>' },
    { id: 2, num: '1', title: 'Vocabulaire Médical Essentiel', duration: '20 min', videoId: '',
      desc: '<p>150 termes médicaux et du quotidien soignant, organisés par thème : corps, symptômes, médicaments, gestes de soin, matériel.</p><p><em>🎁 Bonus audio prononciation débloqué à la fin de ce module.</em></p>' },
    { id: 3, num: '2', title: 'Communication avec les Patients', duration: '15 min', videoId: '',
      desc: '<p>Phrases clés pour rassurer, expliquer, prendre des nouvelles — en tenant compte des patients âgés, malentendants ou confus.</p>' },
    { id: 4, num: '3', title: 'Communication avec l\'Équipe', duration: '15 min', videoId: '',
      desc: '<p>Vocabulaire et formulations pour les transmissions, les briefings, les urgences. Comment parler à une infirmière diplômée, au médecin, à l\'aide-soignante.</p>' },
    { id: 5, num: 'D', title: 'Documentation Pflegedokumentation', duration: '25-30 min', videoId: '',
      desc: '<p>La Pflegedokumentation est <strong>obligatoire et juridiquement engageante</strong>. On voit la structure, le vocabulaire spécifique, les abréviations courantes, et on remplit un exemple ensemble.</p>' },
    { id: 6, num: '4', title: 'Entretien Recruteur Pflegeheim', duration: '20 min', videoId: '',
      desc: '<p>Les 20 questions qu\'on te posera en entretien téléphonique, avec des réponses modèles à adapter à ton profil.</p><p><em>🎁 Liste des Pflegeheim qui recrutent débloquée à la fin.</em></p>' },
    { id: 7, num: 'C', title: 'Simulation entretien étendue', duration: '40-50 min', videoId: '',
      desc: '<p>Simulation complète de 45 min : questions pièges, gestion du stress, négociation salaire, questions sur l\'Anerkennung. Tu peux t\'enregistrer et te réécouter.</p>' },
    { id: 8, num: 'B', title: 'Anerkennung — reconnaissance de diplôme', duration: '40-50 min', videoId: '',
      desc: '<p>Le parcours complet pour faire reconnaître ton diplôme : organismes par Land, documents à traduire, délais, coûts, Anpassungslehrgang vs Kenntnisprüfung.</p><p><em>🎁 Guide PDF Anerkennung débloqué à la fin.</em></p>' },
    { id: 9, num: '5', title: 'Conclusion & Prochaines Étapes', duration: '5 min', videoId: '',
      desc: '<p>Récap de la formation, tes prochaines étapes concrètes (inscription au Goethe, candidatures, dossier Anerkennung), et comment me contacter si tu bloques.</p><p><em>🎁 Templates CV + Anschreiben débloqués ici.</em></p>' }
  ];

  const BONUS = [
    { id: 'audio150', icon: '🎧', title: 'Audios prononciation', desc: '150 termes médicaux prononcés lentement + vite, MP3 bundle.', unlockAfter: 2, file: '/assets/bonus/pflege-audio-150.zip' },
    { id: 'heim50', icon: '🏥', title: '50 Pflegeheim qui recrutent', desc: 'PDF liste des établissements avec contacts recrutement, à jour.', unlockAfter: 6, file: '/assets/bonus/pflege-50-heim.pdf' },
    { id: 'cv', icon: '📄', title: 'Templates CV + Anschreiben', desc: 'Modèles prêts à l\'emploi (Word + PDF) spécifiques Pflege.', unlockAfter: 9, file: '/assets/bonus/pflege-cv-anschreiben.zip' },
    { id: 'anerkennung', icon: '📘', title: 'Guide Anerkennung', desc: 'PDF 15-20 pages : processus complet, organismes par Land, documents.', unlockAfter: 8, file: '/assets/bonus/pflege-anerkennung-guide.pdf' }
  ];

  const LIVES = [
    { date: '15 Mai', title: 'Live 1 : Kick-off & présentation', replay: '#' },
    { date: '22 Mai', title: 'Live 2 : Vocabulaire médical approfondi', replay: '#' },
    { date: '29 Mai', title: 'Live 3 : Simulation entretien en direct', replay: '#' },
    { date: '05 Juin', title: 'Live 4 : Pflegedokumentation atelier', replay: '#' },
    { date: '12 Juin', title: 'Live 5 : Anerkennung — session Q&R', replay: '#' },
    { date: '19 Juin', title: 'Live 6 : Négociation salaire & contrat', replay: '#' },
    { date: '26 Juin', title: 'Live 7 : Installation en Allemagne', replay: '#' },
    { date: '03 Juillet', title: 'Live 8 : Coaching final & bilan', replay: '#' }
  ];

  const WHATSAPP_GROUP = '#'; // TODO: placeholder — remplacer par vrai lien

  const el = (id) => document.getElementById(id);
  const coupon = localStorage.getItem('aurel.coupon');
  const tier = localStorage.getItem('aurel.tier') || (coupon && coupon.startsWith('AC-') ? 'AC' : 'AU');
  let progress = { completed: [], lastLesson: 0, timestamps: {} };
  let currentIdx = 0;
  let vdoPlayer = null;

  if (!coupon) {
    location.href = '/';
    return;
  }

  async function boot() {
    try {
      const r = await fetch(API + '/load-progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon })
      });
      const data = await r.json();
      if (!data.success) {
        localStorage.removeItem('aurel.coupon');
        location.href = '/';
        return;
      }
      const courses = data.progress.courses || {};
      if (courses[COURSE_ID]) progress = { ...progress, ...courses[COURSE_ID] };
      currentIdx = Math.min(progress.lastLesson || 0, MODULES.length - 1);
    } catch {
      // Offline — use local defaults
    }

    renderSidebar();
    renderModule(currentIdx);
    renderBonus();
    renderLiveCommunity();
    el('authGate').classList.add('hidden');
    el('courseLayout').classList.remove('hidden');
  }

  function renderSidebar() {
    const list = el('modulesList');
    list.innerHTML = '';
    MODULES.forEach((m, i) => {
      const done = (progress.completed || []).includes(m.id);
      const li = document.createElement('li');
      li.className = 'module-item' + (done ? ' done' : '') + (i === currentIdx ? ' active' : '');
      li.innerHTML = `
        <div class="module-item-num">${done ? '✓' : m.num}</div>
        <div class="module-item-body">
          <div class="module-item-title">${m.title}</div>
          <div class="module-item-meta">${m.duration}</div>
        </div>
      `;
      li.addEventListener('click', () => {
        selectModule(i);
        closeSidebar();
      });
      list.appendChild(li);
    });

    const completed = (progress.completed || []).length;
    el('courseProgressText').textContent = completed + '/' + MODULES.length + ' modules';
    el('courseProgressFill').style.width = Math.round((completed / MODULES.length) * 100) + '%';
  }

  function renderModule(idx) {
    const m = MODULES[idx];
    if (!m) return;
    el('moduleBadge').textContent = m.num;
    el('moduleEyebrow').textContent = 'Module ' + m.num;
    el('moduleTitle').textContent = m.title;
    el('moduleDuration').textContent = m.duration;
    el('moduleDesc').innerHTML = m.desc;
    el('prevBtn').disabled = idx === 0;
    el('nextBtn').disabled = idx === MODULES.length - 1;

    const done = (progress.completed || []).includes(m.id);
    const btn = el('completeBtn');
    btn.classList.toggle('done', done);
    el('completeLabel').textContent = done ? 'Terminé' : 'Marquer comme terminé';

    loadVideo(m.videoId);
    document.title = `Module ${m.num} · ${m.title} — Pflege`;
  }

  async function loadVideo(videoId) {
    const frame = el('videoFrame');
    if (!videoId) {
      frame.innerHTML = `
        <div class="video-placeholder">
          <div class="vph-icon">▶</div>
          <div class="vph-text">Vidéo à brancher</div>
          <div class="vph-hint">L'ID VDOCipher sera ajouté à la livraison</div>
        </div>`;
      return;
    }
    frame.innerHTML = '<div class="video-placeholder"><div class="vph-icon">⏳</div><div class="vph-text">Chargement…</div></div>';
    try {
      const r = await fetch(API + '/video.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon, videoId })
      });
      const data = await r.json();
      if (data.otp && data.playbackInfo) {
        frame.innerHTML = `<iframe src="https://player.vdocipher.com/v2/?otp=${encodeURIComponent(data.otp)}&playbackInfo=${encodeURIComponent(data.playbackInfo)}" allowfullscreen allow="encrypted-media"></iframe>`;
      } else {
        frame.innerHTML = `<div class="video-placeholder"><div class="vph-icon">⚠️</div><div class="vph-text">Vidéo indisponible</div><div class="vph-hint">${data.error || 'Contacte le support'}</div></div>`;
      }
    } catch {
      frame.innerHTML = `<div class="video-placeholder"><div class="vph-icon">⚠️</div><div class="vph-text">Problème réseau</div></div>`;
    }
  }

  async function saveProgress() {
    try {
      await fetch(API + '/save-progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon,
          courseId: COURSE_ID,
          completed: progress.completed,
          lastLesson: currentIdx,
          timestamps: progress.timestamps || {}
        })
      });
    } catch {}
  }

  function selectModule(i) {
    if (i < 0 || i >= MODULES.length) return;
    currentIdx = i;
    progress.lastLesson = i;
    renderSidebar();
    renderModule(i);
    renderBonus();
    saveProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleComplete() {
    const m = MODULES[currentIdx];
    if (!m) return;
    progress.completed = progress.completed || [];
    const idx = progress.completed.indexOf(m.id);
    if (idx >= 0) progress.completed.splice(idx, 1);
    else {
      progress.completed.push(m.id);
      progress.timestamps = progress.timestamps || {};
      progress.timestamps[m.id] = new Date().toISOString();
    }
    renderSidebar();
    renderModule(currentIdx);
    renderBonus();
    saveProgress();
  }

  function renderBonus() {
    const grid = el('bonusGrid');
    grid.innerHTML = '';
    BONUS.forEach(b => {
      const unlocked = (progress.completed || []).includes(b.unlockAfter);
      const card = document.createElement('div');
      card.className = 'bonus-card glass' + (unlocked ? '' : ' locked');
      const unlockText = unlocked ? '✓ Débloqué' : `🔒 Termine le module ${MODULES[b.unlockAfter]?.num || '?'}`;
      const unlockClass = unlocked ? 'bonus-unlock-note unlocked' : 'bonus-unlock-note';
      card.innerHTML = `
        ${unlocked ? '' : '<div class="lock-overlay">🔒</div>'}
        <div class="bonus-icon">${b.icon}</div>
        <h4>${b.title}</h4>
        <p>${b.desc}</p>
        <span class="${unlockClass}">${unlockText}</span>
        <a class="bonus-cta" ${unlocked ? `href="${b.file}" download` : 'href="#"'}>
          <span>${unlocked ? 'Télécharger' : 'Verrouillé'}</span>
          <span class="arrow">${unlocked ? '↓' : ''}</span>
        </a>
      `;
      grid.appendChild(card);
    });
  }

  function renderLiveCommunity() {
    if (tier !== 'AC') return;
    el('liveSection').classList.remove('hidden');
    el('communitySection').classList.remove('hidden');

    const liveGrid = el('liveGrid');
    liveGrid.innerHTML = '';
    LIVES.forEach((l, i) => {
      const [day, ...monthParts] = l.date.split(' ');
      const month = monthParts.join(' ');
      const isPast = i < 2; // Demo: first 2 have replays
      const card = document.createElement('div');
      card.className = 'live-card glass';
      card.innerHTML = `
        <div class="live-date">
          <div class="live-day">${day}</div>
          <div class="live-month">${month}</div>
        </div>
        <div class="live-info">
          <div class="live-title">${l.title}</div>
          <div class="live-meta">${isPast ? '📺 Replay disponible' : '🗓️ Live à venir'}</div>
        </div>
        <div class="live-action">
          <a href="${l.replay}" class="btn ${isPast ? 'btn-primary' : 'btn-outline'} btn-sm">${isPast ? 'Voir le replay' : 'Ajouter au calendrier'}</a>
        </div>
      `;
      liveGrid.appendChild(card);
    });

    el('communityLink').href = WHATSAPP_GROUP;
  }

  function closeSidebar() {
    document.querySelector('.course-sidebar').classList.remove('open');
  }

  // Events
  document.addEventListener('DOMContentLoaded', () => {
    window.AurelApplyI18n && window.AurelApplyI18n();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('aurel.lang', btn.dataset.lang);
        window.AurelApplyI18n && window.AurelApplyI18n();
      });
    });

    el('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('aurel.coupon');
      localStorage.removeItem('aurel.tier');
      location.href = '/';
    });

    el('prevBtn').addEventListener('click', () => selectModule(currentIdx - 1));
    el('nextBtn').addEventListener('click', () => selectModule(currentIdx + 1));
    el('completeBtn').addEventListener('click', toggleComplete);
    el('sidebarToggle').addEventListener('click', () => {
      document.querySelector('.course-sidebar').classList.toggle('open');
    });

    boot();
  });
})();
