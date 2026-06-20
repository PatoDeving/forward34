// Vercel serverless function — captura del diagnóstico IA
// Funciona sin config (loguea a Vercel logs). Si RESEND_API_KEY está
// definida, también envía dos correos vía Resend:
//   1) Notificación interna a LEAD_TO con el detalle del lead.
//   2) Confirmación al lead con su score y los siguientes pasos.
//
// Variables de entorno opcionales:
//   RESEND_API_KEY  → API key de https://resend.com (free tier ok)
//   LEAD_TO         → destino interno (default: hector@forward34.com)
//   LEAD_FROM       → remitente verificado en Resend (default: leads@forward34.com)
//   LEAD_REPLY_TO   → reply-to para el correo de confirmación al lead
//                     (default: hector@forward34.com)

const escapeHtml = (str) =>
    String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

function buildEmailBody(lead) {
    const dimRows = (lead.byDim || [])
        .map((d) => `  · ${d.name}: ${d.score}/${d.max}`)
        .join('\n');
    const answers = (lead.answers || [])
        .map((a, i) => `${i + 1}. [${a.dimension}] ${a.question}\n   → ${a.answer}`)
        .join('\n');

    return `Nuevo lead del diagnóstico IA
================================

CONTACTO
  Nombre:   ${lead.nombre || '—'}
  Correo:   ${lead.email || '—'}
  Empresa:  ${lead.empresa || '—'}
  Cargo:    ${lead.cargo || '—'}
  Tamaño:   ${lead.tamano || '—'}

RESULTADO
  Score total: ${lead.score}/16 (${lead.bucket})

DESGLOSE POR DIMENSIÓN
${dimRows}

RESPUESTAS COMPLETAS
${answers}

CONSENTIMIENTO
  Aviso de privacidad aceptado: ${lead.consent ? 'sí' : 'no'}
  Origen: ${lead.source || 'consultoria-ia.html'}
  Timestamp (UTC): ${new Date().toISOString()}
`;
}

