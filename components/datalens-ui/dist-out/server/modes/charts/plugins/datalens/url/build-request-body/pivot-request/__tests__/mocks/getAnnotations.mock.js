"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendUsedFieldsMap = exports.MEASURE_NAME_COLORS = exports.USED_FIELDS_MAP = exports.DIMENSION_BACKGROUND_COLORS = exports.BACKGROUND_COLORS = exports.COLORS = void 0;
exports.COLORS = [{ guid: '1899d37a-ff15-4bbc-b9f1-9df1e5f715ee' }];
exports.BACKGROUND_COLORS = [
    {
        colorFieldGuid: 'bfccec5c-941a-45aa-89d6-8cc7a09b19ca',
        targetFieldGuid: 'fdddd3b0-5639-11eb-9c8e-41e84ec800f0',
        isContinuous: true,
    },
];
exports.DIMENSION_BACKGROUND_COLORS = [
    {
        colorFieldGuid: 'asdha91-2131njda-12424jjd-23s-21eh12h',
        targetFieldGuid: 'fdddd3b0-5639-11eb-9c8e-41e84ec800f0',
        isContinuous: false,
    },
];
exports.USED_FIELDS_MAP = {
    'fdddd3b0-5639-11eb-9c8e-41e84ec800f0': { legendItemId: 1, role: 'pivot_measure' },
};
exports.MEASURE_NAME_COLORS = [{ title: 'Measure Names', type: 'PSEUDO' }];
const extendUsedFieldsMap = (extend) => {
    return {
        ...exports.USED_FIELDS_MAP,
        ...extend,
    };
};
exports.extendUsedFieldsMap = extendUsedFieldsMap;
