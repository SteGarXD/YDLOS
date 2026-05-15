"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../shared");
const role_1 = require("../../../shared/components/auth/constants/role");
const sources_1 = require("../../../shared/endpoints/sources");
const env_utils_1 = require("../../utils/env-utils");
const control_dash_chart_template_1 = __importDefault(require("../shared/control-dash-chart-template"));
const datalens_chart_template_1 = __importDefault(require("../shared/datalens-chart-template"));
const ql_chart_template_1 = __importDefault(require("../shared/ql-chart-template"));
exports.default = {
    // DATALENS MODE (default name for our fork; override via SERVICE_NAME env)
    serviceName: process.env.SERVICE_NAME || 'Aeronavigator BI',
    faviconUrl: '/logo.png',
    expressCookieSecret: process.env.COOKIE_SECRET,
    appAuthPolicy: 'redirect',
    runResponseWhitelist: [
        'sourceId',
        'sourceType',
        'body',
        'status',
        'latency',
        'size',
        'data',
        'datasetId',
        'code',
        'details',
    ],
    regionalEnvConfig: {
        defaultLang: shared_1.Language.En,
        allowLanguages: [shared_1.Language.En, shared_1.Language.Ru],
    },
    appLangQueryParamName: '_lang',
    expressBodyParserRawConfig: {
        type: 'multipart/form-data',
        limit: '21mb',
    },
    usMasterToken: process.env.US_MASTER_TOKEN || 'fake-us-master-token',
    // CHARTS MODE
    allowBodyConfig: true,
    chartTemplates: {
        ql: ql_chart_template_1.default,
        datalens: datalens_chart_template_1.default,
        control_dash: control_dash_chart_template_1.default,
    },
    getSourcesByEnv: (env) => {
        const sources = (0, sources_1.resolveSource)(shared_1.AppInstallation.Opensource, env);
        return {
            bi: {
                dataEndpoint: sources.bi,
                passedCredentials: {},
                description: {
                    title: {
                        ru: 'DataLens BI',
                        en: 'DataLens BI',
                    },
                },
            },
            bi_connections: {
                dataEndpoint: sources.bi_connections,
                passedCredentials: {},
                description: {
                    title: {
                        ru: 'DataLens BI Connections',
                        en: 'DataLens BI Connections',
                    },
                },
            },
            bi_datasets: {
                dataEndpoint: sources.bi_datasets,
                passedCredentials: {},
                description: {
                    title: {
                        ru: 'DataLens BI Datasets',
                        en: 'DataLens BI Datasets',
                    },
                },
            },
            bi_datasets_embed: {
                dataEndpoint: sources.bi_datasets_embed,
                passedCredentials: {},
                description: {
                    title: {
                        ru: 'DataLens BI Datasets Embed',
                        en: 'DataLens BI Datasets Embed',
                    },
                },
            },
            bi_connections_embed: {
                dataEndpoint: sources.bi_connections_embed,
                passedCredentials: {},
                description: {
                    title: {
                        ru: 'DataLens BI Connections Embed',
                        en: 'DataLens BI Connections Embed',
                    },
                },
            },
            us_color_palettes: {
                description: {
                    title: {
                        ru: 'US color palettes',
                        en: 'US color palettes',
                    },
                },
                dataEndpoint: `${process.env.US_ENDPOINT || sources.us}/v1/color-palettes`,
                passedCredentials: {},
            },
        };
    },
    redis: null,
    iamResources: {
        collection: {
            roles: {
                admin: 'datalens.collections.admin',
                editor: 'datalens.collections.editor',
                viewer: 'datalens.collections.viewer',
                limitedViewer: 'datalens.collections.limitedViewer',
            },
        },
        workbook: {
            roles: {
                admin: 'datalens.workbooks.admin',
                editor: 'datalens.workbooks.editor',
                viewer: 'datalens.workbooks.viewer',
                limitedViewer: 'datalens.workbooks.limitedViewer',
            },
        },
    },
    orderedAuthRoles: [role_1.UserRole.Admin, role_1.UserRole.Editor, role_1.UserRole.Viewer],
    chartsEngineConfig: {
        secrets: {},
        enableTelemetry: true,
        usEndpointPostfix: '',
        dataFetcherProxiedHeaders: [shared_1.DL_CONTEXT_HEADER],
    },
    chartkitSettings: {
        highcharts: {
            enabled: (0, shared_1.isTrueArg)(process.env.HC),
            external: true,
            domain: process.env.HC_ENDPOINT || 'code.highcharts.com',
            protocol: process.env.HC_PROTOCOL || 'https',
            modules: process.env.HC_MODULES
                ? process.env.HC_MODULES.split(',').map((m) => m.trim())
                : [
                    'exporting',
                    'export-data',
                    'stock',
                    'solid-gauge',
                    'funnel',
                    'histogram-bellcurve',
                    'sankey',
                    'heatmap',
                    'treemap',
                    'variwide',
                    'streamgraph',
                    'drilldown',
                    'parallel-coordinates',
                    'pattern-fill',
                    'wordcloud',
                    'xrange',
                    'networkgraph',
                    'timeline',
                    'bullet',
                    'annotations',
                    'series-label',
                    'venn',
                ],
            version: '8.2.2',
        },
        yandexMap: {
            enabled: (0, shared_1.isTrueArg)(process.env.YANDEX_MAP_ENABLED),
            token: process.env.YANDEX_MAP_TOKEN,
        },
    },
    defaultColorPaletteId: shared_1.PALETTE_ID.DEFAULT_20,
    appSensitiveKeys: [shared_1.CSP_HEADER, shared_1.CSP_REPORT_TO_HEADER, shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER],
    appSensitiveHeaders: [shared_1.CSP_HEADER, shared_1.CSP_REPORT_TO_HEADER, shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER],
    // zitadel
    isZitadelEnabled: (0, shared_1.isTrueArg)(process.env.ZITADEL),
    clientId: process.env.CLIENT_ID || '',
    clientSecret: process.env.CLIENT_SECRET || '',
    zitadelProjectId: process.env.ZITADEL_PROJECT_ID || '',
    zitadelUri: process.env.ZITADEL_URI || '',
    zitadelInternalUri: process.env.ZITADEL_INTERNAL_URI || process.env.ZITADEL_URI,
    appHostUri: process.env.APP_HOST_URI || '',
    zitadelCookieSecret: process.env.ZITADEL_COOKIE_SECRET || '',
    serviceClientId: process.env.SERVICE_CLIENT_ID || '',
    serviceClientSecret: process.env.SERVICE_CLIENT_SECRET || '',
    oidc: (0, shared_1.isTrueArg)(process.env.OIDC),
    oidc_issuer: process.env.OIDC_ISSUER || '',
    oidc_base_url: process.env.OIDC_BASE_URL || '',
    oidc_client_id: process.env.OIDC_CLIENT_ID || '',
    oidc_secret: process.env.OIDC_SECRET || '',
    oidc_name: process.env.OIDC_NAME || '',
    oidc_2: (0, shared_1.isTrueArg)(process.env.OIDC_2),
    oidc_issuer_2: process.env.OIDC_ISSUER_2 || '',
    oidc_base_url_2: process.env.OIDC_BASE_URL_2 || '',
    oidc_client_id_2: process.env.OIDC_CLIENT_ID_2 || '',
    oidc_secret_2: process.env.OIDC_SECRET_2 || '',
    oidc_name_2: process.env.OIDC_NAME_2 || '',
    oidc_3: (0, shared_1.isTrueArg)(process.env.OIDC_3),
    oidc_issuer_3: process.env.OIDC_ISSUER_3 || '',
    oidc_base_url_3: process.env.OIDC_BASE_URL_3 || '',
    oidc_client_id_3: process.env.OIDC_CLIENT_ID_3 || '',
    oidc_secret_3: process.env.OIDC_SECRET_3 || '',
    oidc_name_3: process.env.OIDC_NAME_3 || '',
    oidc_4: (0, shared_1.isTrueArg)(process.env.OIDC_4),
    oidc_issuer_4: process.env.OIDC_ISSUER_4 || '',
    oidc_base_url_4: process.env.OIDC_BASE_URL_4 || '',
    oidc_client_id_4: process.env.OIDC_CLIENT_ID_4 || '',
    oidc_secret_4: process.env.OIDC_SECRET_4 || '',
    oidc_name_4: process.env.OIDC_NAME_4 || '',
    //runEndpoint: '/api/run',
    // auth
    isAuthEnabled: (0, shared_1.isTrueArg)(process.env.AUTH_ENABLED),
    authTokenPublicKey: (0, env_utils_1.getEnvCert)(process.env.AUTH_TOKEN_PUBLIC_KEY),
    authManageLocalUsersDisabled: (0, shared_1.isTrueArg)(process.env.AUTH_MANAGE_LOCAL_USERS_DISABLED),
    authSignupDisabled: (0, shared_1.isTrueArg)(process.env.AUTH_SIGNUP_DISABLED),
    apiPrefix: '/api',
    exportDashExcel: (0, shared_1.isTrueArg)(process.env.EXPORT_DASH_EXCEL)
};
