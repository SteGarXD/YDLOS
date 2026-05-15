import type {
    ColorPalette,
    FieldGuid,
    Palette,
    ServerField,
    TableFieldBackgroundSettings,
} from '../../../../../../../../shared';
import {
    ApiV2Annotations,
    GradientNullModes,
    PseudoFieldTitle,
    getFakeTitleOrTitle,
} from '../../../../../../../../shared';
import {selectServerPalette} from '../../../../../../../constants';
import {
    TABLE_BODY_BORDER_COLOR,
    TABLE_BODY_COLUMN_ITOGO_RIGHT_BG,
    TABLE_BODY_COLUMN_MEASURE_NAMES_BG,
    TABLE_BODY_COLUMN_NAPR_BG,
    TABLE_BODY_COLUMN_REYS_BG,
    TABLE_BODY_COLUMN_REYS_COLOR,
    TABLE_HEADER_FOOTER_BG,
    TABLE_HEADER_FOOTER_BORDER_COLOR,
    TABLE_MEASURE_MLN_TURQUOISE_BG,
    TABLE_ZPK_HIGH_BG,
    TABLE_ZPK_LOW_BG,
    TABLE_ZPK_MID_BG,
} from '../../../../constants/misc';
import type {ChartColorsConfig} from '../../../types';
import {colorizePivotTableCell} from '../../../utils/color-helpers';
import {getColor} from '../../../utils/constants';
import {getCurrentBackgroundGradient} from '../../helpers/backgroundSettings/misc';
import type {
    AnnotationsMap,
    CellValue,
    ChartkitCell,
    ChartkitHeadCell,
    PivotDataRows,
    PivotField,
    PivotTableFieldSettings,
} from '../types';

import {getAnnotation, getDatasetFieldFromPivotTableValue, parsePivotTableCellId} from './misc';

/** YDL OS: те же пороги, что и на фронте — цвет в cell.css с бэкенда. */
function getTrafficLightBg(value: unknown): string | undefined {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : Number(value);
    if (Number.isNaN(num)) return undefined;
    if (num <= 59) return TABLE_ZPK_LOW_BG;
    if (num <= 79) return TABLE_ZPK_MID_BG;
    return TABLE_ZPK_HIGH_BG;
}

/** Пустое значение — не окрашивать пресетами (ЗПК %, Млн. р). 0 и 0,00 считаем пустыми. */
function isEmptyForPreset(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number') return Number.isNaN(value) || value === 0;
    if (typeof value === 'string') {
        const n = Number(value.replace(',', '.').trim());
        return Number.isNaN(n) || n === 0;
    }
    return false;
}

const getContinuousColorValue = (colorValue: undefined | null | string | number): number | null => {
    if (
        colorValue === undefined ||
        colorValue === null ||
        colorValue === '' ||
        isNaN(Number(colorValue))
    ) {
        return null;
    }

    return Number(colorValue);
};

const getDiscreteColorValue = (args: {
    colorValue: undefined | null | string;
    settings: TableFieldBackgroundSettings['settings'];
    customColorPalettes: Record<string, ColorPalette>;
    availablePalettes: Record<string, Palette>;
    defaultColorPaletteId: string;
}): string | null => {
    const {colorValue, settings, customColorPalettes, availablePalettes, defaultColorPaletteId} =
        args;
    const mountedColors = settings.paletteState.mountedColors;
    const palette = settings.paletteState.palette;

    if (!mountedColors || !colorValue) {
        return null;
    }

    const colorIndex = mountedColors[colorValue];

    if (!colorIndex) {
        return null;
    }

    return getColor(
        Number(colorIndex),
        selectServerPalette({
            palette,
            customColorPalettes,
            availablePalettes,
            defaultColorPaletteId,
        }),
    );
};

