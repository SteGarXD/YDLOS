"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartGenerator = void 0;
const shared_1 = require("../../../../shared");
const commonTemplateGraph = `
const {buildHighchartsConfig, buildLibraryConfig} = require('#module');

const buildFn = typeof buildLibraryConfig === 'function' ? buildLibraryConfig : buildHighchartsConfig;

const result = buildFn({
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    actionParams: Editor.getActionParams(),
    widgetConfig: Editor.getWidgetConfig(),
    Editor
});

// your code here

module.exports = result;
`;
const commonTemplate = {
    prepare: `
const {buildGraph} = require('#module');

const result = buildGraph({
    apiVersion: '#apiVersion',
    data: Editor.getLoadedData(),
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    actionParams: Editor.getActionParams(),
    widgetConfig: Editor.getWidgetConfig(),
    Editor,
});

// your code here

module.exports = result;
`,
    params: `
const {buildParams} = require('#module');

if (buildParams) {
    const result = buildParams({
        shared: Editor.getSharedData(),
        Editor
    });

    // your code here

    module.exports = result;
} else {
    // your code here

    module.exports = #params;
}
`,
    shared: null,
    config: `
const {buildChartsConfig} = require('#module');

const result = buildChartsConfig({
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    actionParams: Editor.getActionParams(),
    widgetConfig: Editor.getWidgetConfig(),
    Editor
});

// your code here

module.exports = result;
`,
    controls: `
const {buildUI} = require('#module');

if (buildUI) {
    const result = buildUI({
        shared: Editor.getSharedData(),
        params: Editor.getParams(),
        actionParams: Editor.getActionParams(),
        widgetConfig: Editor.getWidgetConfig(),
        Editor
    });

    // your code here

    module.exports = result;
}
`,
    sources: `
const {buildSources} = require('#module');

const result = buildSources({
    apiVersion: '#apiVersion',
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    Editor
});

// your code here

module.exports = result;
`,
};
const getGravityChartEditorTemplate = ({ module, params }) => ({
    params: `module.exports = ${params};
    `,
    sources: `const {buildSources} = require('${module}');

const result = buildSources({
    apiVersion: '2',
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    Editor
});

// your code here

module.exports = result;
`,
    config: `const {buildChartsConfig} = require('${module}');

const result = buildChartsConfig({
    shared: Editor.getSharedData(),
    params: Editor.getParams(),
    widgetConfig: Editor.getWidgetConfig(),
});

// your code here

module.exports = result;
`,
    prepare: `const {buildGravityChartsConfig} = require('${module}');

const result = buildGravityChartsConfig({
    data: Editor.getLoadedData(),
    shared: Editor.getSharedData(),
    Editor,
});

// your code here

module.exports = result;
`,
});
function createChartManifest(args) {
    var _a;
    const manifest = {
        links: (_a = args.links) !== null && _a !== void 0 ? _a : {},
    };
    return JSON.stringify(manifest, null, 4);
}
function getChartTemplate(ctx, chartOldType, template) {
    const config = ctx.config;
    const chartTemplates = config.chartTemplates;
    if (!template && chartOldType && chartOldType in chartTemplates) {
        template = chartOldType;
    }
    const chartTemplate = template && chartTemplates[template];
    if (!chartTemplate) {
        throw new Error('Unknown chart template');
    }
    return chartTemplate;
}
exports.chartGenerator = {
    gatherChartLinks: (options) => {
        const { req, shared, chartTemplate } = options;
        let links;
        if (chartTemplate.identifyLinks) {
            links = chartTemplate.identifyLinks(shared, req);
        }
        return links;
    },
    serializeShared: (options) => {
        const { ctx, shared, links } = options;
        const output = {
            shared: '',
        };
        try {
            output.shared = JSON.stringify(shared, null, 4);
        }
        catch (e) {
            throw new Error('Invalid chart data');
        }
        const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
        if (isEnabledServerFeature('EnableChartEditorMetaTab')) {
            output.meta = createChartManifest({ links });
        }
        return output;
    },
    identifyChartTemplate: (options) => {
        const { shared, ctx, template } = options;
        const chartTemplate = getChartTemplate(ctx, shared.type, template);
        if (!chartTemplate) {
            throw new Error('Invalid chart data type');
        }
        return {
            type: shared.type,
            chartTemplate,
        };
    },
    generateChart: ({ data, template, req, ctx, }) => {
        var _a, _b, _c, _d, _e;
        const { chartTemplate } = exports.chartGenerator.identifyChartTemplate({ ctx, shared: data, template });
        const params = chartTemplate.identifyParams(data, req);
        const type = chartTemplate.identifyChartType(data, req);
        const links = exports.chartGenerator.gatherChartLinks({ req, shared: data, chartTemplate });
        const serializedData = exports.chartGenerator.serializeShared({ ctx, shared: data, links });
        switch (type) {
            case shared_1.WizardType.GravityChartsWizardNode: {
                const chart = {
                    ...getGravityChartEditorTemplate({
                        module: chartTemplate.module,
                        params: JSON.stringify(params),
                    }),
                    shared: serializedData.shared,
                    meta: serializedData.meta,
                };
                return { chart, links, type };
            }
            default: {
                const chart = { ...commonTemplate };
                chart.shared = serializedData.shared;
                if (serializedData.meta) {
                    chart.meta = serializedData.meta;
                }
                chart.params = chart.params.replace('#params', JSON.stringify(params));
                if (chart.params.indexOf('#module') > -1) {
                    chart.params = chart.params.replace('#module', chartTemplate.module);
                }
                const isTable = type.indexOf('table') > -1;
                if (type.indexOf('metric') > -1) {
                    chart.statface_metric = chart.config.replace('#module', chartTemplate.module);
                }
                else if (type.indexOf('markup') > -1 || isTable) {
                    chart.config = chart.config.replace('#module', chartTemplate.module);
                }
                else {
                    chart.graph = commonTemplateGraph.replace('#module', chartTemplate.module);
                    chart.statface_graph = chart.config.replace('#module', chartTemplate.module);
                }
                chart.prepare = (_b = (_a = chart.prepare) === null || _a === void 0 ? void 0 : _a.replace('#module', chartTemplate.module)) !== null && _b !== void 0 ? _b : '';
                chart.sources = (_d = (_c = chart.sources) === null || _c === void 0 ? void 0 : _c.replace('#module', chartTemplate.module)) !== null && _d !== void 0 ? _d : '';
                chart.controls = (_e = chart.controls) === null || _e === void 0 ? void 0 : _e.replace('#module', chartTemplate.module);
                const apiVersion = '2';
                chart.prepare = chart.prepare.replace('#apiVersion', apiVersion);
                chart.sources = chart.sources.replace('#apiVersion', apiVersion);
                const chartsWithConfig = isTable;
                const { config: _, ...chartWithoutConfig } = chart;
                return { chart: chartsWithConfig ? chart : chartWithoutConfig, links, type };
            }
        }
    },
};
