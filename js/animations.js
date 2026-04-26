// js/animations.js — regular script (NOT module). Bulletproof.
// Stats counter runs always, GSAP is loaded async only on desktop.
(function () {
  'use strict';

  var isMobile = window.matchMedia('(max-width: 767px)').matches;
  var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // STATS COUNTER — runs in EVERY browser, mobile + desktop.
  // Triple-redundant trigger: IntersectionObserver + initial check + 3s fallback.
  // ============================================================
  function initStats() {
    var stats = document.querySelectorAll('.stats .stat strong[data-count]');
    if (!stats.length) return;

    stats.forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      if (!isFinite(target)) { el.textContent = '0' + suffix; return; }

      // Reduced-motion: snap directly to final value, no animation.
      if (reduced) { el.textContent = Math.round(target) + suffix; return; }

      var started = false;
      function run() {
        if (started) return;
        started = true;
        var duration = 1400;
        var t0 = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - t0) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      // Trigger 1: already visible at script load? Animate now.
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        run();
        return;
      }

      // Trigger 2: IntersectionObserver — fires when scrolled into view.
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              run();
              io.disconnect();
              break;
            }
          }
        }, { threshold: 0.1 });
        io.observe(el);
      }

      // Trigger 3: hard fallback. After 6s, force the final value (no animation).
      // Guards against any IO failure / weird browser state.
      setTimeout(function () {
        if (!started) { el.textContent = Math.round(target) + suffix; }
      }, 6000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStats);
  } else {
    initStats();
  }

  // ============================================================
  // REVEAL FALLBACK — make sure .reveal elements are visible on
  // mobile / reduced-motion (where GSAP is skipped).
  // ============================================================
  if (isMobile || reduced) {
    var revealEls = document.querySelectorAll('.reveal');
    for (var i = 0; i < revealEls.length; i++) {
      revealEls[i].style.opacity = '1';
      revealEls[i].style.transform = 'none';
    }
    return; // No GSAP on mobile / reduced-motion.
  }

  // ============================================================
  // GSAP (desktop only). Loaded dynamically. Wrapped so any
  // failure can never break the page.
  // ============================================================
  (async function () {
    try {
      var gsapMod = await import('https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm');
      var stMod   = await import('https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm');
      var gsap = gsapMod.default || gsapMod.gsap;
      var ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      gsap.timeline()
        .from('.hero-badge', { opacity: 0, y: 20, duration: 0.6 })
        .from('.hero-title', { opacity: 0, y: 40, duration: 0.8 }, '-=0.3')
        .from('.hero-desc',  { opacity: 0, y: 20, duration: 0.6 }, '-=0.5')
        .from('.hero-ctas > *', { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 }, '-=0.3')
        .from('.hero-social', { opacity: 0, duration: 0.6 }, '-=0.2');

      gsap.utils.toArray('.fade-up').forEach(function (el) {
        gsap.from(el, {
          opacity: 0, y: 50, duration: 0.8,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
      });

      gsap.utils.toArray('.cards-stagger').forEach(function (container) {
        var cards = container.querySelectorAll('.card');
        gsap.from(cards, {
          opacity: 0, y: 60, duration: 0.7, stagger: 0.15,
          scrollTrigger: { trigger: container, start: 'top 80%', once: true }
        });
      });

      var featuresGrid = document.querySelector('.features');
      if (featuresGrid) {
        var featureEls = featuresGrid.querySelectorAll('.feature');
        gsap.set(featureEls, { opacity: 0, y: 40 });
        gsap.to(featureEls, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: featuresGrid, start: 'top 82%', once: true }
        });
      }

      // Hero visual (2D dashboard mockup)
      var hv = document.getElementById('hero-visual');
      if (hv) {
        var mockup = hv.querySelector('.hv-mockup');
        var cards  = Array.prototype.slice.call(hv.querySelectorAll('.hv-card'));
        var blush  = hv.querySelector('.hv-blush');
        var shapes = Array.prototype.slice.call(hv.querySelectorAll('.hv-shape'));
        var dots   = hv.querySelector('.hv-dots');

        var cardFrom = [
          { x: -30, y:   0 },
          { x:   0, y: -30 },
          { x:   0, y:  30 },
          { x:  30, y:   0 },
        ];

        if (mockup) gsap.set(mockup, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' });
        if (blush)  gsap.set(blush,  { opacity: 0 });
        if (dots)   gsap.set(dots,   { opacity: 0 });
        cards.forEach(function (c, i) {
          var from = cardFrom[i] || { x: 0, y: 20 };
          gsap.set(c, { opacity: 0, x: from.x, y: from.y });
        });
        shapes.forEach(function (s) {
          gsap.set(s, { opacity: 0, rotation: -15, transformOrigin: '50% 50%' });
        });

        var tl = gsap.timeline({ delay: 0.3, onComplete: function () { startLoops(); } });
        if (blush)  tl.to(blush,  { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0);
        if (dots)   tl.to(dots,   { opacity: 0.4, duration: 1.0, ease: 'power1.out' }, 0.1);
        if (mockup) tl.to(mockup, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.1);
        shapes.forEach(function (s, i) {
          tl.to(s, { opacity: 0.6, rotation: 0, duration: 0.8, ease: 'power2.out' }, 0.2 + i * 0.1);
        });
        cards.forEach(function (c, i) {
          tl.to(c, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: 'power3.out' }, 0.5 + i * 0.15);
        });

        function startLoops() {
          cards.forEach(function (c, i) {
            gsap.to(c, {
              y: '+=8',
              duration: 3 + i * 0.5,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
              delay: i * 0.4,
            });
          });
          shapes.forEach(function (s, i) {
            gsap.to(s, {
              rotation: i % 2 === 0 ? 360 : -360,
              duration: 20 + i * 6,
              ease: 'none',
              repeat: -1,
            });
          });
          if (blush) {
            gsap.to(blush, {
              rotation: 360,
              duration: 60,
              ease: 'none',
              repeat: -1,
              transformOrigin: '50% 50%',
            });
          }
        }
      }
    } catch (err) {
      console.warn('[aurel] GSAP failed to load — animations skipped, page still functional.', err);
    }
  })();
})();
