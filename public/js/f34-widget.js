/**
 * f34-widget.js — Agente de recepción de Forward 34 (widget flotante).
 *
 * Se embebe en forward34.com (Vercel) con:
 *   <script src="/public/js/f34-widget.js" defer></script>
 *
 * Diseño: Forward34 Design System — monocromático puro (negro #000 / blanco /
 * grises), Inter, sin color, sin gradientes, sin sombras de color, animaciones
 * sutiles. Habla con POST /api/chat, en el mismo sitio.
 */
(function () {
  if (window.__f34WidgetLoaded) return;
  window.__f34WidgetLoaded = true;

  // Mismo origen que el sitio: la función vive en /api/chat de este proyecto.
  var BACKEND = (window.F34_AGENT_URL || '').replace(/\/$/, '');
  var GREETING = 'Soy el asistente digital de Forward 34. ¿En qué puedo orientarte?';
  // Saludo cuando el chat se abre desde un CTA de contacto ("Hablemos",
  // "Agenda una conversación"): intención alta → vamos directo a sus datos.
  var GREETING_CONTACTO = 'Con gusto te conecto con el equipo de Forward 34. Para que te contacten, déjame tus datos: nombre, empresa, correo y teléfono, y en una línea qué buscas resolver.';

  // ── historial (memoria de la sesión del visitante) ──
  var history = [];
  var busy = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── estilos (scoped con prefijo f34-) ──
  var css = '' +
    '.f34-b,.f34-p,.f34-p *{box-sizing:border-box;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.f34-b{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;background:#000;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2147483000;border:1px solid #000;' +
      'transition:transform .3s ease}' +
    '.f34-b:hover{transform:translateY(-2px)}' +
    '.f34-b svg{width:24px;height:24px}' +
    '.f34-p{position:fixed;right:24px;bottom:24px;width:380px;max-width:calc(100vw - 32px);height:560px;' +
      'max-height:calc(100vh - 48px);background:#fff;border:1px solid #000;border-radius:8px;z-index:2147483000;' +
      'display:none;flex-direction:column;overflow:hidden}' +
    '.f34-p.open{display:flex}' +
    '.f34-h{display:flex;align-items:center;gap:11px;padding:15px 18px;background:#000;color:#fff;flex:0 0 auto}' +
    '.f34-av{width:34px;height:34px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;letter-spacing:-0.02em;flex-shrink:0}' +
    '.f34-h .f34-t{font-weight:600;font-size:15px;letter-spacing:-0.01em;line-height:1.2}' +
    '.f34-h .f34-s{font-size:10.5px;color:#B8B8B8;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px}' +
    '.f34-x{margin-left:auto;background:transparent;border:none;color:#fff;font-size:20px;line-height:1;cursor:pointer;opacity:.7}' +
    '.f34-x:hover{opacity:1}' +
    '.f34-m{flex:1 1 auto;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;background:#F5F5F5}' +
    '.f34-row{display:flex}' +
    '.f34-row.u{justify-content:flex-end}' +
    '.f34-bub{max-width:82%;padding:10px 13px;font-size:14px;line-height:1.5;border-radius:8px;white-space:pre-wrap;word-wrap:break-word}' +
    '.f34-row.a .f34-bub{background:#fff;color:#1A1A1A;border:1px solid #E6E6E6}' +
    '.f34-row.u .f34-bub{background:#000;color:#fff}' +
    '.f34-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4A4A4A;margin-right:3px;animation:f34blink 1.2s infinite}' +
    '.f34-dot:nth-child(2){animation-delay:.2s}.f34-dot:nth-child(3){animation-delay:.4s}' +
    '@keyframes f34blink{0%,60%,100%{opacity:.25}30%{opacity:1}}' +
    '.f34-f{flex:0 0 auto;display:flex;gap:8px;padding:12px;border-top:1px solid #E6E6E6;background:#fff}' +
    '.f34-in{flex:1;border:1px solid #E6E6E6;border-radius:4px;padding:10px 12px;font-size:14px;resize:none;outline:none;max-height:96px}' +
    '.f34-in:focus{border-color:#000}' +
    '.f34-send{background:#000;color:#fff;border:none;border-radius:4px;padding:0 16px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.02em}' +
    '.f34-send:disabled{background:#4A4A4A;cursor:default}' +
    '.f34-cap{font-size:11px;color:#4A4A4A;text-align:center;padding:6px 12px;background:#fff}' +
    '@media (max-width:480px){.f34-p{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 16px)}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── burbuja ──
  var bubble = document.createElement('div');
  bubble.className = 'f34-b';
  bubble.setAttribute('aria-label', 'Abrir chat de Forward 34');
  bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  document.body.appendChild(bubble);

  // ── panel ──
  var panel = document.createElement('div');
  panel.className = 'f34-p';
  panel.innerHTML = '' +
    '<div class="f34-h"><div class="f34-av">34</div><div><div class="f34-t">Forward 34</div><div class="f34-s">Asistente IA</div></div>' +
      '<button class="f34-x" aria-label="Cerrar">&times;</button></div>' +
    '<div class="f34-m" id="f34-m"></div>' +
    '<div class="f34-cap">Asistente digital · las conversaciones pueden ser revisadas por el equipo</div>' +
    '<div class="f34-f"><textarea class="f34-in" id="f34-in" rows="1" placeholder="Escribe tu mensaje..."></textarea>' +
      '<button class="f34-send" id="f34-send">Enviar</button></div>';
  document.body.appendChild(panel);

  var mEl = panel.querySelector('#f34-m');
  var inEl = panel.querySelector('#f34-in');
  var sendEl = panel.querySelector('#f34-send');

  function addBubble(role, text) {
    var row = document.createElement('div');
    row.className = 'f34-row ' + (role === 'user' ? 'u' : 'a');
    row.innerHTML = '<div class="f34-bub">' + esc(text) + '</div>';
    mEl.appendChild(row);
    mEl.scrollTop = mEl.scrollHeight;
    return row;
  }

  function typing() {
    var row = document.createElement('div');
    row.className = 'f34-row a';
    row.innerHTML = '<div class="f34-bub"><span class="f34-dot"></span><span class="f34-dot"></span><span class="f34-dot"></span></div>';
    mEl.appendChild(row);
    mEl.scrollTop = mEl.scrollHeight;
    return row;
  }

  var opened = false;
  function open(mode) {
    panel.classList.add('open');
    bubble.style.display = 'none';
    if (!opened) {
      opened = true;
      addBubble('assistant', mode === 'contacto' ? GREETING_CONTACTO : GREETING);
    } else if (mode === 'contacto') {
      // ya estaba abierto y el visitante pulsó "Hablemos": empújalo a dejar datos.
      addBubble('assistant', GREETING_CONTACTO);
    }
    inEl.focus();
  }
  function close() { panel.classList.remove('open'); bubble.style.display = 'flex'; }

  bubble.addEventListener('click', function () { open(); });
  panel.querySelector('.f34-x').addEventListener('click', close);

  async function send() {
    var text = inEl.value.trim();
    if (!text || busy) return;
    inEl.value = ''; inEl.style.height = 'auto';
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    busy = true; sendEl.disabled = true;
    var t = typing();
    try {
      var r = await fetch(BACKEND + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      var d = await r.json().catch(function () { return {}; });
      t.remove();
      var reply = (d && d.reply) || 'Tuve un problema. Intenta de nuevo.';
      addBubble('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (e) {
      t.remove();
      addBubble('assistant', 'No pude conectar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      busy = false; sendEl.disabled = false; inEl.focus();
    }
  }

  sendEl.addEventListener('click', send);
  inEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  inEl.addEventListener('input', function () {
    inEl.style.height = 'auto';
    inEl.style.height = Math.min(inEl.scrollHeight, 96) + 'px';
  });

  // API pública: permite abrir/cerrar el chat desde el sitio (window.F34.open()).
  window.F34 = { open: open, close: close };

  // Engancha los CTAs de contacto (botones con clase .btn que apuntan a un
  // mailto) para que ABRAN EL CHAT en vez de un mailto — que "no sirve" cuando
  // el visitante no tiene cliente de correo. Los enlaces de correo de texto
  // plano (sin clase .btn, p.ej. el del footer) se dejan intactos.
  function hookCTAs() {
    var btns = document.querySelectorAll('a.btn[href^="mailto:"]');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].__f34hooked) continue;
      btns[i].__f34hooked = true;
      btns[i].addEventListener('click', function (e) { e.preventDefault(); open('contacto'); });
    }
  }
  hookCTAs();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookCTAs);
  }
})();
