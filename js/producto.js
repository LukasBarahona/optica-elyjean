/* Ficha de producto y configurador: color → cristal → tratamientos → receta → resumen. */
(() => {
  'use strict';
  const { fmt, esc, Carro, C } = window.App;
  const id = new URLSearchParams(location.search).get('id');
  const p = window.PRODUCTOS.find(x => x.id === id) || window.PRODUCTOS[0];
  const CATS = { adultos: 'Marcos ópticos', ninos: 'Marcos para niños', sol: 'Lentes de sol' };
  const $ = s => document.querySelector(s);

  const st = {
    color: 0,
    cristal: (C.cristales.find(c => c.para.includes(p.categoria) && c.receta) || C.cristales.find(c => c.para.includes(p.categoria))).id,
    trat: new Set(),
    modo: 'archivo',
    archivo: null
  };
  if (p.categoria === 'sol') st.cristal = 'sol-neutro';

  /* Datos del producto */
  document.title = `${p.nombre} | Ópticas Elyjean`;
  $('#migaCat').textContent = CATS[p.categoria];
  $('#migaCat').href = `catalogo.html?cat=${p.categoria}`;
  $('#migaNombre').textContent = p.nombre;
  $('#fichaCat').textContent = CATS[p.categoria];
  $('#fichaNombre').textContent = p.nombre;
  $('#fichaPrecio').textContent = fmt(p.precio);
  $('#fichaDatos').innerHTML = [p.material, p.forma, p.publico, p.medidas ? `Medidas ${p.medidas}` : null, `Código ${p.codigo}`]
    .filter(Boolean).map(d => `<span>${esc(d)}</span>`).join('');

  /* 1 · Color */
  const variosColores = p.colores.length === 1 && !p.colores[0].hex;
  $('#campoColorLibre').hidden = !variosColores;
  $('#colores').innerHTML = p.colores.map((c, i) => `
    <button type="button" class="color" aria-pressed="${i === 0}" data-i="${i}" aria-label="${esc(c.nombre)}">
      <img src="${esc(c.img)}" alt="" width="64" height="44">
    </button>`).join('');
  $('#colores').addEventListener('click', e => {
    const b = e.target.closest('.color');
    if (!b) return;
    st.color = Number(b.dataset.i);
    document.querySelectorAll('.color').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    pintarColor();
  });
  function pintarColor() {
    const c = p.colores[st.color];
    $('#imgPrincipal').src = c.img;
    $('#imgPrincipal').alt = `${p.nombre}, color ${c.nombre}`;
    $('#colorNombre').textContent = variosColores ? 'Exhibidor con varios colores disponibles.' : `Color: ${c.nombre}`;
    // Probador virtual: el botón aparece solo si el color tiene foto de frente (y el probador no está abierto).
    const probador = $('#btnProbador');
    if ($('#probador').hidden) probador.hidden = !c.frente;
    document.dispatchEvent(new CustomEvent('ficha:color'));
    resumen();
  }

  /* 2 · Cristal */
  const cristales = C.cristales.filter(c => c.para.includes(p.categoria));
  $('#cristales').innerHTML = cristales.map(c => `
    <label class="opcion-card">
      <input type="radio" name="cristal" value="${c.id}" ${c.id === st.cristal ? 'checked' : ''}>
      <span><strong>${esc(c.nombre)}</strong><small>${esc(c.detalle)}</small></span>
      <span class="precio">${c.precio ? '+' + fmt(c.precio) : 'Incluido'}</span>
    </label>`).join('');
  $('#cristales').addEventListener('change', e => { st.cristal = e.target.value; actualizar(); });

  /* 3 · Tratamientos */
  $('#tratamientos').innerHTML = C.tratamientos.map(t => `
    <label class="opcion-card">
      <input type="checkbox" value="${t.id}">
      <span><strong>${esc(t.nombre)}</strong><small>${esc(t.detalle)}</small></span>
      <span class="precio">+${fmt(t.precio)}</span>
    </label>`).join('');
  $('#tratamientos').addEventListener('change', e => { e.target.checked ? st.trat.add(e.target.value) : st.trat.delete(e.target.value); resumen(); });

  /* 4 · Receta */
  const rango = (desde, hasta, paso, signo = true) => {
    const out = [];
    for (let v = desde; v <= hasta + 1e-9; v += paso) out.push(v);
    return out.map(v => { const t = Math.abs(v).toFixed(2).replace('.', ','); return { v: v.toFixed(2), t: (v > 0 && signo ? '+' : v < 0 ? '-' : '') + t }; });
  };
  const opciones = (lista, def) => `<option value="">—</option>` + lista.map(o => `<option value="${o.v}" ${o.v === def ? 'selected' : ''}>${o.t}</option>`).join('');
  document.querySelectorAll('[data-campo="esf"]').forEach(s => { s.innerHTML = opciones(rango(-20, 20, 0.25)); });
  document.querySelectorAll('[data-campo="cil"]').forEach(s => { s.innerHTML = opciones(rango(-6, 0, 0.25).reverse(), '0.00'); });
  document.querySelectorAll('[data-campo="add"]').forEach(s => { s.innerHTML = opciones(rango(0.75, 3.5, 0.25)); });
  $('#tiendaConsulta').innerHTML = C.tiendas.map(t => `<option value="${t.id}">${esc(t.nombre)} · ${esc(t.direccion)}</option>`).join('');

  document.querySelectorAll('.receta-tabs button').forEach(b => b.addEventListener('click', () => {
    st.modo = b.dataset.modo;
    document.querySelectorAll('.receta-tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('.receta-panel').forEach(pn => { pn.hidden = pn.dataset.panel !== st.modo; });
    $('#errorConfig').textContent = '';
    resumen();
  }));

  $('#archivo').addEventListener('change', e => {
    const f = e.target.files[0];
    const ok = $('#archivoOk');
    if (!f) { st.archivo = null; ok.hidden = true; return; }
    if (f.size > 10 * 1024 * 1024) { $('#errorConfig').textContent = 'El archivo pesa más de 10 MB. Prueba con una foto más liviana.'; e.target.value = ''; return; }
    st.archivo = f.name;
    ok.hidden = false;
    ok.innerHTML = (f.type.startsWith('image/') ? `<img src="${URL.createObjectURL(f)}" alt="Vista previa de la receta">` : '') + `<span>✓ ${esc(f.name)}</span>`;
    $('#errorConfig').textContent = '';
  });

  const cristalSel = () => C.cristales.find(c => c.id === st.cristal);

  function actualizar() {
    const cr = cristalSel();
    // Tratamientos disponibles según el cristal y el tipo de marco
    document.querySelectorAll('#tratamientos input').forEach(i => {
      const t = C.tratamientos.find(x => x.id === i.value);
      const off = (t.sinSol && p.categoria === 'sol') || (t.conReceta && !cr.receta);
      i.disabled = off;
      if (off) { i.checked = false; st.trat.delete(t.id); }
    });
    // La receta solo aplica a cristales con aumento
    const paso = $('#pasoReceta');
    paso.setAttribute('aria-disabled', String(!cr.receta));
    paso.querySelector('h2').lastChild.textContent = cr.receta ? 'Tu receta' : 'Tu receta (no se necesita para este cristal)';
    document.querySelectorAll('.col-add').forEach(c => { c.hidden = !cr.adicion; });
    resumen();
  }

  function leerGrados() {
    const ojo = o => {
      const fila = document.querySelector(`[data-ojo="${o}"]`);
      const v = c => fila.querySelector(`[data-campo="${c}"]`).value;
      return { esf: v('esf'), cil: v('cil'), eje: v('eje'), add: v('add') };
    };
    return { od: ojo('od'), oi: ojo('oi'), dp: $('#dp').value };
  }

  function validar() {
    const cr = cristalSel();
    if (variosColores && !$('#colorLibre').value.trim()) return 'Cuéntanos qué color prefieres del exhibidor.';
    if (!cr.receta) return '';
    if (st.modo === 'archivo' && !st.archivo) return 'Sube una foto o PDF de tu receta, o elige otra opción.';
    if (st.modo === 'grados') {
      const g = leerGrados();
      for (const [nombre, o] of [['ojo derecho', g.od], ['ojo izquierdo', g.oi]]) {
        if (!o.esf) return `Falta la esfera del ${nombre}.`;
        if (o.cil && Number(o.cil) !== 0) {
          const eje = Number(o.eje);
          if (o.eje === '' || !(eje >= 0 && eje <= 180)) return `El eje del ${nombre} debe estar entre 0 y 180.`;
        }
        if (cr.adicion && !o.add) return `Falta la adición del ${nombre}.`;
      }
      if (g.dp && !(Number(g.dp) >= 45 && Number(g.dp) <= 80)) return 'La distancia pupilar suele estar entre 45 y 80 mm.';
    }
    return '';
  }

  function total() {
    const cr = cristalSel();
    return p.precio + cr.precio + [...st.trat].reduce((s, id) => s + C.tratamientos.find(t => t.id === id).precio, 0);
  }

  function resumen() {
    const cr = cristalSel();
    const filas = [[`Marco ${p.codigo}`, fmt(p.precio)], [cr.nombre, cr.precio ? fmt(cr.precio) : 'Incluido']];
    st.trat.forEach(id => { const t = C.tratamientos.find(x => x.id === id); filas.push([t.nombre, fmt(t.precio)]); });
    if (cr.receta && st.modo === 'consulta') filas.push(['Consulta visual', 'Gratis']);
    $('#resumen').innerHTML = filas.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')
      + `<dt class="total">Total</dt><dd class="total">${fmt(total())}</dd>`;
  }

  $('#agregar').addEventListener('click', () => {
    const err = validar();
    $('#errorConfig').textContent = err;
    if (err) return;
    const cr = cristalSel();
    const c = p.colores[st.color];
    const receta = !cr.receta ? { modo: 'no-aplica' }
      : st.modo === 'archivo' ? { modo: 'archivo', archivo: st.archivo }
      : st.modo === 'grados' ? { modo: 'grados', ...leerGrados() }
      : { modo: 'consulta', tienda: $('#tiendaConsulta').value };
    Carro.agregar({
      id: p.id, nombre: p.nombre, img: c.img,
      color: variosColores ? $('#colorLibre').value.trim() : c.nombre,
      precioMarco: p.precio,
      cristal: { id: cr.id, nombre: cr.nombre, precio: cr.precio },
      tratamientos: [...st.trat].map(id => { const t = C.tratamientos.find(x => x.id === id); return { nombre: t.nombre, precio: t.precio }; }),
      receta, total: total()
    });
    const toast = $('#toast');
    toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), 5000);
  });

  // Para el probador virtual (js/probador.js)
  window.Ficha = { producto: p, color: () => p.colores[st.color] };

  pintarColor();
  actualizar();
})();
