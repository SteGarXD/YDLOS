import React from 'react';

import type {ConfigItem} from '@gravity-ui/dashkit';
import {Button} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import type {
    DashTabItemControlDataset,
    DashTabItemControlElementSelect,
    DashTabItemControlSingle,
    StringParams,
} from 'shared';
import {DashTabItemControlSourceType, normalizeIntervalValueForMssqlScalar} from 'shared';
import {DL} from 'ui/constants/common';
import type {ChartKitCustomError} from 'ui/libs/DatalensChartkit/ChartKit/modules/chartkit-custom-error/chartkit-custom-error';
import {ControlSelect} from 'ui/libs/DatalensChartkit/components/Control/Items/Items';
import type {
    DatasetFieldsListItem,
    ResponseSuccessSingleControl,
} from 'ui/libs/DatalensChartkit/modules/data-provider/charts/types';
import type {ControlSelect as ControlSelectType} from 'ui/libs/DatalensChartkit/types';
import {openDialogErrorWithTabs} from 'ui/store/actions/dialog';
import {addOperationForValue, unwrapFromArrayAndSkipOperation} from 'ui/units/dash/modules/helpers';
import {
    selectDashWorkbookId,
    selectFlightGroupsDatasetRefreshNonce,
} from 'ui/units/dash/store/selectors/dashTypedSelectors';
import {MOBILE_SIZE} from 'ui/utils/mobile';

import logger from '../../../../../libs/logger';
import {getControlHint} from '../../../utils';
import {LIMIT, LOAD_STATUS, TYPE} from '../constants';
import type {
    ControlSettings,
    ErrorData,
    LoadStatus,
    SelectControlProps,
    ValidationErrorData,
} from '../types';
import {
    getDatasetSourceInfo,
    getErrorText,
    isValidRequiredValue,
    prepareSelectorError,
    processParamsForGetDistincts,
} from '../utils';

import './ControlItemSelect.scss';

type ControlItemSelectProps = {
    id: string;
    data: DashTabItemControlSingle;
    defaults: ConfigItem['defaults'];
    status: LoadStatus;
    loadedData: null | ResponseSuccessSingleControl;
    loadingItems: boolean;
    actualParams: StringParams;
    onChange: ({param, value}: {param: string; value: string | string[]}) => void;
    init: () => void;
    setItemsLoader: (loadingItems: boolean) => void;
    getDistincts?: ControlSettings['getDistincts'];
    validationError: string | null;
    errorData: null | ErrorData;
    validateValue: (args: ValidationErrorData) => boolean | undefined;
    classMixin?: string;
    labelMixin?: string;
    renderOverlay?: () => React.ReactNode;
    selectProps: Pick<
        SelectControlProps,
        'style' | 'innerLabel' | 'label' | 'limitLabel' | 'labelPlacement' | 'accentType'
    >;
    /** Локальная логика группы (напр. рейс недоступен до выбора даты в своей тройке). */
    disabledUntilDateInGroup?: boolean;
    /**
     * Слой группы: полный merge `stateParams` по всем контролам (как в Control для init).
     * Для distinct обязателен: `actualParams` после filterSignificantParams не содержит параметров
     * соседних селекторов с другими guid (дата в одной цепочке, `cf_d1` в датасете «Напр-е»).
     */
    distinctParamsBaseFromGroup?: StringParams;
};

const b = block('control-item-select');
const i18n = I18n.keyset('dash.dashkit-plugin-control.view');

/** Селектор направления/маршрута по метаданным поля (подпись виджета может быть без слова «напр»). */
function isDirectionLikeFieldMeta(field: DatasetFieldsListItem): boolean {
    const t = field.title.toLowerCase();
    const g = String(field.guid || '').toLowerCase();
    if (
        t.includes('напр') ||
        t.includes('направ') ||
        t.includes('маршрут') ||
        t.includes('direction') ||
        t.includes('route') ||
        t.includes('куда')
    ) {
        return true;
    }
    return g.startsWith('cf_nr') || g.includes('direction') || g.includes('route_');
}

/** Пустая дата/период не должны блокировать «Напр-е»: usedParams часто включает дату, а на дашборде она бывает не задана до «Применить». */
function isNonBlockingEmptyParamForDirectionSelector(field: DatasetFieldsListItem): boolean {
    const dt = String(field.dataType || '').toLowerCase();
    if (dt === 'date' || dt === 'genericdatetime' || dt === 'datetimetz' || dt === 'datetime') {
        return true;
    }
    const t = field.title.toLowerCase();
    const guid = String(field.guid || '').toLowerCase();
    if (
        t.includes('дат') ||
        t.includes('date') ||
        t.includes('период') ||
        t.includes('period') ||
        t.includes('interval')
    ) {
        return true;
    }
    // Собственное значение «напр-е» / маршрут в usedParams пусто до первого выбора — не должно блокировать открытие селекта.
    if (
        t.includes('напр') ||
        t.includes('направ') ||
        t.includes('маршрут') ||
        t.includes('direction') ||
        t.includes('route') ||
        guid.startsWith('cf_nr') ||
        guid.includes('direction') ||
        guid.includes('route_')
    ) {
        return true;
    }
    return false;
}

