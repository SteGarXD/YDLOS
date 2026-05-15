"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessHierarchies = preprocessHierarchies;
const shared_1 = require("../../../../../../shared");
const misc_helpers_1 = require("./misc-helpers");
function preprocessHierarchies({ visualizationId, placeholders, params, sharedData, colors, shapes, segments, }) {
    const { drillDownFilters, drillDownLevel } = (0, misc_helpers_1.getDrillDownData)(params);
    const hierarchiesWithParent = getHierarchiesTheirParent({
        placeholders: placeholders,
        colors: colors,
        shapes: shapes,
        segments,
    });
    if (visualizationId !== 'flatTable') {
        hierarchiesWithParent.forEach(({ hierarchy }) => {
            removeMarkupFieldsFromHierarchy(hierarchy);
        });
    }
    hierarchiesWithParent.forEach(({ hierarchy, hierachyContainer, hierarchyIndex, hierarchyContainerId }, index) => {
        if (!index) {
            sharedData.drillDownData = {
                breadcrumbs: hierarchy.fields.map((el) => el.title),
                filters: drillDownFilters || hierarchy.fields.map(() => ''),
                level: drillDownLevel,
                fields: hierarchy.fields,
                isColorDrillDown: hierachyContainer === colors || hierachyContainer === shapes,
            };
        }
        else if (sharedData.drillDownData) {
            const notSplitByColors = [
                shared_1.WizardVisualizationId.Pie,
                shared_1.WizardVisualizationId.Donut,
                shared_1.WizardVisualizationId.Treemap,
            ];
            sharedData.drillDownData.isColorDrillDown =
                !notSplitByColors.includes(visualizationId) &&
                    (sharedData.drillDownData.isColorDrillDown ||
                        hierachyContainer === colors ||
                        hierachyContainer === shapes ||
                        hierachyContainer === segments);
        }
        const hierarchyFieldIndex = hierarchy.fields.length < drillDownLevel
            ? hierarchy.fields.length - 1
            : drillDownLevel;
        hierachyContainer[hierarchyIndex] = hierarchy.fields[hierarchyFieldIndex];
        if (!sharedData.metaHierarchy) {
            sharedData.metaHierarchy = {};
        }
        sharedData.metaHierarchy[hierarchyContainerId] = { hierarchyIndex, hierarchyFieldIndex };
    });
}
const isFieldHierarchy = (field) => field.data_type === shared_1.DATASET_FIELD_TYPES.HIERARCHY;
function getHierarchiesTheirParent({ placeholders, colors, shapes, segments, }) {
    const placeholderHierarchies = placeholders.reduce((acc, placeholder) => {
        placeholder.items.forEach((field, index) => {
            if (isFieldHierarchy(field)) {
                acc.push({
                    hierarchy: field,
                    hierachyContainer: placeholder.items,
                    hierarchyIndex: index,
                    hierarchyContainerId: placeholder.id,
                });
            }
        });
        return acc;
    }, []);
    const otherItems = [
        [colors, shared_1.PlaceholderId.Colors],
        [shapes, shared_1.PlaceholderId.Shapes],
        [segments, shared_1.PlaceholderId.Segments],
    ];
    const otherItemHierarchies = otherItems.map(([item, placeholderId]) => {
        return item.reduce((acc, field, index) => {
            if (isFieldHierarchy(field)) {
                acc.push({
                    hierarchy: field,
                    hierachyContainer: item,
                    hierarchyIndex: index,
                    hierarchyContainerId: placeholderId,
                });
            }
            return acc;
        }, []);
    });
    const flattenOtherItemHierarchies = [].concat(...otherItemHierarchies);
    return [...placeholderHierarchies, ...flattenOtherItemHierarchies];
}
function removeMarkupFieldsFromHierarchy(hierarchy) {
    hierarchy.fields = hierarchy.fields.filter((field) => {
        return !(0, shared_1.isMarkupField)(field);
    });
}
