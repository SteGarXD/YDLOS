import {I18n} from 'i18n';
import pick from 'lodash/pick';
import type {
    ApiV2Filter,
    ApiV2Parameter,
    DATASET_FIELD_TYPES,
    DashTabItemControlDataset,
    DashTabItemControlExternal,
    DashTabItemControlSingle,
    StringParams,
} from 'shared';
import {
    DATASET_IGNORED_DATA_TYPES,
    DashTabItemControlSourceType,
    DatasetFieldType,
    Operations,
    normalizeIntervalValueForMssqlScalar,
    resolveIntervalDate,
    resolveOperation,
    resolveRelativeDate,
    splitParamsToParametersAndFilters,
    transformParamsToUrlParams,
    transformUrlParamsToParams,
} from 'shared';
import type {
    ChartsData,
    DatasetFieldsListItem,
    ResponseControlsExtra,
    ResponseSuccessControls,
    ResponseSuccessSingleControl,
} from 'ui/libs/DatalensChartkit/modules/data-provider/charts/types';

import {LOAD_STATUS, TYPE} from './constants';
import type {DatasetSourceInfo, ErrorData, LoadStatus, ValidationErrorData} from './types';

const i18nError = I18n.keyset('dash.dashkit-control.error');

export const getStatus = (status: LoadStatus) => {
    let res = '';
    for (const [key, val] of Object.entries(LOAD_STATUS)) {
        if (status === val) {
            res = key;
        }
    }
    return LOAD_STATUS[res];
};

export const isValidRequiredValue = ({required, value}: ValidationErrorData) => {
    const isEmptyArray = Array.isArray(value) && !value.length;
    const isEmptyDateObject =
        !Array.isArray(value) && typeof value === 'object' && (!value.from || !value.to);

    if (!value || isEmptyArray || isEmptyDateObject) {
        return required;
    }

    return false;
};

export const getRequiredLabel = ({title, required}: {title: string; required?: boolean}) => {
    return required ? `${title}*` : title;
};

export const getLabels = (data: DashTabItemControlSingle) => {
    const title = data.title;
    const {showTitle, showInnerTitle, innerTitle, required} = data.source;

    const label = showTitle ? getRequiredLabel({title, required}) : '';
    let innerLabel = '';
    if (showInnerTitle && innerTitle) {
        // if title isn't shown than trying to add asterisk to innerLabel
        innerLabel = showTitle ? innerTitle : getRequiredLabel({title: innerTitle, required});
    }

    return {label, innerLabel};
};

export const getDatasetSourceInfo = <
    T extends ResponseControlsExtra = ResponseSuccessSingleControl,
>({
    currentLoadedData,
    data,
    actualLoadedData,
}: {
    currentLoadedData?: T;
    data: DashTabItemControlDataset;
    actualLoadedData: null | ResponseSuccessControls;
}): DatasetSourceInfo => {
    const {datasetFieldId, datasetId, datasetLabelFieldId} = data.source;
    let datasetFieldType = null;

    const loadedData = currentLoadedData || (actualLoadedData as unknown as ChartsData);

    let datasetFields: DatasetFieldsListItem[] = [];

    if (loadedData && loadedData.extra.datasets) {
        const dataset = loadedData.extra.datasets.find((dataset) => dataset.id === datasetId);
        // when the dataset was changed for the selector.
        // During the following several renders datasetId is not presented in loadedData.extra.datasets,
        // datasetId will appears after new loadedData is received.
        if (dataset) {
            datasetFields = dataset.fieldsList;
            const field = dataset.fieldsList.find((field) => field.guid === datasetFieldId);

            if (field) {
                datasetFieldType = field.dataType;
            }
        }
    }

    const datasetFieldsMap = datasetFields.reduce(
        (acc, field) => {
            const fieldData = {
                fieldType: field.fieldType,
                guid: field.guid,
            };
            acc[field.guid] = fieldData;
            acc[field.title] = fieldData;

            return acc;
        },
        {} as Record<string, {guid: string; fieldType: DatasetFieldType}>,
    );

    return {
        datasetId,
        datasetFieldId,
        datasetLabelFieldId,
        datasetSearchFieldId: datasetLabelFieldId || datasetFieldId,
        datasetFieldType,
        datasetFields,
        datasetFieldsMap,
    };
};

export const checkDatasetFieldType = <
    T extends ResponseControlsExtra = ResponseSuccessSingleControl,
