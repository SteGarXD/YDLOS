"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeLinesData = exports.getLineKey = exports.getItemsValues = void 0;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const getItemsValues = (item, { idToTitle, values, order }) => {
    const itemTitle = idToTitle[item.guid];
    const indexInOrder = (0, misc_helpers_1.findIndexInOrder)(order, item, itemTitle);
    const value = values[indexInOrder];
    let formattedValue;
    if (item && 'formatting' in item && (0, misc_helpers_1.isNumericalDataType)(item.data_type)) {
        formattedValue = (0, misc_helpers_1.chartKitFormatNumberWrapper)(value, {
            ...(0, shared_1.getFormatOptions)(item),
            lang: 'ru',
        });
    }
    else {
        formattedValue = value !== null && value !== void 0 ? value : 'Null';
    }
    return {
        value,
        formattedValue,
    };
};
exports.getItemsValues = getItemsValues;
const getLineKey = (args) => {
    const { shownTitle, isX2Axis, isMultiAxis, value, x2AxisValue, segmentName } = args;
    const itemTitleValue = value || shownTitle;
    let key = itemTitleValue;
    if (isX2Axis) {
        key = `${itemTitleValue}-${x2AxisValue}`;
    }
    else if (isMultiAxis) {
        key = `${itemTitleValue}-${shownTitle}`;
    }
    if (segmentName) {
        key = `${key}__${segmentName}`;
    }
    return key;
};
exports.getLineKey = getLineKey;
const mergeLinesData = (target, record) => {
    const result = { ...target };
    const recordProperties = Object.keys(record || {});
    recordProperties.forEach((prop) => {
        const innerProperties = Object.keys(record[prop]);
        const currentInnerObject = record[prop];
        if (!result[prop]) {
            result[prop] = {};
        }
        innerProperties.forEach((innerProp) => {
            if (typeof currentInnerObject[innerProp] === 'object') {
                result[prop][innerProp] = {
                    ...result[prop][innerProp],
                    ...currentInnerObject[innerProp],
                };
            }
            else {
                result[prop][innerProp] = record[prop][innerProp];
            }
        });
    });
    return result;
};
exports.mergeLinesData = mergeLinesData;
