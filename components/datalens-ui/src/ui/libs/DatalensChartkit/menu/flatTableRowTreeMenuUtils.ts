import {normalizeFlatTableTreeStateList} from 'shared';

import {sortFlightTreeKeys} from '../ChartKit/plugins/Table/renderer/utils/flatTableRowTreeKeys';

export type ChartConfigWithShared = {
    config?: {data?: {shared?: string}};
};

export {collectFlatTableRowTreeFlightKeys, sortFlightTreeKeys} from '../ChartKit/plugins/Table/renderer/utils/flatTableRowTreeKeys';

export function parseFlatTableRowTreeEnabled(propsData?: ChartConfigWithShared): boolean {
    const raw = propsData?.config?.data?.shared;
    if (!raw || typeof raw !== 'string') {
        return false;
    }
    try {
        const shared = JSON.parse(raw) as {extraSettings?: {flatTableRowTree?: {enabled?: boolean}}};
        return shared?.extraSettings?.flatTableRowTree?.enabled === true;
    } catch {
        return false;
    }
}

/** В shared явно стоит flatTableRowTree.enabled: false (отличие от «shared нет на дашборде»). */
export function isFlatTableRowTreeExplicitlyDisabled(propsData?: ChartConfigWithShared): boolean {
    const raw = propsData?.config?.data?.shared;
    if (!raw || typeof raw !== 'string') {
        return false;
    }
    try {
        const shared = JSON.parse(raw) as {extraSettings?: {flatTableRowTree?: {enabled?: boolean}}};
        const ft = shared?.extraSettings?.flatTableRowTree;
        return ft !== undefined && ft.enabled === false;
    } catch {
        return false;
    }
}

export function treeStateListsEqualForExpandAll(
    allFlightKeysSorted: string[],
    treeState: string | string[] | undefined,
): boolean {
    const cur = normalizeFlatTableTreeStateList(
        ([] as string[]).concat(treeState ?? []).filter(Boolean) as string[],
    );
    const sortedCur = sortFlightTreeKeys(cur);
    if (allFlightKeysSorted.length !== sortedCur.length) {
        return false;
    }
    return allFlightKeysSorted.every((k, i) => k === sortedCur[i]);
}

export function isFlatTableRowTreeCollapsed(treeState: string | string[] | undefined): boolean {
    const cur = normalizeFlatTableTreeStateList(
        ([] as string[]).concat(treeState ?? []).filter(Boolean) as string[],
    );
    return cur.length === 0;
}
