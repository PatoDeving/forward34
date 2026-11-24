// @ts-check
const { test, expect } = require('@playwright/test');

// Consent Mode (public/js/analytics.js): GA4 mide hasta que la persona rechace.
// Se bloquea gtag.js para no mandar datos a GA4; se lee window.dataLayer.

async function consentimientos(page) {
    return page.evaluate(() => (window.dataLayer || [])
        .filter((e) => e && e[0] === 'consent')
        .map((e) => ({ tipo: e[1], analytics: e[2] && e[2].analytics_storage, ads: e[2] && e[2].ad_storage })));
}

test.describe('aviso de cookies y Consent Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(/googletagmanager\.com/, (r) => r.abort());
    });

    test('primera visita: aviso visible y GA4 mide por defecto (anuncios siempre denegados)', async ({ page }) => {
        await page.goto('/index.html');
        await expect(page.locator('.f34-cookies')).toBeVisible();
        expect(await consentimientos(page)).toContainEqual({ tipo: 'default', analytics: 'granted', ads: 'denied' });
    });

    test('Rechazar: actualiza a denied, oculta el aviso y lo recuerda', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('.f34-cookies-rechazar').click();
        await expect(page.locator('.f34-cookies')).toBeHidden();
        expect(await consentimientos(page)).toContainEqual({ tipo: 'update', analytics: 'denied', ads: undefined });

        await page.goto('/servicios.html');
        await expect(page.locator('.f34-cookies')).toHaveCount(0);
        expect(await consentimientos(page)).toContainEqual({ tipo: 'default', analytics: 'denied', ads: 'denied' });
    });

    test('Aceptar: oculta el aviso y no vuelve a salir', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('.f34-cookies-aceptar').click();
        await expect(page.locator('.f34-cookies')).toBeHidden();
        await page.goto('/empresa.html');
        await expect(page.locator('.f34-cookies')).toHaveCount(0);
    });

    test('«Preferencias de cookies» en el pie vuelve a abrir el aviso', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('.f34-cookies-aceptar').click();
        await page.locator('footer [data-cookie-prefs]').click();
        await expect(page.locator('.f34-cookies')).toBeVisible();
        await page.locator('.f34-cookies-rechazar').click();
        expect(await consentimientos(page)).toContainEqual({ tipo: 'update', analytics: 'denied', ads: undefined });
    });
});
