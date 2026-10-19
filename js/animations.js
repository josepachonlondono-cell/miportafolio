//  Efectos visuales: aparicion, contadores,  texto y acordeon
"use strict";

(function () {
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conObservador = "IntersectionObserver" in window;

  // Muestra un elemento una sola vez al entrar en pantalla
  function alVerse(elementos, accion, opciones = { threshold: 0.15 }) {
    if (!conObservador || reducirMovimiento) {
      elementos.forEach(accion);
      return;
    }
    const observador = new IntersectionObserver((entradas, obs) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          accion(e.target);
          obs.unobserve(e.target);
        }
      });
    }, opciones);
    elementos.forEach((el) => observador.observe(el));
  }

  //   Aparicion suave de secciones
  alVerse(document.querySelectorAll("[data-revelar]"), (el) => el.classList.add("visible"));

  // Contadores animados del hero
  function animarContador(el) {
    const final = Number(el.dataset.contador);
    if (reducirMovimiento) {
      el.textContent = final;
      return;
    }
    const duracion = 1400;
    const inicio = performance.now();

    function paso(ahora) {
      const avance = Math.min((ahora - inicio) / duracion, 1);
      const suavizado = 1 - Math.pow(1 - avance, 3);
      el.textContent = Math.round(final * suavizado);
      if (avance < 1) requestAnimationFrame(paso);
    }
    el.textContent = "0";
    requestAnimationFrame(paso);
  }

  alVerse(document.querySelectorAll("[data-contador]"), animarContador, { threshold: 0.6 });

  //Texto que se revela palabra   por palabra con el scroll
  const texto = document.getElementById("sobre-texto");
  let palabras = [];
  let pendiente = false;

  function dividirTexto() {
    const fragmento = document.createDocumentFragment();
    texto.textContent.split(/\s+/).forEach((p, i, lista) => {
      const span = document.createElement("span");
      span.className = "palabra";
      span.textContent = p;
      fragmento.appendChild(span);
      if (i < lista.length - 1) fragmento.appendChild(document.createTextNode(" "));
    });
    texto.replaceChildren(fragmento);
    palabras = [...texto.querySelectorAll(".palabra")];
    pintarTexto();
  }

  function pintarTexto() {
    pendiente = false;
    if (reducirMovimiento) {
      palabras.forEach((p) => p.classList.add("activa"));
      return;
    }
    const caja = texto.getBoundingClientRect();
    const alto = window.innerHeight;
    // 0 cuando entra por abajo, 1 al llegar a la mitad de la  pantalla
    const avance = Math.min(Math.max((alto - caja.top) / (alto * 0.5 + caja.height), 0), 1);
    const limite = Math.round(avance * palabras.length);
    palabras.forEach((p, i) => p.classList.toggle("activa", i < limite));
  }

  if (texto) {
    dividirTexto();
    window.addEventListener(
      "scroll",
      () => {
        if (!pendiente) {
          pendiente = true;
          requestAnimationFrame(pintarTexto);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", pintarTexto);
    // main.js reemplaza el texto al cambiar idioma
    document.addEventListener("idioma:cambio", dividirTexto);
  }

  //   Acordeon de proyectos (delegacion de eventos)
  const lista = document.getElementById("proyectos-lista");

  function abrirProyecto(articulo, abrir) {
    articulo.classList.toggle("proyecto--abierto", abrir);
    articulo.querySelector(".proyecto__boton").setAttribute("aria-expanded", String(abrir));
    articulo.querySelector(".proyecto__panel").inert = !abrir;
  }

  if (lista) {
    lista.addEventListener("click", (e) => {
      const boton = e.target.closest(".proyecto__boton");
      if (!boton) return;
      const articulo = boton.closest(".proyecto");
      const abrir = !articulo.classList.contains("proyecto--abierto");

      // solo un proyecto abierto a la vez
      lista.querySelectorAll(".proyecto--abierto").forEach((otro) => {
        if (otro !== articulo) abrirProyecto(otro, false);
      });
      abrirProyecto(articulo, abrir);
    });
  }
})();
