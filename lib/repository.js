const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateRepository = require("../template/repository.template");
const {buscar, escribirFichero, escribirIndex} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
let pathTmp = '';
const newRepository = [
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

const createRepository = async (repository) => {
    let path = `${pathBase}\\src\\${repository.moduleName}`;
    let folderPath = `${path}\\repository`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${repository.entityName}.repository.ts`;

    try {
        templateRepository = templateRepository.replace("$name", repository.entityName.charAt(0).toUpperCase() + repository.entityName.substring(1)
        );
        templateRepository = templateRepository.replace("$nameParam", repository.entityName);
        escribirFichero(filePath, templateRepository);
        filePath = `${folderPath}\\index.ts`;
        let nombre = new superString(repository.entityName).capitalize();
        let exportar = `export {${nombre}Repository} from './${repository.entityName}.repository';`;
        escribirIndex(filePath, exportar);
    } catch (err) {
        console.error(err);
    } finally {
        let nameRepositorio = repository.entityName + ".repository.ts";
        console.log(`
        ---------- ACCION FINALIZADA -----------\n
        Se ha creado el repository en el módulo\n
        - Módulo: ${chalk.blue.bold(repository.moduleName)}\n
        - Repositorio: ${chalk.blue.bold(nameRepositorio)}\n
        ----------------------------------------\n
      `);
    }
}

const repository = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un repository"));
    console.log(chalk.bold.green("==================="));

    let repository = await inquirer.prompt(newRepository);
    await createRepository(repository);

};
module.exports = {repository};