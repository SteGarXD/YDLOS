"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXAxisValue = void 0;
exports.getDateAxisValue = getDateAxisValue;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
function getDateAxisValue(value, dataType) {
    const val = new Date(value);
    if (dataType === shared_1.DATASET_FIELD_TYPES.GENERICDATETIME) {
        val.setTime((0, misc_helpers_1.getTimezoneOffsettedTime)(val));
    }
    return val.getTime();
}
const getXAxisValue = ({ x, ys1, order, values, categories, xDataType, xIsPseudo, categoriesMap, idToTitle, }) => {
    let xValue;
    if (xIsPseudo) {
        ys1.forEach((y) => {
            const title = y.fakeTitle || idToTitle[y.guid];
            if (categoriesMap && !categoriesMap.has(title)) {
                categoriesMap.set(title, true);
                categories.push(title);
            }
        });
    }
    else {
        const xTitle = idToTitle[x.guid];
        const xi = (0, misc_helpers_1.findIndexInOrder)(order, x, xTitle);
        const value = values[xi];
        if (value === null) {
            return value;
        }
        xValue = value;
        if ((0, shared_1.isNumberField)({ data_type: xDataType })) {
            xValue = Number(value);
        }
        else if ((0, shared_1.isDateField)({ data_type: xDataType })) {
            xValue = getDateAxisValue(value, xDataType);
        }
        if (categoriesMap && !categoriesMap.has(xValue)) {
            categoriesMap.set(xValue, true);
            categories.push(xValue);
        }
    }
    return xValue;
};
exports.getXAxisValue = getXAxisValue;
