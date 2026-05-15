"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifyTermIds = void 0;
const unifyAttributes = (attrs, attrName, prefix) => {
    for (const attr of attrs) {
        if (attr[0] === attrName && !attr[1].startsWith(`:${prefix}`)) {
            const value = attr[1];
            attr[1] = `:${prefix}_${value.slice(1)}`;
        }
    }
    return attrs;
};
const modifyTerm = (termToken, prefix) => {
    if (termToken.attrs) {
        termToken.attrs = unifyAttributes(termToken.attrs, "aria-describedby" /* YfmAttributes.AriaDescribedby */, prefix);
        termToken.attrs = unifyAttributes(termToken.attrs, "term-key" /* YfmAttributes.TermKey */, prefix);
    }
    return termToken;
};
const traverseLine = (tokens, prefix) => {
    let i = 0;
    while (tokens[i]) {
        const currentToken = tokens[i];
        switch (currentToken.type) {
            case "inline" /* YfmTokenTypes.Inline */: {
                if (currentToken.children) {
                    currentToken.children = traverseLine(currentToken.children, prefix);
                }
                break;
            }
            case "term_open" /* YfmTokenTypes.TermOpen */: {
                modifyTerm(currentToken, prefix);
                break;
            }
            case "template_open" /* YfmTokenTypes.TemplateOpen */: {
                const token = tokens[i];
                const next = tokens[i + 1];
                if (next && next.type === "dfn_open" /* YfmTokenTypes.DefinitionOpen */) {
                    if (token.attrs) {
                        token.attrs = unifyAttributes(token.attrs, "id" /* YfmAttributes.Id */, prefix);
                    }
                    if (next.attrs) {
                        next.attrs = unifyAttributes(next.attrs, "id" /* YfmAttributes.Id */, prefix);
                    }
                    i++;
                }
                break;
            }
        }
        i++;
    }
    return tokens;
};
const unifyTermIds = (md, options) => {
    const prefix = options.prefix;
    try {
        md.core.ruler.after('termReplace', 'termLinkRandom', (state) => {
            traverseLine(state.tokens, prefix);
        });
    }
    catch (_) { }
};
exports.unifyTermIds = unifyTermIds;
