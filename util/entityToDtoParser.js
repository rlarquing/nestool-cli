const superString = require("./superString");
const {eliminarDuplicado, buscar, direccionCarpeta, thisAtributos} = require("../util/util");
let resultados = [];

// function nuevoParseo() {
//     resultados = [];
// }

// analizar la próxima línea
let pendienteAnalisis = new superString("");

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    let nombreEsquema;

    if (pendienteAnalisis.beginsWith('constructor')) {
        return false
    }
    if (pendienteAnalisis.beginsWith('@Entity(')) {
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
        posicionEsquema = pendienteAnalisis.indexOf('schema:');
        if (posicionEsquema !== -1) {
            if (pendienteAnalisis.indexOf("'", posicionEsquema) !== -1) {
                primeraComillaEsquema = pendienteAnalisis.indexOf("'", posicionEsquema);
                segundaComillaEsquema = pendienteAnalisis.indexOf("'", primeraComillaEsquema + 1);
            } else {
                primeraComillaEsquema = pendienteAnalisis.indexOf('"', posicionEsquema);
                segundaComillaEsquema = pendienteAnalisis.indexOf('"', primeraComillaEsquema + 1);
            }
            nombreEsquema = pendienteAnalisis.absoluteCut(primeraComillaEsquema + 1, segundaComillaEsquema);
        }
        resultados.push({
            'nombre': pendienteAnalisis.absoluteCut(primeraComillaNombre + 1, segundaComillaNombre),
            'esquema': nombreEsquema
        });
    }
    if (pendienteAnalisis.beginsWith('@Column(')) {
        let principioNombreAtributo = pendienteAnalisis.indexOf('})') + 1;
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.absoluteCut(principioNombreAtributo + 1, finNombreAtributo).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.absoluteCut(principioTipoAtributo, pendienteAnalisis.indexOf(';')).trim();

        let datosNulabilidad = pendienteAnalisis.contains(pendienteAnalisis, 'nullable');
        let admitenulos = pendienteAnalisis.contains(pendienteAnalisis, 'nullable: true');
        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': tipoAtributo,
            'nulabilidad': datosNulabilidad,
            'admitenulos': admitenulos
        });
    }
    if (pendienteAnalisis.beginsWith('@ManyToMany(')) {
        let principioNombreAtributo = pendienteAnalisis.lastIndexOf(')');
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.absoluteCut(principioNombreAtributo + 1, finNombreAtributo - 1,).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.absoluteCut(principioTipoAtributo, pendienteAnalisis.indexOf(';') - 1);

        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': 'number[]',
            'nulabilidad': false,
            'admitenulos': false,
            'entidad': tipoAtributo
        });
    }
    if (pendienteAnalisis.beginsWith('@ManyToOne(')) {
        let principioNombreAtributo = pendienteAnalisis.lastIndexOf(')');
        let finNombreAtributo = pendienteAnalisis.indexOf(':', principioNombreAtributo);
        let nombreAtributo = pendienteAnalisis.absoluteCut(principioNombreAtributo + 1, finNombreAtributo - 1,).trim();

        let principioTipoAtributo = pendienteAnalisis.indexOf(':', finNombreAtributo) + 1;
        let tipoAtributo = pendienteAnalisis.absoluteCut(principioTipoAtributo, pendienteAnalisis.indexOf(';') - 1);

        resultados.push({
            'atributo': nombreAtributo,
            'tipoAtributo': 'number',
            'nulabilidad': false,
            'admitenulos': false,
            'entidad': tipoAtributo
        });
    }
    // flush, vacío el buffer hasta que encuentre un ;
    pendienteAnalisis = new superString("");

}

// ManyToOne y OneToOne, uno a muchos no es necesario...

// Este parsea linea a linea, pero antes se debe crear un nuevoParseo() para reinicializar...
function leerProximaLinea(datos) {
    datos = datos.trim();
    pendienteAnalisis = new superString(pendienteAnalisis+datos);

    // No parsea hasta que encuentre un punto y coma
    if (pendienteAnalisis.right(1) !== ';') {
        return;
    }
    return procesarLineaDeComandos();
}

// Esta función me crea los atributos para 3 dto...
let dto = [];
let importaciones = [];

function crearDto() {
    dto = [];
    let validadores = [];

    for (let i = 0; i < resultados.length; i++) {
        if (resultados[i].atributo) {
            // hay referencia a datos de nulabilidad
            if (resultados[i].nulabilidad) {
                if (!resultados[i].admitenulos) {
                    dto.push('@IsNotEmpty()');
                }
            }
            if (resultados[i].tipoAtributo.indexOf('[]') !== -1) {
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
function crearReadDto() {
    dto = [];
    let parametros = [];
    for (let i = 0; i < resultados.length; i++) {
        if (resultados[i].atributo){
            parametros.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo);
        }
        if (resultados[i].entidad) {
            let nombre = new superString(resultados[i].entidad).eliminarSufijo('Entity');
            let nombreDto = `read-${new superString(nombre).recortarMayusculas('-')}.dto.ts`;
            let direccion;
            if (buscar(nombreDto)) {
                direccion = direccionCarpeta(nombreDto);
            }
            let nombreModulo;
            if (direccion.indexOf('/src/') !== -1) {
                nombreModulo = direccion.substring(direccion.indexOf('/src/') + 5);
            } else {
                nombreModulo = direccion.substring(direccion.indexOf('\\src\\') + 5);
            }
            importaciones.push(`import { Read${nombre}Dto } from '../../${nombreModulo}';`);

            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);
            dto.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo + ";");
        } else if(resultados[i].atributo){
            dto.push(`@ApiProperty({description: 'Aquí escriba una descripción para el atributo ${resultados[i].atributo}', example: 'Aquí una muestra para ese atributo'})`);
            dto.push(resultados[i].atributo + ": " + resultados[i].tipoAtributo + ";");
        }
    }
    let thisAtrib = thisAtributos(parametros);

    return {
        import: importaciones.join(),
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

const generarReadDto = (entityLines) => {
    // ejemplo, primero comienzas un nuevo parseo, despues linea a linea hasta que llegues a la última
    //nuevoParseo();
    // Leer las lineas una a una
    for (let index = 0; index < entityLines.length; index++) {
        const element = entityLines[index];
        leerProximaLinea(element);
    }
    procesarLineaDeComandos(); // procesar aunque no terminea en ;

    // te crea algo parecido a una precompilación en resultados con todos los elementos para armar el dto
    return crearReadDto();
}

module.exports = {generarDto,generarReadDto};
