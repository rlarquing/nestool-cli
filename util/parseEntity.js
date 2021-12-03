const {comienzaCon, right} = require("./util");
const LineReaderSync = require("line-reader-sync");
let importaciones = [];
let atributos = [];
let pendienteAnalisis = '';
let clase = '';
let restoClase = [];

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    let nombreEsquema;
    if (comienzaCon(pendienteAnalisis, 'import')) {
        importaciones.push(pendienteAnalisis);
    }
    if (!comienzaCon(pendienteAnalisis, '@Entity(') && comienzaCon(pendienteAnalisis, '@')) {
        atributos.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'constructor') || comienzaCon(pendienteAnalisis, 'this') || comienzaCon(pendienteAnalisis, '}')) {
        restoClase.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, '@Entity(')) {
        clase = pendienteAnalisis;
    }
    // flush, vacío el buffer hasta que encuentre un ;
    pendienteAnalisis = "";

}

// ManyToOne y OneToOne, uno a muchos no es necesario...

// Este parsea linea a linea, pero antes se debe crear un nuevoParseo() para reinicializar...
function leerProximaLinea(datos) {
    datos = datos.trim();
    pendienteAnalisis += datos;
    // No parsea hasta que encuentre un punto y coma
    if (right(pendienteAnalisis, 1) !== ';') {
        return;
    }
    return procesarLineaDeComandos();
}

function parseEntidad() {

    return {
        import: importaciones,
        atributos,
        clase,
        restoClase
    }
}

// y este último ya te construye el a partir de un arreglo original
const parse = (dir) => {
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
    return parseEntidad();
}
module.exports = {parse}