function buildEmailHtml(lead) {
    const dimRows = (lead.byDim || [])
        .map((d) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${escapeHtml(d.name)}</td><td style="padding:4px 0"><strong>${d.score}/${d.max}</strong></td></tr>`)
        .join('');
    const answers = (lead.answers || [])
        .map((a, i) => `<li style="margin-bottom:12px"><strong>${i + 1}. [${escapeHtml(a.dimension)}]</strong> ${escapeHtml(a.question)}<br><span style="color:#0B0B0F">→ ${escapeHtml(a.answer)}</span></li>`)
        .join('');

    return `<!doctype html><html><body style="font-family:-apple-system,sans-serif;color:#0B0B0F;max-width:640px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px;border-bottom:2px solid #D7FF3A;padding-bottom:8px">Nuevo lead — Diagnóstico IA</h2>
        <h3>Contacto</h3>
        <table style="border-collapse:collapse;font-size:14px">
            <tr><td style="padding:4px 12px 4px 0;color:#666">Nombre</td><td><strong>${escapeHtml(lead.nombre)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Correo</td><td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Empresa</td><td>${escapeHtml(lead.empresa)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Cargo</td><td>${escapeHtml(lead.cargo)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Tamaño</td><td>${escapeHtml(lead.tamano)}</td></tr>
        </table>
        <h3 style="margin-top:24px">Resultado</h3>
        <p style="font-size:24px;margin:0"><strong>${lead.score}/16</strong> · <span style="background:#D7FF3A;padding:2px 10px;border-radius:99px;font-size:14px">${escapeHtml(lead.bucket)}</span></p>
        <h3 style="margin-top:24px">Desglose</h3>
        <table style="border-collapse:collapse;font-size:14px">${dimRows}</table>
        <h3 style="margin-top:24px">Respuestas</h3>
        <ol style="padding-left:20px;font-size:13px;line-height:1.5">${answers}</ol>
        <p style="margin-top:32px;font-size:12px;color:#888">Aviso de privacidad aceptado: ${lead.consent ? 'sí' : 'no'} · Origen: ${escapeHtml(lead.source || 'consultoria-ia.html')} · ${new Date().toISOString()}</p>
    </body></html>`;
}

function buildConfirmationText(lead) {
    const firstName = String(lead.nombre || '').split(/\s+/)[0] || '';
    const dimRows = (lead.byDim || [])
        .map((d) => `  · ${d.name}: ${d.score}/${d.max}`)
        .join('\n');
    return `Hola ${firstName},

Gracias por completar el diagnóstico de madurez en IA de Forward34.

TU RESULTADO
  Score: ${lead.score}/16 (${lead.bucket})

DESGLOSE POR DIMENSIÓN
${dimRows}

¿Qué sigue?
Vamos a revisar tu resultado y te contactamos en las próximas 48 horas
con una lectura más a fondo y los siguientes pasos concretos según tu
contexto. Si quieres adelantarte, responde a este correo o escríbenos a
hector@forward34.com.

Mientras tanto, puedes revisar la página del AI Sprint:
https://forward34.com/consultoria-ia.html#ai-sprint

— Equipo Forward34
forward34.com
`;
}

function buildConfirmationHtml(lead) {
    const firstName = escapeHtml(String(lead.nombre || '').split(/\s+/)[0] || '');
    const dimRows = (lead.byDim || [])
        .map((d) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${escapeHtml(d.name)}</td><td style="padding:6px 0"><strong>${d.score}/${d.max}</strong></td></tr>`)
        .join('');

    return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0B0B0F;background:#FAFAF7;margin:0;padding:32px 16px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid rgba(11,11,15,0.08)">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#666">Forward34 · Diagnóstico IA</p>
    <h1 style="margin:8px 0 24px;font-size:24px;letter-spacing:-0.02em">Hola ${firstName}, gracias por completar tu diagnóstico.</h1>

    <div style="background:#0B0B0F;color:#fff;border-radius:8px;padding:24px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.04em">TU RESULTADO</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:700;letter-spacing:-0.02em">${lead.score}/16 <span style="background:#D7FF3A;color:#0B0B0F;padding:4px 12px;border-radius:99px;font-size:14px;font-weight:600;vertical-align:middle;margin-left:8px">${escapeHtml(lead.bucket)}</span></p>
    </div>

    <h3 style="margin:24px 0 8px;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#666">Desglose por dimensión</h3>
    <table style="border-collapse:collapse;font-size:14px;width:100%">${dimRows}</table>

    <h3 style="margin:24px 0 8px;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#666">¿Qué sigue?</h3>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Vamos a revisar tu resultado y te contactamos en las próximas 48 horas con una lectura más a fondo y los siguientes pasos concretos según tu contexto.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">Si quieres adelantarte, responde a este correo o escríbenos directamente.</p>

    <p style="margin:24px 0 0"><a href="https://forward34.com/consultoria-ia.html#ai-sprint" style="display:inline-block;background:#0B0B0F;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Conocer el AI Sprint</a></p>

    <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid rgba(11,11,15,0.08);font-size:12px;color:#888">Forward34 · <a href="https://forward34.com" style="color:#888">forward34.com</a></p>
</div>
</body></html>`;
}

async function sendViaResend(lead) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { sent: false, reason: 'RESEND_API_KEY not set' };

    const to = process.env.LEAD_TO || 'hector@forward34.com';
    const from = process.env.LEAD_FROM || 'Forward34 Leads <leads@forward34.com>';
    const replyTo = process.env.LEAD_REPLY_TO || 'hector@forward34.com';

    const headers = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };

    // 1) Notificación interna a Forward34
    const internalRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            from,
            to: [to],
            reply_to: lead.email || undefined,
            subject: `Lead IA — ${lead.empresa || lead.nombre || 'Nuevo'} (${lead.score}/16, ${lead.bucket})`,
            text: buildEmailBody(lead),
            html: buildEmailHtml(lead)
        })
    });

    if (!internalRes.ok) {
        const text = await internalRes.text();
        return { sent: false, reason: `Resend internal ${internalRes.status}: ${text}` };
    }

    // 2) Confirmación al lead (no bloquea el éxito del flujo si falla)
    let confirmationSent = false;
    let confirmationReason = null;
    if (lead.email) {
        const confirmRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                from,
                to: [lead.email],
                reply_to: replyTo,
                subject: `Tu diagnóstico Forward34 — ${lead.score}/16 (${lead.bucket})`,
                text: buildConfirmationText(lead),
                html: buildConfirmationHtml(lead)
            })
        }).catch((err) => ({ ok: false, _err: err }));

        if (confirmRes && confirmRes.ok) {
            confirmationSent = true;
        } else if (confirmRes && typeof confirmRes.text === 'function') {
            const text = await confirmRes.text();
            confirmationReason = `Resend confirmation ${confirmRes.status}: ${text}`;
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

    // Validación mínima
    if (!body.email || !body.nombre) {
        return res.status(400).json({ error: 'Faltan campos: nombre y email son requeridos' });
    }
    if (typeof body.score !== 'number' || body.score < 0 || body.score > 16) {
        return res.status(400).json({ error: 'Score inválido' });
    }

    // Honeypot anti-bot: si "website" viene lleno, asumimos bot y devolvemos OK silencioso.
    if (body.website) {
        return res.status(200).json({ ok: true });
    }

    const lead = {
        nombre: String(body.nombre || '').slice(0, 200),
        email: String(body.email || '').slice(0, 200),
        empresa: String(body.empresa || '').slice(0, 200),
        cargo: String(body.cargo || '').slice(0, 200),
        tamano: String(body.tamano || '').slice(0, 100),
        score: body.score,
        bucket: String(body.bucket || '').slice(0, 50),
        byDim: Array.isArray(body.byDim) ? body.byDim.slice(0, 10) : [],
        answers: Array.isArray(body.answers) ? body.answers.slice(0, 20) : [],
        consent: !!body.consent,
        source: String(body.source || 'consultoria-ia.html').slice(0, 200)
    };

    // Log estructurado (visible en Vercel logs aunque Resend falle)
    console.log('[lead] new', JSON.stringify({
        score: lead.score, bucket: lead.bucket, empresa: lead.empresa, email: lead.email
    }));

    const emailResult = await sendViaResend(lead).catch((err) => ({
        sent: false, reason: 'Exception: ' + (err && err.message ? err.message : String(err))
    }));

    if (!emailResult.sent) {
        console.warn('[lead] email not sent:', emailResult.reason);
    } else if (emailResult.confirmationReason) {
        console.warn('[lead] confirmation not sent:', emailResult.confirmationReason);
    }

    return res.status(200).json({
        ok: true,
        emailSent: emailResult.sent,
        confirmationSent: !!emailResult.confirmationSent
    });
};
