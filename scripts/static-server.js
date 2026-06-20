// Servidor estático mínimo que emula el comportamiento de Vercel con
// cleanUrls:true y trailingSlash:false, para que los tests de Playwright
// validen las URLs limpias igual que en producción.
//
// Reglas:
//   /                  -> index.html
//   /pagina.html       -> 308 redirect a /pagina   (cleanUrls)
//   /pagina            -> sirve pagina.html         (cleanUrls)
//   /ruta/con.ext      -> sirve el archivo tal cual (css, js, png, ico…)
//   no existe          -> 404 + body de 404.html
//
// Uso: node scripts/static-server.js [puerto]

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.argv[2], 10) || 4123;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

function safeJoin(p) {
    // Evita path traversal fuera de ROOT.
    const full = path.normalize(path.join(ROOT, p));
    if (!full.startsWith(ROOT)) return null;
    return full;
}

function send(res, status, body, type) {
    res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
    res.end(body);
}

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err, data) => {
        if (err) return notFound(res);
        send(res, 200, data, MIME[ext] || 'application/octet-stream');
    });
}

function notFound(res) {
    const f = path.join(ROOT, '404.html');
    fs.readFile(f, (err, data) => {
        if (err) return send(res, 404, 'Not Found');
        send(res, 404, data, MIME['.html']);
    });
}

const server = http.createServer((req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
        return notFound(res);
    }

    // Raíz -> index.html
    if (pathname === '/') {
        return serveFile(res, path.join(ROOT, 'index.html'));
    }

    // cleanUrls: /pagina.html -> 308 -> /pagina
    if (pathname.endsWith('.html')) {
        const clean = pathname.slice(0, -'.html'.length);
        res.writeHead(308, { Location: clean || '/' });
        return res.end();
    }

    const ext = path.extname(pathname);

    // Sin extensión: intentar servir pagina.html (cleanUrls)
    if (!ext) {
        const htmlPath = safeJoin(pathname + '.html');
        if (htmlPath && fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
            return serveFile(res, htmlPath);
        }
        return notFound(res);
    }

    // Con extensión: servir el archivo tal cual.
    const filePath = safeJoin(pathname);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return serveFile(res, filePath);
    }
    return notFound(res);
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`static-server (cleanUrls emulado) en http://127.0.0.1:${PORT}`);
});
