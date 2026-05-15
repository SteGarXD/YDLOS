"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
exports.markdownActions = {
    renderMarkdown: (0, gateway_utils_1.createAction)(async (_, { text, lang }, { ctx }) => {
        return ctx.get('gateway').markdown({ text, lang });
    }),
    batchRenderMarkdown: (0, gateway_utils_1.createAction)(async (_, { texts, lang }, { ctx }) => {
        const { markdown } = ctx.get('gateway');
        const results = {};
        for (const key of Object.keys(texts)) {
            const text = texts[key];
            results[key] = markdown({
                text,
                lang,
            });
        }
        return results;
    }),
};
