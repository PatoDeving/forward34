(function () {
    'use strict';

    const QUESTIONS = [
        {
            dimension: 'Datos',
            text: '¿Tienes inventario centralizado y actualizado de tus fuentes de datos críticas?',
            options: [
                { label: 'No, los datos están dispersos en silos.', score: 0 },
                { label: 'Parcialmente, sabemos dónde está lo más importante.', score: 1 },
                { label: 'Sí, hay un inventario claro y mantenido.', score: 2 }
            ]
        },
        {
            dimension: 'Datos',
            text: '¿Tus datos críticos están limpios y accesibles para análisis o modelos de IA?',
            options: [
                { label: 'No, requieren mucho trabajo manual.', score: 0 },
                { label: 'Algunos sí, otros necesitan transformación.', score: 1 },
                { label: 'Sí, están listos para usarse.', score: 2 }
            ]
        },
        {
            dimension: 'Procesos',
            text: '¿Has mapeado los procesos del negocio donde la IA podría tener mayor impacto?',
            options: [
                { label: 'No, aún no hemos analizado dónde aplicar IA.', score: 0 },
                { label: 'Tenemos hipótesis pero sin priorizar.', score: 1 },
                { label: 'Sí, hay un mapa claro con áreas priorizadas.', score: 2 }
            ]
        },
        {
            dimension: 'Procesos',
            text: '¿Tienes procesos documentados y repetibles que un agente o automatización podría ejecutar?',
            options: [
                { label: 'No, la mayoría son ad-hoc.', score: 0 },
                { label: 'Algunos sí, sobre todo en operación.', score: 1 },
                { label: 'La mayoría están documentados.', score: 2 }
            ]
        },
        {
            dimension: 'Talento',
            text: '¿Tu equipo usa herramientas de IA generativa (ChatGPT, Copilot, Claude, etc.) en su trabajo diario?',
            options: [
                { label: 'Casi nadie las usa todavía.', score: 0 },
                { label: 'Algunos las usan, sin guía formal.', score: 1 },
                { label: 'La mayoría las usa y compartimos buenas prácticas.', score: 2 }
            ]
        },
        {
            dimension: 'Talento',
            text: '¿Hay un sponsor ejecutivo claro impulsando las iniciativas de IA?',
            options: [
                { label: 'No, es un tema lateral sin dueño.', score: 0 },
                { label: 'Hay interés ejecutivo pero sin presupuesto asignado.', score: 1 },
                { label: 'Sí, con sponsor, presupuesto y metas anuales.', score: 2 }
            ]
        },
        {
            dimension: 'Casos de uso',
            text: '¿Has identificado casos de uso de IA con ROI estimado o hipótesis de valor?',
            options: [
                { label: 'No, no hemos hecho ese análisis.', score: 0 },
                { label: 'Tenemos algunas hipótesis sin números.', score: 1 },
                { label: 'Sí, con casos priorizados y ROI estimado.', score: 2 }
            ]
        },
        {
            dimension: 'Casos de uso',
            text: '¿Has ejecutado pilotos de IA en producción midiendo impacto real?',
            options: [
                { label: 'No, ninguno en producción.', score: 0 },
                { label: 'Sí, uno o dos, sin medición rigurosa.', score: 1 },
                { label: 'Varios pilotos vivos y midiendo resultados.', score: 2 }
            ]
        }
    ];

    const BUCKETS = [
        {
            min: 0, max: 4,
            label: 'Explorador',
            desc: 'Estás en el punto de partida. Lo bueno: tienes la oportunidad de evitar los errores caros que otros ya cometieron y construir bases sólidas desde el principio.'
        },
        {
            min: 5, max: 9,
            label: 'En camino',
            desc: 'Tienes piezas importantes en su sitio, pero falta integración. El próximo trimestre puede ser decisivo si conviertes las iniciativas sueltas en una estrategia coherente.'
        },
        {
            min: 10, max: 13,
            label: 'Adoptante',
            desc: 'Tu organización ya captura valor con IA. El reto ahora es escalar lo que funciona y abrir frentes nuevos antes que la competencia.'
        },
        {
            min: 14, max: 16,
            label: 'Líder',
            desc: 'Estás en la frontera. El foco aquí es optimización, gobierno y construir ventaja competitiva sostenible — además de no dormirte en los laureles.'
        }
    ];

    const ROADMAPS = {
        'Datos': [
            'Inventario y catálogo de fuentes de datos críticas en 4 semanas.',
            'Definir un dueño de datos por dominio y SLAs mínimos de calidad.',
            'Pipeline básico que entregue datos limpios y versionados a quien los necesite.'
        ],
        'Procesos': [
            'Mapeo de los 10 procesos con mayor potencial de impacto con IA.',
            'Priorizar 2-3 procesos por valor x factibilidad y diseñar el piloto.',
            'Definir métricas de éxito antes de tocar tecnología.'
        ],
        'Talento': [
            'Programa de adopción de IA generativa para el equipo (4-6 semanas).',
            'Conseguir un sponsor ejecutivo formal con presupuesto y metas.',
            'Crear una comunidad interna donde se compartan casos y buenas prácticas.'
        ],
        'Casos de uso': [
            'Workshop de 1 día para generar y priorizar 20+ casos de uso.',
            'Construir el caso de negocio de los 3 con mayor ROI esperado.',
            'Lanzar el primer piloto en producción con métricas claras desde el día uno.'
        ]
    };

    const root = document.getElementById('assessment');
    if (!root) return;

    const state = {
        current: 0,
        answers: new Array(QUESTIONS.length).fill(null),
        startedAt: null
    };

    const screens = root.querySelectorAll('.assessment-screen');
    const $ = (sel) => root.querySelector(sel);

    // ----- Analytics -----
    function track(name, payload) {
        const data = Object.assign({ event: name }, payload || {});
        try {
            if (window.dataLayer && typeof window.dataLayer.push === 'function') {
                window.dataLayer.push(data);
            }
            if (typeof window.plausible === 'function') {
                window.plausible(name, { props: payload || {} });
            }
        } catch (_) { /* analytics no debe romper la UI */ }
    }

    function showScreen(name) {
        screens.forEach((s) => {
            s.hidden = s.dataset.screen !== name;
        });
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderQuestion() {
        const q = QUESTIONS[state.current];
        $('#q-current').textContent = String(state.current + 1);
        $('#q-total').textContent = String(QUESTIONS.length);
        $('#q-dimension').textContent = q.dimension;
        $('#q-text').textContent = q.text;
        $('#q-progress').style.width = ((state.current) / QUESTIONS.length * 100) + '%';
        $('#q-back').disabled = state.current === 0;

        const opts = $('#q-options');
        opts.innerHTML = '';
        const selected = state.answers[state.current];
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'assessment-option';
            btn.setAttribute('data-test', 'option-' + i);
            if (selected === i) btn.classList.add('selected');
            btn.innerHTML = '<span class="opt-marker"></span><span class="opt-label">' + opt.label + '</span>';
            btn.addEventListener('click', () => selectOption(i));
            opts.appendChild(btn);
        });
        $('#q-hint').textContent = selected === null
            ? 'Selecciona una opción para continuar'
            : 'Avanzando...';
    }

    function selectOption(i) {
        const isFirst = state.answers[state.current] === null;
        state.answers[state.current] = i;
        renderQuestion();
        track('assessment_answer', {
            q: state.current + 1,
            dimension: QUESTIONS[state.current].dimension,
            score: QUESTIONS[state.current].options[i].score,
            first_answer: isFirst
        });
        setTimeout(() => {
            if (state.current < QUESTIONS.length - 1) {
                state.current++;
                renderQuestion();
            } else {
                renderResult();
                showScreen('result');
                const { total, bucket } = scoreSummary();
                track('assessment_complete', { score: total, bucket });
            }
        }, 280);
    }

    function computeScore() {
        let total = 0;
        const byDim = {};
        QUESTIONS.forEach((q, i) => {
            const a = state.answers[i];
            const s = a === null ? 0 : q.options[a].score;
            total += s;
            if (!byDim[q.dimension]) byDim[q.dimension] = { score: 0, max: 0 };
            byDim[q.dimension].score += s;
            byDim[q.dimension].max += 2;
        });
        return { total, byDim };
    }

    function getBucket(total) {
        return BUCKETS.find((b) => total >= b.min && total <= b.max) || BUCKETS[0];
    }

    function scoreSummary() {
        const { total, byDim } = computeScore();
        const bucket = getBucket(total).label;
        return { total, byDim, bucket };
    }

    function renderResult() {
        const { total, byDim } = computeScore();
        const bucket = getBucket(total);
        $('#r-score').textContent = String(total);
        $('#r-bucket').textContent = bucket.label;
        $('#r-bucket-desc').textContent = bucket.desc;

        const bars = $('#r-bars');
        bars.innerHTML = '';
        Object.keys(byDim).forEach((dim) => {
            const { score, max } = byDim[dim];
            const pct = (score / max) * 100;
            const row = document.createElement('div');
            row.className = 'result-bar';
            row.innerHTML =
                '<div class="result-bar-meta"><span>' + dim + '</span><span>' + score + '/' + max + '</span></div>' +
                '<div class="result-bar-track"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>';
            bars.appendChild(row);
        });

        const weakest = Object.keys(byDim)
            .map((d) => ({ d, gap: byDim[d].max - byDim[d].score }))
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 2)
            .map((x) => x.d);

        const roadmap = $('#r-roadmap');
        roadmap.innerHTML = '';
        const steps = [];
        weakest.forEach((d) => {
            (ROADMAPS[d] || []).slice(0, 2).forEach((s) => steps.push({ d, s }));
        });
        steps.forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = '<strong>' + item.d + ':</strong> ' + item.s;
            roadmap.appendChild(li);
        });
    }

    function buildLeadPayload(formData) {
        const { total, byDim } = computeScore();
        const bucket = getBucket(total).label;
        return {
            nombre: formData.nombre,
            email: formData.email,
            empresa: formData.empresa,
            cargo: formData.cargo,
            tamano: formData.tamano,
            consent: !!formData.consent,
            score: total,
            bucket: bucket,
            byDim: Object.keys(byDim).map((d) => ({
                name: d, score: byDim[d].score, max: byDim[d].max
            })),
            answers: QUESTIONS.map((q, i) => {
                const a = state.answers[i];
                return {
                    dimension: q.dimension,
                    question: q.text,
                    answer: a === null ? '(sin responder)' : q.options[a].label
                };
            }),
            source: 'consultoria-ia.html',
            website: formData.website || ''
        };
    }

    function buildMailtoFallback(lead) {
        const lines = [];
        lines.push('Hola Forward34,');
        lines.push('');
        lines.push('Acabo de completar el diagnóstico de madurez de IA.');
        lines.push('');
        lines.push('Mis datos:');
        lines.push('  Nombre: ' + lead.nombre);
        lines.push('  Empresa: ' + lead.empresa + ' (' + (lead.tamano || '—') + ')');
        lines.push('  Cargo: ' + (lead.cargo || '—'));
        lines.push('');
        lines.push('Resultado: ' + lead.score + '/16 — ' + lead.bucket);
        lines.push('');
        lines.push('Desglose:');
        (lead.byDim || []).forEach((d) => lines.push('  · ' + d.name + ': ' + d.score + '/' + d.max));
        lines.push('');
        lines.push('Quedo atento al roadmap detallado.');

        const subject = 'Diagnóstico IA — ' + (lead.empresa || lead.nombre) + ' (' + lead.score + '/16, ' + lead.bucket + ')';
        return 'mailto:hector@forward34.com?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(lines.join('\n'));
    }

    async function submitLead(lead) {
        try {
            const res = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || ('HTTP ' + res.status));
            }
            return await res.json();
        } catch (err) {
            return { ok: false, error: err.message || String(err) };
        }
    }

    function showFormStatus(message, type) {
        const el = $('#r-form-status');
        el.textContent = message;
        el.classList.remove('is-error', 'is-success');
        if (type) el.classList.add('is-' + type);
    }

    // ----- Wiring -----
    $('#assessment-start').addEventListener('click', () => {
        state.current = 0;
        state.startedAt = Date.now();
        renderQuestion();
        showScreen('question');
        track('assessment_start', {});
    });

    $('#q-back').addEventListener('click', () => {
        if (state.current > 0) {
            state.current--;
            renderQuestion();
        }
    });

    $('#r-restart').addEventListener('click', () => {
        state.current = 0;
        state.answers = new Array(QUESTIONS.length).fill(null);
        showScreen('intro');
        track('assessment_restart', {});
    });

    $('#r-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const data = {
            nombre: (fd.get('nombre') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            empresa: (fd.get('empresa') || '').toString().trim(),
            cargo: (fd.get('cargo') || '').toString().trim(),
            tamano: (fd.get('tamano') || '').toString(),
            consent: fd.get('consent') === 'on',
            website: (fd.get('website') || '').toString()
        };

        if (!data.nombre || !data.email || !data.empresa || !data.tamano) {
            showFormStatus('Faltan campos obligatorios.', 'error');
            return;
        }
        if (!data.consent) {
            showFormStatus('Necesitas aceptar el aviso de privacidad para continuar.', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showFormStatus('El correo no parece válido.', 'error');
            return;
        }

        const lead = buildLeadPayload(data);
        const submitBtn = $('#r-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        showFormStatus('Enviando tus respuestas...', null);
        track('lead_submit', { score: lead.score, bucket: lead.bucket, tamano: lead.tamano });

        const result = await submitLead(lead);

        submitBtn.disabled = false;

        if (result && result.ok) {
            submitBtn.textContent = '✓ Recibido';
            showFormStatus('¡Gracias! Recibimos tus respuestas. Te contactaremos en menos de 48 horas hábiles con el roadmap detallado.', 'success');
            form.querySelectorAll('input, select, button').forEach((el) => { el.disabled = true; });
            track('lead_success', { score: lead.score, bucket: lead.bucket });
        } else {
            submitBtn.textContent = 'Reintentar';
            showFormStatus('No pudimos enviar automáticamente. Abrimos tu cliente de correo como alternativa.', 'error');
            track('lead_fallback_mailto', { error: result && result.error });
            window.location.href = buildMailtoFallback(lead);
        }
    });
})();
