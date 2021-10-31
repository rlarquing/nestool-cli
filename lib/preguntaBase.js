const chalk = require("chalk");
const {buscar, buscarCarpeta} = require("../util/util");
const pathBase = process.cwd();
let pathTmp = '';
const preguntaBase = async () => {
    return [{
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
            pathTmp = `${pathBase}\\src\\${input}`;
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
                let esta = buscar(`${pathTmp}\\entity\\${input}.entity`);
                if (!esta) {
                    console.log(chalk.bold.red("\nNo existe esa entidad en este módulo."));
                    return;
                }
                return true;
            }
        }]
};
module.exports = {preguntaBase};