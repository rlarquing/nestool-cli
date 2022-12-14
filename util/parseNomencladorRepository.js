const {comienzaCon, right} = require("./util");
const LineReaderSync = require("line-reader-sync");
let importaciones = [];
let pendienteAnalisis = '';
let restoClase = [];
let estaEntity = false;

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    if (comienzaCon(pendienteAnalisis, 'import')) {
        if (pendienteAnalisis.includes(`../entity'`)) {
            estaEntity = true;
            let parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('{') + 1, pendienteAnalisis.indexOf('}'));
            pendienteAnalisis = pendienteAnalisis.replace(parametros, parametros + ', $entidad');
        }
        importaciones.push(pendienteAnalisis);
    } else {
        if (comienzaCon(pendienteAnalisis, 'export')) {
            if (!estaEntity) {
                importaciones.push(`import {$entidad} from '../entity';`);
            }
            if (pendienteAnalisis.includes('constructor')) {
                let parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('(') + 1, pendienteAnalisis.indexOf(') {}'));
                if(parametros.trim()===''){
                    parametros = pendienteAnalisis.substring(pendienteAnalisis.indexOf('('), pendienteAnalisis.indexOf(') {}')+1);
                    pendienteAnalisis = pendienteAnalisis.replace(parametros, '($parametros)');
                }else{
                    pendienteAnalisis = pendienteAnalisis.replace(parametros, parametros + ', $parametros');
                }
            }
        }
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
    // No parsea hasta que encuentre un punto y coma
    if (right(pendienteAnalisis, 1) !== ';') {
        return;
    }
    return procesarLineaDeComandos();
}

function parseRepository() {
    let parse = {
        import: importaciones,
        restoClase
    };
    importaciones = [];
    restoClase = [];
    return parse;

}

// y este último ya te construye el a partir de un arreglo original
const parseN = (dir) => {
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
    return parseRepository();
}
module.exports = {parseN}
