const {
    eliminarSufijo,
    eliminarDuplicado,
    buscarFichero,
    thisAtributos, formatearNombre, direccionFichero, quitarSeparador, descompilarScript
} = require("./util");
const ruta = require("path");
const {busquedaInterna, aInicialMinuscula} = require("../util/util");
const fs = require("fs");
const LineReaderSync = require("line-reader-sync");
// Esta función me crea los atributos para 3 dto...
let dto = [];
let importaciones = [];

function crearDto(entity) {
    dto = [];
    importaciones = [];
    let validadores = ['IsNotEmpty'];

    for (let i = 0; i < entity.attributes.length; i++) {
        if (resultados[i].atributo) {
            // hay referencia a datos de nulabilidad
            if (resultados[i].nulabilidad) {
                if (!resultados[i].admitenulos) {
                    dto.push('@IsNotEmpty()');
                }
            }
            if (resultados[i].tipoAtributo.includes('[]')) {
                dto.push(`@IsArray({message: 'El atributo ${resultados[i].atributo} debe de ser un arreglo'})`);
                validadores.push("IsArray");
            }
            if (resultados[i].tipoAtributo === "number") {
                dto.push(`@IsNumber({},{message: 'El atributo ${resultados[i].atributo} debe ser un número'})`);
                validadores.push("IsNumber");
            }
            if (resultados[i].tipoAtributo === "string") {
                dto.push(`@IsString({message: 'El atributo ${resultados[i].atributo} debe ser un texto'})`);
                validadores.push("IsString");
            }
            if (resultados[i].tipoAtributo === "Date") {
                dto.push(`@IsDate({message: 'El atributo ${resultados[i].atributo} debe de ser formato válido'})\n
                    @Type(() => Date)
                    \n`);
                validadores.push("IsDate");
                importaciones.push("import { Type } from 'class-transformer';");
            }
            if (resultados[i].tipoAtributo === "boolean") {
                dto.push(`@IsBoolean({message: 'El atributo ${resultados[i].atributo} debe de ser un boolean'})\n`);
                validadores.push("IsBoolean");
            }
            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);
            dto.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo + ";");
        }
    }
    validadores = eliminarDuplicado(validadores);

    return {
        import: importaciones.join(),
        atributos: dto.join('\n'),
        validadores: validadores.toString()
    }
}

// Esta función me crea el read DTO...
function crearReadDto(entity) {
    dto = [];
    importaciones = [];
    let parametros = [];
    let impDto = new Map();
    let modulos = {};
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));

    for (let i = 0; i < resultados.length; i++) {
        if (resultados[i].entidad) {
            let nombre = formatearNombre(eliminarSufijo(resultados[i].entidad.trim(), 'Entity'), '-');
            let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(eliminarSufijo(resultados[i].entidad.trim(), 'Entity')));
            let nombreDto;
            if (esNomenclador) {
                nombreDto = `read-nomenclador.dto.ts`;
            } else {
                nombreDto = `read-${nombre}.dto.ts`;
            }
            let direccion;
            if (buscarFichero(nombreDto)) {
                direccion = direccionFichero(nombreDto);
            }
            let nombreModulo = '';
            if (direccion.includes('src')) {
                nombreModulo = direccion.substring(direccion.indexOf('src') + 4, direccion.indexOf('dto') - 1)
            }
            if(moduleName==='nomenclator'){
                parametros.push('nombre: string, descripcion: string');
            }
            if (nombreModulo === moduleName && !esNomenclador) {
                importaciones.push(`import { Read${quitarSeparador(nombre, '-')}Dto } from './${nombre}.dto';`);
            } else if (esNomenclador) {
                if (nombreModulo === moduleName) {
                    importaciones.push(`import { ReadNomencladorDto } from "./read-nomenclador.dto";`);
                } else {
                    importaciones.push(`import { ReadNomencladorDto } from "../../nomenclator/dto";`);
                }
            } else {
                if (!modulos.hasOwnProperty('importacion')) {
                    modulos = {
                        importacion: []
                    }
                }
                if (impDto.has(nombreModulo)) {
                    impDto.set(nombreModulo, impDto.get(nombreModulo).importacion.push(`Read${quitarSeparador(nombre, '-')}Dto`));
                } else {
                    modulos.importacion.push(`Read${quitarSeparador(nombre, '-')}Dto`);
                    impDto.set(nombreModulo, modulos);
                }
            }

            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);

            if (esNomenclador) {
                if (resultados[i].tipoAtributo.includes('[]')) {
                    dto.push(resultados[i].atributo + ": ReadNomencladorDto[];");
                    parametros.push(resultados[i].atributo + ": ReadNomencladorDto[]");
                } else {
                    dto.push(resultados[i].atributo + ": ReadNomencladorDto;");
                    parametros.push(resultados[i].atributo + ": ReadNomencladorDto");
                }
            } else {
                if (resultados[i].tipoAtributo.includes('[]')) {
                    dto.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto[];");
                    parametros.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto[]");
                } else {
                    dto.push(resultados[i].atributo + ": Read" + nombre + "Dto;");
                    parametros.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto");
                }
            }

        } else if (resultados[i].atributo) {
            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);
            dto.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo + ";");
            parametros.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo);
        }
    }
    let thisAtrib = thisAtributos(parametros);
    if (impDto.size > 0) {
        for (const key of impDto.keys()) {
            let imp = eliminarDuplicado(impDto.get(key).importacion);
            importaciones.push(` import { ${imp.toString()}} from '../../${key}/dto';`);
        }
    }
    importaciones = eliminarDuplicado(importaciones);
    return {
        import: importaciones.join('\n'),
        atributos: dto.join('\n'),
        parametros: parametros.toString(),
        thisAtributos: thisAtrib.join('\n')
    }
}

// y este último ya te construye el a partir de un arreglo original
const generarDto = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    const parse =  descompilarScript(lineas.join(''));
    const entity = parse.find((item) => item.type === 'class');
    return crearDto(entity);
}

const generarReadDto = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    const parse =  descompilarScript(lineas.join(''));
    const entity = parse.find((item) => item.type === 'class');
    return crearReadDto(entity);
}

module.exports = {generarDto, generarReadDto};
