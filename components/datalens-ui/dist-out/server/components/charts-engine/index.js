"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Console = exports.CommentsFetcher = exports.DataFetcher = exports.ChartsEngine = void 0;
const comments_fetcher_1 = require("./components/processor/comments-fetcher");
Object.defineProperty(exports, "CommentsFetcher", { enumerable: true, get: function () { return comments_fetcher_1.CommentsFetcher; } });
const console_1 = require("./components/processor/console");
Object.defineProperty(exports, "Console", { enumerable: true, get: function () { return console_1.Console; } });
const data_fetcher_1 = require("./components/processor/data-fetcher");
Object.defineProperty(exports, "DataFetcher", { enumerable: true, get: function () { return data_fetcher_1.DataFetcher; } });
const request_1 = require("./components/request");
const storage_1 = require("./components/storage");
const charts_1 = require("./controllers/charts");
const config_1 = require("./controllers/config");
const embedded_entry_1 = require("./controllers/embedded-entry");
const embeds_1 = require("./controllers/embeds");
const export_1 = require("./controllers/export");
const markdown_1 = require("./controllers/markdown");
const run_1 = require("./controllers/run");
const defaultControllers = {
    export: export_1.exportController,
    markdown: markdown_1.markdownController,
    run: run_1.runController,
    config: config_1.configController,
    charts: charts_1.chartsController,
    embeds: embeds_1.embedsController,
    embeddedEntry: embedded_entry_1.embeddedEntryController,
};
const types_1 = require("./types");
class ChartsEngine {
    constructor({ config, secrets, plugins, telemetryCallbacks = {}, flags = {}, cacheClient, beforeAuth, afterAuth, runners, }) {
        this.runners = runners;
        this.sources = config.sources;
        this.telemetryCallbacks = telemetryCallbacks;
        this.processorHooks = [];
        this.flags = flags;
        this.plugins = plugins;
        this.beforeAuth = beforeAuth;
        this.afterAuth = afterAuth;
        (0, storage_1.initStorage)({
            initialOauthToken: secrets.ROBOT_OAUTH_TOKEN,
            config,
            telemetryCallbacks,
            flags,
        });
        this.cacheClient = cacheClient;
        request_1.Request.init({ cacheClientInstance: this.cacheClient });
        const { includeServicePlan, includeTenantFeatures } = config.chartsEngineConfig;
        this.controllers = {
            export: defaultControllers.export(),
            markdown: defaultControllers.markdown,
            run: defaultControllers.run(this, { includeServicePlan, includeTenantFeatures }),
            config: defaultControllers.config(this),
            charts: defaultControllers.charts(this),
            embeds: defaultControllers.embeds(this),
            embeddedEntry: defaultControllers.embeddedEntry,
        };
        if (plugins) {
            // Init plugins
            plugins.forEach((plugin) => {
                if (plugin.sources) {
                    this.sources = {
                        ...this.sources,
                        ...plugin.sources,
                    };
                }
                // Apply plugin middlewares
                if (plugin.middlewares) {
                    plugin.middlewares.forEach((middleware) => {
                        if (middleware.stage === types_1.MiddlewareStage.BeforeAuth) {
                            this.beforeAuth.push(middleware.fn);
                        }
                        if (middleware.stage === types_1.MiddlewareStage.AfterAuth) {
                            this.afterAuth.push(middleware.fn);
                        }
                    });
                }
                // Apply plugin runners
                if (plugin.runners) {
                    this.runners = [...this.runners, ...plugin.runners];
                }
                // Apply sandbox hooks
                if (Array.isArray(plugin.processorHooks)) {
                    this.processorHooks = [...this.processorHooks, ...plugin.processorHooks];
                }
                if (plugin.controllers) {
                    const controllers = Object.entries(plugin.controllers).reduce((acc, [key, value]) => {
                        acc[key] = value(this);
                        return acc;
                    }, {});
                    Object.assign(this.controllers, controllers);
                }
            });
        }
    }
    initPreloading(ctx) {
        (0, storage_1.initPreloading)(ctx);
    }
}
exports.ChartsEngine = ChartsEngine;
