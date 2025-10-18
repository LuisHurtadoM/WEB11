// JavaScript Document
function pintarLogo() {
  var micanvas = document.getElementById("micanvas"); // espacio de trazado de caracteristicas 2D.
  var papel = micanvas.getContext('2d');
  var ancho;
  if (micanvas.width < 424) {
    ancho = 2 * Math.floor(micanvas.width * 0.25);
  } else {
    ancho = 212;
  }
  var alto = 2 * Math.floor(0.2783018867 * ancho); //    relacion aspecto logo (118/212) 
  var espesor = Math.ceil(0.0566037735 * ancho);
  var yv1a = 68 - alto * 0.5;
  var yv1b = 0.2288135593 * alto;
  var yv1 = Math.ceil(yv1a + yv1b);
  var yv2 = 136 - yv1 - espesor;
  var xv1 = 0;
  var xv2 = ancho;
  var xm1 = 2 * Math.floor(0.3915094339 * ancho);
  var xm2 = 2 * Math.floor(0.5801886792 * ancho);
  var ym1 = 0;
  var ym2 = 136 - alto;
  var dif = 2 * Math.ceil(0.0141509433 * ancho);
  var ymm = 68 - 0.5 * alto + dif;

  function diagonal() {
    papel.save();
    papel.translate(0.855 * ancho, ymm);
    papel.rotate(-0.471225);
    papel.fillRect(0, 0, espesor, alto - dif);
    papel.translate(-0.855 * ancho, -ymm);
    papel.restore();
  }

  function animacionm() {
    if (ym1 < ym2) {
      papel.clearRect(0, 0, 2 * ancho, 136);
      papel.fillStyle = "rgba(0,200,0,1)";
      papel.fillRect(xv1, yv1, ancho, espesor);
      papel.fillRect(xv2, yv2, ancho, espesor);
      papel.fillStyle = "rgba(150,0,200,1)";
      papel.fillRect(xm1, ym1, espesor, alto);
      papel.fillRect(xm2, ym2, espesor, alto);
      ym1 += 1;
      ym2 -= 1;
      setTimeout(animacionm, 50);
    } else {
      diagonal();
    }
  }

  function animacionv() {
    if (xv1 !== xv2) {
      xv1 += 1;
      xv2 -= 1;
      papel.clearRect(0, 0, 2 * ancho, 136);
      papel.fillStyle = "rgba(0,200,0,1)";
      papel.fillRect(xv1, yv1, ancho, espesor);
      papel.fillRect(xv2, yv2, ancho, espesor);
      setTimeout(animacionv, 20);
    } else {
      animacionm();
    }
  }

  animacionv();
}

function adaptar() {
  var largo1;
  var largo2;
  var ventana;
  ventana = window.innerWidth;

  if (ventana > 768) {
    largo1 = Math.floor(0.35 * ventana);
    largo2 = Math.floor(0.27 * ventana);
  } else {
    largo1 = Math.floor(0.87 * ventana);
    largo2 = Math.floor(0.90 * ventana);
  }

  document.getElementById("visita").width = largo1;
  document.getElementById("situacion1").width = largo2;
}

function adaptar2() {
  var largo2;
  var ventana;
  ventana = window.innerWidth;

  if (ventana > 768) {
    largo2 = Math.floor(0.27 * ventana);
  } else {
    largo2 = Math.floor(0.84 * ventana);
  }

  document.getElementById("situacion2").width = largo2;
}
var imagenes = new Array('imagenes/alterna1.jpeg', 'imagenes/alterna2.jpeg', 'imagenes/alterna3.jpeg', 'imagenes/alterna4.jpg',
  'imagenes/alterna5.jpeg', 'imagenes/alterna6.jpeg', 'imagenes/alterna7.jpeg');
var contador = 0;

function rotarImagenes() {
  contador++;
  document.getElementById("imagenalternada").src = imagenes[contador % imagenes.length];
}

function alternar() {
  rotarImagenes();
  setInterval(rotarImagenes, 6000);
}

/**
 * Inicia un carrusel de imágenes para un elemento <img> específico.
 * @param {string} idElemento - El ID del elemento <img> que funcionará como carrusel.
 * @param {string[]} arrayImagenes - Un array con las rutas de las imágenes a mostrar.
 * @param {number} [intervalo=5000] - El tiempo en milisegundos entre cada imagen. Por defecto es 5 segundos.
 */
function iniciarCarrusel(idElemento, arrayImagenes, intervalo = 5000) {
  const elemento = document.getElementById(idElemento);

  // Verificación para evitar errores si el elemento o las imágenes no existen
  if (!elemento || !arrayImagenes || arrayImagenes.length === 0) {
    console.error(`No se pudo iniciar el carrusel para el ID "${idElemento}".`);
    return;
  }

  let contador = 0;

  // Función interna para cambiar la imagen
  const rotarImagenes = () => {
    contador++;
    elemento.src = arrayImagenes[contador % arrayImagenes.length];
  };

  // Establecer la primera imagen inmediatamente
  elemento.src = arrayImagenes[0];

  // Iniciar el intervalo para rotar las imágenes
  setInterval(rotarImagenes, intervalo);
}