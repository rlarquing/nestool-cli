const inquirer = require("inquirer");
const chalk = require("chalk");
const pathBase = process.cwd();
const fs = require("fs");
let templateDto = require("../template/dto.template");
let crearDto = require("../template/create.dto.template");
let updateDto = require("../template/update.dto.template");
let updateMultipleDto = require("../template/update-multiple.dto.template");
let readDto = require("../template/read.dto.template");
const LineReaderSync = require("line-reader-sync");
const ruta = require('path');
const {eliminarDuplicado, buscar, escribirFichero, escribirIndex, direccionFichero} = require("../util/util");
const {generarDto, generarReadDto} = require("../util/entityToDtoParser");
const superString = require("../util/superString");
const {preguntaBase} = require("./preguntaBase");
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

const newDto = [
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
            if (input === "") {
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
            if (input === "") {
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
        pageSize: 12,
        choices: [
            "string",
            "number",
            "date",
            "boolean",
            "any",
            "dto",
            "string[]",
            "number[]",
            "date[]",
            "boolean[]",
            "any[]",
            "dto[]"
        ],
    },
    {
        when: function (response) {
            return response.tipoDato === "dto" || response.tipoDato === "dto[]";
        },
        type: 'input',
        name: 'dto',
        message: 'Nombre del DTO:',
        validate: async (input) => {
            await new Promise((r) => setTimeout(r, 1000));
            if (input === "") {
                console.log(chalk.bold.red("\nTiene que escribir el nombre del DTO."));
                return;
            }
            let nombre = new superString(input).eliminarSufijo('Dto');
            let nombreDto = `${new superString(nombre).recortarMayusculas('-')}.dto.ts`;
            let esta = buscar(nombreDto);
            if (!esta) {
                console.log(chalk.bold.red("\nNo existe ese DTO."));
                return;
            }
            return true;
        },
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

const preguntar = async () => {
    let output = [];
    let answers;
    do {
        answers = await inquirer.prompt(questions);
        output.push(answers);
    } while (answers.askAgain);
    return output;
};

const createNewDto = async (dto) => {
    let path = `${pathBase}\\src\\${dto.moduleName}`;
    let folderPath = `${path}\\dto`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${dto.dtoName}.dto.ts`;
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
    let tipo = "";
    let importaciones = [];
    let buffer;
    try {
        answers.map((answer) => {
            apiProperty = ` @ApiProperty({description: '${answer.descripcion}', example: '${answer.ejemplo}'})\n`;
            tipo = answer.tipoDato === "dto" ? answer.dto : answer.tipoDato === "dto[]" ? answer.dto + '[]' : answer.tipoDato;
            if (answer.tipoDato === "dto" || answer.tipoDato === "dto[]") {
                let nombre = new superString(answer.dto).eliminarSufijo('Dto');
                let nombreDto = `${new superString(nombre).recortarMayusculas('-')}.dto.ts`;
                let direccion;
                if (buscar(nombreDto)) {
                    direccion = direccionFichero(nombreDto);
                }
                let dirModulo;
                if (direccion.indexOf('src') !== -1) {
                    dirModulo = direccion.substring(direccion.indexOf('src') + 4);
                }
                if (dirModulo.indexOf(dto.moduleName) !== -1) {
                    dirModulo = ruta.relative(pathBase, nombreDto);
                    importaciones.push(`import { ${nombre}Dto } from './${dirModulo}';`);
                } else {
                    dirModulo = ruta.parse(dirModulo).dir.replace('\\', '/');
                    importaciones.push(`import { ${nombre}Dto } from '../../${dirModulo}';`);
                }
            }

            switch (answer.nuloOpcional) {
                case "noNulo":
                    validadores.push(" IsNotEmpty");
                    isNotEmpty = " @IsNotEmpty()\n";
                    atributo = ` ${answer.nombreAtributo}: ${tipo};`;
                    atributos += isNotEmpty;
                    break;
                case "esOpcional":
                    atributo =
                        atributo = ` ${answer.nombreAtributo}?: ${tipo};`;
                    break;
                default:
                    atributo =
                        atributo = ` ${answer.nombreAtributo}: ${tipo} | null;`;
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
                    isDate = ` @IsDate({message: 'El atributo ${answer.nombreAtributo} debe de ser formato válido'})\n
                    @Type(() => Date)
                    \n`;
                    atributos += isDate;
                    break;
                case "boolean":
                    validadores.push("IsBoolean");
                    isBoolean = ` @IsBoolean({message: 'El atributo ${answer.nombreAtributo} debe de ser un boolean'})\n`;
                    atributos += isBoolean;
                    break;
                case "any":
                    break;
                case "dto":
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
                dto.dtoName.charAt(0).toUpperCase() + dto.dtoName.substring(1)
            );
            templateDto = templateDto.replace("$atributos", atributos);
            if (importaciones.length > 0) {
                templateDto = templateDto.replace("$import", importaciones.join(''));
            } else {
                templateDto = templateDto.replace("$import", '');
            }
            escribirFichero(filePath, templateDto);
            filePath = `${folderPath}\\index.ts`;
            let exportar = `export {${dto.dtoName.charAt(0).toUpperCase()}${dto.dtoName.substring(1)}Dto} from './${dto.dtoName}.dto';\n`;
            escribirIndex(filePath, exportar);
        } else {
            let fichero = [];
            let lineaCodigo = [];
            let lrs = new LineReaderSync(filePath);
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

                if (line === "}") {
                    let encontrado = fichero.filter((item) => {
                        if (item.indexOf("constructor") !== -1) {
                            return item;
                        }
                    });
                    if (encontrado.length !== 0) {
                        nombreAtributos.forEach((item) => {
                            fichero.push(` this.${item} = ${item};\n`);
                        });
                        fichero.push(line.replace(/\s+/g, " "));
                    }
                }

                if (index + 1 === length) {
                    let encontrado = fichero.filter((item) => {
                        if (item.indexOf("constructor") !== -1) {
                            return item;
                        }
                    });
                    if (encontrado.length === 0) {
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
        ------------- ACCION FINALIZADA --------------\n
        Se ha creado o actualizado el dto en el módulo\n
        - Módulo: ${chalk.blue.bold(dto.moduleName)}\n
        - DTO: ${chalk.blue.bold(nameDto)}\n
        ----------------------------------------------\n
      `);
    }
}

const createCrudDto = async (newCrudDto) => {
    let path = `${pathBase}\\src\\${newCrudDto.moduleName}`;
    let folderPath = `${path}\\dto`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let dto;
    try {
        let entityPath = `${path}\\entity\\${newCrudDto.entityName}.entity.ts`;
        let filePath = `${folderPath}\\create-${newCrudDto.entityName}.dto.ts`;
        const lrs = new LineReaderSync(entityPath);
        let lineas = lrs.toLines();
        dto = generarDto(lineas);
        let exportar = [];
        let nombre = new superString(newCrudDto.entityName).capitalize();
        crearDto = crearDto.replace("$validadores", dto.validadores);
        crearDto = crearDto.replace("$name", nombre);
        crearDto = crearDto.replace("$atributos", dto.atributos);
        if (!fs.existsSync(filePath)) {
            escribirFichero(filePath, crearDto);
            exportar.push(`export {Create${nombre}Dto} from './create-${newCrudDto.entityName}.dto';`);
        } else {
            fs.writeFileSync(filePath, '');
            escribirFichero(filePath, crearDto);
        }

        filePath = `${folderPath}\\update-${newCrudDto.entityName}.dto.ts`;
        updateDto = updateDto.replace("$validadores", dto.validadores);
        updateDto = updateDto.replace("$name", nombre);
        updateDto = updateDto.replace("$atributos", dto.atributos);
        if (!fs.existsSync(filePath)) {
            escribirFichero(filePath, updateDto);
            exportar.push(`export {Update${nombre}Dto} from './update-${newCrudDto.entityName}.dto';`);
        } else {
            fs.writeFileSync(filePath, '');
            escribirFichero(filePath, updateDto);
        }

        filePath = `${folderPath}\\update-multiple-${newCrudDto.entityName}.dto.ts`;
        updateMultipleDto = updateMultipleDto.replace("$validadores", dto.validadores);
        updateMultipleDto = updateMultipleDto.replace("$name", nombre);
        updateMultipleDto = updateMultipleDto.replace("$atributos", dto.atributos);
        if (!fs.existsSync(filePath)) {
            escribirFichero(filePath, updateMultipleDto);
            exportar.push(`export {UpdateMultiple${nombre}Dto} from './update-multiple-${newCrudDto.entityName}.dto';`);
        } else {
            fs.writeFileSync(filePath, '');
            escribirFichero(filePath, updateMultipleDto);
        }

        filePath = `${folderPath}\\read-${newCrudDto.entityName}.dto.ts`;
        dto = generarReadDto(lineas);
        if (dto.import !== '') {
            readDto = readDto.replace("$import", dto.import);
        } else {
            readDto = readDto.replace("$import", '');
        }
        readDto = readDto.replace("$name", nombre);
        readDto = readDto.replace("$atributos", dto.atributos);
        readDto = readDto.replace("$parametros", dto.parametros);
        readDto = readDto.replace("$thisAtributos", dto.thisAtributos);
        if (!fs.existsSync(filePath)) {
            escribirFichero(filePath, readDto);
            exportar.push(`export {Read${nombre}Dto} from './read-${newCrudDto.entityName}.dto';`);
        } else {
            fs.writeFileSync(filePath, '');
            escribirFichero(filePath, readDto);
        }
        if (exportar.length > 0) {
            filePath = `${folderPath}\\index.ts`;
            escribirIndex(filePath, exportar.join(''));
        }
    } catch (err) {
        console.error(err);
    } finally {
        let createDto = 'create-' + newCrudDto.entityName + ".dto.ts";
        let updateDto = 'update-' + newCrudDto.entityName + ".dto.ts";
        let updateMultipleDto = 'update-multiple-' + newCrudDto.entityName + ".dto.ts";
        let readDto = 'read-' + newCrudDto.entityName + ".dto.ts";
        console.log(`
        --------------------- ACCION FINALIZADA ---------------------\n
        Se han creado o actualizado los dto para el CRUD en el módulo\n
        - Módulo: ${chalk.blue.bold(newCrudDto.moduleName)}\n
        - DTO: ${chalk.blue.bold(createDto)},\n 
               ${chalk.blue.bold(updateDto)},\n 
               ${chalk.blue.bold(updateMultipleDto)},\n 
               ${chalk.blue.bold(readDto)}\n
        -------------------------------------------------------------\n
      `);
    }
}
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
            const crudDto = await inquirer.prompt(await preguntaBase());
            await createCrudDto(crudDto);
            break;
    }
};
module.exports = {dtos};
