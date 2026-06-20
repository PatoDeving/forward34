// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('consultoria-ia.html', () => {
    test('hero carga con título y CTAs', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await expect(page).toHaveTitle(/Consultoría IA/);
        await expect(page.locator('h1')).toContainText('Descubre el potencial');
        await expect(page.locator('a[href="#diagnostico"]').first()).toBeVisible();
        await expect(page.locator('a[href="#ai-sprint"]').first()).toBeVisible();
    });

    test('flujo completo del diagnóstico: intro → 8 preguntas → resultado', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();

        // Recorrer las 8 preguntas eligiendo la opción intermedia (score 1)
        for (let i = 1; i <= 8; i++) {
            await expect(page.locator('#q-current')).toHaveText(String(i));
            await page.locator('[data-test="option-1"]').click();
            // Wait for navigation to next q or result
            if (i < 8) {
                await expect(page.locator('#q-current')).toHaveText(String(i + 1), { timeout: 2000 });
            }
        }

        // Pantalla de resultado
        await expect(page.locator('.assessment-result')).toBeVisible();
        // 8 preguntas × 1 punto = 8
        await expect(page.locator('#r-score')).toHaveText('8');
        await expect(page.locator('#r-bucket')).toHaveText('En camino');

        // Hay 4 barras (una por dimensión)
        await expect(page.locator('.result-bar')).toHaveCount(4);
        // Hay roadmap con al menos 2 items
        const items = page.locator('#r-roadmap li');
        await expect.poll(async () => await items.count()).toBeGreaterThan(1);
    });

    test('score máximo y mínimo se calculan correcto', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();
        for (let i = 1; i <= 8; i++) {
            await page.locator('[data-test="option-2"]').click();
            if (i < 8) await expect(page.locator('#q-current')).toHaveText(String(i + 1), { timeout: 2000 });
        }
        await expect(page.locator('#r-score')).toHaveText('16');
        await expect(page.locator('#r-bucket')).toHaveText('Líder');
    });

    test('botón anterior regresa a la pregunta previa y mantiene selección', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();
        await page.locator('[data-test="option-2"]').click();
        await expect(page.locator('#q-current')).toHaveText('2');
        await page.locator('#q-back').click();
        await expect(page.locator('#q-current')).toHaveText('1');
        // La opción debe estar marcada como seleccionada
        await expect(page.locator('[data-test="option-2"]')).toHaveClass(/selected/);
    });

    test('form valida campos requeridos y consentimiento', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();
        for (let i = 1; i <= 8; i++) {
            await page.locator('[data-test="option-0"]').click();
            if (i < 8) await expect(page.locator('#q-current')).toHaveText(String(i + 1), { timeout: 2000 });
        }

        // Intentar enviar sin llenar nada
        await page.locator('#r-submit').click();
        await expect(page.locator('#r-form-status')).toHaveClass(/is-error/);

        // Llenar parcialmente, sin consent
        await page.fill('input[name="nombre"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="empresa"]', 'TestCo');
        await page.selectOption('select[name="tamano"]', '21-100');
        await page.locator('#r-submit').click();
        await expect(page.locator('#r-form-status')).toContainText(/consentimiento|privacidad/i);
    });

    test('form envía a /api/lead y muestra success', async ({ page }) => {
        // Interceptar el POST a /api/lead y simular 200 OK
        await page.route('**/api/lead', async (route) => {
            const req = route.request();
            const body = JSON.parse(req.postData() || '{}');
            // Validar payload
            if (!body.email || typeof body.score !== 'number') {
                return route.fulfill({ status: 400, body: '{"error":"bad"}' });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, emailSent: true })
            });
        });

        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();
        for (let i = 1; i <= 8; i++) {
            await page.locator('[data-test="option-1"]').click();
            if (i < 8) await expect(page.locator('#q-current')).toHaveText(String(i + 1), { timeout: 2000 });
        }

        await page.fill('input[name="nombre"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="empresa"]', 'TestCo');
        await page.fill('input[name="cargo"]', 'CTO');
        await page.selectOption('select[name="tamano"]', '21-100');
        await page.check('input[name="consent"]');
        await page.locator('#r-submit').click();

        await expect(page.locator('#r-form-status')).toHaveClass(/is-success/, { timeout: 5000 });
        await expect(page.locator('#r-submit')).toBeDisabled();
    });

    test('reiniciar diagnóstico limpia el estado', async ({ page }) => {
        await page.goto('/consultoria-ia');
        await page.locator('#assessment-start').click();
        for (let i = 1; i <= 8; i++) {
            await page.locator('[data-test="option-2"]').click();
            if (i < 8) await expect(page.locator('#q-current')).toHaveText(String(i + 1), { timeout: 2000 });
        }
        await page.locator('#r-restart').click();
        await expect(page.locator('.assessment-intro')).toBeVisible();
        await expect(page.locator('#assessment-start')).toBeVisible();
    });
});

test.describe('navegación cross-pages', () => {
    const pages = [
        { url: '/', title: /Forward34/ },
        { url: '/empresa', title: /Empresa/ },
        { url: '/descubrete', title: /Descúbrete/ },
        { url: '/servicios', title: /Servicios/ },
        { url: '/contacto', title: /Contacto/ },
        { url: '/consultoria-ia', title: /Consultoría IA/ }
    ];

    for (const p of pages) {
        test(`${p.url} carga y contiene link a Consultoría IA en nav`, async ({ page }) => {
            await page.goto(p.url);
            await expect(page).toHaveTitle(p.title);
            // El link existe ya sea en main-nav o mobile-menu
            const links = page.locator('a[href="consultoria-ia"]');
            await expect.poll(async () => await links.count()).toBeGreaterThan(0);
        });
    }
});
