const chalk = require("chalk");
const figlet = require("figlet");
const inquirer = require("inquirer");
const fs = require("fs");
const pathBase = process.cwd();
const util = require("util");
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
const queryParams = () => {
  const qs = [
    {
      name: "moduleName",
      type: "input",
      message: "Escribe el nombre del modulo:",
    },
    {
      name: "folders",
      type: "checkbox",
      message: "Selecciona las carpetas a crear: ",
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
  return inquirer.prompt(qs);
};

// Método que se encarga de crear el fichero en base a las preguntas realizadas
const estructura = (data) => {
  const path = `${pathBase}\\src\\${data.moduleName}`;
  const folders = data.folders;
  let folderPath = "";
  let filePath;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, 0o777);
  }
  try {
    folders.map((folder) => {
      folderPath = `${path}\\${folder}`;
      fs.mkdirSync(folderPath, 0o777);
      filePath = `${folderPath}\\index.ts`;
      fs.closeSync(fs.openSync(filePath, "w"));
    });
    generateModule(data.moduleName);
  } catch (err) {
    console.error(err);
  } finally {
    console.log(`
        ------ CREADO CORRECTAMENTE ------\n
        Se ha creado o actualizado el módulo\n
        - Módulo: ${chalk.blue.bold(data.moduleName)}\n
        - Carpetas: ${chalk.blue.bold(data.folders)}\n
        ----------------------------------\n
      `);
  }
};
const generateModule = async (name) => {
  const { stdout } = await exec(`nest g module ${name}`);
  console.log(stdout);
};
module.exports = { msn, queryParams, estructura };
