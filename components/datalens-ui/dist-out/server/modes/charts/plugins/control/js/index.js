"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraph = void 0;
const shared_1 = require("../../../../../../shared");
const misc_1 = require("../helpers/misc");
const process_content_1 = require("./helpers/process-content");
// eslint-disable-next-line complexity
const buildGraph = ({ data, shared, params, ChartEditor, }) => {
    shared.content = (0, process_content_1.processContent)({ data, shared, ChartEditor, params });
    const { source, param, content } = shared;
    const uiControl = {
        label: source.showTitle ? shared.title : '',
        multiselect: source.multiselectable,
        content,
        param,
        required: source.required,
        disabled: shared.disabled,
    };
    switch (source.elementType) {
        case shared_1.DashTabItemControlElementType.Date:
            if (source.isRange) {
                uiControl.type = 'range-datepicker';
                if (source.dateGranularityEnabled) {
                    uiControl.dateGranularityEnabled = source.dateGranularityEnabled;
                }
                const { defaultValue } = source;
                if (typeof defaultValue === 'string') {
                    const resolvedInterval = ChartEditor.resolveInterval(defaultValue);
                    if (resolvedInterval) {
                        const { from, to } = resolvedInterval;
                        params[param] = `__interval_${from || ''}_${to || ''}`;
                    }
                }
                else if (content.length) {
                    params[param] = (0, misc_1.formatIntervalRangeDate)({
                        from: content[0].value,
                        to: content[content.length - 1].value,
                    });
                }
                else {
                    params[param] = (0, misc_1.formatRelativeRangeDate)({ from: 0, to: 0 });
                }
            }
            else {
                uiControl.type = 'datepicker';
                const { defaultValue } = source;
                if (typeof defaultValue === 'string') {
                    params[param] = ChartEditor.resolveRelative(defaultValue) || defaultValue;
                }
                else if (content.length) {
                    params[param] = [content[content.length - 1].value];
                }
                else {
                    params[param] = [(0, misc_1.getISOFromToday)()];
                }
            }
            if (source.acceptableValues) {
                const { from, to } = source.acceptableValues;
                uiControl.minDate = from;
                uiControl.maxDate = to;
            }
            break;
        case shared_1.DashTabItemControlElementType.Select:
            uiControl.type = source.elementType;
            if (!params[param]) {
                if (Array.isArray(source.defaultValue)) {
                    params[param] = source.defaultValue.length > 0 ? source.defaultValue : [''];
                }
                else {
                    params[param] = source.defaultValue || [''];
                }
            }
            break;
        case shared_1.DashTabItemControlElementType.Checkbox:
            uiControl.type = source.elementType;
            if (!params[param]) {
                if (source.defaultValue === undefined) {
                    params[param] = ['false'];
                }
                else {
                    params[param] = [source.defaultValue];
                }
            }
            break;
        default:
            uiControl.type = source.elementType;
            if (!params[param]) {
                if (source.defaultValue === undefined) {
                    params[param] = [''];
                }
                else {
                    params[param] = [source.defaultValue];
                }
            }
    }
    shared.uiControl = uiControl;
    ChartEditor.updateParams({ [param]: params[param] });
};
exports.buildGraph = buildGraph;
