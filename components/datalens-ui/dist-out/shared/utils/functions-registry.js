"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFunctionsRegistry = void 0;
const __1 = require("../");
const createFunctionsRegistry = function (functionsMap) {
    const map = {};
    const internalRegister = (id, fn) => {
        map[id] = fn;
    };
    const registry = {
        register(registerMap) {
            Object.entries(registerMap).forEach(([id, fn]) => {
                internalRegister(id, fn);
            });
        },
        get(id) {
            const fn = map[id];
            if (!fn) {
                throw new Error(`Function with ${String(id)} does not exist`);
            }
            return fn;
        },
        getAll() {
            return map;
        },
    };
    (0, __1.objectKeys)(functionsMap).forEach((id) => {
        internalRegister(id, functionsMap[id]);
    });
    return registry;
};
exports.createFunctionsRegistry = createFunctionsRegistry;
