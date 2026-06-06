// Renderiza imágenes Open Graph (1200x630 PNG) usando Chromium headless de Playwright.
// Uso: node scripts/build-og.js
// Las imágenes se escriben a public/images/og-*.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'public', 'images');

const VARIANTS = [
    {
        file: 'og-default.png',
        eyebrow: 'Forward34',
        title: 'Estrategia + Transformación',
        sub: 'Diseñamos e implementamos soluciones de transformación humana y tecnológica para organizaciones.'
    },
    {
        file: 'og-consultoria.png',
        eyebrow: 'Consultoría IA · Diagnóstico gratuito',
        title: 'Descubre el potencial de la IA en tu organización.',
        sub: '8 preguntas. 5 minutos. Un score por dimensión y los siguientes pasos.'
    }
];

function renderHtml({ eyebrow, title, sub }) {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--bg:#0B0B0F;--lime:#D7FF3A;--cream:#EEE7DA;--dim:rgba(238,231,218,0.6)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
body{background:var(--bg);color:var(--cream);padding:72px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
body::before{content:"";position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,rgba(215,255,58,0.18) 0%,transparent 60%);pointer-events:none}
.brand{display:flex;align-items:center;gap:14px;font-size:22px;font-weight:600;letter-spacing:-0.01em}
.brand-mark{width:36px;height:36px;background:var(--lime);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-weight:800;font-size:18px;letter-spacing:-0.02em}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:18px;color:var(--lime);font-weight:500;letter-spacing:0.02em;text-transform:none;margin-bottom:24px}
.eyebrow::before{content:"";width:8px;height:8px;background:var(--lime);border-radius:99px}
h1{font-size:64px;line-height:1.05;letter-spacing:-0.03em;font-weight:700;color:var(--cream);max-width:1000px;margin-bottom:24px}
p{font-size:24px;line-height:1.4;color:var(--dim);max-width:880px;font-weight:400}
.footer-row{display:flex;justify-content:space-between;align-items:flex-end;width:100%}
.url{font-size:18px;color:var(--dim);letter-spacing:0.04em;font-weight:500}
.tag{font-size:16px;color:var(--bg);background:var(--lime);padding:8px 16px;border-radius:99px;font-weight:600}
</style></head><body>
    <div class="brand"><div class="brand-mark">F</div>Forward34</div>
    <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
        <p>${sub}</p>
    </div>
    <div class="footer-row">
        <div class="url">forward34.com</div>
        <div class="tag">Estrategia + IA aplicada</div>
    </div>
</body></html>`;
}

(async () => {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const v of VARIANTS) {
        await page.setContent(renderHtml(v), { waitUntil: 'load' });
        await page.screenshot({ path: path.join(OUT_DIR, v.file), type: 'png', omitBackground: false });
        console.log('wrote', v.file);
    }
    await browser.close();
})().catch((err) => { console.error(err); process.exit(1); });
