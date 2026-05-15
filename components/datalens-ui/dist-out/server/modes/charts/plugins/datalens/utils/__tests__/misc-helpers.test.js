"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_helpers_1 = require("../misc-helpers");
const MOCKED_GUID = 'MOCKED_GUID';
const ANOTHER_MOCKED_GUID = 'ANOTHER_MOCKED_GUID';
const ANY_VISUALIZATION_ID = 'line';
const COLUMN_VISUALIZATION_ID = 'column';
const BAR_VISUALIZATION_ID = 'bar';
const MOCKED_COLOR = {
    guid: MOCKED_GUID,
};
const MOCKED_COLOR_WITH_ANOTHER_GUID = { guid: ANOTHER_MOCKED_GUID };
const MOCKED_X_COLUMN_ITEM = {
    guid: MOCKED_GUID,
};
const MOCKED_Y_BAR_ITEM = {
    guid: MOCKED_GUID,
};
const MOCKED_X_PLACEHOLDER = {
    items: [MOCKED_X_COLUMN_ITEM],
    id: 'x',
};
const MOCKED_Y_PLACEHOLDER = {
    items: [MOCKED_Y_BAR_ITEM],
    id: 'y',
    settings: {},
};
describe('isNeedToCalcClosestPointManually', () => {
    it.each([
        {
            visualizationId: COLUMN_VISUALIZATION_ID,
            placeholder: MOCKED_X_PLACEHOLDER,
            colorItem: MOCKED_COLOR,
            dataType: 'date',
        },
        {
            visualizationId: COLUMN_VISUALIZATION_ID,
            placeholder: MOCKED_X_PLACEHOLDER,
            colorItem: MOCKED_COLOR,
            dataType: 'datetime',
        },
    ])(`should return true if the chart type is "column", and fields in Section "X" and "Colors" are equal, and type "X" is date or datetime`, ({ visualizationId, placeholder, colorItem, dataType }) => {
        MOCKED_X_COLUMN_ITEM.data_type = dataType;
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(visualizationId, [placeholder], [colorItem])).toEqual(true);
    });
    it.each([
        {
            visualizationId: BAR_VISUALIZATION_ID,
            placeholder: MOCKED_Y_PLACEHOLDER,
            colorItem: MOCKED_COLOR,
            dataType: 'date',
        },
        {
            visualizationId: BAR_VISUALIZATION_ID,
            placeholder: MOCKED_Y_PLACEHOLDER,
            colorItem: MOCKED_COLOR,
            dataType: 'datetime',
        },
    ])('Should return true if chart type is "bar", and fields in Section "Y" and "Colors" are equal, and type "Y" is date or datetime', ({ visualizationId, placeholder, colorItem, dataType }) => {
        MOCKED_Y_BAR_ITEM.data_type = dataType;
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(visualizationId, [placeholder], [colorItem])).toEqual(true);
    });
    it('should return false, if visualizationId is not column or bar', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(ANY_VISUALIZATION_ID, [MOCKED_X_PLACEHOLDER], [MOCKED_COLOR])).toEqual(false);
    });
    it('should return false if placeholders = undefined', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(COLUMN_VISUALIZATION_ID, undefined, [MOCKED_COLOR])).toEqual(false);
    });
    it('should return false, if data_type is not "date" or "datetime"', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'integer';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(COLUMN_VISUALIZATION_ID, [MOCKED_X_PLACEHOLDER], [MOCKED_COLOR])).toEqual(false);
    });
    it('should return false, if Columns Sections do not have a Section "X"', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(COLUMN_VISUALIZATION_ID, [MOCKED_Y_PLACEHOLDER], [MOCKED_COLOR])).toEqual(false);
    });
    it('should return false, if Columns Sections do not have a Section "Y"', () => {
        MOCKED_Y_BAR_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(BAR_VISUALIZATION_ID, [MOCKED_X_PLACEHOLDER], [MOCKED_COLOR])).toEqual(false);
    });
    it('should return false, if colors is empty array', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(COLUMN_VISUALIZATION_ID, [MOCKED_X_PLACEHOLDER], [])).toEqual(false);
    });
    it('should return true, if Color and Field guid are not equal', () => {
        MOCKED_X_COLUMN_ITEM.data_type = 'date';
        expect((0, misc_helpers_1.isNeedToCalcClosestPointManually)(COLUMN_VISUALIZATION_ID, [MOCKED_X_PLACEHOLDER], [MOCKED_COLOR_WITH_ANOTHER_GUID])).toEqual(true);
    });
});
describe('getSortedColumnId', () => {
    const expectedFieldId = '5b58a23b-68a2-4979-bfb3-9ee13f16d24d';
    const mockedPivotTableSortColumnId = '0_0_1_id=fieldId=5b58a23b-68a2-4979-bfb3-9ee13f16d24d__index=0_name=Average rating';
    const mockedSortColumnId = '0_0_1_id=5b58a23b-68a2-4979-bfb3-9ee13f16d24d_name=Average rating';
    it('Should parse sorted column id from flat table columnId', () => {
        const fieldId = (0, misc_helpers_1.getSortedColumnId)(mockedSortColumnId);
        expect(fieldId).toEqual(expectedFieldId);
    });
    it('Should parse sorted column id from pivot table columnId', () => {
        const fieldId = (0, misc_helpers_1.getSortedColumnId)(mockedPivotTableSortColumnId, true);
        expect(fieldId).toEqual(expectedFieldId);
    });
});
