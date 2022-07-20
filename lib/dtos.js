const inquirer = require("inquirer");
const chalk = require("chalk");
const pathBase = process.cwd();
const fs = require("fs");
let templateDto = require("../template/dto.template");
const LineReaderSync = require("line-reader-sync");
var finder = require("findit")(pathBase + "\\src\\");

const pregDtos = [
  {
    type: "list",
    name: "pregDtos",
    message: "¿Que desea hacer?",
    choices: [
      {
        value: "newDto",
        name: "Crear un nuevo DTO",
      },
      {
        value: "crudDto",
        name: "Crear los DTOS para un CRUD",
      },
    ],
  },
];

const checkboxDtos = [
  {
    name: "moduleName",
    type: "input",
    message: "Escribe el nombre del modulo:",
  },
  {
    type: "checkbox",
    name: "checkboxDtos",
    message: "¿Seleccione los dtos que desea crear?",
    choices: [
      {
        value: "create",
        name: "Clear un módulo",
      },
      {
        value: "read",
        name: "Clear un controlador",
      },
      {
        value: "update",
        name: "Clear DTOS",
      },
      {
        value: "update-multiple",
        name: "Clear un service",
      },
    ],
  },
];

const newDto = [
  {
    name: "moduleName",
    type: "input",
    message: "Escribe el nombre del módulo:",
    validate: async (input) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (input == "") {
        console.log(
          chalk.bold.red("\nTiene que escribir el nombre del módulo.")
        );
        return;
      }
      let path = `${pathBase}\\src\\${input}`;
      if (!fs.existsSync(path)) {
        console.error(
          chalk.bold.red(`\nNo existe el módulo con nombre: ${input}`)
        );
        return;
      }
      return true;
    },
  },
  {
    name: "dtoName",
    type: "input",
    message: "Escribe el nombre del DTO:",
    validate: async (input) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (input == "") {
        console.log(chalk.bold.red("\nTiene que escribir el nombre del DTO."));
        return;
      }
      return true;
    },
  },
];

const questions = [
  {
    type: "input",
    name: "nombreAtributo",
    message: "Nombre del atributo:",
    validate: async (input) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (input == "") {
        // Pass the return value in the done callback
        console.log(chalk.bold.red("Tiene que escribir un nombre."));
        return;
      }
      return true;
    },
  },
  {
    type: "list",
    name: "tipoDato",
    message: "Tipo de dato:",
    pageSize: 10,
    choices: [
      "string",
      "number",
      "date",
      "boolean",
      "any",
      "string[]",
      "number[]",
      "date[]",
      "boolean[]",
      "any[]",
    ],
  },
  {
    type: "list",
    name: "nuloOpcional",
    message: "Acepta nulo o es opcional",
    choices: [
      {
        value: "esNulo",
        name: "Es nulo",
      },
      {
        value: "noNulo",
        name: "No es nulo",
      },
      {
        value: "esOpcional",
        name: "Es opcional",
      },
    ],
  },
  {
    type: "input",
    name: "descripcion",
    message: "Descripción del campo:",
  },
  {
    type: "input",
    name: "ejemplo",
    message: "Escriba el ejemplo de entrada de datos:",
  },
  {
    type: "confirm",
    name: "askAgain",
    message: "¿Desea crear otro atributo (Presione enter para YES)?",
    default: true,
  },
];

let dirFiles = [];
finder.on("file", function (file, stat) {
  dirFiles.push(file);
});

