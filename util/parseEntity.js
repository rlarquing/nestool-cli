const {comienzaCon, right, aInicialMayuscula} = require("./util");
const LineReaderSync = require("line-reader-sync");
let importaciones = [];
let atributos = [];
let pendienteAnalisis = '';
let clase = '';
let restoClase = [];
let constructor = [];
let importNew = [];
let parametros='';
function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    if (comienzaCon(pendienteAnalisis, 'import')) {
        importaciones.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'import')) {
        if (pendienteAnalisis.includes('typeorm')) {
            let parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('{') + 1, pendienteAnalisis.indexOf('}'));
            pendienteAnalisis = pendienteAnalisis.replace(parametros, parametros + ', $typeorm');
        }
        importNew.push(pendienteAnalisis);
    }
    if (!comienzaCon(pendienteAnalisis, '@Entity(') && comienzaCon(pendienteAnalisis, '@')) {
        atributos.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'constructor') || comienzaCon(pendienteAnalisis, 'this.') || comienzaCon(pendienteAnalisis, '}')) {
        restoClase.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'constructor')) {
        parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('(') + 1, pendienteAnalisis.indexOf(')'));
        pendienteAnalisis = pendienteAnalisis.replace(parametros, parametros + ', $parametros').replace(',,',',');
        constructor.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, 'this.')) {
        constructor.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, '}')) {
         if(restoClase[restoClase.length-2].includes(';')){
             if (comienzaCon(restoClase[restoClase.length - 2], 'this.')) {
                 pendienteAnalisis = pendienteAnalisis.replace('}', '$thisAtributos}');
                 constructor.push(pendienteAnalisis);
             }
         }
    }
    if (comienzaCon(pendienteAnalisis, 'public')) {
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
    importNew.push('$import');
    let atributosNew = atributos.slice();
    atributosNew.push('$atributos');
    let arrTmp=parametros.split(',').filter((val)=>val.trim()!=='');
    let header=arrTmp.map((parametro)=>`'${aInicialMayuscula(parametro.split(':')[0])}'`);
    let parse={import: importaciones,
        importNew,
        clase,
        atributos,
        atributosNew,
        constructor,
        restoClase,
        parametros,
        header
};
    importaciones=[];
    importNew=[];
    atributos=[];
    constructor=[];
    restoClase=[];
    return parse;

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
