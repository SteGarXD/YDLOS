"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutes = getRoutes;
const expresskit_1 = require("@gravity-ui/expresskit");
const shared_1 = require("../../../shared");
const gateway_utils_1 = require("../../../shared/schema/gateway-utils");
const app_env_1 = require("../../app-env");
const routes_1 = require("../../components/auth/routes");
const routes_2 = require("../../components/zitadel/routes");
const ping_1 = require("../../controllers/ping");
const export_entries_1 = require("../../controllers/export-entries");
const print_entry_1 = require("../../controllers/print-entry");
const workbook_transfer_1 = require("../../controllers/workbook-transfer");
const middlewares_1 = require("../../middlewares");
const tenant_settings_1 = require("../../middlewares/tenant-settings");
const routes_3 = require("../../utils/routes");
const init_charts_engine_1 = require("../charts/init-charts-engine");
function getRoutes({ ctx, chartsEngine, passport, beforeAuth, afterAuth, }) {
    let routes = {
        ping: {
            beforeAuth: [],
            afterAuth: [],
            route: 'GET /ping',
            handler: ping_1.ping,
            authPolicy: expresskit_1.AuthPolicy.disabled,
        },
        exportDash: {
            beforeAuth: beforeAuth,
            afterAuth: afterAuth,
            route: 'POST /export-entries',
            handler: export_entries_1.exportEntries
        },
        printEntry: {
            beforeAuth: beforeAuth,
            afterAuth: afterAuth,
            route: 'POST /print-entry',
            handler: print_entry_1.printEntry
        },
    };
    if (ctx.config.isZitadelEnabled) {
        routes = { ...routes, ...(0, routes_2.getZitadelRoutes)({ passport, beforeAuth, afterAuth }) };
    }
    if (app_env_1.appEnv === shared_1.AppEnvironment.Development || app_env_1.isApiMode) {
        routes = {
            ...routes,
            ...getApiRoutes({ beforeAuth, afterAuth }),
        };
    }
    if (ctx.config.isAuthEnabled) {
        routes = { ...routes, ...(0, routes_1.getAuthRoutes)({ routeParams: { beforeAuth, afterAuth } }) };
    }
    if (app_env_1.isFullMode || app_env_1.isDatalensMode) {
        routes = { ...routes, ...getDataLensRoutes({ ctx, beforeAuth, afterAuth }) };
    }
    if (app_env_1.isFullMode || app_env_1.isChartsMode) {
        routes = { ...routes, ...getChartsRoutes({ chartsEngine, beforeAuth, afterAuth }) };
    }
    return routes;
}
function getApiRoutes({ beforeAuth, afterAuth, }) {
    const routes = {
        workbooksMetaManagerCapabilities: {
            handler: workbook_transfer_1.workbooksTransferController.capabilities,
            beforeAuth,
            afterAuth,
            route: 'GET /api/internal/v1/workbooks/meta-manager/capabilities/',
            authPolicy: expresskit_1.AuthPolicy.disabled,
            disableCsrf: true,
        },
        workbooksExport: {
            handler: workbook_transfer_1.workbooksTransferController.export,
            beforeAuth,
            afterAuth,
            route: 'POST /api/internal/v1/workbooks/export/',
            authPolicy: expresskit_1.AuthPolicy.disabled,
            disableCsrf: true,
        },
        workbooksImport: {
            handler: workbook_transfer_1.workbooksTransferController.import,
            beforeAuth,
            afterAuth,
            route: 'POST /api/internal/v1/workbooks/import/',
            authPolicy: expresskit_1.AuthPolicy.disabled,
            disableCsrf: true,
        },
    };
    return routes;
}
function getDataLensRoutes({ beforeAuth, afterAuth, }) {
    const ui = {
        beforeAuth,
        afterAuth: [
            ...afterAuth,
            (0, middlewares_1.getConnectorIconsMiddleware)({
                getAdditionalArgs: (req, res) => ({
                    authArgs: (0, gateway_utils_1.getAuthArgs)(req, res),
                }),
            }),
            (0, tenant_settings_1.getTenantSettingsMiddleware)(),
        ],
        ui: true,
    };
    const server = {
        beforeAuth,
        afterAuth,
    };
    const routes = {
        getConnections: (0, routes_3.getConfiguredRoute)('navigation', { ...ui, route: 'GET /connections' }),
        getDatasets: (0, routes_3.getConfiguredRoute)('navigation', { ...ui, route: 'GET /datasets' }),
        getWidgets: (0, routes_3.getConfiguredRoute)('navigation', { ...ui, route: 'GET /widgets' }),
        getDashboards: (0, routes_3.getConfiguredRoute)('navigation', { ...ui, route: 'GET /dashboards' }),
        getDatasetsAll: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /datasets/*' }),
        getConnectionsAll: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /connections/*' }),
        getSettingsAll: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /settings/*' }),
        getDashboardsAll: {
            route: 'GET /dashboards/*',
            beforeAuth,
            afterAuth,
            handler: (req, res) => res.redirect(req.originalUrl.replace('/dashboards', '')),
        },
        getWizardAll: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /wizard/*' }),
        getPreview: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /preview*' }),
        getWorkbooks: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /workbooks*' }),
        postDeleteLock: (0, routes_3.getConfiguredRoute)('api.deleteLock', {
            ...server,
            route: 'POST /api/private/deleteLock',
        }),
        postGateway: (0, routes_3.getConfiguredRoute)('schematic-gateway', {
            ...server,
            route: 'POST /gateway/:scope/:service/:action?',
        }),
        getNavigate: (0, routes_3.getConfiguredRoute)('navigate', { ...ui, route: 'GET /navigate/:entryId' }),
        getEntry: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET  /:entryId' }),
        getNewWizard: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET  /:entryId/new/wizard' }),
        getWidget: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET  /:entryId/:widgetId' }),
        getRoot: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /' }),
        getEditorAll: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /editor*' }),
        getSql: {
            handler: (_req, res) => {
                res.redirect(`/ql`);
            },
            beforeAuth,
            afterAuth,
            route: 'GET /sql',
        },
        // Path to UI ql Charts
        getQlEntry: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /ql/:entryId' }),
        getQlNew: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /ql/new' }),
        getQlNnewMonitoringql: (0, routes_3.getConfiguredRoute)('dl-main', {
            ...ui,
            route: 'GET /ql/new/monitoringql',
        }),
        getQlNewSql: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /ql/new/sql' }),
        getQlNewPromql: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET /ql/new/promql' }),
        getEntrNewQl: (0, routes_3.getConfiguredRoute)('dl-main', { ...ui, route: 'GET  /:entryId/new/ql' }),
    };
    return routes;
}
function getChartsRoutes({ chartsEngine, beforeAuth, afterAuth, }) {
    if (!chartsEngine) {
        return {};
    }
    const routes = {
        // Routes from Charts Engine
        postApiRun: {
            beforeAuth,
            afterAuth,
            route: 'POST /api/run',
            handler: chartsEngine.controllers.run,
        },
        postApiExport: {
            beforeAuth,
            afterAuth,
            route: 'POST /api/export',
            handler: chartsEngine.controllers.export,
        },
        getApiPrivateConfig: {
            beforeAuth,
            afterAuth,
            route: 'GET  /api/private/config',
            handler: chartsEngine.controllers.config,
        },
        // Routes for charts
        postApiChartsV1Charts: {
            beforeAuth,
            afterAuth,
            route: 'POST /api/charts/v1/charts',
            handler: chartsEngine.controllers.charts.create,
        },
        getApiChartsV1ChartsEntryByKey: {
            beforeAuth,
            afterAuth,
            route: 'GET /api/charts/v1/charts/entryByKey',
            handler: chartsEngine.controllers.charts.entryByKey,
        },
        getApiChartsV1ChartsEntry: {
            beforeAuth,
            afterAuth,
            route: 'GET /api/charts/v1/charts/:entryId',
            handler: chartsEngine.controllers.charts.get,
        },
        postApiChartsV1ChartsEntry: {
            beforeAuth,
            afterAuth,
            route: 'POST /api/charts/v1/charts/:entryId',
            handler: chartsEngine.controllers.charts.update,
        },
        deleteApiChartsV1ChartsEntry: {
            beforeAuth,
            afterAuth,
            route: 'DELETE /api/charts/v1/charts/:entryId',
            handler: chartsEngine.controllers.charts.delete,
        },
    };
    // Apply routes from plugins
    (0, init_charts_engine_1.applyPluginRoutes)({ chartsEngine, routes, beforeAuth, afterAuth });
    return routes;
}
