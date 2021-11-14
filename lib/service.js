const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
var templateService = require("../template/service.template");
const {escribirFichero, escribirIndex, escapeRegExp} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
const {preguntaBase} = require("./preguntaBase");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const newService = preguntaBase({
    type: "confirm",
    name: "traza",
    message: "¿Desea activar las trazas en este service (Presione enter para YES)?",
    default: true,
});
const createService = async (service) => {
    let path = `${pathBase}\\src\\${service.moduleName}`;
    let folderPath = `${path}\\service`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${service.entityName}.service.ts`;
    let nombre = new superString(service.entityName).capitalize();
    let direccion = service.moduleName + '/service';
    let stout = await generateService(service.entityName, direccion);
    try {
        fs.writeFileSync(filePath, '');
        var re = escapeRegExp('$name');
        templateService = templateService.replace(re, nombre);
        re = escapeRegExp('$param'), 'g';
        templateService = templateService.replace(re, service.entityName);
        re = escapeRegExp('$traza');
        let traza = false;
        if (service.traza) {
            traza = true;
        }
        templateService = templateService.replace(re, traza);
        escribirFichero(filePath, templateService)
        filePath = `${folderPath}\\index.ts`;
        let exportar = `export {${nombre}Service} from './${service.entityName}.service';\n`;
        escribirIndex(filePath, exportar);
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
        console.log(stout);
    }
}

const service = async () => {
    console.log("\n");
    console.log(chalk.bold.green("================"));
    console.log(chalk.bold.green("Crear un service"));
    console.log(chalk.bold.green("================"));

    const service = await inquirer.prompt(await newService);
    await createService(service);
};
const generateService = async (name, direccion) => {
    const {stdout} = await exec(`nest g --no-spec --flat service ${name} ${direccion}`);
    return stdout;
};
module.exports = {service};