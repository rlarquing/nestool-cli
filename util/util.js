const fs = require("fs");
const inquirer = require("inquirer");
const chalk = require("chalk");
const pathBase = process.cwd();
const finder = require("findit")(pathBase + "\\src\\");

let dirFiles = [];
let dirFolders = [];
finder.on("file", function (file) {
    dirFiles.push(file);
});
finder.on("directory", function (dir) {
    dirFolders.push(dir);
});

const preguntar = async (questions) => {
    let output = [];
    let answers;
    do {
        answers = await inquirer.prompt(questions);
        output.push(answers);
    } while (answers.askAgain);
    return output;
};

const find = (lista, elemento) => {
    for (const item of lista) {
        if (item.indexOf(elemento) !== -1) {
            return true;
        }
    }
    return false;
}

const findElemento = (lista, elemento) => {
    for (const item of lista) {
        if (item.indexOf(elemento) !== -1) {
            return item;
        }
    }
    return -1;
}

const buscarFichero = (file) => {
    return find(dirFiles, file);
}

const buscarCarpeta = (folder) => {
    return find(dirFolders, folder);
}

const direccionFichero = (nombre) => {
    return findElemento(dirFiles, nombre);
}

const direccionCarpeta = (nombre) => {
    return findElemento(dirFolders, nombre);
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
    fs.writeFileSync(filePath, fichero, { mode: 0o777 });
}
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const left = (str, l) => {
    return str.substr(0, l);
}
const right = (str, l) => {
    return str.substr(str.length - l, l);
}


const terminaCon = (str, s) => {
    return right(str, s.length) === s;

}

const comienzaCon = (str, s) => {
    return left(str, s.length) === s;


}

const eliminarSufijo = (str, s) => {
    if (right(str, s.length) === s) {
        return left(str, str.length - s.length);
    } else {
        return str;
    }
}

const eliminarPrefijo = (str, s) => {
    if (left(str, s.length) === s) {
        return right(str, str.length - s.length);
    } else {
        return str;
    }
}


const esMayuscula = (char) => {
    return char === char.toLocaleUpperCase();
}

const formatearNombre = (str, separador) => {
    if (str.length === 0) {
        return "";
    }
    let resultado = str[0].toLocaleLowerCase();
    for (let i = 1; i < str.length; i++) {
        if (esMayuscula(str[i])) {
            resultado += separador;
        }
        resultado += str[i].toLocaleLowerCase();
    }
    return resultado;
}

const capitalize = (str) => {
    let result = str;
    if (result.length > 0) {
        result = String(result.substr(0, 1)).toLocaleUpperCase();
    }
    if (str.length > 1) {
        result += String(str.substring(1).toLocaleLowerCase());
    }
    return result;
}

module.exports = {
    preguntar,
    buscarFichero,
    buscarCarpeta,
    eliminarDuplicado,
    direccionCarpeta,
    direccionFichero,
    thisAtributos,
    escribirIndex,
    escribirFichero,
    escapeRegExp,
    eliminarSufijo,
    eliminarPrefijo,
    formatearNombre,
    terminaCon,
    comienzaCon,
    capitalize
};