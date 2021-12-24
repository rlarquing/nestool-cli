#!/usr/bin/env node

// Eliminar el argumento 0 y 1 (node y script.js)
// var args = process.argv.splice(process.execArgv.length + 2);

// Recuperar el primer argumento
// var name = args[0];

var {estructura, queryParams, msn} = require("../lib");
const {menu} = require("../lib/menu");
const {dtos} = require("../lib/dtos");
const {service} = require("../lib/service");
const {repository} = require("../lib/repository");
const {mapper} = require("../lib/mapper");
const {controller} = require("../lib/controller");
const {entity} = require("../lib/entity");
const {formatearArchivos} = require("../util/util");

// Crea la estructura de carpetas.
(async () => {
    msn("NESTOOL-CLI");

    let opt = await menu();
    switch (opt.opcion) {
        case "modulo":
            await estructura(await queryParams());
            break;

        case "controlador":
            await controller();
            break;

        case "dtos":
            await dtos();
            break;

        case "service":
            await service();
            break;
        case "mapper":
            await mapper();
            break;
        case "repository":
            await repository();
            break;
        case "entity":
            await entity();
            break;
        case "crud":
            break;
    }
    await formatearArchivos();
    process.exit(1);
})();
