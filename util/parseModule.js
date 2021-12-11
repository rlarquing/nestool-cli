const {comienzaCon, right} = require("./util");
const LineReaderSync = require("line-reader-sync");
let importaciones = [];
let pendienteAnalisis = '';
let restoClase = [];

function procesarLineaDeComandos() {
    // Aquí es cuando parseo
    // ignoro el constructor
    if (comienzaCon(pendienteAnalisis, 'import')) {
        importaciones.push(pendienteAnalisis);
    }
    if (comienzaCon(pendienteAnalisis, '@Module')) {
        restoClase.push(pendienteAnalisis);
    }

    if (comienzaCon(pendienteAnalisis, '}')) {
        restoClase.push(pendienteAnalisis);
    }


    // flush, vacío el buffer hasta que encuentre un ;
    pendienteAnalisis = "";

}


// Este parsea linea a linea, pero antes se debe crear un nuevoParseo() para reinicializar...
function leerProximaLinea(datos) {
    datos = datos.trim();
    pendienteAnalisis += datos;
    //No parsea hasta que encuentre un punto y coma
    if (right(pendienteAnalisis, 1) !== ';') {
        return;
    }

    return procesarLineaDeComandos();
}

function parseModulo() {
    restoClase=restoClase.join('');
    if (restoClase.includes('TypeOrmModule.forFeature([')) {
        let entidades = restoClase.substring(restoClase.indexOf('TypeOrmModule.forFeature([') + 1, restoClase.indexOf(']),'));
        restoClase = restoClase.replace(entidades, entidades + ', $entidad');
    } else {
        if (restoClase.includes('imports: [')) {
            let imports = restoClase.substring(restoClase.indexOf('[') + 1, restoClase.indexOf('],controllers:'));
            restoClase = restoClase.replace(imports, 'TypeOrmModule.forFeature([$entidad]),' + imports);
        } else {
            let imports = restoClase.substring(restoClase.indexOf('(') + 1, restoClase.indexOf(')'));
            restoClase = restoClase.replace(imports, '{ imports: [TypeOrmModule.forFeature([$entidad]),],}');
        }
        importaciones.push("import { TypeOrmModule } from '@nestjs/typeorm';");
    }
    return {
        import: importaciones,
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


    return parseModulo();
}
module.exports = {parseM}
