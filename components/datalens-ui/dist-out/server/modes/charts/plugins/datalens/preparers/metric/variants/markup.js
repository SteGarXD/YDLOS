"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareMarkupMetricVariant = void 0;
const date_utils_1 = require("@gravity-ui/date-utils");
const shared_1 = require("../../../../../../../../shared");
const palettes_1 = require("../../../../../../../../shared/utils/palettes");
const markup_helpers_1 = require("../../../utils/markup-helpers");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const utils_1 = require("../utils");
const prepareMarkupMetricVariant = ({ measure, value, extraSettings, currentPalette, }) => {
    if (!measure) {
        return {};
    }
    const title = (0, utils_1.getTitle)(extraSettings, measure);
    if (typeof value === 'object' && value !== null) {
        if (title) {
            return {
                value: {
                    type: 'concat',
                    children: [
                        {
                            type: 'size',
                            size: '16px',
                            content: {
                                className: 'markup-metric-title',
                                type: 'text',
                                content: title,
                            },
                        },
                        value,
                    ],
                },
            };
        }
        else {
            return { value };
        }
    }
    else {
        const size = (extraSettings && extraSettings.metricFontSize) || 'm';
        const color = (0, palettes_1.getColorByColorSettings)({
            currentColors: currentPalette,
            colorIndex: extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.metricFontColorIndex,
            color: extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.metricFontColor,
        });
        const formatOptions = {};
        let formattedValue = String(value);
        if ((0, misc_helpers_1.isNumericalDataType)(measure.data_type)) {
            const measureFormatting = (0, shared_1.getFormatOptions)(measure);
            if (measureFormatting) {
                formatOptions.format = measureFormatting.format;
                formatOptions.postfix = measureFormatting.postfix;
                formatOptions.prefix = measureFormatting.prefix;
                formatOptions.showRankDelimiter = measureFormatting.showRankDelimiter;
                formatOptions.unit = measureFormatting.unit;
                formatOptions.precision =
                    (0, misc_helpers_1.isFloatDataType)(measure.data_type) &&
                        typeof measureFormatting.precision !== 'number'
                        ? shared_1.MINIMUM_FRACTION_DIGITS
                        : measureFormatting.precision;
            }
            else if ((0, misc_helpers_1.isFloatDataType)(measure.data_type)) {
                formatOptions.precision = shared_1.MINIMUM_FRACTION_DIGITS;
            }
            formattedValue = (0, shared_1.formatNumber)(value || 0, formatOptions);
        }
        else if ((0, shared_1.isDateField)(measure) && measure.format) {
            formattedValue = (0, date_utils_1.dateTime)({ input: value }).format(measure.format);
        }
        return (0, markup_helpers_1.prepareMetricObject)({ size, title, color, value: formattedValue });
    }
};
exports.prepareMarkupMetricVariant = prepareMarkupMetricVariant;
