"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkerChart = void 0;
const chart_generator_1 = require("../components/chart-generator");
const common_1 = require("./common");
// eslint-disable-next-line complexity
const runWorkerChart = async (cx, props) => {
    const { chartsEngine, req, res, config, configResolving, workbookId, chartBuilder, runnerType = 'Worker', forbiddenFields, } = props;
    let generatedConfig;
    let chartType;
    const { template } = config;
    const ctx = cx.create('templateChartRunner');
    if (config) {
        let result;
        let metadata = null;
        try {
            if (typeof config.data.shared === 'string') {
                const data = JSON.parse(config.data.shared);
                if (!template && !data.type) {
                    data.type = config.meta && config.meta.stype;
                }
                result = chart_generator_1.chartGenerator.generateChart({
                    data,
                    template,
                    req,
                    ctx,
                });
                metadata = {
                    entryId: config.entryId,
                    key: config.key,
                    owner: config.owner,
                    scope: config.scope,
                };
                chartType = template || data.type;
            }
            else {
                // This is some kind of legacy edge cases.
                // Just for compatibility purposes;
                const data = config.data.shared;
                if (!template && !data.type) {
                    data.type = config.meta && config.meta.stype;
                }
                result = chart_generator_1.chartGenerator.generateChart({
                    data,
                    template,
                    req,
                    ctx,
                });
                chartType = template || data.type;
            }
        }
        catch (error) {
            ctx.logError('Failed to generate chart in chart runner', error);
            ctx.end();
            res.status(400).send({
                error,
            });
            return;
        }
        generatedConfig = {
            data: result.chart,
            meta: {
                stype: result.type,
            },
            publicAuthor: config.publicAuthor,
        };
        if (metadata) {
            Object.assign(generatedConfig, metadata);
        }
    }
    else {
        const error = new Error('CHART_RUNNER_CONFIG_MISSING');
        ctx.logError('CHART_RUNNER_CONFIG_MISSING', error);
        ctx.end();
        res.status(400).send({
            error,
        });
        return;
    }
    const hrStart = process.hrtime();
    return (0, common_1.commonRunner)({
        res,
        req,
        ctx,
        chartType,
        chartsEngine,
        configResolving,
        builder: chartBuilder,
        generatedConfig,
        workbookId,
        runnerType,
        hrStart,
        localConfig: config,
        forbiddenFields,
    });
};
exports.runWorkerChart = runWorkerChart;
