// Validacion del formulario en tiempo real  y envio simulado
"use strict";

(function () {
  const formulario = document.getElementById("form-contacto");
  if (!formulario) return;

  // JS toma el control;  sin JS queda la validacion HTML5
  formulario.noValidate = true;

  const campos = {
    nombre: formulario.elements.nombre,
    correo: formulario.elements.correo,
    telefono: formulario.elements.telefono,
    asunto: formulario.elements.asunto,
    mensaje: formulario.elements.mensaje
  };
  const contador = document.getElementById("mensaje-contador");
  const estado = document.getElementById("form-estado");
  const btnEnviar = document.getElementById("btn-enviar");
  const tocados = new Set();

  const RE_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
  const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const RE_TELEFONO = /^\+?[\d ]{7,20}$/;

  //   Reglas: devuelven la clave del error   o ""
  const reglas = {
    nombre(valor) {
      if (!valor) return "error.requerido";
      if (valor.length < 3) return "error.nombreCorto";
      if (!RE_NOMBRE.test(valor)) return "error.nombreInvalido";
      return "";
    },
    correo(valor) {
      if (!valor) return "error.requerido";
      return RE_CORREO.test(valor) ? "" : "error.correo";
    },
    telefono(valor) {
      if (!valor) return "";
      const digitos = valor.replace(/\D/g, "").length;
      return RE_TELEFONO.test(valor) && digitos >= 7 && digitos <= 15 ? "" : "error.telefono";
    },
    asunto(valor) {
      return valor ? "" : "error.asunto";
    },
    mensaje(valor) {
      if (!valor) return "error.requerido";
      return valor.length < 20 ? "error.mensajeCorto" : "";
    }
  };

  function validarCampo(nombre) {
    const campo = campos[nombre];
    const error = reglas[nombre](campo.value.trim());
    const contenedor = campo.closest(".campo");
    const salida = document.getElementById(nombre + "-error");

    contenedor.classList.toggle("campo--error", Boolean(error));
    // el opcional vacio no se  marca como valido
    contenedor.classList.toggle("campo--valido", !error && campo.value.trim() !== "");
    campo.setAttribute("aria-invalid", String(Boolean(error)));
    salida.textContent = error ? traducir(error) : "";
    return !error;
  }

  function actualizarContador() {
    contador.textContent = campos.mensaje.value.length + "/" + campos.mensaje.maxLength;
  }

  function limpiarEstados() {
    tocados.clear();
    Object.keys(campos).forEach((nombre) => {
      const campo = campos[nombre];
      campo.closest(".campo").classList.remove("campo--error", "campo--valido");
      campo.removeAttribute("aria-invalid");
      document.getElementById(nombre + "-error").textContent = "";
    });
    actualizarContador();
  }

  function mostrarEstado(texto, tipo) {
    estado.textContent = texto;
    estado.className = "formulario__estado" + (tipo ? " formulario__estado--" + tipo : "");
  }

  // Eventos   por campo
  Object.keys(campos).forEach((nombre) => {
    const campo = campos[nombre];
    const evento = campo.tagName === "SELECT" ? "change" : "input";

    campo.addEventListener(evento, () => {
      if (nombre === "mensaje") actualizarContador();
      if (tocados.has(nombre)) validarCampo(nombre);
      if (estado.textContent) mostrarEstado("");
    });

    campo.addEventListener("blur", () => {
      if (campo.value.trim() !== "" || tocados.has(nombre)) {
        tocados.add(nombre);
        validarCampo(nombre);
      }
    });
  });

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombres = Object.keys(campos);
    nombres.forEach((n) => tocados.add(n));
    const invalidos = nombres.filter((n) => !validarCampo(n));

    if (invalidos.length) {
      mostrarEstado(traducir("form.revisar"), "error");
      campos[invalidos[0]].focus();
      return;
    }

    //  Envio simulado: no hay servidor en esta unidad
    const nombre = campos.nombre.value.trim().split(" ")[0];
    const textoBoton = btnEnviar.querySelector("span");
    btnEnviar.disabled = true;
    textoBoton.textContent = traducir("form.enviando");

    setTimeout(() => {
      formulario.reset();
      limpiarEstados();
      btnEnviar.disabled = false;
      textoBoton.textContent = traducir("form.enviar");
      mostrarEstado(traducir("form.exito", { nombre }), "exito");
    }, 1200);
  });

  // al cambiar idioma se  retraducen los errores visibles
  document.addEventListener("idioma:cambio", () => {
    tocados.forEach((n) => validarCampo(n));
    if (estado.textContent) mostrarEstado("");
  });

  actualizarContador();
})();
