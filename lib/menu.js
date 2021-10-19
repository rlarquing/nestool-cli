const inquirer = require("inquirer");
const chalk = require("chalk");

const preguntas = [
  {
    type: "list",
    name: "opcion",
    message: "¿Que desea hacer?",
    pageSize: 10,
    choices: [
      {
        value: "modulo",
        name: "Crear un módulo",
      },
      {
        value: "controlador",
        name: "Crear un controlador",
      },
      {
        value: "dtos",
        name: "Crear DTOS",
      },
      {
        value: "service",
        name: "Crear un service",
      },
      {
        value: "mapper",
        name: "Crear un mapper",
      },
      {
        value: "repository",
        name: "Crear un repository",
      },
      {
        value: "entity",
        name: "Crear un entity",
      },
      {
        value: "exit",
        name: "Salir del CLI",
      },
    ],
  },
];

const menu = async () => {
  console.log(chalk.bold.green("====================="));
  console.log(chalk.bold.green("Seleccione una opción"));
  console.log(chalk.bold.green("====================="));
  const opt = await inquirer.prompt(preguntas);

  return opt;
};
module.exports = { menu };
