// Tests para api/lead.js — invoca el handler directo con req/res mockeados
// y un fetch interceptado, sin necesitar Vercel ni red. Verifica que:
//   - sin RESEND_API_KEY, responde 200 pero emailSent=false
//   - con RESEND_API_KEY, hace EXACTAMENTE 2 calls a Resend (interno + lead),
//     con el shape esperado (from, to, reply_to, subject, html, text)
//   - el correo de confirmación va al email del lead, no al interno
//   - confirmationSent se refleja en la respuesta

const { test, expect } = require('@playwright/test');
const path = require('path');

function freshHandler() {
    // Resetea require cache para que cada test arranque limpio
    const p = require.resolve(path.join(__dirname, '..', 'api', 'lead.js'));
    delete require.cache[p];
    return require(p);
}

function mockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(k, v) { this.headers[k] = v; },
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
    return res;
}

function mockFetch(responses) {
    const calls = [];
    const fn = async (url, opts) => {
        calls.push({ url, opts });
        const r = responses.shift() || { ok: true, status: 200, text: async () => '{}' };
        return r;
    };
    return { fn, calls };
}

const validLead = {
    nombre: 'Ada Lovelace',
    email: 'ada@example.com',
    empresa: 'Analytical Engines',
    cargo: 'CTO',
    tamano: '50-200',
    score: 11,
    bucket: 'En camino',
    byDim: [
        { name: 'Datos', score: 3, max: 4 },
        { name: 'Procesos', score: 2, max: 4 },
        { name: 'Talento', score: 3, max: 4 },
        { name: 'Casos de uso', score: 3, max: 4 }
    ],
    answers: [],
    consent: true,
    source: 'consultoria-ia.html'
};

test.describe('api/lead.js — handler', () => {

    test('rechaza método != POST', async () => {
        const handler = freshHandler();
        const res = mockRes();
        await handler({ method: 'GET' }, res);
        expect(res.statusCode).toBe(405);
        expect(res.headers.Allow).toBe('POST');
    });

    test('valida nombre y email requeridos', async () => {
        const handler = freshHandler();
        const res = mockRes();
        await handler({ method: 'POST', body: { score: 8 } }, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/nombre y email/);
    });

    test('valida rango del score', async () => {
        const handler = freshHandler();
        const res = mockRes();
        await handler({ method: 'POST', body: { ...validLead, score: 99 } }, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Score/);
    });

    test('honeypot website → 200 silencioso sin enviar', async () => {
        const handler = freshHandler();
        const res = mockRes();
        const m = mockFetch([]);
        global.fetch = m.fn;
        await handler({ method: 'POST', body: { ...validLead, website: 'spam' } }, res);
        expect(res.statusCode).toBe(200);
        expect(m.calls.length).toBe(0);
    });

    test('sin RESEND_API_KEY responde 200 pero emailSent=false', async () => {
        delete process.env.RESEND_API_KEY;
        const handler = freshHandler();
        const res = mockRes();
        const m = mockFetch([]);
        global.fetch = m.fn;
        await handler({ method: 'POST', body: validLead }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.emailSent).toBe(false);
        expect(res.body.confirmationSent).toBe(false);
        expect(m.calls.length).toBe(0);
    });

    test('con RESEND_API_KEY envía 2 correos con el shape correcto', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        process.env.LEAD_TO = 'hector@forward34.com';
        process.env.LEAD_FROM = 'Forward34 Leads <leads@forward34.com>';

        const handler = freshHandler();
        const res = mockRes();
        const m = mockFetch([
            { ok: true, status: 200, text: async () => '{"id":"em_1"}' },
            { ok: true, status: 200, text: async () => '{"id":"em_2"}' }
        ]);
        global.fetch = m.fn;

        await handler({ method: 'POST', body: validLead }, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.emailSent).toBe(true);
        expect(res.body.confirmationSent).toBe(true);

        // Dos llamadas a Resend
        expect(m.calls.length).toBe(2);
        for (const c of m.calls) {
            expect(c.url).toBe('https://api.resend.com/emails');
            expect(c.opts.method).toBe('POST');
            expect(c.opts.headers.Authorization).toBe('Bearer re_test_key');
        }

        // Correo 1: interno → hector@forward34.com
        const internal = JSON.parse(m.calls[0].opts.body);
        expect(internal.to).toEqual(['hector@forward34.com']);
        expect(internal.from).toBe('Forward34 Leads <leads@forward34.com>');
        expect(internal.reply_to).toBe('ada@example.com');
        expect(internal.subject).toContain('Lead IA');
        expect(internal.subject).toContain('11/16');
        expect(internal.html).toContain('Ada Lovelace');
        expect(internal.text).toContain('ada@example.com');

        // Correo 2: confirmación → email del lead
        const confirm = JSON.parse(m.calls[1].opts.body);
        expect(confirm.to).toEqual(['ada@example.com']);
        expect(confirm.subject).toContain('11/16');
        expect(confirm.subject).toContain('Tu diagnóstico');
        expect(confirm.html).toContain('Ada');         // first name
        expect(confirm.html).toContain('forward34.com');
        expect(confirm.text).toContain('Score: 11/16');
    });

    test('si el correo interno falla, no se intenta el de confirmación', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        const handler = freshHandler();
        const res = mockRes();
        const m = mockFetch([
            { ok: false, status: 422, text: async () => 'domain not verified' }
        ]);
        global.fetch = m.fn;
        await handler({ method: 'POST', body: validLead }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.emailSent).toBe(false);
        expect(res.body.confirmationSent).toBe(false);
        expect(m.calls.length).toBe(1);
    });

    test('si solo falla la confirmación, emailSent sigue siendo true', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        const handler = freshHandler();
        const res = mockRes();
        const m = mockFetch([
            { ok: true, status: 200, text: async () => '{"id":"em_1"}' },
            { ok: false, status: 422, text: async () => 'bad recipient' }
        ]);
        global.fetch = m.fn;
        await handler({ method: 'POST', body: validLead }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.emailSent).toBe(true);
        expect(res.body.confirmationSent).toBe(false);
        expect(m.calls.length).toBe(2);
    });
});
