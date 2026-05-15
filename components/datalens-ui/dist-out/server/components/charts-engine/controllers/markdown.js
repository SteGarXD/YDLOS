"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownController = void 0;
const markdown_1 = require("../../../../shared/modules/markdown/markdown");
const registry_1 = require("../../../registry");
exports.markdownController = {
    render: (req, res) => {
        try {
            const { body } = req;
            const result = (0, markdown_1.renderHTML)({
                text: body.text,
                lang: res.locals.lang,
                plugins: registry_1.registry.getYfmPlugins(),
            });
            res.status(200).send(result);
        }
        catch (error) {
            const { ctx } = req;
            ctx.logError('Error rendering markdown', error);
            res.status(500).send(error);
        }
    },
    batchRender: (req, res) => {
        try {
            const input = req.body.texts;
            const results = {};
            for (const key of Object.keys(input)) {
                const text = input[key];
                results[key] = (0, markdown_1.renderHTML)({
                    text,
                    lang: res.locals.lang,
                    plugins: registry_1.registry.getYfmPlugins(),
                });
            }
            res.status(200).send(results);
        }
        catch (error) {
            const { ctx } = req;
            ctx.logError('Error rendering markdown', error);
            res.status(500).send(error);
        }
    },
};
