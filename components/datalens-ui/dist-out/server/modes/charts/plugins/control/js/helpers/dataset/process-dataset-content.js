"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDatasetSourceTypeContent = void 0;
const shared_1 = require("../../../../../../../../shared");
const processDistinctsContent = ({ shared, distincts, }) => {
    // https://stackoverflow.com/questions/40107588 numeric collation doesn't work correctly with float type
    const needCollator = shared.source.fieldType !== 'float';
    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
    });
    const mappedDistincts = distincts.result_data[0].rows.map((row) => {
        const value = row.data[0];
        return { title: value, value };
    });
    mappedDistincts.sort((a, b) => {
        return needCollator
            ? collator.compare(a.title, b.title)
            : Number(a.title) - Number(b.title);
    });
    return mappedDistincts;
};
const processAcceptableValuesContent = (shared) => shared.source.acceptableValues;
const processEmptyContent = () => [];
const processDatasetSourceTypeContent = ({ shared, distincts, }) => {
    const { elementType } = shared.source;
    if (distincts && elementType !== shared_1.DashTabItemControlElementType.Date) {
        return processDistinctsContent({ shared, distincts });
    }
    if (elementType === shared_1.DashTabItemControlElementType.Input) {
        return processAcceptableValuesContent(shared);
    }
    return processEmptyContent();
};
exports.processDatasetSourceTypeContent = processDatasetSourceTypeContent;
