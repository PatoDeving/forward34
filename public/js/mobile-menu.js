(function () {
    'use strict';

    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-overlay');
    if (!toggle || !menu || !overlay) return;

    function open() {
        toggle.classList.add('is-open');
        menu.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.classList.add('menu-locked');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function close() {
        toggle.classList.remove('is-open');
        menu.classList.remove('is-open');
        overlay.classList.remove('is-open');
        document.body.classList.remove('menu-locked');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        if (menu.classList.contains('is-open')) close();
        else open();
    });

    overlay.addEventListener('click', close);

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
})();
