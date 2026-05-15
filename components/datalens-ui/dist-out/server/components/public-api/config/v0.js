"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicApiActionsV0 = void 0;
const shared_1 = require("../../../../shared");
const constants_1 = require("../constants");
const getPublicApiActionsV0 = () => {
    return {
        // Connection
        getConnection: {
            resolve: (api) => api.bi.getConnection,
            openApi: {
                summary: 'Get connection',
                tags: [constants_1.ApiTag.Connection],
            },
        },
        createConnection: {
            resolve: (api) => api.bi.createConnection,
            openApi: {
                summary: 'Create connection',
                tags: [constants_1.ApiTag.Connection],
            },
        },
        updateConnection: {
            resolve: (api) => api.bi.updateConnection,
            openApi: {
                summary: 'Update connection',
                tags: [constants_1.ApiTag.Connection],
            },
        },
        deleteConnection: {
            resolve: (api) => api.bi.deleteConnection,
            openApi: {
                summary: 'Delete connection',
                tags: [constants_1.ApiTag.Connection],
            },
        },
        // Dataset
        getDataset: {
            resolve: (api) => api.bi.getDatasetByVersion,
            openApi: {
                summary: 'Get dataset',
                tags: [constants_1.ApiTag.Dataset],
            },
        },
        createDataset: {
            resolve: (api) => api.bi.createDataset,
            openApi: {
                summary: 'Create dataset',
                tags: [constants_1.ApiTag.Dataset],
            },
        },
        updateDataset: {
            resolve: (api) => api.bi.updateDataset,
            openApi: {
                summary: 'Update dataset',
                tags: [constants_1.ApiTag.Dataset],
            },
        },
        deleteDataset: {
            resolve: (api) => api.bi.deleteDataset,
            openApi: {
                summary: 'Delete dataset',
                tags: [constants_1.ApiTag.Dataset],
            },
        },
        validateDataset: {
            resolve: (api) => api.bi.validateDataset,
            openApi: {
                summary: 'Validate dataset',
                tags: [constants_1.ApiTag.Dataset],
            },
        },
        // Wizard
        getWizardChart: {
            resolve: (api) => api.mix.__getWizardChart__,
            openApi: {
                summary: 'Get wizard chart',
                tags: [constants_1.ApiTag.Wizard],
                experimental: true,
            },
        },
        deleteWizardChart: {
            resolve: (api) => api.mix._deleteWizardChart,
            openApi: {
                summary: 'Delete wizard chart',
                tags: [constants_1.ApiTag.Wizard],
            },
        },
        // QL
        getQLChart: {
            resolve: (api) => api.mix.__getQLChart__,
            openApi: {
                summary: 'Get QL chart',
                tags: [constants_1.ApiTag.QL],
                experimental: true,
            },
        },
        deleteQLChart: {
            resolve: (api) => api.mix._deleteQLChart,
            openApi: {
                summary: 'Delete QL chart',
                tags: [constants_1.ApiTag.QL],
            },
        },
        // Dashboard
        getDashboard: {
            resolve: (api) => api.mix.__getDashboard__,
            openApi: {
                summary: 'Get dashboard',
                tags: [constants_1.ApiTag.Dashboard],
                experimental: true,
            },
        },
        createDashboard: {
            resolve: (api) => api.mix.__createDashboard__,
            openApi: {
                summary: 'Create dashboard',
                tags: [constants_1.ApiTag.Dashboard],
                experimental: true,
            },
        },
        updateDashboard: {
            resolve: (api) => api.mix.__updateDashboard__,
            openApi: {
                summary: 'Update dashboard',
                tags: [constants_1.ApiTag.Dashboard],
                experimental: true,
            },
        },
        deleteDashboard: {
            resolve: (api) => api.mix._deleteDashboard,
            openApi: {
                summary: 'Delete dashboard',
                tags: [constants_1.ApiTag.Dashboard],
            },
        },
        // Navigation
        getEntries: {
            resolve: (api) => api.us.getEntries,
            openApi: {
                summary: 'Get entries',
                tags: [constants_1.ApiTag.Navigation],
            },
        },
        // Workbook
        createWorkbook: {
            resolve: (api) => api.us.createWorkbook,
            openApi: {
                summary: 'Create workbook',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        deleteWorkbook: {
            resolve: (api) => api.us.deleteWorkbook,
            openApi: {
                summary: 'Delete workbook',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        deleteWorkbooks: {
            resolve: (api) => api.us.deleteWorkbooks,
            openApi: {
                summary: 'Delete workbooks',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        getWorkbook: {
            resolve: (api) => api.us.getWorkbook,
            openApi: {
                summary: 'Get workbook',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        getWorkbooksList: {
            resolve: (api) => api.us.getWorkbooksList,
            openApi: {
                summary: 'Get workbooks list',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        moveWorkbook: {
            resolve: (api) => api.us.moveWorkbook,
            openApi: {
                summary: 'Move workbook',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        moveWorkbooks: {
            resolve: (api) => api.us.moveWorkbooks,
            openApi: {
                summary: 'Move workbooks',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        updateWorkbook: {
            resolve: (api) => api.us.updateWorkbook,
            openApi: {
                summary: 'Update workbook',
                tags: [constants_1.ApiTag.Workbook],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        // Collection
        createCollection: {
            resolve: (api) => api.us.createCollection,
            openApi: {
                summary: 'Create collection',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        deleteCollection: {
            resolve: (api) => api.us.deleteCollection,
            openApi: {
                summary: 'Delete collection',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        deleteCollections: {
            resolve: (api) => api.us.deleteCollections,
            openApi: {
                summary: 'Delete collections',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        getCollectionBreadcrumbs: {
            resolve: (api) => api.us.getCollectionBreadcrumbs,
            openApi: {
                summary: 'Get collection breadcrumbs',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        getCollection: {
            resolve: (api) => api.us.getCollection,
            openApi: {
                summary: 'Get collection',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        getRootCollectionPermissions: {
            resolve: (api) => api.us.getRootCollectionPermissions,
            openApi: {
                summary: 'Get root collection permissions',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        moveCollection: {
            resolve: (api) => api.us.moveCollection,
            openApi: {
                summary: 'Move collection',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        moveCollections: {
            resolve: (api) => api.us.moveCollections,
            openApi: {
                summary: 'Move collections',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
        updateCollection: {
            resolve: (api) => api.us.updateCollection,
            openApi: {
                summary: 'Update collection',
                tags: [constants_1.ApiTag.Collection],
            },
            features: [shared_1.Feature.CollectionsEnabled],
        },
    };
};
exports.getPublicApiActionsV0 = getPublicApiActionsV0;
