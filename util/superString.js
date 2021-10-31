/** Clase de cadena extendida superString, para el parseo, se incorporan algunas funciones para llevar la productividad a RAD
 *
 * @authors I+D GEOCUBA
 * @mail luisguillermobultetibles@gmail.com
 *
 * */
class superString extends String {
    constructor(s) {
        super(s);
    }

    /*
            get object() {
                return JSON.parse(this.value);
            }

            set object(object) {
                this.value = JSON.stringify(object);
            }

            to implement above don't know how to reasign the internal value of an String, without destructing it...

    */

    // replanteo
    relativeCut(p, l) {
        // Me devuelve una subcadena de c con longitud l a partir de p...
        return super.substr(p, l);
    }

    absoluteCut(d, h) {
        return super.substring(d, h);
    }

    // Estas funciones me cortan una subcadenas de desde la izquierda o desde la derecha
    left(l) {
        return this.relativeCut(0, l);
    }

    right(l) {
        return this.relativeCut(this.length - l, l);
    }

    eliminarSufijo(s) {
        if (this.right(s.length) === s) {
            return this.left(this.length - s.length);
        } else {
            return this;
        }
    }

    eliminarPrefijo(s) {
        if (this.left(s.length) === s) {
            return this.right(this.length - s.length);
        } else {
            return this;
        }
    }

    esMayuscula(position) {
        return this[position] === this[position].toLocaleUpperCase();
    }

    recortarMayusculas(separador) {
        let resultado = this[0].toLocaleLowerCase();
        for (let i = 1; i < this.length; i++) {
            if (this.esMayuscula(i)) {
                resultado += separador;
            }
            resultado += this[i].toLocaleLowerCase();
        }
        return resultado;
    }

    _sameLetter(a, b) {
        return (String(a).toLocaleLowerCase() === String(b).toLocaleLowerCase());
    }

    // Me devuelve un arreglo con todas las posiciones donde aparece la subcadena...
    ocurrencies(subString, allowOverlapping) {
        let resultado = [];
        let string = String(this);
        subString = String(subString);

        string += "";
        subString += "";
        if (subString.length <= 0) return string.length + 1;

        let pos = 0,
            step = allowOverlapping ? 1 : subString.length;

        while (true) {
            pos = string.indexOf(subString, pos);
            if (pos >= 0) {
                resultado.push(pos);
                pos += step;
            } else break;
        }
        return resultado;
    }

    // qué lugar ocupa la enésima (sí base 1) de esa subcadena
    ocurrency(n, substring, allowOverlapping) {
        let resultado = -1;
        let posicion = this.ocurrencies(substring, allowOverlapping);
        if (posicion.length === 0) {
            return -1;
        }
        n--;
        if (n < posicion.length) {
            resultado = posicion[n];
        }
        return resultado;
    }

    // Esta función me dice si un texto comienza con uno o alguno de los prefijos (no trimea)
    beginsWith(prefijo) {
        // one recoursive check for array incoming arguments. luis
        if (prefijo instanceof Array) {
            for (let iTer1 = 0; iTer1 < prefijo.length; iTer1++) {
                if (this.beginsWith(this, prefijo[iTer1])) {
                    return true;
                }
            }
        }
        let tmpPrefix = String(prefijo);
        if (this.length < tmpPrefix.length) {
            return false;
        }
        return this.left(tmpPrefix.length) === tmpPrefix;
    }

    endsWith(sufijo) {
        // one recoursive check for array incoming arguments. luis
        if (sufijo instanceof Array) {
            for (let iTer1 = 0; iTer1 < sufijo.length; iTer1++) {
                if (this.endsWith(this, sufijo[iTer1])) {
                    return true;
                }
            }
        }
        let tmpSufix = String(sufijo);
        if (this.length < tmpSufix.length) {
            return false;
        }
        return this.slice(-tmpSufix.length) === tmpSufix;
    }

