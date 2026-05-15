"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectorFormItemQa = void 0;
const getConnectorFormItemQa = ({ id, name }) => {
    return `conn-${id}-${name}`;
};
exports.getConnectorFormItemQa = getConnectorFormItemQa;
