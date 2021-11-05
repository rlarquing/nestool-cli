const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
const fs = require("fs");
let templateEntity = require("../template/entity.template");
const LineReaderSync = require("line-reader-sync");
const ruta = require('path');
const {
    buscarCarpeta,
    buscarFichero,
    direccionFichero,
    eliminarDuplicado,
    escribirFichero,
    escribirIndex, preguntar
} = require("../util/util");
const superString = require("../util/superString");
let pathTmp = '';
const newEntity = [
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
            if (!buscarCarpeta(pathTmp)) {
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
            let esta = buscarFichero(`${pathTmp}\\entity\\${input}.entity`);
            if (esta) {
                console.log(chalk.bold.red("\nYa existe esa entidad en este módulo."));
                return;
            }
            return true;
        },
    },
];

const pregEntity = [
    {
        type: "list",
        name: "pregEntity",
        message: "¿Que desea hacer?",
        choices: [
            {
                value: "newEntity",
                name: "Crear un nueva entity",
            },
            {
                value: "incorporarAtrib",
                name: "Incorporar atributos a una entidad",
            },
        ],
    },
];
let relation = false;
const questions = [
    {
        type: "input",
        name: "nombreAtributo",
        message: "Nombre del atributo:",
        validate: async (input) => {
            await new Promise((r) => setTimeout(r, 1000));
            if (input === "") {
                // Pass the return value in the done callback
                console.log(chalk.bold.red("\nTiene que escribir un nombre."));
                return;
            }
            return true;
        },
    },
    {
        type: "list",
        name: "tipoDato",
        message: "Tipo de dato:",
        pageSize: 11,
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
            "relation"
        ],
    },
    {
        when: function (response) {
            return response.tipoDato === "string";
        },
        type: "number",
        name: "length",
        message: "Escriba el tamaño del datos:",
    },
    {
        when: function (response) {
            relation = response.tipoDato === "relation";
            return relation;
        },
        type: 'input',
        name: 'entity',
        message: 'Nombre de la entidad:',
        validate: async (input) => {
            await new Promise((r) => setTimeout(r, 1000));
            if (input === "") {
                console.log(chalk.bold.red("\nTiene que escribir el nombre de la entidad."));
                return;
            }
            let nombre = new superString(input).eliminarSufijo('Entity');
            let nombreEntity = `${new superString(nombre).recortarMayusculas('-')}.entity.ts`;
            let esta = buscarFichero(nombreEntity);
            if (!esta) {
                console.log(chalk.bold.red("\nNo existe esa entidad."));
                return;
            }
            return true;
        }
    },
    {
        when: function () {
            return relation === true;
        },
        type: "list",
        name: "tipoRelacion",
        message: "Tipo de relación:",
        pageSize: 4,
        choices: [
            "OnoToOne",
            "OneToMany",
            "ManyToOne",
            "ManyToMany"
        ],
    },
    {
        when: function () {
            return relation === false;
        },
        type: "confirm",
        name: "nulo",
        message: "¿Acepta nulo (Presione enter para NO)?",
        default: false,
    },
    {
        when: function () {
            return relation === false;
        },
        type: "confirm",
        name: "unico",
        message: "¿Es unico (Presione enter para NO)?",
        default: false,
    },
    {
        type: "confirm",
        name: "askAgain",
        message: "¿Desea crear otro atributo (Presione enter para YES)?",
        default: true,
    },
];