>({
    currentLoadedData,
    datasetData,
    actualLoadedData,
    onError,
    onSucces,
}: {
    currentLoadedData: T;
    datasetData: DashTabItemControlDataset;
    actualLoadedData: ResponseSuccessControls | null;
    onError: (errorData: ErrorData, status: LoadStatus) => void;
    onSucces: (loadedData: T, status: LoadStatus) => void;
}) => {
    const {datasetFieldType} = getDatasetSourceInfo<T>({
        currentLoadedData,
        data: datasetData,
        actualLoadedData,
    });

    if (
        datasetFieldType &&
        DATASET_IGNORED_DATA_TYPES.includes(datasetFieldType as DATASET_FIELD_TYPES)
    ) {
        const datasetErrorData = {
            data: {
                title: i18nError('label_field-error-title'),
                message: i18nError('label_field-error-text'),
            },
        };
        onError(datasetErrorData, LOAD_STATUS.FAIL);
    } else {
        onSucces(currentLoadedData, LOAD_STATUS.SUCCESS);
    }
};

export const getErrorText = (data: ErrorData['data']) => {
    if (typeof data?.error?.code === 'string') {
        return data.error.code;
    }
    if (typeof data?.error === 'string') {
        return data.error;
    }
    if (typeof data?.message === 'string') {
        return data.message;
    }
    if (data?.status && data.status === 504) {
        return i18nError('label_error-timeout');
    }

    return i18nError('label_error');
};

export const prepareSelectorError = (data: ErrorData['data'], requestId?: string) => {
    const errorBody = data?.error?.details?.sources?.distincts?.body;
    if (errorBody) {
        return {
            isCustomError: true,
            details: {
                source: {
                    code: errorBody.code,
                    details: errorBody.details,
                    debug: errorBody.debug || (requestId ? {requestId} : ''),
                },
            },
            message: errorBody.message,
            code: data.error?.code || '',
        };
    }

    const errorContent = data?.error;
    let debugInfo = errorContent?.debug || '';
    if (typeof errorContent?.debug === 'object' && requestId) {
        debugInfo = {...errorContent?.debug, requestId};
    }

    return {
        ...errorContent,
        debug: debugInfo,
        message: getErrorText(data),
        isCustomError: true,
    };
};

export const isExternalControl = (data: any): data is DashTabItemControlExternal =>
    data.sourceType === DashTabItemControlSourceType.External;

export const processParamsForGetDistincts = ({
    params,
    datasetSourceInfo,
    searchPattern,
}: {
    params: StringParams;
    datasetSourceInfo: DatasetSourceInfo;
    searchPattern: string;
}) => {
    const {datasetFields, datasetFieldId, datasetFieldsMap, datasetSearchFieldId} =
        datasetSourceInfo;
    const splitParams = splitParamsToParametersAndFilters(
        transformParamsToUrlParams(params),
        datasetFields,
    );

    const filtersParams = transformUrlParamsToParams(splitParams.filtersParams);

    // Пустой поиск: не добавлять ICONTAINS по полю — на части бэкендов (MSSQL) '' даёт 0 строк distinct.
    const trimmedSearch =
        typeof searchPattern === 'string' ? searchPattern.trim() : String(searchPattern ?? '');
    const searchFilterSeed =
        trimmedSearch === ''
            ? []
            : [
                  {
                      column: datasetSearchFieldId,
                      operation: Operations.ICONTAINS,
                      values: [trimmedSearch],
                  },
              ];

    const where = Object.entries(filtersParams).reduce((result, [key, rawValue]) => {
        // ignoring the values of the current field when filtering,
        // because it is enabled by default with operation: 'ICONTAINS',
        // otherwise, we will search among the selected
        if (key === datasetFieldId) {
            return result;
        }

        const valuesWithOperation = (Array.isArray(rawValue) ? rawValue : [rawValue]).map((item) =>
            resolveOperation(item),
        );

        if (valuesWithOperation.length > 0 && valuesWithOperation[0]?.value) {
            const value = valuesWithOperation[0]?.value;
            let operation = valuesWithOperation[0]?.operation;
            let values = valuesWithOperation.map((item) => item?.value!);

            if (valuesWithOperation.length === 1 && value.indexOf('__interval_') === 0) {
                const resolvedInterval = resolveIntervalDate(value);

                if (resolvedInterval) {
                    values = [resolvedInterval.from, resolvedInterval.to];
                    operation = Operations.BETWEEN;
                }
            }

            if (valuesWithOperation.length === 1 && value.indexOf('__relative_') === 0) {
                const resolvedRelative = resolveRelativeDate(value);

                if (resolvedRelative) {
                    values = [resolvedRelative];
                }
            }

            result.push({
                column: key,
                operation,
                values,
            });
        }

        return result;
    }, searchFilterSeed);

    const filters: ApiV2Filter[] = where
        .filter((el) => {
            const mapped = datasetFieldsMap[el.column];
            if (!mapped) {
                return false;
            }
            return mapped.fieldType !== DatasetFieldType.Measure;
        })
        .map<ApiV2Filter>((filter) => {
            return {
                ref: {type: 'id', id: filter.column},
                operation: filter.operation,
                values: filter.values,
            };
        });

    const parameter_values: ApiV2Parameter[] = splitParams.parametersParams
        .filter(([key, rawValue]) => {
            if (!datasetFieldsMap[key]) {
                return false;
            }
            const prepared = Array.isArray(rawValue) ? String(rawValue[0] ?? '') : String(rawValue ?? '');
            const trimmed = prepared.trim();
            // Empty defaults (e.g. "Не определено") should not be sent as TVF parameters for distincts.
            // They often produce DB errors in editor/runtime and cause one-time selector resets.
            return trimmed !== '' && trimmed !== '[]';
        })
        .map<ApiV2Parameter>(([key, value]) => {
            // YDL OS: MSSQL TVF parameters must receive a single scalar date, not __interval_FROM_TO.
            let normalizedValue: string = value;
            if (typeof normalizedValue === 'string' && normalizedValue.startsWith('__interval_')) {
                normalizedValue = normalizeIntervalValueForMssqlScalar(normalizedValue, key);
            }
            return {
                ref: {type: 'id', id: key},
                value: normalizedValue,
            };
        });

    return {
        filters,
        parameter_values,
    };
};

