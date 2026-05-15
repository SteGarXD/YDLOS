import querystring from 'querystring';
import url from 'url';

import type {Request, Response} from '@gravity-ui/expresskit';
import get from 'lodash/get';

import type {ChartsEngine} from '..';
import {Feature} from '../../../../shared';
import {DeveloperModeCheckStatus} from '../../../../shared/types';
import US from '../../sdk/us';
import type {ResolvedConfig} from '../components/storage/types';
import {getDuration, normalizeDatasetParamsForMssql} from '../components/utils';
import type {ChartStorageType} from '../types';

import {resolveChartConfig} from './utils';

type RunControllerExtraSettings = {
    storageApiPath?: string;
    extraAllowedHeaders?: string[];
    includeServicePlan?: boolean;
    includeTenantFeatures?: boolean;
};

export const runController = (
    chartsEngine: ChartsEngine,
    extraSettings?: RunControllerExtraSettings,
) => {
    // eslint-disable-next-line complexity
    return async function chartsRunController(req: Request, res: Response) {
        const {ctx} = req;

        // We need it because of timeout error after 120 seconds
        // https://forum.nginx.org/read.php?2,214230,214239#msg-214239
        req.socket.setTimeout(0);

        const hrStart = process.hrtime();

        const {id, workbookId, expectedType = null, config: chartConfig} = req.body;

        let {key, params} = req.body;

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

        let config: ResolvedConfig | {error: unknown};
        if (chartConfig) {
            config = {
                ...chartConfig,
            };
        } else {
            if (!params && key) {
                const parsedUrl = url.parse(key);
                if (parsedUrl.query) {
                    if (!req.body.params) {
                        req.body.params = {};
                    }

                    req.body.params = params = {
                        ...req.body.params,
                        ...querystring.parse(parsedUrl.query),
                    };
                }
            }

            // YDL OS: нормализация параметров для MSSQL (интервал → одна дата YYYY-MM-DD, массив → строка через запятую)
            if (req.body.params && typeof req.body.params === 'object') {
                req.body.params = normalizeDatasetParamsForMssql(
                    req.body.params as Record<string, string | string[] | undefined>,
                );
                params = req.body.params;
            }

            config = await resolveChartConfig({
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
            const status = get(config, 'error.details.code', 500);
            res.status(status).send(config);
            return;
        }

        try {
            const configResolving = getDuration(hrStart);
            let configType = config && config.meta && config.meta.stype;

            // YDL OS: клиент иногда присылает короткий stype ("table", "graph") вместо полного ("table_wizard_node", "graph_wizard_node") — нормализуем для поиска runner
            const SHORT_STYPE_TO_RUNNER: Record<string, string> = {
                table: 'table_wizard_node',
                graph: 'graph_wizard_node',
                metric: 'metric_wizard_node',
                ymap: 'ymap_wizard_node',
                markup: 'markup_wizard_node',
                timeseries: 'timeseries_wizard_node',
                d3: 'd3_wizard_node',
            };
            const resolvedConfigType =
                (configType && SHORT_STYPE_TO_RUNNER[configType]) || configType;
            if (resolvedConfigType !== configType && config?.meta) {
                config.meta.stype = resolvedConfigType as ChartStorageType;
            }
            configType = resolvedConfigType as ChartStorageType;

            ctx.log('CHARTS_ENGINE_CONFIG_TYPE', {configType});

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
                ctx.log('CHARTS_ENGINE_UNKNOWN_CONFIG_TYPE', {configType});
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
                if (
                    isEnabledServerFeature(Feature.ShouldCheckEditorAccess) &&
                    runnerFound.name === 'editor'
                ) {
                    const {checkRequestForDeveloperModeAccess} = ctx.get('gateway');
                    const checkResult = await checkRequestForDeveloperModeAccess({
                        ctx,
                    });

                    if (checkResult === DeveloperModeCheckStatus.Forbidden) {
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

            try {
                const currentUser = await US.universalService(
                    {
                        action: 'datalens',
                        method: 'currentUser',
                        data: [{}],
                    },
                    req.headers,
                    req.ctx,
                );

                if (!currentUser.err && currentUser.data?.[0]) {
                    const _params: Record<string, unknown> = req.body.params || {};
                    for (const i in _params) {
                        if (i.startsWith('__')) {
                            delete req.body.params[i];
                        }
                    }
                    req.body.params = req.body.params || {};
                    req.body.params['__user_id'] = currentUser.data[0].id;
                    req.body.params['__embed'] = currentUser.data[0].isEmbed === true ? 1 : -1;
                }
            } catch (usError) {
                ctx.log('CHARTS_ENGINE_CURRENT_USER_SKIP', {error: usError});
            }

            await runnerFound.handler(ctx, {
                chartsEngine,
                req,
                res,
                config: {
                    ...config,
                    data: {
                        ...config.data,
                        url: get(config.data, 'sources') || get(config.data, 'url'),
                        js: get(config.data, 'prepare') || get(config.data, 'js'),
                        ui: get(config.data, 'controls') || get(config.data, 'ui'),
                    },
                },
                configResolving,
                workbookId,
            });
        } catch (error) {
            ctx.logError('CHARTS_ENGINE_RUNNER_ERROR', error);
            res.status(500).send({
                error: 'Internal error',
            });
        }
    };
};
