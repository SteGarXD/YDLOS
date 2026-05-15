"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypedApi = exports.simpleSchema = void 0;
const gateway_1 = require("@gravity-ui/gateway");
const auth_1 = __importDefault(require("./auth"));
const bi_1 = __importDefault(require("./bi"));
const bi_converter_1 = __importDefault(require("./bi-converter"));
const extensions_1 = __importDefault(require("./extensions"));
const meta_manager_1 = __importDefault(require("./meta-manager"));
const us_1 = __importDefault(require("./us"));
const us_private_1 = __importDefault(require("./us-private"));
// Scheme for all local requests except mix
exports.simpleSchema = {
    us: us_1.default,
    usPrivate: us_private_1.default,
    bi: bi_1.default,
    biConverter: bi_converter_1.default,
    extensions: extensions_1.default,
    auth: auth_1.default,
    metaManager: meta_manager_1.default,
};
exports.getTypedApi = (0, gateway_1.getTypedApiFactory)();
