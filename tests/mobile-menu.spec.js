// @ts-check
const { test, expect } = require('@playwright/test');

// El mobile menu solo está habilitado en consultoria-ia.html en este branch.
// El resto del sitio mantiene su comportamiento previo (menú desktop con
// regla `display: none` en viewport angosto). Cuando se quiera extender a
// todo el sitio, este test se replica para las otras páginas.

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
