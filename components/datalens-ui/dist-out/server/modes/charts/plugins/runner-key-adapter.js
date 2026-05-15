"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const url_1 = __importDefault(require("url"));
const types_1 = require("../../../components/charts-engine/types");
const registry_1 = require("../../../registry");
exports.plugin = {
    middlewares: [
        {
            stage: types_1.MiddlewareStage.AfterAuth,
            fn: (req, _res, next) => {
                if (req.url === '/api/run') {
                    const { body } = req;
                    if (body) {
                        const key = body.key || body.path;
                        if (key) {
                            /*
                        /editor/<name>?<params>
                        /wizard/<name>?<params>
                        /preview/editor/<name>?<params>
                        /preview/wizard/<name>?<params>
                        /ChartPreview/editor/<name>?<params>
                        /ChartPreview/wizard/<name>?<params>
                        /preview/ChartEditor?name=<name>&<params>
                        /preview/ChartWizard?name=<name>&<params>
                        /ChartPreview/ChartEditor?name=<name>&<params>
                        /ChartPreview/ChartWizard?name=<name>&<params>
                        */
                            const parsedKey = url_1.default.parse(key, true);
                            const keyWithoutQueryParams = key.split('?')[0];
                            const pathname = keyWithoutQueryParams.replace(/\/?(?:ChartPreview|preview)/, '');
                            const params = Object.assign({}, parsedKey.query, req.body.params);
                            if (pathname.startsWith('/editor') ||
                                pathname.startsWith('editor') ||
                                pathname.startsWith('/wizard') ||
                                pathname.startsWith('wizard')) {
                                params.name = keyWithoutQueryParams
                                    .replace(/^\/?editor\//, '')
                                    .replace(/^\/?wizard\//, '');
                            }
                            const isEntryId = registry_1.registry.common.functions.get('isEntryId');
                            if (isEntryId(params.name)) {
                                // If params.name looks like id - use it as id.
                                body.id = params.name;
                                body.unreleased = false; // request publised version by default
                            }
                            else if (!body.key) {
                                body.key = params.name;
                            }
                            body.params = params;
                        }
                    }
                }
                next();
            },
        },
    ],
};
