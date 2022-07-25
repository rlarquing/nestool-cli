const { descompilarScript} = require("./util");
const LineReaderSync = require("line-reader-sync");
const parse = (dir) => {
    const lrs = new LineReaderSync(dir);
    let lineas = lrs.toLines();
    return descompilarScript(lineas.join(''));
}
module.exports = {parse}
