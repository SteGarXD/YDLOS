"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJSFileName = getJSFileName;
exports.clearFiles = clearFiles;
exports.umdTemplate = umdTemplate;
exports.listKeysetDirNames = listKeysetDirNames;
exports.loadJson = loadJson;
exports.getKeysets = getKeysets;
exports.prepareKeysetData = prepareKeysetData;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
function getContentHash(content) {
    const hash = crypto_1.default.createHash('md5');
    hash.update(content);
    return hash.digest('hex');
}
function getJSFileName(name, fileContent) {
    const hash = `.${getContentHash(fileContent).slice(0, 8)}`;
    return `${name}${hash}.js`;
}
async function clearFiles(destPath) {
    await fs_1.default.promises.rm(destPath, { recursive: true, force: true });
    await fs_1.default.promises.mkdir(destPath, { recursive: true });
}
function umdTemplate(content, globalVar) {
    return `
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.${globalVar} = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
    return ${content};
}));
`.trim();
}
async function listKeysetDirNames(keysetsDir) {
    const result = [];
    const directories = await fs_1.default.promises.readdir(keysetsDir, { withFileTypes: true });
    for (const dir of directories) {
        if (!dir.isDirectory() || dir.name.startsWith('.')) {
            continue;
        }
        result.push(dir.name);
    }
    return result;
}
async function loadJson(dirname, filename) {
    const fullname = path_1.default.resolve(dirname, filename);
    const content = await fs_1.default.promises.readFile(fullname, {
        encoding: 'utf-8',
    });
    try {
        return JSON.parse(content);
    }
    catch (error) {
        throw new Error('Failed to load json file');
    }
}
async function getKeysets(keysetsDir) {
    const keysets = constants_1.KEYSET_LANGUAGES.reduce((acc, lang) => {
        acc[lang] = {};
        return acc;
    }, {});
    for (const keysetDirName of await listKeysetDirNames(keysetsDir)) {
        const keysetDir = path_1.default.resolve(keysetsDir, keysetDirName);
        const keysetDirFiles = await fs_1.default.promises.readdir(keysetDir, { withFileTypes: true });
        for (const file of keysetDirFiles) {
            if (!file.isFile()) {
                continue;
            }
            for (const lang of constants_1.KEYSET_LANGUAGES) {
                if (`${lang}.json` === file.name) {
                    const content = await loadJson(keysetDir, file.name);
                    keysets[lang][keysetDirName] = {
                        content,
                    };
                }
            }
        }
    }
    return keysets;
}
function prepareKeysetData({ lang, keysets, typeFileName, }) {
    const keyset = {};
    const langKeysets = keysets[lang];
    Object.keys(langKeysets).forEach((key) => {
        keyset[key] = langKeysets[key].content;
    });
    const result = [
        {
            filename: lang,
            keyset,
        },
    ];
    if (typeFileName) {
        const typeFileContent = {};
        Object.keys(keyset).forEach((keysetName) => {
            typeFileContent[keysetName] = Object.keys(keyset[keysetName]).reduce((acc, key) => {
                acc[key] = 'str';
                return acc;
            }, {});
        });
        result.push({
            filename: typeFileName,
            keyset: typeFileContent,
        });
    }
    return result;
}
