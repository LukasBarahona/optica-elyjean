/* Escenas de la portada. Cada handler recibe el progreso p (0 → 1) de su sección anclada.
   Todo es reversible (depende solo de la posición) y cada uno tiene su versión estática (reset). */
(() => {
  'use strict';
  const S = window.Scrolltelling;
  if (!S) return;

  /* Relevo de textos: un bloque visible a la vez, con cruce suave. Mismo cálculo en todas las escenas. */
  function beats(p, el, clamp, selector) {
    const items = [...el.querySelectorAll(selector)];
    const tracks = [...el.querySelectorAll('[data-tramo]')];
    const n = items.length;
    const pos = clamp(p / 0.92) * n;            // el último tramo queda visible antes de soltar la escena
    items.forEach((b, i) => {
      const into = pos - i;
      let v = into < 0.5 ? clamp((into + 0.15) / 0.3) : clamp((1.15 - into) / 0.3);
      if (i === 0 && into < 0.5) v = 1;
      if (i === n - 1 && into >= 0.5) v = 1;
      b.style.opacity = v.toFixed(3);
      b.style.transform = `translate3d(0,${((1 - v) * 24).toFixed(1)}px,0)`;
      b.toggleAttribute('aria-hidden', v < 0.5);
    });
    tracks.forEach((t, i) => t.style.setProperty('--fill', clamp(pos - i).toFixed(3)));
  }
  const limpiar = sel => el => el.querySelectorAll(sel).forEach(n => { n.removeAttribute('style'); n.removeAttribute('aria-hidden'); });

  /* ARMAR — el lente se arma por capas: marco → cristal → tratamientos → receta → entrega. */
  S.register('armar', (p, el, { clamp, range }) => {
    const stage = el.querySelector('.stage');
    const t = clamp(p / 0.92), q = 1 / 5;          // cinco tramos iguales
    stage.style.setProperty('--marco', range(t, 0.02, q * 0.85).toFixed(3));
    stage.style.setProperty('--cristal', range(t, q, q * 1.85).toFixed(3));
    stage.style.setProperty('--trat', range(t, q * 2, q * 2.85).toFixed(3));
    stage.style.setProperty('--receta', range(t, q * 3, q * 3.85).toFixed(3));
    stage.style.setProperty('--entrega', range(t, q * 4, q * 4.85).toFixed(3));
    beats(p, el, clamp, '.armar__beat');
  }, el => { el.querySelector('.stage').removeAttribute('style'); limpiar('.armar__beat,[data-tramo]')(el); });

  /* WIPE — capas que se revelan con un barrido y una guía de color que acompaña el borde.
     La misma curva y duración para cada cambio. */
  S.register('wipe', (p, el, { range, clamp }) => {
    const layers = [...el.querySelectorAll('[data-wipe-layer]')];
    const seam = el.querySelector('[data-wipe-seam]');
    const tracks = [...el.querySelectorAll('[data-tramo]')];
    const steps = layers.length - 1;
    if (steps < 1) return;
    const t = clamp(p / 0.92);
    const w = layers.map((_, i) => i === 0 ? 1 : range(t, (i - 1 + 0.12) / steps, (i - 0.12) / steps));
    let active = 0, activeWipe = 0;
    layers.forEach((layer, i) => {
      const right = (1 - w[i]) * 100, left = (w[i + 1] ?? 0) * 100;
      layer.style.clipPath = `inset(0 ${right.toFixed(2)}% 0 ${left.toFixed(2)}%)`;
      if (i > 0 && w[i] > 0 && w[i] < 1) { active = i; activeWipe = w[i]; }
    });
    if (seam) {
      seam.style.left = `${(activeWipe * 100).toFixed(2)}%`;
      seam.style.opacity = active ? (Math.sin(activeWipe * Math.PI) ** 2).toFixed(3) : '0';
    }
    // Un tramo por capa: el primero lleno desde el inicio.
    tracks.forEach((tr, i) => tr.style.setProperty('--fill', (i === 0 ? 1 : w[i]).toFixed(3)));
  }, el => el.querySelectorAll('[data-wipe-layer],[data-wipe-seam],[data-tramo]').forEach(n => n.removeAttribute('style')));

  /* LÍNEA DE TIEMPO — la línea se dibuja y cada hito aparece en su tramo; al final, el sello. */
  S.register('linea', (p, el, { range, clamp }) => {
    const t = clamp(p / 0.9);
    const hitos = [...el.querySelectorAll('.hito')];
    const n = hitos.length;
    el.querySelector('.linea').style.setProperty('--l', range(t, 0.05, 0.8).toFixed(3));
    hitos.forEach((h, i) => {
      const s = 0.05 + (0.75 / n) * i;
      h.style.setProperty('--h', range(t, s, s + 0.12).toFixed(3));
    });
    el.querySelector('.operativo__sello').style.setProperty('--s', range(t, 0.84, 0.96).toFixed(3));
  }, el => el.querySelectorAll('.linea,.hito,.operativo__sello').forEach(n => n.removeAttribute('style')));
})();
