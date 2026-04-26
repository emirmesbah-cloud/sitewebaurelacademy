// Aurel Academy — scroll reveal + entrance animations
(function() {
  'use strict';
  if (typeof window === 'undefined') return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  function tagAndObserve() {
    const selectors = [
      '.landing-section .section-tag',
      '.landing-section .landing-h2',
      '.landing-course-card',
      '.landing-why-card',
      '.faq-item',
      '.landing-final h2',
      '.landing-final .landing-sub',
      '.landing-final .landing-hero-ctas',
      '.dash-header',
      '.courses-grid > *',
      '.aide-header',
      '.aide-search',
      '.aide-topic',
      '.aide-cat',
      '.aide-contact',
      '.profile-card',
      '.profile-info-card',
      '.profile-actions',
      '.profile-danger',
      '.bonus-section .bonus-header',
      '.bonus-grid > *',
      '.live-section .bonus-header',
      '.live-grid > *',
      '.community-card',
      '.module-header',
      '.video-shell',
      '.module-desc'
    ];

    const targets = document.querySelectorAll(selectors.join(','));
    if (!targets.length) return;

    targets.forEach((el, i) => {
      el.classList.add('reveal');
      const d = i % 4;
      if (d) el.classList.add('reveal-d' + d);
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => io.observe(el));
  }

  function makeBg(opts) {
    const wrap = document.createElement('div');
    wrap.className = 'au-bg';
    (opts.blobs || []).forEach(cls => {
      const b = document.createElement('div');
      b.className = 'au-blob ' + cls;
      wrap.appendChild(b);
    });
    if (opts.grid) {
      const g = document.createElement('div');
      g.className = 'au-grid';
      wrap.appendChild(g);
    }
    if (opts.aurora) {
      const a = document.createElement('div');
      a.className = 'au-aurora';
      wrap.appendChild(a);
    }
    if (opts.particles) {
      for (let i = 0; i < opts.particles; i++) {
        const p = document.createElement('div');
        p.className = 'au-particle';
        p.style.top = Math.random() * 100 + '%';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
        p.style.animationDuration = (3 + Math.random() * 4).toFixed(2) + 's';
        wrap.appendChild(p);
      }
    }
    return wrap;
  }

  function injectBackgrounds() {
    if (document.querySelector('.au-canvas')) return;
    const c = document.createElement('div');
    c.className = 'au-canvas';

    // Five drifting blobs scattered across viewport
    ['au-cb-1', 'au-cb-2', 'au-cb-3', 'au-cb-4', 'au-cb-5'].forEach((cls) => {
      const b = document.createElement('div');
      b.className = 'au-blob ' + cls;
      c.appendChild(b);
    });

    // Slowly rotating conic glow
    const conic = document.createElement('div');
    conic.className = 'au-conic';
    c.appendChild(conic);

    // Animated dot grid
    const g = document.createElement('div');
    g.className = 'au-grid';
    c.appendChild(g);

    // Aurora streak
    const a = document.createElement('div');
    a.className = 'au-aurora au-aurora-fixed';
    c.appendChild(a);

    // Twinkling particles — many, full viewport
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'au-particle';
      p.style.top = (Math.random() * 100).toFixed(2) + '%';
      p.style.left = (Math.random() * 100).toFixed(2) + '%';
      p.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
      p.style.animationDuration = (3 + Math.random() * 5).toFixed(2) + 's';
      const size = 2 + Math.random() * 4;
      p.style.width = p.style.height = size.toFixed(1) + 'px';
      c.appendChild(p);
    }

    // Mouse-follow soft glow (subtle parallax)
    const cursor = document.createElement('div');
    cursor.className = 'au-cursor-glow';
    c.appendChild(cursor);

    document.body.insertBefore(c, document.body.firstChild);

    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      cursor.style.transform = 'translate3d(' + (cx - 200) + 'px,' + (cy - 200) + 'px,0)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function init() {
    injectBackgrounds();
    tagAndObserve();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan when SPA view switches (login → dashboard, etc.)
  let lastView = null;
  setInterval(() => {
    const dash = document.getElementById('dashboardView');
    const v = dash && !dash.classList.contains('hidden') ? 'dash' : 'login';
    if (v !== lastView) { lastView = v; setTimeout(tagAndObserve, 50); }
  }, 600);
})();
