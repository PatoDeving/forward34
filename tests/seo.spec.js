// Smoke test de SEO: las 6 páginas deben tener canonical, og:image,
// og:url y twitter:card. consultoria-ia.html además debe servir
// JSON-LD con Service y FAQPage. Si esto se rompe, la PR no merge.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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
        test(`${p.path} tiene canonical + open graph + twitter card + favicon`, async ({ page }) => {
            await page.goto(p.path);

            const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
            expect(canonical).toBe(p.canonical);

            const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
            expect(ogImage).toMatch(/^https:\/\/forward34\.com\/public\/images\/og-.*\.png$/);

            const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
            expect(ogUrl).toBe(p.canonical);

            const twCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
            expect(twCard).toBe('summary_large_image');

            // Favicon: ICO (root) + SVG + apple-touch-icon + manifest, todos root-absolute
            const icoIcon = await page.locator('link[rel="icon"][href="/favicon.ico"]').getAttribute('href');
            expect(icoIcon).toBe('/favicon.ico');
            const svgIcon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
            expect(svgIcon).toBe('/public/favicon.svg');
            const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
            expect(appleIcon).toBe('/public/apple-touch-icon.png');
            const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
            expect(manifest).toBe('/public/site.webmanifest');
        });
    }

    test('favicon assets se sirven con el content-type correcto', async ({ page }) => {
        const ico = await page.request.get('/favicon.ico');
        expect(ico.ok()).toBeTruthy();
        // El .ico debe empezar con la cabecera ICONDIR (00 00 01 00)
        const head = (await ico.body()).subarray(0, 4);
        expect(Array.from(head)).toEqual([0, 0, 1, 0]);

        const svg = await page.request.get('/public/favicon.svg');
        expect(svg.ok()).toBeTruthy();
        expect(svg.headers()['content-type']).toMatch(/svg/);

        const apple = await page.request.get('/public/apple-touch-icon.png');
        expect(apple.ok()).toBeTruthy();
        expect(apple.headers()['content-type']).toMatch(/png/);

        const manifest = await page.request.get('/public/site.webmanifest');
        expect(manifest.ok()).toBeTruthy();
        const json = await manifest.json();
        expect(json.name).toContain('Forward34');
        expect(Array.isArray(json.icons)).toBe(true);
        expect(json.icons.length).toBeGreaterThanOrEqual(2);
    });

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

    // El serving real del 404 depende de Vercel; aquí validamos que el
    // archivo está bien formado: noindex, rutas root-absolute (sirve en
    // cualquier profundidad de URL) y CTAs de recuperación.
    test('404.html es noindex, usa rutas root-absolute y tiene CTAs', () => {
        const html = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');
        expect(html).toMatch(/<meta name="robots" content="noindex/);
        expect(html).toContain('href="/public/css/styles.css"');
        expect(html).toContain('href="/index.html"');
        expect(html).toContain('href="/consultoria-ia.html"');
        // No debe haber rutas relativas a assets (romperían en /foo/bar).
        expect(html).not.toMatch(/href="public\//);
        expect(html).not.toMatch(/src="public\//);
    });
});
