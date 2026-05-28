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
        answers: new Array(QUESTIONS.length).fill(null)
    };

    const screens = root.querySelectorAll('.assessment-screen');
    const $ = (sel) => root.querySelector(sel);

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
        state.answers[state.current] = i;
        renderQuestion();
        setTimeout(() => {
            if (state.current < QUESTIONS.length - 1) {
                state.current++;
                renderQuestion();
            } else {
                renderResult();
                showScreen('result');
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

    function buildMailto(formData) {
        const { total, byDim } = computeScore();
        const bucket = getBucket(total);
        const lines = [];
        lines.push('Hola Forward34,');
        lines.push('');
        lines.push('Acabo de completar el diagnóstico de madurez de IA. Me gustaría recibir el roadmap detallado.');
        lines.push('');
        lines.push('--- MIS DATOS ---');
        lines.push('Nombre: ' + (formData.nombre || ''));
        lines.push('Correo: ' + (formData.email || ''));
        lines.push('Empresa: ' + (formData.empresa || ''));
        lines.push('Cargo: ' + (formData.cargo || ''));
        lines.push('');
        lines.push('--- MI RESULTADO ---');
        lines.push('Score total: ' + total + '/16  (' + bucket.label + ')');
        lines.push('');
        lines.push('Desglose por dimensión:');
        Object.keys(byDim).forEach((d) => {
            lines.push('  · ' + d + ': ' + byDim[d].score + '/' + byDim[d].max);
        });
        lines.push('');
        lines.push('--- MIS RESPUESTAS ---');
        QUESTIONS.forEach((q, i) => {
            const a = state.answers[i];
            const ans = a === null ? '(sin responder)' : q.options[a].label;
            lines.push((i + 1) + '. [' + q.dimension + '] ' + q.text);
            lines.push('   → ' + ans);
        });
        lines.push('');
        lines.push('Quedo atento.');

        const subject = 'Diagnóstico IA — ' + (formData.empresa || formData.nombre || 'Nuevo lead') + ' (' + total + '/16, ' + bucket.label + ')';
        const body = lines.join('\n');
        return 'mailto:hector@forward34.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    // Wire up
    $('#assessment-start').addEventListener('click', () => {
        state.current = 0;
        renderQuestion();
        showScreen('question');
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
    });

    $('#r-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            nombre: fd.get('nombre'),
            email: fd.get('email'),
            empresa: fd.get('empresa'),
            cargo: fd.get('cargo')
        };
        window.location.href = buildMailto(data);
    });
})();
