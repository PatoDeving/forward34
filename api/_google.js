// Acceso a APIs de Google con una cuenta de servicio, compartido por las
// funciones del sitio. Mismo mecanismo que usaba api/recurso.js: se firma un
// JWT con la llave privada y se cambia por un token de acceso, que se reusa
// entre invocaciones calientes para no pedir uno por cada lead.
//
// Variables de entorno:
//   GOOGLE_SA_CLIENT_EMAIL  — correo de la cuenta de servicio
//   GOOGLE_SA_PRIVATE_KEY   — llave privada (los \n pueden venir escapados)
// Compatibilidad: si no están, se cae a las de la landing de recursos
//   (RECURSO_SHEETS_CLIENT_EMAIL / RECURSO_SHEETS_PRIVATE_KEY).

const crypto = require('crypto');

const SCOPE_SHEETS = 'https://www.googleapis.com/auth/spreadsheets';

let tokenCache = { valor: null, expira: 0, scope: '' };

function credenciales() {
    const email = process.env.GOOGLE_SA_CLIENT_EMAIL || process.env.RECURSO_SHEETS_CLIENT_EMAIL;
    const key = String(process.env.GOOGLE_SA_PRIVATE_KEY || process.env.RECURSO_SHEETS_PRIVATE_KEY || '')
        .replace(/\\n/g, '\n');
    return { email, key };
}

function hayCredenciales() {
    const { email, key } = credenciales();
    return Boolean(email && key);
}

function base64url(entrada) {
    return Buffer.from(entrada).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerToken(scope = SCOPE_SHEETS) {
    const ahora = Math.floor(Date.now() / 1000);
    if (tokenCache.valor && tokenCache.scope === scope && tokenCache.expira - 60 > ahora) {
        return tokenCache.valor;
    }

    const { email, key } = credenciales();
    if (!email || !key) throw new Error('Faltan credenciales de la cuenta de servicio de Google');

    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64url(JSON.stringify({
        iss: email,
        scope,
        aud: 'https://oauth2.googleapis.com/token',
        iat: ahora,
        exp: ahora + 3600
    }));
    const sinFirmar = `${header}.${claims}`;
    const firma = base64url(crypto.createSign('RSA-SHA256').update(sinFirmar).sign(key));

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${sinFirmar}.${firma}`
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        throw new Error(`Google no dio token (${res.status}): ${JSON.stringify(data).slice(0, 200)}`);
    }

    tokenCache = { valor: data.access_token, expira: ahora + (data.expires_in || 3600), scope };
    return tokenCache.valor;
}

// Agrega una fila al final de la hoja. `rango` incluye el nombre de la pestaña.
async function agregarFilaSheet(sheetId, rango, fila) {
    if (!sheetId) throw new Error('Falta el identificador de la hoja de cálculo');
    const token = await obtenerToken(SCOPE_SHEETS);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`
        + `/values/${encodeURIComponent(rango)}:append`
        + '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values: [fila] })
    });
    if (!res.ok) {
        const detalle = await res.text();
        // Un token invalidado no debe envenenar las siguientes invocaciones.
        if (res.status === 401) tokenCache = { valor: null, expira: 0, scope: '' };
        throw new Error(`Sheets respondió ${res.status}: ${detalle.slice(0, 200)}`);
    }
}

module.exports = { hayCredenciales, obtenerToken, agregarFilaSheet, SCOPE_SHEETS };
