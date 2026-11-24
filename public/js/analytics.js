// Forward34 — bootstrap de Google Analytics 4.
//
// Reemplaza GA4_ID con tu ID real (formato G-XXXXXXXXXX) en una sola línea.
// Si lo dejas como "G-XXXXXXXXXX" el script no carga nada y la página
// sigue funcionando sin analítica (útil para previews y dev local).
//
// Eventos personalizados se envían vía window.f34Track(name, payload),
// que también las páginas y el assessment.js consumen.

(function () {
    'use strict';

    var GA4_ID = 'G-CQ3PX3RY71';

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    var enabled = /^G-[A-Z0-9]{6,}$/.test(GA4_ID) && GA4_ID !== 'G-XXXXXXXXXX';

    // ── Consent Mode (reporte del 23 nov 2026, P2·11) ──────────────────────
    // Modelo elegido por Mau: GA4 mide hasta que la persona rechace. La
    // elección se guarda en este navegador. No hay anuncios, así que los
    // permisos de publicidad quedan siempre en «denied».
    var CLAVE_CONSENTIMIENTO = 'f34_consent';
    var leerConsentimiento = function () {
        try { return window.localStorage.getItem(CLAVE_CONSENTIMIENTO); } catch (_) { return null; }
    };
    var guardarConsentimiento = function (valor) {
        try { window.localStorage.setItem(CLAVE_CONSENTIMIENTO, valor); } catch (_) { /* sin almacenamiento: vale solo esta visita */ }
    };
    var eleccion = leerConsentimiento();

    gtag('consent', 'default', {
        analytics_storage: eleccion === 'denied' ? 'denied' : 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    if (enabled) {
        // gtag.js (~150 KB) se descarga cuando la página ya terminó de cargar
        // (o en la primera interacción, lo que pase antes). En Lighthouse móvil
        // era lo que más retrasaba el LCP. Los eventos no se pierden: config y
        // f34Track van a window.dataLayer y gtag.js los envía al cargar.
        var gtagCargado = false;
        var cargarGtag = function () {
            if (gtagCargado) return;
            gtagCargado = true;
            var s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
            document.head.appendChild(s);
        };
        var cuandoInactivo = function () {
            if ('requestIdleCallback' in window) window.requestIdleCallback(cargarGtag, { timeout: 2000 });
            else window.setTimeout(cargarGtag, 1);
        };
        if (document.readyState === 'complete') cuandoInactivo();
        else window.addEventListener('load', cuandoInactivo, { once: true });
        ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) {
            window.addEventListener(ev, cargarGtag, { once: true, passive: true });
        });

        gtag('js', new Date());
        gtag('config', GA4_ID, {
            anonymize_ip: true,
            send_page_view: true
        });
    }

    // Wrapper público — assessment.js y formularios lo usan para emitir eventos.
    // Funciona aunque GA4 esté apagado (queda como no-op silencioso).
    window.f34Track = function (name, payload) {
        try {
            if (!name) return;
            payload = payload || {};
            if (enabled && typeof window.gtag === 'function') {
                window.gtag('event', name, payload);
            }
            // Compatibilidad con el patrón existente (dataLayer / plausible).
            if (window.dataLayer && typeof window.dataLayer.push === 'function') {
                window.dataLayer.push(Object.assign({ event: name }, payload));
            }
            if (typeof window.plausible === 'function') {
                window.plausible(name, { props: payload });
            }
        } catch (_) { /* analytics no debe romper la UI */ }
    };

    // Clics de contacto (reporte del 23 nov 2026, P1·5). Un solo listener para
    // todo el sitio, así cualquier enlace nuevo a contacto, WhatsApp, teléfono o
    // correo se mide sin tocar el HTML. El envío confirmado del formulario se
    // mide aparte, en contacto.html, como `contact_success`.
    //   contact_click  → enlaces a /contacto.html (desde otra página)
    //   whatsapp_click → wa.me / api.whatsapp.com
    //   phone_click    → tel:
    //   email_click    → mailto:
    function clasificar(href) {
        if (/^tel:/i.test(href)) return 'phone_click';
        if (/^mailto:/i.test(href)) return 'email_click';
        if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return 'whatsapp_click';
        if (/(^|\/)contacto\.html(?:[?#]|$)/i.test(href)) return 'contact_click';
        return null;
    }

    function zona(el) {
        if (el.closest('#site-header')) return 'header';
        if (el.closest('.mobile-menu')) return 'mobile_menu';
        if (el.closest('footer')) return 'footer';
        return 'content';
    }

    document.addEventListener('click', function (e) {
        try {
            var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!a) return;
            var href = a.getAttribute('href') || '';
            var name = clasificar(href);
            if (!name) return;
            // En /contacto.html, un enlace a sí misma no es una intención nueva.
            if (name === 'contact_click' && /\/contacto\.html$/i.test(window.location.pathname)) return;
            window.f34Track(name, {
                link_location: zona(a),
                link_text: (a.textContent || '').trim().slice(0, 80),
                page_path: window.location.pathname,
                transport_type: 'beacon'
            });
        } catch (_) { /* analytics no debe romper la UI */ }
    }, true);

    // ── Aviso de cookies ──────────────────────────────────────────────────
    // Aparece mientras la persona no haya elegido. «Preferencias de cookies»
    // en el pie (data-cookie-prefs) lo vuelve a abrir.
    var aviso = null;

    function decidir(valor) {
        guardarConsentimiento(valor);
        gtag('consent', 'update', { analytics_storage: valor });
        if (aviso) aviso.hidden = true;
    }

    function mostrarAviso() {
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.className = 'f34-cookies';
            aviso.setAttribute('role', 'region');
            aviso.setAttribute('aria-label', 'Aviso de cookies');
            aviso.innerHTML =
                '<p>Usamos cookies de analítica (Google Analytics) para saber cómo se usa el sitio. ' +
                'Puedes rechazarlas. <a href="/aviso-de-privacidad.html">Aviso de privacidad</a></p>' +
                '<div class="f34-cookies-botones">' +
                '<button type="button" class="f34-cookies-rechazar">Rechazar</button>' +
                '<button type="button" class="f34-cookies-aceptar">Aceptar</button>' +
                '</div>';
            aviso.querySelector('.f34-cookies-aceptar').addEventListener('click', function () { decidir('granted'); });
            aviso.querySelector('.f34-cookies-rechazar').addEventListener('click', function () { decidir('denied'); });
            document.body.appendChild(aviso);
        }
        aviso.hidden = false;
    }

    function iniciarAviso() {
        if (!leerConsentimiento()) mostrarAviso();
        document.addEventListener('click', function (e) {
            var a = e.target && e.target.closest ? e.target.closest('[data-cookie-prefs]') : null;
            if (!a) return;
            e.preventDefault();
            mostrarAviso();
            var boton = aviso.querySelector(leerConsentimiento() === 'denied' ? '.f34-cookies-rechazar' : '.f34-cookies-aceptar');
            if (boton) boton.focus();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarAviso, { once: true });
    else iniciarAviso();
})();
