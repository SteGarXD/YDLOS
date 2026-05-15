import React from 'react';

import {ChevronsCollapseUpRight, ChevronsExpandUpRight} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {i18n} from 'i18n';
import {normalizeFlatTableTreeStateList, type StringParams} from 'shared';
import {MenuItemsIds} from 'shared';

import type {MenuItemConfig} from './Menu';
import {
    collectFlatTableRowTreeFlightKeys,
    flatTableRowTreeHasExpandableNesting,
    tableDataIsFlatTableRowTreeResponse,
} from '../ChartKit/plugins/Table/renderer/utils/flatTableRowTreeKeys';
import {
    isFlatTableRowTreeCollapsed,
    isFlatTableRowTreeExplicitlyDisabled,
    parseFlatTableRowTreeEnabled,
    treeStateListsEqualForExpandAll,
} from './flatTableRowTreeMenuUtils';
import {ICONS_MENU_DEFAULT_SIZE, type MenuItemArgs} from './MenuItems';

function treeStateFromParams(params: StringParams | undefined): string[] {
    if (!params?.treeState) {
        return [];
    }
    return normalizeFlatTableTreeStateList(
        ([] as string[]).concat(params.treeState).filter(Boolean) as string[],
    );
}

function isFlatTableRowTreeMenuVisible(args: MenuItemArgs): boolean {
    const {loadedData, error} = args;
    if (error && !error?.extra?.rowsExceededLimit) {
        return false;
    }
    if (!loadedData || loadedData.type !== 'table') {
        return false;
    }
    /* Pivot and other tables: require server marker or explicit shared flag. */
    if (
        !tableDataIsFlatTableRowTreeResponse(loadedData.data) &&
        !parseFlatTableRowTreeEnabled(args.propsData)
    ) {
        return false;
    }
    if (isFlatTableRowTreeExplicitlyDisabled(args.propsData)) {
        return false;
    }
    const rows = loadedData.data?.rows;
    if (collectFlatTableRowTreeFlightKeys(rows).length === 0) {
        return false;
    }
    if (!flatTableRowTreeHasExpandableNesting(loadedData.data, rows)) {
        return false;
    }
    return true;
}

export function getFlatTableRowTreeExpandAllMenuItem(): MenuItemConfig {
    return {
        id: MenuItemsIds.FLAT_TABLE_ROW_TREE_EXPAND_ALL,
        get title() {
            return i18n('chartkit.menu', 'flat-table-row-tree-expand-all');
        },
        icon: <Icon data={ChevronsExpandUpRight} size={ICONS_MENU_DEFAULT_SIZE} />,
        isVisible: (args: MenuItemArgs) => isFlatTableRowTreeMenuVisible(args),
        isDisabled: (args: MenuItemArgs) => {
            if (!isFlatTableRowTreeMenuVisible(args)) {
                return false;
            }
            const {loadedData} = args;
            if (!loadedData || loadedData.type !== 'table') {
                return false;
            }
            const allKeys = collectFlatTableRowTreeFlightKeys(loadedData.data.rows);
            if (treeStateListsEqualForExpandAll(allKeys, loadedData.params?.treeState)) {
                return i18n('chartkit.menu', 'flat-table-row-tree-already-expanded');
            }
            return false;
        },
        action: ({onChange, loadedData}) => {
            if (!loadedData || loadedData.type !== 'table') {
                return;
            }
            const allKeys = collectFlatTableRowTreeFlightKeys(loadedData.data.rows);
            onChange(
                {type: 'PARAMS_CHANGED', data: {params: {treeState: allKeys}}},
                {forceUpdate: true},
                true,
                true,
            );
        },
    };
}

export function getFlatTableRowTreeCollapseAllMenuItem(): MenuItemConfig {
    return {
        id: MenuItemsIds.FLAT_TABLE_ROW_TREE_COLLAPSE_ALL,
        get title() {
            return i18n('chartkit.menu', 'flat-table-row-tree-collapse-all');
        },
        icon: <Icon data={ChevronsCollapseUpRight} size={ICONS_MENU_DEFAULT_SIZE} />,
        isVisible: (args: MenuItemArgs) => isFlatTableRowTreeMenuVisible(args),
        isDisabled: (args: MenuItemArgs) => {
            if (!isFlatTableRowTreeMenuVisible(args)) {
                return false;
            }
            if (isFlatTableRowTreeCollapsed(treeStateFromParams(args.loadedData?.params))) {
                return i18n('chartkit.menu', 'flat-table-row-tree-already-collapsed');
            }
            return false;
        },
        action: ({onChange}) => {
            const emptyTree: StringParams = {treeState: []};
            onChange(
                {type: 'PARAMS_CHANGED', data: {params: emptyTree}},
                {forceUpdate: true},
                true,
                true,
            );
        },
    };
}
