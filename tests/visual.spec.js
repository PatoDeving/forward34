// @ts-check
const { test } = require('@playwright/test');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'screenshots');

async function shot(page, name, testInfo) {
    const proj = testInfo.project.name;
    // Forzar todas las animaciones .reveal a estado visible
    // (IntersectionObserver no dispara para contenido fuera del viewport
    // en screenshots fullPage).
    await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    });
    await page.waitForTimeout(150);
    await page.screenshot({
        path: path.join(SCREENS_DIR, proj + '-' + name + '.png'),
        fullPage: true
    });
}

test.describe('visual screenshots', () => {
    test('home desktop', async ({ page }, testInfo) => {
        await page.goto('/index.html');
        await page.waitForLoadState('networkidle');
        await shot(page, 'home-desktop', testInfo);
    });

    test('consultoria-ia hero + intro', async ({ page }, testInfo) => {
        await page.goto('/consultoria-ia.html');
        await page.waitForLoadState('networkidle');
        await shot(page, 'consultoria-ia-full', testInfo);
    });

    test('consultoria-ia diagnóstico en pregunta 4', async ({ page }, testInfo) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('#assessment-start').click();
        for (let i = 1; i < 4; i++) {
            await page.locator('[data-test="option-1"]').click();
            await page.locator('#q-current').filter({ hasText: String(i + 1) }).waitFor();
        }
        await page.waitForTimeout(400);
        await shot(page, 'consultoria-ia-question', testInfo);
    });

    test('consultoria-ia resultado y form', async ({ page }, testInfo) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('#assessment-start').click();
        for (let i = 1; i <= 8; i++) {
            const opt = (i % 3);
            await page.locator(`[data-test="option-${opt}"]`).click();
            if (i < 8) await page.locator('#q-current').filter({ hasText: String(i + 1) }).waitFor({ timeout: 2000 });
        }
        await page.locator('.assessment-result').waitFor();
        await page.waitForTimeout(800);
        await shot(page, 'consultoria-ia-result', testInfo);
    });

    test('servicios desktop', async ({ page }, testInfo) => {
        await page.goto('/servicios.html');
        await page.waitForLoadState('networkidle');
        await shot(page, 'servicios-desktop', testInfo);
    });
});

test.describe('visual screenshots mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('home mobile', async ({ page }, testInfo) => {
        await page.goto('/index.html');
        await page.waitForLoadState('networkidle');
        await shot(page, 'home-mobile', testInfo);
    });

    test('consultoria-ia mobile', async ({ page }, testInfo) => {
        await page.goto('/consultoria-ia.html');
        await page.waitForLoadState('networkidle');
        await shot(page, 'consultoria-ia-mobile', testInfo);
    });

    test('mobile menu abierto', async ({ page }, testInfo) => {
        await page.goto('/consultoria-ia.html');
        await page.locator('.mobile-menu-toggle').click();
        await page.waitForTimeout(400);
        await shot(page, 'mobile-menu-open', testInfo);
    });
});