/** Поля датасета селектора «Напр-е», которые задают выбранный рейс (в т.ч. дубли guid вроде flightNo_1 / flight_no_1). */
function isFlightDependencyDatasetField(
    f: DatasetFieldsListItem,
    directionFieldId: string,
): boolean {
    if (f.guid === directionFieldId) {
        return false;
    }
    const title = f.title.toLowerCase();
    const guid = f.guid.toLowerCase();
    return (
        title.includes('рейс') ||
        title.includes('flight') ||
        guid === 'nrs' ||
        guid.startsWith('nrs_') ||
        guid === 'nr_s' ||
        guid.includes('flightno') ||
        guid.includes('flight_no')
    );
}

function readFlightParamScalarForDistincts(raw: unknown): string | undefined {
    const unwrapped = unwrapFromArrayAndSkipOperation(raw);
    if (Array.isArray(unwrapped)) {
        for (const v of unwrapped) {
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                return String(v).trim();
            }
        }
        return undefined;
    }
    if (typeof unwrapped === 'string' || typeof unwrapped === 'number') {
        const s = String(unwrapped).trim();
        return s === '' ? undefined : s;
    }
    if (unwrapped !== undefined && unwrapped !== null) {
        const s = String(unwrapped).trim();
        return s === '' ? undefined : s;
    }
    return undefined;
}

function looksLikeExternalFlightParamKey(key: string, directionFieldId: string): boolean {
    if (key === directionFieldId) {
        return false;
    }
    const k = key.toLowerCase();
    return (
        k.includes('flightno') ||
        k.includes('flight_no') ||
        k === 'nrs' ||
        k.startsWith('nrs_') ||
        k === 'nr_s'
    );
}

/**
 * Рейс выбран в соседнем селекторе группы (`flightNo_1`), в датасете «Напр-е» только `flight_no_1`:
 * смотрим весь merge группы, не только поля датасета направления.
 */
function resolveFlightScalarForDirectionDistincts(
    params: StringParams,
    directionFieldId: string,
    datasetFlightGuids: string[],
): string | undefined {
    for (const guid of datasetFlightGuids) {
        const v = readFlightParamScalarForDistincts(params[guid]);
        if (v) {
            return v;
        }
    }
    for (const [key, raw] of Object.entries(params)) {
        if (
            datasetFlightGuids.includes(key) ||
            !looksLikeExternalFlightParamKey(key, directionFieldId)
        ) {
            continue;
        }
        const v = readFlightParamScalarForDistincts(raw);
        if (v) {
            return v;
        }
    }
    return undefined;
}

/** Подставляет выбранный рейс во все guid полей рейса датасета «Напр-е» для distinct. */
function withPropagatedSharedFlightValueAcrossFlightGuids(
    params: StringParams,
    directionFieldId: string,
    datasetFlightGuids: string[],
): StringParams {
    const chosen = resolveFlightScalarForDirectionDistincts(
        params,
        directionFieldId,
        datasetFlightGuids,
    );
    if (!chosen) {
        return {...params};
    }
    const next: StringParams = {...params};
    for (const guid of datasetFlightGuids) {
        next[guid] = chosen;
    }
    return next;
}

function isDateLikeParamFieldForDirectionDataset(
    f: DatasetFieldsListItem,
    directionFieldId: string,
): boolean {
    if (f.guid === directionFieldId) {
        return false;
    }
    const dt = String(f.dataType || '').toLowerCase();
    if (dt === 'date' || dt === 'genericdatetime' || dt === 'datetimetz' || dt === 'datetime') {
        return true;
    }
    const t = f.title.toLowerCase();
    const g = String(f.guid || '').toLowerCase();
    return (
        t.includes('дат') || t.includes('date') || g.startsWith('cf_d') || g.includes('flight_date')
    );
}

function looksLikeDateOrIntervalString(s: string): boolean {
    if (!s) {
        return false;
    }
    if (s.startsWith('__interval_') || s.startsWith('__relative_')) {
        return true;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return true;
    }
    if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) {
        return true;
    }
    return /^\d{1,2}\/\d{1,2}\/\d{4}/.test(s);
}

/** Дата в merge под другим guid; пустые date-параметры датасета «Напр-е» (напр. cf_d1) заполняем для distinct. */
function propagateEmptyDateParamsForDirectionDistinct(
    params: StringParams,
    datasetFields: DatasetFieldsListItem[],
    directionFieldId: string,
    normalizeDate: (raw: unknown) => string,
): StringParams {
    const dateGuids = datasetFields
        .filter((f) => isDateLikeParamFieldForDirectionDataset(f, directionFieldId))
        .map((f) => f.guid);
    if (dateGuids.length === 0) {
        return params;
    }
    const emptyGuids = dateGuids.filter((g) => !readFlightParamScalarForDistincts(params[g]));
    if (emptyGuids.length === 0) {
        return params;
    }
    let donorRaw: string | undefined;
    for (const [key, raw] of Object.entries(params)) {
        if (key === directionFieldId) {
            continue;
        }
        const s = readFlightParamScalarForDistincts(raw);
        if (s && looksLikeDateOrIntervalString(s)) {
            donorRaw = s;
            break;
        }
    }
    if (!donorRaw) {
        return params;
    }
    const donor = normalizeDate(donorRaw);
    if (!donor) {
        return params;
    }
    const next: StringParams = {...params};
    for (const g of emptyGuids) {
        next[g] = donor;
    }
    return next;
}

