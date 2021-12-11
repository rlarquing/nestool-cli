const chalk = require("chalk");
const figlet = require("figlet");
const inquirer = require("inquirer");
const fs = require("fs");
const pathBase = process.cwd();
const util = require("util");
const ruta = require("path");
const {parseM} = require("../util/parseModule");
const {escribirFichero} = require("../util/util");
const exec = util.promisify(require("child_process").exec);

// Mostrar un banner con un mensaje formado por caracteres.
const msn = (msn) => {
  console.log(
    chalk.bold.cyan(
      figlet.textSync(msn, {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );
};

// Preguntas que se van a realizar y que más tarde usaremos
const queryParams = async () => {
  const qs = [
    {
      name: "moduleName",
      type: "input",
      message: "Escribe el nombre del modulo:",
      validate: async (input) => {
        await new Promise((r) => setTimeout(r, 1000));
        if (input === "") {
          console.log(
              chalk.bold.red("\nTiene que escribir el nombre del módulo.")
          );
          return;
        }
        let path = ruta.normalize(`${pathBase}/src/${input}`);
        if (fs.existsSync(path)) {
          console.error(
              chalk.bold.red(`\nYa existe el módulo con nombre: ${input}`)
          );
          return;
        }
        return true;
      },
    },
    {
      name: "folders",
      type: "checkbox",
      message: "Selecciona las carpetas a crear: ",
      pageSize: 12,
      choices: [
        "controller",
        "dto",
        "entity",
        "mapper",
        "repository",
        "service",
        "enum",
        "interface",
        "guard",
        "decorator",
        "pipe",
        "filter",
      ],
    },
  ];
  return await inquirer.prompt(qs);
};

// Método que se encarga de crear el fichero en base a las preguntas realizadas
const estructura = async (data) => {
  const path = ruta.normalize(`${pathBase}/src/${data.moduleName}`);
  const folders = data.folders;
  let folderPath = "";
  let filePath;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, 0o777);
  }
  let stdout='';
  try {
    folders.map((folder) => {
      folderPath = ruta.normalize(`${path}/${folder}`);
      fs.mkdirSync(folderPath, 0o777);
      filePath = ruta.normalize(`${folderPath}/index.ts`);
      fs.closeSync(fs.openSync(filePath, "w"));
    });
    stdout = await generateModule(data.moduleName);
    let modulePath = ruta.normalize(`${path}/${data.moduleName}.module.ts`);
    let mod = parseM(modulePath);
    let restoClase = mod.restoClase.join('');
    let meta = restoClase.substring(restoClase.indexOf('(') + 1, restoClase.indexOf(')'));
    restoClase = restoClase.replace(meta, `{ imports: [],
    controllers: [],
    providers: [],
    exports: [], }`);
    let module = mod.import.join('');
    module = module.concat(restoClase);
    escribirFichero(modulePath, module);
  } catch (err) {
    console.error(err);
  } finally {
    console.log(`
        --------- ACCION FINALIZADA --------\n
        Se ha creado o actualizado el módulo\n
        - Módulo: ${chalk.blue.bold(data.moduleName)}\n
        - Carpetas: ${chalk.blue.bold(data.folders)}\n
        ------------------------------------\n
      `);
    console.log(stdout);
  }
};
const generateModule = async (name) => {
  const { stdout } = await exec(`nest g module ${name}`);
  return stdout;
};
module.exports = { msn, queryParams, estructura };
