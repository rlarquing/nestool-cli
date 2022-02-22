const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateController = require("../template/controller.template");
const {
    escribirFichero,
    escribirIndex,
    escapeRegExp,
    buscarFichero,
    direccionFichero,
    quitarSeparador, aInicialMayuscula, formatearNombre, aInicialMinuscula
} = require("../util/util");
const fs = require("fs");
const {preguntaBase} = require("../template/preguntaBase");
const util = require("util");
const ruta = require("path");
const {parse} = require("../util/parseEntity");
const exec = util.promisify(require("child_process").exec);

const createController = async (controller) => {
    let path = ruta.normalize(`${pathBase}/src/${controller.moduleName}`);
    let folderPath = ruta.normalize(`${path}/controller`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${controller.entityName}.controller.ts`);
    let nombre = quitarSeparador(controller.entityName, '-');
    let direccion = controller.moduleName + '/controller';
    let stdout = await generateController(controller.entityName, direccion);
    let rolGuard = 'rol.guard.ts';
    let importaciones = [];
    let entityPath=ruta.normalize(`${pathBase}/src/${controller.moduleName}/entity/${controller.entityName}.entity.ts`);
    let entity = parse(entityPath);
    if (buscarFichero(rolGuard)) {
        direccion = direccionFichero(rolGuard);
    }
    let dirModulo;
    if (direccion.indexOf('src') !== -1) {
        dirModulo = direccion.substring(direccion.indexOf('src') + 4);
    }

    if (dirModulo.indexOf(controller.moduleName) !== -1) {
        importaciones.push(`import { RolGuard } from '../guard/rol.guard';`);
    } else {
        importaciones.push(`import { RolGuard } from '../../security/guard/rol.guard';`);
    }

    try {
        fs.writeFileSync(filePath, '');
        var re = escapeRegExp('$name');
        templateController = templateController.replace(re, nombre);
        re = escapeRegExp('$param');
        templateController = templateController.replace(re, aInicialMinuscula(quitarSeparador(controller.entityName,'-')));
        re = escapeRegExp('$paraCont');
        templateController = templateController.replace(re, controller.entityName);
        re = escapeRegExp('$tag');
        templateController = templateController.replace(re, quitarSeparador(nombre) + 's'
        );
        if (importaciones.length > 0) {
            templateController = templateController.replace("$import", importaciones.join(''));
        } else {
            templateController = templateController.replace("$import", '');
        }
        var re = escapeRegExp('$header');
        templateController = templateController.replace(re, entity.header.toString());
        escribirFichero(filePath, templateController);
        filePath = ruta.normalize(`${folderPath}/index.ts`);
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
        console.log(stdout);
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
module.exports = {controller,createController};