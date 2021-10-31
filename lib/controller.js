const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateController = require("../template/controller.template");
const {escribirFichero, escribirIndex, escapeRegExp, buscar, direccionFichero} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
const {preguntaBase} = require("./preguntaBase");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const createController = async (controller) => {
    let path = `${pathBase}\\src\\${controller.moduleName}`;
    let folderPath = `${path}\\controller`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${controller.entityName}.controller.ts`;
    let nombre = new superString(controller.entityName).capitalize();
    let direccion = service.moduleName + '/controller';
    let stout = await generateController(controller.entityName, direccion);
    let rolGuard = 'rol.guard.ts';
    let importaciones = [];
    if (buscar(rolGuard)) {
        direccion = direccionFichero(rolGuard);
    }
    let dirModulo;
    if (direccion.indexOf('src') !== -1) {
        dirModulo = direccion.substring(direccion.indexOf('src') + 4);
    }

    if (dirModulo.indexOf(dto.moduleName) !== -1) {
        importaciones.push(`import { RolGuard } from '../guard/rol.guard';`);
    } else {
        importaciones.push(`import { RolGuard } from '../../security/guard/rol.guard';`);
    }

    try {
        fs.writeFileSync(filePath, '');
        var re = new RegExp(escapeRegExp('$name'), 'g');
        templateController = templateController.replaceAll(re, nombre);
        re = new RegExp(escapeRegExp('$param'), 'g');
        templateController = templateController.replaceAll(re, controller.entityName);
        re = new RegExp(escapeRegExp('$tag'), 'g');
        templateController = templateController.replaceAll(re, nombre + 's'
        );
        if (importaciones.length > 0) {
            templateController = templateController.replace("$import", importaciones.join(''));
        } else {
            templateController = templateController.replace("$import", '');
        }
        escribirFichero(filePath, templateController);
        filePath = `${folderPath}\\index.ts`;
        let nombre = new superString(controller.entityName).capitalize();
        let exportar = `export {${nombre}Controller} from './${controller.entityName}.controller';\n`;
        escribirIndex(filePath, exportar);
    } catch (err) {
        console.error(err);
    } finally {
        let nameRepositorio = controller.entityName + ".controller.ts";
        console.log(`
        ---------- ACCION FINALIZADA -----------\n
        Se ha creado el controller en el módulo\n
        - Módulo: ${chalk.blue.bold(controller.moduleName)}\n
        - Repositorio: ${chalk.blue.bold(nameRepositorio)}\n
        ----------------------------------------\n
      `);
        console.log(stout);
    }
}

const controller = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un controller"));
    console.log(chalk.bold.green("==================="));

    const controlador = await inquirer.prompt(await preguntaBase());
    await createController(controlador);

};
const generateController = async (name, direccion) => {
    const {stdout} = await exec(`nest g --no-spec --flat controller ${name} ${direccion}`);
    return stdout;
};
module.exports = {controller};