"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBasicMetricVariant = void 0;
const date_utils_1 = require("@gravity-ui/date-utils");
const shared_1 = require("../../../../../../../../shared");
const palettes_1 = require("../../../../../../../../shared/utils/palettes");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const utils_1 = require("../utils");
const prepareBasicMetricVariant = ({ measure, value, extraSettings, currentPalette, }) => {
    const current = { value };
    if (measure && (0, misc_helpers_1.isNumericalDataType)(measure.data_type)) {
        current.value = Number(current.value);
        const measureFormatting = (0, shared_1.getFormatOptions)(measure);
        if (measureFormatting) {
            current.format = measureFormatting.format;
            current.postfix = measureFormatting.postfix;
            current.prefix = measureFormatting.prefix;
            current.showRankDelimiter = measureFormatting.showRankDelimiter;
            current.unit = measureFormatting.unit;
            current.precision =
                (0, misc_helpers_1.isFloatDataType)(measure.data_type) &&
                    typeof measureFormatting.precision !== 'number'
                    ? shared_1.MINIMUM_FRACTION_DIGITS
                    : measureFormatting.precision;
        }
        else if ((0, misc_helpers_1.isFloatDataType)(measure.data_type)) {
            current.precision = shared_1.MINIMUM_FRACTION_DIGITS;
        }
    }
    else if (current.value && (0, shared_1.isDateField)(measure) && measure.format) {
        current.value = (0, date_utils_1.dateTime)({ input: current.value }).format(measure.format);
    }
    const size = (extraSettings && extraSettings.metricFontSize) || '';
    const color = (0, palettes_1.getColorByColorSettings)({
        currentColors: currentPalette,
        colorIndex: extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.metricFontColorIndex,
        color: extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.metricFontColor,
    });
    const title = (0, utils_1.getTitle)(extraSettings, measure);
    const metric = {
        content: {
            current,
        },
        size,
        color,
        title,
    };
    return [metric];
};
exports.prepareBasicMetricVariant = prepareBasicMetricVariant;
