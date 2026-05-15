"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREE_POINT_DEFAULT_GRADIENT = exports.THREE_POINT_DEFAULT_ID = exports.TWO_POINT_DEFAULT_GRADIENT = exports.TWO_POINT_DEFAULT_ID = void 0;
const red_orange_green_1 = __importDefault(require("./three-point/red-orange-green"));
const blue_1 = __importDefault(require("./two-point/blue"));
exports.TWO_POINT_DEFAULT_ID = blue_1.default.id;
exports.TWO_POINT_DEFAULT_GRADIENT = { [exports.TWO_POINT_DEFAULT_ID]: blue_1.default };
exports.THREE_POINT_DEFAULT_ID = red_orange_green_1.default.id;
exports.THREE_POINT_DEFAULT_GRADIENT = { [exports.THREE_POINT_DEFAULT_ID]: red_orange_green_1.default };
