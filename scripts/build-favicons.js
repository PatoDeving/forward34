// Genera todos los favicons del sitio a partir del logo SVG fuente.
// Uso: node scripts/build-favicons.js
//
// Salida:
//   favicon.ico              — RAÍZ del repo, multi-resolución (16/32/48).
//                              Los navegadores lo piden automáticamente en
//                              /favicon.ico aunque no haya <link>, y muchas
//                              integraciones (Slack, lectores RSS, etc.) lo
//                              esperan ahí. Es el fallback universal.
//   public/favicon.svg       — vectorial, fondo lime, logo negro (modernos).
//   public/favicon-16.png    — 16x16
//   public/favicon-32.png    — 32x32
//   public/favicon-48.png    — 48x48
//   public/apple-touch-icon.png — 180x180 (iOS home screen)
//   public/icon-192.png      — 192x192 (Android / PWA manifest)
//   public/icon-512.png      — 512x512 (PWA install)

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const SRC_LOGO = path.join(ROOT, 'public', 'images', 'forward34-logo.svg');

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

async function renderPng(page, svg, size, outPath) {
    const html = `<!doctype html><html><head><style>
        html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px}
        svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, type: 'png', omitBackground: true });
}

// Empaqueta varios PNG en un contenedor .ico (PNG embebido, soportado por
// todos los navegadores modernos). Estructura: ICONDIR + N×ICONDIRENTRY +
// los bytes PNG concatenados.
function buildIco(pngEntries) {
    const count = pngEntries.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);       // reserved
    header.writeUInt16LE(1, 2);       // type 1 = icon
    header.writeUInt16LE(count, 4);   // image count

    const dir = Buffer.alloc(16 * count);
    let offset = 6 + 16 * count;
    const datas = [];

    pngEntries.forEach((entry, i) => {
        const { size, buffer } = entry;
        const base = i * 16;
        dir.writeUInt8(size >= 256 ? 0 : size, base + 0); // width  (0 => 256)
        dir.writeUInt8(size >= 256 ? 0 : size, base + 1); // height
        dir.writeUInt8(0, base + 2);   // palette
        dir.writeUInt8(0, base + 3);   // reserved
        dir.writeUInt16LE(1, base + 4);   // color planes
        dir.writeUInt16LE(32, base + 6);  // bits per pixel
        dir.writeUInt32LE(buffer.length, base + 8);  // data size
        dir.writeUInt32LE(offset, base + 12);        // data offset
        offset += buffer.length;
        datas.push(buffer);
    });

    return Buffer.concat([header, dir, ...datas]);
}

(async () => {
    const srcSvg = fs.readFileSync(SRC_LOGO, 'utf8');
    const paths = extractLogoPaths(srcSvg);
    if (paths.length === 0) throw new Error('No path found in source logo SVG');

    const faviconSvg = buildFaviconSvg(paths);
    fs.writeFileSync(path.join(OUT, 'favicon.svg'), faviconSvg);
    console.log('wrote public/favicon.svg');

    const browser = await chromium.launch();
    const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();

    const pngTargets = [
        { size: 16,  file: 'public/favicon-16.png' },
        { size: 32,  file: 'public/favicon-32.png' },
        { size: 48,  file: 'public/favicon-48.png' },
        { size: 180, file: 'public/apple-touch-icon.png' },
        { size: 192, file: 'public/icon-192.png' },
        { size: 512, file: 'public/icon-512.png' }
    ];

    for (const { size, file } of pngTargets) {
        await renderPng(page, faviconSvg, size, path.join(ROOT, file));
        console.log('wrote', file);
    }
    await browser.close();

    // favicon.ico (raíz) a partir de 16/32/48
    const icoEntries = [16, 32, 48].map((size) => ({
        size,
        buffer: fs.readFileSync(path.join(OUT, `favicon-${size}.png`))
    }));
    const ico = buildIco(icoEntries);
    fs.writeFileSync(path.join(ROOT, 'favicon.ico'), ico);
    console.log('wrote favicon.ico (root,', ico.length, 'bytes)');
})().catch((e) => { console.error(e); process.exit(1); });
