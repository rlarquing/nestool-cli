const chalk = require("chalk");
const {modulos, entidades} = require("../util/util");
const ruta = require("path");
const pathBase = process.cwd();
let pathTmp = '';
const preg={
    name: "moduleName",
    type: "search-list",
    choices: modulos,
    pageSize: modulos.length,
    message: "Escribe el nombre del módulo:",
};
const preguntaBase = async (...pregunta) => {
    let preguntas = [
        {
            name: "entityName",
            type: "search-list",
            choices: entidades,
            message: "Escribe el nombre de la entidad:",
        }];
    if (pregunta) {
        preguntas = preguntas.concat(pregunta);
    }
    return preguntas;
};
module.exports = {preguntaBase,preg};