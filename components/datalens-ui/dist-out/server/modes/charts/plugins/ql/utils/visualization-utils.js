"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapVisualizationPlaceholdersItems = exports.mapItems = exports.migrateOrAutofillVisualization = void 0;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const shared_1 = require("../../../../../../shared");
const autofill_helpers_1 = require("./autofill-helpers");
const migrate_helpers_1 = require("./migrate-helpers");
const migrateOrAutofillVisualization = ({ visualization: originalVisualization, fields, rows, order, colors: originalColors, distinctsMap, }) => {
    const { id: visualizationId } = originalVisualization;
    const newVisualization = (0, cloneDeep_1.default)(originalVisualization);
    let newColors = originalColors || [];
    // Logic of autofill depends on visualization id
    if (new Set([
        shared_1.WizardVisualizationId.Line,
        shared_1.WizardVisualizationId.Area,
        shared_1.WizardVisualizationId.Area100p,
        shared_1.WizardVisualizationId.Column,
        shared_1.WizardVisualizationId.Column100p,
        shared_1.WizardVisualizationId.Bar,
        shared_1.WizardVisualizationId.Bar100p,
        shared_1.WizardVisualizationId.BarXD3,
        shared_1.WizardVisualizationId.BarYD3,
    ]).has(visualizationId)) {
        if (order) {
            // Order is set, so we need to migrate old order to new structure
            const { xFields, yFields, colors: migratedColors, } = (0, migrate_helpers_1.migrateLineVisualization)({
                order,
                fields,
                rows,
            });
            newVisualization.placeholders[0].items = xFields;
            newVisualization.placeholders[1].items = yFields;
            newColors = migratedColors;
        }
        else {
            // Old order was not set, so we can do autofill
            const { xFields, yFields, colors } = (0, autofill_helpers_1.autofillLineVisualization)({
                fields,
                distinctsMap,
            });
            newVisualization.placeholders[0].items = xFields;
            newVisualization.placeholders[1].items = yFields;
            if (colors) {
                newColors = colors;
            }
        }
    }
    else if ([shared_1.WizardVisualizationId.Scatter, shared_1.WizardVisualizationId.ScatterD3].includes(visualizationId)) {
        // Scatter visualization was not present in older ql charts,
        // so we don't need to migrate older order
        const { xFields, yFields, pointsFields } = (0, autofill_helpers_1.autofillScatterVisualization)({ fields });
        newVisualization.placeholders[0].items = xFields;
        newVisualization.placeholders[1].items = yFields;
        newVisualization.placeholders[2].items = pointsFields;
    }
    else if (new Set([
        shared_1.WizardVisualizationId.Pie,
        shared_1.WizardVisualizationId.Donut,
        shared_1.WizardVisualizationId.PieD3,
        shared_1.WizardVisualizationId.DonutD3,
    ]).has(visualizationId)) {
        // Checking if order is set (from older versions of ql charts)
        const hasOrder = order && order.length > 0;
        const { colorFields, measureFields } = hasOrder
            ? // Order is set, so we need to migrate old order to new structure
                (0, migrate_helpers_1.migratePieVisualization)({
                    order: order,
                    fields,
                })
            : // Old order was not set, so we can do autofill
                (0, autofill_helpers_1.autofillPieVisualization)({
                    fields,
                });
        const colorsPlaceholder = newVisualization.placeholders.find((p) => p.id === shared_1.PlaceholderId.Colors);
        if (colorsPlaceholder) {
            colorsPlaceholder.items = colorFields;
        }
        const measurePlaceholder = newVisualization.placeholders.find((p) => p.id === shared_1.PlaceholderId.Measures);
        if (measurePlaceholder) {
            measurePlaceholder.items = measureFields;
        }
    }
    else if (visualizationId === shared_1.WizardVisualizationId.Metric) {
        // Checking if order is set (from older versions of ql charts)
        if (order && order.length > 0) {
            // Order is set, so we need to migrate old order to new structure
            const { measureFields } = (0, migrate_helpers_1.migrateMetricVisualization)({
                order: order,
                fields,
            });
            newVisualization.placeholders[0].items = measureFields;
        }
        else {
            // Old order was not set, so we can do autofill
            const { measureFields } = (0, autofill_helpers_1.autofillMetricVisualization)({
                fields,
            });
            newVisualization.placeholders[0].items = measureFields;
        }
    }
    else if (visualizationId === shared_1.WizardVisualizationId.Treemap ||
        visualizationId === shared_1.WizardVisualizationId.TreemapD3) {
        const { dimensionFields, sizeFields } = (0, autofill_helpers_1.autofillTreemapVisualization)({
            fields,
        });
        newVisualization.placeholders[0].items = dimensionFields;
        newVisualization.placeholders[1].items = sizeFields;
    }
    else if (visualizationId === shared_1.WizardVisualizationId.FlatTable) {
        // Checking if order is set (from older versions of ql charts)
        if (order && order.length > 0) {
            // Order is set, so we need to migrate old order to new structure
            const { columnFields } = (0, migrate_helpers_1.migrateTableVisualization)({
                order: order,
                fields,
            });
            newVisualization.placeholders[0].items = columnFields;
        }
        else {
            // Old order was not set, so we can do autofill
            const { columnFields } = (0, autofill_helpers_1.autofillTableVisualization)({ fields });
            newVisualization.placeholders[0].items = columnFields;
        }
    }
    return {
        colors: newColors,
        visualization: newVisualization,
    };
};
exports.migrateOrAutofillVisualization = migrateOrAutofillVisualization;
const mapItems = ({ items, fields }) => {
    return items.map((item, i) => {
        const exactField = fields.find((field) => field.guid === item.guid && field.data_type === item.data_type);
        // Field does not need to be mapped
        if (exactField) {
            delete item.conflict;
            return item;
        }
        const matchingField = fields.find((field) => field.title === item.title);
        // We need to use new field in placeholder
        if (matchingField) {
            if (item.data_type === matchingField.data_type) {
                // eslint-disable-next-line no-param-reassign
                return {
                    ...items[i],
                    ...matchingField,
                };
            }
            else {
                // eslint-disable-next-line no-param-reassign
                return matchingField;
            }
        }
        return {
            ...item,
            conflict: 'not-existing-ql',
        };
    });
};
exports.mapItems = mapItems;
const mapVisualizationPlaceholdersItems = ({ visualization, fields, }) => {
    const newVisualization = (0, cloneDeep_1.default)(visualization);
    // Visualization is not empty, we may need to map some new fields to existing fields in placeholders
    newVisualization.placeholders.forEach((placeholder) => {
        placeholder.items = (0, exports.mapItems)({ items: placeholder.items, fields });
    });
    return newVisualization;
};
exports.mapVisualizationPlaceholdersItems = mapVisualizationPlaceholdersItems;
