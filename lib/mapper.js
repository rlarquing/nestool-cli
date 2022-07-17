const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let {mepperSinRelacion, mepperRelacion} = require("../template/mapper.template");
const {
    escribirFichero, escribirIndex, escapeRegExp, quitarSeparador, aInicialMinuscula, busquedaInterna,
    direccionFichero, eliminarDuplicado, findElemento, removeFromArr, formatearNombre
} = require("../util/util");
const fs = require("fs");
const {preguntaBase} = require("../template/preguntaBase");
const ruta = require("path");
const {parse} = require("../util/parseEntity");
const {parseM} = require("../util/parseModule");
let importacion = [];
let repositorios = [];
const esNomenclador = {
    type: "confirm",
    name: "esNomenclador",
    message: "¿Es un nomenclador?",
    default: false,
};
const createMapper = async (mapper) => {
    let path = ruta.normalize(`${pathBase}/src/core`);
    let folderPath = ruta.normalize(`${path}/mapper`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${mapper.entityName}.mapper.ts`);
    let nombre = quitarSeparador(mapper.entityName, '-');
    try {
        fs.writeFileSync(filePath, '');
        let templateMapper = '';
        if (tieneRelaciones(path, mapper.entityName)) {
            templateMapper = mepperRelacion;
            //primera funcion
            templateMapper = templateMapper.replace('$atributos', atributos(mapper.entityName, 'core').join(''));
            templateMapper = templateMapper.replace('$analisisdtoToEntity', analisisdtoToEntity(path, mapper.entityName).join(''));
            templateMapper = templateMapper.replace('$parametrosdtoToEntity', parametrosdtoToEntity(path, mapper.entityName).toString());
            //segunda funcion
            templateMapper = templateMapper.replace('$analisisdtoToUpdateEntity', analisisdtoToUpdateEntity(path, mapper.entityName).join(''));
            //tercera funcion
            templateMapper = templateMapper.replace('$analisisentityToDto', analisisentityToDto(path, mapper.entityName).join(''));
            templateMapper = templateMapper.replace('$parametrosentityToDto', parametrosentityToDto(path, mapper.entityName).toString());
            if (repositorios.length > 0) {
                templateMapper = templateMapper.replace('$repositorios', repositorios.toString());
            } else {
                templateMapper = templateMapper.replace('$repositorios', '');
            }
            if (importacion.length > 0) {
                templateMapper = templateMapper.replace('$import', importacion.join(''));
            } else {
                templateMapper = templateMapper.replace('$import', '');
            }
        } else {
            templateMapper = mepperSinRelacion;
            //primera funcion
            templateMapper = templateMapper.replace('$parametrosdtoToEntity', parametrosdtoToEntity(path, mapper.entityName).toString());
            //segunda funcion
            templateMapper = templateMapper.replace('$analisisdtoToUpdateEntity', analisisdtoToUpdateEntity(path, mapper.entityName).join(''));
            //tercera funcion
            templateMapper = templateMapper.replace('$parametrosentityToDto', parametrosentityToDto(path, mapper.entityName).toString());
        }

        let re = escapeRegExp('$name');
        templateMapper = templateMapper.replace(re, nombre);
        re = escapeRegExp('$attrName');
        templateMapper = templateMapper.replace(re, aInicialMinuscula(nombre));
        let fichero = templateMapper.split(';');
        let importarArr = fichero.filter((linea) => linea.includes('import'));
        let tmpEntidad = [];
        let tmpDto = [];
        let tmpRepository = [];
        let resto = [];
        importarArr.forEach((imp) => {
            if (imp.includes('../entity')) {
                tmpEntidad.push(imp.substring(imp.indexOf('{') + 1, imp.indexOf('}')));
            } else if (imp.includes('../dto')) {
                tmpDto.push(imp.substring(imp.indexOf('{') + 1, imp.indexOf('}')));
            } else if (imp.includes('../repository')) {
                tmpRepository.push(imp.substring(imp.indexOf('{') + 1, imp.indexOf('}')));
            } else {
                resto.push(imp);
            }
        });
        resto.push(`import {${tmpEntidad.toString().replace(',,',',')}} from "../entity"`);
        resto.push(`import {${tmpDto.toString().replace(',,',',')}} from "../dto"`);
        resto.push(`import {${tmpRepository.toString().replace(',,',',')}} from "../repository"`);
        fichero = fichero.filter((linea) => !linea.includes('import'));
        resto = resto.concat(fichero);
        templateMapper = resto.join(';');

        escribirFichero(filePath, templateMapper);
        filePath = ruta.normalize(`${folderPath}/index.ts`);
        let exportar = `export {${nombre}Mapper} from './${mapper.entityName}.mapper';\n`;
        escribirIndex(filePath, exportar);
        let modulePath = ruta.normalize(`${path}/core.module.ts`);
        let mod = parseM(modulePath);
        let restoClase = mod.restoClase.join('');
        for (let importacion of mod.import) {
            if (importacion.indexOf(`./mapper'`) !== -1) {
                let parametros = importacion.substring(importacion.indexOf('{') + 1, importacion.indexOf('}'));
                mod.import[mod.import.findIndex((item) => item === importacion)] = importacion.replace(parametros, parametros + ', ' + quitarSeparador(mapper.entityName,'-')+'Mapper');
            }
            if (importacion.indexOf(`.mapper';`) !== -1) {
                mod.import=removeFromArr(mod.import,importacion);
            }
        }
        let module = mod.import.join('');
        module = module.concat(restoClase);
        re = escapeRegExp(',,');
        module = module.replace(re, ',');
        escribirFichero(modulePath, module);

    } catch (err) {
        console.error(err);
    } finally {
        let nameMapper = mapper.entityName + ".mapper.ts";
        console.log(`
        ---------- ACCION FINALIZADA -----------\n
        Se ha creado el mapper en el módulo\n
        - Módulo: ${chalk.blue.bold('core')}\n
        - Mapper: ${chalk.blue.bold(nameMapper)}\n
        ----------------------------------------\n
      `);
    }
}

