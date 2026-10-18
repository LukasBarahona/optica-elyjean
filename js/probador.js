/* Probador virtual con realidad aumentada.
   - MediaPipe Face Landmarker detecta la cara en el mismo navegador: la imagen nunca sale del equipo.
   - Los lentes son fotos de frente sin fondo (campo "frente" en productos.js).
   - Se alinean con las esquinas de los ojos (ángulo), el ancho de la cara (tamaño) y el giro de la cabeza (perspectiva simple). */
import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODELO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
// Puntos de la malla facial de MediaPipe
const OJO_DER_EXT = 33, OJO_DER_INT = 133, OJO_IZQ_INT = 362, OJO_IZQ_EXT = 263, SIEN_DER = 234, SIEN_IZQ = 454;
const ANCLA_Y = 0.46;      // altura relativa de los cristales dentro de la foto del marco
const ANCHO_CARA = 1.02;   // ancho del marco respecto del ancho de la cara a la altura de las sienes

const { fmt, esc } = window.App;
const $ = s => document.querySelector(s);
const lienzo = $('#lienzo');
const ctx = lienzo.getContext('2d');

/* Modelos con foto de frente */
const opciones = [];
window.PRODUCTOS.forEach(p => p.colores.forEach((c, i) => { if (c.frente) opciones.push({ p, c, i }); }));
const params = new URLSearchParams(location.search);
let actual = Math.max(0, opciones.findIndex(o => o.p.id === params.get('id') && o.i === Number(params.get('c') || 0)));
if (actual < 0 || !opciones[actual]) actual = 0;

/* Estado */
let detector = null, modo = null, video = null, stream = null, ultimoTiempo = -1, suave = null, fotoActual = null, caraFoto = null;

const imagenes = new Map();
function imagen(src) {
  if (!imagenes.has(src)) { const im = new Image(); im.src = src; imagenes.set(src, im); }
  return imagenes.get(src);
}

/* Selector */
$('#lista').innerHTML = opciones.map((o, k) => `
  <button class="miniatura" role="option" aria-selected="${k === actual}" data-k="${k}" type="button">
    <img src="${esc(o.c.frente)}" alt="">
    <span>${esc(o.p.codigo)} · ${esc(o.c.nombre)}</span>
  </button>`).join('');
