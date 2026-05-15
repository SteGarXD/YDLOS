"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSourcesPrivate = void 0;
const shared_1 = require("../../../../../../shared");
const middleware_urls_1 = require("../../constants/middleware-urls");
const color_palettes_1 = require("../../helpers/color-palettes");
const misc_1 = require("../../helpers/misc");
const config_helpers_1 = require("../utils/config-helpers");
const constants_1 = require("../utils/constants");
const misc_helpers_1 = require("../utils/misc-helpers");
const helpers_1 = require("./helpers");
const getAllPlaceholdersItemsForSourceRequest = (placeholders) => {
    const placeholdersItems = (0, misc_helpers_1.getAllPlaceholderItems)(placeholders);
    return placeholdersItems.reduce((acc, field) => {
        if (field.data_type === shared_1.DATASET_FIELD_TYPES.HIERARCHY) {
            const items = field.fields || [];
            return [...acc, ...items];
        }
        return [...acc, field];
    }, []);
};
const prepareSourceRequestBody = (args) => {
    const { sourceArgs, isPivotRequest, datasetId, apiVersion } = args;
    let url;
    if (isPivotRequest) {
        url = constants_1.DATASET_DATA_PIVOT_URL.replace('{id}', datasetId);
    }
    else if (apiVersion === '2') {
        url = constants_1.DATASET_DATA_URL_V2.replace('{id}', datasetId);
    }
    else {
        url = constants_1.DATASET_DATA_URL_V1.replace('{id}', datasetId);
    }
    return {
        url,
        middlewareUrl: {
            sourceName: middleware_urls_1.REQUEST_WITH_DATASET_SOURCE_NAME,
            middlewareType: middleware_urls_1.CHARTS_MIDDLEWARE_URL_TYPE,
        },
        method: 'POST',
        sourceArgs,
    };
};
const prepareSingleSourceRequest = (args) => {
    const { placeholders, datasetsIds, apiVersion, layerId = '', sourceArgs, isPivotRequest, links, } = args;
    const placeholdersItems = getAllPlaceholdersItemsForSourceRequest(placeholders);
    return datasetsIds.reduce((acc, datasetId) => {
        const payloadFields = (0, helpers_1.prepareFieldsForPayload)(placeholdersItems, datasetId, links);
        // If there are no fields that are necessary for visualization, then we do not request anything at all
        if (!payloadFields.length) {
            return acc;
        }
        const key = (0, misc_1.getDatasetIdAndLayerIdRequestKey)(datasetId, layerId);
        return {
            ...acc,
            [key]: prepareSourceRequestBody({ apiVersion, sourceArgs, isPivotRequest, datasetId }),
        };
    }, {});
};
const prepareSourceRequests = (args) => {
    const { datasetsIds, visualization, apiVersion, sourceArgs, extraSettings, links } = args;
    const isVisualizationWithLayers = visualization.id === 'geolayer' || visualization.id === 'combined-chart';
    const pivotFallbackEnabled = (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.pivotFallback) === 'on';
    const isPivotRequest = Boolean(visualization.id === 'pivotTable' && !pivotFallbackEnabled);
    if (isVisualizationWithLayers) {
        const layers = visualization.layers || [];
        return layers.reduce((acc, layer) => {
            const { placeholders } = layer;
            const request = prepareSingleSourceRequest({
                placeholders,
                apiVersion,
                datasetsIds,
                sourceArgs,
                isPivotRequest,
                layerId: layer.layerSettings.id,
                links,
            });
            return {
                ...acc,
                ...request,
            };
        }, {});
    }
    else {
        const placeholders = visualization.placeholders;
        return prepareSingleSourceRequest({
            placeholders,
            apiVersion,
            datasetsIds,
            sourceArgs,
            isPivotRequest,
        });
    }
};
const buildSourcesPrivate = (args) => {
    const { shared, palettes } = args;
    const apiVersion = args.apiVersion || '1.5';
    const config = (0, config_helpers_1.mapChartsConfigToServerConfig)(shared);
    shared.sharedData = config.sharedData;
    shared.links = config.links;
    const visualization = config.visualization;
    const datasetsIds = config.datasetsIds;
    const extraSettings = config.extraSettings;
    const requests = prepareSourceRequests({
        apiVersion,
        visualization,
        datasetsIds,
        extraSettings,
        sourceArgs: args,
        links: config.links,
    });
    Object.assign(requests, (0, color_palettes_1.getColorPalettesRequests)({ config, palettes }));
    (0, misc_helpers_1.log)('SOURCE REQUESTS:');
    (0, misc_helpers_1.log)(requests);
    return requests;
};
exports.buildSourcesPrivate = buildSourcesPrivate;
