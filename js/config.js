/* Configuración de la tienda: lo que más se edita.
   PRECIOS DE EJEMPLO: reemplazar por los precios reales antes de publicar. */
window.CONFIG = {
  marca: 'Ópticas Elyjean',
  // Número de WhatsApp en formato internacional, sin + ni espacios (PENDIENTE: número real)
  whatsapp: '56999999999',
  telefonoVisible: '+569 9999 9999',

  // PENDIENTE: direcciones y horarios reales de las dos tiendas
  tiendas: [
    { id: 'tienda-1', nombre: 'Tienda 1', direccion: 'Dirección por confirmar', horario: 'Horario por confirmar' },
    { id: 'tienda-2', nombre: 'Tienda 2', direccion: 'Dirección por confirmar', horario: 'Horario por confirmar' }
  ],

  // Tipos de cristal. "para" indica en qué categorías de marco se ofrece.
  cristales: [
    { id: 'neutro', nombre: 'Sin aumento', detalle: 'Cristal neutro, sin receta.', precio: 0, receta: false, para: ['adultos', 'ninos'] },
    { id: 'monofocal', nombre: 'Monofocal', detalle: 'Una sola distancia: lejos o cerca.', precio: 24990, receta: true, para: ['adultos', 'ninos'] },
    { id: 'descanso', nombre: 'Descanso / lectura', detalle: 'Para leer y trabajar de cerca sin cansar la vista.', precio: 19990, receta: true, para: ['adultos'] },
    { id: 'bifocal', nombre: 'Bifocal', detalle: 'Lejos arriba y lectura en un segmento inferior.', precio: 44990, receta: true, adicion: true, para: ['adultos'] },
    { id: 'multifocal', nombre: 'Multifocal', detalle: 'Lejos, intermedio y cerca, sin línea visible.', precio: 89990, receta: true, adicion: true, para: ['adultos'] },
    { id: 'sol-neutro', nombre: 'Sol sin aumento', detalle: 'Cristal de sol con filtro UV.', precio: 0, receta: false, para: ['sol'] },
    { id: 'sol-aumento', nombre: 'Sol con aumento', detalle: 'Cristal de sol con filtro UV y tu receta.', precio: 39990, receta: true, para: ['sol'] }
  ],

  // Tratamientos opcionales. "sinSol": no se ofrece en marcos de sol. "conReceta": solo si el cristal lleva aumento.
  tratamientos: [
    { id: 'antirreflejo', nombre: 'Antirreflejo', detalle: 'Menos reflejos y brillos en la noche.', precio: 14990 },
    { id: 'filtro-azul', nombre: 'Filtro luz azul', detalle: 'Para pantallas y computador.', precio: 19990, sinSol: true },
    { id: 'fotocromatico', nombre: 'Fotocromático', detalle: 'Se oscurece con el sol.', precio: 34990, sinSol: true },
    { id: 'adelgazado', nombre: 'Cristal adelgazado', detalle: 'Más delgado y liviano para recetas altas.', precio: 29990, conReceta: true }
  ],

  entregas: [
    { id: 'domicilio', nombre: 'Envío a domicilio', detalle: 'Te lo llevamos a tu casa.', precio: 3990 },
    { id: 'tienda', nombre: 'Retiro en tienda', detalle: 'Retira en la tienda que elijas.', precio: 0 },
    { id: 'empresa', nombre: 'Entrega en tu empresa', detalle: 'Si tu empresa tiene convenio con nosotros.', precio: 0 }
  ]
};
