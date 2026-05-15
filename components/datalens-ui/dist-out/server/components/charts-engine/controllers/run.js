"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runController = void 0;
const querystring_1 = __importDefault(require("querystring"));
const url_1 = __importDefault(require("url"));
const get_1 = __importDefault(require("lodash/get"));
const shared_1 = require("../../../../shared");
const types_1 = require("../../../../shared/types");
const utils_1 = require("../components/utils");
const utils_2 = require("../components/utils");
const utils_3 = require("./utils");
const us_1 = __importDefault(require("../../sdk/us"));
const runController = (chartsEngine, extraSettings) => {
    // eslint-disable-next-line complexity
    return async function chartsRunController(req, res) {
        const { ctx } = req;
        // We need it because of timeout error after 120 seconds
        // https://forum.nginx.org/read.php?2,214230,214239#msg-214239
        req.socket.setTimeout(0);
        const hrStart = process.hrtime();
        const { id, workbookId, expectedType = null, config: chartConfig } = req.body;
        let { key, params } = req.body;
        if (!id && !key) {
            key = req.body.path || (params && params.name);
        }
        if (!id && !key && !chartConfig) {
            ctx.log('CHARTS_ENGINE_NO_KEY_NO_ID_NO_CONFIG');
            res.status(400).send({
                error: 'You must provide at least one of: id, key, config (if supported)',
            });
            return;
        }
        let config;
        if (chartConfig) {
            config = {
                ...chartConfig,
            };
        }
        else {
            if (!params && key) {
                const parsedUrl = url_1.default.parse(key);
                if (parsedUrl.query) {
                    if (!req.body.params) {
                        req.body.params = {};
                    }
                    req.body.params = params = {
                        ...req.body.params,
                        ...querystring_1.default.parse(parsedUrl.query),
                    };
                }
            }
            // YDL OS: нормализация параметров для MSSQL (интервал → одна дата YYYY-MM-DD, массив → строка через запятую)
            if (req.body.params && typeof req.body.params === 'object') {
                req.body.params = (0, utils_2.normalizeDatasetParamsForMssql)(req.body.params);
                params = req.body.params;
            }
            config = await (0, utils_3.resolveChartConfig)({
                subrequestHeaders: res.locals.subrequestHeaders,
                request: req,
                params,
                id,
                key,
                workbookId,
                extraSettings,
            });
        }
        if ('error' in config) {
            const status = (0, get_1.default)(config, 'error.details.code', 500);
            res.status(status).send(config);
            return;
        }
        try {
            const configResolving = (0, utils_1.getDuration)(hrStart);
            const configType = config && config.meta && config.meta.stype;
            ctx.log('CHARTS_ENGINE_CONFIG_TYPE', { configType });
            if (expectedType && expectedType !== configType) {
                ctx.log('CHARTS_ENGINE_CONFIG_TYPE_MISMATCH');
                res.status(400).send({
                    error: `Config type "${configType}" does not match expected type "${expectedType}"`,
                });
                return;
            }
            const runnerFound = chartsEngine.runners.find((runner) => {
                return runner.trigger.has(configType);
            });
            if (!runnerFound) {
                ctx.log('CHARTS_ENGINE_UNKNOWN_CONFIG_TYPE', { configType });
                res.status(400).send({
                    error: `Unknown config type ${configType}`,
                });
                return;
            }
            if (req.body.config) {
                if (!ctx.config.allowBodyConfig && !runnerFound.safeConfig) {
                    ctx.log('UNSAFE_CONFIG_OVERRIDE');
                    res.status(400).send({
                        error: `It is forbidden to pass config in body for "${configType}"`,
                    });
                    return;
                }
                const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
                if (isEnabledServerFeature(shared_1.Feature.ShouldCheckEditorAccess) &&
                    runnerFound.name === 'editor') {
                    const { checkRequestForDeveloperModeAccess } = ctx.get('gateway');
                    const checkResult = await checkRequestForDeveloperModeAccess({
                        ctx,
                    });
                    if (checkResult === types_1.DeveloperModeCheckStatus.Forbidden) {
                        res.status(403).send({
                            error: {
                                code: 403,
                                details: {
                                    message: 'Access to Editor developer mode was denied',
                                },
                            },
                        });
                        return;
                    }
                }
            }
            if (req.body.config) {
                res.locals.editMode = true;
            }
            req.body.config = config;
            req.body.key = req.body.key || config.key;
            var currentUser = await us_1.default.universalService({
                "action": "datalens",
                "method": "currentUser",
                "data": [{}]
            }, req.headers, req.ctx);
            if (!currentUser.err) {
                var _params = req.body.params;
                for (var i in _params) {
                    if (i.startsWith('__')) {
                        delete req.body.params[i];
                    }
                }
                // подставляем идентификатор текущего пользователя
                req.body.params['__user_id'] = currentUser.data[0].id;
                // подставляем признак "внедрения"
                req.body.params['__embed'] = currentUser.data[0].isEmbed == true ? 1 : -1;
            }
            await runnerFound.handler(ctx, {
                chartsEngine,
                req,
                res,
                config: {
                    ...config,
                    data: {
                        ...config.data,
                        url: (0, get_1.default)(config.data, 'sources') || (0, get_1.default)(config.data, 'url'),
                        js: (0, get_1.default)(config.data, 'prepare') || (0, get_1.default)(config.data, 'js'),
                        ui: (0, get_1.default)(config.data, 'controls') || (0, get_1.default)(config.data, 'ui'),
                    },
                },
                configResolving,
                workbookId,
            });
        }
        catch (error) {
            ctx.logError('CHARTS_ENGINE_RUNNER_ERROR', error);
            res.status(500).send({
                error: 'Internal error',
            });
        }
    };
};
exports.runController = runController;
