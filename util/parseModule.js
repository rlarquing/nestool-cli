const {comienzaCon, right} = require("./util");
const LineReaderSync = require("line-reader-sync");
let importaciones = [];
let atributos = [];
let pendienteAnalisis = '';
let clase = '';
let restoClase = [];
let imports = [];
let importNew = [];

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    if (comienzaCon(pendienteAnalisis, 'import')) {
        importaciones.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'imports')) {
        imports.push(pendienteAnalisis);
    }
    // if (comienzaCon(pendienteAnalisis, 'import')) {
    //     if (pendienteAnalisis.includes('typeorm')) {
    //         let parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('{') + 1, pendienteAnalisis.indexOf('}'));
    //         pendienteAnalisis = pendienteAnalisis.replace(parametros, parametros + ', $typeorm');
    //     }
    //     importNew.push(pendienteAnalisis);
    // }
    if (comienzaCon(pendienteAnalisis, 'controllers') || comienzaCon(pendienteAnalisis, 'providers.') || comienzaCon(pendienteAnalisis, 'exports') || comienzaCon(pendienteAnalisis, 'export class')) {
        restoClase.push(pendienteAnalisis);
    }



    // flush, vacío el buffer hasta que encuentre un ;
    pendienteAnalisis = "";

}

// ManyToOne y OneToOne, uno a muchos no es necesario...

// Este parsea linea a linea, pero antes se debe crear un nuevoParseo() para reinicializar...
function leerProximaLinea(datos) {
    datos = datos.trim();
    pendienteAnalisis += datos;
    //No parsea hasta que encuentre un punto y coma
    console.log(right(pendienteAnalisis, 2));
    if (right(pendienteAnalisis, 2) !== ' ],') {
        return;
    }


    return procesarLineaDeComandos();
}

function parseModulo() {
    importNew.push('$import');
    let atributosNew = atributos.slice();
    atributosNew.push('$atributos');
    return {
        import: importaciones,
        imports,
        restoClase
    }
}

// y este último ya te construye el a partir de un arreglo original
const parseM = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    // ejemplo, primero comienzas un nuevo parseo, despues linea a linea hasta que llegues a la última
    //nuevoParseo();
    // Leer las lineas una a una
    for (let index = 0; index < lineas.length; index++) {
        const element = lineas[index];
        leerProximaLinea(element);
    }
    procesarLineaDeComandos(); // procesar aunque no terminea en ;

    // te crea algo parecido a una precompilación en resultados con todos los elementos para armar el dto
    return parseModulo();
}
module.exports = {parseM}
