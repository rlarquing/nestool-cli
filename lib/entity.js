const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
const fs = require("fs");
let {genericEntity, genericNomencladorEntity} = require("../template/entity.template");
let templateManyToOne = require("../template/many-to-one.template");
let templateOneToOne = require("../template/one-to-one.template");
let templateOneToMany = require("../template/one-to-many.template");
let {destino, origen} = require("../template/many-to-many.template");
const ruta = require('path');
const {
    buscarFichero,
    direccionFichero,
    eliminarDuplicado,
    escribirFichero,
    escribirIndex, preguntar, eliminarSufijo, escapeRegExp, formatearNombre, aInicialMinuscula,
    generarColumna, transformar, direccionClassBusquedaInterna
} = require("../util/util");
const {parse} = require("../util/parseEntity");
const {parseM} = require("../util/parseModule");
const {preg} = require("../template/preguntaBase");
const {parseN} = require("../util/parseNomencladorRepository");
let pathTmp = '';
const relacion = {
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
};
const newEntity = [
    preg,
    {
        name: "entityName",
        type: "input",
        message: "Escribe el nombre de la entidad:",
        validate: async (input) => {
            let esta = await existeFichero(input);
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
        filter: (input) => {
            if (input === "Dejar en blanco para utilizar el esquema public") {
                return "public";
            }
            return input;
        }

    }
];
const newNomenclador = [
    {
        name: "entityName",
        type: "input",
        message: "Escribe el nombre de la entidad:",
        validate: async (input) => {
            let esta = await existeFichero(input);
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
        filter: (input) => {
            if (input === "Dejar en blanco para utilizar el esquema public") {
                return "public";
            }
            return input;
        }

    }
];
const incorporarAttr = [
    preg,
    {
        name: "entityName",
        type: "input",
        message: "Escribe el nombre de la entidad:",
        validate: async (input) => {
            let esta = await existeFichero(input);
            if (!esta) {
                console.log(chalk.bold.red("\nNo existe esa entidad en este módulo."));
                return;
            }
            return true;
        },
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
            {
                value: "newNomenclador",
                name: "Crear un nomenclador",
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
        default: "Dejar en blanco si es un texto"
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
    relacion,
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
const questionsIncorporar = [
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
            //validar que no exista ese atributo
            const parseFile = parse(filePath);
            for (const atributo of parseFile.atributos) {
                let nombreAttr = atributo.substring(atributo.lastIndexOf(')') + 1, atributo.lastIndexOf(':'));
                if (nombreAttr === input) {
                    console.log(chalk.bold.red("\nEl atributo ya existe."));
                    return;
                }
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
        default: "Dejar en blanco si es un texto"
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
    relacion,
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
    let filePath = ruta.normalize(`${folderPath}/${aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity'))}.entity.ts`);
    const answers = await preguntar(questions);

    let importaciones = [];
    let atributo = '';
    let atributos = [];
    let pendiente = [];
    let entidad = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'), '_');
    let esquema = entity.esquema;
    let direccion = '';
    let dirModulo = '';
    let nombre = '';
    let typeorm = [];
    let atrConst = [];
    try {
        procesarPreguntas(answers, importaciones, nombre, direccion, dirModulo, atributo, atributos, typeorm, atrConst, entity.entityName, entity.moduleName, pendiente);
        let thisAtributos = [];
        for (const atr of atrConst) {
            thisAtributos.push(transformar(atr, '%campo:%tipo', 'this.%campo=%campo;'))
        }
        importaciones = eliminarDuplicado(importaciones);
        typeorm = eliminarDuplicado(typeorm);
        if (!fs.existsSync(filePath)) {
            let templateEntity = genericEntity;
            templateEntity = templateEntity.replace("$typeorm", typeorm.toString());
            templateEntity = templateEntity.replace("$entidad", entidad);
            templateEntity = templateEntity.replace("$schema", esquema);
            templateEntity = templateEntity.replace("$atributos", atributos.join(''));
            templateEntity = templateEntity.replace("$parametros", atrConst.toString());
            templateEntity = templateEntity.replace("$thisAtributos", thisAtributos.join(''));
            templateEntity = templateEntity.replace("$nameEntity", entity.entityName);
            if (importaciones.length > 0) {
                templateEntity = templateEntity.replace("$import", importaciones.join(''));
            } else {
                templateEntity = templateEntity.replace("$import", '');
            }
            escribirFichero(filePath, templateEntity);
            filePath = ruta.normalize(`${folderPath}/index.ts`);
            let exportar = `export {${entity.entityName}} from './${formatearNombre(eliminarSufijo(entity.entityName, 'Entity'),'-')}.entity';\n`;
            let importacionEntidad = `import {${entity.entityName}} from '../../${entity.moduleName}/entity';\n`;
            escribirIndex(filePath, exportar);
            procesarPendientes(pendiente, importacionEntidad);
        }
        //aqui vamos a importar esa entidad en el modulo
        let modulePath = ruta.normalize(`${path}/${entity.moduleName}.module.ts`);
        let mod = parseM(modulePath);
        let restoClase = mod.restoClase.join('');
        if (restoClase.includes('TypeOrmModule.forFeature([')) {
            let entidades = restoClase.substring(restoClase.indexOf('TypeOrmModule.forFeature([') + 1, restoClase.indexOf(']),'));
            restoClase = restoClase.replace(entidades, entidades + ', $entidad');
        } else {
            if (restoClase.includes('imports: [')) {
                let imports = restoClase.substring(restoClase.indexOf('imports: [') + 10, restoClase.indexOf('controllers:'));
                restoClase = restoClase.replace(imports, 'TypeOrmModule.forFeature([$entidad]),' + imports);
            } else {
                let imports = restoClase.substring(restoClase.indexOf('(') + 1, restoClase.indexOf(')'));
                restoClase = restoClase.replace(imports, '{ imports: [TypeOrmModule.forFeature([$entidad]),],}');
            }
            mod.import.push("import { TypeOrmModule } from '@nestjs/typeorm';");
        }
        let importar = true;
        for (let importacion of mod.import) {
            if (importacion.indexOf(`./entity'`) !== -1) {
                let parametros = importacion.substring(importacion.indexOf('{') + 1, importacion.indexOf('}'));
                mod.import[mod.import.findIndex((item) => item === importacion)] = importacion.replace(parametros, parametros + ', ' + entity.entityName);
                importar = false;
            }
        }
        if (importar) {
            mod.import.push(`import { ${entity.entityName} } from './entity';`)
        }
        restoClase = restoClase.replace("$entidad", entity.entityName);
        let module = mod.import.join('');
        module = module.concat(restoClase);
        let re = escapeRegExp(',,');
        module = module.replace(re, ',');
        escribirFichero(modulePath, module);
    } catch (err) {
        console.error(err);
    } finally {
        let name = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'),'-') + ".entity.ts";
        console.log(`
          -------- ACCION FINALIZADA ---------\n
          Se ha creado la entidad en el módulo\n
          - Módulo: ${chalk.blue.bold(entity.moduleName)}\n
          - Entidad: ${chalk.blue.bold(name)}\n
          ------------------------------------\n
        `);
    }
}
const createNewNomenclador = async (entity) => {
    let path = ruta.normalize(`${pathBase}/src/nomenclator`);

    let folderPath = ruta.normalize(`${path}/entity`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${formatearNombre(eliminarSufijo(entity.entityName, 'Entity'),'-')}.entity.ts`);
    let entidad = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'), '_');
    let esquema = entity.esquema;
    try {

        if (!fs.existsSync(filePath)) {
            let templateEntity = genericNomencladorEntity;
            templateEntity = templateEntity.replace("$entidad", entidad);
            templateEntity = templateEntity.replace("$schema", esquema);
            templateEntity = templateEntity.replace("$nameEntity", entity.entityName);

            escribirFichero(filePath, templateEntity);
            filePath = ruta.normalize(`${folderPath}/index.ts`);
            let exportar = `export {${entity.entityName}} from './${formatearNombre(eliminarSufijo(entity.entityName, 'Entity'), '-')}.entity';\n`;
            escribirIndex(filePath, exportar);

        }
        let modulePath = ruta.normalize(`${path}/nomenclator.module.ts`);
        let mod = parseM(modulePath);
        let restoClase = mod.restoClase.join('');
        if (restoClase.includes('TypeOrmModule.forFeature([')) {
            let entidades = restoClase.substring(restoClase.indexOf('TypeOrmModule.forFeature([') + 26, restoClase.indexOf(']),'));
            if(entidades.trim()===''){
                restoClase = restoClase.replace(entidades, '[$entidad]');
            }else{
                restoClase = restoClase.replace(entidades, entidades + ', $entidad');
            }
        } else {
            if (restoClase.includes('imports: [')) {
                let imports = restoClase.substring(restoClase.indexOf('[') + 1, restoClase.indexOf('],controllers:'));
                restoClase = restoClase.replace(imports, 'TypeOrmModule.forFeature([$entidad]),' + imports);
            } else {
                let imports = restoClase.substring(restoClase.indexOf('(') + 1, restoClase.indexOf(')'));
                restoClase = restoClase.replace(imports, '{ imports: [TypeOrmModule.forFeature([$entidad]),],}');
            }
            mod.import.push("import { TypeOrmModule } from '@nestjs/typeorm';");
        }
        let importar = true;
        for (let importacion of mod.import) {
            if (importacion.indexOf(`./entity'`) !== -1) {
                let parametros = importacion.substring(importacion.indexOf('{') + 1, importacion.indexOf('}'));
                mod.import[mod.import.findIndex((item) => item === importacion)] = importacion.replace(parametros, parametros + ', ' + entity.entityName);
                importar = false;
            }
        }
        if (importar) {
            mod.import.push(`import { ${entity.entityName} } from './entity';`)
        }
        restoClase = restoClase.replace("$entidad", entity.entityName);
        let module = mod.import.join('');
        module = module.concat(restoClase);
        let re = escapeRegExp(',,');
        module = module.replace(re, ',');
        escribirFichero(modulePath, module);

        let repositotyPath = ruta.normalize(`${path}/repository/generic-nomenclador.repository.ts`);
        let repo = parseN(repositotyPath);
        restoClase = repo.restoClase.join('\n');
        let nomencladorRepository = repo.import.join('\n');
        nomencladorRepository = nomencladorRepository.concat('\n'+restoClase);
        let parametro = '@InjectRepository('+`${entity.entityName}`+') protected '+`${aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity'))}` + 'Repository: Repository<'+`${entity.entityName}` + '>,';
        nomencladorRepository = nomencladorRepository.replace("$entidad", entity.entityName);
        nomencladorRepository = nomencladorRepository.replace("$parametros", parametro);
        nomencladorRepository = nomencladorRepository.replace(re, ',');
        escribirFichero(repositotyPath, nomencladorRepository);

        let enumPath = ruta.normalize(`${path}/enum/nomenclador-type.enum.ts`);
        let fichero = fs.readFileSync(enumPath, 'utf8');
        let parametros = fichero.substring(fichero.indexOf('{') + 1, fichero.indexOf('}'));
        if (parametros.trim()===''){
            let parametros = fichero.substring(fichero.indexOf('{'), fichero.indexOf('}')+1);
            fichero = fichero.replace(parametros, `{${eliminarSufijo(entity.entityName, 'Entity').toUpperCase()}` + ' = '+`'${aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity'))}'` + ',}');
        }else{
            fichero = fichero.replace(parametros, parametros + `${eliminarSufijo(entity.entityName, 'Entity').toUpperCase()}` + ' = '+`'${aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity'))}'` + ',');
        }

        escribirFichero(enumPath, fichero);
    } catch (err) {
        console.error(err);
    } finally {
        let name = formatearNombre(eliminarSufijo(entity.entityName, 'Entity'),'-') + ".entity.ts";
        console.log(`
          -------- ACCION FINALIZADA ---------\n
          Se ha creado el nomenclador en el módulo\n
          - Módulo: ${chalk.blue.bold('nomenclator')}\n
          - Entidad: ${chalk.blue.bold(name)}\n
          ------------------------------------\n
        `);
    }
}
let filePath = '';
const incorporarAttrEntity = async (entity) => {
    let path = ruta.normalize(`${pathBase}/src/${entity.moduleName}`);
    let folderPath = ruta.normalize(`${path}/entity`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    filePath = ruta.normalize(`${folderPath}/${aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity'))}.entity.ts`);
    let entidad = '';
    if (fs.existsSync(filePath)) {
        let tmp = parse(filePath);
        entidad = tmp.importNew.join('');
        entidad = entidad.concat(tmp.clase);
        entidad = entidad.concat(tmp.atributosNew.join(''));
        entidad = entidad.concat(tmp.constructor.join(''));
    }
    const answers = await preguntar(questionsIncorporar);

    let importaciones = [];
    let atributo = '';
    let atributos = [];
    let pendiente = [];
    let direccion = '';
    let dirModulo = '';
    let nombre = '';
    let typeorm = [];
    let atrConst = [];
    try {
        procesarPreguntas(answers, importaciones, nombre, direccion, dirModulo, atributo, atributos, typeorm, atrConst, entity.entityName, entity.moduleName, pendiente);
        let thisAtributos = [];
        for (const atr of atrConst) {
            thisAtributos.push(transformar(atr, '%campo:%tipo', 'this.%campo=%campo;'))
        }
        importaciones = eliminarDuplicado(importaciones);
        typeorm = eliminarDuplicado(typeorm);

        entidad = entidad.replace("$typeorm", typeorm.toString());
        entidad = entidad.replace("$atributos", atributos.join(''));
        entidad = entidad.replace("$parametros", atrConst.toString());
        entidad = entidad.replace("$thisAtributos", thisAtributos.join(''));
        if (importaciones.length > 0) {
            entidad = entidad.replace("$import", importaciones.join(''));
        } else {
            entidad = entidad.replace("$import", '');
        }
        escribirFichero(filePath, entidad);

        let importacionEntidad = `import {${entity.entityName}} from './${nombre}.entity';\n`;

        procesarPendientes(pendiente, importacionEntidad);

    } catch (err) {
        console.error(err);
    } finally {
        let name = aInicialMinuscula(eliminarSufijo(entity.entityName, 'Entity')) + ".entity.ts";
        console.log(`
          -------- ACCION FINALIZADA ---------\n
          Se ha actualizado la entidad en el módulo\n
          - Módulo: ${chalk.blue.bold(entity.moduleName)}\n
          - Entidad: ${chalk.blue.bold(name)}\n
          ------------------------------------\n
        `);
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
            const incorporar = await inquirer.prompt(incorporarAttr);
            await incorporarAttrEntity(incorporar);
            break;
        case "newNomenclador":
            const nomenclador = await inquirer.prompt(newNomenclador);
            await createNewNomenclador(nomenclador);
            break;
    }
};
const procesarPendientes = (pendiente, importacionEntidad) => {
    if (pendiente.length > 0) {
        for (const entidad of pendiente) {
            let pos = 0;
            let dir = direccionClassBusquedaInterna(entidad[0]);
            const parseFile = parse(dir);
            for (let imp of parseFile.import) {
                if (imp.indexOf('typeorm') !== -1) {
                    let linea = imp
                        .substring(imp.indexOf("{") + 1, imp.indexOf("}"))
                        .trim();

                    let quitarEspacio = linea.replace(/\s+/g, "");
                    let array = quitarEspacio.split(",");
                    let tmp = entidad[2].replace(/\s+/g, "").split(",");
                    array = array.concat(tmp);
                    array = eliminarDuplicado(array);
                    imp = imp.replace(
                        linea,
                        array.join(", ")
                    );
                    parseFile.import[pos] = imp;
                    linea = [];
                    break;
                }
                pos++;
            }
            let imTmp = parseFile.import.join("");
            if (dir.includes(filePath)) {
                if (!imTmp.includes(importacionEntidad)) {
                    parseFile.import.push(importacionEntidad);
                }
            } else {
                if (!imTmp.includes(importacion)) {
                    parseFile.import.push(importacion);
                }
            }

            if(parseFile.atributos.length !== 0){
                parseFile.atributos.push(entidad[1]);
            }else{
                parseFile.clase=parseFile.clase.substring(0, parseFile.clase.length - 1) + entidad[1] + parseFile.clase.substring(parseFile.clase.length - 1);
            }
            let fichero = parseFile.import;
            fichero.push(parseFile.clase);
            fichero = fichero.concat(parseFile.atributos);
            fichero = fichero.concat(parseFile.restoClase);
            escribirFichero(dir, fichero.join('\n'));
            fichero = [];
        }
    }
}
const existeFichero = async (input) => {
    await new Promise((r) => setTimeout(r, 1000));
    if (input === "") {
        console.log(chalk.bold.red("\nTiene que escribir el nombre de la entidad."));
        return false;
    }
    let nombre = eliminarSufijo(input, 'Entity');
    let nombreEntity = `${formatearNombre(nombre, '-')}.entity.ts`;
    return buscarFichero(ruta.normalize(`${pathTmp}/entity/${nombreEntity}`));
}
const procesarPreguntas = (answers, importaciones, nombre, direccion, dirModulo, atributo, atributos, typeorm, atrConst, entityName, moduleName, pendiente) => {
    let impModulo = new Map();
    let modulos = {
        entity: []
    };
    let nombreModulo = '';
    answers.map((answer) => {
        if (answer.tipoDato === "relation") {
            typeorm.push(answer.tipoRelacion);
            let entidad = formatearNombre(eliminarSufijo(answer.rEntity, 'Entity'), '_');
            let name = formatearNombre(eliminarSufijo(entityName, 'Entity'), '_');
            if (name !== entidad) {
                nombre = formatearNombre(eliminarSufijo(answer.rEntity, 'Entity'), '-');
                if (buscarFichero(nombre)) {
                    direccion = direccionFichero(nombre);
                }

                if (direccion.indexOf('src') !== -1) {
                    dirModulo = direccion.substring(direccion.indexOf('src') + 4);
                    nombreModulo = dirModulo.substring(0, dirModulo.indexOf('entity') - 1);
                }
                if (dirModulo.indexOf(moduleName) !== -1) {
                    dirModulo = ruta.relative(pathBase, moduleName);
                    importaciones.push(`import { ${answer.rEntity} } from './${dirModulo}';\n`);
                } else {
                    if (impModulo.has(nombreModulo)) {
                        let tmp=impModulo.get(nombreModulo);
                        tmp.entity.push(answer.rEntity);
                        impModulo.set(nombreModulo, tmp);
                    } else {
                        modulos.entity.push(answer.rEntity);
                        impModulo.set(nombreModulo, modulos);
                    }
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
                    relacionDestino = relacionDestino.replace('$entity', entityName);
                    relacionDestino = relacionDestino.replace(escapeRegExp('$entidad'), name);
                    relacionDestino = relacionDestino.replace('$nAtributo', answer.nombreAtributo);
                    relacionDestino = relacionDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entityName, 'Entity')) + 's: ' + entityName + '[];');
                    pendiente.push([answer.rEntity, relacionDestino, 'ManyToMany, JoinColumn']);
                    break;
                case "OneToOne":
                    typeorm.push("JoinColumn");
                    relacionOne = relacionOne.replace('$atributo', atributo);
                    relacionOne = relacionOne.replace('$entity', answer.rEntity);
                    relacionOne = relacionOne.replace('$name', entidad);
                    atributos.push(relacionOne);
                    break;
                case "ManyToOne":
                    typeorm.push("JoinColumn");
                    relacionMeny = relacionMeny.replace('$atributo', atributo);
                    relacionMeny = relacionMeny.replace('$entity', answer.rEntity);
                    relacionMeny = relacionMeny.replace(escapeRegExp('$name'), entidad);
                    relacionMeny = relacionMeny.replace('$nAtributos', aInicialMinuscula(eliminarSufijo(entityName, 'Entity')) + 's');
                    atributos.push(relacionMeny);

                    relacionOneDestino = relacionOneDestino.replace('$entity', entityName);
                    relacionOneDestino = relacionOneDestino.replace(escapeRegExp('$name'), name);
                    relacionOneDestino = relacionOneDestino.replace('$nAtributo', answer.nombreAtributo);
                    relacionOneDestino = relacionOneDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entityName, 'Entity')) + 's: ' + entityName + '[];');
                    pendiente.push([answer.rEntity, relacionOneDestino, 'OneToMany']);
                    break;
                case "OneToMany":
                    relacionOneOrigen = relacionOneOrigen.replace('$entity', answer.rEntity);
                    relacionOneOrigen = relacionOneOrigen.replace(escapeRegExp('$name'), entidad);
                    relacionOneOrigen = relacionOneOrigen.replace('$nAtributo', aInicialMinuscula(eliminarSufijo(entityName, 'Entity')));
                    relacionOneOrigen = relacionOneOrigen.replace('$atributo', atributo);
                    atributos.push(relacionOneOrigen);

                    relacionMenyDestino = relacionMenyDestino.replace('$atributo', aInicialMinuscula(eliminarSufijo(entityName, 'Entity')) + ': ' + entityName + ';');
                    relacionMenyDestino = relacionMenyDestino.replace('$entity', entityName);
                    relacionMenyDestino = relacionMenyDestino.replace(escapeRegExp('$name'), name);
                    relacionMenyDestino = relacionMenyDestino.replace('$nAtributos', answer.nombreAtributo);
                    pendiente.push([answer.rEntity, relacionMenyDestino, 'ManyToOne, JoinColumn']);
                    break;
            }
        } else {
            atributo = generarColumna(answer);
            atributos.push(atributo);
            atrConst.push(answer.nombreAtributo + ': ' + answer.tipoDato);
        }
    });
    if (impModulo.size > 0) {
        for (const key of impModulo.keys()) {
            let entity = eliminarDuplicado(impModulo.get(key).entity);
            importaciones.push(` import { ${entity.toString()}} from '../../${key}/entity';`);
        }
    }
    importaciones = eliminarDuplicado(importaciones);
}
module.exports = {entity};