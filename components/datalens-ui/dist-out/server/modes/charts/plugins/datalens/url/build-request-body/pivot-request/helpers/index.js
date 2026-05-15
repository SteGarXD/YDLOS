"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPivotStructure = exports.getAnnotations = exports.getRegularFields = void 0;
// 0. <regular fields> -> block_id=0:
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const shared_1 = require("../../../../../../../../../shared");
const paramsUtils_1 = require("../../../../../../../../components/charts-engine/components/processor/paramsUtils");
const getRegularFields = ({ columns, rows, measures, legendItemCounter, orderByMap, }) => {
    const columnsReq = columns.map((el) => {
        const direction = (0, shared_1.getObjectValueByPossibleKeys)([el.guid, el.title], orderByMap) || 'asc';
        if ((0, shared_1.isMeasureName)(el)) {
            return {
                legend_item_id: legendItemCounter.legendItemIdIndex++,
                block_id: 0,
                role_spec: {
                    role: 'pivot_column',
                    direction,
                },
                ref: { type: 'measure_name' },
            };
        }
        return {
            legend_item_id: legendItemCounter.legendItemIdIndex++,
            block_id: 0,
            role_spec: {
                role: 'pivot_column',
                direction,
            },
            ref: { type: 'id', id: el.guid },
        };
    });
    const rowsReq = rows.map((el) => {
        const direction = (0, shared_1.getObjectValueByPossibleKeys)([el.guid, el.title], orderByMap) || 'asc';
        // In the old summary, it was possible to put Measure Values in the lines. Visually, the chart did not change.
        // Therefore, in order not to break the old summary on dashboards and in preview. We send it to the back as if it were a Measure Names
        if ((0, shared_1.isMeasureName)(el) || (0, shared_1.isMeasureValue)(el)) {
            return {
                legend_item_id: legendItemCounter.legendItemIdIndex++,
                block_id: 0,
                role_spec: {
                    role: 'pivot_row',
                    direction,
                },
                ref: { type: 'measure_name' },
            };
        }
        return {
            legend_item_id: legendItemCounter.legendItemIdIndex++,
            block_id: 0,
            ref: { type: 'id', id: el.guid },
            role_spec: {
                role: 'pivot_row',
                direction,
            },
        };
    });
    const measuresReq = measures.map((el) => {
        const direction = (0, shared_1.getObjectValueByPossibleKeys)([el.guid, el.title], orderByMap) || 'asc';
        return {
            legend_item_id: legendItemCounter.legendItemIdIndex++,
            block_id: 0,
            ref: { type: 'id', id: el.guid },
            role_spec: {
                role: 'pivot_measure',
                direction,
            },
        };
    });
    return { columnsReq, rowsReq, measuresReq };
};
exports.getRegularFields = getRegularFields;
const getAnnotations = ({ colors, backgroundColors, legendItemCounter, orderByMap, usedFieldsMap, }) => {
    const colorsAnnotations = colors
        .filter((el) => !(0, shared_1.isMeasureName)(el))
        .map((el) => {
        var _a, _b;
        const direction = (0, shared_1.getObjectValueByPossibleKeys)([el.guid, el.title], orderByMap) || 'asc';
        const legendItemId = typeof ((_a = usedFieldsMap[el.guid]) === null || _a === void 0 ? void 0 : _a.legendItemId) !== 'undefined'
            ? (_b = usedFieldsMap[el.guid]) === null || _b === void 0 ? void 0 : _b.legendItemId
            : legendItemCounter.legendItemIdIndex++;
        return {
            legend_item_id: legendItemId,
            block_id: 0,
            ref: { type: 'id', id: el.guid },
            role_spec: {
                annotation_type: "color" /* ApiV2Annotations.Color */,
                role: 'pivot_annotation',
                direction,
            },
        };
    });
    // The request is only for measuresReq, we do not request annotations for measurements.
    const backgroundColorsAnnotations = backgroundColors
        .filter(({ targetFieldGuid, colorFieldGuid, isContinuous }) => {
        var _a;
        const isDimensionFieldExistsInRequest = isContinuous || typeof usedFieldsMap[colorFieldGuid] !== 'undefined';
        return (((_a = usedFieldsMap[targetFieldGuid]) === null || _a === void 0 ? void 0 : _a.role) === 'pivot_measure' &&
            isDimensionFieldExistsInRequest &&
            // TODO: CHARTS-7124
            // Now the backend fails with 500 when the helmet is in the measure names annotations.
            // Therefore, we made the coloring on our own. After backend corrects,
            // you will need to switch to a general approach and remove the filter here
            colorFieldGuid !== shared_1.PseudoFieldTitle.MeasureNames);
    })
        .map(({ colorFieldGuid, targetFieldGuid }) => {
        var _a, _b;
        const legendItemId = typeof ((_a = usedFieldsMap[colorFieldGuid]) === null || _a === void 0 ? void 0 : _a.legendItemId) !== 'undefined'
            ? (_b = usedFieldsMap[colorFieldGuid]) === null || _b === void 0 ? void 0 : _b.legendItemId
            : legendItemCounter.legendItemIdIndex++;
        return {
            legend_item_id: legendItemId,
            block_id: 0,
            ref: { type: 'id', id: colorFieldGuid },
            role_spec: {
                annotation_type: "background-color" /* ApiV2Annotations.BackgroundColor */,
                role: 'pivot_annotation',
                target_legend_item_ids: [usedFieldsMap[targetFieldGuid].legendItemId],
            },
        };
    });
    return [...colorsAnnotations, ...backgroundColorsAnnotations];
};
exports.getAnnotations = getAnnotations;
const getStructureFromField = (field) => {
    const role_spec = field.role_spec
        ? {
            role: field.role_spec.role,
            direction: field.role_spec.direction,
            annotation_type: field.role_spec.annotation_type,
            target_legend_item_ids: field.role_spec.target_legend_item_ids,
        }
        : undefined;
    return {
        legend_item_ids: [field.legend_item_id],
        role_spec,
    };
};
const isFieldsChanged = (meta, fields) => {
    const prevOrder = meta.fieldOrder || [];
    const isInvisibleMeasureName = prevOrder.length === 1 && fields.length === 0 && prevOrder[0] === 'measure_name';
    if (prevOrder.length !== fields.length && !isInvisibleMeasureName) {
        return true;
    }
    return fields.some((field, index) => {
        const guid = prevOrder[index];
        switch (field.ref.type) {
            case 'id':
                return field.ref.id !== guid;
            case 'measure_name':
                return field.ref.type !== guid;
            default:
                return false;
        }
    });
};
const isSortSupported = (meta, measures, guid) => {
    if (measures > 1) {
        return meta.measureGuid && meta.measureGuid === guid;
    }
    else if (measures === 1 && meta.measureGuid) {
        return meta.measureGuid === guid;
    }
    return true;
};
const getStructureWithSortingFromField = (args) => {
    const { params, field, rowsReq, columnsReq, measuresReq } = args;
    const sortParams = (0, paramsUtils_1.getSortParams)(params);
    const meta = sortParams.meta;
    const structure = getStructureFromField(field);
    if (!meta || (0, isEmpty_1.default)(meta) || !('id' in field.ref)) {
        return structure;
    }
    const { column, row } = meta;
    const isColumnExists = !(0, isEmpty_1.default)(column);
    const isRowExists = !(0, isEmpty_1.default)(row);
    const sorting = {};
    const isRowFieldsChanged = isFieldsChanged(row, rowsReq);
    const isColumnFieldsChanged = isFieldsChanged(column, columnsReq);
    const isColumnSortSupported = Boolean(isSortSupported(column, measuresReq.length, field.ref.id));
    const isRowSortSupported = Boolean(isSortSupported(row, measuresReq.length, field.ref.id));
    if (!isColumnFieldsChanged &&
        isColumnExists &&
        column.nextSortDirection &&
        isColumnSortSupported) {
        sorting.column = {
            header_values: column.path.map((value) => ({ value })),
            role_spec: {
                role: column.role,
            },
            direction: column.nextSortDirection,
        };
    }
    if (!isRowFieldsChanged && isRowExists && row.nextSortDirection && isRowSortSupported) {
        sorting.row = {
            header_values: row.path.map((value) => ({ value })),
            role_spec: {
                role: row.role,
            },
            direction: row.nextSortDirection,
        };
    }
    structure.role_spec = {
        ...structure.role_spec,
        sorting: (0, isEmpty_1.default)(sorting) ? undefined : sorting,
    };
    return structure;
};
const getPivotStructure = ({ columnsReq, measuresReq, rowsReq, annotations, params, totals, }) => {
    // PivotStructure is a mapping of elements from columns, measures and rows
    // legend_item_ids stores the field id from each block.
    return [
        ...columnsReq.map(getStructureFromField),
        ...rowsReq.map(getStructureFromField),
        ...measuresReq.map((field) => {
            return getStructureWithSortingFromField({
                field,
                params,
                rowsReq,
                columnsReq,
                measuresReq,
                totals,
            });
        }),
        ...annotations.map(getStructureFromField),
    ];
};
exports.getPivotStructure = getPivotStructure;
