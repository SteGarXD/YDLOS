"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.isSlugified = isSlugified;
exports.makeSlugName = makeSlugName;
const constants_1 = require("../constants");
const transliterate_1 = require("./transliterate");
function slugify(str, maxSlugLength = constants_1.MAX_SLUG_LENGTH) {
    return (0, transliterate_1.transliterate)(str)
        .replace(/\s+|_+|\.+/g, '-') // replace the whitespace characters, '.' and '_' with '-'
        .replace(/[^a-z0-9-]+/g, '') // we remove all non-alphanumeric, numeric and '-' characters
        .replace(/-+/g, '-') // replacing multiple '-' with single '-'
        .slice(0, maxSlugLength)
        .replace(/^-+/, '') // delete the '-' at the beginning of the text
        .replace(/-+$/, ''); // delete the '-' at the end of the text
}
function isSlugified(str, maxSlugLength = Number.MAX_SAFE_INTEGER) {
    return str === slugify(str, maxSlugLength);
}
function makeSlugName(entryId, name) {
    if (!name) {
        return entryId;
    }
    const slugName = slugify(name);
    if (!slugName) {
        return entryId;
    }
    return `${entryId}${constants_1.ENTRY_SLUG_SEPARATOR}${slugify(name)}`;
}
