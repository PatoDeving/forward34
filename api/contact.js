// Vercel serverless function — formulario de contacto (contacto.html).
// Igual que api/lead.js: loguea siempre a Vercel logs y, si RESEND_API_KEY
// está definida, envía notificación interna + confirmación al remitente.
//
// Variables de entorno opcionales:
//   RESEND_API_KEY  → API key de https://resend.com
//   LEAD_TO         → destino interno (default: hector@forward34.com)
//   LEAD_FROM       → remitente verificado en Resend (default: leads@forward34.com)
//   LEAD_REPLY_TO   → reply-to del correo de confirmación (default: hector@forward34.com)

const escapeHtml = (str) =>
    String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const SERVICIOS = {
    diagnostico: 'Diagnóstico estratégico',
    transformacion: 'Transformación organizacional',
    'ia-tecnologia': 'IA y tecnología aplicada',
    experiencias: 'Experiencias corporativas',
    coaching: 'Coaching y liderazgo',
    medicion: 'Medición y seguimiento',
    otro: 'Otro'
};

function buildInternalText(c) {
    return `Nuevo mensaje de contacto
==========================

CONTACTO
  Nombre:    ${c.nombre || '—'}
  Empresa:   ${c.empresa || '—'}
  Cargo:     ${c.cargo || '—'}
  Correo:    ${c.email || '—'}
  Teléfono:  ${c.telefono || '—'}
  Servicio:  ${c.servicioLabel || '—'}

MENSAJE
${c.mensaje || '—'}

Origen: ${c.source || 'contacto.html'}
Timestamp (UTC): ${new Date().toISOString()}
`;
}

function buildInternalHtml(c) {
    return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0B0B0F;max-width:640px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px;border-bottom:2px solid #D7FF3A;padding-bottom:8px">Nuevo mensaje de contacto</h2>
        <table style="border-collapse:collapse;font-size:14px">
            <tr><td style="padding:4px 12px 4px 0;color:#666">Nombre</td><td><strong>${escapeHtml(c.nombre)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Empresa</td><td>${escapeHtml(c.empresa)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Cargo</td><td>${escapeHtml(c.cargo)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Correo</td><td><a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Teléfono</td><td>${escapeHtml(c.telefono)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Servicio</td><td>${escapeHtml(c.servicioLabel)}</td></tr>
        </table>
        <h3 style="margin-top:24px">Mensaje</h3>
        <p style="white-space:pre-wrap;background:#FAFAF7;padding:16px;border-radius:8px;font-size:14px;line-height:1.6">${escapeHtml(c.mensaje)}</p>
        <p style="margin-top:24px;font-size:12px;color:#888">Origen: ${escapeHtml(c.source || 'contacto.html')} · ${new Date().toISOString()}</p>
    </body></html>`;
}

function buildConfirmationText(c) {
    const firstName = String(c.nombre || '').split(/\s+/)[0] || '';
    return `Hola ${firstName},

Gracias por escribir a Forward34. Recibimos tu mensaje y te respondemos
en menos de 24 horas hábiles.

Resumen de lo que nos enviaste:
${c.mensaje || '—'}

Si es urgente, puedes responder directamente a este correo.

— Equipo Forward34
forward34.com
`;
}

function buildConfirmationHtml(c) {
    const firstName = escapeHtml(String(c.nombre || '').split(/\s+/)[0] || '');
    return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0B0B0F;background:#FAFAF7;margin:0;padding:32px 16px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid rgba(11,11,15,0.08)">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#666">Forward34</p>
    <h1 style="margin:8px 0 16px;font-size:22px;letter-spacing:-0.02em">Hola ${firstName}, recibimos tu mensaje.</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Gracias por escribirnos. Te respondemos en menos de <strong>24 horas hábiles</strong>.</p>
    <p style="margin:0 0 8px;font-size:13px;color:#666">Esto fue lo que nos enviaste:</p>
    <p style="white-space:pre-wrap;background:#FAFAF7;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;margin:0 0 24px">${escapeHtml(c.mensaje)}</p>
    <p style="margin:0"><a href="https://forward34.com/consultoria-ia.html" style="display:inline-block;background:#0B0B0F;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Conocer la consultoría IA</a></p>
    <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid rgba(11,11,15,0.08);font-size:12px;color:#888">Forward34 · <a href="https://forward34.com" style="color:#888">forward34.com</a></p>
</div>
</body></html>`;
}

async function sendViaResend(c) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { sent: false, reason: 'RESEND_API_KEY not set' };

    const to = process.env.LEAD_TO || 'hector@forward34.com';
    const from = process.env.LEAD_FROM || 'Forward34 Leads <leads@forward34.com>';
    const replyTo = process.env.LEAD_REPLY_TO || 'hector@forward34.com';
    const headers = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };

    // 1) Notificación interna
    const internalRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            from,
            to: [to],
            reply_to: c.email || undefined,
            subject: `Contacto — ${c.empresa || c.nombre || 'Nuevo'} (${c.servicioLabel || 'sin servicio'})`,
            text: buildInternalText(c),
            html: buildInternalHtml(c)
        })
    });

    if (!internalRes.ok) {
        const text = await internalRes.text();
        return { sent: false, reason: `Resend internal ${internalRes.status}: ${text}` };
    }

    // 2) Confirmación al remitente (best-effort)
    let confirmationSent = false;
    let confirmationReason = null;
    if (c.email) {
        const confirmRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                from,
                to: [c.email],
                reply_to: replyTo,
                subject: 'Recibimos tu mensaje — Forward34',
                text: buildConfirmationText(c),
                html: buildConfirmationHtml(c)
            })
        }).catch((err) => ({ ok: false, _err: err }));

        if (confirmRes && confirmRes.ok) {
            confirmationSent = true;
        } else if (confirmRes && typeof confirmRes.text === 'function') {
            confirmationReason = `Resend confirmation ${confirmRes.status}: ${await confirmRes.text()}`;
        } else {
            confirmationReason = 'Confirmation exception';
        }
    }

    return { sent: true, confirmationSent, confirmationReason };
}

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

    if (!body.email || !body.nombre || !body.mensaje) {
        return res.status(400).json({ error: 'Faltan campos: nombre, email y mensaje son requeridos' });
    }

    // Honeypot anti-bot
    if (body.website) {
        return res.status(200).json({ ok: true });
    }

    const servicioKey = String(body.servicio || '').slice(0, 50);
    const contact = {
        nombre: String(body.nombre || '').slice(0, 200),
        empresa: String(body.empresa || '').slice(0, 200),
        cargo: String(body.cargo || '').slice(0, 200),
        email: String(body.email || '').slice(0, 200),
        telefono: String(body.telefono || '').slice(0, 60),
        servicio: servicioKey,
        servicioLabel: SERVICIOS[servicioKey] || (servicioKey ? servicioKey : '—'),
        mensaje: String(body.mensaje || '').slice(0, 4000),
        source: String(body.source || 'contacto.html').slice(0, 200)
    };

    console.log('[contact] new', JSON.stringify({
        empresa: contact.empresa, email: contact.email, servicio: contact.servicio
    }));

    const emailResult = await sendViaResend(contact).catch((err) => ({
        sent: false, reason: 'Exception: ' + (err && err.message ? err.message : String(err))
    }));

    if (!emailResult.sent) {
        console.warn('[contact] email not sent:', emailResult.reason);
    } else if (emailResult.confirmationReason) {
        console.warn('[contact] confirmation not sent:', emailResult.confirmationReason);
    }

    return res.status(200).json({
        ok: true,
        emailSent: emailResult.sent,
        confirmationSent: !!emailResult.confirmationSent
    });
};
