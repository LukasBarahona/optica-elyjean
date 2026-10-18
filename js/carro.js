/* Carro y pago simulado. */
(() => {
  'use strict';
  const { fmt, esc, Carro, C } = window.App;
  const $ = s => document.querySelector(s);
  let entrega = 'domicilio';

  const RECETA = {
    'no-aplica': () => 'Sin receta (cristal sin aumento)',
    archivo: r => `Receta adjunta: ${r.archivo}`,
    grados: r => `Grados: OD ${r.od.esf}/${r.od.cil || '0.00'} · OI ${r.oi.esf}/${r.oi.cil || '0.00'}${r.dp ? ` · DP ${r.dp}` : ''}`,
    consulta: r => `Consulta gratis en ${(C.tiendas.find(t => t.id === r.tienda) || {}).nombre || 'tienda'}`
  };

  $('#entregas').innerHTML = C.entregas.map(e => `
    <label class="opcion-card">
      <input type="radio" name="entrega" value="${e.id}" ${e.id === entrega ? 'checked' : ''}>
      <span><strong>${esc(e.nombre)}</strong><small>${esc(e.detalle)}</small></span>
      <span class="precio">${e.precio ? fmt(e.precio) : 'Gratis'}</span>
    </label>`).join('');
  $('#tienda').innerHTML = C.tiendas.map(t => `<option value="${t.id}">${esc(t.nombre)} · ${esc(t.direccion)}</option>`).join('');
  $('#entregas').addEventListener('change', e => {
    entrega = e.target.value;
    $('#campoDireccion').hidden = entrega !== 'domicilio';
    $('#campoTienda').hidden = entrega !== 'tienda';
    $('#campoEmpresa').hidden = entrega !== 'empresa';
    totales();
  });

  function render() {
    const items = Carro.leer();
    if (!items.length) {
      $('#carro').innerHTML = `
        <div class="carro__vacio" style="grid-column:1/-1">
          <h2>Tu carro está vacío</h2>
          <p>Elige un marco y arma tus lentes con tu receta.</p>
          <a class="btn btn--rojo" href="catalogo.html">Ver marcos</a>
        </div>`;
      return;
    }
    $('#items').innerHTML = items.map(i => `
      <article class="item">
        <img src="${esc(i.img)}" alt="" width="110" height="73">
        <div>
          <h3>${esc(i.nombre)}</h3>
          <ul>
            <li>Color: ${esc(i.color)}</li>
            <li>Cristal: ${esc(i.cristal.nombre)}</li>
            ${i.tratamientos.length ? `<li>Tratamientos: ${esc(i.tratamientos.map(t => t.nombre).join(', '))}</li>` : ''}
            <li>${esc(RECETA[i.receta.modo](i.receta))}</li>
          </ul>
        </div>
        <div class="item__precio">${fmt(i.total)}<button class="item__quitar" data-uid="${esc(i.uid)}" type="button">Quitar</button></div>
      </article>`).join('');
    totales();
  }

  function totales() {
    const items = Carro.leer();
    if (!items.length) return;
    const sub = items.reduce((s, i) => s + i.total, 0);
    const env = C.entregas.find(e => e.id === entrega).precio;
    $('#totales').innerHTML = `<dt>Subtotal (${items.length} ${items.length === 1 ? 'producto' : 'productos'})</dt><dd>${fmt(sub)}</dd>
      <dt>Entrega</dt><dd>${env ? fmt(env) : 'Gratis'}</dd>
      <dt class="total">Total</dt><dd class="total">${fmt(sub + env)}</dd>`;
  }

  $('#carro').addEventListener('click', e => {
    const b = e.target.closest('.item__quitar');
    if (b) { Carro.quitar(b.dataset.uid); render(); }
  });

  $('#checkout').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#errorCheckout');
    const req = [['#cNombre', 'tu nombre'], ['#cEmail', 'tu correo'], ['#cTel', 'tu teléfono']];
    if (entrega === 'domicilio') req.unshift(['#direccion', 'la dirección de entrega']);
    if (entrega === 'empresa') req.unshift(['#empresa', 'el nombre de tu empresa']);
    document.querySelectorAll('.campo--error').forEach(c => c.classList.remove('campo--error'));
    const falta = req.find(([s]) => !$(s).value.trim());
    if (falta) { err.textContent = `Falta ${falta[1]}.`; $(falta[0]).closest('.campo').classList.add('campo--error'); $(falta[0]).focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test($('#cEmail').value.trim())) { err.textContent = 'Revisa el correo.'; $('#cEmail').focus(); return; }
    err.textContent = '';
    const nombre = $('#cNombre').value.trim().split(' ')[0];
    Carro.vaciar();
    $('#carro').innerHTML = `
      <div class="confirmacion" style="grid-column:1/-1">
        <span class="etiqueta">Pedido de prueba</span>
        <h2>¡Gracias, ${esc(nombre)}!</h2>
        <p>Este es un prototipo: no se hizo ningún cobro. En la tienda final, aquí el cliente paga con Webpay o Mercado Pago y recibe la confirmación por correo.</p>
        <a class="btn btn--azul" href="index.html">Volver al inicio</a>
      </div>`;
    scrollTo({ top: 0 });
  });

  render();
})();
