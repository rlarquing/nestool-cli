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
let importacion=[];
let repositorios=[];
const createMapper = async (mapper) => {
    let path = ruta.normalize(`${pathBase}/src/${mapper.moduleName}`);
    let folderPath = ruta.normalize(`${path}/mapper`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, 0o777);
    }
    let filePath = ruta.normalize(`${folderPath}/${mapper.entityName}.mapper.ts`);
    let nombre = quitarSeparador(mapper.entityName, '-');
    let direccion = mapper.moduleName + '/mapper';
    // let stdout = await generateMapper(mapper.entityName, direccion);
    try {
        // fs.writeFileSync(filePath, '');
        let re = escapeRegExp('$name');
        templateMapper = templateMapper.replace(re, nombre);
        re = escapeRegExp('$attrName');
        templateMapper = templateMapper.replace(re, aInicialMinuscula(nombre));
        //primera funcion
        atributos(path, mapper.entityName,moduleName);
        analisisdtoToEntity(path, mapper.entityName);
        parametrosdtoToEntity(path, mapper.entityName);
        //segunda funcion
        analisisdtoToUpdateEntity(path, mapper.entityName);
        //tercera funcion
        analisisentityToDto(path, mapper.entityName);
        parametrosentityToDto
        // escribirFichero(filePath, templateMapper);
        // filePath = ruta.normalize(`${folderPath}/index.ts`);
        // let nombre = capitalize(mapper.entityName);
        // let exportar = `export {${nombre}Mapper} from './${mapper.entityName}.mapper';\n`;
        // escribirIndex(filePath, exportar);
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

const atributos = (path, entityName,moduleName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let atributos = [];
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
                let repo=direccionFichero(`${formatearNombre(entidad,'-')}.repository`);
                let mapper=direccionFichero(`${formatearNombre(entidad,'-')}.mapper`);
                if(repo.toString().substring(repo.toString().indexOf('src')+4,repo.toString().indexOf('repository')-1)===moduleName){
                    repositorios.push(`${entidad}Repository";`);
                }
                importacion.push(`import {${entidad}Repository} from "../../${repo.toString().substring(repo.toString().indexOf('src')+4,repo.toString().indexOf('repository')-1)}/repository";`);
                importacion.push(`import {${entidad}Mapper} from "../../${mapper.toString().substring(mapper.toString().indexOf('src')+4,mapper.toString().indexOf('mapper')-1)}/mapper";`);

            }
        }
    }
    importacion=eliminarDuplicado(importacion);
    console.log(importacion);
    return eliminarDuplicado(atributos);
}
const analisisdtoToEntity = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let parametros = entity.parametros.split(',');
    let analisisdtoToEntity = [];
    for (const item of analisis) {
        if (item.includes('@ManyToOne')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findById(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findById(create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
        if (item.includes('@ManyToMany')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findByIds(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToEntity.pop(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findByIds(create$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
    }
    return analisisdtoToEntity;
}
const parametrosdtoToEntity = (path, entityName) => {
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let parametros = entity.parametros.split(',');
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
    let parametros = entity.parametros.split(',');
    let analisisdtoToUpdateEntity = [];
    for (const item of analisis) {
        if (item.includes('@ManyToOne')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findById(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findById(update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
        if (item.includes('@ManyToMany')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisdtoToUpdateEntity.push(`const ${findElemento(parametros, entidad + 'Entity')} = await this.nomencladorGenericRepository.findByIds(NomencladorTypeEnum.${entidad.toLocaleUpperCase()}, update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisdtoToUpdateEntity.pop(`const ${findElemento(parametros, entidad + 'Entity')} = await this.${aInicialMinuscula(entidad)}Repository.findByIds(update$nameDto.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
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
const analisisentityToDto=(path, entityName)=>{
    let rutaEntity = ruta.normalize(`${path}/entity/${entityName}.entity.ts`);
    let entity = parse(rutaEntity);
    let analisis = [];
    analisis.push(entity.clase);
    analisis = analisis.concat(entity.atributos);
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));
    let parametros = entity.parametros.split(',');
    let analisisentityToDto = [];
    for (const item of analisis) {
        if (item.includes('@ManyToOne')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisentityToDto.push(`const read${findElemento(parametros, entidad + 'Entity')}Dto: ReadNomencladorDto = this.nomencladorGenericMapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`)
            } else {
                analisisentityToDto.push(`const read${findElemento(parametros, entidad + 'Entity')}Dto: Read${entidad}Dto = this.${aInicialMinuscula(entidad)}Mapper.entityToDto($attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]});`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
        if (item.includes('@ManyToMany')) {
            let tmp = item.split('=>');
            let entidad = tmp[1].substring(0, tmp[1].indexOf('Entity')).trim();
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(entidad));
            if (esNomenclador) {
                analisisentityToDto.push(`const read${findElemento(parametros, entidad + 'Entity')}Dto: ReadNomencladorDto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.nomencladorGenericMapper.entityToDto(item));`);
            } else {
                analisisentityToDto.pop(`const read${findElemento(parametros, entidad + 'Entity')}Dto: Read${entidad}Dto[] = $attrName.${findElemento(parametros, entidad + 'Entity').toString().split(':')[0]}.map((item: ${entidad}Entity) => this.${aInicialMinuscula(entidad)}Mapper.entityToDto(item));`);
            }
            parametros = removeFromArr(parametros, findElemento(parametros, entidad + 'Entity'));
        }
    }
    return analisisentityToDto;
}
const parametrosentityToDto=(path, entityName)=>{
    let rutaEntity = ruta.normalize(`${path}/dto/${entityName}.dto.ts`);
    let entity = parse(rutaEntity);
    let parametros = entity.parametros.split(',');
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