const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateService = require("../template/service.template");
const {buscar, escribirFichero, escribirIndex} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
let pathTmp = '';
const newService = [
    {
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
            if (!fs.existsSync(pathTmp)) {
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
        },
    },
    {
        type: "confirm",
        name: "traza",
        message: "¿Desea activar las trazas en este service (Presione enter para YES)?",
        default: true,
    },
];

const createService = async (service) => {
    let path = `${pathBase}\\src\\${service.moduleName}`;
    let folderPath = `${path}\\service`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${service.entityName}.service.ts`;
    let nombre = new superString(service.entityName).capitalize();
    try {
        templateService = templateService.replace("$name",nombre);
        templateService = templateService.replace(   "$nameParam", service.entityName);
        templateService = templateService.replace("$traza", service.traza);
        escribirFichero(filePath, templateService)
        filePath = `${folderPath}\\index.ts`;
        let exportar = `export {${nombre}Service} from './${service.entityName}.service';`;
        escribirIndex(filePath,exportar);
        generateService(service.entityName);
    } catch (err) {
        console.error(err);
    } finally {
        let nameService = service.entityName + ".service.ts";
        console.log(`
        --------- ACCION FINALIZADA ---------\n
        Se ha creado el servicio en el módulo\n
        - Módulo: ${chalk.blue.bold(service.moduleName)}\n
        - Servicio: ${chalk.blue.bold(nameService)}\n
        -------------------------------------\n
      `);
    }
}

const service = async () => {
    console.log("\n");
    console.log(chalk.bold.green("================"));
    console.log(chalk.bold.green("Crear un service"));
    console.log(chalk.bold.green("================"));

    const service = await inquirer.prompt(newService);
    await createService(service);

};
const generateService = async (name) => {
    const { stdout } = await exec(`nest g service ${name}`);
    console.log(stdout);
};
module.exports = {service};