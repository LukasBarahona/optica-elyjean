/* Portada: carrusel, destacados, filtros de cristales, tiendas y formulario. */
(() => {
  'use strict';
  const { esc, waLink, tarjeta, C } = window.App;

  /* Teléfono desde la configuración */
  document.querySelectorAll('[data-tel]').forEach(a => { a.href = `tel:+${C.whatsapp}`; });
  document.querySelectorAll('[data-tel-texto]').forEach(s => { s.textContent = C.telefonoVisible; });

  /* Carrusel del héroe */
  const slides = [...document.querySelectorAll('.slide')];
  const puntos = document.querySelector('.hero__puntos');
  let actual = 0, timer;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Destacado ${i + 1}`);
    b.addEventListener('click', () => { ir(i); reiniciar(); });
    puntos.appendChild(b);
  });
  function ir(i) {
    actual = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === actual); s.inert = k !== actual; });
    [...puntos.children].forEach((b, k) => b.setAttribute('aria-selected', String(k === actual)));
  }
  function reiniciar() { clearInterval(timer); if (!quieto) timer = setInterval(() => ir(actual + 1), 6500); }
  document.querySelectorAll('.hero__flecha').forEach(b => b.addEventListener('click', () => { ir(actual + Number(b.dataset.dir)); reiniciar(); }));
  const hero = document.querySelector('.hero');
  hero.addEventListener('mouseenter', () => clearInterval(timer));
  hero.addEventListener('mouseleave', reiniciar);
  ir(0); reiniciar();

  /* Destacados con pestañas */
  const fila = document.getElementById('filaDestacados');
  const verTodos = document.getElementById('verTodos');
  const textos = { adultos: 'Ver todos los marcos ópticos', ninos: 'Ver todos los marcos de niños', sol: 'Ver todos los lentes de sol' };
  function mostrar(cat) {
    const lista = window.PRODUCTOS.filter(p => p.categoria === cat);
    lista.sort((a, b) => (b.etiqueta ? 1 : 0) - (a.etiqueta ? 1 : 0));
    fila.innerHTML = lista.slice(0, 8).map(tarjeta).join('');
    fila.scrollLeft = 0;
    verTodos.href = `catalogo.html?cat=${cat}`;
    verTodos.textContent = textos[cat];
  }
  document.querySelectorAll('.destacados .pestana').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.destacados .pestana').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    mostrar(b.dataset.cat);
  }));
  mostrar('adultos');

  /* Filtro de tipos de cristal */
  document.querySelectorAll('[data-filtro]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-filtro]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    const f = b.dataset.filtro;
    document.querySelectorAll('.lente').forEach(l => { l.hidden = !(f === 'todos' || l.dataset.tipo === f || l.dataset.tipo === 'todos'); });
  }));

  /* Tiendas */
  document.getElementById('tiendasGrid').innerHTML = C.tiendas.map(t => `
    <article class="tienda">
      <h3>${esc(t.nombre)}</h3>
      <p>${esc(t.direccion)}</p>
      <p>${esc(t.horario)}</p>
      <p class="pendiente">Dirección pendiente de confirmar</p>
    </article>`).join('');

  /* Formulario → WhatsApp */
  const form = document.getElementById('formContacto');
  const motivo = form.motivo;
  const campoEmpresa = document.getElementById('campoEmpresa');
  const sync = () => { campoEmpresa.hidden = motivo.value !== 'Operativo para mi empresa'; };
  motivo.addEventListener('change', sync);
  document.querySelectorAll('[data-motivo]').forEach(a => a.addEventListener('click', () => { motivo.value = a.dataset.motivo; sync(); }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const error = document.getElementById('formError');
    const nombre = form.nombre.value.trim();
    form.nombre.closest('.campo').classList.toggle('campo--error', !nombre);
    if (!nombre) { error.textContent = 'Escribe tu nombre para poder responderte.'; form.nombre.focus(); return; }
    error.textContent = '';
    let texto = `Hola, soy ${nombre}. ${motivo.value}.`;
    if (!campoEmpresa.hidden && form.empresa.value.trim()) texto += ` Empresa: ${form.empresa.value.trim()}.`;
    if (form.mensaje.value.trim()) texto += ` ${form.mensaje.value.trim()}`;
    window.open(waLink(texto), '_blank', 'noopener');
  });
})();
