const fs = require("fs");
const inquirer = require("inquirer");
inquirer.registerPrompt('search-list', require('inquirer-search-list'));
const chalk = require("chalk");
const ruta = require("path");
const util = require("util");
const pathBase = process.cwd();
const finder = require("findit")(ruta.normalize(pathBase + "/src/"));
const exec = util.promisify(require("child_process").exec);

let dirFiles = [];
let dirFolders = [];
finder.on("file", function (file) {
    dirFiles.push(file);
});
finder.on("directory", function (dir) {
    dirFolders.push(dir);
});
const modulos = () => {
    let listaM = [];
    dirFolders.forEach((dir) => {
        listaM.push(dir.substring(dir.indexOf('src')).split(ruta.sep)[1]);
    });
    return eliminarDuplicado(listaM).filter((dir) => dir !== '');
}
const entidades = () => {
    let listaE = [];
    dirFiles.forEach((file) => {
        let tmp=file.substring(file.indexOf('entity'),file.indexOf('.entity'));
        if(tmp.includes('entity')){
            listaE.push(tmp.split(ruta.sep)[1]);
        }

    });
    return listaE;
}
const entidadesR = () => {
    let listaE = [];
    dirFiles.forEach((file) => {
        let tmp=file.substring(file.indexOf('entity'),file.indexOf('.entity'));
        if(tmp.includes('entity')){
            listaE.push(quitarSeparador(tmp.split(ruta.sep)[1],'-')+'Entity');
        }

    });
    return listaE;
}
const esquemas = () => {
    let listaE = [];
   let dirFile=direccionFichero('schema.enum.ts');
    let fichero = fs.readFileSync(dirFile, 'utf8');
    let contenido=fichero.substring(fichero.indexOf('{')+1,fichero.indexOf('}')-1).split(',');
    listaE=contenido.map((esquema)=>{
        esquema=esquema.trim();
        return esquema.substring(0,esquema.indexOf(' '));
    }).filter((esq) => esq !== '');;
    return listaE;
}
const preguntar = async (questions) => {
    let output = [];
    let answers;
    do {
        answers = await inquirer.prompt(questions);
        if (!encuentra(output, answers, 'nombreAtributo')) {
            output.push(answers);
        } else {
            console.log(chalk.bold.red("\nEl atributo ya existe."));
            answers.askAgain = true;
        }
    } while (answers.askAgain);
    return output;
};
const encuentra = (array, elem, field) => {
    return array.some((item) => item[field] === elem[field]);
};
const removeFromArr = (arr, item) => {
    return arr.filter(e => e !== item);
}
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

