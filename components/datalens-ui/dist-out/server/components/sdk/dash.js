"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hashids_1 = __importDefault(require("hashids"));
const assign_1 = __importDefault(require("lodash/assign"));
const intersection_1 = __importDefault(require("lodash/intersection"));
const constants_1 = require("../../../shared/constants");
const modules_1 = require("../../../shared/modules");
const types_1 = require("../../../shared/types");
const us_1 = __importDefault(require("./us"));
function processControlLinkToResult(result, data, matchCallback) {
    if (data.sourceType === types_1.DashTabItemControlSourceType.Dataset && 'datasetId' in data.source) {
        const { datasetId } = data.source;
        result[datasetId] = matchCallback
            ? matchCallback(datasetId, data.source, 'datasetId')
            : datasetId;
    }
    return result;
}
function processLinksForItems(tabData, matchCallback) {
    return tabData.items.reduce((result, item) => {
        const { type, data } = item;
        if (type === types_1.DashTabItemType.Widget && 'tabs' in data) {
            return data.tabs.reduce((result, widget) => {
                const { chartId } = widget;
                result[chartId] = matchCallback
                    ? matchCallback(chartId, widget, 'chartId')
                    : chartId;
                return result;
            }, result);
        }
        else if (type === types_1.DashTabItemType.GroupControl) {
            data.group.forEach((groupItem) => {
                result = processControlLinkToResult(result, groupItem, matchCallback);
            });
        }
        else if (type === types_1.DashTabItemType.Control && 'sourceType' in data) {
            result = processControlLinkToResult(result, data, matchCallback);
            if (data.sourceType === types_1.DashTabItemControlSourceType.External &&
                'chartId' in data.source) {
                const { chartId } = data.source;
                result[chartId] = matchCallback
                    ? matchCallback(chartId, data.source, 'chartId')
                    : chartId;
            }
        }
        return result;
    }, {});
}
function processLinks(data, matchCallback) {
    return data.tabs.reduce((result, tab) => ({
        ...result,
        ...processLinksForItems(tab, matchCallback),
    }), {});
}
function gatherLinks(data) {
    return processLinks(data);
}
function setDefaultData(I18n, requestData, initialData = {}) {
    const i18n = I18n.keyset('dash.tabs-dialog.edit');
    let counter = 2;
    if ((initialData === null || initialData === void 0 ? void 0 : initialData.tabs) && !(initialData === null || initialData === void 0 ? void 0 : initialData.counter)) {
        counter = initialData.tabs.reduce((acc, tab) => {
            var _a;
            return acc + 1 + (((_a = tab.items) === null || _a === void 0 ? void 0 : _a.length) || 0); // + 1 tabId + n items ids
        }, 0);
    }
    const salt = Math.random().toString();
    const hashids = new hashids_1.default(salt);
    const data = {
        salt,
        counter,
        schemeVersion: constants_1.DASH_CURRENT_SCHEME_VERSION,
        tabs: [
            {
                id: hashids.encode(1),
                title: i18n('value_default', { index: 1 }),
                items: [],
                layout: [],
                aliases: {},
                connections: [],
            },
        ],
        settings: {
            autoupdateInterval: null,
            maxConcurrentRequests: null,
            silentLoading: false,
            dependentSelectors: true,
            hideTabs: false,
            hideDashTitle: false,
            expandTOC: false,
        },
    };
    return (0, assign_1.default)(data, initialData, requestData);
}
const needSetDefaultData = (data) => constants_1.DASH_DATA_REQUIRED_FIELDS.some((fieldName) => !(fieldName in data));
function validateData(data) {
    const allTabsIds = new Set();
    const allItemsIds = new Set();
    const allWidgetTabsIds = new Set();
    const isIdUniq = (id) => {
        if (allTabsIds.has(id) || allItemsIds.has(id) || allWidgetTabsIds.has(id)) {
            throw new Error(`Duplicated id ${id}`);
        }
        return true;
    };
    data.tabs.forEach(({ id: tabId, title: tabTitle, items, layout, connections }) => {
        const currentItemsIds = new Set();
        const currentWidgetTabsIds = new Set();
        const currentControlsIds = new Set();
        if (isIdUniq(tabId)) {
            allTabsIds.add(tabId);
        }
        items.forEach(({ id: itemId, type, data }) => {
            if (isIdUniq(itemId)) {
                allItemsIds.add(itemId);
                currentItemsIds.add(itemId);
            }
            if (type === types_1.DashTabItemType.Control || type === types_1.DashTabItemType.GroupControl) {
                // if it is group control all connections set on its items
                if ('group' in data) {
                    data.group.forEach((widgetItem) => {
                        currentControlsIds.add(widgetItem.id);
                    });
                }
                else {
                    currentControlsIds.add(itemId);
                }
            }
            else if (type === types_1.DashTabItemType.Widget && 'tabs' in data) {
                data.tabs.forEach(({ id: widgetTabId }) => {
                    if (isIdUniq(widgetTabId)) {
                        allWidgetTabsIds.add(widgetTabId);
                        currentWidgetTabsIds.add(widgetTabId);
                    }
                });
            }
        });
        // checking that layout has all the ids from item, i.e. positions are set for all elements
        if (items.length !== layout.length ||
            items.length !==
                (0, intersection_1.default)(Array.from(currentItemsIds), layout.map(({ i }) => i)).length) {
            throw new Error(`Not consistent items and layout on tab ${tabTitle}`);
        }
        connections.forEach(({ from, to }) => {
            if ((!currentWidgetTabsIds.has(from) && !currentControlsIds.has(from)) ||
                (!currentWidgetTabsIds.has(to) && !currentControlsIds.has(to))) {
                throw new Error(`Items ${from} and ${to} could not be in connection`);
            }
        });
    });
}
class Dash {
    static async create(data, headers, ctx, I18n) {
        try {
            let usData = {
                ...data,
                scope: types_1.EntryScope.Dash,
                type: '',
                mode: data.mode || types_1.EntryUpdateMode.Publish,
            };
            if (data.asNew) {
                usData = {
                    ...data,
                    key: data.key,
                    scope: types_1.EntryScope.Dash,
                    type: '',
                };
            }
            else if (needSetDefaultData(usData.data)) {
                usData.data = setDefaultData(I18n, usData.data);
            }
            const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
            const isServerMigrationEnabled = Boolean(isEnabledServerFeature(types_1.Feature.DashServerMigrationEnable));
            if (isServerMigrationEnabled && modules_1.DashSchemeConverter.isUpdateNeeded(usData.data)) {
                usData.data = await modules_1.DashSchemeConverter.update(usData.data);
            }
            usData.links = gatherLinks(usData.data);
            validateData(usData.data);
            const headersWithMetadata = {
                ...headers,
                ...ctx.getMetadata(),
            };
            const createdEntry = (await us_1.default.createEntry(Dash.migrateDescriptionForSave(usData), headersWithMetadata, ctx));
            ctx.log('SDK_DASH_CREATE_SUCCESS', us_1.default.getLoggedEntry(createdEntry));
            return Dash.migrateDescriptionForClient(createdEntry);
        }
        catch (error) {
            ctx.logError('SDK_DASH_CREATE_FAILED', error, us_1.default.getLoggedErrorEntry(data));
            throw error;
        }
    }
    static async read(entryId, params, headers, ctx, options) {
        try {
            const headersWithMetadata = {
                ...headers,
                ...ctx.getMetadata(),
            };
            const result = await us_1.default.readEntry(entryId, params, headersWithMetadata, ctx).then((entry) => Dash.migrateDescriptionForClient(entry));
            const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
            const isServerMigrationEnabled = Boolean(isEnabledServerFeature(types_1.Feature.DashServerMigrationEnable));
            if (((options === null || options === void 0 ? void 0 : options.forceMigrate) || isServerMigrationEnabled) &&
                modules_1.DashSchemeConverter.isUpdateNeeded(result.data)) {
                result.data = await Dash.migrate(result.data);
            }
            ctx.log('SDK_DASH_READ_SUCCESS', us_1.default.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_DASH_READ_FAILED', error, { entryId, params });
            throw error;
        }
    }
    static async migrate(data) {
        return modules_1.DashSchemeConverter.update(data);
    }
    static migrateDescription(prevEntry) {
        var _a;
        if (prevEntry.data && 'description' in prevEntry.data) {
            const entry = {
                ...prevEntry,
                annotation: {
                    description: (_a = prevEntry.data.description) !== null && _a !== void 0 ? _a : '',
                },
            };
            delete entry.data.description;
            return entry;
        }
        return prevEntry;
    }
    static migrateDescriptionForClient(prevEntry) {
        var _a;
        if (prevEntry.data && 'description' in prevEntry.data && !prevEntry.annotation) {
            return {
                ...prevEntry,
                annotation: {
                    description: prevEntry.data.description,
                },
            };
        }
        if (((_a = prevEntry.annotation) === null || _a === void 0 ? void 0 : _a.description) && !prevEntry.data.description) {
            return {
                ...prevEntry,
                data: {
                    ...prevEntry.data,
                    description: prevEntry.annotation.description,
                },
            };
        }
        return prevEntry;
    }
    static migrateDescriptionForSave(prevEntry) {
        var _a, _b, _c;
        if (prevEntry.annotation) {
            return {
                ...prevEntry,
                annotation: {
                    description: (_a = prevEntry.annotation.description) !== null && _a !== void 0 ? _a : '',
                },
            };
        }
        if (prevEntry.data && 'description' in prevEntry.data) {
            const entry = {
                ...prevEntry,
                annotation: {
                    description: (_b = prevEntry.data.description) !== null && _b !== void 0 ? _b : '',
                },
            };
            delete entry.data.description;
            return entry;
        }
        if (prevEntry && 'description' in prevEntry) {
            const entry = {
                ...prevEntry,
                annotation: {
                    description: (_c = prevEntry.description) !== null && _c !== void 0 ? _c : '',
                },
            };
            delete entry.description;
            return entry;
        }
        return prevEntry;
    }
    static async update(entryId, data, headers, ctx, I18n, options) {
        try {
            const usData = { ...data };
            const mode = data.mode || types_1.EntryUpdateMode.Publish;
            const needDataSend = !(mode === types_1.EntryUpdateMode.Publish && data.revId);
            if (needDataSend) {
                if (needSetDefaultData(usData.data)) {
                    const initialData = await Dash.read(entryId, null, headers, ctx, options);
                    usData.data = setDefaultData(I18n, usData.data, initialData.data);
                }
                usData.links = gatherLinks(usData.data);
                validateData(usData.data);
            }
            if (mode !== types_1.EntryUpdateMode.Publish) {
                usData.skipSyncLinks = true;
            }
            const headersWithMetadata = {
                ...headers,
                ...ctx.getMetadata(),
            };
            const result = (await us_1.default.updateEntry(entryId, mode, Dash.migrateDescriptionForSave(usData), headersWithMetadata, ctx));
            ctx.log('SDK_DASH_UPDATE_SUCCESS', us_1.default.getLoggedEntry(result));
            return Dash.migrateDescriptionForClient(result);
        }
        catch (error) {
            ctx.logError('SDK_DASH_UPDATE_FAILED', error, {
                entryId,
                ...us_1.default.getLoggedErrorEntry(data),
            });
            throw error;
        }
    }
    static async delete(entryId, headers, ctx) {
        try {
            const headersWithMetadata = {
                ...headers,
                ...ctx.getMetadata(),
            };
            const result = (await us_1.default.deleteEntry(entryId, headersWithMetadata, ctx));
            ctx.log('SDK_DASH_DELETE_SUCCESS', us_1.default.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_DASH_DELETE_FAILED', error, { entryId });
            throw error;
        }
    }
}
Dash.validateData = validateData;
Dash.processLinks = processLinks;
Dash.processLinksForItems = processLinksForItems;
Dash.gatherLinks = gatherLinks;
exports.default = Dash;
