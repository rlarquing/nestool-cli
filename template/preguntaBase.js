const chalk = require("chalk");
const {buscarFichero, buscarCarpeta} = require("../util/util");
const ruta = require("path");
const pathBase = process.cwd();
let pathTmp = '';
const preg={
    name: "moduleName",
    type: "input",
    message: "Escribe el nombre del módulo:",
    validate: async (input) => {
        await new Promise((r) => setTimeout(r, 1000));
        if (input === "") {
            console.log(
                chalk.bold.red("\nTiene que escribir el nombre del módulo.")
            );
            return;
        }
        pathTmp = ruta.normalize(`${pathBase}/src/${input}`);
        if (!buscarCarpeta(pathTmp)) {
            console.error(
                chalk.bold.red(`\nNo existe el módulo con nombre: ${input}`)
            );
            return;
        }
        return true;
    },
};
const preguntaBase = async (...pregunta) => {
    let preguntas = [{
        name: "moduleName",
        type: "input",
        message: "Escribe el nombre del módulo:",
        validate: async (input) => {
            await new Promise((r) => setTimeout(r, 1000));
            if (input === "") {
                console.log(
                    chalk.bold.red("\nTiene que escribir el nombre del módulo.")
                );
                return;
            }
            pathTmp = ruta.normalize(`${pathBase}/src/${input}`);
            if (!buscarCarpeta(pathTmp)) {
                console.error(
                    chalk.bold.red(`\nNo existe el módulo con nombre: ${input}`)
                );
                return;
            }
            return true;
        },
    },
        {
            name: "entityName",
            type: "input",
            message: "Escribe el nombre de la entidad:",
            validate: async (input) => {
                await new Promise((r) => setTimeout(r, 1000));
                if (input === "") {
                    console.log(chalk.bold.red("\nTiene que escribir el nombre de la entidad."));
                    return;
                }
                let esta = buscarFichero(ruta.normalize(`${pathTmp}/entity/${input}.entity`));
                if (!esta) {
                    console.log(chalk.bold.red("\nNo existe esa entidad en este módulo."));
                    return;
                }
                return true;
            }
        }];
    if (pregunta) {
        preguntas = preguntas.concat(pregunta);
    }
    return preguntas;
};
module.exports = {preguntaBase,preg};