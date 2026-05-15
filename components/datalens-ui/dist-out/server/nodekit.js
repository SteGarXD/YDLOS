"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodekit = void 0;
const path = __importStar(require("path"));
const nodekit_1 = require("@gravity-ui/nodekit");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const schema_1 = require("../shared/schema");
const features_1 = require("./components/features");
const registry_1 = require("./registry");
const gateway_1 = require("./utils/gateway");
const nodekit = new nodekit_1.NodeKit({
    configsPath: path.resolve(__dirname, 'configs'),
});
exports.nodekit = nodekit;
const { appName, appEnv, appInstallation, appDevMode } = nodekit.config;
nodekit.ctx.log('AppConfig details', {
    appName,
    appEnv,
    appInstallation,
    appDevMode,
});
nodekit.config.features = (0, features_1.getFeaturesConfig)(appEnv);
registry_1.registry.setupGateway((0, gateway_1.getGatewayConfig)(nodekit), {
    root: schema_1.schema,
    auth: schema_1.authSchema,
});
