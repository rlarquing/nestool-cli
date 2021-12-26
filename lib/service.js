const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
var templateService = require("../template/service.template");
const {escribirFichero, escribirIndex, escapeRegExp, quitarSeparador, aInicialMayuscula, aInicialMinuscula} = require("../util/util");
const fs = require("fs");
const {preguntaBase} = require("../template/preguntaBase");
const util = require("util");
const ruta = require("path");
const exec = util.promisify(require("child_process").exec);

const newService = preguntaBase({
    type: "confirm",
    name: "traza",
    message: "¿Desea activar las trazas en este service (Presione enter para YES)?",
    default: true,
});
const createService = async (service) => {
    let path = ruta.normalize(`${pathBase}/src/${service.moduleName}`);
    let folderPath = ruta.normalize(`${path}/service`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${service.entityName}.service.ts`);
    let nombre = quitarSeparador(service.entityName,'-');
    let direccion = service.moduleName + '/service';
    let stdout = await generateService(service.entityName, direccion);
    try {
        fs.writeFileSync(filePath, '');
        var re = escapeRegExp('$name');
        templateService = templateService.replace(re, nombre);
        re = escapeRegExp('$param');
        templateService = templateService.replace(re, aInicialMinuscula(quitarSeparador(service.entityName,'-')));
        re = escapeRegExp('$traza');
        let traza = false;
        if (service.traza) {
            traza = true;
        }
        templateService = templateService.replace(re, traza);
        escribirFichero(filePath, templateService)
        filePath = ruta.normalize(`${folderPath}/index.ts`);
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
        console.log(stdout);
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
module.exports = {service,createService};