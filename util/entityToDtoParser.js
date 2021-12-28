const {
    eliminarSufijo,
    comienzaCon,
    right,
    eliminarDuplicado,
    buscarFichero,
    thisAtributos, formatearNombre, direccionFichero, quitarSeparador
} = require("./util");
const ruta = require("path");
const {busquedaInterna, aInicialMinuscula} = require("../util/util");
let resultados = [];

// analizar la próxima línea
let pendienteAnalisis = '';

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    let nombreEsquema;

    if (comienzaCon(pendienteAnalisis, 'constructor')) {
        return false
    }
    if (comienzaCon(pendienteAnalisis, '@Entity(')) {
        let primeraComillaNombre;
        let segundaComillaNombre;
        let posicionEsquema;
        if (pendienteAnalisis.indexOf("'") !== -1) {
            primeraComillaNombre = pendienteAnalisis.indexOf("'");
            segundaComillaNombre = pendienteAnalisis.indexOf("'", primeraComillaNombre + 1);
        } else {
            primeraComillaNombre = pendienteAnalisis.indexOf('"');
            segundaComillaNombre = pendienteAnalisis.indexOf('"', primeraComillaNombre + 1);
        }
        let primeraComillaEsquema;
        let segundaComillaEsquema;
        posicionEsquema = pendienteAnalisis.includes('schema:');
        if (posicionEsquema) {
            if (pendienteAnalisis.indexOf("'", posicionEsquema) !== -1) {
                primeraComillaEsquema = pendienteAnalisis.indexOf("'", posicionEsquema);
                segundaComillaEsquema = pendienteAnalisis.indexOf("'", primeraComillaEsquema + 1);
            } else {
                primeraComillaEsquema = pendienteAnalisis.indexOf('"', posicionEsquema);
                segundaComillaEsquema = pendienteAnalisis.indexOf('"', primeraComillaEsquema + 1);
            }
            nombreEsquema = pendienteAnalisis.substring(primeraComillaEsquema + 1, segundaComillaEsquema);
        }
        resultados.push({
            'nombre': pendienteAnalisis.substring(primeraComillaNombre + 1, segundaComillaNombre),
            'esquema': nombreEsquema
        });
    }
    if (comienzaCon(pendienteAnalisis, '@Column(')) {
        let principioNombreAtributo = pendienteAnalisis.indexOf('})') + 1;
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.substring(principioNombreAtributo + 1, finNombreAtributo).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.substring(principioTipoAtributo, pendienteAnalisis.indexOf(';')).trim();

        let datosNulabilidad = pendienteAnalisis.includes('nullable');
        let admitenulos = pendienteAnalisis.includes('nullable: true');
        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': tipoAtributo,
            'nulabilidad': datosNulabilidad,
            'admitenulos': admitenulos
        });
    }
    if (comienzaCon(pendienteAnalisis, '@ManyToMany(')) {
        let principioNombreAtributo = pendienteAnalisis.lastIndexOf(')');
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.substring(principioNombreAtributo + 1, finNombreAtributo).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.substring(principioTipoAtributo, pendienteAnalisis.indexOf(';'));

        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': 'number[]',
            'nulabilidad': false,
            'admitenulos': false,
            'entidad': tipoAtributo
        });
    }
    if (comienzaCon(pendienteAnalisis, '@ManyToOne(')) {
        let principioNombreAtributo = pendienteAnalisis.lastIndexOf(')');
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.substring(principioNombreAtributo + 1, finNombreAtributo).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.substring(principioTipoAtributo, pendienteAnalisis.indexOf(';'));

        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': 'number',
            'nulabilidad': false,
            'admitenulos': false,
            'entidad': tipoAtributo
        });
    }
    // flush, vacío el buffer hasta que encuentre un ;
    pendienteAnalisis = '';

}

// ManyToOne y OneToOne, uno a muchos no es necesario...

// Este parsea linea a linea, pero antes se debe crear un nuevoParseo() para reinicializar...
function leerProximaLinea(datos) {
    datos = datos.trim();
    pendienteAnalisis = pendienteAnalisis + datos;

    // No parsea hasta que encuentre un punto y coma
    if (right(pendienteAnalisis, 1) !== ';') {
        return;
    }
    return procesarLineaDeComandos();
}

// Esta función me crea los atributos para 3 dto...
let dto = [];
let importaciones = [];

function crearDto() {
    dto = [];
    importaciones = [];
    let validadores = [];

    for (let i = 0; i < resultados.length; i++) {
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
function crearReadDto(moduleName) {
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
            let nombreDto = `read-${nombre}.dto.ts`;
            let direccion;
            if (buscarFichero(nombreDto)) {
                direccion = direccionFichero(nombreDto);
            }
            let nombreModulo = '';

            if (direccion.includes('src')) {
                nombreModulo = direccion.substring(direccion.indexOf('src') + 4, direccion.indexOf('dto') - 1)
            }
            if (nombreModulo === moduleName) {
                importaciones.push(`import { Read${quitarSeparador(nombre, '-')}Dto } from './${nombreDto}';`);
            } else if (esNomenclador) {
                importaciones.push(`import { ReadNomencladorDto } from "../../nomenclator/dto";`);
            } else {
                if (!modulos.hasOwnProperty('importacion')) {
                    modulos = {
                        importacion: []
                    }
                }
                if (impDto.has(nombreModulo)){
                    impDto.set(nombreModulo, impDto.get(nombreModulo).importacion.push(`Read${quitarSeparador(nombre, '-')}Dto`));
                }else{
                    modulos.importacion.push(`Read${quitarSeparador(nombre, '-')}Dto`);
                    impDto.set(nombreModulo, modulos);
                }
            }

            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);
            if (resultados[i].tipoAtributo.includes('[]')) {
                dto.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto[];");
                parametros.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto[]");
            } else {
                dto.push(resultados[i].atributo + ": Read" + nombre + "Dto;");
                parametros.push(resultados[i].atributo + ": Read" + quitarSeparador(nombre, '-') + "Dto");
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
const generarDto = (entityLines) => {
    // ejemplo, primero comienzas un nuevo parseo, despues linea a linea hasta que llegues a la última
    //nuevoParseo();
    // Leer las lineas una a una
    for (let index = 0; index < entityLines.length; index++) {
        const element = entityLines[index];
        leerProximaLinea(element);
    }
    procesarLineaDeComandos(); // procesar aunque no terminea en ;

    // te crea algo parecido a una precompilación en resultados con todos los elementos para armar el dto
    return crearDto();
}

const generarReadDto = (entityLines, moduleName) => {
    // ejemplo, primero comienzas un nuevo parseo, despues linea a linea hasta que llegues a la última
    //nuevoParseo();
    // Leer las lineas una a una
    for (let index = 0; index < entityLines.length; index++) {
        const element = entityLines[index];
        leerProximaLinea(element);
    }
    procesarLineaDeComandos(); // procesar aunque no terminea en ;

    // te crea algo parecido a una precompilación en resultados con todos los elementos para armar el dto
    return crearReadDto(moduleName);
}

module.exports = {generarDto, generarReadDto};