type ColorizePivotTableHeaderByBackgroundSettings = {
    cell: ChartkitCell | ChartkitHeadCell;
    backgroundSettings: TableFieldBackgroundSettings | undefined;
    cellValue: string;
    parents: Record<string, boolean>;
    isTotal: boolean;
    loadedColorPalettes: Record<string, ColorPalette>;
    availablePalettes: Record<string, Palette>;
    defaultColorPaletteId: string;
};
export const colorizePivotTableHeaderByBackgroundSettings = ({
    backgroundSettings,
    cell,
    cellValue,
    parents,
    isTotal,
    loadedColorPalettes,
    availablePalettes,
    defaultColorPaletteId,
}: ColorizePivotTableHeaderByBackgroundSettings) => {
    if (isTotal) {
        return {};
    }
    if (
        backgroundSettings &&
        backgroundSettings.enabled &&
        backgroundSettings.settings.paletteState
    ) {
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

type PrepareBackgroundColorSettings = {
    rowsData: PivotDataRows[];
    annotationsMap: AnnotationsMap;
    fieldsItemIdMap: Record<number, PivotField>;
    fieldDict: Record<string, ServerField>;
    settingsByField: Record<string, PivotTableFieldSettings>;
    loadedColorPalettes: Record<string, ColorPalette>;
    availablePalettes: Record<string, Palette>;
    defaultColorPaletteId: string;
};

export const prepareBackgroundColorSettings = (args: PrepareBackgroundColorSettings) => {
    const {
        annotationsMap,
        rowsData,
        fieldsItemIdMap,
        fieldDict,
        settingsByField,
        availablePalettes,
        defaultColorPaletteId,
    } = args;

    if (!rowsData.length) {
        return {
            discreteColorsByField: {},
            continuousColorsByField: {},
            continuousFieldConfig: {},
        };
    }

    const colorValuesByField: Record<FieldGuid, Set<null | number | string>> = {};
    const discreteColorsByField: Record<FieldGuid, Record<CellValue, string | null>> = {};
    const continuousColorsByField: Record<FieldGuid, Record<CellValue, string | null>> = {};
    const continuousFieldConfig: Record<
        FieldGuid,
        {min: number; max: number; config: ChartColorsConfig}
    > = {};

    rowsData.forEach((row) => {
        row.values.forEach((cellValues) => {
            if (!cellValues) {
                return;
            }

            const datasetField = getDatasetFieldFromPivotTableValue(
                cellValues,
                fieldsItemIdMap,
                fieldDict,
            );

            const backgroundSettings =
                settingsByField[datasetField?.guid || '']?.backgroundSettings;

            if (!datasetField || !backgroundSettings) {
                return;
            }

            const backgroundColorAnnotation = getAnnotation(
                cellValues,
                annotationsMap,
                ApiV2Annotations.BackgroundColor,
            );

            if (!backgroundColorAnnotation) {
                return;
            }

            const [colorValue] = backgroundColorAnnotation;
            const {settings, colorFieldGuid} = backgroundSettings;

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
        if (!backgroundSettings?.settings.isContinuous) {
            return;
        }

        const guid = backgroundSettings.colorFieldGuid;

        const colorValues = colorValuesByField[guid];

        if (!colorValues) {
            return;
        }

        const fieldColorValues = Array.from(colorValues);

        continuousColorsByField[guid] = {};
        const nilValue =
            backgroundSettings.settings.gradientState.nullMode === GradientNullModes.AsZero
                ? 0
                : null;

        const colorValuesWithoutNull = fieldColorValues.reduce<number[]>((acc, cv) => {
            const colorValue = cv === null ? nilValue : cv;
            if (colorValue !== null) {
                acc.push(Number(colorValue));
            }

            return acc;
        }, []);

        const min = Math.min(...colorValuesWithoutNull);
        const max = Math.max(...colorValuesWithoutNull);

        const gradientState = backgroundSettings.settings.gradientState;
        const baseGradient = getCurrentBackgroundGradient(gradientState, args.loadedColorPalettes);
        const useGradient = gradientState.useGradient !== false;
        const gradientColorsHex =
            !useGradient &&
            gradientState.discreteColorLow !== null &&
            gradientState.discreteColorLow !== undefined &&
            gradientState.discreteColorMid !== null &&
            gradientState.discreteColorMid !== undefined &&
            gradientState.discreteColorHigh !== null &&
            gradientState.discreteColorHigh !== undefined
                ? [
                      gradientState.discreteColorLow,
                      gradientState.discreteColorMid,
                      gradientState.discreteColorHigh,
                  ]
                : (baseGradient.colors as string[]) || [];

        const chartColorsConfig: ChartColorsConfig = {
            ...gradientState,
            colors: [],
            loadedColorPalettes: args.loadedColorPalettes,
            gradientColors: gradientColorsHex,
            availablePalettes,
            useGradient,
        };

        continuousFieldConfig[guid] = {min, max, config: chartColorsConfig};

        fieldColorValues.forEach((value) => {
            const colorValue = getContinuousColorValue(value);
            if (
                colorValue === null &&
                backgroundSettings.settings.gradientState.nullMode !== GradientNullModes.AsZero
            ) {
                return;
            }

            const color = colorizePivotTableCell(colorValue, chartColorsConfig, [min, max]);
            continuousColorsByField[guid][String(value)] = color?.backgroundColor || null;
        });
    });

    return {continuousColorsByField, discreteColorsByField, continuousFieldConfig};
};

type ColorizePivotTableByFieldBackgroundSettings = {
    rows: any[];
    annotationsMap: AnnotationsMap;
    settingsByField: Record<string, PivotTableFieldSettings>;
    rowHeaderLength: number;
    enableFlightLoadByClassPresetStyles?: boolean;
    enableClassicMainFormPresetStyles?: boolean;
    enablePreSalePeriodPresetStyles?: boolean;
    tableCustomization?: {
        bodyBg?: string;
        bodyColor?: string;
        footerBg?: string;
        footerColor?: string;
        borderColor?: string;
        bodyBorderColor?: string;
        footerBorderColor?: string;
        totalBorderColor?: string;
        bodyFontSize?: number;
        footerFontSize?: number;
        bodyFontWeight?: string;
        footerFontWeight?: string;
        rowHeight?: number;
        bodyAlign?: 'left' | 'center' | 'right';
        footerAlign?: 'left' | 'center' | 'right';
        cellPaddingX?: number;
        zebraOddBg?: string;
        zebraEvenBg?: string;
        conditionalRules?: Array<{
            op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
            value?: string | number;
            valueTo?: string | number;
            bg?: string;
            color?: string;
            targetFields?: string[];
            targetZone?: 'header' | 'body' | 'footer' | 'total';
            targetTreeLevel?: number;
            contextContains?: string;
            contextDateFrom?: string;
            contextDateTo?: string;
            logic?: 'AND' | 'OR';
            conditions?: Array<{
                op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                value?: string | number;
                valueTo?: string | number;
            }>;
        }>;
        columnStyles?: Record<
            string,
            {
                width?: number;
                bg?: string;
                color?: string;
                align?: 'left' | 'center' | 'right';
                fontWeight?: string;
            }
        >;
        columnFormats?: Record<string, 'integer' | 'percent1' | 'currency0'>;
        customNumberMasks?: Record<string, string>;
        locale?: string;
        currency?: string;
        suffix?: string;
        stylePriority?: Array<'preset' | 'zone' | 'rule' | 'column'>;
    };

    rowsData: PivotDataRows[];
    fieldsItemIdMap: Record<string, PivotField>;
    fieldDict: Record<string, ServerField>;
    loadedColorPalettes: Record<string, ColorPalette>;
    availablePalettes: Record<string, Palette>;
    defaultColorPaletteId: string;
};

export const colorizePivotTableByFieldBackgroundSettings = (
    args: ColorizePivotTableByFieldBackgroundSettings,
) => {
    if (!args?.rows || !Array.isArray(args.rows)) return;
    // Пустой объект, если не передан — чтобы не терять фиксированную раскраску колонок (рейс, направление, Measure Names, ИТОГО)
    const settingsByField =
        args.settingsByField && typeof args.settingsByField === 'object'
            ? args.settingsByField
            : {};

    const {
        rows,
        annotationsMap,
        rowHeaderLength,
        enableFlightLoadByClassPresetStyles = false,
        enableClassicMainFormPresetStyles = false,
        enablePreSalePeriodPresetStyles = false,
        tableCustomization,
        rowsData,
        fieldDict,
        fieldsItemIdMap,
        loadedColorPalettes,
        availablePalettes,
        defaultColorPaletteId,
    } = args;
    // settingsByField уже задан выше (либо из args, либо {})

    try {
        const stylePriority =
            tableCustomization?.stylePriority || (['preset', 'zone', 'rule', 'column'] as const);
        const mergeByPriority = (layers: Record<string, Record<string, unknown>>) => {
            return stylePriority.reduce(
                (acc, key) => ({...acc, ...(layers[key] || {})}),
                {} as Record<string, unknown>,
            );
        };
        const evaluateCondition = (
            rawValue: unknown,
            rule: {
                op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                value?: string | number;
                valueTo?: string | number;
            },
        ) => {
            const text = String(rawValue ?? '');
            const numberValue = Number(rawValue);
            const left = Number(rule.value);
            const right = Number(rule.valueTo);
            switch (rule.op) {
                case 'gt':
                    return !Number.isNaN(numberValue) && !Number.isNaN(left) && numberValue > left;
                case 'lt':
                    return !Number.isNaN(numberValue) && !Number.isNaN(left) && numberValue < left;
                case 'eq':
                    return text === String(rule.value ?? '');
                case 'between':
                    return (
                        !Number.isNaN(numberValue) &&
                        !Number.isNaN(left) &&
                        !Number.isNaN(right) &&
                        numberValue >= left &&
                        numberValue <= right
                    );
                case 'contains':
                    return text.toLowerCase().includes(String(rule.value ?? '').toLowerCase());
                default:
                    return false;
            }
        };
        const evaluateRule = (
            rawValue: unknown,
            rule: {
                op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                value?: string | number;
                valueTo?: string | number;
                logic?: 'AND' | 'OR';
                conditions?: Array<{
                    op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                    value?: string | number;
                    valueTo?: string | number;
                }>;
            },
        ) => {
            const conditions = Array.isArray(rule.conditions) && rule.conditions.length
                ? rule.conditions
                : [rule];
            return rule.logic === 'OR'
                ? conditions.some((c) => evaluateCondition(rawValue, c))
                : conditions.every((c) => evaluateCondition(rawValue, c));
        };
        const formatByMask = (num: number, mask: string) => {
            const parts = mask.split(';');
            const activeMask =
                num < 0 && parts[1] ? parts[1] : num === 0 && parts[2] ? parts[2] : parts[0] || mask;
            const normalized = activeMask.replace(/\[[^\]]+\]/g, '');
            const decimalPart = normalized.split('.')[1] || '';
            const fractionDigits = decimalPart.replace(/[^0#]/g, '').length;
            const useGrouping = normalized.includes(',');
            const abs = Math.abs(num);
            const formatted = new Intl.NumberFormat(tableCustomization?.locale || 'ru-RU', {
                minimumFractionDigits: decimalPart.includes('0') ? fractionDigits : 0,
                maximumFractionDigits: fractionDigits,
                useGrouping,
            }).format(abs);
            const signed = num < 0 ? `-${formatted}` : formatted;
            return normalized.includes('{value}')
                ? normalized.replace('{value}', signed)
                : normalized.replace(/[#0,\.]+/, signed);
        };
        // YDL OS: название меры с пресетом turquoise (Млн. р) — для строки футера светло-синий фон
        let turquoiseMeasureTitle: string | undefined;
        const turquoiseEntry = Object.entries(settingsByField).find(
            ([, s]) => s?.backgroundSettings?.cellStylePreset === 'turquoise',
        );
        if (turquoiseEntry) {
            const f =
                fieldDict[turquoiseEntry[0]] ||
                Object.values(fieldDict).find(
                    (field) =>
                        field &&
                        (field.title === turquoiseEntry[0] ||
                            getFakeTitleOrTitle(field) === turquoiseEntry[0]),
                );
            turquoiseMeasureTitle = f ? getFakeTitleOrTitle(f) : undefined;
        }

        const {discreteColorsByField, continuousColorsByField, continuousFieldConfig} =
            prepareBackgroundColorSettings({
                rowsData,
                fieldDict,
                fieldsItemIdMap,
                annotationsMap,
                settingsByField,
                loadedColorPalettes,
                availablePalettes,
                defaultColorPaletteId,
            });

        const firstBodyRowIndex = rows.findIndex((r) => !r.cells[0]?.isTotalCell);
        let lastBodyRowIndex = -1;
        for (let i = rows.length - 1; i >= 0; i--) {
            if (!rows[i].cells[0]?.isTotalCell) {
                lastBodyRowIndex = i;
                break;
            }
        }
        rows.forEach((row, rowIndex) => {
            if (!row?.cells || !Array.isArray(row.cells)) return;
            for (let i = rowHeaderLength; i < row.cells.length; i++) {
                const cell: ChartkitCell = row.cells[i];
                const isGrandTotalCell = row.cells[0]?.isTotalCell && i === row.cells.length - 1;

                const fieldGuid =
                    cell.fieldId || (cell.id ? parsePivotTableCellId(cell.id).guid : '');
                if (!fieldGuid) {
                    continue;
                }

                // YDL OS: поиск по guid, title и fakeTitle; fallback — по пресету turquoise среди всех мер (дашборд/чарт)
                const fieldForSettings = fieldDict[fieldGuid];
                let backgroundColorSettings =
                    settingsByField[fieldGuid]?.backgroundSettings ||
                    (fieldForSettings &&
                        settingsByField[fieldForSettings.title]?.backgroundSettings);
                if (!backgroundColorSettings && fieldForSettings) {
                    const fakeTitle = getFakeTitleOrTitle(fieldForSettings);
                    backgroundColorSettings = settingsByField[fakeTitle]?.backgroundSettings;
                }
                if (!backgroundColorSettings && fieldForSettings) {
                    const turquoiseEntry = Object.entries(settingsByField).find(
                        ([, s]) => s?.backgroundSettings?.cellStylePreset === 'turquoise',
                    );
                    if (turquoiseEntry) {
                        const [key] = turquoiseEntry;
                        const turquoiseField =
                            fieldDict[key] ||
                            Object.values(fieldDict).find(
                                (f) => f && (f.title === key || getFakeTitleOrTitle(f) === key),
                            );
                        if (
                            turquoiseField?.guid === fieldGuid ||
                            turquoiseField === fieldForSettings
                        ) {
                            backgroundColorSettings = turquoiseEntry[1]?.backgroundSettings;
                        }
                    }
                }
                // YDL OS: fallback по имени меры из строки — чтобы бирюзовый применялся в теле при пресете «Млн. р»
                if (!backgroundColorSettings && turquoiseMeasureTitle) {
                    const measureNameCell = row.cells[rowHeaderLength - 1];
                    const measureName = String(
                        measureNameCell?.value ?? measureNameCell?.formattedValue ?? '',
                    ).trim();
                    if (measureName === turquoiseMeasureTitle) {
                        const te = Object.entries(settingsByField).find(
                            ([, s]) => s?.backgroundSettings?.cellStylePreset === 'turquoise',
                        );
                        if (te) {
                            backgroundColorSettings = te[1]?.backgroundSettings;
                        }
                    }
                }

                if (!backgroundColorSettings) {
                    continue;
                }

                const preset = backgroundColorSettings.cellStylePreset;
                if (preset === 'trafficLight') {
                    if (!isGrandTotalCell && !isEmptyForPreset(cell.value)) {
                        cell.custom = {...(cell.custom || {}), trafficLightPercent: true};
                        const bg = getTrafficLightBg(cell.value);
                        if (bg) {
                            cell.css = {...(cell.css || {}), backgroundColor: bg, color: '#000000'};
                        }
                    }
                    continue;
                }
                if (preset === 'turquoise') {
                    const isLastColumn = i === row.cells.length - 1;
                    const cv = cell.value;
                    const isCellEmpty =
                        cv === null ||
                        cv === undefined ||
                        cv === '' ||
                        (typeof cv === 'string' && cv.trim() === '');
                    if (!row.cells[0]?.isTotalCell && !isLastColumn && !isCellEmpty) {
                        cell.custom = {...(cell.custom || {}), turquoiseMeasure: true};
                        cell.css = {
                            ...(cell.css || {}),
                            backgroundColor: TABLE_MEASURE_MLN_TURQUOISE_BG,
                            color: '#000000',
                        };
                    }
                    continue;
                }

                const {settings, colorFieldGuid} = backgroundColorSettings;
                const colorKey = cell.colorKey;

                if (
                    !colorKey &&
                    backgroundColorSettings.settings.gradientState.nullMode !==
                        GradientNullModes.AsZero
                ) {
                    continue;
                }

                const datasetField = fieldDict[fieldGuid];

                let backgroundColor: string | undefined | null;
                const continuousByGuid = continuousColorsByField[colorFieldGuid as FieldGuid];
                if (settings.isContinuous && continuousByGuid) {
                    backgroundColor = continuousByGuid[String(colorKey)];
                    // YDL OS: итоги справа и внизу — окрашивать как в теле; если значения нет в карте (сумма/среднее), достраиваем по min/max
                    const fieldConfig = continuousFieldConfig[colorFieldGuid as FieldGuid];
                    if (
                        backgroundColor === undefined &&
                        fieldConfig &&
                        colorKey !== undefined &&
                        colorKey !== null &&
                        colorKey !== ''
                    ) {
                        const num = Number(colorKey);
                        if (!Number.isNaN(num)) {
                            const {min, max, config} = fieldConfig;
                            const color = colorizePivotTableCell(num, config, [min, max]);
                            backgroundColor = color?.backgroundColor ?? null;
                        }
                    }
                } else if (settings.paletteState && discreteColorsByField[fieldGuid as FieldGuid]) {
                    const discreteColorsByCellValue = discreteColorsByField[fieldGuid as FieldGuid];
                    backgroundColor = discreteColorsByCellValue[String(colorKey)];
                } else if (
                    // TODO: CHARTS-7124
                    // Now the backend fail with 500 when the helmet is in the measure names annotations.
                    // Therefore, we made the coloring on our own. After backend corrects,
                    // you will need to switch to a general approach and remove if here
                    backgroundColorSettings.colorFieldGuid === PseudoFieldTitle.MeasureNames &&
                    datasetField
                ) {
                    const measureName = getFakeTitleOrTitle(datasetField);
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
                if (row.cells[0]?.isTotalCell && preset === 'turquoise') {
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

            if (enableFlightLoadByClassPresetStyles || enableClassicMainFormPresetStyles) {
                // YDL OS: цвета по скринам — только тело; шапка и блок ИТОГО внизу — светло-серые.
                // Итоговый столбец справа: фон как у скрытого measure names (#cbe0ff); ЗПК % — по градиенту; Млн. р — тот же #cbe0ff.
                const isBodyRow = !row.cells[0]?.isTotalCell;
                const isLastBodyRow = rowIndex === lastBodyRowIndex;
                if (isBodyRow) {
                    const isFirstBodyRow = rowIndex === firstBodyRowIndex;
                    for (let i = 0; i < row.cells.length; i++) {
                        const c = row.cells[i];
                        if (!c) continue;
                        if (i === row.cells.length - 1) {
                        // ИТОГО справа в теле: ЗПК % — градиент при ненулевом значении; пусто/0 — как колонка заброн/ПКЗ (#cbe0ff)
                            const fieldGuid =
                                c.fieldId || (c.id ? parsePivotTableCellId(c.id).guid : '');
                            const bgSettings = settingsByField[fieldGuid]?.backgroundSettings;
                            const isGradientMeasure = bgSettings?.settings?.isContinuous;
                            const prevBg = c.css?.backgroundColor;
                            const hasTrafficBg =
                                typeof prevBg === 'string' &&
                                [TABLE_ZPK_LOW_BG, TABLE_ZPK_MID_BG, TABLE_ZPK_HIGH_BG].includes(
                                    prevBg,
                                );
                            if (!isGradientMeasure || (!hasTrafficBg && isGradientMeasure)) {
                                c.css = {
                                    ...(c.css || {}),
                                    backgroundColor: TABLE_BODY_COLUMN_ITOGO_RIGHT_BG,
                                };
                            }
                            c.css = {
                                ...(c.css || {}),
                                textAlign: 'right',
                                borderColor: TABLE_BODY_BORDER_COLOR,
                                ...(isFirstBodyRow ? {borderTopColor: '#000000'} : {}),
                                ...(isLastBodyRow ? {borderBottomColor: '#000000'} : {}),
                            };
                            continue;
                        }
                        // Эталон: тело — светло-серые границы; первая/последняя строки тела — чёрная линия сверху/снизу
                        c.css = {
                            ...(c.css || {}),
                            borderColor: TABLE_BODY_BORDER_COLOR,
                            ...(isFirstBodyRow ? {borderTopColor: '#000000'} : {}),
                            ...(isLastBodyRow ? {borderBottomColor: '#000000'} : {}),
                        };
                        if (i === 0 || i === 1) {
                            c.css = {...(c.css || {}), textAlign: 'center', verticalAlign: 'top'};
                        } else if (i >= 2 && i < rowHeaderLength) {
                            c.css = {...(c.css || {}), textAlign: 'left'};
                        } else if (i >= rowHeaderLength) {
                            c.css = {...(c.css || {}), textAlign: 'right'};
                        }
                        // YDL OS: первые три колонки тела — всегда свои цвета (не пропускать из-за существующего фона)
                        if (i === 0) {
                            c.css = {
                                ...(c.css || {}),
                                backgroundColor: TABLE_BODY_COLUMN_REYS_BG,
                                color: TABLE_BODY_COLUMN_REYS_COLOR,
                            };
                        } else if (i === 1) {
                            c.css = {...(c.css || {}), backgroundColor: TABLE_BODY_COLUMN_NAPR_BG};
                        } else if (i >= 2 && i < rowHeaderLength) {
                            c.css = {
                                ...(c.css || {}),
                                backgroundColor: TABLE_BODY_COLUMN_MEASURE_NAMES_BG,
                            };
                        }
                        // Остальные колонки (данные) — фон задан в первом цикле (градиент/светофор/бирюзовый)
                    }
                } else {
                    // YDL OS: блок ИТОГО внизу — весь серый; последняя ячейка (нижний правый угол) тоже серая, как эталон
                    const measureNameCell = row.cells[rowHeaderLength - 1];
                    const measureName = String(
                        measureNameCell?.value ?? measureNameCell?.formattedValue ?? '',
                    ).trim();
                    const isMlnRow = Boolean(
                        turquoiseMeasureTitle && measureName === turquoiseMeasureTitle,
                    );

                    for (let i = 0; i < row.cells.length; i++) {
                        const c = row.cells[i];
                        if (c) {
                            if (!c.css) c.css = {};
                            const existingBg =
                                c.css?.backgroundColor ??
                                (c.css as Record<string, unknown>)?.['background-color'];
                            const isWhite =
                                typeof existingBg === 'string' &&
                                (existingBg.toLowerCase() === '#ffffff' ||
                                    existingBg.toLowerCase() === 'white' ||
                                    existingBg === 'rgb(255, 255, 255)');
                            const keepBg = existingBg && !isWhite;
                            const isLastColumn = i === row.cells.length - 1;
                            const isDataCell = i >= rowHeaderLength;
                            // Эталон: футер целиком серый, включая последнюю ячейку (Млн. р в правом нижнем углу)
                            const bg =
                                i === 0
                                    ? TABLE_HEADER_FOOTER_BG
                                    : isLastColumn
                                      ? keepBg
                                          ? existingBg
                                          : TABLE_HEADER_FOOTER_BG
                                      : isMlnRow && isDataCell
                                        ? TABLE_HEADER_FOOTER_BG
                                        : keepBg
                                          ? existingBg
                                          : TABLE_HEADER_FOOTER_BG;
                            c.css = {
                                ...c.css,
                                backgroundColor: bg,
                                color: (c.css?.color as string) ?? '#000000',
                                borderColor: TABLE_HEADER_FOOTER_BORDER_COLOR,
                                textAlign:
                                    i <= 1 ? 'center' : i < rowHeaderLength ? 'left' : 'right',
                            };
                        }
                    }
                }
            }
            if (enablePreSalePeriodPresetStyles) {
                const isBodyRow = !row.cells[0]?.isTotalCell;
                const isLastColumn = (index: number) => index === row.cells.length - 1;
                for (let i = 0; i < row.cells.length; i++) {
                    const c = row.cells[i];
                    if (!c) continue;
                    const baseCellStyle = {
                        ...(c.css || {}),
                        borderColor: '#b5c7e6',
                    };
                    if (isBodyRow) {
                        if (i < rowHeaderLength) {
                            c.css = {
                                ...baseCellStyle,
                                backgroundColor: '#9fb6df',
                                color: '#1f3f73',
                                fontWeight: i === 0 ? 700 : 600,
                                textAlign: i <= 1 ? 'left' : 'center',
                            };
                        } else if (isLastColumn(i)) {
                            c.css = {
                                ...baseCellStyle,
                                backgroundColor: '#7f9fd3',
                                color: '#ffffff',
                                fontWeight: 700,
                                textAlign: 'right',
                            };
                        } else {
                            c.css = {
                                ...baseCellStyle,
                                backgroundColor: '#aec3e7',
                                color: '#1f3f73',
                                textAlign: 'right',
                            };
                        }
                    } else {
                        c.css = {
                            ...baseCellStyle,
                            backgroundColor: '#7f9fd3',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: i < rowHeaderLength ? 'left' : 'right',
                        };
                    }
                }
            }
            if (tableCustomization) {
                const isBodyRow = !row.cells[0]?.isTotalCell;
                row.cells.forEach((c: ChartkitCell, idx: number) => {
                    if (!c) return;
                    const colStyle = tableCustomization.columnStyles?.[String(idx)] || {};
                    const currentZone =
                        isBodyRow && idx === row.cells.length - 1
                            ? 'total'
                            : isBodyRow
                              ? 'body'
                              : 'footer';
                    const treeLevel = row.cells
                        .slice(0, rowHeaderLength)
                        .filter((cell: ChartkitCell) => String(cell?.value ?? '').trim() !== '').length;
                    const matchedRule = (tableCustomization.conditionalRules || []).find((rule) =>
                        (!rule.targetZone || rule.targetZone === currentZone) &&
                        (typeof rule.targetTreeLevel !== 'number' || rule.targetTreeLevel === treeLevel) &&
                        (!rule.targetFields?.length ||
                            (c.fieldId && rule.targetFields.includes(c.fieldId))) &&
                        (!rule.contextContains ||
                            String(c.value ?? '')
                                .toLowerCase()
                                .includes(rule.contextContains.toLowerCase())) &&
                        (!rule.contextDateFrom ||
                            Number(new Date(c.value as any)) >= Number(new Date(rule.contextDateFrom))) &&
                        (!rule.contextDateTo ||
                            Number(new Date(c.value as any)) <= Number(new Date(rule.contextDateTo))) &&
                        evaluateRule(c.value, rule),
                    );
                    const formatPreset = c.fieldId ? tableCustomization.columnFormats?.[c.fieldId] : undefined;
                    const customMask = c.fieldId
                        ? tableCustomization.customNumberMasks?.[c.fieldId]
                        : undefined;
                    if (formatPreset && typeof c.value === 'number') {
                        const num = Number(c.value);
                        if (!Number.isNaN(num)) {
                            if (formatPreset === 'integer') {
                                c.formattedValue = new Intl.NumberFormat(
                                    tableCustomization.locale || 'ru-RU',
                                    {maximumFractionDigits: 0},
                                ).format(num);
                            } else if (formatPreset === 'percent1') {
                                c.formattedValue = `${num.toFixed(1)}%`;
                            } else if (formatPreset === 'currency0') {
                                c.formattedValue = new Intl.NumberFormat(
                                    tableCustomization.locale || 'ru-RU',
                                    {
                                        style: 'currency',
                                        currency: tableCustomization.currency || 'RUB',
                                        maximumFractionDigits: 0,
                                    },
                                ).format(num);
                            }
                        }
                    }
                    if (customMask && typeof c.value === 'number') {
                        const num = Number(c.value);
                        if (!Number.isNaN(num)) {
                            c.formattedValue = formatByMask(num, customMask)
                                .replace('{suffix}', tableCustomization.suffix || '');
                        }
                    } else if (tableCustomization.suffix && typeof c.formattedValue === 'string') {
                        c.formattedValue = `${c.formattedValue} ${tableCustomization.suffix}`;
                    }
                    const zoneLayer = {
                        ...(isBodyRow && tableCustomization.bodyBg
                            ? {backgroundColor: tableCustomization.bodyBg}
                            : {}),
                        ...(isBodyRow &&
                        rowIndex % 2 === 0 &&
                        tableCustomization.zebraEvenBg
                            ? {backgroundColor: tableCustomization.zebraEvenBg}
                            : {}),
                        ...(isBodyRow &&
                        rowIndex % 2 === 1 &&
                        tableCustomization.zebraOddBg
                            ? {backgroundColor: tableCustomization.zebraOddBg}
                            : {}),
                        ...(isBodyRow && tableCustomization.bodyColor
                            ? {color: tableCustomization.bodyColor}
                            : {}),
                        ...(!isBodyRow && tableCustomization.footerBg
                            ? {backgroundColor: tableCustomization.footerBg}
                            : {}),
                        ...(!isBodyRow && tableCustomization.footerColor
                            ? {color: tableCustomization.footerColor}
                            : {}),
                        ...(tableCustomization.borderColor
                            ? {borderColor: tableCustomization.borderColor}
                            : {}),
                        ...(isBodyRow && tableCustomization.bodyBorderColor
                            ? {borderColor: tableCustomization.bodyBorderColor}
                            : {}),
                        ...(!isBodyRow && tableCustomization.footerBorderColor
                            ? {borderColor: tableCustomization.footerBorderColor}
                            : {}),
                        ...(tableCustomization.totalBorderColor &&
                        idx === row.cells.length - 1
                            ? {borderColor: tableCustomization.totalBorderColor}
                            : {}),
                        ...(isBodyRow && typeof tableCustomization.bodyFontSize === 'number'
                            ? {fontSize: `${tableCustomization.bodyFontSize}px`}
                            : {}),
                        ...(!isBodyRow && typeof tableCustomization.footerFontSize === 'number'
                            ? {fontSize: `${tableCustomization.footerFontSize}px`}
                            : {}),
                        ...(isBodyRow && tableCustomization.bodyFontWeight
                            ? {fontWeight: tableCustomization.bodyFontWeight}
                            : {}),
                        ...(!isBodyRow && tableCustomization.footerFontWeight
                            ? {fontWeight: tableCustomization.footerFontWeight}
                            : {}),
                        ...(isBodyRow && tableCustomization.bodyAlign
                            ? {textAlign: tableCustomization.bodyAlign}
                            : {}),
                        ...(!isBodyRow && tableCustomization.footerAlign
                            ? {textAlign: tableCustomization.footerAlign}
                            : {}),
                        ...(typeof tableCustomization.cellPaddingX === 'number'
                            ? {
                                  paddingLeft: `${tableCustomization.cellPaddingX}px`,
                                  paddingRight: `${tableCustomization.cellPaddingX}px`,
                              }
                            : {}),
                        ...(typeof tableCustomization.rowHeight === 'number'
                            ? {
                                  height: `${tableCustomization.rowHeight}px`,
                                  lineHeight: `${Math.max(
                                      12,
                                      tableCustomization.rowHeight - 6,
                                  )}px`,
                              }
                            : {}),
                    };
                    const ruleLayer = {
                        ...(matchedRule?.bg ? {backgroundColor: matchedRule.bg} : {}),
                        ...(matchedRule?.color ? {color: matchedRule.color} : {}),
                    };
                    const columnLayer = {
                        ...(colStyle.bg ? {backgroundColor: colStyle.bg} : {}),
                        ...(colStyle.color ? {color: colStyle.color} : {}),
                        ...(colStyle.align ? {textAlign: colStyle.align} : {}),
                        ...(colStyle.fontWeight ? {fontWeight: colStyle.fontWeight} : {}),
                    };
                    c.css = {
                        ...(c.css || {}),
                        ...mergeByPriority({
                            preset: {},
                            zone: zoneLayer,
                            rule: ruleLayer,
                            column: columnLayer,
                        }),
                    };
                });
            }
        });
    } catch {
        // YDL OS: при любой ошибке в окраске не ломаем ответ — таблица отдаётся без цветов
    }
};
