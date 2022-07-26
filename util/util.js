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
const entidades = () => {
    let listaE = [];
    dirFiles.forEach((file) => {
        let tmp = file.substring(file.indexOf('entity'), file.indexOf('.entity'));
        if (tmp.includes('entity')) {
            listaE.push(tmp.split(ruta.sep)[1]);
        }

    });
    return listaE;
}
const entidadesR = () => {
    let listaE = [];
    dirFiles.forEach((file) => {
        let tmp = file.substring(file.indexOf('entity'), file.indexOf('.entity'));
        if (tmp.includes('entity')) {
            listaE.push(quitarSeparador(tmp.split(ruta.sep)[1], '-') + 'Entity');
        }

    });
    return listaE;
}
const esquemas = () => {
    let listaE = [];
    let dirFile = direccionFichero('schema.enum.ts');
    let fichero = fs.readFileSync(dirFile, 'utf8');
    let contenido = fichero.substring(fichero.indexOf('{') + 1, fichero.indexOf('}') - 1).split(',');
    listaE = contenido.map((esquema) => {
        esquema = esquema.trim();
        return esquema.substring(0, esquema.indexOf(' '));
    }).filter((esq) => esq !== '');
    ;
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
        resultados.push(`this.${param.split('?')[0]} = ${param.split('?')[0]};`);
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
    return str.substring(0, l);
}
const right = (str, l) => {
    return str.substring(str.length - l);
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
const formatearNombreEliminarSufijo = (nombre, tipo, separador) => {
    return formatearNombre(eliminarSufijo(nombre, tipo), separador);
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

const formatearArchivos = async () => {
    await exec(`npm run format`);
};

function transformar(objetivo, patronAReconocer, patronAAplicar) {
    // Es ua variable si comienza con % y no tiene espacios.
    function esUnaVariable(expr) {
        if (!expr) {
            return false;
        }

        let apa = String(expr);
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
        let alphaCheck = /^[a-zA-Z_áéíóúüÁÉÍÓÚÜñÑ]+$/g;
        return alphaCheck.test(expr);
    }

    // verdadero si el cáracter es una letra o un número.
    function esAlfanumerico(expr) {
        return esNumerico(expr) || esAlfabetico(expr);
    }

    // Descompone la expresión expr en un arreglo con las partes variables y literales por separado.
    function parsearEnPartes(expr) { // fixed
        expr = String(expr);

        var resultado = [];
        var tmp = "";
        var itIsVariable = false;
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
                return String(cadenaPrincipal).substring(arregloDelAPtronAReconocer[i].inicio, arregloDelAPtronAReconocer[i].fin + 1);
            }
        }
        return "";
    }

    // Se necesita como un objeto, no como una cadena.
    obj = String(objetivo);

    // Se inicializa el arreglo (listado) de los resultados.
    let resultado = objetivo;

    if (obj === "" || patronAReconocer === "") {
        // El objetivo está vacío.
        return resultados;
    }

    let par = parsearEnPartes(patronAReconocer);
    let paa = parsearEnPartes(patronAAplicar);

    // Si hay algín literal de patrón a reconocer que no esté el objetivo, te vas clarito
    let baseBusqueda = 0;
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
    if (!esUnaVariable(par[par.length - 1]) && obj.indexOf(par[par.length - 1], obj.length - par[par.length - 1].length) !== obj.length - par[par.length - 1].length) {
        return objetivo;
    }

    if (par.length === 0 || par.length === 0) {
        return resultado;
    } else if (par.length === 1 && esUnaVariable(patronAReconocer)) {
        let resultado = reemplazarCadena(patronAAplicar, patronAReconocer, obj);
        return resultado;
    } else if (paa.length === 1 && !esUnaVariable(patronAAplicar)) {
        let resultado = patronAAplicar;
        return resultado;
    }

    let toTheLeft = 0;
    let toTheRight = par.length - 1;
    let llastPost = 0;
    let parL = new Array(par.length); // Guarda las posiciones de los literales dentro del objetivo...
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

// verdadero si el cáracter es en un dígito.
const isNumericAt = (str, position) => {
    if (str.length < position + 1) return false;
    return String("0123456789").indexOf(str.substr(position, 1)) !== -1;
}

// verdadero si el cáracter es una de esas letras.
const isAlphabeticAt = (str, position) => {
    if (str.length < position + 1) return false;
    return String("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZA@_áéíóúüÁÉÍÓÚÜñÑ?").indexOf(str.substr(position, 1)) !== -1;
}

// verdadero si el cáracter es una letra o un número.
const isAlphanumericAt = (str, position) => {
    return isNumericAt(str, position) || isAlphabeticAt(str, position);
}

// verdadero si el cáracter es igual al argumento...
const isEqualAt = (str, chr, position) => {
    if (str.length < position + 1) return false;
    return (str.substring(position, 1) === chr);
}

// verdadero si el cáracter es un underscore...
function isUnderscore(str, position) {
    return isEqualAt(str, "_", position);
}

const descompilarScript = (str) => {

    // Sintactical analizer (nexto to where the operator in position ends).
    function sintaxCheck(cadena, posicion) {
        // Si es una línea de comentarios debe devolver la posición de la siguiente línea.
        if (posicion === -1 || posicion >= cadena.length) {
            return false;
        }
        // pares
        var pares = [{start: "(", end: ")"},
            {start: "{", end: "}"},
            {start: "[", end: "]"}];
        if (cadena.substr(posicion, 2) === "//") { // Line comment, until CR or EOF
            var endComment = cadena.indexOf("\n", posicion + 2);
            if (endComment === -1) {
                return cadena.length + 1; // y se devuelve hasta el retorno del carro.
            }
            return endComment + 1;
        } else if (cadena.substr(posicion, 2) === "/*") { // Block comment, always until */, or error
            var endComment = cadena.indexOf("*/", posicion);
            posicion = endComment + 2; // sino, completo.
        } else {
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
                                    return posicion + pares[i].end.length;
                                }
                                posicion = sintaxCheck(cadena, posicion);
                                if (posicion >= cadena.length) {
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (posicion === -1 || posicion >= cadena.length) {
            // here just try to find where comienzaCon some of them...
            return -1;
        }
        return posicion + 1;
    }

    // TOKEN COMMENT
    // Verfica que la primera sentencia de la cadena es un comentario correcto., TESTED 13:54|21/04/2022
    function esComentario(line) {
        return left(line.trim(), 2) === "//" || ((left(line.trim(), 2) === "/*") && sintaxCheck(line, line.indexOf("//") + 2));
    }

    // Extraer comentario en la variable por referencia comentario y devolver el resto... ok
    function extraerComentario(line, comentario) {
        comentario = "";
        var myLine = "";
        myLine = line.trim();
        var posicionComentario = sintaxCheck(myLine, 0);
        comentario = myLine.substring(0, posicionComentario);
        line = myLine.substr(posicionComentario);
        return {type: "comment", content: comentario.trim(), remainder: line};
    }

    // TOKEN STRING

    // Verfica que la primera instancia de cadena esté bien formada y devuelve su posición final., TESTED 13:54|21/04/2022
    function esCadena(line) {
        var posicion;
        for (let index = 0; index < 3; index++) {
            const stringSeparator = ["'", "`", '"'][index];
            if (left(line.trim(), 1) === stringSeparator) {
                posicion = line.indexOf(stringSeparator, line.indexOf(stringSeparator) + 1);
                if (posicion !== -1) {
                    return posicion; // eureka
                }
            }
        }
        return false;
    }

    // Extraer una cadena en la variable por referencia comentario y devolver el resto... ok
    function extraerCadena(line) {
        var isIt = esCadena(line);
        return {
            type: "string literal",
            content: line.substr(0, isIt + 1),
            remainder: line.substr(isIt + 1)
        };
    }

    // TOKEN PARENTHESIS

    // Verfica que el primer elemento sea un paréntesis y que esté correctamente  cerrado
    function esParenthesis(line) {
        return left(line.trim(), 1) === "(" && sintaxCheck(line, line.indexOf("(") !== -1);
    }

    // Extraer comentario en la variable por referencia comentario y devolver el resto... ok
    function extraerParenthesis(line) {
        line = String(line);
        var abreEn = line.indexOf("(");
        var cierraEn = sintaxCheck(line, abreEn);
        var cont = descompilarScript(line.substring(abreEn + 1, cierraEn - 1));
        var resto = line.substring(cierraEn);
        return {type: "parenthesis", content: cont, remainder: resto};
    }

    // TOKEN IDENTIFIER

    // Determinar si es un identificador
    function esIdentificador(line) {
        if ((!line) || (line.length === 0) || isNumericAt(line, 0)) {
            return false;
        }
        var posicion = 0;
        while ((posicion < line.length - 1) && isAlphanumericAt(line, posicion)) {
            posicion++;
        }
        return posicion;
    }

    function extraerIdentificador(line) {
        if (!line || line.length === 0 || isNumericAt(line, 0)) {
            return false;
        }
        var posicion = esIdentificador(line);
        var name = line.substr(0, posicion);
        line = line.substring(posicion);
        return {type: "identifier", content: name, remainder: line.trim()};
    }

    // TOKEN NUMBER

    // Determinar si es un identificador
    function esNumero(line) {
        if ((!line) || (line.length === 0) || !isNumericAt(line, 0)) {
            return false;
        }
        var posicion = 0;
        while (posicion < line.length - 1 && isNumericAt(line, posicion)) {
            posicion++;
        }
        return posicion;
    }

    function extraerNumero(line) {
        var posicion = esNumero(line);
        var value = line.substr(0, posicion);
        line = line.substring(posicion);
        return {type: "number", content: value, remainder: line.trim()};
    }

    // TOKEN FUNCTION (usar este mismo modelo para el while cuando código...)

    function esFuncion(line) {
        // Determinar si es una función
        line = line.trim();
        if (comienzaCon(line, "function")) {
            var firstParBeg = line.indexOf("(");
            if (firstParBeg === -1) return false;
            var firstParEnd = sintaxCheck(line, line.indexOf("("));
            if (firstParEnd === -1) return false;
            var corpusBeg = line.indexOf("{");
            if (corpusBeg === -1 || corpusBeg < firstParEnd) return false;
            var corpusEnd = sintaxCheck(line, line.indexOf("{"));
            return true;
        }
        return false;
    }

    function extraerFuncion(line) {

        var firstParBeg = line.indexOf("(");
        var firstParEnd = sintaxCheck(line, line.indexOf("("));
        var corpusBeg = line.indexOf("{");
        if (corpusBeg < firstParEnd) return false;
        var corpusEnd = sintaxCheck(line, corpusBeg);

        var resultado = {};
        resultado.type = "function";
        resultado.name = line.substring(String("function").length, line.firstParBeg - 1).trim();
        resultado.parameters = line.substring(firstParBeg + 1, firstParEnd).split(",").filter((x) => x.trim() !== "");
        resultado.content = line.substring(corpusBeg + 1, corpusEnd)
        resultado.remainder = line.substring(corpusEnd + 1);

        return resultado;
    }

    // TOKEN CLASS DECLARATION

    // export class FormulaEntity extends GenericEntity implements fulano {
    // ok tested
    function obtenerProximoIdentificador(cadena) {
        if (!cadena) {
            return "";
        }
        var tmp = String(cadena).trim();
        if ((tmp.length === 0) || isNumericAt(tmp, 0)) {
            return "";
        }
        var posicion = 1;
        var result = "";
        while ((posicion < tmp.length) && isAlphanumericAt(tmp, posicion)) {
            posicion++;
        }
        if (esIdentificador(tmp)) {
            result = tmp.substring(0, posicion).trim();
        }
        return result;

    }

    // recortar por la izquierda a la cadena, con tantos caracteres como aparezcan el caracteres... ok tested
    function recortarPorlaIzquierda(cadena, caracteres) {
        if (!cadena || cadena.length === 0 || caracteres > cadena.length) {
            return "";
        }
        return String(cadena).substring(caracteres);
    }

    function esDeclaracionDeClase(line) {
        var next, tmp = line.trim();
        var lista = [];
        var result = {name: next, exported: false, extends: null, implements: []};

        // Parseo rápido de identificadores por espacio antes del primer símbolo
        next = obtenerProximoIdentificador(tmp);
        tmp = recortarPorlaIzquierda(tmp, next.length).trim();
        while (next !== "" && tmp.trim().length !== 0) {
            lista.push(next);
            next = obtenerProximoIdentificador(tmp);
            tmp = recortarPorlaIzquierda(tmp, next.length).trim();
        }
        var declaraClase = false;
        var identificadorDesconocido = false;
        for (let index = 0; index < lista.length - 1; index++) {
            const element = lista[index];
            switch (element) {
                case "export":
                case "extends":
                case "implements": {
                    break;
                }
                case "class": {
                    declaraClase = true;
                    break;
                }
            }
        }
        if (!esBloque(tmp)) return false;
        return declaraClase && esBloque(tmp) !== -1 ? true : false;
    }

    function extraerDeclaracionDeClase(line) {
        var next, tmp = line.trim();
        var lista = [];
        var result = {name: next, type: "class", exported: false, extends: null, implements: []};

        // Parseo rápido de identificadores por espacio antes del primer símbolo
        next = obtenerProximoIdentificador(tmp);
        tmp = recortarPorlaIzquierda(tmp, next.length).trim();
        while (next !== "" && tmp.trim().length !== 0) {
            lista.push(next);
            next = obtenerProximoIdentificador(tmp);
            tmp = recortarPorlaIzquierda(tmp, next.length).trim();
        }
        for (let index = 0; index < lista.length - 1; index++) {
            const element = lista[index];
            switch (element) {
                case "export": {
                    result.exported = true;
                    break;
                }
                case "class": {
                    result.name = lista[index + 1];
                    break;
                }
                case "extends": {
                    result.extends = lista[index + 1];
                    break;
                }
                case "implements": {
                    result.implements.push(lista[index + 1]);
                    break;
                }
            }
        }
        result.content = descompilarScript(tmp);
        if (result.content.length > 0 && result.content[0].type === "block") {
            result.body = result.content[0].body;
            delete result.content;
        }
        result.remainder = line.substring(1 + sintaxCheck(line, line.indexOf("{")));

        // se agregan los atributos al objeto clase
        var attributes = [];
        var downC = 0;
        let tipoRelacion = "";
        let nulabilidad = false;
        let nullable = false;
        while (downC < result.body.length - 3) {
            if (result.body[downC].type === "decorator" && result.body[downC].content === "@Column") {
                let bloques = result.body[downC + 1].content;
                for (let i = 0; i < bloques.length; i++) {
                    if(bloques[i].body.some(item => item.content === 'nullable')){
                        let pos = bloques[i].body.findIndex(item => item.content === 'nullable');
                        nulabilidad = (pos !== -1);
                        if (nulabilidad) {
                            nullable = bloques[i].body[pos + 2].content;
                        }
                    }
                }
            }

            if (result.body[downC].type === "decorator" && (result.body[downC].content === "@OneToOne" || result.body[downC].content === "@ManyToOne" || result.body[downC].content === "@ManyToMany" || result.body[downC].content === "@OneToMany")) {
                tipoRelacion = result.body[downC].content;
                let bloques = result.body[downC + 1].content;
                for (let i = 0; i < bloques.length; i++) {
                    if (bloques[i].type === 'block' && bloques[i].body.some(item => item.content === 'nullable')) {
                        let pos = bloques[i].body.findIndex(item => item.content === 'nullable');
                        nulabilidad = (pos !== -1);
                        if (nulabilidad) {
                            nullable = bloques[i].body[pos + 2].content;
                        }
                    }
                }
            }
            if (result.body[downC].type === "identifier" && result.body[downC + 1].type === "symbol" && result.body[downC + 2].type === "identifier") {
                let objeto = {
                    type: "attribute",
                    name: result.body[downC].content,
                    kind: result.body[downC + 2].content
                };
                if (tipoRelacion !== "") {
                    objeto.relation = tipoRelacion;
                    tipoRelacion = "";
                }
                if (nulabilidad) {
                    objeto.nullable = nullable;
                }
                nulabilidad=false;
                attributes.push(objeto);
                downC = downC + 3;
            } else {
                downC++;
            }
        }
        result.attributes = attributes;

        // Recorrer el body buscando un token de type "identifier", seguidos de "parenthesis"
        // Cuando lo encuentre, eso es un método... hasta el token de tipo "block"

        return result;
    }

    // TOKEN CLASS CONSTRUCTOR (que puede estar y a su vez no es un CLASS DECARATION)

    function esConstructorDeClase(line) {
        // Determinar si es una función
        line = line.trim();
        if (comienzaCon(line, "constructor")) {
            var firstParBeg = line.indexOf("(");
            if (firstParBeg === false) return false;
            var firstParEnd = sintaxCheck(line, line.indexOf("("));
            if (firstParEnd === false) return false;
            var corpusBeg = line.indexOf("{");
            if (corpusBeg === false || corpusBeg < firstParEnd) return false;
            var corpusEnd = sintaxCheck(line, line.indexOf("{"));
            if (corpusEnd === false) return false;
            return true;
        }
        return false;
    }

    function extraerConstructorDeClase(line) {

        var firstParBeg = line.indexOf("(");
        var firstParEnd = sintaxCheck(line, line.indexOf("("));
        var corpusBeg = line.indexOf("{");
        if (corpusBeg < firstParEnd) return false;
        var corpusEnd = sintaxCheck(line, corpusBeg);

        var resultado = {};
        resultado.type = "constructor";
        // pueden aparecer parámetros en blanco...
        resultado.parameters = line.substring(firstParBeg + 1, firstParEnd - 1).split(",").filter((x) => x.trim() !== "");
        resultado.content = descompilarScript(line.substring(corpusBeg + 1, corpusEnd - 1));
        resultado.remainder = line.substring(corpusEnd + 1);

        for (var index = 0; index < resultado.parameters.length; index++) {
            const element = resultado.parameters[index];
            if (element.indexOf(":") !== -1) {
                // if the perameter is in typescript, pascal, format? Refactorize
                resultado.parameters[index] = {
                    "name": element.substring(0, element.indexOf(":")).trim(),
                    "type": element.substring(element.indexOf(":") + 1).trim()
                };
            } else {
                resultado.parameters[index] = {"name": element.trim(), "type": null}; // as it was in javascript, now and forever.
            }
        }

        return resultado;
    }

    // TOKEN RESERVED WORD

    function esPalabraReservada(line) {
        // Determinar si es una palabra reservada
        const palabrasReservadas = ["abstract", "boolean", "break", "byte", "case", "catch",
            "class", "const", "do", "for", "function", "if", "let",
            "return", "var", "while", "char", "continue", "default",
            "do", "double", "else", "extends", "false", "final", "finally",
            "float", "for", "implements", "import", "int",
            "interface", "long", "native", "new", "null", "package", "private",
            "protected", "public", "short", "static", "super", "switch", "syncronized", "this",
            "throw", "throws", "transient", "true", "try", "void", "volatile", "rest", "byvalue",
            "cast", "const", "future", "generic", "goto", "inner", "operator", "outer", "experimental"];
        var savedLine = line.trim();
        for (var i = 0; i < palabrasReservadas.length; i++) {
            if (left(savedLine, String(palabrasReservadas[i]).length) === palabrasReservadas[i]) {
                return true;
            }
        }
        return false;
    }

    function extraerPalabraReservada(line) {
        var resultado;
        resultado = extraerIdentificador(line);
        resultado.type = "reserved word";
        return resultado;
    }

    // TOKEN IMPORT

    // Extraer la importación en la variable por referencia comentario y devolver el resto... ok
    function esImportacion(line) {
        return comienzaCon(line.trim(), "import"); // fix
    }

    // Extraer la importación en la variable por referencia comentario y devolver el resto... ok
    // recueda que puede darse el caso de: import * from '.'; import identificador1 from '.';
    function extraerImportaciones(line) {
        var importaciones = [];
        var myLine = "";
        myLine = line.trim();
        if (esImportacion(line)) {
            myLine = line.substring(0, line.indexOf(";"));
            if (!myLine) {
                throw new Error('La importación no está bien formada o falta el símbolo de ;.')
            }
            var imStr = transformar(myLine, "import %a from %b", "%a");

            if (esBloque(imStr)) {
                imStr = imStr.substring(1, imStr.length - 1).trim();
            }

            var pathStr = transformar(myLine, "import %a from %b", "%b");
        }
        line = line.substring(line.indexOf(";") + 1);
        var resultado = {};
        resultado.type = "import";
        resultado.modules = imStr;
        resultado.path = pathStr;
        resultado.remainder = line.trim();
        return resultado;
    }

    // DECORATOR IMPORT here

    // Determinar si es un identificador
    function esDecorador(line) {
        if ((!line) || (line.length === 0) || isNumericAt(line.trim(), 0)) {
            return false;
        }
        line = line.trim();
        var posicion = 0;
        return isEqualAt(line, "@", 0) && isAlphanumericAt(line, 1);
    }

    // Extraer la importación en la variable por referencia comentario y devolver el resto... ok
    function extraerDecorador(line) {
        var resultado;
        if (esIdentificador(line)) {
            resultado = extraerIdentificador(line);
        }
        if (resultado) {
            resultado.type = "decorator";
        }
        return resultado;
    }

    // Es un bloque, verificar si es un bloque...

    // Determinar si es un identificador
    function esBloque(line) {
        if ((!line) || (line.length === 0)) {
            return false;
        }
        line = line.trim();
        return (left(line, 1) === "{" && sintaxCheck(line, 0) !== -1);
    }

    // Extraer la importación en la variable por referencia comentario y devolver el resto... ok
    function extraerBloque(line) {
        var resultado;
        line = line.trim();
        if (esBloque(line)) {
            var posicionFinBloque = sintaxCheck(line, 0);
            var contenido = line.substring(1, posicionFinBloque - 1);
            line = line.substring(posicionFinBloque + 1);
            resultado = {
                type: "block",
                body: descompilarScript(contenido),
                remainder: line.substring(sintaxCheck(line, line.indexOf("{")) + 1)
            };
        }
        return resultado;
    }

    // TOKEN OPERATOR

    function esOperador(line) {
        // Determinar si es un operador
        const operadores = ["instanceof", "typeof", ">>>=", ">>>", ">>=", "<>=", "===", "!==", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "^=", "&=", "!=", "|=", "&", "|", "^", "", "<", ">", "-", "!", "~", "+", "-", "*", "/", "%", ";", ",", "=>"];
        var savedLine = line.trim();
        for (var i = 0; i < operadores.length; i++) {
            if (left(savedLine, operadores[i].length) === operadores[i]) {
                return operadores[i];
            }
        }
        return false;
    }

    function extraerOperador(line) {
        var sysOp = esOperador(line);
        var resultado = {};
        resultado.type = "operator";
        resultado.content = sysOp;
        line = line.substring(sysOp.length);
        resultado.remainder = line;
        return resultado;
    }

    // TOKEN SYMBOL

    function esSimbolo(line) {
        // Determinar si es un operador
        const simbolos = [";", ".", "@", "#", "$", "%", "^", "&", "*", "~", ":", "{", "}", "=", "[", "]", ",", ">", "<"];
        var savedLine = line.trim();
        for (var i = 0; i < simbolos.length; i++) {
            if (left(savedLine, String(simbolos[i]).length) === simbolos[i]) {
                return simbolos[i];
            }
        }
        return false;
    }

    function extraerSimbolo(line) {
        var sysOp = esSimbolo(line);
        var resultado = {};
        resultado.type = "symbol";
        resultado.content = sysOp;
        line = line.substring(sysOp.length);
        resultado.remainder = line.trim();
        return resultado;
    }

    //main
    if (!str || str === "") return {};
    str = String(str).trim();
    // Primero
    let datos = [];
    // Se procesa al entidad completa...
    var decorators = [];
    str = str.trim();
    while (str && str !== "") {
        // alert(JSON.stringify(datos)); // keep for debug purposes...
        // eliminar espacios
        if (esBloque(str)) {
            datos.push(extraerBloque(str));
        } else if (esOperador(str)) {
            datos.push(extraerOperador(str));
        } else if (esComentario(str)) {
            datos.push(extraerComentario(str));
        } else if (esImportacion(str)) {
            datos.push(extraerImportaciones(str));
        } else if (esDecorador(str)) {
            datos.push(extraerDecorador(str));
        } else if (esSimbolo(str)) {
            datos.push(extraerSimbolo(str));
        } else if (esFuncion(str)) {
            datos.push(extraerFuncion(str));
        } else if (esConstructorDeClase(str)) {
            datos.push(extraerConstructorDeClase(str));
        } else if (esDeclaracionDeClase(str)) {
            datos.push(extraerDeclaracionDeClase(str));
            // } else if (esPalabraReservada(str)) {
            //    datos.push(extraerPalabraReservada(str));
        } else if (esIdentificador(str)) {
            datos.push(extraerIdentificador(str));
        } else if (esCadena(str)) {
            datos.push(extraerCadena(str));
        } else if (esNumero(str)) {
            datos.push(extraerNumero(str));
        } else if (esParenthesis(str)) {
            datos.push(extraerParenthesis(str));
        } else datos.push({type: "Unknown token", content: str, remainder: ""});
        // faltan por procesar constantes numéricas, booleanas y de cadena
        // además de asociarle a los decoradores, el siguiente identificador si existe.
        // asociarle los paréntesis y los corchetes al identificador anterior.,
        // en los casos donde sea posible, parsear el contenido en profundidad.

        str = String(datos[datos.length - 1].remainder).trim();

    }
    // Los decoradores deberían meterse en una lista de decoradores y no agregarse a la lista de datos, aunque sí deberían reducir str por el remainder.
    // Se deben agregar al próximo elemento si no es de paréntesis, o corchetes...
    // En caso de que termine el ciclo entonces, si quedaron quedaron decoradores sin asignar, es decir, sin otros objetos asociados...
    // allí sí se agregan 1 x 1 y no de golpe.
    // Los paréntesis siempre se agregan al elemento anterior, en la propiedad de tipo lista: parenthesis si no existe ninguno, se ponen de primeros... su contenido también puede que se parsee en profundidad.
    // Los elementos que se encuentran dentro de los corchetes, también deberían parsearse en profundidad., si son complejos.
    // Al igual que las directivas y prefijos de alcance, experimental, public, private, export., son condiciones lógicas., que se asocian al próximo elemento.

    // Eliminar los remainders temporales, luego resolver utilizando nua variable global...
    var lineCounter = 0;
    while (lineCounter < datos.length) {
        delete datos[lineCounter].remainder;
        lineCounter++;
    }

    return datos;
}

// Revisar el elemento 20 subíndice 13... el objeto 3 reconoce una llava de cierre como objeto símbolo independiente... recortar ok.
// para el lunes... comentar la linea de delete remainders y ver en cual recorte falla ...

const compileScript = (parsing) => {
    var lineCounter = 0;
    var token;
    var resultado = "";
    while (lineCounter < parsing.length) {
        token = parsing[lineCounter];
        lineCounter++;
        switch (token.type) {
            case "symbol": {
                resultado += token.content;
                break;
            }
            case "comment": {
                resultado += token.content + "\n";
                break;
            }
            case "decorator": {
                resultado += token.content;
                break;
            }
            case "parenthesis": {
                resultado += `(${compileScript(token.content)})\n`;
                break;
            }
            case "import": {
                resultado += `import {${token.modules}} from ${token.path};\n`;
                break;
            }
            case "class": {
                if (token.exported) {
                    resultado += `export class ${token.name} `;
                } else {
                    resultado += `class ${token.name} `;
                }
                if (token.extends) {
                    resultado += `extends ${token.extends} `;
                }
                if (token.implements.length > 0) {
                    resultado += `implements ${token.implements.join(",")}`;
                }
                resultado += " {\n"; // fix, provisional, el bloque no debería decompilar con llave de cierre.
                resultado += compileScript(token.body);
                resultado += "\n}";
                break;
            }
            case "block": {
                resultado += `{${compileScript(token.body)}}`;
                break;
            }
            case "constructor": {
                var parametros = [];
                token.parameters.forEach(element => {
                    parametros.push(`${element.name}${element.type ? ':' + element.type : ''}`);
                });
                resultado += `constructor (${parametros.join(", ")}) {${compileScript(token.content)}}`;
                break;
            }

            default: {
                // alert(JSON.stringify(token));
                resultado += token.content + " ";
                break;
            }

        }
        // alert(JSON.stringify(resultado));
    }
    return resultado;
}

// inyectar una referencia de importación de un módulo con sus respectivo camino
const inyectarImportaciones = (parsing, moduleName, modulePath) => {
    let encontrado = parsing.find((element) => element.path === modulePath);
    if (encontrado) {
        encontrado.modules += `,${moduleName}`;
        return parsing;
    } else {
        parsing.unshift({type: "import", modules: String(moduleName), path: String(modulePath)});
    }
    return parsing;
}

// inyectar referencias de importación aun conjuntos de nombres de módulos con sus respectivos caminos
const inyectarAtributos = (parsing, atributo) => {
    const clase = parsing.find((item) => item.type === "class");
    const body = clase.body;
    const pc = body.findIndex((element) => element.type === "constructor");
    const decompilacion = descompilarScript(atributo);

    if (pc !== -1) {
        for (let index = 0; index < decompilacion.length; index++) {
            const element = decompilacion[index];
            body.splice(pc + index, 0, element);
        }

    } else {
        let pb = body.findIndex(e => e.type === "block");
        while (pb > 0 && !(body[pb].type === "symbol" && body[pb].content === ";")) pb--;
        if (pb === -1) {
            return parsing.concat(decompilacion);
        } else {
            for (let index = 0; index < decompilacion.length; index++) {
                const element = decompilacion[index];
                body.splice(pb + 1 + index, 0, element);
            }
        }

    }
    return parsing;
}

// un arreaglo así: [{name: "nombre", type: "string"}, {name: "edad", type: "Number"}, {name: "sexo", type: "boolean"}]
const inyectarParametrosEnConstructor = (parsing, parametros) => {
    const clase = parsing.find((item) => item.type === "class");
    const body = clase.body;
    const pc = body.find((element) => element.type === "constructor");
    pc.parameters = pc.parameters.concat(parametros);
    parametros.forEach((par) => {
        pc.content.push({type: "identifier", content: "this"});
        pc.content.push({type: "symbol", content: "."});
        pc.content.push({type: "identifier", content: par.name});
        pc.content.push({type: "symbol", content: "="});
        pc.content.push({type: "identifier", content: par.name});
        pc.content.push({type: "symbol", content: ";"});
    })
    return parsing;
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
    direccionClassBusquedaInterna,
    right,
    formatearArchivos,
    quitarSeparador,
    busquedaInterna,
    findElemento,
    removeFromArr,
    entidades,
    entidadesR,
    esquemas,
    transformar,
    descompilarScript,
    compileScript,
    inyectarImportaciones,
    inyectarAtributos,
    inyectarParametrosEnConstructor,
    formatearNombreEliminarSufijo,
};