$('#lista').addEventListener('click', e => {
  const b = e.target.closest('.miniatura');
  if (b) elegir(Number(b.dataset.k));
});
function elegir(k) {
  actual = k;
  const o = opciones[k];
  document.querySelectorAll('.miniatura').forEach(b => b.setAttribute('aria-selected', String(Number(b.dataset.k) === k)));
  $('#selNombre').textContent = `${o.p.nombre} · ${o.c.nombre}`;
  $('#selPrecio').textContent = fmt(o.p.precio);
  $('#selFicha').href = `producto.html?id=${encodeURIComponent(o.p.id)}`;
  imagen(o.c.frente);
  history.replaceState(null, '', `?id=${encodeURIComponent(o.p.id)}&c=${o.i}`);
  if (modo === 'foto') dibujarFoto();
}
elegir(actual);
document.querySelector(`.miniatura[data-k="${actual}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

const estado = (texto) => { $('#capaEstado').hidden = !texto; $('#textoEstado').textContent = texto || ''; };

async function cargarDetector() {
  if (detector) return detector;
  estado('Cargando probador…');
  const archivos = await FilesetResolver.forVisionTasks(WASM);
  const opts = d => ({ baseOptions: { modelAssetPath: MODELO, delegate: d }, runningMode: 'VIDEO', numFaces: 1 });
  try { detector = await FaceLandmarker.createFromOptions(archivos, opts('GPU')); }
  catch { detector = await FaceLandmarker.createFromOptions(archivos, opts('CPU')); }
  return detector;
}

/* Geometría: de los puntos de la cara a posición, tamaño, ángulo y perspectiva del marco */
function pose(lm, w, h) {
  const P = i => ({ x: lm[i].x * w, y: lm[i].y * h });
  const dE = P(OJO_DER_EXT), dI = P(OJO_DER_INT), iI = P(OJO_IZQ_INT), iE = P(OJO_IZQ_EXT), sD = P(SIEN_DER), sI = P(SIEN_IZQ);
  const ojoD = { x: (dE.x + dI.x) / 2, y: (dE.y + dI.y) / 2 };
  const ojoI = { x: (iE.x + iI.x) / 2, y: (iE.y + iI.y) / 2 };
  const centro = { x: (ojoD.x + ojoI.x) / 2, y: (ojoD.y + ojoI.y) / 2 };
  const ancho = Math.hypot(sI.x - sD.x, sI.y - sD.y) * ANCHO_CARA;
  const angulo = Math.atan2(iE.y - dE.y, iE.x - dE.x);
  // Giro lateral: si un lado de la cara se ve más angosto, el marco se comprime un poco.
  const lD = Math.hypot(centro.x - sD.x, centro.y - sD.y), lI = Math.hypot(sI.x - centro.x, sI.y - centro.y);
  const giro = Math.min(0.3, Math.abs(lD - lI) / (lD + lI));
  return { x: centro.x, y: centro.y, ancho, angulo, sx: 1 - giro * 0.8 };
}
const mezclar = (a, b, t) => a ? Object.fromEntries(Object.keys(b).map(k => [k, a[k] + (b[k] - a[k]) * t])) : b;

function dibujarLentes(p) {
  const im = imagen(opciones[actual].c.frente);
  if (!im.complete || !im.naturalWidth) return;
  const escala = Number($('#tamano').value) / 100;
  const w = p.ancho * escala, h = w * im.naturalHeight / im.naturalWidth;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angulo);
  ctx.scale(p.sx, 1);
  ctx.drawImage(im, -w / 2, -h * ANCLA_Y, w, h);
  ctx.restore();
}

/* Cámara */
async function iniciarCamara() {
  try {
    detenerCamara();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin-camara');
    estado('Pidiendo permiso para la cámara…');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video = video || Object.assign(document.createElement('video'), { playsInline: true, muted: true });
    video.srcObject = stream;
    await video.play();
    await cargarDetector();
    await detector.setOptions({ runningMode: 'VIDEO' });
    $('#avisoCara').textContent = 'Mira de frente a la cámara, con buena luz.';
    lienzo.width = video.videoWidth; lienzo.height = video.videoHeight;
    lienzo.classList.add('en-vivo');
    modo = 'camara'; suave = null;
    $('#capaInicio').hidden = true; $('#barra').hidden = false; $('#btnVolverCamara').hidden = true;
    estado('');
    requestAnimationFrame(cuadro);
  } catch (err) {
    detenerCamara();
    estado('');
    $('#capaInicio').hidden = false;
    const msg = err && err.name === 'NotAllowedError'
      ? 'No diste permiso para usar la cámara. Puedes activarlo en tu navegador o usar una foto.'
      : 'No pudimos abrir la cámara en este equipo. Prueba con una foto.';
    $('#capaInicio').querySelector('p').textContent = msg;
  }
}

function cuadro() {
  if (modo !== 'camara' || !video) return;
  if (video.currentTime !== ultimoTiempo && video.readyState >= 2) {
    ultimoTiempo = video.currentTime;
    const res = detector.detectForVideo(video, performance.now());
    const w = lienzo.width, h = lienzo.height;
    ctx.save();
    ctx.translate(w, 0); ctx.scale(-1, 1);      // vista espejo, como un espejo real
    ctx.drawImage(video, 0, 0, w, h);
    const lm = res.faceLandmarks && res.faceLandmarks[0];
    $('#avisoCara').hidden = !!lm;
    if (lm) { suave = mezclar(suave, pose(lm, w, h), 0.55); dibujarLentes(suave); }
    else suave = null;
    ctx.restore();
  }
  requestAnimationFrame(cuadro);
}

function detenerCamara() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  if (modo === 'camara') modo = null;
}

/* Foto subida */
async function usarFoto(archivo) {
  if (!archivo) return;
  detenerCamara();
  const url = URL.createObjectURL(archivo);
  const im = new Image();
  // onload en vez de decode(): decode() no termina en algunos navegadores integrados.
  try { await new Promise((ok, ko) => { im.onload = ok; im.onerror = ko; im.src = url; }); }
  catch { estado(''); return; }
  await cargarDetector();
  estado('Buscando tu cara…');
  await detector.setOptions({ runningMode: 'IMAGE' });
  const res = detector.detect(im);
  estado('');
  fotoActual = im;
  caraFoto = res.faceLandmarks && res.faceLandmarks[0];
  // Limitar el tamaño del lienzo para fotos muy grandes
  const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
  lienzo.width = Math.round(im.naturalWidth * k); lienzo.height = Math.round(im.naturalHeight * k);
  lienzo.classList.remove('en-vivo');
  modo = 'foto';
  $('#capaInicio').hidden = true; $('#barra').hidden = false; $('#btnVolverCamara').hidden = false;
  dibujarFoto();
}

function dibujarFoto() {
  if (!fotoActual) return;
  ctx.drawImage(fotoActual, 0, 0, lienzo.width, lienzo.height);
  $('#avisoCara').hidden = !!caraFoto;
  $('#avisoCara').textContent = caraFoto ? '' : 'No encontramos una cara en la foto. Prueba con una selfie de frente.';
  if (caraFoto) dibujarLentes(pose(caraFoto, lienzo.width, lienzo.height));
}

/* Controles */
$('#btnCamara').addEventListener('click', iniciarCamara);
$('#btnVolverCamara').addEventListener('click', iniciarCamara);
$('#foto').addEventListener('change', e => { usarFoto(e.target.files[0]); e.target.value = ''; });
$('#tamano').addEventListener('input', () => { if (modo === 'foto') dibujarFoto(); });
$('#btnFoto').addEventListener('click', () => {
  lienzo.toBlob(b => {
    if (!b) return;
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `elyjean-${opciones[actual].p.codigo}.png` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
});
addEventListener('pagehide', detenerCamara);
