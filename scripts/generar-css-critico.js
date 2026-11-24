#!/usr/bin/env node
// Genera el CSS crítico de cada página y lo pone en el <head>.
//
//   node scripts/generar-css-critico.js
//
// Qué hace, página por página:
//   1. La abre en Chromium (Playwright) a tamaño de celular y de escritorio,
//      sirviendo los archivos desde este repo (también las URLs absolutas a
//      https://forward34.com/public/...).
//   2. Recorre las reglas de las hojas de estilo locales de la página y se
//      queda con las que aplican a algo visible en la primera pantalla (más los
//      elementos ocultos o fijos, como el menú móvil y el aviso de cookies, para
//      que no aparezcan sin estilo).
//   3. Escribe esas reglas en <style id="css-critico"> entre los comentarios
//      <!-- css-critico:inicio --> y <!-- css-critico:fin -->, y cambia los
//      <link rel="stylesheet"> locales a carga diferida (preload + onload, con
//      <noscript> de respaldo). El orden de los <link> no cambia, así que la
//      cascada y los !important quedan igual que antes.
//
// Hay que volver a correrlo cuando cambie el CSS o la parte de arriba de una
// página. Si no se corre, la página se sigue viendo bien (las hojas completas
// cargan igual); solo la primera pintada puede salir distinta un instante.
// La plantilla del blog recibe el CSS crítico del artículo más reciente.

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const RAIZ = path.resolve(__dirname, '..');
const BASE = 'http://f34.local';

const PAGINAS = process.env.SOLO ? [process.env.SOLO] : [
    'index.html', 'servicios.html', 'consultoria-ia.html', 'empresa.html',
    'descubrete.html', 'contacto.html', 'aviso-de-privacidad.html', '404.html',
    'blog/index.html',
    ...fs.readdirSync(path.join(RAIZ, 'blog'))
        .filter((f) => f.endsWith('.html') && f !== 'index.html')
        .map((f) => 'blog/' + f)
];
const PLANTILLA = 'plantillas/blog-plantilla.html';
const ARTICULO_MODELO = 'blog/el-trabajo-que-tu-empresa-necesita-y-nadie-alcanza-a-hacer.html';

const VISTAS = [
    { width: 412, height: 915 },   // celular (Lighthouse móvil)
    { width: 1350, height: 940 }   // escritorio
];

const TIPOS = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2'
};

// <link rel="stylesheet"> locales, en cualquiera de las dos formas que usa el repo.
const RE_LINK = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="((?:https:\/\/forward34\.com)?\/?public\/css\/[^"]+\.css)")[^>]*>/g;

function hojasDe(html) {
    const hojas = [];
    let m;
    RE_LINK.lastIndex = 0;
    while ((m = RE_LINK.exec(html))) hojas.push(m[1]);
    return hojas;
}