    // Devuelve el remplazo de la enésima aparición de searchString por replaceString en mainStr.
    replaceStringOcurrency(searchString, replaceString, ocurrency = 1, allowOverlapping = false) {

        searchString = String(searchString);

        let resultado = String(this);
        if (this.indexOf(String(this), searchString) === -1) {
            return resultado;
        }

        let head = this.ocurrencyPrefix(searchString, ocurrency, allowOverlapping); // this.console(true, head);
        let tail = this.ocurrencyPostfix(searchString, ocurrency, allowOverlapping); // this.console(true, tail);

        resultado = head + replaceString + tail;

        return String(resultado);
    }

    // Esta función me dice si un texto contiene uno o alguno de los prefijos (no trimea)
    contains(subStrings) {
        if (subStrings instanceof String) {
            return (this.indexOf(String(this), subStrings) !== -1);
        } else if (subStrings instanceof Array) {
            for (let iExploring = 0; iExploring < subStrings.length; iExploring++) {
                if (this.contains(subStrings[iExploring])) {
                    return true;
                }
            }
        }
        return false;
    }

    // Lo que aparece justo antes de esa aparición de la subcadena en el texto
    ocurrencyPrefix(subString, ocurrency, allowOverlapping) {
        if (!allowOverlapping) {
            allowOverlapping = false;
        }
        let posicion = this.ocurrency(ocurrency, subString, allowOverlapping);
        return this.absoluteCut(0, posicion);
    }

    // Lo que aparece justo después de esa aparición de la subcadena en el texto
    ocurrencyPostfix(subString, ocurrency, allowOverlapping) {
        if (!allowOverlapping) {
            allowOverlapping = false;
        }
        let posicion = this.ocurrency(ocurrency, subString, allowOverlapping);
        return this.absoluteCut(posicion + subString.length, this.length);
    }

    // Inicial mayúsculas
    capitalize() {
        let resultado = String(this);
        if (resultado.length > 0) {
            resultado = String(resultado.substr(0, 1)).toLocaleUpperCase();
        }
        if (this.length > 1) {
            resultado += String(this.substring(1).toLocaleLowerCase());
        }
        return resultado;
    }

    // a minúsculas
    tolower() {
        return super.toLocaleLowerCase();
    }

    // a mayúsculas
    toUpper() {
        return super.toLocaleUpperCase();
    }

    caracterDeCodigo(code) {
        // Devuelve un caracter a partir del de código utilizado c...
        return String.fromCharCode(code);
    }

    characterAt(position) {
        return super.charAt(position);
    }

    get firstCharacter() {
        return super.charAt(0);
    }

    get lastCharacter() {
        return super.charAt(super.length - 1);
    }

    unicodeAt(position) {
        // Devuelve el código utilizado a partir del caracter... 10 -> Enter, visualiza \n
        return super.charCodeAt(position);
    }

    unicodeChar(lC) {
        // Devuelve un caracter que se corresponde con ese código...
        return String.fromCharCode(lC);
    }

    arrayOfUnicode() {
        let resultado = [];
        for (let position = 0; position < this.length; position++) {
            resultado.push(this.unicodeAt(position));
        }
        return resultado;
    }

    lastIndexof(subString, startingPos) {
        // Me devuelve la última posición de s dentro de c... la posicion inicial es opcional
        if (!startingPos) {
            return super.lastIndexOf(subString);
        } else {
            return super.lastIndexOf(subString, startingPos);
        }
    }

    // verdadero si el cáracter es un número.
    isNumericAt(position) {
        return !isNaN(parseInt(this.substr(position, 1), 10));
    }

    // verdadero si el cáracter es una de esas letras.
    isAlphabeticAt(position) {
        let alphaCheck = /^[a-zA-Z_áéíóúüÁÉÍÓÚÜñÑ]+$/g;
        return alphaCheck.test(this.substr(position, 1));
    }

    // verdadero si el cáracter es una letra o un número.
    isAlphanumericAt(expr) {
        return this.isNumericAt(expr) || this.isAlphabeticAt(expr);
    }

    isParenthesis(position) {
        return this.substr(position, 1) === "(" || this.substr(position, 1) === ")";
    }

    isSingleQuote(position) {
        return this.substr(position, 1) === "'";
    }

    isDoubleQuote(position) {
        return this.substr(position, 1) === '"';
    }

    isFrenchQuote(position) {
        return this.substr(position, 1) === "`";
    }

