const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
const fs = require("fs");
let templateEntity = require("../template/entity.template");
let templateManyToOne = require("../template/many-to-one.template");
let templateOneToOne = require("../template/one-to-one.template");
let templateOneToMany = require("../template/one-to-many.template");
let {destino, origen} = require("../template/many-to-many.template");
const LineReaderSync = require("line-reader-sync");
const ruta = require('path');
const {
    buscarCarpeta,
    buscarFichero,
    direccionFichero,
    eliminarDuplicado,
    escribirFichero,
    escribirIndex, preguntar, capitalize, eliminarSufijo, escapeRegExp, formatearNombre, aInicialMinuscula,
    generarColumna, transformar
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
            pathTmp = ruta.normalize(`${pathBase}/src/${input}`);
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
            let nombre = eliminarSufijo(input, 'Entity');
            let nombreEntity = `${formatearNombre(nombre, '-')}.entity.ts`;
            let esta = buscarFichero(`${pathTmp}\\entity\\${nombreEntity}`);
            if (esta) {
                console.log(chalk.bold.red("\nYa existe esa entidad en este módulo."));
                return;
            }
            return true;
        },
    },
    {
        name: "esquema",
        type: "input",
        message: "Escribe el nombre del esquema:",
        default: "Dejar en blanco para utilizar el esquema public",
        filter:  (input)=>{
            if (input === "") {
                return "public";
            }
            return input;
        }

    }
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
        pageSize: 7,
        choices: [
            "string",
            "number",
            "Date",
            "Timestamp",
            "boolean",
            "Geometry",
            "relation"
        ],
    },
    {
        when: function (response) {
            return response.tipoDato === "string";
        },
        type: "number",
        name: "length",
        message: "Escriba la longitud de la cadena:",
        default:"Dejar en blanco si es un texto"
    },
    {
        when: function (response) {
            return response.tipoDato === "number";
        },
        type: "confirm",
        name: "integer",
        message: "¿Es un número entero (Presione enter para Si)?",
        default: true,
    },
    {
        when: function (response) {
            relation = response.tipoDato === "relation";
            return relation;
        },
        type: 'input',
        name: 'rEntity',
        message: 'Nombre de la entidad:',
        validate: async (input) => {
            await new Promise((r) => setTimeout(r, 1000));
            if (input === "") {
                console.log(chalk.bold.red("\nTiene que escribir el nombre de la entidad."));
                return;
            }
            let nombre = eliminarSufijo(input, 'Entity');
            let nombreEntity = `${formatearNombre(nombre, '-')}.entity.ts`;
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
            "OneToOne",
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
    let path = ruta.normalize(`${pathBase}/src/${entity.moduleName}`);
    let folderPath = ruta.normalize(`${path}/entity`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = `${folderPath}\\${entity.entityName}.entity.ts`;
    const answers = await preguntar(questions);

    let atrConst = [];
    let importaciones = [];
    let importacion;
    let atributo = '';
    let atributos = [];
    let pendiente = [];
    let entidad = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'), '_');
    let esquema= entity.esquema;
    let direccion;
    let dirModulo;
    let nombre;
    let typeorm=[];
    try {
        answers.map((answer) => {
            if (answer.tipoDato === "relation") {
                typeorm.push("JoinColumn");
                typeorm.push(answer.tipoRelacion);
                importacion=`import { ${entity.entityName} } from '../../${folderPath}';\n`
                let entidad = formatearNombre(eliminarSufijo(answer.rEntity, 'Entity'), '_');
                let name = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'), '_');
                if (name !== entidad) {
                    nombre = formatearNombre(eliminarSufijo(answer.rEntity, 'Entity'), '-');
                    if (buscarFichero(nombre)) {
                        direccion = direccionFichero(nombre);
                    }

                    if (direccion.indexOf('src') !== -1) {
                        dirModulo = direccion.substring(direccion.indexOf('src') + 4);
                    }
                    if (dirModulo.indexOf(dto.moduleName) !== -1) {
                        dirModulo = ruta.relative(pathBase, nombreDto);
                        importaciones.push(`import { ${answer.rEntity} } from './${dirModulo}';\n`);
                    } else {
                        dirModulo = ruta.parse(dirModulo).dir.replace('\\', '/');
                        importaciones.push(`import { ${answer.rEntity} } from '../../${dirModulo}';\n`);
                    }
                }
                if (answer.tipoRelacion === "ManyToOne" || answer.tipoRelacion === "OneToOne") {
                    atributo = answer.nombreAtributo + ': ' + answer.rEntity + ';';
                    atrConst.push(answer.nombreAtributo + ': ' + answer.rEntity);
                } else if (answer.tipoRelacion === "ManyToMany" || answer.tipoRelacion === "OneToMany") {
                    atributo = answer.nombreAtributo + ': ' + answer.rEntity + '[];';
                    atrConst.push(answer.nombreAtributo + ': ' + answer.rEntity + '[]');
                }

                let relacionOrigen = origen;
                let relacionDestino = destino;
                let relacionOne = templateOneToOne;
                let relacionMeny = templateManyToOne;
                let relacionOneDestino = templateOneToMany;
                let relacionOneOrigen = templateOneToMany;
                let relacionMenyDestino = templateManyToOne;
                switch (answer.tipoRelacion) {
                    case "ManyToMany":
                        relacionOrigen = relacionOrigen.replace('$atributo', atributo);
                        relacionOrigen = relacionOrigen.replace('$entity', answer.rEntity);
                        relacionOrigen = relacionOrigen.replace(escapeRegExp('$name'), name);
                        relacionOrigen = relacionOrigen.replace(escapeRegExp('$entidad'), entidad);
                        relacionOrigen = relacionOrigen.replace('$nAtributos', name + 's');
                        atributos.push(relacionOrigen);

                        //analizar como trabajar para la otra entidad.
                        relacionDestino = relacionDestino.replace('$entity', entity.entityName);
                        relacionDestino = relacionDestino.replace(escapeRegExp('$entidad'), name);
                        relacionDestino = relacionDestino.replace('$nAtributo', answer.nombreAtributo);
                        relacionDestino = relacionDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')) + 's: ' + entity.entityName + '[];');
                        pendiente.push([answer.rEntity, relacionDestino]);
                        break;
                    case "OneToOne":
                        relacionOne = relacionOne.replace('$atributo', atributo);
                        relacionOne = relacionOne.replace('$entity', answer.rEntity);
                        relacionOne = relacionOne.replace('$name', entidad);
                        atributos.push(relacionOne);
                        break;
                    case "ManyToOne":
                        relacionMeny = relacionMeny.replace('$atributo', atributo);
                        relacionMeny = relacionMeny.replace('$entity', answer.rEntity);
                        relacionMeny = relacionMeny.replace(escapeRegExp('$name'), entidad);
                        relacionMeny = relacionMeny.replace('$nAtributos', aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')) + 's');
                        atributos.push(relacionMeny);

                        relacionOneDestino = relacionOneDestino.replace('$entity', entity.entityName);
                        relacionOneDestino = relacionOneDestino.replace(escapeRegExp('$name'), name);
                        relacionOneDestino = relacionOneDestino.replace('$nAtributo', answer.nombreAtributo);
                        relacionOneDestino = relacionOneDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')) + 's: ' + entity.entityName + '[];');
                        pendiente.push([answer.rEntity, relacionOneDestino]);
                        break;
                    case "OneToMany":
                        relacionOneOrigen = relacionOneOrigen.replace('$entity', answer.rEntity);
                        relacionOneOrigen = relacionOneOrigen.replace(escapeRegExp('$name'), entidad);
                        relacionOneOrigen = relacionOneOrigen.replace('$nAtributo', aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')));
                        relacionOneOrigen = relacionOneOrigen.replace('$atributo', atributo);
                        atributos.push(relacionOneOrigen);

                        relacionMenyDestino = relacionMenyDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')) + ': ' + entity.entityName + ';');
                        relacionMenyDestino = relacionMenyDestino.replace('$entity', entity.entityName);
                        relacionMenyDestino = relacionMenyDestino.replace(escapeRegExp('$name'), name);
                        relacionMenyDestino = relacionMenyDestino.replace('$nAtributos', answer.nombreAtributo);
                        pendiente.push([answer.rEntity, relacionMenyDestino]);
                        break;
                }
            } else {
                atributo = generarColumna(answer.entityName, '_');
                atributos.push(atributo);
                atrConst.push(answer.nombreAtributo + ': ' + answer.tipoDato);
            }
        });
        let thisAtributos = [];
        for (const atr of atrConst) {
            thisAtributos.push(transformar(atr, '%campo:%tipo', 'this.%campo=%campo;'))
        }
        importaciones = eliminarDuplicado(importaciones);
        typeorm= eliminarDuplicado(typeorm);
        if (!fs.existsSync(filePath)) {
            templateEntity = templateEntity.replace("$typeorm", typeorm);
            templateEntity = templateEntity.replace("$entidad", entidad);
            templateEntity = templateEntity.replace("$schema", esquema);
            templateEntity = templateEntity.replace("$atributos", atributos);
            templateEntity = templateEntity.replace("$parametros", atrConst.toString());
            templateEntity = templateEntity.replace("$thisAtributos", thisAtributos.join(''));

            if (importaciones.length > 0) {
                templateEntity = templateEntity.replace("$import", importaciones.join(''));
            } else {
                templateEntity = templateEntity.replace("$import", '');
            }
            escribirFichero(filePath, templateEntity);
            filePath =  ruta.normalize(`${folderPath}/index.ts`);
            let exportar = `export {${entity.entityName}} from './${nombre}.entity';\n`;
            escribirIndex(filePath, exportar);
    }
    } catch (err) {
        console.error(err);
    } finally {
        //   let nameDto = dto.dtoName + ".dto.ts";
        //   console.log(`
        //   ------------- ACCION FINALIZADA --------------\n
        //   Se ha creado o actualizado el dto en el módulo\n
        //   - Módulo: ${chalk.blue.bold(dto.moduleName)}\n
        //   - DTO: ${chalk.blue.bold(nameDto)}\n
        //   ----------------------------------------------\n
        // `);
    }
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