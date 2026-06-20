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

    var GA4_ID = 'G-XXXXXXXXXX'; // ← reemplazar con tu ID de GA4

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    var enabled = /^G-[A-Z0-9]{6,}$/.test(GA4_ID);

    if (enabled) {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
        document.head.appendChild(s);

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
})();
