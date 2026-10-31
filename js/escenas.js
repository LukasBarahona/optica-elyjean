/* Escenas de la portada. Cada handler recibe el progreso p (0 → 1) de su sección anclada.
   Todo es reversible (depende solo de la posición) y cada uno tiene su versión estática (reset). */
(() => {
  'use strict';
  const S = window.Scrolltelling;
  if (!S) return;

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
