"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockedV4Config = exports.getMockedV4Visualization = exports.MOCKED_SHARED_DATA = exports.MOCKED_V4_HIERARCHY_FIELD = exports.MOCKED_V4_FIELD_WITH_DATE_MODE = exports.MOCKED_V4_FIELD = void 0;
exports.MOCKED_V4_FIELD = {
    guid: 'field-1',
    data_type: 'string',
};
exports.MOCKED_V4_FIELD_WITH_DATE_MODE = {
    guid: 'field-3',
    data_type: 'date',
    dateMode: 'discrete',
};
exports.MOCKED_V4_HIERARCHY_FIELD = {
    guid: 'hierarchy-1',
    type: 'PSEUDO',
    data_type: 'hierarchy',
    fields: [exports.MOCKED_V4_FIELD],
};
exports.MOCKED_SHARED_DATA = {
    metaHierarchy: {
        column: {
            hierarchyIndex: 0,
            hierarchyFieldIndex: 0,
        },
    },
};
const getMockedV4Visualization = ({ visualizationId, placeholders, }) => {
    return {
        id: visualizationId,
        placeholders: placeholders || [],
    };
};
exports.getMockedV4Visualization = getMockedV4Visualization;
const getMockedV4Config = ({ visualizationId, placeholders, sort, }) => {
    return {
        visualization: (0, exports.getMockedV4Visualization)({ visualizationId, placeholders }),
        sort: sort || [],
    };
};
exports.getMockedV4Config = getMockedV4Config;
