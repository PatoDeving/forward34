// Genera todos los favicons del sitio a partir del logo SVG fuente.
// Uso: node scripts/build-favicons.js
//
// Salida en public/:
//   favicon.svg              — vectorial, fondo lime, logo negro (modernos)
//   favicon-16.png           — 16x16
//   favicon-32.png           — 32x32
//   apple-touch-icon.png     — 180x180 (iOS home screen)
//   icon-192.png             — 192x192 (Android / PWA manifest)
//   icon-512.png             — 512x512 (PWA install)

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public');
const SRC_LOGO = path.join(__dirname, '..', 'public', 'images', 'forward34-logo.svg');

const LIME = '#D7FF3A';

function extractLogoPaths(svg) {
    const paths = [];
    const re = /<path[^>]*d="([^"]+)"/g;
    let m;
    while ((m = re.exec(svg))) paths.push(m[1]);
    return paths;
}

function buildFaviconSvg(paths) {
    // viewBox 64x64: tile con logo de 50 centrado (padding 7).
    const inner = paths.map((d) =>
        `<path d="${d}" fill="#0B0B0F" transform="translate(7,7)"/>`
    ).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" ry="14" fill="${LIME}"/>
  ${inner}
</svg>`;
}

async function render(svg, size, outPath) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1
    });
    const page = await ctx.newPage();
    const html = `<!doctype html><html><head><style>
        html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px}
        svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, type: 'png', omitBackground: true });
    await browser.close();
}

(async () => {
    const srcSvg = fs.readFileSync(SRC_LOGO, 'utf8');
    const paths = extractLogoPaths(srcSvg);
    if (paths.length === 0) throw new Error('No path found in source logo SVG');

    const faviconSvg = buildFaviconSvg(paths);
    fs.writeFileSync(path.join(OUT, 'favicon.svg'), faviconSvg);
    console.log('wrote favicon.svg');

    const sizes = [
        { size: 16,  file: 'favicon-16.png' },
        { size: 32,  file: 'favicon-32.png' },
        { size: 180, file: 'apple-touch-icon.png' },
        { size: 192, file: 'icon-192.png' },
        { size: 512, file: 'icon-512.png' }
    ];

    for (const { size, file } of sizes) {
        await render(faviconSvg, size, path.join(OUT, file));
        console.log('wrote', file);
    }
})().catch((e) => { console.error(e); process.exit(1); });