/**
 * Пустой `cf_nr*` (parameter) не уходит в `parameter_values` — часть TVF/MSSQL без него не отдаёт distinct по `mrshr_*`.
 * Подставляем тот же скаляр, что и для рейса (часто `cf_nr2` = номер рейса для второй цепочки).
 */
function propagateEmptyCfNrParamsFromChosenFlight(
    params: StringParams,
    datasetFields: DatasetFieldsListItem[],
    directionFieldId: string,
    flightGuids: string[],
): StringParams {
    const flightScalar = resolveFlightScalarForDirectionDistincts(
        params,
        directionFieldId,
        flightGuids,
    );
    if (!flightScalar) {
        return params;
    }
    const fromSchema = datasetFields
        .filter((f) => {
            if (f.guid === directionFieldId || f.calc_mode !== 'parameter') {
                return false;
            }
            return f.guid.toLowerCase().startsWith('cf_nr');
        })
        .map((f) => f.guid);
    const fromParams = Object.keys(params).filter(
        (k) =>
            k !== directionFieldId &&
            k.toLowerCase().startsWith('cf_nr') &&
            !readFlightParamScalarForDistincts(params[k]),
    );
    const targetGuids = [...new Set([...fromSchema, ...fromParams])];
    if (targetGuids.length === 0) {
        return params;
    }
    const next: StringParams = {...params};
    let changed = false;
    for (const guid of targetGuids) {
        if (!readFlightParamScalarForDistincts(next[guid])) {
            next[guid] = flightScalar;
            changed = true;
        }
    }
    return changed ? next : params;
}

const normalizeSelectedValues = (
    raw: string | string[] | undefined,
    isMulti: boolean,
): string[] => {
    if (Array.isArray(raw)) {
        const list = raw.map((v) => String(v).trim()).filter(Boolean);
        return isMulti ? [...new Set(list)] : list;
    }
    if (!raw) {
        return [];
    }
    const single = String(raw).trim();
    if (!single) {
        return [];
    }
    if (!isMulti) {
        return [single];
    }
    // In some flows multiselect value may come as comma-separated string.
    const fromComma = single
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return [...new Set(fromComma)];
};

