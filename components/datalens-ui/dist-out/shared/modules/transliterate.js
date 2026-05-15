"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transliterate = transliterate;
const dict = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sh',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ё: 'yo',
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
function mapWords(char) {
    return hasOwnProperty.call(dict, char) ? dict[char] : char;
}
function transliterate(str) {
    return str.toLowerCase().split('').map(mapWords).join('');
}
