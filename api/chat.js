// Agente de recepción del sitio: responde el chat y captura contactos.
//
// Antes vivía en la máquina de Tona (tona34.com/api/f34/chat). Se trajo aquí
// para que el backend del sitio de Forward34 no dependa de otro producto.
// La lógica es la misma: límite de mensajes por IP, historial acotado, una
// herramienta `enviar_lead` que el modelo llama cuando reúne un contacto,
// correo al equipo y, si está configurada, una fila en la hoja de cálculo.
//
// Variables de entorno:
//   GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY — cuenta de servicio con rol
//                           Vertex AI User; es la vía que usa el crédito de Google
//   GEMINI_API_KEY        — respaldo por AI Studio si no hay cuenta de servicio
//   CHAT_MODEL            — modelo; por defecto google/gemini-2.5-flash
//   GOOGLE_PROJECT_ID     — proyecto de Google Cloud; por defecto forward34-sitio
//   VERTEX_LOCATION       — región de Vertex; por defecto us-central1
//   CHAT_LEAD_TO          — destino de los avisos; por defecto LEAD_TO o hector@
//   CHAT_SHEETS_ID        — hoja donde se guardan los contactos (opcional)
//   CHAT_SHEETS_RANGE     — pestaña y rango; por defecto 'Chat!A:J'
//   RESEND_API_KEY, LEAD_FROM — ya usados por los demás formularios

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hayCredenciales, agregarFilaSheet, obtenerToken, SCOPE_CLOUD } = require('./_google');

