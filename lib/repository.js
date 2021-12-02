const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateRepository = require("../template/repository.template");
const {escribirFichero, escribirIndex, escapeRegExp} = require("../util/util");
const fs = require("fs");
const superString = require("../util/superString");
const {preguntaBase} = require("./preguntaBase");
const ruta = require("path");

const createRepository = async (repository) => {
    let path = ruta.normalize(`${pathBase}/src/${repository.moduleName}`);
    let folderPath = ruta.normalize(`${path}/repository`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${repository.entityName}.repository.ts`);
    let nombre = new superString(repository.entityName).capitalize();
    let direccion = repository.moduleName + '/repository';
    let stout = await generateRepository(repository.entityName, direccion);
    try {
        fs.writeFileSync(filePath, '');
        var re = escapeRegExp('$name');
        templateRepository = templateRepository.replace(re, nombre);
        re = escapeRegExp('$param');
        templateRepository = templateRepository.replace(re, repository.entityName);
        escribirFichero(filePath, templateRepository);
        filePath = ruta.normalize(`${folderPath}/index.ts`);
        let nombre = new superString(repository.entityName).capitalize();
        let exportar = `export {${nombre}Repository} from './${repository.entityName}.repository';\n`;
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
        console.log(stout);
    }
}

const repository = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un repository"));
    console.log(chalk.bold.green("==================="));

    let repository = await inquirer.prompt(await preguntaBase());
    await createRepository(repository);

};
const generateRepository = async (name, direccion) => {
    const {stdout} = await exec(`nest g --no-spec --flat provider ${name}.repository ${direccion}`);
    return stdout;
};
module.exports = {repository};