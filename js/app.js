/* Partes comunes a todas las páginas: encabezado, pie, carro, utilidades y apariciones. */
(() => {
  'use strict';
  const C = window.CONFIG;

  const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const waLink = texto => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(texto)}`;

  /* Carro guardado en el navegador (solo para el prototipo). */
  const KEY = 'elyjean-carro';
  const Carro = {
    leer() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    guardar(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ } actualizarContador(); },
    agregar(item) { const items = Carro.leer(); items.push({ ...item, uid: Date.now().toString(36) }); Carro.guardar(items); },
    quitar(uid) { Carro.guardar(Carro.leer().filter(i => i.uid !== uid)); },
    vaciar() { Carro.guardar([]); }
  };

  const paginaActual = location.pathname.split('/').pop() || 'index.html';
  const enPortada = paginaActual === 'index.html' || paginaActual === '';
  const ancla = id => (enPortada ? '' : 'index.html') + '#' + id;

  function encabezado() {
    const el = document.getElementById('app-header');
    if (!el) return;
    el.outerHTML = `
    <div class="topbar" data-header>
      <div class="anuncio" aria-label="Anuncios">
        <p class="anuncio__msg is-active"><strong>Consulta gratis</strong> al llevarte tus lentes</p>
        <p class="anuncio__msg">Boletas para reembolso en <strong>Fonasa, Isapres y seguros</strong></p>
        <p class="anuncio__msg"><strong>Envío a domicilio</strong> o retiro en nuestras 2 tiendas</p>
      </div>
      <header class="header">
        <div class="contenedor header__inner">
          <button class="header__menu" id="menuBtn" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
          <a href="index.html" class="header__logo" aria-label="${esc(C.marca)}, inicio"><img src="img/logo.png" alt="${esc(C.marca)}" width="56" height="56"></a>
          <nav class="nav" id="nav" aria-label="Principal">
            <a href="catalogo.html?cat=adultos">Ópticos</a>
            <a href="catalogo.html?cat=ninos">Niños</a>
            <a href="catalogo.html?cat=sol">Sol</a>
            <a href="${ancla('consulta-gratis')}">Consulta gratis</a>
            <a href="${ancla('empresas')}">Empresas</a>
            <a href="${ancla('tiendas')}">Tiendas</a>
          </nav>
          <form class="buscador" action="catalogo.html" role="search">
            <label class="sr-only" for="q">Buscar marcos</label>
            <input id="q" name="q" type="search" placeholder="Buscar marcos" autocomplete="off">
            <button aria-label="Buscar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></button>
          </form>
          <a href="carro.html" class="header__carro" aria-label="Ver carro">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
            <span class="header__badge" id="carroCount" hidden>0</span>
          </a>
        </div>
      </header>
    </div>`;
  }

  function pie() {
    const el = document.getElementById('app-footer');
    if (!el) return;
    el.outerHTML = `
    <footer class="footer">
      <div class="contenedor footer__grid">
        <div class="footer__marca">
          <img src="img/logo.png" alt="${esc(C.marca)}" width="96" height="96" loading="lazy">
          <p>Más de 10 años cuidando la visión de familias y trabajadores.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <a href="catalogo.html?cat=adultos">Lentes ópticos</a>
          <a href="catalogo.html?cat=ninos">Lentes para niños</a>
          <a href="catalogo.html?cat=sol">Lentes de sol</a>
          <a href="carro.html">Mi carro</a>
        </div>
        <div>
          <h4>Servicios</h4>
          <a href="${ancla('consulta-gratis')}">Consulta gratis</a>
          <a href="${ancla('empresas')}">Operativos en empresas</a>
          <a href="${ancla('reembolso')}">Reembolso y cuotas</a>
          <a href="${ancla('preguntas')}">Preguntas frecuentes</a>
        </div>
        <div>
          <h4>Contacto</h4>
          <a href="tel:+${C.whatsapp}">${esc(C.telefonoVisible)}</a>
          ${C.tiendas.map(t => `<span>${esc(t.nombre)}: ${esc(t.direccion)}</span>`).join('')}
        </div>
      </div>
      <p class="footer__legal">© ${new Date().getFullYear()} ${esc(C.marca)} · Prototipo: precios de ejemplo.</p>
    </footer>
    <a class="whatsapp" href="${waLink('Hola, quiero consultar por lentes.')}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
    </a>`;
  }

  function actualizarContador() {
    const b = document.getElementById('carroCount');
    if (!b) return;
    const n = Carro.leer().length;
    b.textContent = n;
    b.hidden = n === 0;
  }

  function menu() {
    const btn = document.getElementById('menuBtn');
    const nav = document.getElementById('nav');
    if (!btn || !nav) return;
    const cerrar = () => { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-abierto'); };
    btn.addEventListener('click', () => {
      const abierto = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(abierto));
      document.body.classList.toggle('menu-abierto', abierto);
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) cerrar(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  }

  function anuncios() {
    const msgs = [...document.querySelectorAll('.anuncio__msg')];
    if (msgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    setInterval(() => {
      msgs[i].classList.remove('is-active');
      i = (i + 1) % msgs.length;
      msgs[i].classList.add('is-active');
    }, 4500);
  }

  /* Tarjeta de producto reutilizada en portada y catálogo. */
  function tarjeta(p) {
    const c = p.colores[0];
    const swatches = p.colores.filter(x => x.hex).slice(0, 5)
      .map(x => `<span class="swatch" style="--sw:${x.hex}" title="${esc(x.nombre)}"></span>`).join('');
    const extra = p.colores.length > 5 ? `<span class="swatch-mas">+${p.colores.length - 5}</span>` : '';
    return `
      <a class="tarjeta" href="producto.html?id=${encodeURIComponent(p.id)}">
        <div class="tarjeta__img">
          ${p.etiqueta ? `<span class="tarjeta__etiqueta">${esc(p.etiqueta)}</span>` : ''}
          ${p.colores.some(x => x.frente) ? '<span class="tarjeta__probador">Pruébatelos</span>' : ''}
          <img src="${esc(c.img)}" alt="${esc(p.nombre)}" loading="lazy" width="600" height="400">
        </div>
        <div class="tarjeta__info">
          <span class="tarjeta__cat">${esc(p.material)} · ${esc(p.forma)}</span>
          <h3>${esc(p.nombre)}</h3>
          <div class="tarjeta__pie">
            <span class="tarjeta__precio">${fmt(p.precio)}</span>
            <span class="swatches">${swatches}${extra}</span>
          </div>
        </div>
      </a>`;
  }

  /* Apariciones para páginas sin motor de escenas. */
  function apariciones() {
    if (window.Scrolltelling) return;
    document.querySelectorAll('[data-reveal]').forEach(n => n.classList.add('is-visible'));
  }

  encabezado();
  pie();
  actualizarContador();
  menu();
  anuncios();
  addEventListener('DOMContentLoaded', apariciones);

  window.App = { fmt, esc, waLink, Carro, tarjeta, C };
})();