const mapper = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un mapper"));
    console.log(chalk.bold.green("==================="));

    let mapper = await inquirer.prompt(await preguntaBase(esNomenclador));
    await createMapper(mapper);

};

const atributos = (entityName, moduleName) => {
    let rutaEntity = ruta.normalize(`${pathBase}/src/persistence/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let atributos = [];
    let impMapper = [];
    let impEntity = [];
    let impEntityNom = [];
    let impDto = [];
    let impModulo = new Map();
    let modulos = {
        mapper: [],
        repository: [],
        dto: [],
        entity: []
    };
    for (const item of analisis) {
        if (item.includes('@ManyToOne') || item.includes('@ManyToMany')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador && !atributos.includes('protected nomencladorGenericRepository: GenericNomencladorRepository,')) {
                if (moduleName === 'nomenclator') {
                    impDto.push(`ReadNomencladorDto`);
                    importacion.push(`
                import {GenericNomencladorRepository} from "../repository";
                import {GenericNomencladorMapper} from "../../nomenclator/mapper";
                import {NomencladorTypeEnum} from "../enum/nomenclador-type.enum";`);
                } else {
                    importacion.push(`import {ReadNomencladorDto} from "../../nomenclator/dto";
                import {GenericNomencladorRepository} from "../../nomenclator/repository";
                import {GenericNomencladorMapper} from "../../nomenclator/mapper";
                import {NomencladorTypeEnum} from "../../nomenclator/enum/nomenclador-type.enum";`);
                }

                atributos.push('protected nomencladorGenericRepository: GenericNomencladorRepository,');
                atributos.push('protected nomencladorGenericMapper: GenericNomencladorMapper,');
            } else {
                atributos.push(`protected ${aInicialMinuscula(entidad)}Repository: ${entidad}Repository,`);
                atributos.push(`protected ${aInicialMinuscula(entidad)}Mapper: ${entidad}Mapper,`);
                let entity = direccionFichero(`${formatearNombre(entidad, '-')}.entity`);
                let nombreModulo = '';
                if (entity.toString().substring(entity.toString().indexOf('src') + 4, entity.toString().indexOf('entity') - 1) === moduleName) {
                    impEntity.push(`${entidad}Entity`);
                    impDto.push(`Read${entidad}Dto`);
                    repositorios.push(`${entidad}Repository";`);
                    impMapper.push(`${entidad}Mapper`);
                } else {
                    nombreModulo = entity.toString().substring(entity.toString().indexOf('src') + 4, entity.toString().indexOf('entity') - 1);
                    if (impModulo.has(nombreModulo)) {
                        impModulo.set(nombreModulo, impModulo.get(nombreModulo).entity.push(`${entidad}Entity`));
                        impModulo.set(nombreModulo, impModulo.get(nombreModulo).dto.push(`Read${entidad}Dto`));
                        impModulo.set(nombreModulo, impModulo.get(nombreModulo).repository.push(`${entidad}Repository`));
                        impModulo.set(nombreModulo, impModulo.get(nombreModulo).mapper.push(`${entidad}Mapper`));
                    } else {
                        modulos.entity.push(`${entidad}Entity`);
                        modulos.dto.push(`Read${entidad}Dto`);
                        modulos.repository.push(`${entidad}Repository`);
                        modulos.mapper.push(`${entidad}Mapper`);
                        impModulo.set(nombreModulo, modulos);
                    }
                }
            }
            if (esNomenclador && moduleName !== 'nomenclator') {
                impEntityNom.push(`${entidad}Entity`);
            } else {
                impEntity.push(`${entidad}Entity`);
            }
        }
    }
    if (impMapper.length > 0) {
        importacion.push(`import {${impMapper.toString()}} from "../mapper";`);
    }
    if (impEntity.length > 0) {
        importacion.push(`import {${impEntity.toString()}} from "../entity";`);
    }
    if (impEntityNom.length > 0) {
        importacion.push(`import {${impEntityNom.toString()}} from "../../nomenclator/entity";`);
    }
    if (impDto.length > 0) {
        importacion.push(`import {${impDto.toString()}} from "../dto";`);
    }
    if (impModulo.size > 0) {
        for (const key of impModulo.keys()) {
            let entity = eliminarDuplicado(impModulo.get(key).entity);
            let dto = eliminarDuplicado(impModulo.get(key).dto);
            let repository = eliminarDuplicado(impModulo.get(key).repository);
            let mapper = eliminarDuplicado(impModulo.get(key).mapper);
            importaciones.push(` import { ${entity.toString()}} from '../../${key}/entity';`);
            importaciones.push(` import { ${dto.toString()}} from '../../${key}/dto';`);
            importaciones.push(` import { ${repository.toString()}} from '../../${key}/repository';`);
            importaciones.push(` import { ${mapper.toString()}} from '../../${key}/mapper';`);
        }
    }
    importacion = eliminarDuplicado(importacion);
    return eliminarDuplicado(atributos);
}
const analisisdtoToEntity = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let parametros = entity.parametros.split(',').filter((item) => item !== '');
    let analisisdtoToEntity = [];
    let entidad = '';

    for (const item of analisis) {
        if (item.includes('@ManyToOne') || item.includes('@OneToOne')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findById(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            } else {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findById(create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        if (item.includes('@ManyToMany') && item.includes('@JoinTable')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findByIds(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            } else {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findByIds(create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        if (entidad !== '') {
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
        entidad = '';
    }
    return analisisdtoToEntity;
}
const parametrosdtoToEntity = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let parametros = entity.parametros.split(',').filter((item) => item !== '');
    let parametrosdtoToEntity = [];
    for (const parametro of parametros) {
        if (parametro.indexOf('Entity') !== -1) {
            parametrosdtoToEntity.push(parametro.split(':')[0]);
        } else {
            parametrosdtoToEntity.push(`create$nameDto.${parametro.split(':')[0]}`)
        }
    }
    return parametrosdtoToEntity;
}
const analisisdtoToUpdateEntity = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let parametros = entity.parametros.split(',').filter((item) => item !== '');
    let analisisdtoToUpdateEntity = [];
    let entidad = '';
    for (const item of analisis) {
        if (item.includes('@ManyToOne') || item.includes('@OneToOne')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findById(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findById(update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        if (item.includes('@ManyToMany') && item.includes('@JoinTable')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findByIds(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findByIds(update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        entidad = '';
    }

    for (const parametro of parametros) {
        if (parametro.indexOf('Entity') !== -1) {
            analisisdtoToUpdateEntity.push(`update$nameEntity.${parametro.split(':')[0]} = ${parametro.split(':')[0]};`);
        } else {
            analisisdtoToUpdateEntity.push(`update$nameEntity.${parametro.split(':')[0]} = update$nameDto.${parametro.split(':')[0]};`)
        }
    }
    return analisisdtoToUpdateEntity;
}
const analisisentityToDto = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let parametros = entity.parametros.split(',').filter((item) => item !== '');
    let analisisentityToDto = [];
    let entidad = '';
    for (const item of analisis) {
        if (item.includes('@ManyToOne') || item.includes('@OneToOne')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            let readDto = findElemento(parametros, entidad + 'Entity').toString().split(':')[0];
            if (esNomenclador) {
                analisisentityToDto.push(`const ${readDto}: ReadNomencladorDto = await this.nomencladorGenericMapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisentityToDto.push(`const ${readDto}: Read${entidad}Dto = await this.${aInicialMinuscula(entidad)}Mapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        if (item.includes('@ManyToMany') && item.includes('@JoinTable')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            let readDto = findElemento(parametros, entidad + 'Entity').toString().split(':')[0];
            if (esNomenclador) {
                analisisentityToDto.push(`const ${readDto}: ReadNomencladorDto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.nomencladorGenericMapper.entityToDto(item));`);
            } else {
                analisisentityToDto.push(`const ${readDto}: Read${entidad}Dto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.${aInicialMinuscula(entidad)}Mapper.entityToDto(item));`);
            }
        }
        if (entidad !== '') {
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
        entidad = '';
    }
    return analisisentityToDto;
}
const parametrosentityToDto = (path, entityName) => {
    let rutaDto = ruta.normalize(`${path}/dto/read-${entityName}.dto.ts`);
    let dto = parse(rutaDto);
    let parametros = dto.parametros.split(',').filter((item) => item !== '');
    let parametrosentityToDto = [];
    for (const parametro of parametros) {
        if (parametro.indexOf('Dto') !== -1 || parametro.indexOf('dtoToString') !== -1) {
            parametrosentityToDto.push(parametro.split(':')[0]);
        } else {
            parametrosentityToDto.push(`$attrNameEntity.${parametro.split(':')[0]}`)
        }
    }
    return parametrosentityToDto;
}
const tieneRelaciones = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let revisar = analisis.join('');
    return !!(revisar.includes('@ManyToOne') || revisar.includes('@OneToOne') || (revisar.includes('@ManyToMany') && revisar.includes('@JoinTable')));
}
module.exports = {mapper, createMapper};