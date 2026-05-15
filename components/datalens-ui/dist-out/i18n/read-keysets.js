"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readKeysets = readKeysets;
const fs_1 = __importDefault(require("fs"));
function readKeysets(destination) {
    const files = fs_1.default.readdirSync(destination);
    return files.reduce((acc, filename) => {
        const match = filename.match(/(\.(\d|\w)+)?\.js$/); // trying to find {hash}?.js
        if (!match) {
            return acc;
        }
        acc[filename.slice(0, match.index)] = {
            filename,
        };
        return acc;
    }, {});
}