const preguntar = async () => {
  let output = [];
  let answers;
  do {
    answers = await inquirer.prompt(questions);
    output.push(answers);
  } while (answers.askAgain);
  return output;
};
const eliminarDuplicado = (array) => {
  let arreglado = [];
  array.forEach((element) => {
    arreglado.push(element.trim());
  });
  let arrayUnico = arreglado.filter((item, index) => {
    return arreglado.indexOf(item) === index;
  });
  return arrayUnico;
};
const createNewDto = async (dto) => {
  let path = `${pathBase}\\src\\${dto.moduleName}`;
  let folderPath = `${path}\\dto`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, 0777);
  } 
    filePath = `${folderPath}\\${dto.dtoName}.dto.ts`;
    const answers = await preguntar();
    let isNotEmpty = "";
    let isString = "";
    let isNumber = "";
    let isDate = "";
    let isBoolean = "";
    let isArray = "";
    let apiProperty = "";
    let atributo = "";
    let validadores = [];
    let atributos = "";
    let atrConst = [];
    let nombreAtributos = [];
    try {
      answers.map((answer) => {
        apiProperty = ` @ApiProperty({description: '${answer.descripcion}', example: '${answer.ejemplo}'})\n`;
        switch (answer.nuloOpcional) {
          case "noNulo":
            validadores.push(" IsNotEmpty");
            isNotEmpty = " @IsNotEmpty()\n";
            atributo = ` ${answer.nombreAtributo}: ${answer.tipoDato};`;
            atributos += isNotEmpty;
            break;
          case "esOpcional":
            atributo =
              atributo = ` ${answer.nombreAtributo}?: ${answer.tipoDato};`;
            break;
          default:
            atributo =
              atributo = ` ${answer.nombreAtributo}: ${answer.tipoDato} | null;`;
            break;
        }
        atrConst.push(atributo);
        nombreAtributos.push(answer.nombreAtributo);
        switch (answer.tipoDato) {
          case "string":
            validadores.push("IsString");
            isString = ` @IsString({message: 'El atributo ${answer.nombreAtributo} debe de ser un string'})\n`;
            atributos += isString;
            break;
          case "number":
            validadores.push("IsNumber");
            isNumber = ` @IsNumber({},{message: 'El atributo ${answer.nombreAtributo} debe de ser un number'})\n`;
            atributos += isNumber;
            break;
          case "date":
            validadores.push("IsDate");
            isDate = ` @IsDate({message: 'El atributo ${answer.nombreAtributo} debe de ser una fecha'})\n`;
            atributos += isDate;
            break;
          case "boolean":
            validadores.push("IsBoolean");
            isBoolean = ` @IsBoolean({message: 'El atributo ${answer.nombreAtributo} debe de ser un boolean'})\n`;
            atributos += isBoolean;
            break;
          case "any":
            break;
          default:
            validadores.push("IsArray");
            isArray = ` @IsArray({message: 'El atributo ${answer.nombreAtributo} debe de ser un arreglo'})\n`;
            atributos += isArray;
            break;
        }
        atributos += apiProperty;
        atributos += atributo;
        atributos += "\n\n";
      });

      validadores = eliminarDuplicado(validadores);
      if (!fs.existsSync(filePath)) {
        templateDto = templateDto.replace(
          "$validadores",
          validadores.toString()
        );
        templateDto = templateDto.replace(
          "$name",
          dto.dtoName.charAt(0).toUpperCase()+dto.dtoName.substring(1)
        );
        templateDto = templateDto.replace("$atributos", atributos);
        fs.writeFileSync(filePath, templateDto, { mode: 0o777 });
        filePath = `${folderPath}\\index.ts`;
        if (!fs.existsSync(filePath)) {
          fs.closeSync(fs.openSync(filePath, "w"));
        }
        let exportar = `export {${dto.dtoName.charAt(0).toUpperCase()}${dto.dtoName.substring(1)}Dto} from './${dto.dtoName}.dto';\n`;
        fs.appendFileSync(filePath, exportar, (err) => {
          if (err) throw err;
          console.log("No se pudo escribir en el fichero");
        });
      } else {
        let fichero = [];
        let lineaCodigo = [];
        lrs = new LineReaderSync(filePath);
        let line;
        let length = lrs.toLines().length;
        for (let index = 0; index < length; index++) {
          line = lrs.readline();
          let posicion = line.indexOf(";");
          if (posicion !== -1) {
            lineaCodigo.push(line);
            let unir = lineaCodigo.join("");
            let procesado = unir.replace(/\s+/g, " ");
            posicion = unir.indexOf("class-validator");
            if (posicion !== -1) {
              let lineaValidador = procesado
                .substring(procesado.indexOf("{") + 1, procesado.indexOf("}"))
                .trim();
              let quitarEspacio = lineaValidador.replace(/\s+/g, "");
              let array = quitarEspacio.split(",");
              validadores = validadores.concat(array);
              validadores = eliminarDuplicado(validadores);
              procesado = procesado.replace(
                lineaValidador,
                validadores.join(", ")
              );
              fichero.push(procesado);
              lineaCodigo = [];
            } else {
              posicion = line.indexOf("this");
              if (posicion !== -1) {
                fichero.push(line.replace(/\s+/g, " "));
              } else {
                fichero.push(procesado);
              }
              lineaCodigo = [];
            }
          } else {
            lineaCodigo.push(line.replace(/\s+/g, " "));
          }

          posicion = line.indexOf("export class");
          if (posicion !== -1) {
            lineaCodigo = [];
            fichero.push(line.replace(/\s+/g, " "));
          }
          posicion = line.indexOf("@");
          if (posicion !== -1) {
            lineaCodigo = [];
            if (posicion !== line.indexOf("@nestjs/swagger")) {
              fichero.push(line.replace(/\s+/g, " "));
            }
          }

          posicion = line.indexOf("constructor");
          if (posicion !== -1) {
            fichero.push(atributos);
            let atrFichero = line.substring(
              line.indexOf("(") + 1,
              line.indexOf(")")
            );
            let atr;
            let atrNuevos = [];
            atrConst.forEach((item) => {
              atr = " " + item.substring(0, item.length - 1) + " ";
              atrNuevos.push(atr);
            });
            let array = atrFichero.split(",");
            array = array.concat(atrNuevos);
            let atrFicheroNuevo = atrFichero.replace(
              atrFichero,
              array.join(",")
            );
            fichero.push(
              line.replace(atrFichero, atrFicheroNuevo).replace(/\s+/g, " ")
            );
          }

          if (line == "}") {
            let encontrado = fichero.filter((item) => {
              if (item.indexOf("constructor") !== -1) {
                return item;
              }
            });
            if (encontrado.length != 0) {
              nombreAtributos.forEach((item) => {
                fichero.push(` this.${item} = ${item};\n`);
              });
              fichero.push(line.replace(/\s+/g, " "));
            }
          }

          if (index + 1 == length) {
            let encontrado = fichero.filter((item) => {
              if (item.indexOf("constructor") !== -1) {
                return item;
              }
            });
            if (encontrado.length == 0) {
              fichero.push(atributos);
            }
            fichero.push(line.replace(/\s+/g, " "));
          }
        }

        buffer = Buffer.from(fichero.join("\n"));

        fs.open(filePath, "w", function (err, fd) {
          if (err) {
            throw "error opening file: " + err;
          }

          fs.write(fd, buffer, 0, buffer.length, null, function (err) {
            if (err) throw "Error al escribir el fichero: " + err;
            fs.close(fd, function () {
              console.log(chalk.blue.bold("Archivo actualizado"));
            });
          });
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      let nameDto = dto.dtoName + ".dto.ts";
      console.log(`
        -------- ACCION FINALIZADA --------\n
        Se ha creado o actualizado el dto en el módulo\n
        - Módulo: ${chalk.blue.bold(dto.moduleName)}\n
        - DTO: ${chalk.blue.bold(nameDto)}\n
        -----------------------------------\n
      `);
    }
}

const createCrudDto = async () => {
  
};
const dtos = async () => {
  console.log("\n");
  console.log(chalk.bold.green("======================="));
  console.log(chalk.bold.green("Crear uno o varios DTOS"));
  console.log(chalk.bold.green("======================="));
  const opt = await inquirer.prompt(pregDtos);
  switch (opt.pregDtos) {
    case "newDto":
      const dto = await inquirer.prompt(newDto);
      await createNewDto(dto);
      break;
    case "crudDto":
      createCrudDto();
      break;
  }
};
module.exports = { dtos };