const direccionClassBusquedaInterna = (nombre) => {
    for (let dirFile of dirFiles) {
        let fichero = fs.readFileSync(dirFile, 'utf8');
        if (fichero.indexOf(`class ${nombre}`) !== -1) {
            return dirFile;
        }
    }
    return -1;
}
const busquedaInterna = (dir, nombre) => {
    let fichero = fs.readFileSync(dir, 'utf8');
    return fichero.indexOf(nombre) !== -1;


}
const eliminarDuplicado = (array) => {
    let arreglado = [];
    if (array.length !== 0) {
        array.forEach((element) => {
            arreglado.push(element.trim());
        });
        return arreglado.filter((item, index) => {
            return arreglado.indexOf(item) === index;
        });
    }
    return array;
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
const escapeRegExp = (string) => {
    return new RegExp(string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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
    if (str.indexOf('_') !== -1) {
        separador = '_';
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

const quitarSeparador = (str, separador) => {
    if (str.length === 0) {
        return "";
    }
    if (str.indexOf('_') !== -1) {
        separador = '_';
    }
    let resultado = str.split(separador).map(item => aInicialMayuscula(item));
    return resultado.join('');
}

const capitalize = (str) => {
    let result = str;
    if (result.length > 0) {
        result = result.substr(0, 1).toLocaleUpperCase();
    }
    if (str.length > 1) {
        result += str.substring(1).toLocaleLowerCase();
    }
    return result;
}

const aInicialMayuscula = (str) => {
    let result = str;
    if (result.length > 0) {
        result = result.substr(0, 1).toLocaleUpperCase();
    }
    if (str.length > 1) {
        result += str.substring(1);
    }
    return result;
}

const aInicialMinuscula = (str) => {
    let result = str;
    if (result.length > 0) {
        result = result.substr(0, 1).toLocaleLowerCase();
    }
    if (str.length > 1) {
        result += str.substring(1);
    }
    return result;
}

function generarColumna(answer) {
    var anulable;
    if (answer.nulo) {
        anulable = ", nullable: true";
    } else {
        anulable = ", nullable: false";
    }
    var repetido;
    if (answer.unico) {
        repetido = ", unique: true";
    } else {
        repetido = ", unique: false";
    }
    let nombre = `, name: '${formatearNombre(answer.nombreAtributo, '_')}'`;

    var resultado;
    switch (answer.tipoDato) {
        case "Date":
            resultado = `@Column({ type: 'timestamptz'${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}: Date;`;
            break;
        case "number":
            if (answer.integer) {
                resultado = `@Column({ type: 'integer'${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}: number;`;
            } else {
                resultado = `@Column({ type: 'double precision'${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}: number;`;
            }
            break;
        case "boolean":
            resultado = `@Column({type: 'boolean', default: true${nombre}})\n${answer.nombreAtributo}: boolean;`;
            break;
        case "string":
            if (answer.length > 0) {
                resultado = `@Column({type: 'varchar', length: ${answer.length}${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}: string;`;
            } else {
                resultado = `@Column({ type: 'text'${repetido}${anulable}${nombre}} )\n${answer.nombreAtributo}: string;`;
            }
            break;
        case "Timestamp":
            resultado = `@Column({type:'timetz'${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}:Timestamp;`;
            break;
        case "Geometry":
            resultado = `@Column({type:'geometry'${repetido}${anulable}${nombre}})\n${answer.nombreAtributo}:Geometry;`;
            break;
    }
    return resultado;
}


const transformar = (objetivo, patronAReconocer, patronAAplicar) => {
    // Es ua variable si comienza con % y no tiene espacios.
    function esUnaVariable(expr) {
        if (!expr) {
            return false;
        }

        apa = String(expr);
        if ((apa.length < 2)) {
            return false;
        }
        if (apa.charAt(0) !== '%') {
            return false;
        }
        return apa.charAt(1) !== ' ';

    }

    // verdadero si el cáracter es un número.
    function esNumerico(expr) {
        return !isNaN(parseInt(expr, 10));
    }

    // verdadero si el cáracter es una de esas letras.
    function esAlfabetico(expr) {
        alphaCheck = /^[a-zA-Z_áéíóúüÁÉÍÓÚÜñÑ]+$/g;
        return alphaCheck.test(expr);
    }

    // verdadero si el cáracter es una letra o un número.
    function esAlfanumerico(expr) {
        return esNumerico(expr) || esAlfabetico(expr);
    }

    // Descompone la expresión expr en un arreglo con las partes variables y literales por separado.
    function parsearEnPartes(expr) { // fixed
        expr = String(expr);

        resultado = [];
        tmp = '';
        itIsVariable = false;
        expr = String(expr);
        for (i = 0; i < expr.length; i++) {
            if (expr.charAt(i) === '%') {
                if (tmp !== '') {
                    resultado.push(String(tmp));
                    tmp = ''
                }
                if (!itIsVariable) { // no lo era?
                    itIsVariable = true;
                }
            } else if (!esAlfanumerico(expr.charAt(i))) {
                if (itIsVariable) {
                    resultado.push(String(tmp));
                    tmp = '';
                    itIsVariable = false;
                }
            }
            tmp = tmp + expr.charAt(i);
        }
        resultado.push(String(tmp));
        return resultado;
    }

    function getVar(cadenaPrincipal, nombreDeVariable, arregloDelAPtronAReconocer) {
        for (i = 0; i < arregloDelAPtronAReconocer.length; i++) {
            if (nombreDeVariable === arregloDelAPtronAReconocer[i].cadena) {
                return String(cadenaPrincipal).substring(
                    arregloDelAPtronAReconocer[i].inicio,
                    arregloDelAPtronAReconocer[i].fin + 1
                );
            }
        }
        return "";
    }

    // Se necesita como un objeto, no como una cadena.
    obj = String(objetivo);

    // Se inicializa el arreglo (listado) de los resultados.
    resultado = objetivo;

    if (obj === "" || patronAReconocer === "") {
        // El objetivo está vacío.
        return resultados;
    }

    par = parsearEnPartes(patronAReconocer);
    paa = parsearEnPartes(patronAAplicar);

    // Si hay algín literal de patrón a reconocer que no esté el objetivo, te vas clarito
    baseBusqueda = 0;
    for (j = 0; j < par.length; j++) {
        baseBusqueda = obj.indexOf(par[j], baseBusqueda);
        if (baseBusqueda === -1 && !esUnaVariable(par[j])) {
            return objetivo;
        }
    }

    // Solamente para fines de validación, si el primer elemento del paa es un literal
    // y no está en la posición 0 del objetivo, se va igual...
    if (!esUnaVariable(par[0]) && obj.indexOf(par[0], 0) !== 0) {
        return objetivo;
    }

    // De igual forma, si el último...
    if (
        !esUnaVariable(par[par.length - 1]) &&
        obj.indexOf(
            par[par.length - 1],
            obj.length - par[par.length - 1].length
        ) !==
        obj.length - par[par.length - 1].length
    ) {
        return objetivo;
    }

    if (par.length === 0 || par.length === 0) {
        return resultado;
    } else if (par.length === 1 && esUnaVariable(patronAReconocer)) {
        resultado = reemplazarCadena(patronAAplicar, patronAReconocer, obj);
        return resultado;
    } else if (paa.length === 1 && !esUnaVariable(patronAAplicar)) {
        resultado = patronAAplicar;
        return resultado;
    }

    toTheLeft = 0;
    toTheRight = par.length - 1;
    llastPost = 0;
    parL = new Array(par.length); // Guarda las posiciones de los literales dentro del objetivo...
    for (j = 0; j < par.length; j++) {
        if (!esUnaVariable(par[j])) {
            a = obj.indexOf(par[j], obj, llastPost);
            llastPost = a;
            parL[j] = {cadena: par[j], inicio: a, fin: a + par[j].length - 1};
        } else {
            parL[j] = {cadena: par[j], inicio: -1, fin: -1};
        }
    }

    // encadenar los principios
    for (i = 1; i < parL.length; i++) {
        if (parL[i].inicio <= 0) {
            parL[i].inicio = parL[i - 1].fin + 1;
        }
    }

    // encadenar los finales
    for (i = 0; i < parL.length - 1; i++) {
        if (parL[i].fin <= 0) {
            parL[i].fin = parL[i + 1].inicio - 1;
        }
    }

    // no se te debe olvidar que el primer elemento comienza en cero y el último en la longitud
    parL[0].inicio = 0;
    parL[parL.length - 1].fin = obj.length - 1;

    // armar el resultado, a partir de nada.
    resultado = "";
    for (j = 0; j < paa.length; j++) {
        if (esUnaVariable(paa[j])) {
            // console.log("getvar me da " + getVar(obj, paa[i], parL));
            resultado += getVar(obj, paa[j], parL);
        } else {
            resultado += paa[j];
        }
    }

    return resultado;
}

const formatearArchivos = async () => {
    await exec(`npm run format`);
};

// Para el parser, ending, donde termina (Sintax validator)
// Función para que, en una cadena, dada una posición., si esta es un
// carácter de separador de comillas: ', ` o ", encuentre su par correspondiente., al igual que de abrir un
// paréntesis (, corchete [ o llave {, me devuelva la posición dónde se cierra. Lleva un tratamiento especial,
// pues debe desactivarse en cadenas internas y comentarios de bloque, también debe tener presente comentarios de una línea.
// -1 si no lo encuentra, o hay un error de formación.
const ending = (cadena, posicion) =>  {
    // Si es una línea de comentarios debe devolver la posición de la siguiente línea.
    if (posicion >= cadena.length) {
        return -1;
    }
    // pares
    var pares = [{start: "(", end: ")"},
        {start: "{", end: "}"},
        {start: "/*", end: "*/"}];
    if (cadena.substr(posicion, 2) === "//") { // Line comment, until CR or EOF
        var endComment = cadena.indexOf("\n", posicion + 2);
        if (endComment === -1) {
            return cadena.length - 1; // y se devuelve hasta el retorno del carro.
        }
        return endComment;
    } else if (cadena.substr(posicion, 2) === "/*") { // Block comment, always until */, or error
        var endComment = cadena.indexOf("*/", posicion + 2);
        return endComment; // sino, completo.
    }
    // De otro modo
    switch (cadena[posicion]) {
        case "'": { // simples
            posicion = cadena.indexOf("'", posicion + 1);
            break;
        }
        case "`": { // francesas
            posicion = cadena.indexOf("`", posicion + 1);
            break;
        }
        case '"': { // dobles
            posicion = cadena.indexOf('"', posicion + 1);
            break;
        }
        default: {
            for (var i = 0; i < pares.length; i++) {
                if (cadena.substr(posicion, pares[i].start.length) === pares[i].start) {
                    posicion = posicion + pares[i].start.length; // reubica el puntero
                    while ((posicion !== -1) && (posicion < cadena.length)) {
                        if (cadena.substr(posicion, pares[i].end.length) === pares[i].end) {
                            return posicion + pares[i].end.length - 1;
                        }
                        posicion = ending(cadena, posicion);
                        if (posicion >= cadena.length) {
                            break;
                        }
                    }
                }
            }
        }
    }
    if (posicion === -1 || posicion >= cadena.length) {
        return -1;
    }
    return posicion + 1;
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
    capitalize,
    aInicialMayuscula,
    aInicialMinuscula,
    generarColumna,
    transformar,
    direccionClassBusquedaInterna,
    right,
    formatearArchivos,
    quitarSeparador,
    busquedaInterna,
    findElemento,
    removeFromArr,
    modulos,
    entidades,
    entidadesR,
    esquemas,
    ending
};