    isQuote(position) {
        return this.isSingleQuote(position) || this.isDoubleQuote(position) || this.isFrenchQuote(position);
    }

    isQuoted() {
        return (this.isQuote(this.firstCharacter)) && (this.firstCharacter === this.lastCharacter);
    }

    // Web work...

    // indentar (justificar) todas las líneas a tantos espacios a la derecha
    indent(spaces) {
        // Devuelve un arreglo estúpido con la cosa repetida esa cantidad de veces.
        function repeat(cosa, veces) {
            let arr = [];
            for (let i = 0; i < veces; i++) {
                arr.push(cosa);
            }
            return arr;
        }

        let lines = (this || '').split('\n');
        let newArr = [];
        for (let i = 0; i < lines.length; i++) {
            newArr.push(repeat(' ', spaces).join('') + lines[i]);
        }
        return newArr.join('\n');
    }

    anchor(nombre) {
        return super.anchor(nombre);
    }

    hiperLink(locationOrURL) {
        return super.link(locationOrURL);
    }

    blink() {
        return super.blink();
    }

    big() {
        return super.big();
    }

    bold() {
        return super.bold();
    }

    small() {
        return super.small();
    }

    fixec() {
        return super.fixed();
    }

    strike() {
        return super.strike();
    }

    color(colorValue) {
        return super.fontcolor(colorValue);
    }

    subTitle() {
        return super.sub();
    }

    talla(tallaEnteroDe1a7) {
        return super.fontsize(tallaEnteroDe1a7);
    }

    superTitles() {
        return super.sup();
    }

    italics() {
        return super.italics();
    }

    toTag(tagName) {
        return '<' + tagName + '>' + this + '</' + tagName + '>';
    }

    toScript() {
        return this.toTag('SCRIPT');
    }

    _attribution(name, value) {
        if (value instanceof String) {
            value = superString(value);
            if (!value.isQuoted()) {
                value = '"' + value + '"';
            }
        }
        return `${name}=${value} `;
    }