export const ControlItemSelect = ({
    defaults,
    data,
    id,
    loadedData,
    status,
    actualParams,
    onChange,
    getDistincts,
    loadingItems,
    errorData,
    validationError,
    init,
    setItemsLoader,
    validateValue,
    classMixin,
    selectProps,
    renderOverlay,
    labelMixin,
    disabledUntilDateInGroup = false,
    distinctParamsBaseFromGroup,
}: ControlItemSelectProps) => {
    const dispatch = useDispatch();
    let _loadingItemsTimer: NodeJS.Timeout | undefined;

    const workbookId = useSelector(selectDashWorkbookId);
    const flightGroupsDatasetRefreshNonce = useSelector(selectFlightGroupsDatasetRefreshNonce);

    const {source, sourceType} = data;
    const fieldId =
        sourceType === DashTabItemControlSourceType.Dataset
            ? source.datasetFieldId
            : source.fieldName;

    const isDirectionSelector = React.useMemo(() => {
        if (sourceType !== DashTabItemControlSourceType.Dataset) {
            return false;
        }
        const datasetData = data as DashTabItemControlDataset;
        const datasetSource = datasetData.source;
        const titleText = `${data.title || ''} ${datasetSource.innerTitle || ''}`.toLowerCase();
        if (titleText.includes('напр') || titleText.includes('direction')) {
            return true;
        }
        if (
            titleText.includes('маршрут') ||
            titleText.includes('route') ||
            titleText.includes('куда')
        ) {
            return true;
        }
        if (loadedData) {
            const info = getDatasetSourceInfo({
                actualLoadedData: loadedData,
                data: datasetData,
            });
            const field = info.datasetFields.find((f) => f.guid === fieldId);
            if (field && isDirectionLikeFieldMeta(field)) {
                return true;
            }
        }
        return false;
    }, [data, fieldId, loadedData, sourceType]);

    const normalizeParamForDistincts = React.useCallback((raw: unknown, paramKey?: string): string => {
        const stringValue = Array.isArray(raw)
            ? raw
                  .map((v) => String(v).trim())
                  .filter(Boolean)
                  .join(',')
            : String(raw ?? '');

        if (!stringValue) {
            return '';
        }

        if (stringValue.startsWith('__interval_')) {
            return normalizeIntervalValueForMssqlScalar(
                stringValue,
                paramKey ?? 'dta1',
            );
        }

        return stringValue;
    }, []);

    // TODO: seems like this function should be in shared/ui
    const getSelectDistincts = React.useCallback(
        async ({searchPattern, nextPageToken}: {searchPattern: string; nextPageToken: number}) => {
            try {
                const datasetData = data as DashTabItemControlDataset;
                const datasetSourceInfo = getDatasetSourceInfo({
                    actualLoadedData: loadedData,
                    data: datasetData,
                });
                const {datasetId, datasetFieldId, datasetLabelFieldId} = datasetSourceInfo;

                const paramRoot = distinctParamsBaseFromGroup ?? actualParams;
                let paramsForDistincts: StringParams = {...paramRoot};
                // Never filter distincts by the selector's own field.
                // This prevents broken requests for multiselect controls (e.g. flights).
                delete paramsForDistincts[datasetFieldId];
                if (isDirectionSelector) {
                    const flightGuids = datasetSourceInfo.datasetFields
                        .filter((f) => isFlightDependencyDatasetField(f, datasetFieldId))
                        .map((f) => f.guid);
                    paramsForDistincts = withPropagatedSharedFlightValueAcrossFlightGuids(
                        paramsForDistincts,
                        datasetFieldId,
                        flightGuids,
                    );
                    // Backend direction distincts endpoint is single-flight oriented.
                    // Keep flights multiselect in UI, but pass only first selected flight
                    // while fetching direction distinct values.
                    flightGuids.forEach((guid) => {
                        const raw = paramsForDistincts[guid];
                        if (Array.isArray(raw)) {
                            paramsForDistincts[guid] = raw[0] || '';
                            return;
                        }
                        if (typeof raw === 'string' && raw.includes(',')) {
                            paramsForDistincts[guid] = raw.split(',')[0].trim();
                        }
                    });
                    paramsForDistincts = propagateEmptyDateParamsForDirectionDistinct(
                        paramsForDistincts,
                        datasetSourceInfo.datasetFields,
                        datasetFieldId,
                        normalizeParamForDistincts,
                    );
                    paramsForDistincts = propagateEmptyCfNrParamsFromChosenFlight(
                        paramsForDistincts,
                        datasetSourceInfo.datasetFields,
                        datasetFieldId,
                        flightGuids,
                    );
                }

                Object.keys(paramsForDistincts).forEach((paramName) => {
                    paramsForDistincts[paramName] = normalizeParamForDistincts(
                        paramsForDistincts[paramName],
                        paramName,
                    );
                });

                const {filters, parameter_values} = processParamsForGetDistincts({
                    params: paramsForDistincts,
                    datasetSourceInfo,
                    searchPattern,
                });

                // «Напр-е»: distinct по двум полям (value+label) на части датасетов/Data API даёт пустой Data — достаточно одного ref.
                const distinctFieldRefs: Array<{
                    ref: {type: 'id'; id: string};
                    role_spec: {role: 'distinct'};
                }> = [
                    {
                        ref: {type: 'id' as const, id: datasetFieldId},
                        role_spec: {role: 'distinct'},
                    },
                ];
                if (
                    !isDirectionSelector &&
                    datasetLabelFieldId &&
                    datasetLabelFieldId !== datasetFieldId
                ) {
                    distinctFieldRefs.push({
                        ref: {type: 'id' as const, id: datasetLabelFieldId},
                        role_spec: {role: 'distinct'},
                    });
                }

                const {result} = await getDistincts!(
                    {
                        datasetId,
                        workbookId,
                        fields: distinctFieldRefs,
                        limit: LIMIT,
                        offset: LIMIT * nextPageToken,
                        filters,
                        parameter_values,
                    },
                    undefined,
                    {datasetSourceInfo, searchPattern},
                );

                return {
                    items: result.data.Data.map((row) => {
                        const value = String(row?.[0] ?? '');
                        const label = String(row?.[1] ?? row?.[0] ?? '');
                        return {value, title: label};
                    }),
                    nextPageToken: result.data.Data.length < LIMIT ? undefined : nextPageToken + 1,
                };
            } catch (error) {
                logger.logError('DashKit: Control getDistincts failed', error);
                console.error('SELECT_GET_ITEMS_FAILED', error);
                throw error;
            }
        },
        [
            actualParams,
            data,
            distinctParamsBaseFromGroup,
            getDistincts,
            isDirectionSelector,
            loadedData,
            normalizeParamForDistincts,
            workbookId,
        ],
    );

    const getItems = async (args: {
        searchPattern?: string;
        exactKeys?: string[];
        nextPageToken?: number;
        itemsPageSize?: number;
    }) => {
        const {searchPattern, exactKeys, nextPageToken: nextPageTokenRaw = 0} = args;
        const nextPageToken =
            typeof nextPageTokenRaw === 'number' && !Number.isNaN(nextPageTokenRaw)
                ? nextPageTokenRaw
                : 0;
        const pattern = typeof searchPattern === 'string' ? searchPattern : '';

        // YCSelect._initItems передаёт только exactKeys (без ключа searchPattern).
        const isExactKeysInit = !('searchPattern' in args) && Array.isArray(exactKeys);

        if (isExactKeysInit) {
            const meaningful = exactKeys.filter(
                (k) => k !== undefined && k !== null && String(k).trim() !== '',
            );
            if (meaningful.length > 0) {
                return {
                    items: meaningful.map((value) => ({
                        value: String(value),
                        title: String(value),
                    })),
                    nextPageToken: nextPageToken + 1,
                };
            }
            return getSelectDistincts({searchPattern: '', nextPageToken: 0});
        }

        // YCSelect._fetchItems всегда передаёт searchPattern (часто '' при открытии списка).
        // Раньше: `'' || (!'' && 0)` давало 0 (falsy) → не вызывали distinct и возвращали пустой список.
        return getSelectDistincts({searchPattern: pattern, nextPageToken});
    };

    const getErrorContent = () => {
        const data = errorData?.data;
        const errorText = getErrorText(data || {});
        const errorTitle = data?.title;
        const errorMessage = errorTitle || errorText;

        const showButtons = !errorData?.extra?.hideErrorDetails;

        const buttonsSize = DL.IS_MOBILE ? MOBILE_SIZE.BUTTON : 's';
        const buttonsWidth = DL.IS_MOBILE ? 'max' : 'auto';

        return (
            <div className={b('error', {inside: true, mobile: DL.IS_MOBILE})}>
                <span className={b('error-text')} title={errorMessage}>
                    {errorMessage}
                </span>
                {showButtons && (
                    <div className={b('buttons')}>
                        <Button
                            size={buttonsSize}
                            onClick={() => {
                                setItemsLoader(true);
                                init();
                            }}
                            width={buttonsWidth}
                        >
                            {i18n('button_retry')}
                        </Button>
                        <Button
                            size={buttonsSize}
                            view="flat"
                            onClick={() =>
                                dispatch(
                                    openDialogErrorWithTabs({
                                        error: prepareSelectorError(
                                            data || {},
                                        ) as ChartKitCustomError,
                                        title: errorTitle,
                                    }),
                                )
                            }
                            width={buttonsWidth}
                        >
                            {i18n('button_details')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const onOpenChange = ({open}: {open: boolean}) => {
        clearTimeout(_loadingItemsTimer);

        // can be time lag in group controls because of timeout
        if (status !== LOAD_STATUS.PENDING && loadingItems) {
            setItemsLoader(false);
        }

        if (status === LOAD_STATUS.PENDING) {
            if (open) {
                setItemsLoader(true);
            } else {
                // A delay for displaying the Loader in the Popup, to prevent loading blinking while closing.
                _loadingItemsTimer = setTimeout(() => {
                    if (status === LOAD_STATUS.PENDING) {
                        setItemsLoader(true);
                    }
                });
            }
        }
    };

    const selectedValue = unwrapFromArrayAndSkipOperation(defaults![fieldId]);
    const preselectedContent = [{title: selectedValue, value: selectedValue}];

    const content = loadedData
        ? (loadedData.uiScheme?.controls[0] as ControlSelectType).content
        : null;
    const schemaDisabled = Boolean(loadedData?.uiScheme?.controls[0].disabled);

    const emptyPaceholder = i18n('placeholder_empty');

    const preparedValue = unwrapFromArrayAndSkipOperation(actualParams[fieldId]);

    // for first initialization of control
    const initialValidationError = isValidRequiredValue({
        required: source.required,
        value: preparedValue,
    })
        ? i18n('value_required')
        : null;
    let selectValidationError: string | null = validationError || initialValidationError;
    let placeholder = selectValidationError || emptyPaceholder;

    const onSelectChange = (value: string | string[]) => {
        const hasError = validateValue({
            required: source.required,
            value,
        });

        if (hasError) {
            return;
        }

        const valueWithOperation = addOperationForValue({
            value,
            operation: source.operation,
        });

        onChange({param: fieldId, value: valueWithOperation});
    };

    /** Сброс параметров при синхронизации с content (в т.ч. для required — иначе validateValue блокирует очистку). */
    const applyParamValue = React.useCallback(
        (value: string | string[]) => {
            onChange({
                param: fieldId,
                value: addOperationForValue({
                    value,
                    operation: source.operation,
                }),
            });
        },
        [fieldId, onChange, source.operation],
    );

    const prevGroupValueRef = React.useRef<string | undefined>(undefined);

    const isFlightSelectorForGroups = React.useMemo(() => {
        if (sourceType !== DashTabItemControlSourceType.Dataset) {
            return false;
        }
        const datasetSource = source as DashTabItemControlDataset['source'];
        const titleText = `${data.title || ''} ${datasetSource.innerTitle || ''}`.toLowerCase();
        if (!titleText.includes('рейс') && !titleText.includes('flight')) {
            return false;
        }
        // Allowlist-based detection (flight groups editor datasets).
        const allowlist = window.DL?.flightGroupsEditorDatasetIds;
        if (Array.isArray(allowlist) && allowlist.includes(datasetSource.datasetId)) {
            return true;
        }
        // Field-based detection: any flight selector whose dataset exposes group fields
        // should also be disabled when no group is selected.
        if (!loadedData) {
            return false;
        }
        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });
        return datasetSourceInfo.datasetFields.some((f) => {
            const t = f.title.toLowerCase();
            return t === 'groupname' || t === 'groupid';
        });
    }, [data.title, loadedData, source, sourceType]);

    /** Селектор «Группы» на датасете редактора групп — сверяем выбранное с актуальным списком. */
    const isFlightGroupsScopedSyncSelector = React.useMemo(() => {
        if (sourceType !== DashTabItemControlSourceType.Dataset) {
            return false;
        }
        const datasetSource = source as DashTabItemControlDataset['source'];
        const allowlist = window.DL?.flightGroupsEditorDatasetIds;
        const inAllowlist = Array.isArray(allowlist)
            ? allowlist.includes(datasetSource.datasetId)
            : false;
        const titleText = `${data.title || ''} ${datasetSource.innerTitle || ''}`.toLowerCase();
        return inAllowlist && titleText.includes('групп');
    }, [data.title, source, sourceType]);

    React.useEffect(() => {
        // Trigger re-render dependencies on editor close; actual reconciliation is done
        // by loaded content below to avoid extra failing distinct requests.
    }, [flightGroupsDatasetRefreshNonce]);

    React.useEffect(() => {
        if (
            !isFlightSelectorForGroups ||
            sourceType !== DashTabItemControlSourceType.Dataset ||
            !loadedData
        ) {
            return;
        }

        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });

        const groupParamIds = datasetSourceInfo.datasetFields
            .filter((f) => {
                const title = f.title.toLowerCase();
                return (title === 'groupname' || title === 'groupid') && f.guid !== fieldId;
            })
            .map((f) => f.guid);

        if (groupParamIds.length === 0) {
            return;
        }

        // Track all group-like params to handle dashboards where group selector uses either groupName or groupID.
        const currentGroupKey = JSON.stringify(
            groupParamIds.map((paramId) => actualParams[paramId] ?? null),
        );

        if (prevGroupValueRef.current === undefined) {
            prevGroupValueRef.current = currentGroupKey;
            return;
        }

        if (prevGroupValueRef.current === currentGroupKey) {
            return;
        }

        prevGroupValueRef.current = currentGroupKey;

        // Flight selector must keep user-selected value on dependent refreshes.
        // Otherwise "Рейс" is unexpectedly dropped after apply/reload race.
        return;
    }, [
        actualParams,
        data,
        fieldId,
        isFlightSelectorForGroups,
        loadedData,
        sourceType,
    ]);

    const disableFlightSelectorWithoutGroup = React.useMemo(() => {
        if (
            !isFlightSelectorForGroups ||
            sourceType !== DashTabItemControlSourceType.Dataset ||
            !loadedData
        ) {
            return false;
        }

        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });

        const groupParamIds = datasetSourceInfo.datasetFields
            .filter((f) => {
                const title = f.title.toLowerCase();
                return (title === 'groupname' || title === 'groupid') && f.guid !== fieldId;
            })
            .map((f) => f.guid);

        if (!groupParamIds.length) {
            return false;
        }

        const hasSelectedGroup = groupParamIds.some((paramId) => {
            const raw = unwrapFromArrayAndSkipOperation(actualParams[paramId]);
            if (Array.isArray(raw)) {
                return raw.length > 0;
            }
            return Boolean(raw);
        });

        return !hasSelectedGroup;
    }, [actualParams, data, fieldId, isFlightSelectorForGroups, loadedData, sourceType]);

    const prevDirDepsRef = React.useRef<string | undefined>(undefined);
    const prevDirectionFlightKeyRef = React.useRef<string | undefined>(undefined);

    React.useEffect(() => {
        if (
            !isDirectionSelector ||
            sourceType !== DashTabItemControlSourceType.Dataset ||
            !loadedData
        ) {
            return;
        }

        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });

        const depParamIds = datasetSourceInfo.datasetFields
            .filter((f) => {
                if (f.guid === fieldId) {
                    return false;
                }
                const title = f.title.toLowerCase();
                return (
                    title === 'groupname' ||
                    title === 'groupid' ||
                    title.includes('групп') ||
                    isFlightDependencyDatasetField(f, fieldId)
                );
            })
            .map((f) => f.guid);

        if (!depParamIds.length) {
            return;
        }

        const flightParamIds = datasetSourceInfo.datasetFields
            .filter((f) => isFlightDependencyDatasetField(f, fieldId))
            .map((f) => f.guid);
        const currentFlightValue =
            flightParamIds
                .map((paramId) => unwrapFromArrayAndSkipOperation(actualParams[paramId]))
                .find((raw) => {
                    if (Array.isArray(raw)) {
                        return raw.length > 0;
                    }
                    return Boolean(raw);
                }) ?? '';
        const currentFlightKey = JSON.stringify(currentFlightValue);
        if (prevDirectionFlightKeyRef.current === undefined) {
            prevDirectionFlightKeyRef.current = currentFlightKey;
        }

        const currentKey = JSON.stringify(
            depParamIds.map((paramId) => actualParams[paramId] ?? null),
        );

        if (prevDirDepsRef.current === undefined) {
            prevDirDepsRef.current = currentKey;
            return;
        }

        if (prevDirDepsRef.current === currentKey) {
            return;
        }

        prevDirDepsRef.current = currentKey;

        const selectedRaw = unwrapFromArrayAndSkipOperation(actualParams[fieldId]);
        if (!selectedRaw || (Array.isArray(selectedRaw) && selectedRaw.length === 0)) {
            prevDirectionFlightKeyRef.current = currentFlightKey;
            return;
        }
        const isMulti = (source as DashTabItemControlElementSelect).multiselectable;
        const hasFlightChanged = prevDirectionFlightKeyRef.current !== currentFlightKey;
        prevDirectionFlightKeyRef.current = currentFlightKey;
        if (hasFlightChanged) {
            // Required UX: when flight changes, direction resets.
            applyParamValue(isMulti ? [] : '');
            return;
        }
        // Same rule for direction selector: keep selected value if it is still present in current content.
        // If content is empty/temporarily unavailable, keep current selection.
        if (!content || content.length === 0) {
            return;
        }
        const selectedValues = normalizeSelectedValues(
            selectedRaw as string | string[] | undefined,
            isMulti,
        );
        const allowedValues = new Set(content.map((item) => String(item.value)));
        const keptValues = selectedValues.filter((v) => allowedValues.has(String(v)));
        if (keptValues.length === selectedValues.length) {
            return;
        }
        applyParamValue((isMulti ? keptValues : keptValues[0] || '') as string | string[]);
    }, [
        actualParams,
        applyParamValue,
        content,
        data,
        fieldId,
        isDirectionSelector,
        loadedData,
        source,
        sourceType,
    ]);

    const disableDirectionSelectorWithoutFlight = React.useMemo(() => {
        if (
            !isDirectionSelector ||
            sourceType !== DashTabItemControlSourceType.Dataset ||
            !loadedData
        ) {
            return false;
        }

        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });

        const flightParamIds = datasetSourceInfo.datasetFields
            .filter((f) => isFlightDependencyDatasetField(f, fieldId))
            .map((f) => f.guid);

        if (!flightParamIds.length) {
            return false;
        }

        const hasSelectedFlight = flightParamIds.some((paramId) => {
            const raw = unwrapFromArrayAndSkipOperation(actualParams[paramId]);
            if (Array.isArray(raw)) {
                return raw.length > 0;
            }
            return Boolean(raw);
        });

        return !hasSelectedFlight;
    }, [actualParams, data, fieldId, isDirectionSelector, loadedData, sourceType]);

    const disableDirectionSelectorByEmptyDependencies = React.useMemo(() => {
        if (
            !isDirectionSelector ||
            !loadedData?.usedParams ||
            sourceType !== DashTabItemControlSourceType.Dataset ||
            !loadedData
        ) {
            return false;
        }

        const datasetData = data as DashTabItemControlDataset;
        const datasetSourceInfo = getDatasetSourceInfo({
            actualLoadedData: loadedData,
            data: datasetData,
        });
        const fieldByGuid = new Map(
            datasetSourceInfo.datasetFields.map((f) => [f.guid, f] as const),
        );

        const depParamNames = Object.keys(loadedData.usedParams).filter(
            (paramName) => paramName !== fieldId,
        );

        const flightGuids = new Set(
            datasetSourceInfo.datasetFields
                .filter((f) => isFlightDependencyDatasetField(f, fieldId))
                .map((f) => f.guid),
        );

        const isBlockingEmpty = (paramName: string): boolean => {
            const meta = fieldByGuid.get(paramName);
            if (!meta) {
                return false;
            }
            if (isNonBlockingEmptyParamForDirectionSelector(meta)) {
                return false;
            }
            const raw = unwrapFromArrayAndSkipOperation(actualParams[paramName]);
            if (Array.isArray(raw)) {
                return raw.length === 0;
            }
            return !raw;
        };

        const flightDeps = depParamNames.filter((name) => flightGuids.has(name));
        const otherDeps = depParamNames.filter((name) => !flightGuids.has(name));

        // Несколько полей «рейс» в usedParams (flightNo_1 и flight_no_1): достаточно одного непустого —
        // иначе после алиаса только между двумя guid третий остаётся пустым и селектор вечно disabled.
        if (flightDeps.length > 0) {
            const anyFlightReady = flightDeps.some((name) => !isBlockingEmpty(name));
            if (!anyFlightReady) {
                return true;
            }
        }

        return otherDeps.some(isBlockingEmpty);
    }, [actualParams, data, fieldId, isDirectionSelector, loadedData, sourceType]);

    React.useEffect(() => {
        if (!isFlightGroupsScopedSyncSelector || !loadedData) {
            return;
        }

        const selectedRaw = unwrapFromArrayAndSkipOperation(actualParams[fieldId]);
        if (!selectedRaw || (Array.isArray(selectedRaw) && selectedRaw.length === 0)) {
            return;
        }

        const isMulti = (source as DashTabItemControlElementSelect).multiselectable;

        // During first apply after page reload the backend may briefly return empty/partial content.
        // Do not clear selected values while control is still loading to avoid one-time value drop.
        if (status === LOAD_STATUS.PENDING || loadingItems) {
            return;
        }

        if (content === undefined || content === null) {
            return;
        }
        if (content.length === 0) {
            // Do not clear selected values on empty content: backend can return transient empty page.
            return;
        }

        const selectedValues = normalizeSelectedValues(
            selectedRaw as string | string[] | undefined,
            isMulti,
        );
        if (!selectedValues.length) {
            applyParamValue(isMulti ? [] : '');
            return;
        }
        const allowedValues = new Set(content.map((item) => String(item.value)));
        const keptValues = selectedValues.filter((v) => allowedValues.has(String(v)));
        if (keptValues.length === selectedValues.length) {
            return;
        }

        const nextValue = isMulti ? keptValues : keptValues[0] || '';
        applyParamValue(nextValue as string | string[]);
    }, [
        actualParams,
        applyParamValue,
        content,
        fieldId,
        isFlightGroupsScopedSyncSelector,
        loadedData,
        loadingItems,
        source,
        status,
    ]);

    // Бэкенд часто шлёт disabled для «Напр-е», пока пуст «свой» cf_nr*/маршрут в usedParams — клиент уже учёл это выше.
    const ignoreDirectionServerDisabled =
        isDirectionSelector &&
        schemaDisabled &&
        !disableDirectionSelectorWithoutFlight &&
        !disableDirectionSelectorByEmptyDependencies;

    const effectiveSchemaDisabled = ignoreDirectionServerDisabled ? false : schemaDisabled;

    // The value may not be relevant before loadedData is loaded.
    const isDisabled = Boolean(
        effectiveSchemaDisabled ||
            disabledUntilDateInGroup ||
            disableFlightSelectorWithoutGroup ||
            disableDirectionSelectorWithoutFlight ||
            disableDirectionSelectorByEmptyDependencies,
    );
    if (isDisabled) {
        selectValidationError = null;
        placeholder = emptyPaceholder;
    }
    const value = React.useMemo(() => {
        // Keep selected value even while selector is temporarily disabled/reloading.
        // Clearing value here causes one-time "reset" after first Apply.
        if (!loadedData) {
            const isMulti = (source as DashTabItemControlElementSelect).multiselectable;
            const selectedValues = normalizeSelectedValues(
                preparedValue as string | string[] | undefined,
                isMulti,
            );
            return isMulti ? selectedValues : selectedValues[0] ?? '';
        }
        const isMulti = (source as DashTabItemControlElementSelect).multiselectable;
        const selectedValues = normalizeSelectedValues(
            preparedValue as string | string[] | undefined,
            isMulti,
        );

        if (!isFlightGroupsScopedSyncSelector || !content) {
            // YCSelect для MULTIPLE ждёт string[]; строка «a,b,c» превращалась в один токен → не отмечались пункты и «Выбрать все» дублировало значения.
            if (isMulti) {
                return selectedValues;
            }
            return selectedValues[0] ?? '';
        }

        const allowedValues = new Set(content.map((item) => String(item.value)));
        const keptValues = selectedValues.filter((v) => allowedValues.has(String(v)));
        return isMulti ? keptValues : keptValues[0] || '';
    }, [content, isDisabled, isFlightGroupsScopedSyncSelector, loadedData, preparedValue, source]);

    const props: SelectControlProps = {
        widgetId: id,
        content: content || preselectedContent,
        param: fieldId,
        multiselect: (source as DashTabItemControlElementSelect).multiselectable,
        type: TYPE.SELECT,
        className: b(null, classMixin),
        labelClassName: b(null, labelMixin),
        key: fieldId,
        value,
        onChange: onSelectChange,
        onOpenChange,
        loadingItems,
        placeholder,
        required: source.required,
        hint: getControlHint(source),
        hasValidationError: Boolean(selectValidationError),
        renderOverlay,
        disabled: isDisabled,
        ...selectProps,
    };
    if (status === LOAD_STATUS.FAIL && !(isDirectionSelector && isDisabled)) {
        props.errorContent = getErrorContent();
        props.itemsLoaderClassName = b('select-loader');
    }

    if (props.content.length >= LIMIT && sourceType === DashTabItemControlSourceType.Dataset) {
        props.getItems = getItems;
    }

    return <ControlSelect {...props} />;
};
