// Vercel serverless function — captura de leads de los recursos descargables
// (mecánica comment-to-DM de Instagram). Sirve a recurso.html.
//
// NO CONFUNDIR con api/lead.js, que es la captura del diagnóstico IA.
// Son dos flujos independientes y esta función no toca aquel.
//
// Hace dos cosas, ninguna bloqueante: si el Sheet o el correo fallan,
// la persona igual recibe su PDF en pantalla.
//   1) Guarda el lead en un Google Sheet (fecha, nombre, correo, recurso,
//      recurso_id, fuente).
//   2) Le envía el recurso por correo vía Resend, reusando la misma cuenta
//      que ya usa api/lead.js.
//
// Variables de entorno:
//   RESEND_API_KEY                 ← YA EXISTE. Solo se lee, no se modifica.
//   LEAD_FROM                      ← YA EXISTE. Se usa como remitente si no
//                                    se define RECURSO_MAIL_FROM.
//   RECURSO_SHEETS_CLIENT_EMAIL    correo de la cuenta de servicio de Google
//   RECURSO_SHEETS_PRIVATE_KEY     llave privada de esa cuenta de servicio
//   RECURSO_SHEETS_SPREADSHEET_ID  id del Google Sheet destino
//   RECURSO_SHEETS_RANGE           opcional, default "Leads!A:F"
//   RECURSO_MAIL_FROM              opcional, remitente propio de los recursos
//   RECURSO_SITE_URL               opcional, default https://forward34.com

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// El catálogo es el mismo archivo que lee la página. Se carga con require
// (que es lo que Vercel rastrea al empaquetar la función) y, por si acaso,
// se cae a leerlo del disco. Si ninguna vía funciona la función responde
// "recurso no encontrado" en vez de reventar con un 500.
function cargarCatalogo() {
    try {
        return require('../public/data/recursos.json');
    } catch (e1) {
        try {
            const ruta = path.join(__dirname, '..', 'public', 'data', 'recursos.json');
            return JSON.parse(fs.readFileSync(ruta, 'utf8'));
        } catch (e2) {
            console.error('[recurso] no se pudo cargar el catálogo:', e1.message, '|', e2.message);
            return { recursos: [] };
        }
    }
}

const catalogo = cargarCatalogo();
const RECURSOS = Array.isArray(catalogo.recursos) ? catalogo.recursos : [];

const SITIO = process.env.RECURSO_SITE_URL || 'https://forward34.com';
const RANGO_SHEET = process.env.RECURSO_SHEETS_RANGE || 'Leads!A:F';

const escapeHtml = (str) =>
    String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

function buscarRecurso(slug) {
    if (typeof slug !== 'string') return null;
    const limpio = slug.trim().toLowerCase();
    return RECURSOS.find((r) => r.slug === limpio) || null;
}

// Validación permisiva: rechaza basura evidente sin castigar direcciones
// legítimas raras. La validación real la hace el correo que llega.
function correoValido(correo) {
    if (typeof correo !== 'string') return false;
    if (correo.length < 6 || correo.length > 254) return false;
    return /^[^\s@]+@[^\s@,]+\.[^\s@,]{2,}$/.test(correo);
}