function archivoDeHoja(href) {
    return path.join(RAIZ, href.replace(/^https:\/\/forward34\.com/, '').replace(/^\//, ''));
}

async function extraer(browser, pagina, hojas) {
    const conservar = new Set();
    for (const vista of VISTAS) {
        const ctx = await browser.newContext({ viewport: vista });
        await ctx.route('**/*', async (route) => {
            const url = new URL(route.request().url());
            if (url.host !== 'f34.local' && url.host !== 'forward34.com') return route.abort();
            let p = decodeURIComponent(url.pathname);
            if (p.endsWith('/')) p += 'index.html';
            const archivo = path.join(RAIZ, p);
            if (!archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
                return route.fulfill({ status: 404, body: '' });
            }
            return route.fulfill({
                status: 200,
                contentType: TIPOS[path.extname(archivo)] || 'application/octet-stream',
                body: fs.readFileSync(archivo)
            });
        });
        const page = await ctx.newPage();
        await page.goto(BASE + '/' + pagina, { waitUntil: 'load' });
        await page.waitForTimeout(300);

        const textos = hojas.map((h) => fs.readFileSync(archivoDeHoja(h), 'utf8'));
        const indices = await page.evaluate(({ textos, alto }) => {
            const limite = alto * 1.15;
            const DINAMICAS = /::?(before|after|placeholder|selection|marker|first-line|first-letter|backdrop|-webkit-[a-z-]+|-moz-[a-z-]+)|:(hover|focus-visible|focus-within|focus|active|visited|target|checked|disabled|invalid|valid|placeholder-shown)/g;
            const visible = (sel) => {
                const limpio = sel.replace(DINAMICAS, '').trim();
                if (!limpio || /^[>+~]|[>+~]$/.test(limpio)) return true;
                let els;
                try { els = document.querySelectorAll(limpio); } catch (_) { return true; }
                for (const el of els) {
                    const r = el.getBoundingClientRect();
                    if (r.top < limite) return true;
                }
                return false;
            };
            const salida = [];
            const recorrer = (reglas, ruta) => {
                Array.from(reglas).forEach((regla, i) => {
                    const id = ruta.concat(i).join('.');
                    if (regla.type === CSSRule.STYLE_RULE) {
                        if (regla.selectorText.split(',').some((s) => visible(s))) salida.push(id);
                    } else if (regla.cssRules) {
                        recorrer(regla.cssRules, ruta.concat(i));
                    } else {
                        salida.push(id); // @font-face, @keyframes (se filtran después), @import…
                    }
                });
            };
            textos.forEach((t, h) => {
                const hoja = new CSSStyleSheet();
                hoja.replaceSync(t);
                recorrer(hoja.cssRules, [h]);
            });
            return salida;
        }, { textos, alto: vista.height });
        if (process.env.DEBUG) console.log(vista.width, indices.length, indices.slice(0, 5));
        indices.forEach((i) => conservar.add(i));
        await ctx.close();
    }

    // Reconstruye el CSS con las reglas conservadas, en su orden original.
    const page = await browser.newPage();
    const textos = hojas.map((h) => fs.readFileSync(archivoDeHoja(h), 'utf8'));
    const css = await page.evaluate(({ textos, conservar }) => {
        const keep = new Set(conservar);
        const usadas = new Set();
        const armar = (reglas, ruta) => {
            let out = '';
            Array.from(reglas).forEach((regla, i) => {
                const id = ruta.concat(i).join('.');
                if (regla.type === CSSRule.KEYFRAMES_RULE) {
                    out += '\u0000KF:' + regla.name + '\u0000' + regla.cssText + '\u0000/KF\u0000';
                } else if (regla.type !== CSSRule.STYLE_RULE && regla.cssRules) {
                    const dentro = armar(regla.cssRules, ruta.concat(i));
                    if (dentro) {
                        const cabeza = regla.cssText.slice(0, regla.cssText.indexOf('{')).trim();
                        out += cabeza + '{' + dentro + '}';
                    }
                } else if (keep.has(id)) {
                    out += regla.cssText;
                    const m = regla.cssText.match(/animation(?:-name)?\s*:\s*([^;}]+)/g);
                    if (m) m.forEach((d) => d.split(/[\s,:]+/).forEach((w) => usadas.add(w)));
                }
            });
            return out;
        };
        let todo = '';
        textos.forEach((t, h) => {
            const hoja = new CSSStyleSheet();
            hoja.replaceSync(t);
            todo += armar(hoja.cssRules, [h]);
        });
        return todo.replace(/\u0000KF:([^\u0000]+)\u0000([\s\S]*?)\u0000\/KF\u0000/g,
            (_, nombre, texto) => (usadas.has(nombre) ? texto : ''));
    }, { textos, conservar: Array.from(conservar) });
    await page.close();
    return css.replace(/\s*\n\s*/g, ' ').replace(/<\/style/gi, '<\\/style');
}

function deshacer(html) {
    // Quita un bloque anterior, si lo hay.
    html = html.replace(/[ \t]*<!-- css-critico:inicio -->[\s\S]*?<!-- css-critico:fin -->\r?\n?/, '');
    // Deshace una conversión anterior a preload, para partir de los <link> normales.
    html = html.replace(/<link rel="preload" as="style" href="([^"]*public\/css\/[^"]+\.css)" onload="this\.onload=null;this\.rel='stylesheet'"><noscript><link rel="stylesheet" href="\1"><\/noscript>/g,
        '<link rel="stylesheet" href="$1">');
    return html;
}

function aplicar(html, css) {
    html = deshacer(html);
    let primero = -1;
    let sangria = '';
    html = html.replace(RE_LINK, (tag, href, offset) => {
        if (primero < 0) {
            primero = offset;
            const ini = html.lastIndexOf('\n', offset) + 1;
            sangria = html.slice(ini, offset);
        }
        return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
    });
    if (primero < 0) throw new Error('sin hojas locales');
    const bloque = `<!-- css-critico:inicio --> <!-- Generado por scripts/generar-css-critico.js; no editar a mano. -->\n${sangria}<style id="css-critico">${css}</style>\n${sangria}<!-- css-critico:fin -->\n${sangria}`;
    return html.slice(0, primero) + bloque + html.slice(primero);
}

(async () => {
    const browser = await chromium.launch();
    let modelo = null;
    for (const pagina of PAGINAS) {
        const archivo = path.join(RAIZ, pagina);
        const html = fs.readFileSync(archivo, 'utf8');
        // Se mide con los <link> normales (sin el bloque crítico anterior).
        const limpio = deshacer(html);
        fs.writeFileSync(archivo, limpio);
        const css = await extraer(browser, pagina, hojasDe(limpio));
        fs.writeFileSync(archivo, aplicar(limpio, css));
        if (pagina === ARTICULO_MODELO) modelo = css;
        console.log(`${pagina}: ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB de CSS crítico`);
    }
    if (modelo) {
        const archivo = path.join(RAIZ, PLANTILLA);
        fs.writeFileSync(archivo, aplicar(fs.readFileSync(archivo, 'utf8'), modelo));
        console.log(`${PLANTILLA}: CSS crítico de ${ARTICULO_MODELO}`);
    }
    await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
