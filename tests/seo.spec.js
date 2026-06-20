// Smoke test de SEO: las 6 páginas deben tener canonical, og:image,
// og:url y twitter:card. consultoria-ia.html además debe servir
// JSON-LD con Service y FAQPage. Si esto se rompe, la PR no merge.

const { test, expect } = require('@playwright/test');

const PAGES = [
    { path: '/', canonical: 'https://forward34.com/' },
    { path: '/consultoria-ia.html', canonical: 'https://forward34.com/consultoria-ia.html' },
    { path: '/servicios.html', canonical: 'https://forward34.com/servicios.html' },
    { path: '/empresa.html', canonical: 'https://forward34.com/empresa.html' },
    { path: '/descubrete.html', canonical: 'https://forward34.com/descubrete.html' },
    { path: '/contacto.html', canonical: 'https://forward34.com/contacto.html' }
];

test.describe('SEO essentials', () => {
    for (const p of PAGES) {
        test(`${p.path} tiene canonical + open graph + twitter card`, async ({ page }) => {
            await page.goto(p.path);

            const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
            expect(canonical).toBe(p.canonical);

            const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
            expect(ogImage).toMatch(/^https:\/\/forward34\.com\/public\/images\/og-.*\.png$/);

            const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
            expect(ogUrl).toBe(p.canonical);

            const twCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
            expect(twCard).toBe('summary_large_image');
        });
    }

    test('consultoria-ia incluye JSON-LD con Service y FAQPage', async ({ page }) => {
        await page.goto('/consultoria-ia.html');
        const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
        const joined = blocks.join('\n');
        expect(joined).toContain('"@type": "Service"');
        expect(joined).toContain('"@type": "FAQPage"');
        expect(joined).toContain('"@type": "BreadcrumbList"');
        // Mínimo 6 preguntas en el FAQ para que el rich result sea válido.
        const qCount = (joined.match(/"@type": "Question"/g) || []).length;
        expect(qCount).toBeGreaterThanOrEqual(6);
    });

    test('index incluye JSON-LD Organization', async ({ page }) => {
        await page.goto('/');
        const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
        expect(blocks.join('\n')).toContain('"@type": "Organization"');
    });

    test('robots.txt y sitemap.xml se sirven', async ({ page }) => {
        const robots = await page.request.get('/robots.txt');
        expect(robots.ok()).toBeTruthy();
        expect(await robots.text()).toContain('Sitemap: https://forward34.com/sitemap.xml');

        const sitemap = await page.request.get('/sitemap.xml');
        expect(sitemap.ok()).toBeTruthy();
        const xml = await sitemap.text();
        expect(xml).toContain('<loc>https://forward34.com/consultoria-ia.html</loc>');
    });
});
