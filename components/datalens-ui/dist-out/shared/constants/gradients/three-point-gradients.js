"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREE_POINT_GRADIENT_PALETTES = exports.THREE_POINT_GRADIENTS = void 0;
const blue_gray_red_1 = __importDefault(require("./three-point/blue-gray-red"));
const blue_yellow_red_1 = __importDefault(require("./three-point/blue-yellow-red"));
const orange_blue_green_1 = __importDefault(require("./three-point/orange-blue-green"));
const orange_gray_blue_1 = __importDefault(require("./three-point/orange-gray-blue"));
const orange_violet_blue_1 = __importDefault(require("./three-point/orange-violet-blue"));
const pink_gray_green_1 = __importDefault(require("./three-point/pink-gray-green"));
const red_orange_green_1 = __importDefault(require("./three-point/red-orange-green"));
const traffic_light_1 = __importDefault(require("./three-point/traffic-light"));
const violet_blue_green_1 = __importDefault(require("./three-point/violet-blue-green"));
const yellow_green_blue_1 = __importDefault(require("./three-point/yellow-green-blue"));
exports.THREE_POINT_GRADIENTS = {
    [blue_gray_red_1.default.id]: blue_gray_red_1.default,
    [blue_yellow_red_1.default.id]: blue_yellow_red_1.default,
    [orange_blue_green_1.default.id]: orange_blue_green_1.default,
    [orange_gray_blue_1.default.id]: orange_gray_blue_1.default,
    [orange_violet_blue_1.default.id]: orange_violet_blue_1.default,
    [pink_gray_green_1.default.id]: pink_gray_green_1.default,
    [red_orange_green_1.default.id]: red_orange_green_1.default,
    [violet_blue_green_1.default.id]: violet_blue_green_1.default,
    [yellow_green_blue_1.default.id]: yellow_green_blue_1.default,
    [traffic_light_1.default.id]: traffic_light_1.default,
};
exports.THREE_POINT_GRADIENT_PALETTES = {
    blueGrayRedGradient: blue_gray_red_1.default,
    blueYellowRedGradient: blue_yellow_red_1.default,
    orangeGrayBlueGradient: orange_gray_blue_1.default,
    orangeBlueGreenGradient: orange_blue_green_1.default,
    orangeVioletBlueGradient: orange_violet_blue_1.default,
    pinkGrayGreenGradient: pink_gray_green_1.default,
    redOrangeGreenGradient: red_orange_green_1.default,
    violetBlueGreenGradient: violet_blue_green_1.default,
    yellowGreenBlueGradient: yellow_green_blue_1.default,
    trafficLightGradient: traffic_light_1.default,
};
