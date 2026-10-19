//   Logica principal: idioma, tema, menu y render del DOM
"use strict";

const IDIOMAS = ["es", "en"];
const SVG_NS = "http://www.w3.org/2000/svg";

let idiomaActual = leerPreferencia("idioma", "es");
if (!IDIOMAS.includes(idiomaActual)) idiomaActual = "es";

// localStorage puede fallar   en modo privado
function leerPreferencia(clave, porDefecto) {
  try {
    return localStorage.getItem(clave) || porDefecto;
  } catch (e) {
    return porDefecto;
  }
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch (e) {
    // sin almacenamiento,  solo dura la sesion
  }
}

// Devuelve el texto en el idioma activo
function traducir(clave, datos = {}) {
  const texto = (TEXTOS[idiomaActual] && TEXTOS[idiomaActual][clave]) || TEXTOS.es[clave] || clave;
  return texto.replace(/\{(\w+)\}/g, (_, k) => (k in datos ? datos[k] : ""));
}

// Crea un icono   <svg><use></svg> del sprite
function crearIcono(id) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "#" + id);
  svg.appendChild(use);
  return svg;
}

function crearElemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

//  Idioma
function aplicarIdioma() {
  document.documentElement.lang = idiomaActual;
  document.title = traducir("meta.titulo");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = traducir(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = traducir(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", traducir(el.dataset.i18nAria));
  });

  document.getElementById("btn-idioma").setAttribute("aria-label", traducir("idioma.cambiar"));
  actualizarBotonTema();
  actualizarBotonMenu();
  renderizarProyectos();
  renderizarHabilidades();

  // avisa a los otros moDulos
  document.dispatchEvent(new CustomEvent("idioma:cambio", { detail: { idioma: idiomaActual } }));
}

function cambiarIdioma() {
  idiomaActual = idiomaActual === "es" ? "en" : "es";
  guardarPreferencia("idioma", idiomaActual);
  aplicarIdioma();
}

//Tema claro / oscuro
function temaActual() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function actualizarBotonTema() {
  const clave = temaActual() === "dark" ? "tema.claro" : "tema.oscuro";
  document.getElementById("btn-tema").setAttribute("aria-label", traducir(clave));
}

function cambiarTema() {
  const nuevo = temaActual() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nuevo);
  guardarPreferencia("tema", nuevo);
  actualizarBotonTema();
}

//   Menu  hamburguesa
const nav = document.getElementById("nav");
const btnMenu = document.getElementById("btn-menu");

function menuAbierto() {
  return btnMenu.getAttribute("aria-expanded") === "true";
}

function actualizarBotonMenu() {
  btnMenu.setAttribute("aria-label", traducir(menuAbierto() ? "nav.cerrar" : "nav.abrir"));
}

function alternarMenu(abrir = !menuAbierto()) {
  nav.classList.toggle("nav--abierto", abrir);
  btnMenu.setAttribute("aria-expanded", String(abrir));
  actualizarBotonMenu();
}

