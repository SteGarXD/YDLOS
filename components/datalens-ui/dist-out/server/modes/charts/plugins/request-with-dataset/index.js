"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurableRequestWithDatasetPlugin = void 0;
const middleware_urls_1 = require("../constants/middleware-urls");
const charts_with_dataset_1 = __importDefault(require("./middlewareAdapters/charts-with-dataset"));
const controls_with_dataset_1 = __importDefault(require("./middlewareAdapters/controls-with-dataset"));
const getPlugin = (options) => {
    return {
        request_with_dataset: {
            description: {
                title: {
                    ru: 'DataLens запрос с Датасетом',
                    en: 'DataLens request with Dataset',
                },
            },
            middlewareAdapter: async (args) => {
                const middlewarePluginUrl = args.source.middlewareUrl.middlewareType;
                switch (middlewarePluginUrl) {
                    case middleware_urls_1.CHARTS_MIDDLEWARE_URL_TYPE:
                        return (0, charts_with_dataset_1.default)({ ...args, pluginOptions: options });
                    case middleware_urls_1.CONTROL_MIDDLEWARE_URL_TYPE:
                        return (0, controls_with_dataset_1.default)({ ...args, pluginOptions: options });
                    default:
                        return args.source;
                }
            },
        },
    };
};
const configurableRequestWithDatasetPlugin = (options) => {
    return { sources: getPlugin(options) };
};
exports.configurableRequestWithDatasetPlugin = configurableRequestWithDatasetPlugin;
