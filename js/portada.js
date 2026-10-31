/* Portada: carrusel, destacados, comparador y filtros de cristales, y formulario. */
(() => {
  'use strict';
  const { enviar, tarjeta, C } = window.App;

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
  const textos = { adultos: 'Ver todos los marcos ópticos', ninos: 'Ver todos los marcos infantiles', sol: 'Ver todos los lentes de sol' };
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

  /* Comparador: sin lentes → con lentes → tipo de cristal */
  const vision = document.querySelector('.vision');
  const subVision = document.getElementById('visionSub');
  const estadoVision = { modo: 'sin', cristal: 'normal' };
  function verVision() {
    const { modo, cristal } = estadoVision;
    const activa = modo === 'con' ? cristal : 'sin';
    vision.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    vision.querySelectorAll('[data-cristal]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cristal === cristal)));
    vision.querySelectorAll('[data-panel]').forEach(n => n.classList.toggle('is-activa', n.dataset.panel === activa));
    vision.querySelectorAll('[data-info]').forEach(n => { n.hidden = n.dataset.info !== activa; });
    subVision.style.visibility = modo === 'con' ? '' : 'hidden';  // conserva su espacio para que el texto no salte
  }
  vision.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { estadoVision.modo = b.dataset.modo; verVision(); }));
  vision.querySelectorAll('[data-cristal]').forEach(b => b.addEventListener('click', () => { estadoVision.cristal = b.dataset.cristal; verVision(); }));
  verVision();

  /* Filtro de tipos de cristal */
  document.querySelectorAll('[data-filtro]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-filtro]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    const f = b.dataset.filtro;
    document.querySelectorAll('.lente').forEach(l => { l.hidden = !(f === 'todos' || l.dataset.tipo === f || l.dataset.tipo === 'todos'); });
  }));

  /* Al llegar desde otra página a un ancla (#empresas, #contacto): ir cuando el diseño ya está medido */
  addEventListener('load', () => {
    const destino = location.hash && document.getElementById(location.hash.slice(1));
    if (destino) destino.scrollIntoView({ behavior: 'instant' });
  });

  /* Formulario → correo o WhatsApp, a elección del cliente */
  const form = document.getElementById('formContacto');
  const motivo = form.motivo;
  const campoEmpresa = document.getElementById('campoEmpresa');
  const sync = () => { campoEmpresa.hidden = motivo.value !== 'Operativo para mi empresa'; };
  motivo.addEventListener('change', sync);
  document.querySelectorAll('[data-motivo]').forEach(a => a.addEventListener('click', () => { motivo.value = a.dataset.motivo; motivo.dispatchEvent(new Event('change')); }));
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
    enviar(e.submitter, `${motivo.value} · ${nombre}`, texto);
  });
})();
