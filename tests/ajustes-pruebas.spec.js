// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Ajustes del resultado de pruebas (24 nov 2026): <main>, CSS crítico,
// resúmenes de la portada iguales a /blog/ y contact_submit fuera.

const RAIZ = path.resolve(__dirname, '..');
const PAGINAS = [
    'index.html', 'servicios.html', 'consultoria-ia.html', 'empresa.html', 'descubrete.html',
    'contacto.html', 'aviso-de-privacidad.html', '404.html', 'blog/index.html',
    ...fs.readdirSync(path.join(RAIZ, 'blog')).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => 'blog/' + f)
];

test.describe('estructura y carga', () => {
    for (const p of PAGINAS) {
        test(`${p}: un solo <main> y CSS crítico sin hojas que bloqueen`, () => {
            const html = fs.readFileSync(path.join(RAIZ, p), 'utf8');
            expect(html.match(/<main[\s>]/g) || []).toHaveLength(1);
            expect(html).toContain('<style id="css-critico">');
            // Las hojas locales cargan diferidas (preload + onload), no como <link rel="stylesheet"> directo.
            const bloqueantes = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
                .match(/<link\b[^>]*rel="stylesheet"[^>]*public\/css[^>]*>/g) || [];
            expect(bloqueantes).toEqual([]);
        });
    }
});

test('resúmenes de la portada iguales a los de /blog/', async ({ page }) => {
    await page.goto('/blog/');
    const blog = await page.$$eval('.criterio-indice li', (lis) => Object.fromEntries(lis.map((li) => {
        const a = li.querySelector('a[href]');
        const p = li.querySelector('p');
        return [a ? a.getAttribute('href').split('/').pop() : '', p ? p.textContent.trim() : ''];
    })));
    await page.goto('/index.html');
    const portada = await page.$$eval('.home-blog li', (arts) => arts.map((art) => ({
        slug: art.querySelector('h3 a').getAttribute('href').split('/').pop(),
        resumen: art.querySelector('p').textContent.trim()
    })));
    expect(portada.length).toBeGreaterThan(0);
    for (const { slug, resumen } of portada) expect(resumen).toBe(blog[slug]);
});

test('contacto.html ya no manda contact_submit', () => {
    const html = fs.readFileSync(path.join(RAIZ, 'contacto.html'), 'utf8');
    expect(html).not.toContain('contact_submit');
    expect(html).toContain("'contact_success'");
});
