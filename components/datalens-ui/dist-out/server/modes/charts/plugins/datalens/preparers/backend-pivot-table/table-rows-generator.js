"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableRows = void 0;
const shared_1 = require("../../../../../../../shared");
const misc_1 = require("../../../constants/misc");
const misc_helpers_1 = require("../../utils/misc-helpers");
const barsSettings_1 = require("../helpers/barsSettings");
const backgroundColor_1 = require("./helpers/backgroundColor");
const color_1 = require("./helpers/color");
const misc_2 = require("./helpers/misc");
const sort_1 = require("./helpers/sort");
const totals_1 = require("./helpers/totals");
const table_head_generator_1 = require("./table-head-generator");
function getRowCellMetadata(args) {
    var _a;
    const { loadedColorPalettes, availablePalettes, annotationsMap, defaultColorPaletteId } = args;
    const [value, legendItemId] = args.pivotDataCellValue[0];
    const pivotField = args.fieldsItemIdMap[legendItemId];
    const fieldGuid = pivotField.id;
    const field = args.fieldDict[fieldGuid];
    const isTotalsRowValue = pivotField.role_spec.role === 'total';
    let colorKey = value;
    const backgroundColorAnnotation = (0, misc_2.getAnnotation)(args.pivotDataCellValue, annotationsMap, "background-color" /* ApiV2Annotations.BackgroundColor */);
    if (backgroundColorAnnotation) {
        const [colorValue] = backgroundColorAnnotation;
        colorKey = colorValue;
    }
    const cell = {
        value,
        colorKey,
        isTotalCell: isTotalsRowValue,
        css: {
            ...(isTotalsRowValue ? misc_1.TABLE_TOTALS_STYLES : {}),
        },
    };
    if (value === null) {
        // YDL OS: пустые ячейки показателей ЗПК % и Млн. р — слегка заметный светло-серый (тело)
        const title = (field === null || field === void 0 ? void 0 : field.fakeTitle) || (field === null || field === void 0 ? void 0 : field.title);
        if (title && ['ЗПК %', 'Млн. р'].includes(String(title))) {
            cell.css = { ...(cell.css || {}), backgroundColor: misc_1.TABLE_EMPTY_MEASURE_CELL_BG };
        }
        return cell;
    }
    if (field.data_type === 'markup') {
        cell.type = 'markup';
    }
    else if ((0, misc_helpers_1.isNumericalDataType)(field.data_type)) {
        cell.type = 'number';
        const barSettings = (_a = args.settingsByField[field.guid]) === null || _a === void 0 ? void 0 : _a.barsSettings;
        if ((0, misc_helpers_1.isTableBarsSettingsEnabled)(field) && barSettings) {
            const { columnValues, options } = barSettings;
            const barValueOptions = (0, barsSettings_1.getBarSettingsValue)({
                field,
                rowValue: value,
                columnValues,
                isTotalCell: isTotalsRowValue,
                availablePalettes,
                loadedColorPalettes,
                defaultColorPaletteId,
            });
            const fullFilledBarSettings = {
                ...barValueOptions,
                ...options,
            };
            Object.assign(cell, fullFilledBarSettings);
        }
        else {
            const formatting = (0, shared_1.getFormatOptions)(field);
            cell.value = Number(value);
            cell.formattedValue = (0, misc_helpers_1.chartKitFormatNumberWrapper)(cell.value, {
                lang: 'ru',
                ...formatting,
            });
        }
    }
    else if ((0, shared_1.isDateField)(field)) {
        cell.type = 'date';
        cell.formattedValue = (0, misc_helpers_1.formatDate)({
            valueType: field.data_type,
            value,
            format: field.format,
        });
    }
    return cell;
}
const generateTableRows = ({ pivotData, fieldsItemIdMap, colorsConfig, colors, fieldDict, isTotalsEnabled, settingsByField, pivotStructure, sortSettings, headerTotalsIndexMap, ChartEditor, defaultColorPaletteId, }) => {
    var _a, _b;
    const { rowsMeta, isSortByRowAllowed } = sortSettings;
    const cellId = { current: 0 };
    const annotationsMap = (0, misc_2.getAnnotationsMap)(pivotStructure);
    const rows = pivotData.rows.reduce((acc, pivotDataRow, rowIndex) => {
        var _a, _b;
        const row = {
            cells: [],
        };
        const headerParentByIndex = {};
        const isTotalsRow = isTotalsEnabled && (0, totals_1.isRowWithTotals)(pivotDataRow.header, fieldsItemIdMap);
        let measureGuid = '';
        const fieldOrder = [];
        let isHeaderContainsMarkup = false;
        pivotDataRow.header.forEach((pivotDataRowValue, headerIndex) => {
            if (!pivotDataRowValue) {
                const emptyCell = {
                    value: '',
                };
                row.cells.push(emptyCell);
                return;
            }
            const datasetField = (0, misc_2.getDatasetFieldFromPivotTableValue)(pivotDataRowValue, fieldsItemIdMap, fieldDict);
            const isMeasure = (0, shared_1.isMeasureField)(datasetField);
            if (datasetField) {
                if (!measureGuid) {
                    measureGuid = isMeasure ? datasetField.guid : '';
                }
                fieldOrder.push(isMeasure ? 'measure_name' : datasetField.guid);
            }
            const path = Object.values(headerParentByIndex);
            const parents = path.reduce((parentsResult, headerValue) => {
                parentsResult[headerValue] = true;
                return parentsResult;
            }, {});
            const [value] = pivotDataRowValue[0];
            const cell = {
                id: (0, misc_2.getPivotTableCellId)(datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid, cellId),
                ...(0, table_head_generator_1.getRowHeaderCellMetadata)({
                    pivotDataCellValue: pivotDataRowValue[0],
                    fieldsItemIdMap,
                    fieldDict,
                    measures: [],
                    isTotalHeader: isTotalsRow && value === '',
                    settingsByField,
                    parents,
                    loadedColorPalettes: colorsConfig.loadedColorPalettes,
                    availablePalettes: colorsConfig.availablePalettes,
                    defaultColorPaletteId,
                }),
            };
            headerParentByIndex[headerIndex] = (0, misc_2.getCellValueForHeader)(value, { datasetField });
            isHeaderContainsMarkup = isHeaderContainsMarkup || (0, shared_1.isMarkupItem)(value);
            const isLastHeader = headerIndex === pivotDataRow.header.length - 1;
            const isSortingAllowed = isSortByRowAllowed &&
                rowsMeta[rowIndex] &&
                datasetField &&
                isLastHeader &&
                !isHeaderContainsMarkup;
            if (isSortingAllowed) {
                if (cell.value === null) {
                    // DLFR-1767 sorting for null values is not supported on the backend yet
                    cell.onClick = {
                        action: 'showMsg',
                        args: {
                            message: ChartEditor.getTranslation('wizard.prepares', 'label_null-sorting-disabled-info'),
                        },
                    };
                }
                else {
                    const sortMeta = (0, sort_1.getSortMeta)({
                        meta: rowsMeta[rowIndex],
                        path: [...path, value],
                        measureGuid,
                        fieldOrder,
                    });
                    cell.sortDirection = sortMeta.currentSortDirection;
                    cell.onClick = {
                        action: 'setParams',
                        args: {
                            _sortRowMeta: JSON.stringify(sortMeta),
                        },
                    };
                }
                cell.css = {
                    ...(cell.css || {}),
                    cursor: 'pointer',
                };
            }
            row.cells.push(cell);
        });
        // YDL OS: название показателя строки для серого фона пустых ячеек ЗПК % / Млн. р
        const lastHeader = ((_a = pivotDataRow.header) === null || _a === void 0 ? void 0 : _a.length)
            ? pivotDataRow.header[pivotDataRow.header.length - 1]
            : null;
        const rowMeasureTitle = lastHeader &&
            ((_b = (0, misc_2.getDatasetFieldFromPivotTableValue)(lastHeader, fieldsItemIdMap, fieldDict)) === null || _b === void 0 ? void 0 : _b.fakeTitle);
        pivotDataRow.values.forEach((pivotDataRowValue, valueIndex) => {
            if (!pivotDataRowValue) {
                const isTotalCell = isTotalsRow || headerTotalsIndexMap[valueIndex];
                const emptyCell = {
                    value: '',
                    css: isTotalCell ? misc_1.TABLE_TOTALS_STYLES : undefined,
                };
                if (!isTotalCell &&
                    rowMeasureTitle &&
                    ['ЗПК %', 'Млн. р'].includes(String(rowMeasureTitle))) {
                    emptyCell.css = { ...(emptyCell.css || {}), backgroundColor: misc_1.TABLE_EMPTY_MEASURE_CELL_BG };
                }
                row.cells.push(emptyCell);
                return;
            }
            const datasetField = (0, misc_2.getDatasetFieldFromPivotTableValue)(pivotDataRowValue, fieldsItemIdMap, fieldDict);
            const cell = {
                id: (0, misc_2.getPivotTableCellId)(datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid, cellId),
                fieldId: datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid,
                ...getRowCellMetadata({
                    pivotDataCellValue: pivotDataRowValue,
                    fieldsItemIdMap,
                    fieldDict,
                    settingsByField,
                    loadedColorPalettes: colorsConfig.loadedColorPalettes,
                    availablePalettes: colorsConfig.availablePalettes,
                    annotationsMap,
                    defaultColorPaletteId,
                }),
            };
            row.cells.push(cell);
        });
        acc.push(row);
        return acc;
    }, []);
    const rowHeaderLength = ((_b = (_a = pivotData.rows[0]) === null || _a === void 0 ? void 0 : _a.header) === null || _b === void 0 ? void 0 : _b.length) || 0;
    (0, backgroundColor_1.colorizePivotTableByFieldBackgroundSettings)({
        annotationsMap,
        rows,
        rowHeaderLength,
        rowsData: pivotData.rows,
        settingsByField,
        fieldDict,
        fieldsItemIdMap,
        loadedColorPalettes: colorsConfig.loadedColorPalettes,
        availablePalettes: colorsConfig.availablePalettes,
        defaultColorPaletteId,
    });
    (0, color_1.colorizePivotTableByColorField)({
        rows,
        colors,
        rowHeaderLength,
        rowsData: pivotData.rows,
        annotationsMap,
        colorsConfig,
    });
    return rows;
};
exports.generateTableRows = generateTableRows;
