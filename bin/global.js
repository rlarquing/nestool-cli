#!/usr/bin/env node

// Eliminar el argumento 0 y 1 (node y script.js)
// var args = process.argv.splice(process.execArgv.length + 2);

// Recuperar el primer argumento
// var name = args[0];

var myLibrary = require("../lib/index.js");
const { menu } = require("../lib/menu.js");
const { dtos } = require("../lib/dtos.js");

// Crea la estructura de carpetas.
(async () => {
  myLibrary.msn("NESTOOL-CLI");

  let opt = await menu();
  switch (opt.opcion) {
    case "modulo":
      myLibrary.estructura(await myLibrary.queryParams());
      break;

    case "controlador":
      break;

    case "dtos":
      dtos();
      break;

    case "service":
      break;
    case "mapper":
      break;
    case "repository":
      break;
    case "entity":
      break;
  }
})();
