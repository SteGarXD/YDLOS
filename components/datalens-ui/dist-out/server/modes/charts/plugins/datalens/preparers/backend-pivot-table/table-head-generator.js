"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableHead = exports.getHeaderCellMetadata = exports.getRowHeaderCellMetadata = void 0;
exports.mapColumnsToHeadCellData = mapColumnsToHeadCellData;
const shared_1 = require("../../../../../../../shared");
const misc_1 = require("../../../constants/misc");
const misc_helpers_1 = require("../../utils/misc-helpers");
const columnSettings_1 = require("../helpers/columnSettings");
const misc_2 = require("./constants/misc");
const backgroundColor_1 = require("./helpers/backgroundColor");
const misc_3 = require("./helpers/misc");
const sort_1 = require("./helpers/sort");
const getRowHeaderCellMetadata = (args) => {
    var _a;
    const { defaultColorPaletteId } = args;
    const [value, legendItemId] = args.pivotDataCellValue;
    const pivotField = args.fieldsItemIdMap[legendItemId];
    const isMeasureName = pivotField.id === misc_2.MEASURE_NAME_PSEUDO_ID;
    const fieldGuidOrTitle = isMeasureName ? value.replace('title-', '') : pivotField.id;
    const field = args.fieldDict[fieldGuidOrTitle];
    const cell = {
        value,
        css: args.isTotalHeader ? misc_1.TABLE_TOTALS_STYLES : undefined,
        isTotalCell: args.isTotalHeader,
    };
    if (!field) {
        return cell;
    }
    const columnSettingsFieldId = isMeasureName ? pivotField.title : fieldGuidOrTitle;
    const backgroundSettings = (_a = args.settingsByField[columnSettingsFieldId]) === null || _a === void 0 ? void 0 : _a.backgroundSettings;
    const cellValue = (0, misc_3.getCellValueForHeader)(value, {
        pivotField,
        datasetField: field,
    });
    cell.css = (0, backgroundColor_1.colorizePivotTableHeaderByBackgroundSettings)({
        backgroundSettings,
        cell,
        parents: args.parents,
        cellValue,
        isTotal: Boolean(args.isTotalHeader),
        loadedColorPalettes: args.loadedColorPalettes,
        availablePalettes: args.availablePalettes,
        defaultColorPaletteId,
    });
    if (isMeasureName) {
        cell.value = field.fakeTitle || cell.value;
        return cell;
    }
    // Formatting a column cell
    if ((0, misc_helpers_1.isNumericalDataType)(field.data_type)) {
        cell.type = 'number';
        cell.fieldId = field.guid;
        if (value !== null) {
            cell.value = isNaN(Number(value)) ? value : Number(value);
            cell.formattedValue = (0, misc_helpers_1.chartKitFormatNumberWrapper)(cell.value, {
                lang: 'ru',
                ...(0, shared_1.getFormatOptions)(field),
            });
        }
    }
    else if ((0, shared_1.isDateField)(field) && value) {
        cell.formattedValue = (0, misc_helpers_1.formatDate)({
            valueType: field.data_type,
            value,
            format: field.format,
        });
    }
    return cell;
};
exports.getRowHeaderCellMetadata = getRowHeaderCellMetadata;
function getCellType(field) {
    if (!field) {
        return undefined;
    }
    if ((0, misc_helpers_1.isNumericalDataType)(field.data_type)) {
        return 'number';
    }
    if ((0, shared_1.isDateField)(field)) {
        return 'date';
    }
    return undefined;
}
const getHeaderCellMetadata = (args) => {
    var _a, _b, _c;
    const { defaultColorPaletteId } = args;
    const [name, legendItemId] = args.pivotDataCellValue;
    const pivotField = args.fieldsItemIdMap[legendItemId];
    const isMeasureName = pivotField.id === misc_2.MEASURE_NAME_PSEUDO_ID;
    const fieldGuidOrTitle = isMeasureName ? name.replace('title-', '') : pivotField.id;
    const field = args.fieldDict[fieldGuidOrTitle];
    const pseudoFieldCellValue = (field === null || field === void 0 ? void 0 : field.fakeTitle) || name;
    const cell = {
        name,
        css: args.isTotalHeader ? misc_1.TABLE_TOTALS_STYLES : undefined,
        isTotalCell: args.isTotalHeader,
    };
    const measureItem = args.measures[0];
    const isSortable = args.sortMetaData.isSortByColumnAllowed;
    // We fill in the column-specific data so that sorting works.
    cell.type = getCellType(measureItem);
    if (measureItem && ((0, misc_helpers_1.isNumericalDataType)(measureItem.data_type) || (0, shared_1.isDateField)(measureItem))) {
        cell.sortable = isSortable;
    }
    if (!field) {
        return cell;
    }
    const columnSettingsFieldId = isMeasureName ? pivotField.title : fieldGuidOrTitle;
    const columnSettings = (_b = (_a = args.settingsByField[columnSettingsFieldId]) === null || _a === void 0 ? void 0 : _a.columnSettings) === null || _b === void 0 ? void 0 : _b.column;
    const widthSettings = columnSettings === null || columnSettings === void 0 ? void 0 : columnSettings.width;
    cell.width = (0, columnSettings_1.getColumnWidthValue)(widthSettings);
    const backgroundSettings = (_c = args.settingsByField[columnSettingsFieldId]) === null || _c === void 0 ? void 0 : _c.backgroundSettings;
    cell.css = (0, backgroundColor_1.colorizePivotTableHeaderByBackgroundSettings)({
        backgroundSettings,
        cell,
        parents: args.parents,
        cellValue: (0, misc_3.getCellValueForHeader)(name, { pivotField, datasetField: field }),
        isTotal: Boolean(args.isTotalHeader),
        loadedColorPalettes: args.loadedColorPalettes,
        availablePalettes: args.availablePalettes,
        defaultColorPaletteId,
    });
    if (isMeasureName) {
        cell.name = pseudoFieldCellValue;
        return cell;
    }
    // Formatting a column cell
    if (cell.name === null) {
        cell.formattedName = String(cell.name);
        cell.sortable = false;
    }
    else if ((0, misc_helpers_1.isNumericalDataType)(field.data_type)) {
        const formatting = (0, shared_1.getFormatOptions)(field);
        cell.formattedName = (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(name), {
            lang: 'ru',
            ...formatting,
        });
    }
    else if ((0, shared_1.isDateField)(field)) {
        cell.name = (0, misc_helpers_1.formatDate)({
            valueType: field.data_type,
            value: name,
            format: field.format,
        });
    }
    else if ((0, shared_1.isMarkupField)(field)) {
        const markupItem = name;
        cell.name = (0, shared_1.markupToRawString)(markupItem);
        cell.markup = markupItem;
    }
    return cell;
};
exports.getHeaderCellMetadata = getHeaderCellMetadata;
const generateTableHead = ({ pivotData, lineHeaderLength, fieldsItemIdMap, fieldDict, measures, isTotalsEnabled, settingsByField, isPaginatorEnabled, loadedColorPalettes, availablePalettes, sortSettings, pivotStructure, pinnedColumns, defaultColorPaletteId, }) => {
    var _a;
    const { columnsMeta, isSortByRowAllowed, isSortByColumnAllowed } = sortSettings;
    const mappedHeadCellData = mapColumnsToHeadCellData(pivotData.columns, columnsMeta);
    const cellId = {
        current: 0,
    };
    const head = mapHeadCellDataToHead({
        data: mappedHeadCellData,
        lineHeaderLength,
        isTotalsEnabled,
        headerMetadataSource: {
            fieldDict,
            fieldsItemIdMap,
            settingsByField,
            measures,
            isPaginatorEnabled,
            loadedColorPalettes,
            availablePalettes,
            defaultColorPaletteId,
        },
        cellId,
        sortMetaData: {
            measureGuid: { guid: '' },
            isSortByRowAllowed,
            isSortByColumnAllowed,
            fieldOrder: [],
        },
        pivotStructure,
    });
    (_a = pivotData.row_dimension_headers) === null || _a === void 0 ? void 0 : _a.forEach((item, index) => {
        var _a, _b, _c, _d;
        if (!head[index]) {
            return;
        }
        let fieldName = item[0][0];
        fieldName = fieldName.startsWith('title-') ? fieldName.replace('title-', '') : fieldName;
        const field = fieldDict[fieldName];
        if (field) {
            fieldName = (0, shared_1.getFakeTitleOrTitle)(field);
            const columnSettings = (_b = (_a = (settingsByField[field.guid] || settingsByField[field.title])) === null || _a === void 0 ? void 0 : _a.columnSettings) === null || _b === void 0 ? void 0 : _b.row;
            const widthSettings = columnSettings === null || columnSettings === void 0 ? void 0 : columnSettings.width;
            if ((0, shared_1.isMeasureName)(field)) {
                head[index].sortable = false;
            }
            const cellType = getCellType(field);
            head[index].width = (0, columnSettings_1.getColumnWidthValue)(widthSettings);
            head[index].id = (0, misc_3.getPivotTableCellId)(field.guid, cellId);
            head[index].type = cellType;
            head[index].fieldId = field.guid;
            if (cellType === 'date') {
                head[index].format = field.format || (0, misc_helpers_1.getDefaultDateFormat)(field.data_type);
            }
            if ((_c = field.hintSettings) === null || _c === void 0 ? void 0 : _c.enabled) {
                head[index].hint = (_d = field.hintSettings) === null || _d === void 0 ? void 0 : _d.text;
            }
        }
        // YDL OS: колонка "Measure Names" — без подписи, как пусто (эталон)
        head[index].name = field && (0, shared_1.isMeasureName)(field) ? '' : fieldName;
        head[index].header = true;
        if (index < pinnedColumns) {
            head[index].pinned = true;
        }
    });
    return head;
};
exports.generateTableHead = generateTableHead;
function mapSubObjectToArray(map) {
    const arr = Object.values(map);
    if (!arr.length) {
        return [];
    }
    return arr.map((item) => {
        const sub = mapSubObjectToArray(item.sub);
        return {
            ...item,
            sub: sub.length ? sub : undefined,
        };
    });
}
function mapColumnsToHeadCellData(columns, columnsSortMeta) {
    const result = {};
    const columnsWithInfo = columns.map((column, index) => {
        return {
            column,
            meta: columnsSortMeta[index],
        };
    });
    _mapColumnsToHeadCellData(columnsWithInfo, result, 0, undefined, columnsSortMeta);
    return mapSubObjectToArray(result);
}
function _mapColumnsToHeadCellData(columns, map, index, parents = {}, columnsSortMeta) {
    const uniqueHeaders = new Set([]);
    const temp = {};
    columns.forEach(({ column, meta }, rowIndex) => {
        var _a, _b;
        if (!column[index]) {
            return;
        }
        const cellData = column[index];
        const cellValue = (0, misc_3.getCellValueForHeader)(cellData[0][0]);
        const previousCellData = (_b = (_a = columns[rowIndex - 1]) === null || _a === void 0 ? void 0 : _a.column) === null || _b === void 0 ? void 0 : _b[index];
        const previousCellValue = previousCellData
            ? (0, misc_3.getCellValueForHeader)(previousCellData[0][0])
            : undefined;
        let cellValueKey = `_${cellValue}__${index}`;
        if (temp[cellValueKey] && (column.length === 1 || previousCellValue !== cellValue)) {
            cellValueKey += `_${rowIndex}`;
        }
        else if (temp[cellValueKey] && previousCellValue === cellValue) {
            cellValueKey = Array.from(uniqueHeaders)[uniqueHeaders.size - 1];
        }
        if (temp[cellValueKey]) {
            temp[cellValueKey].indexes[rowIndex] = true;
        }
        else {
            temp[cellValueKey] = { cellData, meta, indexes: { [rowIndex]: true } };
        }
        uniqueHeaders.add(cellValueKey);
    });
    Array.from(uniqueHeaders).forEach((key) => {
        const cell = temp[key];
        const { cellData, meta, indexes } = cell;
        const cellValue = cellData[0][0];
        const nextParent = {
            ...parents,
        };
        map[key] = {
            item: cellData,
            sub: {},
            parents,
            columnSortMeta: meta,
        };
        nextParent[(0, misc_3.getCellValueForHeader)(cellValue)] = true;
        const subColumns = columns.filter((_, colIndex) => indexes[colIndex]);
        _mapColumnsToHeadCellData(subColumns, map[key].sub, index + 1, nextParent, columnsSortMeta);
    });
}
function mapHeadCellDataToHead(options) {
    const { data, lineHeaderLength, isTotalsEnabled, headerMetadataSource, cellId, sortMetaData, isTotalSubHeader = false, path = [], pivotStructure, } = options;
    const head = data.map((item, index) => {
        var _a;
        const row = item.item;
        const pivotDataCellValue = row[0];
        const [value, legendItemId, pivotItemId] = pivotDataCellValue;
        const field = headerMetadataSource.fieldsItemIdMap[legendItemId];
        const isMeasure = field.item_type === 'measure_name';
        const fieldGuid = isMeasure ? value.replace('title-', '') : field.id;
        let datasetField = headerMetadataSource.fieldDict[fieldGuid];
        const isTotalHeader = isTotalSubHeader || (isTotalsEnabled && field.item_type === 'placeholder');
        if (isTotalHeader && !datasetField) {
            const pivotItem = pivotStructure.find((item) => item.pivot_item_id === pivotItemId);
            pivotItem === null || pivotItem === void 0 ? void 0 : pivotItem.legend_item_ids.forEach((id) => {
                var _a;
                const guid = (_a = headerMetadataSource.fieldsItemIdMap[id]) === null || _a === void 0 ? void 0 : _a.id;
                if (headerMetadataSource.fieldDict[guid]) {
                    datasetField = headerMetadataSource.fieldDict[guid];
                }
            });
        }
        // YDL OS: заголовок "Measure Names" скрыт — как пусто (эталон)
        let result = {
            id: (0, misc_3.getPivotTableCellId)(datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid, cellId),
            sortable: true,
            name: isMeasure ? '' : value,
            allowGroupSort: true,
        };
        const measures = isMeasure
            ? headerMetadataSource.measures.slice(index)
            : headerMetadataSource.measures;
        const datasetFieldGuid = (datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid) || '';
        let fieldOrderItem;
        if ((0, shared_1.isMeasureField)(datasetField)) {
            sortMetaData.measureGuid.guid = datasetField.guid;
            fieldOrderItem = 'measure_name';
        }
        else {
            fieldOrderItem = datasetFieldGuid;
        }
        if (item.sub) {
            result.sub = mapHeadCellDataToHead({
                data: item.sub,
                lineHeaderLength: 0,
                isTotalsEnabled,
                headerMetadataSource: { ...headerMetadataSource, measures },
                cellId,
                sortMetaData: {
                    ...sortMetaData,
                    fieldOrder: [...sortMetaData.fieldOrder, fieldOrderItem],
                },
                isTotalSubHeader: isTotalHeader,
                path: [...path, value],
                pivotStructure,
            });
        }
        else if (item.columnSortMeta && sortMetaData.isSortByColumnAllowed) {
            result.custom = (0, sort_1.getSortMeta)({
                meta: item.columnSortMeta,
                path: [...path, value],
                measureGuid: sortMetaData.measureGuid.guid,
                fieldOrder: [...sortMetaData.fieldOrder, fieldOrderItem],
            });
        }
        result = {
            ...result,
            ...(0, exports.getHeaderCellMetadata)({
                ...headerMetadataSource,
                pivotDataCellValue,
                measures,
                isTotalHeader,
                parents: item.parents,
                sortMetaData,
            }),
        };
        // PIVOT-REQUIREMENTS-EXTENDED: one "ИТОГО" header cell spanning both levels (no sub)
        if (isTotalHeader && ((_a = item.sub) === null || _a === void 0 ? void 0 : _a.length) === 1) {
            const childItem = item.sub[0];
            const childCellValue = childItem.item[0];
            const childLegendId = childCellValue[1];
            const childField = headerMetadataSource.fieldsItemIdMap[childLegendId];
            if ((childField === null || childField === void 0 ? void 0 : childField.item_type) === 'placeholder') {
                result.sub = undefined;
            }
        }
        return result;
    });
    const useGroup = lineHeaderLength > 1;
    const emptyHead = head.length === 0;
    const isLastColumnMeasure = headerMetadataSource.measures.length;
    const headCell = {
        autogroup: false,
        group: useGroup,
        name: '',
        sortable: true,
        allowGroupSort: useGroup,
    };
    if (emptyHead && isLastColumnMeasure) {
        headCell.type = 'number';
    }
    let iterator = lineHeaderLength;
    while (iterator--) {
        // Next, the HeadCell object is mutated to put column headers with rows
        // Therefore, we make a copy
        head.unshift({
            ...headCell,
        });
    }
    return head;
}
