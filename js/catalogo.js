/* Catálogo con filtros. El estado vive en la URL (?cat=sol&forma=redondo&q=...) para poder compartir el enlace. */
(() => {
  'use strict';
  const { esc, tarjeta } = window.App;
  const P = window.PRODUCTOS;
  const NOMBRES = { categoria: { adultos: 'Ópticos adultos', ninos: 'Niños', sol: 'Sol' } };
  const GRUPOS = ['categoria', 'forma', 'material', 'publico'];
  const URLP = new URLSearchParams(location.search);
  const estado = {
    q: (URLP.get('q') || '').trim().toLowerCase(),
    orden: URLP.get('orden') || 'destacados',
    filtros: Object.fromEntries(GRUPOS.map(g => [g, new Set((URLP.get(g === 'categoria' ? 'cat' : g) || '').split(',').filter(Boolean))]))
  };
  const etiqueta = (g, v) => (NOMBRES[g] && NOMBRES[g][v]) || v;

  // Opciones de cada grupo, con conteo
  GRUPOS.forEach(g => {
    const cont = document.querySelector(`[data-grupo="${g}"]`);
    const valores = [...new Set(P.map(p => p[g]))].sort((a, b) => a.localeCompare(b, 'es'));
    valores.forEach(v => {
      const n = P.filter(p => p[g] === v).length;
      const l = document.createElement('label');
      l.className = 'opcion';
      l.innerHTML = `<input type="checkbox" value="${esc(v)}"> ${esc(etiqueta(g, v))} <small>${n}</small>`;
      const input = l.querySelector('input');
      input.checked = estado.filtros[g].has(v);
      input.addEventListener('change', () => { input.checked ? estado.filtros[g].add(v) : estado.filtros[g].delete(v); render(); });
      cont.appendChild(l);
    });
  });

  const orden = document.getElementById('orden');
  orden.value = estado.orden;
  orden.addEventListener('change', () => { estado.orden = orden.value; render(); });
  document.getElementById('limpiar').addEventListener('click', () => {
    GRUPOS.forEach(g => estado.filtros[g].clear());
    estado.q = '';
    document.querySelectorAll('.filtros-panel input').forEach(i => { i.checked = false; });
    render();
  });
  if (matchMedia('(max-width:860px)').matches) document.getElementById('filtros').open = false;
  const q = document.getElementById('q');
  if (q) q.value = estado.q;

  function coincide(p) {
    if (estado.q) {
      const texto = [p.nombre, p.codigo, p.material, p.forma, p.categoria, p.publico, ...p.colores.map(c => c.nombre)].join(' ').toLowerCase();
      if (!estado.q.split(/\s+/).every(t => texto.includes(t))) return false;
    }
    return GRUPOS.every(g => !estado.filtros[g].size || estado.filtros[g].has(p[g]));
  }

  function render() {
    let lista = P.filter(coincide);
    if (estado.orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
    else if (estado.orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
    else if (estado.orden === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    else lista.sort((a, b) => (b.etiqueta ? 1 : 0) - (a.etiqueta ? 1 : 0));

    document.getElementById('grilla').innerHTML = lista.length
      ? lista.map(tarjeta).join('')
      : '<p class="vacio">No encontramos marcos con esos filtros. Prueba quitando alguno.</p>';
    document.getElementById('conteo').textContent = `${lista.length} ${lista.length === 1 ? 'marco' : 'marcos'}`;

    // Título según categoría
    const cats = [...estado.filtros.categoria];
    const titulo = cats.length === 1 ? { adultos: 'Marcos ópticos', ninos: 'Marcos para niños', sol: 'Lentes de sol' }[cats[0]] : 'Todos los marcos';
    document.getElementById('tituloCat').textContent = estado.q ? `Resultados para “${estado.q}”` : titulo;
    document.getElementById('migaCat').textContent = titulo;

    // Filtros activos como chips
    const chips = [];
    if (estado.q) chips.push(`<button data-quitar="q">Búsqueda: ${esc(estado.q)} ✕</button>`);
    GRUPOS.forEach(g => estado.filtros[g].forEach(v => chips.push(`<button data-quitar="${g}" data-valor="${esc(v)}">${esc(etiqueta(g, v))} ✕</button>`)));
    const cont = document.getElementById('chipsActivos');
    cont.innerHTML = chips.join('');
    cont.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.quitar === 'q') { estado.q = ''; if (q) q.value = ''; }
      else {
        estado.filtros[b.dataset.quitar].delete(b.dataset.valor);
        const input = document.querySelector(`[data-grupo="${b.dataset.quitar}"] input[value="${CSS.escape(b.dataset.valor)}"]`);
        if (input) input.checked = false;
      }
      render();
    }));

    // URL compartible
    const u = new URLSearchParams();
    if (estado.q) u.set('q', estado.q);
    GRUPOS.forEach(g => { if (estado.filtros[g].size) u.set(g === 'categoria' ? 'cat' : g, [...estado.filtros[g]].join(',')); });
    if (estado.orden !== 'destacados') u.set('orden', estado.orden);
    history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  }
  render();
})();
