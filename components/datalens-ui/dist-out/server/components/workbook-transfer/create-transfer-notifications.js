"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criticalTransferNotification = exports.warningTransferNotification = exports.infoTransferNotification = exports.createTransferNotification = void 0;
const createTransferNotification = (level, code, details) => ({
    code,
    level,
    ...(details ? { details } : {}),
});
exports.createTransferNotification = createTransferNotification;
const infoTransferNotification = (code, details) => (0, exports.createTransferNotification)('info', code, details);
exports.infoTransferNotification = infoTransferNotification;
const warningTransferNotification = (code, details) => (0, exports.createTransferNotification)('warning', code, details);
exports.warningTransferNotification = warningTransferNotification;
const criticalTransferNotification = (code, details) => (0, exports.createTransferNotification)('critical', code, details);
exports.criticalTransferNotification = criticalTransferNotification;
