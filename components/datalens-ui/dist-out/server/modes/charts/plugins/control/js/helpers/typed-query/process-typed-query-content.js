"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTypedQueryContent = void 0;
const typed_query_helpers_1 = require("../../../../../../../../shared/modules/control/typed-query-helpers");
const processTypedQueryContent = (distincts) => {
    var _a;
    const rows = ((_a = distincts === null || distincts === void 0 ? void 0 : distincts.data) === null || _a === void 0 ? void 0 : _a.rows) || [];
    return (0, typed_query_helpers_1.getControlDisticntsFromRows)(rows).map((v) => ({ title: v, value: v }));
};
exports.processTypedQueryContent = processTypedQueryContent;
