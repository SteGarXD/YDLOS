"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHTML = renderHTML;
const cut_extension_1 = require("@diplodoc/cut-extension");
const plugin_1 = require("@diplodoc/latex-extension/plugin");
const plugin_2 = require("@diplodoc/mermaid-extension/plugin");
const tabs_extension_1 = require("@diplodoc/tabs-extension");
const transform_1 = __importDefault(require("@diplodoc/transform"));
const code_1 = __importDefault(require("@diplodoc/transform/lib/plugins/code"));
const deflist_1 = __importDefault(require("@diplodoc/transform/lib/plugins/deflist"));
const imsize_1 = __importDefault(require("@diplodoc/transform/lib/plugins/imsize"));
const monospace_1 = __importDefault(require("@diplodoc/transform/lib/plugins/monospace"));
const notes_1 = __importDefault(require("@diplodoc/transform/lib/plugins/notes"));
const sup_1 = __importDefault(require("@diplodoc/transform/lib/plugins/sup"));
const table_1 = __importDefault(require("@diplodoc/transform/lib/plugins/table"));
const term_1 = __importDefault(require("@diplodoc/transform/lib/plugins/term"));
const sanitize_1 = require("@diplodoc/transform/lib/sanitize");
const markdown_it_color_1 = __importDefault(require("markdown-it-color"));
const markdown_it_emoji_1 = __importDefault(require("markdown-it-emoji"));
const markdown_it_ins_1 = __importDefault(require("markdown-it-ins"));
const markdown_it_link_attributes_1 = __importDefault(require("markdown-it-link-attributes"));
const markdown_it_mark_1 = __importDefault(require("markdown-it-mark"));
const markdown_it_sub_1 = __importDefault(require("markdown-it-sub"));
const constants_1 = require("../../constants");
const emoji_defs_1 = require("./emoji-defs");
function renderHTML(args) {
    const { text = '', lang, plugins: additionalPlugins = [] } = args;
    const plugins = [
        deflist_1.default,
        notes_1.default,
        (0, cut_extension_1.transform)({ bundle: false }),
        term_1.default,
        (md) => md
            .use(markdown_it_link_attributes_1.default, {
            matcher(href) {
                return !href.startsWith('#');
            },
            attrs: {
                target: '_blank',
                rel: 'noopener noreferrer',
            },
        })
            .use(markdown_it_color_1.default, {
            defaultClassName: constants_1.YFM_COLORIFY_MARKDOWN_CLASSNAME,
        })
            .use(markdown_it_emoji_1.default, { defs: emoji_defs_1.emojiDefs }),
        (0, tabs_extension_1.transform)({
            bundle: false,
            features: {
                enabledVariants: {
                    regular: true,
                    radio: false,
                    dropdown: false,
                    accordion: true,
                },
            },
        }),
        imsize_1.default,
        table_1.default,
        monospace_1.default,
        sup_1.default,
        markdown_it_sub_1.default,
        markdown_it_mark_1.default,
        markdown_it_ins_1.default,
        (0, plugin_1.transform)({
            bundle: false,
            runtime: constants_1.YfmMetaScripts.LATEX,
        }),
        (0, plugin_2.transform)({
            bundle: false,
            runtime: constants_1.YfmMetaScripts.MERMAID,
        }),
        code_1.default,
    ];
    if (additionalPlugins) {
        plugins.push(...additionalPlugins);
    }
    // temp terms bug fix until the editor supports transform plugin
    const preparedTextWithTermDefs = text.replace(/^\s*?\\\[\\\*([\wа-я]+)\\\]:(.*?\S+?.*?)$/gim, '[*$1]:$2');
    const preparedTextWithTermLinks = preparedTextWithTermDefs.replace(/(\[.+?\])\(\*(%.+?)\)/g, (_, p1, p2) => `${p1}(*${decodeURIComponent(p2)})`);
    const { result: { html, meta }, } = (0, transform_1.default)(preparedTextWithTermLinks, {
        plugins,
        lang: lang,
        vars: {},
        disableLiquid: true,
        needToSanitizeHtml: true,
        sanitizeOptions: {
            ...sanitize_1.defaultOptions,
            disableStyleSanitizer: true,
        },
    });
    return { result: html, meta };
}
