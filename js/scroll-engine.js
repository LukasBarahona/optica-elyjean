/* Motor de escenas por scroll.
   - Mide una vez (y al cambiar el tamaño o el alto del documento), dibuja un frame por evento.
   - No intercepta rueda, teclado ni touch: el scroll es siempre el nativo del navegador.
   - Todo es reversible: el estado depende solo de la posición, nunca de "ya se animó".
   - Sin movimiento (reducción de movimiento o pantallas de altura <= 500 px) la página se lee completa.

   Uso en HTML:
     <section data-scene="pin" data-handler="beats" style="--length:300svh"><div class="stage">…</div></section>
     <section data-scene="view">…</section>          (progreso mientras cruza la pantalla)
   Cada escena recibe la variable CSS --p (0 → 1). Los handlers de JS son opcionales:
     Scrolltelling.register('beats', (p, el, ctx) => { … });
*/
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 500px)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  // Tramo de progreso: range(p, 0.2, 0.5) vale 0 antes de 0.2, 1 después de 0.5 y suaviza entre medio.
  const range = (p, start, end) => smooth((p - start) / Math.max(0.0001, end - start));
  const handlers = new Map();
  let scenes = [], vh = innerHeight, vw = innerWidth, headerH = 0, frame = 0, enabled = false;

  function measure() {
    vh = innerHeight; vw = innerWidth;
    const header = document.querySelector('[data-header]');
    headerH = header ? header.offsetHeight : 0;
    root.style.setProperty('--header-h', `${headerH}px`);
    // Leer todas las medidas antes de escribir estilos (evita recalcular el layout en cada escena).
    scenes = [...document.querySelectorAll('[data-scene]')].map(el => {
      const r = el.getBoundingClientRect();
      return { el, type: el.dataset.scene, name: el.dataset.handler, top: r.top + scrollY, height: el.offsetHeight, last: -1 };
    });
    scenes.forEach(s => { s.last = -1; });
    queue();
  }

  function progress(s) {
    if (s.type === 'pin') return clamp((scrollY - s.top + headerH) / Math.max(1, s.height - vh + headerH));
    return clamp((scrollY + vh - s.top) / (vh + s.height));
  }

  function draw() {
    frame = 0;
    if (!enabled) return;
    const ctx = { clamp, smooth, range, vw, vh, mobile: vw <= 900 };
    for (const s of scenes) {
      const p = progress(s);
      if (Math.abs(p - s.last) < 0.0005) continue;
      s.last = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      const fn = s.name && handlers.get(s.name);
      if (fn) fn(p, s.el, ctx);
    }
  }

  function queue() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }

  function configure() {
    enabled = !reduced.matches && !short.matches;
    root.classList.toggle('motion-on', enabled);
    if (!enabled) {
      // Versión estática: se quitan los estilos en línea para que el CSS normal muestre todo.
      scenes.forEach(s => {
        s.el.style.removeProperty('--p');
        const fn = s.name && handlers.get(s.name);
        if (fn && fn.reset) fn.reset(s.el);
      });
    }
    measure();
  }

  // Aparición de bloques una sola vez al entrar en pantalla.
  function reveals() {
    const nodes = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
    if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    nodes.forEach((n, i) => { n.style.setProperty('--reveal-delay', `${(i % 3) * 70}ms`); io.observe(n); });
  }

  addEventListener('scroll', queue, { passive: true });
  // En móviles la barra del navegador cambia la altura al hacer scroll: no se vuelve a medir por eso.
  addEventListener('resize', () => { if (innerWidth !== vw || Math.abs(innerHeight - vh) > 160) measure(); }, { passive: true });
  addEventListener('load', measure, { once: true });
  document.fonts?.ready.then(measure);
  // Imágenes que cargan tarde, acordeones o contenido nuevo cambian el alto del documento.
  if ('ResizeObserver' in window) {
    let lastH = 0;
    new ResizeObserver(() => { const h = document.body.scrollHeight; if (Math.abs(h - lastH) > 2) { lastH = h; measure(); } }).observe(document.body);
  }
  reduced.addEventListener('change', configure);
  short.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else measure(); });

  window.Scrolltelling = {
    register(name, fn, reset) { if (reset) fn.reset = reset; handlers.set(name, fn); scenes.forEach(s => { if (s.name === name) s.last = -1; }); queue(); },
    refresh: measure, reveals, clamp, smooth, range,
    get enabled() { return enabled; }
  };
  configure();
  reveals();
})();
