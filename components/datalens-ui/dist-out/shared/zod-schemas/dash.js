"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashSchema = exports.dataSchema = void 0;
const z = __importStar(require("zod"));
const __1 = require("..");
const DASH_DEFAULT_NAMESPACE = 'default';
// Text definition
const textSchema = z.object({
    text: z.string(),
});
// Title definition
const titleSchema = z.object({
    text: z.string(),
    size: z.enum(__1.DashTabItemTitleSizes),
    showInTOC: z.boolean(),
});
// Widget definition
const widgetSchema = z.object({
    hideTitle: z.boolean(),
    tabs: z.array(z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string(),
        chartId: z.string().min(1),
        isDefault: z.boolean(),
        params: z.record(z.any(), z.any()),
        autoHeight: z.boolean().optional(),
    })),
});
// Control element type definition
const controlElementTypeSchema = z
    .object({
    required: z.boolean().optional(),
    showHint: z.boolean().optional(),
    showTitle: z.boolean(),
    elementType: z.enum(__1.DashTabItemControlElementType),
})
    .and(z.discriminatedUnion('elementType', [
    z.object({
        elementType: z.literal(__1.DashTabItemControlElementType.Select),
        defaultValue: z.union([z.string(), z.array(z.string())]),
        multiselectable: z.boolean(),
    }),
    z.object({
        elementType: z.literal(__1.DashTabItemControlElementType.Date),
        defaultValue: z.string(),
        isRange: z.boolean(),
    }),
    z.object({
        elementType: z.literal(__1.DashTabItemControlElementType.Input),
        defaultValue: z.string(),
    }),
    z.object({
        elementType: z.literal(__1.DashTabItemControlElementType.Checkbox),
        defaultValue: z.string(),
    }),
]));
// Control source dataset definition
const controlSourceDatasetSchema = controlElementTypeSchema.and(z.object({
    datasetId: z.string().min(1),
    datasetFieldId: z.string().min(1),
}));
// Control source manual definition
const controlSourceManualSchema = controlElementTypeSchema.and(z.object({
    fieldName: z.string().min(1),
    fieldType: z.string(),
    acceptableValues: z.union([
        // elementType: select
        z.array(z.object({
            value: z.string(),
            title: z.string(),
        })),
        // elementType: date
        z.object({
            from: z.string(),
            to: z.string(),
        }),
    ]),
}));
// Control source external definition
const controlSourceExternalSchema = z.object({
    chartId: z.string().min(1),
    text: z.string().optional(),
    autoHeight: z.boolean().optional(),
});
// Control definition
const controlSchema = z
    .object({
    id: z.string().min(1),
    namespace: z.literal(DASH_DEFAULT_NAMESPACE),
    title: z.string().min(1),
    sourceType: z.enum(__1.DashTabItemControlSourceType),
})
    .and(z.discriminatedUnion('sourceType', [
    z.object({
        sourceType: z.literal(__1.DashTabItemControlSourceType.Dataset),
        source: controlSourceDatasetSchema,
    }),
    z.object({
        sourceType: z.literal(__1.DashTabItemControlSourceType.Manual),
        source: controlSourceManualSchema,
    }),
    z.object({
        sourceType: z.literal(__1.DashTabItemControlSourceType.External),
        source: controlSourceExternalSchema,
    }),
]));
// Group control items definition
const groupControlItemsSchema = z
    .object({
    id: z.string().min(1),
    title: z.string().min(1),
    namespace: z.literal(DASH_DEFAULT_NAMESPACE),
    sourceType: z.union([
        z.literal(__1.DashTabItemControlSourceType.Dataset),
        z.literal(__1.DashTabItemControlSourceType.Manual),
    ]),
    defaults: z.record(z.any(), z.any()),
    placementMode: z.enum(__1.CONTROLS_PLACEMENT_MODE).optional(),
    width: z.string().optional(),
})
    .and(z.discriminatedUnion('sourceType', [
    z.object({
        sourceType: z.literal(__1.DashTabItemControlSourceType.Dataset),
        source: controlSourceDatasetSchema,
    }),
    z.object({
        sourceType: z.literal(__1.DashTabItemControlSourceType.Manual),
        source: controlSourceManualSchema,
    }),
]));
// Group control definition
const groupControlSchema = z.object({
    group: z.array(groupControlItemsSchema),
    autoHeight: z.boolean(),
    buttonApply: z.boolean(),
    buttonReset: z.boolean(),
    showGroupName: z.boolean(),
    updateControlsOnChange: z.boolean().optional(),
});
// Layout item definition
const layoutItemSchema = z.object({
    i: z.string().min(1),
    h: z.number(),
    w: z.number(),
    x: z.number(),
    y: z.number(),
    parent: z.string().optional(),
});
// Connection definition
const connectionSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    kind: z.enum(__1.DashTabConnectionKind),
});
// Tab item definition
const tabItemSchema = z
    .object({
    id: z.string().min(1),
    namespace: z.literal(DASH_DEFAULT_NAMESPACE),
    type: z.enum(__1.DashTabItemType),
})
    .and(z.discriminatedUnion('type', [
    z.object({
        type: z.literal(__1.DashTabItemType.Text),
        data: textSchema,
    }),
    z.object({
        type: z.literal(__1.DashTabItemType.Title),
        data: titleSchema,
    }),
    z.object({
        type: z.literal(__1.DashTabItemType.Widget),
        data: widgetSchema,
    }),
    z.object({
        type: z.literal(__1.DashTabItemType.Control),
        data: controlSchema,
        defaults: z.record(z.any(), z.any()),
    }),
    z.object({
        type: z.literal(__1.DashTabItemType.GroupControl),
        data: groupControlSchema,
        defaults: z.record(z.any(), z.union([z.string(), z.array(z.string())])),
    }),
]));
// Alias definition
const aliasRecordSchema = z.array(z.string().min(1)).max(2).min(2);
// Tab definition
const tabSchema = z
    .object({
    id: z.string().min(1),
    title: z.string().min(1),
    items: z.array(tabItemSchema),
    layout: z.array(layoutItemSchema),
    connections: z.array(connectionSchema),
    aliases: z
        .object({
        [DASH_DEFAULT_NAMESPACE]: z.array(aliasRecordSchema).optional(),
    })
        .strict(),
})
    .strict();
// Settings definition
const settingsSchema = z.object({
    autoupdateInterval: z.union([z.number().min(30), z.null()]),
    maxConcurrentRequests: z.union([z.number().min(1), z.null()]),
    loadPriority: z.enum(__1.DashLoadPriority).optional(),
    silentLoading: z.boolean(),
    dependentSelectors: z.boolean(),
    globalParams: z.record(z.any(), z.any()).optional(),
    hideTabs: z.boolean(),
    hideDashTitle: z.boolean().optional(),
    expandTOC: z.boolean(),
    assistantEnabled: z.boolean().optional(),
});
// Data definition
exports.dataSchema = z.object({
    counter: z.number().int().min(1),
    salt: z.string().min(1),
    schemeVersion: z.literal(__1.DASH_CURRENT_SCHEME_VERSION).default(__1.DASH_CURRENT_SCHEME_VERSION),
    tabs: z.array(tabSchema),
    settings: settingsSchema,
    supportDescription: z.string().optional(),
    accessDescription: z.string().optional(),
});
// Main dashboard API validation schema
exports.dashSchema = z.object({
    key: z.string().min(1).optional(),
    workbookId: z.union([z.null(), z.string()]).optional(),
    data: exports.dataSchema,
    meta: z.record(z.any(), z.any()).optional(),
    links: z.record(z.string(), z.string()).optional(),
});
