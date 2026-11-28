// Genera llms-full.txt con el texto de las páginas principales y los artículos del blog.
//
// Uso, con el sitio corriendo en local (npm run dev → http://localhost:3000):
//   node scripts/generar-llms-full.js
//
// Al publicar un artículo nuevo: agrégalo arriba en BLOG, vuelve a correr el
// script y sube llms-full.txt en el mismo PR del artículo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'llms-full.txt');

const PAGINAS = [
    ['Inicio', '/index.html', 'https://forward34.com/'],
    ['Servicios', '/servicios.html', 'https://forward34.com/servicios.html'],
    ['Consultoría IA', '/consultoria-ia.html', 'https://forward34.com/consultoria-ia.html'],
    ['Empresa', '/empresa.html', 'https://forward34.com/empresa.html'],
    ['Descúbrete+', '/descubrete.html', 'https://forward34.com/descubrete.html'],
    ['Contacto', '/contacto.html', 'https://forward34.com/contacto.html']
];

// Del más reciente al más antiguo, igual que blog/index.html.
const BLOG = [
    'quien-puede-adaptarse-a-la-ia-en-tu-empresa',
    'el-trabajo-que-tu-empresa-necesita-y-nadie-alcanza-a-hacer',
    'lo-que-cuesta-revisar-el-trabajo-de-la-ia',
    'cuando-todo-tiene-que-pasar-por-la-misma-persona',
    'ultimos-dias-del-crm',
    'comprar-ia-no-esta-transformando-tu-empresa',
    'forward34-openai-select-partner-mexico'
];

const ENCABEZADO = `# Forward34 — contenido completo del sitio

> Texto de las páginas principales y de los artículos del blog de https://forward34.com, para modelos de lenguaje. Versión resumida: https://forward34.com/llms.txt

El nombre se escribe Forward34, en una sola palabra. Forward34 S.A. de C.V. es la entidad que contrata, opera y factura; Descúbrete+ es su marca operativa. Forward34 llama "acompañamiento" a lo que en otros lados se llama coaching. OpenAI Select Partner es una designación del programa de socios de OpenAI, no un aval de OpenAI sobre los servicios de Forward34.

---

`;

// Corre dentro de la página: devuelve el texto del contenido principal en Markdown simple.
function extraer() {
    const omitir = (el) => el.closest('header, footer, nav, aside, form, script, style, noscript, .mobile-menu, .marquee, .f34-b, .f34-p, .privacy-modal-overlay, .f34-cookies, [aria-hidden="true"], #assessment, .criterio-relacionados, .cta-full');
    const prefijo = { H1: '### ', H2: '#### ', H3: '##### ', H4: '##### ', SUMMARY: '**P:** ', LI: '- ', BLOCKQUOTE: '> ' };
    const lineas = [];
    const vistas = new Set();
    document.querySelectorAll('h1, h2, h3, h4, summary, p, li, blockquote').forEach((el) => {
        if (omitir(el)) return;
        if (el.tagName === 'P' && el.closest('li')) return;
        const c = el.cloneNode(true);
        c.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
        c.querySelectorAll('br').forEach((x) => x.replaceWith(' '));
        // Palabras rotativas del hero: se queda la primera.
        c.querySelectorAll('[data-words]').forEach((x) => x.replaceWith((x.getAttribute('data-words') || '').split('|')[0]));
        const t = (c.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t || vistas.has(t)) return;
        vistas.add(t);
        lineas.push((prefijo[el.tagName] || '') + t);
    });
    return lineas.join('\n\n');
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route(/googletagmanager|google-analytics/, (r) => r.abort());
    const bloques = [];

    for (const [nombre, ruta, url] of PAGINAS) {
        await page.goto(BASE + ruta);
        bloques.push(`## ${nombre}\n\nURL: ${url}\n\n` + await page.evaluate(extraer));
    }
    for (const slug of BLOG) {
        await page.goto(`${BASE}/blog/${slug}.html`);
        const titulo = (await page.title()).replace(/ \| (Blog|Forward34)$/, '');
        bloques.push(`## Blog: ${titulo}\n\nURL: https://forward34.com/blog/${slug}.html\n\n` + await page.evaluate(extraer));
    }

    fs.writeFileSync(OUT, ENCABEZADO + bloques.join('\n\n---\n\n') + '\n');
    await browser.close();
    console.log('llms-full.txt generado:', fs.statSync(OUT).size, 'bytes');
})();
