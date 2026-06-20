// Valida que TODO el JSON-LD del sitio sea JSON parseable y tenga la
// forma mínima esperada. Si esto se rompe, Google y los LLMs ignoran
// el structured data — y la PR no debe merge en ese estado.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    'index.html',
    'consultoria-ia.html',
    'servicios.html',
    'empresa.html',
    'descubrete.html',
    'contacto.html'
];

function extractLdJson(html) {
    const blocks = [];
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html))) blocks.push(m[1].trim());
    return blocks;
}

function allTypes(node, acc = new Set()) {
    if (!node || typeof node !== 'object') return acc;
    if (Array.isArray(node)) { node.forEach((n) => allTypes(n, acc)); return acc; }
    if (typeof node['@type'] === 'string') acc.add(node['@type']);
    if (Array.isArray(node['@type'])) node['@type'].forEach((t) => acc.add(t));
    for (const k of Object.keys(node)) allTypes(node[k], acc);
    return acc;
}

test.describe('JSON-LD structured data', () => {
    for (const file of PAGES) {
        test(`${file} — JSON-LD parsea sin errores y declara @context`, () => {
            const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
            const blocks = extractLdJson(html);
            expect(blocks.length).toBeGreaterThan(0);
            for (const raw of blocks) {
                let parsed;
                expect(() => { parsed = JSON.parse(raw); }).not.toThrow();
                expect(parsed['@context']).toBe('https://schema.org');
            }
        });
    }

    test('index.html declara Organization + WebSite', () => {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        const types = allTypes(extractLdJson(html).map(JSON.parse));
        expect(types.has('Organization')).toBe(true);
        expect(types.has('WebSite')).toBe(true);
    });

    test('consultoria-ia.html declara Service + FAQPage + BreadcrumbList y >= 6 Questions', () => {
        const html = fs.readFileSync(path.join(ROOT, 'consultoria-ia.html'), 'utf8');
        const blocks = extractLdJson(html).map(JSON.parse);
        const types = allTypes(blocks);
        expect(types.has('Service')).toBe(true);
        expect(types.has('FAQPage')).toBe(true);
        expect(types.has('BreadcrumbList')).toBe(true);

        const flatten = JSON.stringify(blocks);
        const qCount = (flatten.match(/"@type":\s*"Question"/g) || []).length;
        expect(qCount).toBeGreaterThanOrEqual(6);

        // Cada Question debe tener acceptedAnswer.text no vacío
        const faqPage = blocks.flatMap((b) => Array.isArray(b['@graph']) ? b['@graph'] : [b])
            .find((n) => n['@type'] === 'FAQPage');
        expect(faqPage).toBeTruthy();
        expect(Array.isArray(faqPage.mainEntity)).toBe(true);
        for (const q of faqPage.mainEntity) {
            expect(q.name).toBeTruthy();
            expect(q.acceptedAnswer && q.acceptedAnswer.text).toBeTruthy();
            expect(q.acceptedAnswer.text.length).toBeGreaterThan(40);
        }
    });

    test('cada BreadcrumbList tiene items con position consecutivas desde 1', () => {
        for (const file of PAGES) {
            const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
            const blocks = extractLdJson(html).map(JSON.parse);
            const breadcrumbs = blocks.flatMap((b) => Array.isArray(b['@graph']) ? b['@graph'] : [b])
                .filter((n) => n['@type'] === 'BreadcrumbList');
            for (const bc of breadcrumbs) {
                expect(Array.isArray(bc.itemListElement)).toBe(true);
                bc.itemListElement.forEach((it, idx) => {
                    expect(it.position).toBe(idx + 1);
                    expect(it.name).toBeTruthy();
                    expect(it.item).toMatch(/^https:\/\/forward34\.com\//);
                });
            }
        }
    });

    test('FAQ visible refleja exactamente las preguntas del FAQPage JSON-LD', () => {
        const html = fs.readFileSync(path.join(ROOT, 'consultoria-ia.html'), 'utf8');
        const blocks = extractLdJson(html).map(JSON.parse);
        const faqPage = blocks.flatMap((b) => Array.isArray(b['@graph']) ? b['@graph'] : [b])
            .find((n) => n['@type'] === 'FAQPage');
        const jsonQuestions = faqPage.mainEntity.map((q) => q.name);

        // Extrae <summary>...</summary> dentro de details.faq-item
        const summaries = [];
        const re = /<details class="faq-item">[\s\S]*?<summary>([\s\S]*?)<\/summary>/g;
        let m;
        while ((m = re.exec(html))) summaries.push(m[1].trim());

        // Decodifica HTML entities mínimas para comparar
        const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const visible = summaries.map(decode);

        expect(visible.length).toBe(jsonQuestions.length);
        for (const q of jsonQuestions) {
            expect(visible).toContain(q);
        }
    });
});
