const fs = require("fs");
const pathBase = process.cwd();
var finder = require("findit")(pathBase + "\\src\\");
const path = require('path');

let dirFiles = [];
let dirFolders = [];
finder.on("file", function (file, stat) {
    dirFiles.push(file);
});
finder.on("directory", function (dir, stat, stop) {
    dirFolders.push(dir);
});
const buscar = (file) => {
    for (const dir of dirFiles) {
        if (dir.indexOf(file) !== -1) {
            return true;
        }
    }
    return false;
}
const direccionCarpeta = (nombre) => {
    let direccion;
    for (const dir of dirFolders) {
        if (dir.indexOf(nombre) !== -1) {
            direccion = dir;
        }
    }
    return direccion;
}
const direccionFichero = (nombre) => {
    let direccion;
    for (const dir of dirFiles) {
        if (dir.indexOf(nombre) !== -1) {
            direccion = dir;
        }
    }
    return direccion;
}
const eliminarDuplicado = (array) => {
    let arreglado = [];
    array.forEach((element) => {
        arreglado.push(element.trim());
    });
    return arreglado.filter((item, index) => {
        return arreglado.indexOf(item) === index;
    });
};
const thisAtributos = (parametros) => {
    let resultados = [];
    let param;
    parametros.forEach((parametro) => {
        param = parametro.substring(0, parametro.indexOf(':'));
        resultados.push(`this.${param} = ${param};`);
    });
    return resultados;
};

const escribirIndex = (filePath, exportaciones) => {
    if (!fs.existsSync(filePath)) {
        fs.closeSync(fs.openSync(filePath, "w"));
    }
    fs.appendFileSync(filePath, exportaciones, (err) => {
        if (err) throw err;
        console.log("No se pudo escribir en el fichero");
    });
}

const escribirFichero = (filePath, fichero) => {
    fs.writeFileSync(filePath, fichero, {mode: 0o777});
}

module.exports = {
    buscar,
    eliminarDuplicado,
    direccionCarpeta,
    direccionFichero,
    thisAtributos,
    escribirIndex,
    escribirFichero
};