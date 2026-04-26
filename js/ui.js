// js/ui.js — behaviors not covered by the core snippets:
// header scroll state, burger menu, lang switcher, testimonials carousel, FAQ accordion.

/* ── Safety: reveal hero CTAs if GSAP stagger stalls ── */
(() => {
  setTimeout(() => {
    document.querySelectorAll('.hero-ctas > *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.9) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }, 2500);
})();

/* ── Header scroll state ────────────────────── */
(() => {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ── Mobile burger menu ─────────────────────── */
(() => {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  if (!burger || !menu) return;
  const close = () => {
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  const open = () => {
    burger.classList.add('is-open');
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  };
  burger.addEventListener('click', () => {
    burger.classList.contains('is-open') ? close() : open();
  });
  menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ── Language switcher (UI-only) ────────────── */
(() => {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      const lang = b.dataset.lang;
      document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    });
  });
})();

/* ── Testimonials carousel ──────────────────── */
(() => {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('.testimonial');
  const dots = carousel.querySelectorAll('.carousel-dot');
  if (!slides.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = 0;
  let timer;
  const DURATION = 5000;

  const go = (n) => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
  };
  const start = () => { stop(); timer = setInterval(() => go(idx + 1), DURATION); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  go(0);
  if (!reduced) start();

  dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.idx)); start(); }));
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', () => { if (!reduced) start(); });
})();

/* ── FAQ accordion (one open at a time) ─────── */
(() => {
  const items = document.querySelectorAll('#faq-list .faq-item');
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) items.forEach((o) => { if (o !== item) o.open = false; });
    });
  });
})();
