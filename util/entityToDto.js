const {
    eliminarSufijo,
    eliminarDuplicado,
    thisAtributos, formatearNombre, direccionFichero, quitarSeparador, descompilarScript, aInicialMayuscula
} = require("./util");
const ruta = require("path");
const {busquedaInterna, aInicialMinuscula} = require("../util/util");
const fs = require("fs");
const LineReaderSync = require("line-reader-sync");
// Esta función me crea los atributos para 3 dto...
let dto = [];
let importaciones = [];
let swagger = [];

function crearDto(entity) {
    dto = [];
    importaciones = [];
    swagger = [];
    let validadores = ['IsNotEmpty'];
    for (let i = 0; i < entity.attributes.length; i++) {
        if (entity.attributes[i].relation === undefined || !entity.attributes[i].relation.includes('OneToMany')) {
            if (entity.attributes[i].hasOwnProperty('nullable')) {
                if (entity.attributes[i].nullable === 'false') {
                    dto.push('@IsNotEmpty()');
                }
            }
            if (entity.attributes[i].name.includes('?')) {
                dto.push('@IsOptional()');
                validadores.push("IsOptional");
                swagger.push("ApiPropertyOptional");
            }
            if (entity.attributes[i].hasOwnProperty('relation') && entity.attributes[i].relation.includes('ManyToMany')) {
                dto.push(`@IsArray({message: 'El atributo ${entity.attributes[i].name} debe de ser un arreglo'})`);
                validadores.push("IsArray");
            }
            if (entity.attributes[i].kind === "number") {
                dto.push(`@IsNumber({},{message: 'El atributo ${entity.attributes[i].name} debe ser un número'})`);
                validadores.push("IsNumber");
            }
            if (entity.attributes[i].kind === "string") {
                dto.push(`@IsString({message: 'El atributo ${entity.attributes[i].name} debe ser un texto'})`);
                validadores.push("IsString");
            }
            if (entity.attributes[i].kind === "Date") {
                dto.push(`@IsDate({message: 'El atributo ${entity.attributes[i].name} debe de ser formato válido'})\n
                    @Type(() => Date)
                    \n`);
                validadores.push("IsDate");
                importaciones.push("import { Type } from 'class-transformer';");
            }
            if (entity.attributes[i].kind === "boolean") {
                dto.push(`@IsBoolean({message: 'El atributo ${entity.attributes[i].name} debe de ser un boolean'})\n`);
                validadores.push("IsBoolean");
            }
            if (entity.attributes[i].name.includes('?')) {
                dto.push(`@ApiPropertyOptional({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name.split('?')[0]}', example: 'Aquí una muestra para ese atributo'})`);
            } else {
                dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name}', example: 'Aquí una muestra para ese atributo'})`);
            }

            if (entity.attributes[i].hasOwnProperty('relation') && entity.attributes[i].relation.includes('ManyToMany')) {
                dto.push(entity.attributes[i].name + ": number[];");
            } else if (entity.attributes[i].hasOwnProperty('relation') && (entity.attributes[i].relation.includes('ManyToOne') || entity.attributes[i].relation.includes('OneToOne'))) {
                dto.push(entity.attributes[i].name + ": number;");
            } else {
                dto.push(entity.attributes[i].name + ": " + entity.attributes[i].kind + ";");
            }
        }

    }
    validadores = eliminarDuplicado(validadores);

    return {
        import: importaciones.join(),
        atributos: dto.join('\n'),
        validadores: validadores.toString(),
        swagger

    }
}

