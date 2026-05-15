"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedCategories = void 0;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const getCuts = ({ categories, lines, currentLine }) => {
    if (!currentLine) {
        return {};
    }
    const cuts = {};
    categories.forEach((category) => {
        var _a;
        cuts[category] = (_a = lines[currentLine].data[category]) === null || _a === void 0 ? void 0 : _a.value;
    });
    return cuts;
};
const sortCategoriesByCuts = ({ direction, cuts, categories, }) => {
    const isASC = direction === 'ASC';
    const forward = isASC ? 1 : -1;
    const backward = isASC ? -1 : 1;
    categories.sort((a, b) => {
        return cuts[a] > cuts[b] ? forward : backward;
    });
};
const sortCategoriesWithYSection = (args) => {
    const { ySectionItems, categories, sortItem, lineKeys, lines, colorItem, isSegmentsExists } = args;
    const sortedCategories = [...categories];
    const sortItemSource = sortItem.source;
    const matchedYSectionItem = ySectionItems.find((ySectionItem) => {
        const ySectionItemTitle = (0, misc_helpers_1.getOriginalTitleOrTitle)(ySectionItem);
        const sortItemTitle = (0, misc_helpers_1.getOriginalTitleOrTitle)(sortItem);
        const ySectionItemSource = ySectionItem.source;
        return (ySectionItemTitle === sortItemTitle ||
            (sortItemSource && sortItemSource === ySectionItemSource));
    });
    if (matchedYSectionItem) {
        let cuts = {};
        if ((colorItem && colorItem.type !== 'PSEUDO') || isSegmentsExists) {
            lineKeys.forEach((currentLine) => {
                const currentLineCuts = getCuts({ categories, lines, currentLine });
                categories.forEach((category) => {
                    if (!currentLineCuts[category]) {
                        return;
                    }
                    if (Object.hasOwnProperty.call(cuts, category)) {
                        cuts[category] += currentLineCuts[category];
                    }
                    else {
                        cuts[category] = currentLineCuts[category];
                    }
                });
            });
        }
        else {
            const currentLine = lineKeys.find((key) => {
                return lines[key].fieldTitle === (0, shared_1.getFakeTitleOrTitle)(matchedYSectionItem);
            });
            cuts = getCuts({ categories, lines, currentLine });
        }
        sortCategoriesByCuts({ direction: sortItem.direction, cuts, categories: sortedCategories });
    }
    return {
        sortedCategories,
    };
};
const sortCategoriesWithColorsSection = (args) => {
    const { sortItem, colorItem, measureColorSortLine, categories } = args;
    const sortedCategories = [...categories];
    const isSortWithColorsSectionItem = colorItem.guid === sortItem.guid;
    if (isSortWithColorsSectionItem) {
        if ((0, shared_1.isMeasureField)(colorItem)) {
            const cuts = getCuts({
                categories: sortedCategories,
                lines: measureColorSortLine,
                currentLine: (0, shared_1.getFakeTitleOrTitle)(colorItem),
            });
            sortCategoriesByCuts({
                direction: sortItem.direction,
                cuts,
                categories: sortedCategories,
            });
        }
    }
    return {
        categories: sortedCategories,
    };
};
const getSortedCategories = (args) => {
    const { isSortAvailable, isXNumber, categories, isSortWithYSectionItem, sortItem, ySectionItems, lines, colorItem, measureColorSortLine, isSortBySegments, isSegmentsExists, } = args;
    const lineKeys = lines.map((l) => Object.keys(l));
    if (!isSortAvailable || isSortBySegments) {
        const sortFunction = isXNumber ? misc_helpers_1.numericCollator : misc_helpers_1.collator.compare;
        // @ts-ignore
        return [...categories].sort(sortFunction);
    }
    let sortedCategories = categories;
    if (isSortWithYSectionItem) {
        const sortResult = sortCategoriesWithYSection({
            categories,
            sortItem,
            ySectionItems,
            lines: lines[0],
            lineKeys: lineKeys[0],
            colorItem,
            isSegmentsExists,
        });
        sortedCategories = sortResult.sortedCategories;
    }
    if (colorItem) {
        const sortResult = sortCategoriesWithColorsSection({
            sortItem,
            colorItem,
            categories: sortedCategories,
            measureColorSortLine,
        });
        sortedCategories = sortResult.categories;
    }
    return sortedCategories;
};
exports.getSortedCategories = getSortedCategories;
