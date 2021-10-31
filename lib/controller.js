const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateController = require("../template/controller.template");
const {buscar, escribirFichero, escribirIndex} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
let pathTmp = '';
const newController = [
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
                console.log(chalk.bold.red("\nNo existe esa entidad."));
                return;
            }
            return true;
        },
    }
];

const createController = async (controller) => {
    let path = `${pathBase}\\src\\${controller.moduleName}`;
    let folderPath = `${path}\\controller`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${controller.entityName}.controller.ts`;

    try {
        templateController = templateController.replace("$name", controller.entityName.charAt(0).toUpperCase() + controller.entityName.substring(1)
        );
        templateController = templateController.replace("$nameParam", controller.entityName);
        templateController = templateController.replace("$nameTag", controller.entityName.charAt(0).toUpperCase() + controller.entityName.substring(1)+'s'
        );
        escribirFichero(filePath, templateController);
        filePath = `${folderPath}\\index.ts`;
        let nombre = new superString(controller.entityName).capitalize();
        let exportar = `export {${nombre}Controller} from './${controller.entityName}.controller';`;
        escribirIndex(filePath,exportar);
        generateController(controller.entityName);
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
    }
}

const controller = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un controller"));
    console.log(chalk.bold.green("==================="));

    const controlador = await inquirer.prompt(newController);
    await createController(controlador);

};
const generateController = async (name) => {
    const { stdout } = await exec(`nest g controller ${name}`);
    console.log(stdout);
};
module.exports = {controller};