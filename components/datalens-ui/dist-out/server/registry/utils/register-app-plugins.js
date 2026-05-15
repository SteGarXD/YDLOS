"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAppPlugins = void 0;
const register_1 = require("../units/common/register");
const registerAppPlugins = () => {
    (0, register_1.registerCommonPlugins)();
};
exports.registerAppPlugins = registerAppPlugins;
