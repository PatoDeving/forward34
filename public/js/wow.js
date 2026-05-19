/*
 * Forward34 — Interacciones de la capa "Forward"
 */
(function () {
  'use strict';

  // Marcar JS disponible — las .reveal solo se ocultan con esta clase puesta.
  document.documentElement.classList.add('js');

  /* --------------------------------------------------------
   * Header scroll state
   * -------------------------------------------------------- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------------
   * Scroll progress bar
   * -------------------------------------------------------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const updateBar = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  /* --------------------------------------------------------
   * Reveal on scroll (.reveal)
   * -------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* --------------------------------------------------------
   * Rotator: cicla las palabras del data-words=""
   * -------------------------------------------------------- */
  document.querySelectorAll('.rotator').forEach((wrap) => {
    const words = (wrap.dataset.words || '').split('|').map((s) => s.trim()).filter(Boolean);
    if (!words.length) return;

    const track = document.createElement('span');
    track.className = 'rotator-track';
    // Repetir primera al final para loop sin salto
    [...words, words[0]].forEach((w) => {
      const span = document.createElement('span');
      span.textContent = w;
      track.appendChild(span);
    });
    wrap.innerHTML = '';
    wrap.appendChild(track);

    let intervalId = null;
    const start = () => {
      const h = track.firstElementChild.getBoundingClientRect().height;
      if (!h) return;
      wrap.style.height = h + 'px';
      track.style.transform = 'translateY(0)';
      let i = 0;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        i++;
        track.style.transform = `translateY(${-h * i}px)`;
        if (i === words.length) {
          setTimeout(() => {
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            void track.offsetHeight;
            track.style.transition = '';
            i = 0;
          }, 700);
        }
      }, 2400);
    };

    const init = () => requestAnimationFrame(start);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(init);
    } else {
      window.addEventListener('load', init, { once: true });
      init();
    }
    // re-medir en resize (sin reiniciar el ciclo)
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(start, 200);
    });
  });

  /* --------------------------------------------------------
   * Marquee: duplicar contenido para loop
   * -------------------------------------------------------- */
  document.querySelectorAll('.marquee-track').forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

  /* --------------------------------------------------------
   * Card spotlight (mouse-follow tinte)
   * -------------------------------------------------------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* --------------------------------------------------------
   * Hero spotlight
   * -------------------------------------------------------- */
  document.querySelectorAll('.hero').forEach((hero) => {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
      hero.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
    });
  });

  /* --------------------------------------------------------
   * Smooth anchor scroll
   * -------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* --------------------------------------------------------
   * Copy email on mailto click
   * -------------------------------------------------------- */
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          const t = document.createElement('div');
          t.textContent = `Email copiado · ${email}`;
          t.style.cssText =
            'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0B0B0F;color:#F4EFE6;padding:0.85rem 1.4rem;border-radius:999px;z-index:10000;font-size:0.88rem;font-weight:500;box-shadow:0 12px 30px -10px rgba(0,0,0,0.35);border:1px solid rgba(215,255,58,0.3);';
          document.body.appendChild(t);
          setTimeout(() => {
            t.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            t.style.opacity = '0';
            t.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => t.remove(), 400);
          }, 1800);
        });
      }
    });
  });
})();
