import type {StringParams} from '@gravity-ui/dashkit/helpers';
import {I18N} from 'i18n';
import pick from 'lodash/pick';
import {
    DashTabItemControlElementType,
    type DashTabItemControlSingle,
    DashTabItemControlSourceType,
    ErrorCode,
    applyDashIntervalAliasSplitToStringParams,
} from 'shared';
import {
    CHARTS_ERROR_CODE,
    type ResponseSuccessControls,
} from 'ui/libs/DatalensChartkit/modules/data-provider/charts';

import type {SelectorError} from '../Control/types';
import {appendDatepickerParamsFromScheme, pickSignificantParamsSubset} from '../Control/utils';

import type {ExtendedLoadedData, GroupControlLocalMeta} from './types';

const i18n = I18N.keyset('common.errors');

export const clearLoaderTimer = (timer?: NodeJS.Timeout) => {
    if (timer) {
        clearTimeout(timer);
    }
};

export const addItemToLocalQueue = (
    queue: GroupControlLocalMeta['queue'],
    widgetId: string,
    groupItemId: string,
    param?: string,
) => {
    const updatedQueue = queue.filter((queueItem) => queueItem.groupItemId !== groupItemId);

    updatedQueue.push({id: widgetId, groupItemId, param});

    return updatedQueue;
};

export const filterSignificantParams = ({
    params,
    loadedData,
    defaults,
    dependentSelectors,
}: {
    params: StringParams;
    loadedData?: ExtendedLoadedData | ResponseSuccessControls | null;
    defaults?: StringParams;
    dependentSelectors?: boolean;
}) => {
    if (!params) {
        return {};
    }

    if (loadedData && loadedData.usedParams && dependentSelectors) {
        const picked = pickSignificantParamsSubset(params, loadedData.usedParams, defaults);
        return applyDashIntervalAliasSplitToStringParams(
            appendDatepickerParamsFromScheme(picked, params, defaults, loadedData),
        );
    }

    // Пока нет usedParams с бэка, ограничиваемся ключами defaults этого контрола.
    // Иначе при dependentSelectors в объект попадают лишние ключи (битые алиасы) → долгий init / 424.
    if (defaults && Object.keys(defaults).length > 0) {
        return applyDashIntervalAliasSplitToStringParams(pick(params, Object.keys(defaults)));
    }

    return applyDashIntervalAliasSplitToStringParams(dependentSelectors ? params : {});
};

export const getErrorTitle = (errorInfo: SelectorError) => {
    const datasetsField =
        errorInfo?.details && 'sources' in errorInfo.details && errorInfo.details.sources
            ? Object.keys(errorInfo.details.sources)[0]
            : null;

    if (!datasetsField) {
        return null;
    }

    const datasetInfo = errorInfo?.details?.sources?.[datasetsField];

    const isIncorrectEntryIdCode =
        datasetInfo?.code === ErrorCode.IncorrectEntryIdForEmbed ||
        datasetInfo?.body?.code === ErrorCode.IncorrectEntryIdForEmbed;

    if (errorInfo?.code === CHARTS_ERROR_CODE.DATA_FETCHING_ERROR && isIncorrectEntryIdCode) {
        return i18n('label_error-outdated-message');
    }

    return null;
};

/** True when `params` is a flat param→value map (one control delta), not nested per–group-item state. */
export function isFlatControlParamMap(params: unknown): params is StringParams {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
        return false;
    }
    return Object.values(params as Record<string, unknown>).every(
        (v) =>
            v === null ||
            v === undefined ||
            typeof v === 'string' ||
            typeof v === 'boolean' ||
            typeof v === 'number' ||
            Array.isArray(v),
    );
}

function getGroupControlItemParamKey(item: DashTabItemControlSingle): string | null {
    if (item.sourceType === DashTabItemControlSourceType.Dataset) {
        return item.source.datasetFieldId;
    }
    if (item.sourceType === DashTabItemControlSourceType.Manual) {
        return item.source.fieldName;
    }
    return null;
}

function groupSelectorTitleText(item: DashTabItemControlSingle): string {
    const inner =
        'innerTitle' in item.source
            ? String((item.source as {innerTitle?: string}).innerTitle ?? '')
            : '';
    return `${item.title || ''} ${inner}`.toLowerCase();
}

function isEmptyParamValue(val: unknown): boolean {
    if (val === undefined || val === null || val === '') {
        return true;
    }
    if (Array.isArray(val)) {
        return val.length === 0;
    }
    if (typeof val === 'string') {
        const normalized = val.trim();
        return normalized === '' || normalized === '[]';
    }
    return false;
}

function isFlightSelectorItem(item: DashTabItemControlSingle): boolean {
    if (item.source.elementType !== DashTabItemControlElementType.Select) {
        return false;
    }
    const t = groupSelectorTitleText(item);
    return t.includes('рейс') || t.includes('flight');
}

/**
 * Сегмент «одна дата + зависящие селекторы» — от ближайшей даты слева до следующей даты (не включая её).
 * Порядок в группе: Дата1, Рейс1, Напр-е1, Дата2, Рейс2, Напр-е2 — смена Дата2 не должна трогать Рейс1.
 */