const createNewEntity = async (entity) => {
    let path = `${pathBase}\\src\\${entity.moduleName}`;
    let folderPath = `${path}\\entity`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${entity.entityName}.entity.ts`;
    const answers = await preguntar(questions);
    console.log(answers);
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
    let tipo = "";
    let importaciones = [];
    let buffer;
    // try {
    //     answers.map((answer) => {
    //         apiProperty = ` @ApiProperty({description: '${answer.descripcion}', example: '${answer.ejemplo}'})\n`;
    //         tipo = answer.tipoDato === "dto" ? answer.dto : answer.tipoDato === "dto[]" ? answer.dto + '[]' : answer.tipoDato;
    //         if (answer.tipoDato === "dto" || answer.tipoDato === "dto[]") {
    //             let nombre = new superString(answer.dto).eliminarSufijo('Dto');
    //             let nombreDto = `${new superString(nombre).recortarMayusculas('-')}.dto.ts`;
    //             let direccion;
    //             if (buscarFichero(nombreDto)) {
    //                 direccion = direccionFichero(nombreDto);
    //             }
    //             let dirModulo;
    //             if (direccion.indexOf('src') !== -1) {
    //                 dirModulo = direccion.substring(direccion.indexOf('src') + 4);
    //             }
    //             if (dirModulo.indexOf(dto.moduleName) !== -1) {
    //                 dirModulo = ruta.relative(pathBase, nombreDto);
    //                 importaciones.push(`import { ${nombre}Dto } from './${dirModulo}';\n`);
    //             } else {
    //                 dirModulo = ruta.parse(dirModulo).dir.replace('\\', '/');
    //                 importaciones.push(`import { ${nombre}Dto } from '../../${dirModulo}';\n`);
    //             }
    //         }
    //
    //         switch (answer.nuloOpcional) {
    //             case "noNulo":
    //                 validadores.push(" IsNotEmpty");
    //                 isNotEmpty = " @IsNotEmpty()\n";
    //                 atributo = ` ${answer.nombreAtributo}: ${tipo};`;
    //                 atributos += isNotEmpty;
    //                 break;
    //             case "esOpcional":
    //                 atributo =
    //                     atributo = ` ${answer.nombreAtributo}?: ${tipo};`;
    //                 break;
    //             default:
    //                 atributo =
    //                     atributo = ` ${answer.nombreAtributo}: ${tipo} | null;`;
    //                 break;
    //         }
    //         atrConst.push(atributo);
    //         nombreAtributos.push(answer.nombreAtributo);
    //         switch (answer.tipoDato) {
    //             case "string":
    //                 validadores.push("IsString");
    //                 isString = ` @IsString({message: 'El atributo ${answer.nombreAtributo} debe de ser un string'})\n`;
    //                 atributos += isString;
    //                 break;
    //             case "number":
    //                 validadores.push("IsNumber");
    //                 isNumber = ` @IsNumber({},{message: 'El atributo ${answer.nombreAtributo} debe de ser un number'})\n`;
    //                 atributos += isNumber;
    //                 break;
    //             case "date":
    //                 validadores.push("IsDate");
    //                 isDate = ` @IsDate({message: 'El atributo ${answer.nombreAtributo} debe de ser formato válido'})\n
    //                 @Type(() => Date)
    //                 \n`;
    //                 atributos += isDate;
    //                 break;
    //             case "boolean":
    //                 validadores.push("IsBoolean");
    //                 isBoolean = ` @IsBoolean({message: 'El atributo ${answer.nombreAtributo} debe de ser un boolean'})\n`;
    //                 atributos += isBoolean;
    //                 break;
    //             case "any":
    //                 break;
    //             case "dto":
    //                 break;
    //             default:
    //                 validadores.push("IsArray");
    //                 isArray = ` @IsArray({message: 'El atributo ${answer.nombreAtributo} debe de ser un arreglo'})\n`;
    //                 atributos += isArray;
    //                 break;
    //         }
    //         atributos += apiProperty;
    //         atributos += atributo;
    //         atributos += "\n\n";
    //     });
    //
    //     validadores = eliminarDuplicado(validadores);
    //     let nombre = new superString(dto.dtoName).capitalize();
    //     if (!fs.existsSync(filePath)) {
    //         templateDto = templateDto.replace("$validadores", validadores.toString()
    //         );
    //         templateDto = templateDto.replace("$name", nombre);
    //         templateDto = templateDto.replace("$atributos", atributos);
    //         if (importaciones.length > 0) {
    //             templateDto = templateDto.replace("$import", importaciones.join(''));
    //         } else {
    //             templateDto = templateDto.replace("$import", '');
    //         }
    //         escribirFichero(filePath, templateDto);
    //         filePath = `${folderPath}\\index.ts`;
    //         let exportar = `export {${nombre}Dto} from './${dto.dtoName}.dto';\n`;
    //         escribirIndex(filePath, exportar);
    //     } else {
    //         let fichero = [];
    //         let lineaCodigo = [];
    //         let lrs = new LineReaderSync(filePath);
    //         let line;
    //         let length = lrs.toLines().length;
    //         for (let index = 0; index < length; index++) {
    //             line = lrs.readline();
    //             let posicion = line.indexOf(";");
    //             if (posicion !== -1) {
    //                 lineaCodigo.push(line);
    //                 let unir = lineaCodigo.join("");
    //                 let procesado = unir.replace(/\s+/g, " ");
    //                 posicion = unir.indexOf("class-validator");
    //                 if (posicion !== -1) {
    //                     let lineaValidador = procesado
    //                         .substring(procesado.indexOf("{") + 1, procesado.indexOf("}"))
    //                         .trim();
    //                     let quitarEspacio = lineaValidador.replace(/\s+/g, "");
    //                     let array = quitarEspacio.split(",");
    //                     validadores = validadores.concat(array);
    //                     validadores = eliminarDuplicado(validadores);
    //                     procesado = procesado.replace(
    //                         lineaValidador,
    //                         validadores.join(", ")
    //                     );
    //                     fichero.push(procesado);
    //                     lineaCodigo = [];
    //                 } else {
    //                     posicion = line.indexOf("this");
    //                     if (posicion !== -1) {
    //                         fichero.push(line.replace(/\s+/g, " "));
    //                     } else {
    //                         fichero.push(procesado);
    //                     }
    //                     lineaCodigo = [];
    //                 }
    //             } else {
    //                 lineaCodigo.push(line.replace(/\s+/g, " "));
    //             }
    //
    //             posicion = line.indexOf("export class");
    //             if (posicion !== -1) {
    //                 lineaCodigo = [];
    //                 fichero.push(importaciones.join(''));
    //                 fichero.push(line.replace(/\s+/g, " "));
    //             }
    //             posicion = line.indexOf("@");
    //             if (posicion !== -1) {
    //                 lineaCodigo = [];
    //                 if (posicion !== line.indexOf("@nestjs/swagger")) {
    //                     fichero.push(line.replace(/\s+/g, " "));
    //                 }
    //             }
    //
    //             posicion = line.indexOf("constructor");
    //             if (posicion !== -1) {
    //                 fichero.push(atributos);
    //                 let atrFichero = line.substring(
    //                     line.indexOf("(") + 1,
    //                     line.indexOf(")")
    //                 );
    //                 let atr;
    //                 let atrNuevos = [];
    //                 atrConst.forEach((item) => {
    //                     atr = " " + item.substring(0, item.length - 1) + " ";
    //                     atrNuevos.push(atr);
    //                 });
    //                 let array = atrFichero.split(",");
    //                 array = array.concat(atrNuevos);
    //                 let atrFicheroNuevo = atrFichero.replace(
    //                     atrFichero,
    //                     array.join(",")
    //                 );
    //                 fichero.push(
    //                     line.replace(atrFichero, atrFicheroNuevo).replace(/\s+/g, " ")
    //                 );
    //             }
    //
    //             if (line === "}") {
    //                 let encontrado = fichero.filter((item) => {
    //                     if (item.indexOf("constructor") !== -1) {
    //                         return item;
    //                     }
    //                 });
    //                 if (encontrado.length !== 0) {
    //                     nombreAtributos.forEach((item) => {
    //                         fichero.push(` this.${item} = ${item};\n`);
    //                     });
    //                     fichero.push(line.replace(/\s+/g, " "));
    //                 }
    //             }
    //
    //             if (index + 1 === length) {
    //                 let encontrado = fichero.filter((item) => {
    //                     if (item.indexOf("constructor") !== -1) {
    //                         return item;
    //                     }
    //                 });
    //                 if (encontrado.length === 0) {
    //                     fichero.push(atributos);
    //                 }
    //                 fichero.push(line.replace(/\s+/g, " "));
    //             }
    //         }
    //
    //         buffer = Buffer.from(fichero.join("\n"));
    //
    //         fs.open(filePath, "w", function (err, fd) {
    //             if (err) {
    //                 throw "error opening file: " + err;
    //             }
    //
    //             fs.write(fd, buffer, 0, buffer.length, null, function (err) {
    //                 if (err) throw "Error al escribir el fichero: " + err;
    //                 fs.close(fd, function () {
    //                     console.log(chalk.blue.bold("Archivo actualizado"));
    //                 });
    //             });
    //         });
    //     }
    // } catch (err) {
    //     console.error(err);
    // } finally {
    //     let nameDto = dto.dtoName + ".dto.ts";
    //     console.log(`
    //     ------------- ACCION FINALIZADA --------------\n
    //     Se ha creado o actualizado el dto en el módulo\n
    //     - Módulo: ${chalk.blue.bold(dto.moduleName)}\n
    //     - DTO: ${chalk.blue.bold(nameDto)}\n
    //     ----------------------------------------------\n
    //   `);
    // }
}
const entity = async () => {
    console.log("\n");
    console.log(chalk.bold.green("================"));
    console.log(chalk.bold.green("Crear una entity"));
    console.log(chalk.bold.green("================"));
    const opt = await inquirer.prompt(pregEntity);
    switch (opt.pregEntity) {
        case "newEntity":
            const entity = await inquirer.prompt(newEntity);
            await createNewEntity(entity);
            break;
        case "incorporarAtrib":
            // const crudDto = await inquirer.prompt(pregEntity);
            // await createCrudDto(crudDto);
            break;
    }
};
module.exports = {entity};