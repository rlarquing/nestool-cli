const inquirer = require('inquirer');
const chalk = require('chalk');
const pathBase = process.cwd();
let templateMapper = require("../template/mapper.template");
const {
    escribirFichero, escribirIndex, escapeRegExp, quitarSeparador, aInicialMinuscula, busquedaInterna,
    direccionFichero, eliminarDuplicado, findElemento, removeFromArr, formatearNombre
} = require("../util/util");
const fs = require("fs");
const {preguntaBase} = require("../template/preguntaBase");
const ruta = require("path");
const {parse} = require("../util/parseEntity");
let importacion = [];
let repositorios = [];
const createMapper = async (mapper) => {
    let path = ruta.normalize(`${pathBase}/src/${mapper.moduleName}`);
    let folderPath = ruta.normalize(`${path}/mapper`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${mapper.entityName}.mapper.ts`);
    let nombre = quitarSeparador(mapper.entityName, '-');
    let direccion = mapper.moduleName + '/mapper';
    let stdout = await generateMapper(mapper.entityName, direccion);
    try {
        // fs.writeFileSync(filePath, '');
        //primera funcion
        templateMapper = templateMapper.replace('$atributos', atributos(path, mapper.entityName, mapper.moduleName).join(''));
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
        let re = escapeRegExp('$name');
        templateMapper = templateMapper.replace(re, nombre);
        re = escapeRegExp('$attrName');
        templateMapper = templateMapper.replace(re, aInicialMinuscula(nombre));
        escribirFichero(filePath, templateMapper);
        filePath = ruta.normalize(`${folderPath}/index.ts`);
        let nombre = capitalize(mapper.entityName);
        let exportar = `export {${nombre}Mapper} from './${mapper.entityName}.mapper';\n`;
        escribirIndex(filePath, exportar);
    } catch (err) {
        console.error(err);
    } finally {
        let nameMapper = mapper.entityName + ".mapper.ts";
        console.log(`
        ---------- ACCION FINALIZADA -----------\n
        Se ha creado el mapper en el módulo\n
        - Módulo: ${chalk.blue.bold(mapper.moduleName)}\n
        - Mapper: ${chalk.blue.bold(nameMapper)}\n
        ----------------------------------------\n
      `);
        console.log(stdout);
    }
}

const mapper = async () => {
    console.log("\n");
    console.log(chalk.bold.green("==================="));
    console.log(chalk.bold.green("Crear un mapper"));
    console.log(chalk.bold.green("==================="));

    let mapper = await inquirer.prompt(await preguntaBase());
    await createMapper(mapper);

};
const generateMapper = async (name, direccion) => {
    const {stdout} = await exec(`nest g --no-spec --flat provider ${name}.mapper ${direccion}`);
    return stdout;
};

const atributos = (path, entityName, moduleName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let atributos = [];
    let impPapper = [];
    let impEntity = [];
    let impEntityNom = [];
    let impDto = [];
    for (const item of analisis) {
        if (item.includes('@ManyToOne') || item.includes('@ManyToMany')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador && !atributos.includes('protected nomencladorGenericRepository: GenericNomencladorRepository,')) {
                importacion.push(`import {ReadNomencladorDto} from "../../nomenclator/dto";
                import {GenericNomencladorRepository} from "../../nomenclator/repository";
                import {GenericNomencladorMapper} from "../../nomenclator/mapper";
                import {NomencladorTypeEnum} from "../../nomenclator/enum/nomenclador-type.enum";`);
                atributos.push('protected nomencladorGenericRepository: GenericNomencladorRepository,');
                atributos.push('protected nomencladorGenericMapper: GenericNomencladorMapper,');
            } else {
                atributos.push(`protected ${aInicialMinuscula(entidad)}Repository: ${entidad}Repository,`);
                atributos.push(`protected ${aInicialMinuscula(entidad)}Mapper: ${entidad}Mapper,`);
                let repo = direccionFichero(`${formatearNombre(entidad, '-')}.repository`);
                let mapper = direccionFichero(`${formatearNombre(entidad, '-')}.mapper`);
                let entity = direccionFichero(`${formatearNombre(entidad, '-')}.entity`);
                if (repo.toString().substring(repo.toString().indexOf('src') + 4, repo.toString().indexOf('repository') - 1) === moduleName) {
                    repositorios.push(`${entidad}Repository";`);
                } else {
                    importacion.push(`import {${entidad}Repository} from "../../${repo.toString().substring(repo.toString().indexOf('src') + 4, repo.toString().indexOf('repository') - 1)}/repository";`);
                }
                if (mapper.toString().substring(mapper.toString().indexOf('src') + 4, mapper.toString().indexOf('mapper') - 1) === moduleName) {
                    impPapper.push(`${entidad}Mapper`);
                } else {
                    importacion.push(`import {${entidad}Mapper} from "../../${mapper.toString().substring(mapper.toString().indexOf('src') + 4, mapper.toString().indexOf('mapper') - 1)}/mapper";`);
                }
                if (entity.toString().substring(entity.toString().indexOf('src') + 4, entity.toString().indexOf('entity') - 1) === moduleName) {
                    impEntity.push(`${entidad}Entity`);
                    impDto.push(`Read${entidad}Dto`);
                } else {
                    importacion.push(`import {${entidad}Entity} from "../../${entity.toString().substring(entity.toString().indexOf('src') + 4, entity.toString().indexOf('entity') - 1)}/entity";`);
                    importacion.push(`import {Read${entidad}Dto} from "../../${entity.toString().substring(entity.toString().indexOf('src') + 4, entity.toString().indexOf('entity') - 1)}/dto";`);
                }
            }
            if (esNomenclador) {
                impEntityNom.push(`${entidad}Entity`);
            }
        }
    }
    if (impPapper.length > 0) {
        importacion.push(`import {${impPapper.toString()}} from "../mapper";`);
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
        if (item.includes('@ManyToOne')) {
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
        if (item.includes('@ManyToOne')) {
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
        if (entidad !== '') {
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
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
        if (item.includes('@ManyToOne')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisentityToDto.push(`const read${aInicialMinuscula(findElemento(parametros, entidad + 'Entity'))}Dto: ReadNomencladorDto = this.nomencladorGenericMapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisentityToDto.push(`const read${aInicialMinuscula(findElemento(parametros, entidad + 'Entity'))}Dto: Read${entidad}Dto = this.${aInicialMinuscula(entidad)}Mapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
        }
        if (item.includes('@ManyToMany') && item.includes('@JoinTable')) {
            let tmp = item.split('=>');
            entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisentityToDto.push(`const read${aInicialMinuscula(findElemento(parametros, entidad + 'Entity'))}Dto: ReadNomencladorDto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.nomencladorGenericMapper.entityToDto(item));`);
            } else {
                analisisentityToDto.push(`const read${aInicialMinuscula(findElemento(parametros, entidad + 'Entity'))}Dto: Read${entidad}Dto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.${aInicialMinuscula(entidad)}Mapper.entityToDto(item));`);
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
module.exports = {mapper};