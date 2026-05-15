"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadWithCommonTableSettings = void 0;
const unionBy_1 = __importDefault(require("lodash/unionBy"));
const shared_1 = require("../../../../../../../shared");
const paramsUtils_1 = require("../../../../../../components/charts-engine/components/processor/paramsUtils");
const constants_1 = require("../../utils/constants");
const misc_helpers_1 = require("../../utils/misc-helpers");
const getOrderByItemForColumnClickSort = ({ params, allItemsIds, isPivotTable, visualization, }) => {
    const { columnId, order } = (0, misc_helpers_1.getSortData)((0, paramsUtils_1.getSortParams)(params), isPivotTable);
    // If the data for sorting and the column exist, then
    // We process tabular sorting, it is in priority
    const isSortColumnExists = columnId && order && allItemsIds[columnId];
    const sortItem = isSortColumnExists
        ? {
            direction: order,
            column: columnId,
        }
        : undefined;
    if (isPivotTable && columnId && sortItem) {
        const columnsPlaceholder = (visualization.placeholders || []).find((p) => p.id === shared_1.PlaceholderId.PivotTableRows);
        const fields = (columnsPlaceholder === null || columnsPlaceholder === void 0 ? void 0 : columnsPlaceholder.items) || [];
        const guids = fields.reduce((acc, field) => ({ ...acc, [field.guid]: true }), {});
        // sorting by dimensions only for the pivot table is handled here
        // this can only be if sorted by field from the row section
        // therefore, we do not add to order_by if the field is from another section
        return guids[columnId] ? sortItem : undefined;
    }
    return sortItem;
};
const getUpdatedOrderByForColumnClickSort = ({ params, allItemsIds, isPivotTable, orderBy, dimensionsFromCurrentDataset, visualization, }) => {
    const columnSort = getOrderByItemForColumnClickSort({
        params,
        allItemsIds,
        isPivotTable,
        visualization,
    });
    let updatedOrderBy = orderBy ? [...orderBy] : [];
    if (columnSort) {
        updatedOrderBy.unshift(columnSort);
    }
    // Adding all dimensions to order_by, excluding those that are in sort
    // CHARTS-3421#5fda2052b806202d36837f7f
    updatedOrderBy = (0, unionBy_1.default)(updatedOrderBy || [], dimensionsFromCurrentDataset, ({ column }) => column);
    return updatedOrderBy;
};
const getPayloadWithCommonTableSettings = (payload, options) => {
    const { fields, extraSettings, params, allItemsIds, datasetId, visualization } = options;
    const visualizationId = visualization.id;
    const isPivotTable = visualizationId === shared_1.WizardVisualizationId.PivotTable;
    const isFlatTable = visualizationId === shared_1.WizardVisualizationId.FlatTable;
    const dimensionsFromCurrentDataset = fields
        .filter((item) => item.type === 'DIMENSION' && item.datasetId === datasetId)
        .map(({ guid }) => ({
        direction: constants_1.SORT_ORDER.ASCENDING.STR,
        column: guid,
    }));
    const updatedPayload = {
        ...payload,
    };
    const isPivotFallbackEnabled = (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.pivotFallback) === 'on';
    const isBackendPivotTable = isPivotTable && !isPivotFallbackEnabled;
    const isPaginationAvailable = isBackendPivotTable || isFlatTable;
    const isPaginationEnabled = Boolean(isPaginationAvailable && (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.pagination) === 'on');
    // This check for length is used to be sure that user uses dimensions in graph
    // without dimensions pagination makes no sense because offset will always be 0
    // and backend will be failed to process it
    if (dimensionsFromCurrentDataset.length && isPaginationEnabled && (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.limit)) {
        updatedPayload.limit = extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.limit;
        const page = (0, paramsUtils_1.getCurrentPage)(params);
        updatedPayload.offset = (page - 1) * extraSettings.limit;
    }
    if (isBackendPivotTable || isPaginationEnabled) {
        updatedPayload.order_by = getUpdatedOrderByForColumnClickSort({
            params,
            allItemsIds,
            isPivotTable,
            orderBy: payload.order_by,
            dimensionsFromCurrentDataset,
            visualization,
        });
    }
    return updatedPayload;
};
exports.getPayloadWithCommonTableSettings = getPayloadWithCommonTableSettings;
