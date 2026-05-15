import type {StringParams} from '../../../../../shared';

/**
 * Параметры UI чарта, которых нет на вкладке Params датасета.
 * Они должны попадать в usedParams ответа /api/run: иначе на дашборде
 * request строится как pick(initialParams, Object.keys(usedParams)) и теряет,
 * например, treeState — раскрытие строк таблицы-дерева сбрасывается при следующем клике.
 */
export {splitDuplicateIntervalParamsForDashAliases} from '../../../../../shared/modules/charts-shared';

export const CHART_RUNTIME_PARAM_KEYS: readonly string[] = [
    'treeState',
    '_page',
    'drillDownLevel',
    'drillDownFilters',
    '_columnId',
    '_sortOrder',
    '_sortColumnMeta',
    '_sortRowMeta',
    '__sortMeta',
];

export function mergeChartRuntimeParamsIntoUsedParams(
    params: StringParams,
    usedParams: Record<string, string | string[]>,
): void {
    for (const key of CHART_RUNTIME_PARAM_KEYS) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            usedParams[key] = params[key];
        }
    }
}

export const getSortParams = (params: StringParams) => {
    const columnId = Array.isArray(params._columnId) ? params._columnId[0] : params._columnId;
    const order = Array.isArray(params._sortOrder) ? params._sortOrder[0] : params._sortOrder;
    const _sortRowMeta = Array.isArray(params._sortRowMeta)
        ? params._sortRowMeta[0]
        : params._sortRowMeta;
    const _sortColumnMeta = Array.isArray(params._sortColumnMeta)
        ? params._sortColumnMeta[0]
        : params._sortColumnMeta;

    let meta: Record<string, any>;
    try {
        meta = {
            column: _sortColumnMeta ? JSON.parse(_sortColumnMeta) : {},
            row: _sortRowMeta ? JSON.parse(_sortRowMeta) : {},
        };
    } catch {
        meta = {};
    }

    return {columnId, order: Number(order), meta};
};

export const getCurrentPage = (params: StringParams): number => {
    const page = Number(Array.isArray(params._page) ? params._page[0] : params._page);
    return isNaN(page) ? 1 : page;
};

export const getParam = (paramName: string, params: StringParams) => {
    return params[paramName] || [];
};

export function updateParams({
    userParamsOverride,
    params,
    usedParams,
}: {
    userParamsOverride: Record<string, string | string[]> | undefined;
    params: StringParams;
    usedParams: StringParams;
}) {
    if (userParamsOverride) {
        Object.keys(userParamsOverride).forEach((key) => {
            const overridenItem = userParamsOverride[key];

            if (params[key] && params[key].length > 0) {
                if (Array.isArray(overridenItem) && overridenItem.length > 0) {
                    params[key] = overridenItem;
                }
            } else {
                params[key] = overridenItem;
            }

            usedParams[key] = params[key];
        });
    }
}

export function updateActionParams({
    userActionParamsOverride,
    actionParams,
}: {
    userActionParamsOverride: Record<string, string | string[]> | undefined;
    actionParams: StringParams;
}) {
    if (!userActionParamsOverride) {
        return actionParams;
    }
    return userActionParamsOverride;

    // todo after usedParams has fixed CHARTS-6619
    /*Object.keys(userActionParamsOverride).forEach((key) => {
        const overridenItem = userActionParamsOverride[key];

        if (params[key] && params[key].length > 0) {
            if (Array.isArray(overridenItem) && overridenItem.length > 0) {
                params[key] = overridenItem;
            }
        } else {
            params[key] = overridenItem;
        }

        usedParams[key] = params[key];
    });*/
}
