"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = initStorage;
exports.resolveConfig = resolveConfig;
exports.resolveEmbedConfig = resolveEmbedConfig;
exports.initPreloading = initPreloading;
const united_storage_1 = require("./united-storage");
const provider_1 = require("./united-storage/provider");
let storage;
function initStorage(data) {
    storage = new united_storage_1.UnitedStorage(provider_1.USProvider);
    storage.init(data);
}
function resolveConfig(ctx, options) {
    return storage.resolveConfig(ctx, options);
}
function resolveEmbedConfig(ctx, options) {
    return storage.resolveEmbedConfig(ctx, options);
}
function initPreloading(ctx) {
    ctx.log('ChartsEngine: initializing config preloading');
    return storage && storage.initPreloading(ctx, (preloaded) => storage.setPreloaded(preloaded));
}
