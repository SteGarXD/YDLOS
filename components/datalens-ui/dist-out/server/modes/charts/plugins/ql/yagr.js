"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../shared");
const ql_1 = require("../../../../../shared/modules/config/ql");
const axis_helpers_1 = require("../datalens/utils/axis-helpers");
const applyPlaceholderSettingsToYAxis = ({ visualization, placeholderIndex, shared, }) => {
    var _a;
    const stacking = (visualization.id === 'area' && ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.stacking) !== 'off') ||
        visualization.id === 'area100p' ||
        visualization.id === 'column' ||
        visualization.id === 'column100p';
    const scale = {
        normalize: false,
        stacking,
        type: 'linear',
    };
    if (visualization.placeholders && visualization.placeholders[placeholderIndex]) {
        const yPlaceholder = visualization.placeholders[placeholderIndex];
        if (yPlaceholder.settings) {
            if (yPlaceholder.settings.autoscale === false ||
                (yPlaceholder.settings.scale === 'auto' &&
                    yPlaceholder.settings.scaleValue === '0-max')) {
                scale.min = 0;
            }
            else if (yPlaceholder.settings.scale === 'manual') {
                scale.min = Number(yPlaceholder.settings.scaleValue[0]);
                scale.max = Number(yPlaceholder.settings.scaleValue[1]);
            }
        }
    }
    return { scale };
};
function getTitleForAxis(placeholders, axis) {
    var _a;
    const placeholder = placeholders === null || placeholders === void 0 ? void 0 : placeholders.find((p) => p.id === axis);
    if (!(placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings)) {
        return undefined;
    }
    return (_a = (0, axis_helpers_1.getAxisTitle)(placeholder.settings, placeholder.items[0])) !== null && _a !== void 0 ? _a : undefined;
}
exports.default = ({ shared, ChartEditor }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const config = (0, ql_1.mapQlConfigToLatestVersion)(shared, { i18n: ChartEditor.getTranslation });
    const type = (config.visualization.highchartsId || config.visualization.id);
    const percent = config.visualization.id === 'area100p' || config.visualization.id === 'column100p';
    const visualizationId = config.visualization.highchartsId || config.visualization.id;
    const tracking = visualizationId === shared_1.QlVisualizationId.Area ? 'area' : 'sticky';
    const title = ((_a = config.extraSettings) === null || _a === void 0 ? void 0 : _a.titleMode) === 'show' && config.extraSettings.title
        ? { text: config.extraSettings.title }
        : undefined;
    const visualization = config.visualization;
    const { scale: yScale } = applyPlaceholderSettingsToYAxis({
        visualization,
        placeholderIndex: 1,
        shared,
    });
    const { scale: yRightScale } = applyPlaceholderSettingsToYAxis({
        visualization,
        placeholderIndex: 2,
        shared,
    });
    const isLegendEnabled = Boolean(((_b = config.colors) === null || _b === void 0 ? void 0 : _b.length) && ((_c = config.extraSettings) === null || _c === void 0 ? void 0 : _c.legendMode) !== "hide" /* LegendDisplayMode.Hide */);
    const tooltipSum = (_d = config.extraSettings) === null || _d === void 0 ? void 0 : _d.tooltipSum;
    const isTooltipSumEnabled = typeof tooltipSum === 'undefined' || tooltipSum === 'on';
    const widgetData = {
        title,
        axes: {
            x: {
                label: getTitleForAxis(visualization.placeholders, shared_1.PlaceholderId.X),
                labelSize: 25,
            },
            y: {
                label: getTitleForAxis(visualization.placeholders, shared_1.PlaceholderId.Y),
                precision: 'auto',
                scale: 'y',
                side: 'left',
            },
        },
        chart: {
            appearance: {
                drawOrder: ['plotLines', 'series', 'axes'],
            },
            series: {
                type,
                interpolation: 'linear',
                ...(type === 'dots' && { pointsSize: 2 }),
            },
            select: {
                zoom: false,
            },
            timeMultiplier: 0.001,
        },
        cursor: {
            snapToValues: false,
            x: {
                style: '1px solid #ffa0a0',
            },
            y: {
                visible: false,
            },
        },
        legend: {
            show: isLegendEnabled,
        },
        processing: {
            nullValues: {
                '-Infinity': '-Infinity',
                Infinity: 'Infinity',
            },
        },
        scales: {
            x: {},
            y: yScale,
            yRight: yRightScale,
        },
        tooltip: {
            boundClassName: '.app',
            show: true,
            hideNoData: false,
            maxLines: 15,
            percent,
            precision: 2,
            sum: isTooltipSumEnabled,
            tracking,
        },
    };
    if (((_e = config.extraSettings) === null || _e === void 0 ? void 0 : _e.tooltip) === 'hide') {
        (0, set_1.default)(widgetData, 'tooltip.show', false);
    }
    const xAxisSettings = (_g = (_f = visualization === null || visualization === void 0 ? void 0 : visualization.placeholders) === null || _f === void 0 ? void 0 : _f.find((p) => p.id === shared_1.PlaceholderId.X)) === null || _g === void 0 ? void 0 : _g.settings;
    if ((xAxisSettings === null || xAxisSettings === void 0 ? void 0 : xAxisSettings.axisVisibility) === 'hide') {
        (0, set_1.default)(widgetData, 'axes.x.show', false);
    }
    const yAxisSettings = (_j = (_h = visualization === null || visualization === void 0 ? void 0 : visualization.placeholders) === null || _h === void 0 ? void 0 : _h.find((p) => p.id === shared_1.PlaceholderId.Y)) === null || _j === void 0 ? void 0 : _j.settings;
    if ((yAxisSettings === null || yAxisSettings === void 0 ? void 0 : yAxisSettings.axisVisibility) === 'hide') {
        (0, set_1.default)(widgetData, 'axes.y.show', false);
    }
    return widgetData;
};
