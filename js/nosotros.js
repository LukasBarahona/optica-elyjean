/* Nosotros: tiendas, teléfono y formulario de soporte al cliente. */
(() => {
  'use strict';
  const { esc, enviar, C } = window.App;

  /* Teléfono desde la configuración */
  document.querySelectorAll('[data-tel]').forEach(a => { a.href = `tel:+${C.whatsapp}`; });
  document.querySelectorAll('[data-tel-texto]').forEach(s => { s.textContent = C.telefonoVisible; });

  /* Tiendas */
  document.getElementById('tiendasGrid').innerHTML = C.tiendas.map(t => `
    <article class="tienda">
      <h3>${esc(t.nombre)}</h3>
      <p>${esc(t.direccion)}</p>
      <p>${esc(t.horario)}</p>
      <p class="pendiente">Dirección pendiente de confirmar</p>
    </article>`).join('');

  /* Formulario → correo o WhatsApp, a elección del cliente */
  const form = document.getElementById('formSoporte');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const error = document.getElementById('formError');
    const obligatorios = [form.nombre, form.mensaje];
    const faltantes = obligatorios.filter(c => !c.value.trim());
    obligatorios.forEach(c => c.closest('.campo').classList.toggle('campo--error', faltantes.includes(c)));
    if (faltantes.length) { error.textContent = 'Escribe tu nombre y lo que pasó para poder ayudarte.'; faltantes[0].focus(); return; }
    error.textContent = '';
    let texto = `Hola, soy ${form.nombre.value.trim()}. ${form.tipo.value}.`;
    if (form.pedido.value.trim()) texto += ` Pedido o boleta: ${form.pedido.value.trim()}.`;
    texto += ` ${form.mensaje.value.trim()}`;
    enviar(e.submitter, `${form.tipo.value} · ${form.nombre.value.trim()}`, texto);
  });
})();