type UiSchemeControlLite = {type?: string; param?: string};

export function getControlsFromLoadedUiScheme(
    loadedData: {uiScheme?: unknown} | null | undefined,
): UiSchemeControlLite[] {
    const ui = loadedData?.uiScheme;
    if (!ui) {
        return [];
    }
    if (Array.isArray(ui)) {
        return ui as UiSchemeControlLite[];
    }
    if (typeof ui === 'object' && 'controls' in ui) {
        const controls = (ui as {controls?: unknown}).controls;
        return Array.isArray(controls) ? (controls as UiSchemeControlLite[]) : [];
    }
    return [];
}

/**
 * Ключи для pick(params): union usedParams и defaults — иначе при dependentSelectors теряются поля,
 * которые есть в defaults (алиасы dta1/dta2 и др.), но не перечислены в usedParams ответа контрола.
 */
export function pickSignificantParamsSubset<P extends StringParams>(
    params: StringParams,
    usedParams?: Record<string, unknown> | null,
    defaults?: StringParams,
): P {
    const keys = new Set([
        ...Object.keys(usedParams || {}),
        ...Object.keys(defaults || {}),
    ]);
    return pick(params, [...keys]) as P;
}

/**
 * При dependentSelectors + usedParams бэкенд иногда не перечисляет поля даты, хотя они в defaults.
 * Без ключа в significant params рендер контрола даёт `null` («дата пропала»).
 */
export function appendDatepickerParamsFromScheme<P extends StringParams>(
    picked: P,
    fullParams: StringParams,
    defaults: StringParams | undefined,
    loadedData: {usedParams?: Record<string, unknown>; uiScheme?: unknown} | null | undefined,
): P {
    if (!loadedData?.usedParams) {
        return picked;
    }
    const usedKeys = new Set(Object.keys(loadedData.usedParams));
    const next: Record<string, string | string[] | undefined> = {...picked};
    for (const c of getControlsFromLoadedUiScheme(loadedData)) {
        if (c.type !== TYPE.DATEPICKER && c.type !== TYPE.RANGE_DATEPICKER) {
            continue;
        }
        const p = c.param;
        if (!p || usedKeys.has(p)) {
            continue;
        }
        if (fullParams[p] !== undefined) {
            next[p] = fullParams[p];
        } else if (defaults?.[p] !== undefined) {
            next[p] = defaults[p];
        }
    }
    return next as P;
}

const CONTROL_INFRA_RETRYABLE_CODES = new Set([
    'ECONNRESET',
    'ECONNABORTED',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
]);

/**
 * Кратковременные сбои до control-api / сети (часто ECONNRESET), после которых повтор обычно проходит.
 * Не маскирует «настоящие» 4xx и стабильные 500 с телом ошибки от приложения.
 */
export function isTransientControlInfrastructureError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const e = error as Record<string, unknown>;
    const response = e.response as {status?: number} | undefined;
    const status = typeof response?.status === 'number' ? response.status : undefined;

    if (status === 502 || status === 503 || status === 504) {
        return true;
    }

    if (!response && e.code === 'ERR_NETWORK') {
        return true;
    }

    const code = String(e.code ?? '').toUpperCase();
    if (CONTROL_INFRA_RETRYABLE_CODES.has(code)) {
        return true;
    }

    const msg = String(e.message ?? '').toLowerCase();
    if (
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('socket hang up') ||
        msg.includes('network error')
    ) {
        return true;
    }

    if (status === 500 && (msg.includes('econnreset') || msg.includes('socket') || msg.includes('reset'))) {
        return true;
    }

    return false;
}
