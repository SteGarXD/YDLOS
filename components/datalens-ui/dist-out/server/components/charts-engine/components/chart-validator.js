"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartValidator = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../../../../shared/constants");
// Parts in Set keys should be separeted by comma and defined in alphabetic order
const MODEL_TABS = {
    [constants_1.EDITOR_TYPE.GRAPH_NODE]: new Set([
        'graph,js,params,shared,statface_graph,ui,url',
        'graph,js,meta,params,shared,statface_graph,ui,url',
        'graph,js,params,secrets,shared,statface_graph,ui,url',
        'graph,js,meta,params,secrets,shared,statface_graph,ui,url',
    ]),
    [constants_1.EDITOR_TYPE.METRIC_NODE]: new Set([
        'js,params,shared,statface_metric,url',
        'js,meta,params,shared,statface_metric,url',
        'js,params,secrets,shared,statface_metric,url',
        'js,meta,params,secrets,shared,statface_metric,url',
    ]),
    [constants_1.EDITOR_TYPE.TABLE_NODE]: new Set([
        'js,params,shared,table,ui,url',
        'js,meta,params,shared,table,ui,url',
        'js,params,secrets,shared,table,ui,url',
        'js,meta,params,secrets,shared,table,ui,url',
    ]),
    [constants_1.EDITOR_TYPE.YMAP_NODE]: new Set([
        'js,params,shared,url,ymap',
        'js,meta,params,shared,url,ymap',
        'js,params,secrets,shared,url,ymap',
        'js,meta,params,secrets,shared,url,ymap',
    ]),
    [constants_1.EDITOR_TYPE.CONTROL_NODE]: new Set([
        'js,params,shared,ui,url',
        'js,meta,params,shared,ui,url',
        'js,params,secrets,shared,ui,url',
        'js,meta,params,secrets,shared,ui,url',
    ]),
    [constants_1.EDITOR_TYPE.MARKDOWN_NODE]: new Set([
        'js,params,shared,url',
        'js,meta,params,shared,url',
        'js,params,secrets,shared,url',
        'js,meta,params,secrets,shared,url',
    ]),
    [constants_1.EDITOR_TYPE.MARKUP_NODE]: new Set([
        'config,js,params,shared,url',
        'config,js,meta,params,shared,url',
        'config,js,params,secrets,shared,url',
        'config,js,meta,params,secrets,shared,url',
    ]),
    [constants_1.EDITOR_TYPE.MODULE]: new Set([
        'documentation_en,documentation_ru,js',
        'documentation_en,documentation_ru,js,meta',
        'documentation_ru,js',
        'documentation_ru,js,meta',
        'documentation_en,js',
        'documentation_en,js,meta',
        'js',
        'js,meta',
    ]),
    [constants_1.EDITOR_TYPE.GRAVITY_CHARTS_NODE]: new Set([
        'config,js,params,shared,ui,url',
        'config,js,meta,params,shared,ui,url',
        'config,js,params,secrets,shared,ui,url',
        'config,js,meta,params,secrets,shared,ui,url',
    ]),
    [constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE]: new Set([
        'config,js,params,shared,ui,url',
        'config,js,meta,params,shared,ui,url',
        'config,js,params,secrets,shared,ui,url',
        'config,js,meta,params,secrets,shared,ui,url',
    ]),
};
MODEL_TABS[constants_1.EDITOR_TYPE.BLANK_CHART_NODE] = MODEL_TABS[constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE];
exports.chartValidator = {
    validate: ({ data, type }) => {
        const dataTabs = Object.keys(data).sort();
        const modelTabs = MODEL_TABS[type];
        if (modelTabs) {
            dataTabs.forEach((key) => {
                if (typeof data[key] !== 'string' && typeof data[key] !== 'object') {
                    throw new Error(`Each tab must have content (failed at tab "${key}")`);
                }
            });
            return Array.from(modelTabs).some((modelTab) => {
                const oldTabs = modelTab.split(',').sort();
                const newTabs = modelTab
                    .replace('js', 'prepare')
                    .replace('ui', 'controls')
                    .replace('url', 'sources')
                    .replace('table', 'config')
                    .split(',')
                    .sort();
                return (0, lodash_1.isEqual)(oldTabs, dataTabs) || (0, lodash_1.isEqual)(newTabs, dataTabs);
            });
        }
        else {
            throw new Error(`Unknown chart type "${type}"`);
        }
    },
};
