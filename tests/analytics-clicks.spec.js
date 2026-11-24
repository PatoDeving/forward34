// @ts-check
const { test, expect } = require('@playwright/test');

// Eventos de clic de contacto (public/js/analytics.js). Se bloquea gtag.js para
// no mandar datos a GA4 y se leen los eventos desde window.dataLayer.

async function eventos(page) {
    return page.evaluate(() => (window.dataLayer || [])
        .filter((e) => e && typeof e.event === 'string')
        .map((e) => ({ event: e.event, link_location: e.link_location })));
}

async function preparar(page, path) {
    await page.route(/googletagmanager\.com/, (r) => r.abort());
    await page.goto(path);
    await page.waitForFunction(() => typeof window.f34Track === 'function');
    // Evita que el clic navegue o abra apps; el listener de analytics corre antes (captura).
    await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault()));
}

test.describe('analítica de clics de contacto', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('pie: teléfono, WhatsApp, correo y Contacto generan su evento', async ({ page }) => {
        await preparar(page, '/index.html');
        const pie = page.locator('footer');
        await pie.locator('a[href^="tel:"]').click();
        await pie.locator('a[href*="wa.me"]').click();
        await pie.locator('a[href^="mailto:"]').click();
        await pie.locator('a[href="/contacto.html"]').click();
        const ev = await eventos(page);
        for (const name of ['phone_click', 'whatsapp_click', 'email_click', 'contact_click']) {
            expect(ev).toContainEqual({ event: name, link_location: 'footer' });
        }
    });

    test('botón del encabezado cuenta como contact_click desde header', async ({ page }) => {
        await preparar(page, '/servicios.html');
        await page.locator('#site-header .btn-primary').click();
        expect(await eventos(page)).toContainEqual({ event: 'contact_click', link_location: 'header' });
    });

    test('en /contacto.html el enlace a sí misma no se cuenta', async ({ page }) => {
        await preparar(page, '/contacto.html');
        await page.locator('#site-header a[href="/contacto.html"]').first().click();
        const ev = await eventos(page);
        expect(ev.filter((e) => e.event === 'contact_click')).toHaveLength(0);
    });

    test('todas las páginas principales muestran teléfono y WhatsApp', async ({ page }) => {
        for (const path of ['/index.html', '/servicios.html', '/empresa.html', '/contacto.html', '/blog/']) {
            await page.goto(path);
            await expect(page.locator('a[href="tel:+524428409335"]').first()).toBeAttached();
            await expect(page.locator('a[href="https://wa.me/524428409335"]').first()).toBeAttached();
        }
    });
});
