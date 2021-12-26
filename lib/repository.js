const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateRepository = require("../template/repository.template");
const {
    escribirFichero,
    escribirIndex,
    escapeRegExp,
    quitarSeparador,
    aInicialMayuscula,
    aInicialMinuscula
} = require("../util/util");
const fs = require("fs");
const {preguntaBase} = require("../template/preguntaBase");
const ruta = require("path");
const util = require("util");
const {parse} = require("../util/parseEntity");
const exec = util.promisify(require("child_process").exec);

const createRepository = async (repository) => {
    let path = ruta.normalize(`${pathBase}/src/${repository.moduleName}`);
    let folderPath = ruta.normalize(`${path}/repository`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${repository.entityName}.repository.ts`);
    let nombre = quitarSeparador(repository.entityName, '-');
    let direccion = repository.moduleName + '/repository';
    let stdout = await generateRepository(repository.entityName, direccion);
    let relations = [];
    try {
        fs.writeFileSync(filePath, '');
        let re = escapeRegExp('$name');
        templateRepository = templateRepository.replace(re, nombre);
        re = escapeRegExp('$param');
        templateRepository = templateRepository.replace(re, aInicialMinuscula(quitarSeparador(repository.entityName, '-')));
        let rutaEntity = ruta.normalize(`${path}/entity/${repository.entityName}.entity.ts`);
        let entity = parse(rutaEntity);
        let parametros = entity.parametros.split(',').filter((item) => item !== '');
        for (const parametro of parametros) {
            if(parametro.includes('Entity')){
                relations.push(`'${parametro.split(':')[0]}'`);
            }
        }
        if(relations.length >0){
            templateRepository = templateRepository.replace('$relations', relations.toString());
        }else{
            templateRepository = templateRepository.replace(',[$relations]', '');
        }
        escribirFichero(filePath, templateRepository);
        filePath = ruta.normalize(`${folderPath}/index.ts`);
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
        console.log(stdout);
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
module.exports = {repository, createRepository};