// Render de proyectos (acordeon)
function crearProyecto(proyecto, indice, abierto) {
  const idBoton = "proyecto-btn-" + proyecto.id;
  const idPanel = "proyecto-panel-" + proyecto.id;

  const articulo = crearElemento("article", "proyecto" + (abierto ? " proyecto--abierto" : ""));
  articulo.dataset.id = proyecto.id;

  // cabecera con  el boton
  const cabecera = crearElemento("h3", "proyecto__cabecera");
  const boton = crearElemento("button", "proyecto__boton");
  boton.type = "button";
  boton.id = idBoton;
  boton.setAttribute("aria-expanded", String(abierto));
  boton.setAttribute("aria-controls", idPanel);

  const mini = crearElemento("img", "proyecto__mini");
  mini.src = proyecto.imagen;
  mini.alt = "";
  mini.loading = "lazy";

  const icono = crearElemento("span", "proyecto__icono");
  icono.appendChild(crearIcono("i-flecha"));

  boton.append(crearElemento("span", "proyecto__titulo", proyecto.titulo), mini, icono);
  cabecera.appendChild(boton);

  // panel desplegable
  const panel = crearElemento("div", "proyecto__panel");
  panel.id = idPanel;
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-labelledby", idBoton);
  panel.inert = !abierto;

  const interior = crearElemento("div", "proyecto__panel-inner");
  const contenido = crearElemento("div", "proyecto__contenido");
  const info = crearElemento("div", "proyecto__info");

  info.append(
    crearElemento("p", "proyecto__subtitulo", proyecto.subtitulo[idiomaActual]),
    crearElemento("p", "proyecto__descripcion", proyecto.descripcion[idiomaActual])
  );

  const tecnologias = crearElemento("ul", "proyecto__tecnologias");
  proyecto.tecnologias.forEach((tec) => tecnologias.appendChild(crearElemento("li", "chip", tec)));

  const metricas = crearElemento("ul", "proyecto__metricas");
  proyecto.metricas.forEach((m) => {
    const li = crearElemento("li");
    li.append(crearElemento("strong", "", m.valor), crearElemento("span", "", m[idiomaActual]));
    metricas.appendChild(li);
  });

  info.append(tecnologias, metricas);

  if (proyecto.enlace) {
    const enlace = crearElemento("a", "enlace-flecha");
    enlace.href = proyecto.enlace;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.append(crearElemento("span", "", traducir("proyectos.ver")), crearIcono("i-flecha"));
    info.appendChild(enlace);
  } else {
    info.appendChild(crearElemento("p", "chip", proyecto.nota[idiomaActual]));
  }

  const figura = crearElemento("figure", "proyecto__imagen");
  const img = crearElemento("img");
  img.src = proyecto.imagen;
  img.alt = proyecto.alt[idiomaActual];
  img.loading = indice === 0 ? "eager" : "lazy";
  img.width = 1200;
  img.height = 750;
  figura.appendChild(img);

  contenido.append(info, figura);
  interior.appendChild(contenido);
  panel.appendChild(interior);
  articulo.append(cabecera, panel);
  return articulo;
}

function renderizarProyectos() {
  const contenedor = document.getElementById("proyectos-lista");
  // conserva el proyecto  abierto al cambiar de idioma
  const abiertoAntes = contenedor.querySelector(".proyecto--abierto");
  const idAbierto = abiertoAntes ? abiertoAntes.dataset.id : contenedor.childElementCount ? null : PROYECTOS[0].id;

  const fragmento = document.createDocumentFragment();
  PROYECTOS.forEach((proyecto, i) => {
    fragmento.appendChild(crearProyecto(proyecto, i, proyecto.id === idAbierto));
  });
  contenedor.replaceChildren(fragmento);
}

//  Render de habilidades
function renderizarHabilidades() {
  const contenedor = document.getElementById("habilidades-grid");
  const fragmento = document.createDocumentFragment();

  HABILIDADES.forEach((hab, i) => {
    const li = crearElemento("li", "habilidad" + (i === 0 ? " habilidad--destacada" : ""));
    const icono = crearElemento("img", "habilidad__icono");
    icono.src = "assets/icons/tech/" + hab.icono + ".svg";
    icono.alt = "";
    icono.width = 40;
    icono.height = 40;
    icono.loading = "lazy";

    const texto = crearElemento("div");
    texto.append(
      crearElemento("span", "habilidad__nombre", hab.nombre),
      crearElemento("span", "habilidad__tipo", hab.tipo[idiomaActual])
    );
    li.append(icono, texto);
    fragmento.appendChild(li);
  });
  contenedor.replaceChildren(fragmento);
}

// Resalta el enlace de la seccion visible (scroll-spy)
function iniciarScrollSpy() {
  const enlaces = document.querySelectorAll(".nav__enlace");
  const secciones = [...enlaces].map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const marcar = (id) => {
    enlaces.forEach((a) => {
      const activo = a.getAttribute("href") === "#" + id;
      a.classList.toggle("activo", activo);
      if (activo) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  if (!("IntersectionObserver" in window)) return;
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) marcar(e.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  secciones.forEach((s) => observador.observe(s));
}

//  Eventos  globales
function iniciar() {
  document.getElementById("btn-idioma").addEventListener("click", cambiarIdioma);
  document.getElementById("btn-tema").addEventListener("click", cambiarTema);
  btnMenu.addEventListener("click", () => alternarMenu());

  // cierra el menu al elegir un enlace
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) alternarMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuAbierto()) {
      alternarMenu(false);
      btnMenu.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (menuAbierto() && !e.target.closest("#nav, #btn-menu")) alternarMenu(false);
  });

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) alternarMenu(false);
  });

  document.getElementById("anio").textContent = new Date().getFullYear();

  aplicarIdioma();
  iniciarScrollSpy();
}

iniciar();
