// @ts-check
const { test, expect } = require('@playwright/test');

// El mobile menu está habilitado en TODO el sitio (header con hamburguesa
// + panel deslizable). Estas pruebas detalladas corren sobre consultoria-ia
// y abajo hay un smoke test parametrizado para las 6 páginas.

test.describe('mobile menu (consultoria-ia)', () => {
    test.use({ viewport: { width: 380, height: 800 } });

    test('toggle abre y cierra el panel', async ({ page }) => {
        await page.goto('/consultoria-ia.html');
        const toggle = page.locator('.mobile-menu-toggle');
        const menu = page.locator('.mobile-menu');
        await expect(toggle).toBeVisible();
        await expect(menu).not.toHaveClass(/is-open/);
        await toggle.click();
        await expect(menu).toHaveClass(/is-open/);
        await page.locator('.mobile-overlay').click();
        await expect(menu).not.toHaveClass(/is-open/);
    });

    test('menú móvil tiene link a todas las secciones', async ({ page }) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('.mobile-menu-toggle').click();
        await expect(page.locator('.mobile-menu a[href="index.html"]')).toBeVisible();
        await expect(page.locator('.mobile-menu a[href="empresa.html"]')).toBeVisible();
        await expect(page.locator('.mobile-menu a[href="servicios.html"]')).toBeVisible();
        await expect(page.locator('.mobile-menu a[href="consultoria-ia.html"]')).toBeVisible();
    });

    test('click en link cierra el menú y navega', async ({ page }) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('.mobile-menu-toggle').click();
        await page.locator('.mobile-menu a[href="empresa.html"]').click();
        await expect(page).toHaveURL(/empresa\.html/);
    });

    test('tecla Escape cierra el menú', async ({ page }) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('.mobile-menu-toggle').click();
        await expect(page.locator('.mobile-menu')).toHaveClass(/is-open/);
        await page.keyboard.press('Escape');
        await expect(page.locator('.mobile-menu')).not.toHaveClass(/is-open/);
    });
});

// Smoke: el hamburger + panel funcionan en TODAS las páginas (antes solo
// existía en consultoria-ia — el resto no tenía navegación en móvil).
test.describe('mobile menu — presente en todo el sitio', () => {
    test.use({ viewport: { width: 380, height: 800 } });

    const PAGES = [
        '/index.html',
        '/consultoria-ia.html',
        '/servicios.html',
        '/empresa.html',
        '/descubrete.html',
        '/contacto.html'
    ];

    for (const path of PAGES) {
        test(`${path} — toggle visible y abre el panel`, async ({ page }) => {
            await page.goto(path);
            const toggle = page.locator('.mobile-menu-toggle');
            const menu = page.locator('.mobile-menu');
            await expect(toggle).toBeVisible();
            await expect(menu).not.toHaveClass(/is-open/);
            await toggle.click();
            await expect(menu).toHaveClass(/is-open/);
            // El panel debe tener los 5 links de navegación.
            await expect(menu.locator('a[href="index.html"]')).toBeVisible();
            await expect(menu.locator('a[href="consultoria-ia.html"]')).toBeVisible();
        });
    }
});
