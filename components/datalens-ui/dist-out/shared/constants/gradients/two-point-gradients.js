"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWO_POINT_GRADIENT_PALETTES = exports.TWO_POINT_GRADIENTS = void 0;
const blue_1 = __importDefault(require("./two-point/blue"));
const cyan_1 = __importDefault(require("./two-point/cyan"));
const golden_1 = __importDefault(require("./two-point/golden"));
const gray_1 = __importDefault(require("./two-point/gray"));
const green_1 = __importDefault(require("./two-point/green"));
const green_blue_1 = __importDefault(require("./two-point/green-blue"));
const oceanic_1 = __importDefault(require("./two-point/oceanic"));
const orange_yellow_1 = __importDefault(require("./two-point/orange-yellow"));
const red_1 = __importDefault(require("./two-point/red"));
const red_blue_1 = __importDefault(require("./two-point/red-blue"));
const violet_1 = __importDefault(require("./two-point/violet"));
const violet_orange_1 = __importDefault(require("./two-point/violet-orange"));
const yellow_1 = __importDefault(require("./two-point/yellow"));
exports.TWO_POINT_GRADIENTS = {
    [red_1.default.id]: red_1.default,
    [green_1.default.id]: green_1.default,
    [blue_1.default.id]: blue_1.default,
    [violet_1.default.id]: violet_1.default,
    [yellow_1.default.id]: yellow_1.default,
    [cyan_1.default.id]: cyan_1.default,
    [gray_1.default.id]: gray_1.default,
    [golden_1.default.id]: golden_1.default,
    [oceanic_1.default.id]: oceanic_1.default,
    [violet_orange_1.default.id]: violet_orange_1.default,
    [orange_yellow_1.default.id]: orange_yellow_1.default,
    [red_blue_1.default.id]: red_blue_1.default,
    [green_blue_1.default.id]: green_blue_1.default,
};
exports.TWO_POINT_GRADIENT_PALETTES = {
    redGradient: red_1.default,
    grayGradient: gray_1.default,
    blueGradient: blue_1.default,
    cyanGradient: cyan_1.default,
    violetGradient: violet_1.default,
    yellowGradient: yellow_1.default,
    violetOrangeGradient: violet_orange_1.default,
    orangeYellowGradient: orange_yellow_1.default,
    redBlueGradient: red_blue_1.default,
    greenGradient: green_1.default,
    greenBlueGradient: green_blue_1.default,
    goldenGradient: golden_1.default,
    oceanicGradient: oceanic_1.default,
};