function getDateControlSegment(args: {
    group: DashTabItemControlSingle[];
    changedControlId: string;
}): DashTabItemControlSingle[] {
    const {group, changedControlId} = args;
    const controlIndex = group.findIndex((i) => i.id === changedControlId);
    if (controlIndex < 0) {
        return [];
    }

    let segStart = controlIndex;
    while (
        segStart >= 0 &&
        group[segStart].source.elementType !== DashTabItemControlElementType.Date
    ) {
        segStart--;
    }
    if (segStart < 0 || group[segStart].source.elementType !== DashTabItemControlElementType.Date) {
        return [];
    }

    let segEnd = controlIndex + 1;
    while (
        segEnd < group.length &&
        group[segEnd].source.elementType !== DashTabItemControlElementType.Date
    ) {
        segEnd++;
    }

    return group.slice(segStart, segEnd);
}

/**
 * When the user changes a date control, clear flight + direction selects in the same segment.
 */
export function getPerControlParamUpdatesWhenDateChanges(args: {
    group: DashTabItemControlSingle[];
    changedControlId: string;
    incomingDelta: StringParams;
    currentGroupStateParams?: Record<string, StringParams>;
}): Record<string, StringParams> {
    const {group, changedControlId, incomingDelta, currentGroupStateParams} = args;
    const changed = group.find((i) => i.id === changedControlId);
    if (!changed || changed.source.elementType !== DashTabItemControlElementType.Date) {
        return {[changedControlId]: incomingDelta};
    }

    // Clear dependent selects only on factual date value change.
    // On first apply after reload controls can emit sync onChange with same value; do not wipe flight/direction.
    const changedDateParamKey = getGroupControlItemParamKey(changed);
    if (changedDateParamKey) {
        const nextDateValue = incomingDelta[changedDateParamKey];
        const prevDateValue = currentGroupStateParams?.[changedControlId]?.[changedDateParamKey];
        if (nextDateValue === prevDateValue) {
            return {[changedControlId]: incomingDelta};
        }
    }

    const out: Record<string, StringParams> = {[changedControlId]: incomingDelta};

    const segmentItems = getDateControlSegment({group, changedControlId});

    for (const item of segmentItems) {
        if (item.id === changedControlId) {
            continue;
        }
        if (item.source.elementType !== DashTabItemControlElementType.Select) {
            continue;
        }
        const t = groupSelectorTitleText(item);
        const isFlight = t.includes('рейс') || t.includes('flight');
        const isDirection = t.includes('напр') || t.includes('direction');
        if (!isFlight && !isDirection) {
            continue;
        }
        const key = getGroupControlItemParamKey(item);
        if (!key) {
            continue;
        }
        out[item.id] = {[key]: ''};
    }

    return out;
}

export function isFlightControlDisabledWithoutDate(args: {
    group: DashTabItemControlSingle[];
    controlId: string;
    groupStateParams?: Record<string, StringParams>;
}): boolean {
    const {group, controlId, groupStateParams} = args;
    const currentItem = group.find((i) => i.id === controlId);
    if (!currentItem || !isFlightSelectorItem(currentItem)) {
        return false;
    }

    const segmentItems = getDateControlSegment({group, changedControlId: controlId});
    const dateItem = segmentItems.find(
        (item) => item.source.elementType === DashTabItemControlElementType.Date,
    );
    if (!dateItem) {
        return false;
    }

    let dateParamKey: string | null = null;
    if (dateItem.sourceType === DashTabItemControlSourceType.Dataset) {
        dateParamKey = dateItem.source.datasetFieldId;
    } else if (dateItem.sourceType === DashTabItemControlSourceType.Manual) {
        dateParamKey = dateItem.source.fieldName;
    }
    if (!dateParamKey) {
        return false;
    }

    const dateValue = groupStateParams?.[dateItem.id]?.[dateParamKey];
    return isEmptyParamValue(dateValue);
}

export function flattenPerControlStringParams(updates: Record<string, StringParams>): StringParams {
    return Object.values(updates).reduce<StringParams>((acc, delta) => ({...acc, ...delta}), {});
}

/**
 * Плоский merge параметров только по сегменту «дата → …» для `controlId`
 * (см. getDateControlSegment). Нужен для distinct: иначе две цепочки затирают
 * одинаковые guid (`flight_no_1`, `cf_d1`) и в «Напр-е» уходит чужая дата/рейс.
 */
export function getMergedParamsForControlDistinctSegment(args: {
    group: DashTabItemControlSingle[];
    groupStateParams: Record<string, StringParams> | undefined;
    controlId: string;
    currentControlParams: StringParams;
}): StringParams {
    const {group, groupStateParams, controlId, currentControlParams} = args;
    if (!groupStateParams || group.length === 0) {
        return {...currentControlParams};
    }
    const segment = getDateControlSegment({group, changedControlId: controlId});
    if (segment.length === 0) {
        const mergedAll = Object.values(groupStateParams).reduce<StringParams>(
            (acc, itemParams) => ({...acc, ...itemParams}),
            {},
        );
        return {...mergedAll, ...currentControlParams};
    }
    const fromSegment = segment.reduce<StringParams>((acc, item) => {
        const itemParams = groupStateParams[item.id];
        if (!itemParams) {
            return acc;
        }
        return {...acc, ...itemParams};
    }, {});
    return {...fromSegment, ...currentControlParams};
}