// Esta función me crea el read DTO...
function crearReadDto(entity) {
    dto = [];
    importaciones = [];
    swagger = [];
    let parametros = [];
    let rutaNomenclador = ruta.normalize(direccionFichero("nomenclador-type.enum.ts"));

    for (let i = 0; i < entity.attributes.length; i++) {
        if (entity.attributes[i].relation === undefined || !entity.attributes[i].relation.includes('OneToMany')) {
            if (entity.attributes[i].name.includes('?')) {
                swagger.push("ApiPropertyOptional");
            }
            if (entity.attributes[i].kind.includes('Entity')) {
                let nombre = formatearNombre(eliminarSufijo(entity.attributes[i].kind, 'Entity'), '-');
                let esNomenclador = busquedaInterna(rutaNomenclador, aInicialMinuscula(eliminarSufijo(entity.attributes[i].kind, 'Entity')));
                let nombreDto;
                if (esNomenclador) {
                    nombreDto = `read-nomenclador.dto.ts`;
                } else {
                    nombreDto = `read-${nombre}.dto.ts`;
                }

                if (esNomenclador) {
                    parametros.push('nombre: string, descripcion: string');
                }
                if (!esNomenclador) {
                    importaciones.push(`import { Read${quitarSeparador(nombre, '-')}Dto } from './${nombre}.dto';`);
                } else {
                    importaciones.push(`import { ReadNomencladorDto } from "./read-nomenclador.dto";`);
                }

                if (entity.attributes[i].name.includes('?')) {
                    dto.push(`@ApiPropertyOptional({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name.split('?')[0]}', example: 'Aquí una muestra para ese atributo'})`);
                } else {
                    dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name}', example: 'Aquí una muestra para ese atributo'})`);
                }

                if (esNomenclador) {
                    if (entity.attributes[i].hasOwnProperty('relation') && entity.attributes[i].relation.includes('ManyToMany')) {
                        dto.push(entity.attributes[i].name + ": ReadNomencladorDto[];");
                        parametros.push(entity.attributes[i].name + ": ReadNomencladorDto[]");
                    } else {
                        dto.push(entity.attributes[i].atributo + ": ReadNomencladorDto;");
                        parametros.push(entity.attributes[i].atributo + ": ReadNomencladorDto");
                    }
                } else {
                    if (entity.attributes[i].hasOwnProperty('relation') && entity.attributes[i].relation.includes('ManyToMany')) {
                        dto.push(entity.attributes[i].name + ": Read" + aInicialMayuscula(quitarSeparador(nombre, '-')) + "Dto[];");
                        parametros.push(entity.attributes[i].name + ": Read" + aInicialMayuscula(quitarSeparador(nombre, '-')) + "Dto[]");
                    } else if (entity.attributes[i].hasOwnProperty('relation') && (entity.attributes[i].relation.includes('ManyToOne') || entity.attributes[i].relation.includes('OneToOne'))) {
                        dto.push(entity.attributes[i].name + ": Read" + aInicialMayuscula(quitarSeparador(nombre, '-')) + "Dto;");
                        parametros.push(entity.attributes[i].name + ": Read" + aInicialMayuscula(quitarSeparador(nombre, '-')) + "Dto");
                    }
                }
            } else {
                if (entity.attributes[i].name.includes('?')) {
                    dto.push(`@ApiPropertyOptional({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name.split('?')[0]}', example: 'Aquí una muestra para ese atributo'})`);
                } else {
                    dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${entity.attributes[i].name}', example: 'Aquí una muestra para ese atributo'})`);
                }
                dto.push(entity.attributes[i].name + ": " + entity.attributes[i].kind + ";");
                parametros.push(entity.attributes[i].name + ": " + entity.attributes[i].kind);
            }
        }
    }
    let thisAtrib = thisAtributos(parametros);
    importaciones = eliminarDuplicado(importaciones);
    return {
        import: importaciones.join('\n'),
        atributos: dto.join('\n'),
        parametros: parametros.toString(),
        thisAtributos: thisAtrib.join('\n'),
        swagger
    }
}

// y este último ya te construye el a partir de un arreglo original
const generarDto = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    const parse = descompilarScript(lineas.join(''));
    const entity = parse.find((item) => item.type === 'class');
    return crearDto(entity);
}

const generarReadDto = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    const parse = descompilarScript(lineas.join(''));
    const entity = parse.find((item) => item.type === 'class');
    return crearReadDto(entity);
}

module.exports = {generarDto, generarReadDto};