    integerInput(id, min, max) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'number');
        if (min) {
            result += this._attribution('min', min);
        }
        if (max) {
            result += this._attribution('max', max);
        }
        result += `>`;
        return result;
    }

    dateInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'date');
        result += `>`;
        return result;
    }

    monthInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'month');
        result += `>`;
        return result;
    }

    weekInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'week');
        result += `>`;
        return result;
    }

    timeInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'time');
        result += `>`;
        return result;
    }

    telephoneInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'tel');
        result += `>`;
        return result;
    }

    colorInput(id) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'color');
        result += `>`;
        return result;
    }

    attachmentsInput(label) {
        if (!label) {
            label = "Attachments:";
        }
        return `<label>${label}<input type="file" multiple name="att"></label>`;
    }

    rangeInput(id, min, max, step, value) {
        let result = `<input `;
        if (id) {
            result += this._attribution('name', id);
            result += this._attribution('id', id);
        }
        result += this._attribution('type', 'range');
        if (min) {
            result += this._attribution('min', min);
        }
        if (max) {
            result += this._attribution('max', max);
        }
        if (step) {
            result += this._attribution('step', step);
        }
        if (value) {
            result += this._attribution('value', value);
        }
        result += `>`;
        return result;
    }

    // Depuración

    alert() {
        if (this.quietMode) return;
        let sign = "";
        if (this.substr(this.length - 1) !== '!') {
            sign = "!";
        }
        return confirm(this + sign);
    }

    confirm() {
        if (this.quietMode) return;
        let sign = "";
        if (this.substr(this.length - 1) !== '?') {
            sign = "?";
        }
        return confirm(this + sign);
    }

    prompt(defaultValue) {
        if (this.quietMode) return;
        return prompt(this, defaultValue);
    }

    /* pueden pasársele parámetros opcionales, otros objetos, y tiene un modo que ayuda a
        visualizarlos
        en
        la
        depuración
    */

    console(objective, theObject) {
        if (this.quietMode) return;
        if (!objective) {
            console.log(this);
        } else {
            if (!theObject) {
                console.dir(this);
            } else {
                if (theObject instanceof Array) {
                    console.table(theObject);
                } else if (theObject instanceof Object) {
                    console.log(`Miembros del objeto %o, de tipo: ${theObject.constructor.name}.`, theObject);
                } else {
                    // redirecciona, no era necesario objective, no es un objeto.
                    (new superString(theObject)).console(false);
                }
            }
        }
    }

    // Validado

    clearConsole() {
        if (this.quietMode) return;
        console.clear();
    }

    consoleTimerStart(message) {
        if (this.quietMode) return;
        if (!message) {
            message = this;
        }
        console.time(message);
    }

    consoleTimerEnd(message) {
        if (this.quietMode) return;
        if (!message) {
            message = this;
        }
        console.timeEnd(message);
    }

    consoleError(message) {
        if (this.quietMode) return;
        let failure = [
            "background: red",
            "color: white",
            "display: block",
            "text-align: center",
        ].join(";");
        if (!message) {
            message = this;
        }
        console.error("%c " + message, failure);
    }

    consoleSucess(message) {
        if (this.quietMode) return;
        let sucess = [
            "background: green",
            "color: white",
            "display: block",
            "text-align: center",
        ].join(";");
        if (!message) {
            message = this;
        }
        console.log("%c " + message, sucess);
    }

    /* activar o desactivar el modo de depuración (por defecto), (vs modo productivo: la vuelta a
       RAD
    */
    get debugMode() {
        return this._apiDebugVerboseMode;
    }

    set debugMode(m) {
        this._apiDebugVerboseMode = m;
    }

    /* activar o desactivar el modo productivo, quieto pancho... quieto (nada de mensajes en la
        consola
    */
    get quietMode() {
        return !this.debugMode;
    }

    set quietMode(m) {
        this.debugMode = !m;
    }

    // Comparación de cadenas, útil para el análisis de direcciones, etc...

    // spanish

    /** Syllabler gets a word and outputs and array containing its syllables.
     *  This code belongs to https://github.com/vic/silabas.js
     *
     *    The up´s comment and the code itself was taken from Lorca library by Lic Luis Guillermo Bultet Ibles.
     */
    syllaber() {
        let stressedFound = false;
        let stressed = 0;
        let letterAccent = -1;

        let wordLength = this.length;
        let positions = [];
        let word = this;

        function process() {
            let numSyl = 0;

            // Look for syllables in the word
            for (let i = 0; i < wordLength;) {
                positions[numSyl++] = i;

                i = onset(i);
                i = nucleus(i);
                i = coda(i);

                if (stressedFound && stressed === 0) {
                    stressed = numSyl; // it marks the stressed syllable
                }
            }

            // If the word has not written accent, the stressed syllable is determined
            // according to the stress rules
            if (!stressedFound) {
                if (numSyl < 2) stressed = numSyl;
                // Monosyllables
                else {
                    // Polysyllables
                    let endLetter = toLower(wordLength - 1);

                    if (
                        !isConsonant(wordLength - 1) ||
                        endLetter === "y" ||
                        endLetter === "n" ||
                        (endLetter === "s" && !isConsonant(wordLength - 2))
                    )
                        stressed = numSyl - 1;
                    // Stressed penultimate syllable
                    else stressed = numSyl; // Stressed last syllable
                }
            }
        }

        function onset(pos) {
            let lastConsonant = "a";

            while (pos < wordLength && isConsonant(pos) && toLower(pos) !== "y") {
                lastConsonant = toLower(pos);
                pos++;
            }

            // (q | g) + u (example: queso, gueto)
            if (pos < wordLength - 1) {
                if (toLower(pos) === "u") {
                    if (lastConsonant === "q") {
                        pos++;
                    } else if (lastConsonant === "g") {
                        let letter = toLower(pos + 1);
                        if (
                            letter === "e" ||
                            letter === "é" ||
                            letter === "i" ||
                            letter === "í"
                        ) {
                            pos++;
                        }
                    }
                } else if (toLower(pos) === "ü" && lastConsonant === "g") {
                    // The 'u' with diaeresis is added to the consonant
                    pos++;
                }
            }

            return pos;
        }

        function nucleus(pos) {
            // Saves the type of previous vowel when two vowels together exists
            let previous = 0;
            // 0 = open
            // 1 = close with written accent
            // 2 = close

            if (pos >= wordLength) return pos; // ¡¿Doesn't it have nucleus?!

            // Jumps a letter 'y' to the starting of nucleus, it is as consonant
            if (toLower(pos) === "y") pos++;

            // First vowel
            if (pos < wordLength) {
                switch (toLower(pos)) {
                    // Open-vowel or close-vowel with written accent
                    case "á":
                    case "à":
                    case "é":
                    case "è":
                    case "ó":
                    case "ò":
                        letterAccent = pos;
                        stressedFound = true;
                        break;
                    case "a":
                    case "e":
                    case "o":
                        previous = 0;
                        pos++;
                        break;
                    // Close-vowel with written accent breaks some possible diphthong
                    case "í":
                    case "ì":
                    case "ú":
                    case "ù":
                    case "ü":
                        letterAccent = pos;
                        pos++;
                        stressedFound = true;
                        return pos;
                    // Close-vowel
                    case "i":
                    case "I":
                    case "u":
                    case "U":
                        previous = 2;
                        pos++;
                        break;
                }
            }

            // If 'h' has been inserted in the nucleus then it doesn't determine diphthong neither hiatus
            let aitch = false;
            if (pos < wordLength) {
                if (toLower(pos) === "h") {
                    pos++;
                    aitch = true;
                }
            }

            // Second vowel
            if (pos < wordLength) {
                switch (toLower(pos)) {
                    // Open-vowel with written accent
                    case "á":
                    case "à":
                    case "é":
                    case "è":
                    case "ó":
                    case "ò":
                        letterAccent = pos;
                        if (previous !== 0) {
                            stressedFound = true;
                        }
                        break;
                    case "a":
                    case "e":
                    case "o":
                        if (previous === 0) {
                            // Two open-vowels don't form syllable
                            if (aitch) pos--;
                            return pos;
                        } else {
                            pos++;
                        }

                        break;

                    // Close-vowel with written accent, can't be a triphthong, but would be a diphthong
                    case "í":
                    case "ì":
                    case "ú":
                    case "ù":
                        letterAccent = pos;

                        if (previous !== 0) {
                            // Diphthong
                            stressedFound = true;
                            pos++;
                        } else if (aitch) pos--;

                        return pos;
                    // Close-vowel
                    case "i":
                    case "u":
                    case "ü":
                        if (pos < wordLength - 1) {
                            // ¿Is there a third vowel?
                            if (!isConsonant(pos + 1)) {
                                if (toLower(pos - 1) === "h") pos--;
                                return pos;
                            }
                        }

                        // Two equals close-vowels don't form diphthong
                        if (toLower(pos) !== toLower(pos - 1)) pos++;

                        return pos; // It is a descendent diphthong
                }
            }

            // Third vowel?
            if (pos < wordLength) {
                if (toLower(pos) === "i" || toLower(pos) === "u") {
                    // Close-vowel
                    pos++;
                    return pos; // It is a triphthong
                }
            }

            return pos;
        }

        function coda(pos) {
            if (pos >= wordLength || !isConsonant(pos)) {
                return pos; // Syllable hasn't coda
            } else if (pos === wordLength - 1) {
                // End of word
                pos++;
                return pos;
            }

            // If there is only a consonant between vowels, it belongs to the following syllable
            if (!isConsonant(pos + 1)) return pos;

            let c1 = toLower(pos);
            let c2 = toLower(pos + 1);

            // Has the syllable a third consecutive consonant?
            if (pos < wordLength - 2) {
                let c3 = toLower(pos + 2);

                if (!isConsonant(pos + 2)) {
                    // There isn't third consonant
                    // The groups ll, ch and rr begin a syllable

                    if (c1 === "l" && c2 === "l") return pos;
                    if (c1 === "c" && c2 === "h") return pos;
                    if (c1 === "r" && c2 === "r") return pos;

                    // A consonant + 'h' begins a syllable, except for groups sh and rh
                    if (c1 !== "s" && c1 !== "r" && c2 === "h") return pos;

                    // If the letter 'y' is preceded by the some
                    // letter 's', 'l', 'r', 'n' or 'c' then
                    // a new syllable begins in the previous consonant
                    // else it begins in the letter 'y'
                    if (c2 === "y") {
                        if (c1 === "s" || c1 === "l" || c1 === "r" || c1 === "n" || c1 === "c") {
                            return pos;
                        }
                        pos++;

                        return pos;
                    }

                    // groups: gl - kl - bl - vl - pl - fl - tl
                    if (
                        (c1 === "b" ||
                            c1 === "v" ||
                            c1 === "c" ||
                            c1 === "k" ||
                            c1 === "f" ||
                            c1 === "g" ||
                            c1 === "p" ||
                            c1 === "t") &&
                        c2 === "l"
                    ) {
                        return pos;
                    }

                    // groups: gr - kr - dr - tr - br - vr - pr - fr
                    if (
                        (c1 === "b" ||
                            c1 === "v" ||
                            c1 === "c" ||
                            c1 === "d" ||
                            c1 === "k" ||
                            c1 === "f" ||
                            c1 === "g" ||
                            c1 === "p" ||
                            c1 === "t") &&
                        c2 === "r"
                    ) {
                        return pos;
                    }

                    pos++;

                    return pos;
                } else {
                    // There is a third consonant
                    if (pos + 3 === wordLength) {
                        // Three consonants to the end, foreign words?
                        if (c2 === "y") {
                            // 'y' as vowel
                            if (c1 === "s" || c1 === "l" || c1 === "r" || c1 === "n" || c1 === "c") {
                                return pos;
                            }
                        }

                        if (c3 === "y") {
                            // 'y' at the end as vowel with c2
                            pos++;
                        } else {
                            // Three consonants to the end, foreign words?
                            pos += 3;
                        }
                        return pos;
                    }

                    if (c2 === "y") {
                        // 'y' as vowel
                        if (c1 === "s" || c1 === "l" || c1 === "r" || c1 === "n" || c1 === "c")
                            return pos;

                        pos++;
                        return pos;
                    }

                    // The groups pt, ct, cn, ps, mn, gn, ft, pn, cz, tz and ts begin a syllable
                    // when preceded by other consonant

                    if (
                        (c2 === "p" && c3 === "t") ||
                        (c2 === "c" && c3 === "t") ||
                        (c2 === "c" && c3 === "n") ||
                        (c2 === "p" && c3 === "s") ||
                        (c2 === "m" && c3 === "n") ||
                        (c2 === "g" && c3 === "n") ||
                        (c2 === "f" && c3 === "t") ||
                        (c2 === "p" && c3 === "n") ||
                        (c2 === "c" && c3 === "z") ||
                        (c2 === "t" && c3 === "s") ||
                        (c2 === "t" && c3 === "s")
                    ) {
                        pos++;
                        return pos;
                    }

                    if (
                        c3 === "l" ||
                        c3 === "r" || // The consonantal groups formed by a consonant
                        // following the letter 'l' or 'r' cann't be
                        // separated and they always begin syllable
                        (c2 === "c" && c3 === "h") || // 'ch'
                        c3 === "y"
                    ) {
                        // 'y' as vowel
                        pos++; // Following syllable begins in c2
                    } else pos += 2; // c3 begins the following syllable
                }
            } else {
                if (c2 === "y") return pos;

                pos += 2; // The word ends with two consonants
            }

            return pos;
        }

        function toLower(pos) {
            return word[pos].toLowerCase();
        }

        function isConsonant(pos) {
            return !/[aeiouáéíóúàèìòùüAEIOUÁÉÍÓÚÀÈÌÒÙÜ]/.test(word[pos]);
        }

        process();

        //this.positions = function () {
        //   return positions;
        //};

        let syllables = [];

        for (let i = 0; i < positions.length; i++) {
            let start = positions[i];
            let end = wordLength;
            if (positions.length > i + 1) {
                end = positions[i + 1];
            }
            let seq = word.slice(start, end).replace(/ /, "").toLowerCase();
            syllables.push(seq);
        }

        return syllables;
    }

}

module.exports = superString;