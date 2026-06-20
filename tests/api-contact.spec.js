// Tests para api/contact.js — invoca el handler con req/res mockeados y
// fetch interceptado, sin red. Verifica validación, honeypot, y que con
// RESEND_API_KEY se mandan 2 correos (interno + confirmación) con el
// shape correcto.

const { test, expect } = require('@playwright/test');
const path = require('path');

function freshHandler() {
    const p = require.resolve(path.join(__dirname, '..', 'api', 'contact.js'));
    delete require.cache[p];
    return require(p);
}

function mockRes() {
    return {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(k, v) { this.headers[k] = v; },
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
}

function mockFetch(responses) {
    const calls = [];
    const fn = async (url, opts) => {
        calls.push({ url, opts });
        return responses.shift() || { ok: true, status: 200, text: async () => '{}' };
    };
    return { fn, calls };
}

const validContact = {
    nombre: 'Grace Hopper',
    empresa: 'US Navy',
    cargo: 'Rear Admiral',
    email: 'grace@example.com',
    telefono: '+1 555 0100',
    servicio: 'ia-tecnologia',
    mensaje: 'Queremos explorar automatización con IA en nuestros procesos de cómputo.'
};

test.describe('api/contact.js — handler', () => {

    test('rechaza método != POST', async () => {
        const res = mockRes();
        await freshHandler()({ method: 'GET' }, res);
        expect(res.statusCode).toBe(405);
        expect(res.headers.Allow).toBe('POST');
    });

    test('valida nombre, email y mensaje requeridos', async () => {
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: { nombre: 'X', email: 'x@y.com' } }, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/mensaje/);
    });

    test('honeypot website → 200 silencioso sin enviar', async () => {
        const m = mockFetch([]);
        global.fetch = m.fn;
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: { ...validContact, website: 'bot' } }, res);
        expect(res.statusCode).toBe(200);
        expect(m.calls.length).toBe(0);
    });

    test('sin RESEND_API_KEY responde 200 con emailSent=false', async () => {
        delete process.env.RESEND_API_KEY;
        const m = mockFetch([]);
        global.fetch = m.fn;
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: validContact }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.emailSent).toBe(false);
        expect(m.calls.length).toBe(0);
    });

    test('con RESEND_API_KEY envía 2 correos con shape correcto', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        process.env.LEAD_TO = 'hector@forward34.com';
        process.env.LEAD_FROM = 'Forward34 Leads <leads@forward34.com>';

        const m = mockFetch([
            { ok: true, status: 200, text: async () => '{"id":"em_1"}' },
            { ok: true, status: 200, text: async () => '{"id":"em_2"}' }
        ]);
        global.fetch = m.fn;
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: validContact }, res);

        expect(res.body.emailSent).toBe(true);
        expect(res.body.confirmationSent).toBe(true);
        expect(m.calls.length).toBe(2);

        const internal = JSON.parse(m.calls[0].opts.body);
        expect(internal.to).toEqual(['hector@forward34.com']);
        expect(internal.reply_to).toBe('grace@example.com');
        expect(internal.subject).toContain('Contacto');
        expect(internal.subject).toContain('IA y tecnología aplicada'); // servicio mapeado
        expect(internal.html).toContain('Grace Hopper');
        expect(internal.text).toContain('automatización con IA');

        const confirm = JSON.parse(m.calls[1].opts.body);
        expect(confirm.to).toEqual(['grace@example.com']);
        expect(confirm.subject).toContain('Recibimos tu mensaje');
        expect(confirm.html).toContain('Grace'); // primer nombre
    });

    test('si el interno falla, no se intenta confirmación y emailSent=false', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        const m = mockFetch([{ ok: false, status: 422, text: async () => 'domain not verified' }]);
        global.fetch = m.fn;
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: validContact }, res);
        expect(res.body.emailSent).toBe(false);
        expect(res.body.confirmationSent).toBe(false);
        expect(m.calls.length).toBe(1);
    });

    test('servicio desconocido cae a la etiqueta cruda sin romper', async () => {
        process.env.RESEND_API_KEY = 're_test_key';
        const m = mockFetch([
            { ok: true, status: 200, text: async () => '{}' },
            { ok: true, status: 200, text: async () => '{}' }
        ]);
        global.fetch = m.fn;
        const res = mockRes();
        await freshHandler()({ method: 'POST', body: { ...validContact, servicio: 'loquesea' } }, res);
        expect(res.body.emailSent).toBe(true);
        const internal = JSON.parse(m.calls[0].opts.body);
        expect(internal.subject).toContain('loquesea');
    });
});