const MODELO = process.env.CHAT_MODEL || 'google/gemini-2.5-flash';
const PROYECTO = process.env.GOOGLE_PROJECT_ID || 'forward34-sitio';
const REGION = process.env.VERTEX_LOCATION || 'us-central1';
// Vertex AI expone un endpoint compatible con OpenAI: mismos `messages`, `tools`
// y `tool_calls`, así que la lógica del agente no cambia por el proveedor. Se usa
// Vertex (y no la API de AI Studio) porque es la vía que consume el crédito de
// Google Cloud de la empresa; AI Studio se cobra aparte a la tarjeta.
const ENDPOINT = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROYECTO}`
    + `/locations/${REGION}/endpoints/openapi/chat/completions`;
// Respaldo: si no hay cuenta de servicio pero sí una llave de AI Studio, se usa esa.
const ENDPOINT_ESTUDIO = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const ORIGENES = new Set(['https://forward34.com', 'https://www.forward34.com']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

// ---------------------------------------------------------------- prompt
// El texto vive en data/f34_prompt.md, versionado junto al sitio.
let promptCache = null;
function systemPrompt() {
    if (promptCache) return promptCache;
    for (const ruta of [path.join(process.cwd(), 'data', 'f34_prompt.md'),
                        path.join(__dirname, '..', 'data', 'f34_prompt.md')]) {
        try {
            const t = fs.readFileSync(ruta, 'utf8').trim();
            if (t) { promptCache = t; return t; }
        } catch { /* siguiente ruta */ }
    }
    // Sin el archivo el agente no debe inventar: responde lo mínimo y deriva.
    promptCache = 'Eres el agente de recepción digital de Forward 34 (forward34.com). '
        + 'Responde con brevedad, en tono institucional y directo, y pide nombre, empresa '
        + 'y correo para que el equipo contacte a la persona. Si no sabes algo, dilo y deriva '
        + 'al equipo. No inventes datos, precios ni nombres de clientes.';
    return promptCache;
}

const HERRAMIENTA_LEAD = {
    type: 'function',
    function: {
        name: 'enviar_lead',
        description: 'Registra el contacto del visitante y avisa al equipo. Llámala en cuanto '
            + 'tengas al menos nombre + correo + qué busca el visitante. Marca es_gobierno '
            + 'si es una dependencia o entidad del sector público.',
        parameters: {
            type: 'object',
            properties: {
                nombre: { type: 'string' },
                correo: { type: 'string' },
                empresa: { type: 'string' },
                telefono: { type: 'string' },
                tipo_organizacion: { type: 'string', description: 'empresa privada, institución financiera, gobierno, otro' },
                que_busca: { type: 'string' },
                es_gobierno: { type: 'boolean', description: 'true si es gobierno/sector público' },
                resumen: { type: 'string', description: 'resumen de 1-3 líneas de la conversación' }
            },
            required: ['nombre', 'correo', 'que_busca']
        }
    }
};

// ------------------------------------------------------- límite por IP
// En funciones serverless el estado solo dura lo que vive la instancia, así que
// esto frena ráfagas desde una misma IP, no a un atacante decidido. Es la misma
// protección que había antes; el gasto real lo acota el tamaño de la respuesta.
const VENTANA_MS = 5 * 60 * 1000;
const MAX_POR_VENTANA = 20;
const visitas = new Map();

function excedeLimite(ip) {
    const ahora = Date.now();
    const previas = (visitas.get(ip) || []).filter((t) => ahora - t < VENTANA_MS);
    previas.push(ahora);
    visitas.set(ip, previas);
    if (visitas.size > 500) {
        for (const [k, v] of visitas) if (!v.some((t) => ahora - t < VENTANA_MS)) visitas.delete(k);
    }
    return previas.length > MAX_POR_VENTANA;
}

// ------------------------------------------------------------- memoria
// Contactos recientes, para no mandarle al equipo un correo por cada vez que el
// modelo vuelve a llamar la herramienta mientras el visitante sigue escribiendo.
const recientes = new Map();
const DEDUP_MS = 60 * 60 * 1000;

function yaAvisado(correo) {
    const ahora = Date.now();
    for (const [k, t] of recientes) if (ahora - t > DEDUP_MS) recientes.delete(k);
    const key = String(correo || '').toLowerCase();
    if (!key) return false;
    if (recientes.has(key)) return true;
    recientes.set(key, ahora);
    return false;
}

// -------------------------------------------------------------- helpers
function limpiar(valor, max) {
    // Se quitan los saltos de línea para que nadie fabrique líneas falsas en el
    // correo que recibe el equipo.
    return String(valor == null ? '' : valor).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function cors(origen) {
    const permitido = ORIGENES.has(origen) ? origen : 'https://forward34.com';
    return {
        'Access-Control-Allow-Origin': permitido,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin'
    };
}

function ipDe(req) {
    const xff = String(req.headers['x-forwarded-for'] || '');
    return xff ? xff.split(',')[0].trim() : (req.socket && req.socket.remoteAddress) || 'desconocida';
}

function fechaMexico() {
    return new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', hour12: false });
}

// --------------------------------------------------------------- modelo
async function llamarModelo(messages, conHerramientas) {
    // Vertex AI si hay cuenta de servicio (consume el crédito de Google Cloud);
    // si no, la llave de AI Studio como respaldo.
    let endpoint = ENDPOINT;
    let modelo = MODELO;
    let autorizacion;
    if (hayCredenciales()) {
        autorizacion = `Bearer ${await obtenerToken(SCOPE_CLOUD)}`;
    } else if (process.env.GEMINI_API_KEY) {
        endpoint = ENDPOINT_ESTUDIO;
        modelo = modelo.replace(/^google\//, '');
        autorizacion = `Bearer ${process.env.GEMINI_API_KEY}`;
    } else {
        const e = new Error('Agente no disponible (sin llave configurada).');
        e.status = 503; throw e;
    }

    const payload = { model: modelo, messages, temperature: 0.4, max_tokens: 700 };
    if (conHerramientas) payload.tools = [HERRAMIENTA_LEAD];

    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), 45000);
    let res;
    try {
        res = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: autorizacion, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl.signal
        });
    } finally {
        clearTimeout(reloj);
    }
    if (!res.ok) {
        const detalle = await res.text();
        console.warn('[chat] modelo', res.status, detalle.slice(0, 200));
        const e = new Error('El agente no pudo responder en este momento.');
        e.status = 502; throw e;
    }
    return res.json();
}

// ----------------------------------------------------------- aviso y hoja
async function avisarPorCorreo(lead) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { enviado: false, motivo: 'RESEND_API_KEY no configurada' };

    const to = process.env.CHAT_LEAD_TO || process.env.LEAD_TO || 'hector@forward34.com';
    const from = process.env.LEAD_FROM || 'Forward34 Leads <leads@forward34.com>';
    const correoTxt = lead.correo_valido ? lead.correo : `${lead.correo} (formato dudoso, verificar)`;
    const lineas = [
        'Nuevo contacto desde el chat del sitio',
        '',
        `Nombre:    ${lead.nombre || '(no dio)'}`,
        `Correo:    ${correoTxt}`,
        `Empresa:   ${lead.empresa || '(no dio)'}`,
        `Teléfono:  ${lead.telefono || '(no dio)'}`,
        `Tipo:      ${lead.tipo_organizacion || '(no dijo)'}`,
        `Qué busca: ${lead.que_busca || '(no dijo)'}`,
        '',
        `Resumen:   ${lead.resumen || '(sin resumen)'}`,
        '',
        lead.es_gobierno ? 'GOBIERNO O SECTOR PÚBLICO: requiere aprobación previa de Héctor antes de cualquier comunicación formal.' : '',
        `Fecha: ${fechaMexico()}`
    ].filter(Boolean);

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: [to],
            reply_to: lead.correo_valido ? lead.correo : undefined,
            subject: `Chat — ${lead.empresa || lead.nombre || 'Nuevo contacto'}${lead.es_gobierno ? ' (gobierno)' : ''}`,
            text: lineas.join('\n')
        })
    });
    if (!res.ok) {
        const detalle = await res.text();
        return { enviado: false, motivo: `Resend ${res.status}: ${detalle.slice(0, 200)}` };
    }
    return { enviado: true };
}

async function guardarEnHoja(lead) {
    const sheetId = process.env.CHAT_SHEETS_ID;
    if (!sheetId || !hayCredenciales()) return { guardado: false, motivo: 'hoja no configurada' };
    await agregarFilaSheet(sheetId, process.env.CHAT_SHEETS_RANGE || 'Chat!A:J', [
        fechaMexico(), lead.nombre, lead.correo, lead.empresa, lead.telefono,
        lead.tipo_organizacion, lead.que_busca, lead.es_gobierno ? 'sí' : 'no',
        lead.resumen, lead.id
    ]);
    return { guardado: true };
}

async function registrarLead(args, ip) {
    const correo = limpiar(args.correo, 160).toLowerCase();
    const lead = {
        id: crypto.randomBytes(6).toString('base64url'),
        nombre: limpiar(args.nombre, 120),
        correo,
        empresa: limpiar(args.empresa, 160),
        telefono: limpiar(args.telefono, 60),
        tipo_organizacion: limpiar(args.tipo_organizacion, 80),
        que_busca: limpiar(args.que_busca, 2000),
        es_gobierno: Boolean(args.es_gobierno),
        resumen: limpiar(args.resumen, 2000),
        correo_valido: EMAIL_RE.test(correo),
        ip,
        creado: new Date().toISOString()
    };

    if (yaAvisado(correo)) {
        console.log('[chat] lead repetido en menos de una hora, no se vuelve a avisar:', correo);
        return lead;
    }

    console.log('[chat] lead', JSON.stringify({
        correo: lead.correo, empresa: lead.empresa, es_gobierno: lead.es_gobierno
    }));

    // Ni el correo ni la hoja pueden tumbar la conversación del visitante.
    const [aviso, hoja] = await Promise.allSettled([avisarPorCorreo(lead), guardarEnHoja(lead)]);
    if (aviso.status === 'rejected' || (aviso.value && !aviso.value.enviado)) {
        console.warn('[chat] aviso no enviado:', aviso.reason || aviso.value.motivo);
    }
    if (hoja.status === 'rejected') console.warn('[chat] hoja:', hoja.reason && hoja.reason.message);
    return lead;
}

// -------------------------------------------------------------- handler
module.exports = async (req, res) => {
    const origen = req.headers.origin || '';
    const cabeceras = cors(origen);
    for (const [k, v] of Object.entries(cabeceras)) res.setHeader(k, v);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ reply: 'Método no permitido.' });
    }

    const ip = ipDe(req);
    if (excedeLimite(ip)) {
        return res.status(429).json({ reply: 'Estás enviando mensajes muy rápido. Espera un momento.' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    // Historial acotado: últimos 20 turnos, contenido corto.
    const turnos = [];
    for (const m of (Array.isArray(body.messages) ? body.messages : []).slice(-20)) {
        const role = m && m.role === 'assistant' ? 'assistant' : 'user';
        const content = String((m && m.content) || '').trim().slice(0, 4000);
        if (content) turnos.push({ role, content });
    }
    if (!turnos.length) return res.status(200).json({ reply: '¿En qué te puedo ayudar?' });

    const mensajes = [{ role: 'system', content: systemPrompt() }, ...turnos];

    try {
        const data = await llamarModelo(mensajes, true);
        const msg = ((data.choices || [{}])[0] || {}).message || {};
        const llamadas = msg.tool_calls || [];

        if (llamadas.length) {
            // El modelo decidió capturar el contacto: se ejecuta y se le pide el cierre.
            mensajes.push(msg);
            for (const tc of llamadas) {
                const fn = tc.function || {};
                if (fn.name === 'enviar_lead') {
                    let args = {};
                    try { args = JSON.parse(fn.arguments || '{}'); } catch { args = {}; }
                    await registrarLead(args, ip);
                }
                mensajes.push({
                    role: 'tool',
                    tool_call_id: tc.id || '',
                    content: 'Lead registrado. El equipo lo recibió.'
                });
            }
            const cierre = await llamarModelo(mensajes, false);
            const reply = (((cierre.choices || [{}])[0] || {}).message || {}).content
                || 'Listo, tomé tus datos. Un miembro del equipo te contactará.';
            return res.status(200).json({ reply, lead_captured: true });
        }

        return res.status(200).json({ reply: (msg.content || '').trim() || '¿En qué te puedo ayudar?' });
    } catch (err) {
        const status = err.status || 500;
        if (status === 500) console.warn('[chat] error:', err && err.message);
        return res.status(status).json({
            reply: err.status ? err.message : 'Tuve un problema técnico. Intenta de nuevo en un momento.'
        });
    }
};
