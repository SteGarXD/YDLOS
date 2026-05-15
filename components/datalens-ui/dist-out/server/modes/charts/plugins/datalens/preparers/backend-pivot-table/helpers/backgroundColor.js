"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorizePivotTableByFieldBackgroundSettings = exports.prepareBackgroundColorSettings = exports.colorizePivotTableHeaderByBackgroundSettings = void 0;
const shared_1 = require("../../../../../../../../shared");
const constants_1 = require("../../../../../../../constants");
const color_helpers_1 = require("../../../utils/color-helpers");
const constants_2 = require("../../../utils/constants");
const misc_1 = require("../../helpers/backgroundSettings/misc");
const misc_2 = require("../../../../constants/misc");
const misc_3 = require("./misc");
const getContinuousColorValue = (colorValue) => {
    if (colorValue === undefined ||
        colorValue === null ||
        colorValue === '' ||
        isNaN(Number(colorValue))) {
        return null;
    }
    return Number(colorValue);
};
const getDiscreteColorValue = (args) => {
    const { colorValue, settings, customColorPalettes, availablePalettes, defaultColorPaletteId } = args;
    const mountedColors = settings.paletteState.mountedColors;
    const palette = settings.paletteState.palette;
    if (!mountedColors || !colorValue) {
        return null;
    }
    const colorIndex = mountedColors[colorValue];
    if (!colorIndex) {
        return null;
    }
    return (0, constants_2.getColor)(Number(colorIndex), (0, constants_1.selectServerPalette)({
        palette,
        customColorPalettes,
        availablePalettes,
        defaultColorPaletteId,
    }));
};
const colorizePivotTableHeaderByBackgroundSettings = ({ backgroundSettings, cell, cellValue, parents, isTotal, loadedColorPalettes, availablePalettes, defaultColorPaletteId, }) => {
    if (isTotal) {
        return {};
    }
    if (backgroundSettings &&
        backgroundSettings.enabled &&
        backgroundSettings.settings.paletteState) {
        let colorValue = getDiscreteColorValue({
            colorValue: cellValue,
            settings: backgroundSettings.settings,
            customColorPalettes: loadedColorPalettes,
            availablePalettes,
            defaultColorPaletteId,
        });
        if (!colorValue) {
            const parentNames = Object.keys(parents);
            parentNames.forEach((parentName) => {
                if (colorValue) {
                    return;
                }
                colorValue = getDiscreteColorValue({
                    colorValue: parentName,
                    settings: backgroundSettings.settings,
                    customColorPalettes: loadedColorPalettes,
                    availablePalettes,
                    defaultColorPaletteId,
                });
            });
        }
        if (colorValue) {
            return {
                ...cell.css,
                backgroundColor: colorValue,
                color: '#000000',
            };
        }
    }
    return {};
};
exports.colorizePivotTableHeaderByBackgroundSettings = colorizePivotTableHeaderByBackgroundSettings;
const prepareBackgroundColorSettings = (args) => {
    const { annotationsMap, rowsData, fieldsItemIdMap, fieldDict, settingsByField, availablePalettes, defaultColorPaletteId, } = args;
    if (!rowsData.length) {
        return {
            discreteColorsByField: {},
            continuousColorsByField: {},
            continuousFieldConfig: {},
        };
    }
    const colorValuesByField = {};
    const discreteColorsByField = {};
    const continuousColorsByField = {};
    const continuousFieldConfig = {};
    rowsData.forEach((row) => {
        row.values.forEach((cellValues) => {
            var _a;
            if (!cellValues) {
                return;
            }
            const datasetField = (0, misc_3.getDatasetFieldFromPivotTableValue)(cellValues, fieldsItemIdMap, fieldDict);
            const backgroundSettings = (_a = settingsByField[(datasetField === null || datasetField === void 0 ? void 0 : datasetField.guid) || '']) === null || _a === void 0 ? void 0 : _a.backgroundSettings;
            if (!datasetField || !backgroundSettings) {
                return;
            }
            const backgroundColorAnnotation = (0, misc_3.getAnnotation)(cellValues, annotationsMap, "background-color" /* ApiV2Annotations.BackgroundColor */);
            if (!backgroundColorAnnotation) {
                return;
            }
            const [colorValue] = backgroundColorAnnotation;
            const { settings, colorFieldGuid } = backgroundSettings;
            if (settings.isContinuous) {
                if (!colorValuesByField[colorFieldGuid]) {
                    colorValuesByField[colorFieldGuid] = new Set();
                }
                colorValuesByField[colorFieldGuid].add(colorValue);
                return;
            }
            if (!discreteColorsByField[datasetField.guid]) {
                discreteColorsByField[datasetField.guid] = {};
            }
            discreteColorsByField[datasetField.guid][colorValue] = getDiscreteColorValue({
                colorValue,
                settings,
                customColorPalettes: args.loadedColorPalettes,
                availablePalettes,
                defaultColorPaletteId,
            });
        });
    });
    const fieldSettings = Object.values(settingsByField);
    Array.from(fieldSettings).forEach((fieldSetting) => {
        const backgroundSettings = fieldSetting.backgroundSettings;
        if (!(backgroundSettings === null || backgroundSettings === void 0 ? void 0 : backgroundSettings.settings.isContinuous)) {
            return;
        }
        const guid = backgroundSettings.colorFieldGuid;
        const colorValues = colorValuesByField[guid];
        if (!colorValues) {
            return;
        }
        const fieldColorValues = Array.from(colorValues);
        continuousColorsByField[guid] = {};
        const nilValue = backgroundSettings.settings.gradientState.nullMode === shared_1.GradientNullModes.AsZero
            ? 0
            : null;
        const colorValuesWithoutNull = fieldColorValues.reduce((acc, cv) => {
            const colorValue = cv === null ? nilValue : cv;
            if (colorValue !== null) {
                acc.push(Number(colorValue));
            }
            return acc;
        }, []);
        const min = Math.min(...colorValuesWithoutNull);
        const max = Math.max(...colorValuesWithoutNull);
        const gradientState = backgroundSettings.settings.gradientState;
        const baseGradient = (0, misc_1.getCurrentBackgroundGradient)(gradientState, args.loadedColorPalettes);
        const useGradient = gradientState.useGradient !== false;
        const gradientColorsHex = !useGradient &&
            gradientState.discreteColorLow != null &&
            gradientState.discreteColorMid != null &&
            gradientState.discreteColorHigh != null
            ? [
                gradientState.discreteColorLow,
                gradientState.discreteColorMid,
                gradientState.discreteColorHigh,
            ]
            : baseGradient.colors || [];
        const chartColorsConfig = {
            ...gradientState,
            colors: [],
            loadedColorPalettes: args.loadedColorPalettes,
            gradientColors: gradientColorsHex,
            availablePalettes,
            useGradient,
        };
        continuousFieldConfig[guid] = { min, max, config: chartColorsConfig };
        fieldColorValues.forEach((value) => {
            const colorValue = getContinuousColorValue(value);
            if (colorValue === null &&
                backgroundSettings.settings.gradientState.nullMode !== shared_1.GradientNullModes.AsZero) {
                return;
            }
            const color = (0, color_helpers_1.colorizePivotTableCell)(colorValue, chartColorsConfig, [min, max]);
            continuousColorsByField[guid][String(value)] = (color === null || color === void 0 ? void 0 : color.backgroundColor) || null;
        });
    });
    return { continuousColorsByField, discreteColorsByField, continuousFieldConfig };
};
exports.prepareBackgroundColorSettings = prepareBackgroundColorSettings;
const colorizePivotTableByFieldBackgroundSettings = (args) => {
    const { settingsByField, rows, annotationsMap, rowHeaderLength, rowsData, fieldDict, fieldsItemIdMap, loadedColorPalettes, availablePalettes, defaultColorPaletteId, } = args;
    const { discreteColorsByField, continuousColorsByField, continuousFieldConfig } = (0, exports.prepareBackgroundColorSettings)({
        rowsData,
        fieldDict,
        fieldsItemIdMap,
        annotationsMap,
        settingsByField,
        loadedColorPalettes,
        availablePalettes,
        defaultColorPaletteId,
    });
    rows.forEach((row) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        for (let i = rowHeaderLength; i < row.cells.length; i++) {
            const cell = row.cells[i];
            const isGrandTotalCell = ((_a = row.cells[0]) === null || _a === void 0 ? void 0 : _a.isTotalCell) && i === row.cells.length - 1;
            const fieldGuid = cell.fieldId || (cell.id ? (0, misc_3.parsePivotTableCellId)(cell.id).guid : '');
            if (!fieldGuid) {
                continue;
            }
            const backgroundColorSettings = (_b = settingsByField[fieldGuid]) === null || _b === void 0 ? void 0 : _b.backgroundSettings;
            if (!backgroundColorSettings) {
                continue;
            }
            const preset = backgroundColorSettings.cellStylePreset;
            if (preset === 'trafficLight') {
                if (!isGrandTotalCell) {
                    cell.custom = { ...(cell.custom || {}), trafficLightPercent: true };
                }
                continue;
            }
            if (preset === 'turquoise') {
                // YDL OS: Млн. р в итогах не окрашивать (ни в столбце справа, ни в строке внизу)
                if (!((_c = row.cells[0]) === null || _c === void 0 ? void 0 : _c.isTotalCell)) {
                    cell.custom = { ...(cell.custom || {}), turquoiseMeasure: true };
                }
                continue;
            }
            const { settings, colorFieldGuid } = backgroundColorSettings;
            const colorKey = cell.colorKey;
            if (!colorKey &&
                backgroundColorSettings.settings.gradientState.nullMode !== shared_1.GradientNullModes.AsZero) {
                continue;
            }
            const datasetField = fieldDict[fieldGuid];
            let backgroundColor;
            const continuousByGuid = continuousColorsByField[colorFieldGuid];
            if (settings.isContinuous && continuousByGuid) {
                backgroundColor = continuousByGuid[String(colorKey)];
                // YDL OS: итоги справа и внизу — окрашивать как в теле; если значения нет в карте (сумма/среднее), достраиваем по min/max
                const fieldConfig = continuousFieldConfig[colorFieldGuid];
                if (backgroundColor === undefined &&
                    fieldConfig &&
                    colorKey !== undefined &&
                    colorKey !== null &&
                    colorKey !== '') {
                    const num = Number(colorKey);
                    if (!Number.isNaN(num)) {
                        const { min, max, config } = fieldConfig;
                        const color = (0, color_helpers_1.colorizePivotTableCell)(num, config, [min, max]);
                        backgroundColor = (_d = color === null || color === void 0 ? void 0 : color.backgroundColor) !== null && _d !== void 0 ? _d : null;
                    }
                }
            }
            else if (settings.paletteState && discreteColorsByField[fieldGuid]) {
                const discreteColorsByCellValue = discreteColorsByField[fieldGuid];
                backgroundColor = discreteColorsByCellValue[String(colorKey)];
            }
            else if (
            // TODO: CHARTS-7124
            // Now the backend fail with 500 when the helmet is in the measure names annotations.
            // Therefore, we made the coloring on our own. After backend corrects,
            // you will need to switch to a general approach and remove if here
            backgroundColorSettings.colorFieldGuid === shared_1.PseudoFieldTitle.MeasureNames &&
                datasetField) {
                const measureName = (0, shared_1.getFakeTitleOrTitle)(datasetField);
                backgroundColor = getDiscreteColorValue({
                    colorValue: measureName,
                    settings,
                    customColorPalettes: loadedColorPalettes,
                    availablePalettes,
                    defaultColorPaletteId,
                });
            }
            // YDL OS: пересечение итог/итого и Млн. р в любых итогах — не окрашивать
            if (isGrandTotalCell) {
                backgroundColor = undefined;
            }
            if (((_e = row.cells[0]) === null || _e === void 0 ? void 0 : _e.isTotalCell) && preset === 'turquoise') {
                backgroundColor = undefined;
            }
            if (backgroundColor) {
                cell.css = {
                    ...cell.css,
                    color: '#000000',
                    backgroundColor,
                };
            }
        }
        // YDL OS: цвет по настройкам (градиент/палитра/пресет). Пресет «Бирюзовый» — в настройках поля сводной (Пресет заливки ячеек).
        // YDL OS: цвета по скринам — только тело; шапка и блок ИТОГО внизу — светло-серые.
        // Итоговый столбец справа: фон как у скрытого measure names (#cbe0ff); ЗПК % — по градиенту; Млн. р — тот же #cbe0ff.
        const isBodyRow = !((_f = row.cells[0]) === null || _f === void 0 ? void 0 : _f.isTotalCell);
        if (isBodyRow) {
            for (let i = 0; i < row.cells.length; i++) {
                const c = row.cells[i];
                if (!c)
                    continue;
                if (i === row.cells.length - 1) {
                    // ИТОГО справа: градиент (ЗПК %) не трогаем, остальное — цвет measure names
                    const fieldGuid = c.fieldId || (c.id ? (0, misc_3.parsePivotTableCellId)(c.id).guid : '');
                    const isGradientMeasure = (_j = (_h = (_g = settingsByField[fieldGuid]) === null || _g === void 0 ? void 0 : _g.backgroundSettings) === null || _h === void 0 ? void 0 : _h.settings) === null || _j === void 0 ? void 0 : _j.isContinuous;
                    if (!isGradientMeasure) {
                        c.css = {
                            ...(c.css || {}),
                            backgroundColor: misc_2.TABLE_BODY_COLUMN_ITOGO_RIGHT_BG,
                        };
                    }
                    continue;
                }
                if ((_k = c.css) === null || _k === void 0 ? void 0 : _k.backgroundColor)
                    continue;
                if (i === 0) {
                    c.css = {
                        ...(c.css || {}),
                        backgroundColor: misc_2.TABLE_BODY_COLUMN_REYS_BG,
                        color: misc_2.TABLE_BODY_COLUMN_REYS_COLOR,
                    };
                }
                else if (i === 1) {
                    c.css = { ...(c.css || {}), backgroundColor: misc_2.TABLE_BODY_COLUMN_NAPR_BG };
                }
                else if (i < rowHeaderLength) {
                    c.css = {
                        ...(c.css || {}),
                        backgroundColor: misc_2.TABLE_BODY_COLUMN_MEASURE_NAMES_BG,
                    };
                }
            }
        }
        else {
            // YDL OS: в блоке ИТОГО внизу — правый столбец (ИТОГО справа) тем же фоном, что и тело столбца (#cbe0ff), не серым
            const lastIdx = row.cells.length - 1;
            const c = row.cells[lastIdx];
            if (c) {
                const fieldGuid = c.fieldId || (c.id ? (0, misc_3.parsePivotTableCellId)(c.id).guid : '');
                const isGradientMeasure = (_o = (_m = (_l = settingsByField[fieldGuid]) === null || _l === void 0 ? void 0 : _l.backgroundSettings) === null || _m === void 0 ? void 0 : _m.settings) === null || _o === void 0 ? void 0 : _o.isContinuous;
                if (!isGradientMeasure) {
                    c.css = {
                        ...(c.css || {}),
                        backgroundColor: misc_2.TABLE_BODY_COLUMN_ITOGO_RIGHT_BG,
                    };
                }
            }
        }
    });
};
exports.colorizePivotTableByFieldBackgroundSettings = colorizePivotTableByFieldBackgroundSettings;