function limpiarTexto(valor, max) {
    return String(valor || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

// La fuente viene de la URL (utm_source), así que se acota a algo inofensivo
// antes de escribirla en el Sheet.
function limpiarFuente(valor) {
    const limpio = limpiarTexto(valor, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return limpio || 'directo';
}

function fechaMexico() {
    const p = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((acc, x) => {
        acc[x.type] = x.value;
        return acc;
    }, {});
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/* ------------------------------------------------------------------
   Google Sheets vía cuenta de servicio.
   El JWT se firma a mano con el módulo crypto de Node para no agregar
   dependencias nuevas al proyecto.
------------------------------------------------------------------ */

function base64url(buffer) {
    return Buffer.from(buffer)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Se reusa entre invocaciones calientes: no pide un token por cada lead.
let tokenCache = { valor: null, expira: 0 };

async function obtenerToken() {
    const ahora = Math.floor(Date.now() / 1000);
    if (tokenCache.valor && tokenCache.expira - 60 > ahora) return tokenCache.valor;

    const clientEmail = process.env.RECURSO_SHEETS_CLIENT_EMAIL;
    // Vercel guarda los saltos de línea escapados; hay que devolverlos.
    const privateKey = String(process.env.RECURSO_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Faltan RECURSO_SHEETS_CLIENT_EMAIL o RECURSO_SHEETS_PRIVATE_KEY');
    }

    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64url(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        iat: ahora,
        exp: ahora + 3600
    }));

    const sinFirmar = `${header}.${claims}`;
    const firma = base64url(crypto.createSign('RSA-SHA256').update(sinFirmar).sign(privateKey));

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${sinFirmar}.${firma}`
        })
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error('Google rechazó las credenciales: ' + (data.error_description || data.error || res.status));
    }

    tokenCache = { valor: data.access_token, expira: ahora + (data.expires_in || 3600) };
    return tokenCache.valor;
}

async function guardarEnSheet(fila) {
    const sheetId = process.env.RECURSO_SHEETS_SPREADSHEET_ID;
    if (!sheetId) throw new Error('Falta RECURSO_SHEETS_SPREADSHEET_ID');

    const token = await obtenerToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`
        + `/values/${encodeURIComponent(RANGO_SHEET)}:append`
        + '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ values: [fila] })
    });

    if (!res.ok) {
        const detalle = await res.text();
        // Un token invalidado no debe envenenar las siguientes invocaciones.
        if (res.status === 401) tokenCache = { valor: null, expira: 0 };
        throw new Error(`Sheets respondió ${res.status}: ${detalle.slice(0, 200)}`);
    }
}

/* ------------------------------------------------------------------
   Correo con el recurso (Resend — la misma cuenta que ya usa lead.js).
------------------------------------------------------------------ */

function plantillaCorreo(nombre, recurso, enlacePdf) {
    const saludo = nombre ? `Hola ${escapeHtml(String(nombre).split(/\s+/)[0])},` : 'Hola,';
    const bullets = (recurso.bullets || [])
        .map((b) => `<li style="margin-bottom:10px;color:rgba(11,11,15,0.65)">${escapeHtml(b)}</li>`)
        .join('');

    return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0B0B0F;background:#F4EFE6;margin:0;padding:32px 16px">
<div style="max-width:560px;margin:0 auto;background:#FAFAF7;border-radius:16px;padding:32px;border:1px solid rgba(11,11,15,0.08)">

    <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(11,11,15,0.5)">Forward34</p>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${saludo}</p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6">
        Aquí está tu recurso: <strong>${escapeHtml(recurso.titulo)}</strong>
    </p>

    <ul style="margin:0 0 28px;padding-left:20px;font-size:14px;line-height:1.6">${bullets}</ul>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px">
        <tr><td style="background:#0B0B0F;border-radius:999px">
            <a href="${enlacePdf}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#F4EFE6;text-decoration:none">Descargar el PDF</a>
        </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:rgba(11,11,15,0.5);line-height:1.6">
        Si el botón no abre, copia este enlace:<br>
        <a href="${enlacePdf}" style="color:#0B0B0F;word-break:break-all">${enlacePdf}</a>
    </p>

    <hr style="border:none;border-top:1px solid rgba(11,11,15,0.08);margin:28px 0">

    <p style="margin:0;font-size:12px;color:rgba(11,11,15,0.45);line-height:1.6">
        Recibes este correo porque pediste este recurso en
        <a href="${SITIO}" style="color:rgba(11,11,15,0.6)">forward34.com</a>.
        De vez en cuando compartimos contenido sobre liderazgo, IA y organizaciones.
        Si prefieres no recibirlo, responde a este correo y te damos de baja.
    </p>

</div>
</body></html>`;
}

async function enviarCorreo(nombre, correo, recurso) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY no está definida');

    const from = process.env.RECURSO_MAIL_FROM
        || process.env.LEAD_FROM
        || 'Forward34 <leads@forward34.com>';

    const enlacePdf = `${SITIO}${recurso.pdf}`;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            from,
            to: [correo],
            subject: `Tu recurso: ${recurso.titulo}`,
            html: plantillaCorreo(nombre, recurso, enlacePdf)
        })
    });

    if (!res.ok) {
        const detalle = await res.text();
        throw new Error(`Resend respondió ${res.status}: ${detalle.slice(0, 200)}`);
    }
}

/* ------------------------------------------------------------------ */

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    // Honeypot anti-bot: mismo nombre de campo que usa api/lead.js.
    // Se responde 200 a propósito para no enseñarle al bot que fue detectado.
    if (body.website) {
        return res.status(200).json({ ok: true });
    }

    // El PDF sale SIEMPRE del catálogo del servidor, nunca de lo que manda
    // el navegador: así nadie puede hacer que el correo lleve un enlace ajeno.
    const recurso = buscarRecurso(body.recurso_id);
    if (!recurso) {
        return res.status(400).json({ error: 'Recurso no encontrado' });
    }

    const correo = limpiarTexto(body.correo, 254).toLowerCase();
    if (!correoValido(correo)) {
        return res.status(400).json({ error: 'Correo inválido' });
    }

    const nombre = limpiarTexto(body.nombre, 80);
    const fuente = limpiarFuente(body.fuente);

    // fecha, nombre, correo, recurso, recurso_id, fuente
    const fila = [fechaMexico(), nombre, correo, recurso.titulo, recurso.slug, fuente];

    console.log('[recurso] new', JSON.stringify({
        recurso: recurso.slug, fuente, correo
    }));

    // Ninguna de las dos tareas puede tumbar la entrega del recurso.
    const [resSheet, resCorreo] = await Promise.allSettled([
        guardarEnSheet(fila),
        enviarCorreo(nombre, correo, recurso)
    ]);

    if (resSheet.status === 'rejected') {
        // El log de Vercel queda como red de seguridad para recuperar el lead.
        console.warn('[recurso] sheet no guardado:', resSheet.reason && resSheet.reason.message);
        console.warn('[recurso] fila perdida:', JSON.stringify(fila));
    }
    if (resCorreo.status === 'rejected') {
        console.warn('[recurso] correo no enviado:', resCorreo.reason && resCorreo.reason.message);
    }

    return res.status(200).json({
        ok: true,
        pdf: recurso.pdf,
        titulo: recurso.titulo,
        correoEnviado: resCorreo.status === 'fulfilled'
    });
};
