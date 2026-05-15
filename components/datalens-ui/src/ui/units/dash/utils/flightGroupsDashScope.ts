import type {DashData, DashTabItem, DashTabItemControlDataset} from 'shared';
import {DashTabItemControlSourceType, DashTabItemType} from 'shared';
import type {GetEntryResponse} from 'shared/schema';

/** Ссылка на селектор по датасету: отдельный Control или строка внутри GroupControl. */
export type DatasetControlRef = {
    itemId: string;
    datasetId: string;
    datasetFieldId: string;
    datasetLabelFieldId?: string;
    titleText: string;
};

/** Все селекторы по датасету на вкладке (включая вложенные в group_control). */
export function collectDatasetControlRefsFromItems(items: DashTabItem[]): DatasetControlRef[] {
    const out: DatasetControlRef[] = [];
    for (const item of items) {
        if (item.type === DashTabItemType.Control) {
            const data = item.data;
            if (data.sourceType === DashTabItemControlSourceType.Dataset) {
                const source = data.source as DashTabItemControlDataset['source'];
                out.push({
                    itemId: item.id,
                    datasetId: source.datasetId,
                    datasetFieldId: source.datasetFieldId,
                    datasetLabelFieldId: source.datasetLabelFieldId,
                    titleText: `${item.title || ''} ${source.innerTitle || ''}`.toLowerCase(),
                });
            }
        } else if (item.type === DashTabItemType.GroupControl) {
            for (const ctrl of item.data.group) {
                if (ctrl.sourceType === DashTabItemControlSourceType.Dataset) {
                    const source = ctrl.source as DashTabItemControlDataset['source'];
                    out.push({
                        itemId: ctrl.id,
                        datasetId: source.datasetId,
                        datasetFieldId: source.datasetFieldId,
                        datasetLabelFieldId: source.datasetLabelFieldId,
                        titleText: `${ctrl.title || ''} ${source.innerTitle || ''}`.toLowerCase(),
                    });
                }
            }
        }
    }
    return out;
}

/** Датасеты из селекторов (включая вложенные в group_control). */
export function collectControlDatasetIds(dashData: DashData | undefined): Set<string> {
    const ids = new Set<string>();
    if (!dashData?.tabs) {
        return ids;
    }
    for (const tab of dashData.tabs) {
        walkControlItems(tab.items, ids);
    }
    return ids;
}

function walkControlItems(items: DashTabItem[], ids: Set<string>) {
    for (const item of items) {
        if (item.type === DashTabItemType.Control) {
            if (item.data.sourceType === DashTabItemControlSourceType.Dataset) {
                const row = item.data as DashTabItemControlDataset;
                ids.add(row.source.datasetId);
            }
        } else if (item.type === DashTabItemType.GroupControl) {
            for (const ctrl of item.data.group) {
                if (ctrl.sourceType === DashTabItemControlSourceType.Dataset) {
                    const row = ctrl as DashTabItemControlDataset;
                    ids.add(row.source.datasetId);
                }
            }
        }
    }
}

/** Entry id чартов с виджетов (для последующего разрешения в datasetId). */
export function collectChartEntryIds(dashData: DashData | undefined): Set<string> {
    const ids = new Set<string>();
    if (!dashData?.tabs) {
        return ids;
    }
    for (const tab of dashData.tabs) {
        for (const item of tab.items) {
            if (item.type === DashTabItemType.Widget) {
                for (const wtab of item.data.tabs) {
                    ids.add(wtab.chartId);
                }
            }
        }
    }
    return ids;
}

export function extractDatasetIdFromChartEntry(
    entry: GetEntryResponse | null | undefined,
): string | undefined {
    if (!entry) {
        return undefined;
    }
    const data = entry.data as {shared?: {datasetId?: string}; datasetId?: string} | undefined;
    return data?.shared?.datasetId || data?.datasetId;
}
