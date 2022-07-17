const {comienzaCon, right, aInicialMayuscula, descompilarScript} = require("./util");
const LineReaderSync = require("line-reader-sync");
// y este último ya te construye el a partir de un arreglo original
const parse = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    // ejemplo, primero comienzas un nuevo parseo, despues linea a linea hasta que llegues a la última
    //nuevoParseo();
    // Leer las lineas una a una
    return descompilarScript(lineas.join(''));
}
module.exports = {parse}
