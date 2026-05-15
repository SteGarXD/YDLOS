import React from 'react';

import {Loader} from '@gravity-ui/uikit';
import type {CancelTokenSource} from 'axios';
import axios from 'axios';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import isEqual from 'lodash/isEqual';
import type {
    DashTab,
    DashTabItemControlDataset,
    DashTabItemControlManual,
    DashTabItemControlSingle,
    StringParams,
    WorkbookId,
} from 'shared';
import {
    ControlType,
    DATASET_FIELD_TYPES,
    DashTabItemControlElementType,
    DashTabItemControlSourceType,
    TitlePlacementOption,
} from 'shared';
import {useMountedState} from 'ui/hooks';
import {
    ControlCheckbox,
    ControlDatepicker,
    ControlInput,
    ControlRangeDatepicker,
} from 'ui/libs/DatalensChartkit/components/Control/Items/Items';
import {CONTROL_TYPE} from 'ui/libs/DatalensChartkit/modules/constants/constants';
import {type EntityRequestOptions} from 'ui/libs/DatalensChartkit/modules/data-provider/charts';
import type {ResponseSuccessSingleControl} from 'ui/libs/DatalensChartkit/modules/data-provider/charts/types';
import type {ActiveControl} from 'ui/libs/DatalensChartkit/types';
import {
    addOperationForValue,
    unwrapFromArray,
    unwrapFromArrayAndSkipOperation,
} from 'ui/units/dash/modules/helpers';
import {ExtendedDashKitContext} from 'ui/units/dash/utils/context';

import {chartsDataProvider} from '../../../../../libs/DatalensChartkit';
import logger from '../../../../../libs/logger';
import {getControlHint} from '../../../utils';
import {ControlItemSelect} from '../../Control/ControlItems/ControlItemSelect';
import {Error} from '../../Control/Error/Error';
import {ELEMENT_TYPE, LOAD_STATUS, TYPE} from '../../Control/constants';
import type {
    ControlSettings,
    ErrorData,
    LoadStatus,
    SelectorError,
    ValidationErrorData,
} from '../../Control/types';
import {
    checkDatasetFieldType,
    getDatasetSourceInfo,
    getLabels,
    getStatus,
    isTransientControlInfrastructureError,
    isValidRequiredValue,
} from '../../Control/utils';
import DebugInfoTool from '../../DebugInfoTool/DebugInfoTool';
import type {ExtendedLoadedData} from '../types';
import {
    clearLoaderTimer,
    filterSignificantParams,
    getErrorTitle,
    getMergedParamsForControlDistinctSegment,
    isFlightControlDisabledWithoutDate,
} from '../utils';

import {getInitialState, reducer} from './store/reducer';
import {
    setErrorData,
    setIsInit,
    setLoadedData,
    setLoadingItems,
    setSilentLoader,
    setStatus,
    setValidationError,
} from './store/types';

import '../GroupControl.scss';

const b = block('dashkit-plugin-group-control');
const i18n = I18n.keyset('dash.dashkit-plugin-control.view');

type ControlProps = {
    id: string;
    data: DashTabItemControlSingle;
    group?: DashTabItemControlSingle[];
    groupStateParams?: Record<string, StringParams>;
    params: StringParams;
    onStatusChanged: ({
        controlId,
        status,
        loadedData,
    }: {
        controlId: string;
        status: LoadStatus;
        loadedData?: ExtendedLoadedData | null;
    }) => void;
    silentLoading: boolean;
    getDistincts?: ControlSettings['getDistincts'];
    requestHeaders?: () => Record<string, string>;
    onChange: ({
        params,
        callChangeByClick,
        controlId,
    }: {
        params: StringParams;
        callChangeByClick?: boolean;
        controlId?: string;
    }) => void;
    needReload: boolean;
    workbookId?: WorkbookId;
    dependentSelectors?: boolean;
    widgetId: string;
};

export const Control = ({
    id,
    data,
    group = [],
    groupStateParams,
    params,
    silentLoading,
    onStatusChanged,
    getDistincts,
    requestHeaders,
    onChange,
    needReload,
    workbookId,
    dependentSelectors,
    widgetId,
}: ControlProps) => {
    const extDashkitContext = React.useContext(ExtendedDashKitContext);

    const paramsForGroupApis = React.useMemo(() => {
        if (!groupStateParams || Object.keys(groupStateParams).length === 0) {
            return params;
        }
        const merged = Object.values(groupStateParams).reduce<StringParams>(
            (acc, itemParams) => ({...acc, ...itemParams}),
            {},
        );
        return {...merged, ...params};
    }, [groupStateParams, params]);

    const distinctParamsBaseFromGroup = React.useMemo(
        () =>
            getMergedParamsForControlDistinctSegment({
                group,
                groupStateParams,
                controlId: id,
                currentControlParams: params,
            }),
        [group, groupStateParams, id, params],
    );

    const [prevNeedReload, setPrevNeedReload] = React.useState(needReload);
    const isMounted = useMountedState([]);
    const [prevParams, setPrevParams] = React.useState<StringParams | null>(null);
    // it is filled in for the first time when the data is loaded, then it is updated when the params change
    const currentSignificantParams = React.useRef<StringParams | null>();
    const requestCancellationRef = React.useRef<CancelTokenSource>();
    const transientInitRetriesRef = React.useRef(0);
    const dependency424RetriesRef = React.useRef(0);
    const initStableRef = React.useRef<() => Promise<void>>(async () => {});

    const [
        {
            status,
            loadedData,
            errorData,
            loadingItems,
            validationError,
            isInit,
            showSilentLoader,
            control,
        },
        dispatch,
    ] = React.useReducer(reducer, getInitialState());

    let silentLoaderTimer: NodeJS.Timeout | undefined;

    const setErrorState = React.useCallback(
        (newErrorData: ErrorData, errorStatus: LoadStatus) => {
            const statusResponse = getStatus(errorStatus);
            if (statusResponse) {
                dispatch(
                    setErrorData({
                        status: statusResponse,
                        errorData: newErrorData,
                    }),
                );
                onStatusChanged({controlId: id, status: statusResponse});
            }
        },
        [id, onStatusChanged],
    );

    const setLoadedDataState = React.useCallback(
        (newLoadedData: ResponseSuccessSingleControl, loadedStatus: LoadStatus) => {
            const statusResponse = getStatus(loadedStatus);
            if (statusResponse) {
                if (loadedStatus === LOAD_STATUS.SUCCESS) {
                    transientInitRetriesRef.current = 0;
                    dependency424RetriesRef.current = 0;
                }
                currentSignificantParams.current = filterSignificantParams({
                    params: paramsForGroupApis,
                    loadedData: newLoadedData,
                    defaults: data.defaults,
                    dependentSelectors,
                });
                dispatch(setLoadedData({status: statusResponse, loadedData: newLoadedData}));
                onStatusChanged({
                    controlId: id,
                    status: statusResponse,
                    loadedData: newLoadedData
                        ? {
                              ...newLoadedData,
                              sourceType: data.sourceType,
                              id: data.id,
                          }
                        : null,
                });
            }
        },
        [
            data.defaults,
            data.id,
            data.sourceType,
            dependentSelectors,
            id,
            onStatusChanged,
            paramsForGroupApis,
        ],
    );

    const cancelCurrentRunRequest = () => {
        if (requestCancellationRef.current) {
            requestCancellationRef.current.cancel();
        }
    };

    const init = React.useCallback(async () => {
        try {
            const payloadCancellation = chartsDataProvider.getRequestCancellation();
            const payload: EntityRequestOptions = {
                data: {
                    config: {
                        data: {
                            shared: data,
                        },
                        meta: {
                            stype: ControlType.Dash,
                        },
                    },
                    controlData: {
                        id,
                        widgetId,
                        tabId: (extDashkitContext?.config as DashTab)?.id,
                    },
                    params: filterSignificantParams({
                        params: paramsForGroupApis,
                        loadedData: loadedData ?? null,
                        defaults: data.defaults,
                        dependentSelectors,
                    }),
                    ...(workbookId ? {workbookId} : {}),
                },
                cancelToken: payloadCancellation.token,
                headers: requestHeaders?.(),
            };

            cancelCurrentRunRequest();

            // if the previous request is canceled, but we make a new one, we do not need to send status again
            if (status !== LOAD_STATUS.PENDING) {
                dispatch(setStatus({status: LOAD_STATUS.PENDING}));
                onStatusChanged({controlId: id, status: LOAD_STATUS.PENDING});
            }

            requestCancellationRef.current = payloadCancellation;

            const response = await chartsDataProvider.makeRequest(payload);

            if (response === null) {
                return;
            }

            if (response.status === 424 || response.status === 427) {
                const maxSoft = 24;
                if (dependency424RetriesRef.current < maxSoft && isMounted()) {
                    dependency424RetriesRef.current += 1;
                    const delayMs = Math.min(40 + dependency424RetriesRef.current * 70, 1200);
                    window.setTimeout(() => {
                        if (isMounted()) {
                            void initStableRef.current();
                        }
                    }, delayMs);
                }
                return;
            }

            const newLoadedData = response.data;

            if (data.sourceType === DashTabItemControlSourceType.Dataset) {
                checkDatasetFieldType({
                    currentLoadedData: newLoadedData,
                    datasetData: data,
                    actualLoadedData: loadedData,
                    onSucces: setLoadedDataState,
                    onError: setErrorState,
                });
            } else {
                setLoadedDataState(newLoadedData, LOAD_STATUS.SUCCESS);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            const errStatus = Number((error as any)?.response?.status ?? (error as any)?.status);
            if (errStatus === 424 || errStatus === 427) {
                const maxSoft = 24;
                if (dependency424RetriesRef.current < maxSoft && isMounted()) {
                    dependency424RetriesRef.current += 1;
                    const delayMs = Math.min(40 + dependency424RetriesRef.current * 70, 1200);
                    window.setTimeout(() => {
                        if (isMounted()) {
                            void initStableRef.current();
                        }
                    }, delayMs);
                }
                return;
            }
            if (
                isTransientControlInfrastructureError(error) &&
                transientInitRetriesRef.current < 3 &&
                isMounted()
            ) {
                transientInitRetriesRef.current += 1;
                const delayMs = 250 + transientInitRetriesRef.current * 250;
                window.setTimeout(() => {
                    if (isMounted()) {
                        void initStableRef.current();
                    }
                }, delayMs);
                return;
            }
            logger.logError('DashKit: Control init failed', error);
            console.error('DASHKIT_CONTROL_RUN', error);

            let errorData = null;

            if (error.response && error.response.data) {
                const errorInfo = error.response.data?.error as SelectorError;

                errorData = {
                    data: {
                        error: errorInfo,
                        status: error.response.data?.status,
                        title: getErrorTitle(errorInfo),
                    },
                    requestId: error.response.headers['x-request-id'],
                    extra: {
                        hideErrorDetails: Boolean(extDashkitContext?.hideErrorDetails),
                    },
                };
            } else {
                errorData = {data: {message: error.message}};
            }
            setErrorState(errorData, LOAD_STATUS.FAIL);
        }
    }, [
        data,
        extDashkitContext?.config,
        extDashkitContext?.hideErrorDetails,
        widgetId,
        id,
        loadedData,
        onStatusChanged,
        paramsForGroupApis,
        dependentSelectors,
        requestHeaders,
        setErrorState,
        setLoadedDataState,
        status,
        workbookId,
    ]);

    initStableRef.current = init;

    const reload = () => {
        clearLoaderTimer(silentLoaderTimer);

        if (data.source.elementType !== ELEMENT_TYPE.SELECT) {
            silentLoaderTimer = setTimeout(() => {
                if (isInit) {
                    dispatch(setSilentLoader({silentLoading}));
                }
            }, 800);
        }

        init();
    };

    const reloadAfterParamsChanges = () => {
        const significantParams = filterSignificantParams({
            params: paramsForGroupApis,
            loadedData,
            defaults: data.defaults,
            dependentSelectors,
        });
        if (!needReload && !isEqual(currentSignificantParams.current, significantParams)) {
            currentSignificantParams.current = significantParams;
            reload();
        }
    };

    // cancel requests, transfer status and remove timer if component is unmounted or selector is
    // removed from group
    React.useEffect(() => {
        dispatch(setIsInit({isInit: true}));

        return () => {
            if (!isMounted()) {
                clearLoaderTimer(silentLoaderTimer);
                onStatusChanged({controlId: id, status: LOAD_STATUS.DESTROYED});
                cancelCurrentRunRequest();
            }
        };
    }, [id, isMounted, onStatusChanged, silentLoaderTimer]);

    if (status !== LOAD_STATUS.PENDING && silentLoaderTimer) {
        clearLoaderTimer(silentLoaderTimer);
    }

    if (loadedData && !isEqual(params, prevParams)) {
        if (currentSignificantParams.current) {
            reloadAfterParamsChanges();
        }
        setPrevParams(params);
    }

    // control needs to be reloaded after autoupdate or update in data (changes in group configuration)
    if (prevNeedReload !== needReload) {
        setPrevNeedReload(needReload);
        if (needReload) {
            reload();
        }
    }

    if (!isInit && status === LOAD_STATUS.INITIAL) {
        init();
    }

    const setItemsLoader = React.useCallback(
        (isLoadingItems: boolean) => {
            if (!isMounted) {
                return;
            }
            dispatch(setLoadingItems({loadingItems: isLoadingItems}));
        },
        [isMounted],
    );

    const validateValue = React.useCallback((args: ValidationErrorData) => {
        const hasError = isValidRequiredValue(args);
        dispatch(setValidationError({hasError}));

        return hasError;
    }, []);

    const getValidationError = ({
        required,
        value,
    }: {
        required?: boolean;
        value: string | string[];
    }) => {
        let activeValidationError = null;

        if (required) {
            // for first initialization of control
            const initialValidationError = isValidRequiredValue({
                required,
                value,
            })
                ? i18n('value_required')
                : null;
            activeValidationError = validationError || initialValidationError;
        }

        return activeValidationError;
    };

    const onChangeParams = React.useCallback(
        ({value, param}: {value: string | string[]; param: string}) => {
            const newParam = {[param]: value};

            onChange({params: newParam, controlId: id});
        },
        [id, onChange],
    );

    const getTypeProps = (
        control: ActiveControl,
        controlData: DashTabItemControlSingle,
        currentValidationError: string | null,
    ) => {
        const {source} = controlData;
        const {type} = control;

        const typeProps: {
            timeFormat?: string;
            placeholder?: string;
            dateGranularityEnabled?: Record<string, boolean>;
        } = {};

        if (type === 'range-datepicker' || type === 'datepicker') {
            typeProps.dateGranularityEnabled =
                (control as {dateGranularityEnabled?: Record<string, boolean>})
                    .dateGranularityEnabled ??
                (source as {dateGranularityEnabled?: Record<string, boolean>})
                    ?.dateGranularityEnabled;
            let fieldType = source?.fieldType || null;
            if (controlData.sourceType === DashTabItemControlSourceType.Dataset) {
                const {datasetFieldType} = getDatasetSourceInfo({
                    data: controlData,
                    actualLoadedData: loadedData,
                });
                fieldType = datasetFieldType;
            }
            // Check 'datetime' for backward compatibility
            if (fieldType === 'datetime' || fieldType === DATASET_FIELD_TYPES.GENERICDATETIME) {
                typeProps.timeFormat = 'HH:mm:ss';
            }
        }

        if (type === 'input') {
            typeProps.placeholder = currentValidationError || control.placeholder;
        }

        return typeProps;
    };

    const renderSilentLoader = () => {
        if (showSilentLoader || (!control && status === LOAD_STATUS.SUCCESS)) {
            return (
                <div className={b('loader', {silent: true})}>
                    <Loader size="s" />
                </div>
            );
        }

        return null;
    };

    const renderOverlay = React.useCallback(() => {
        const paramId =
            (data.source as DashTabItemControlDataset['source']).datasetFieldId ||
            (data.source as DashTabItemControlManual['source']).fieldName ||
            control?.param ||
            '';

        const debugData = [
            {label: 'itemId', value: id},
            {label: 'paramId', value: paramId},
        ];

        return (
            <React.Fragment>
                <DebugInfoTool data={debugData} modType="top" />
                {renderSilentLoader()}
            </React.Fragment>
        );
    }, [control?.param, data.source, id, renderSilentLoader]);

    const renderLoadingStub = (props: Record<string, unknown>) => {
        const {
            source: {elementType},
        } = data as unknown as DashTabItemControlSingle;

        const stubProps = {
            ...props,
            value: '',
            param: '',
            onChange: () => {},
        };
        switch (elementType) {
            case DashTabItemControlElementType.Input:
                return <ControlInput {...stubProps} type="input" />;
            case DashTabItemControlElementType.Date:
                return <ControlDatepicker {...stubProps} type="datepicker" />;
            case DashTabItemControlElementType.Checkbox:
                return (
                    <ControlCheckbox
                        {...stubProps}
                        className={b('item', {checkbox: true})}
                        type="checkbox"
                    />
                );
        }

        return null;
    };

    const handleClickRetry = React.useCallback(() => {
        reload();
    }, [reload]);

    const renderControl = () => {
        // data is already in dash config, it's available without '/api/run' requests
        const controlData = data as unknown as DashTabItemControlSingle;
        const {source} = controlData;
        const {required, operation, elementType, titlePlacement, accentType} = source;

        const {label, innerLabel} = getLabels(controlData);
        const style: React.CSSProperties = {flex: '1 1 0', minWidth: 0};

        const vertical = titlePlacement === TitlePlacementOption.Top;

        // appearance props to help display the control before it is loaded
        const initialProps: Record<string, unknown> = {
            innerLabel,
            label,
            labelPlacement: titlePlacement,
            className: b('item'),
            // TODO: move class to withWrapForContros after cleaning code from GroupControls flag
            labelClassName: b('item-label', {vertical}),

            style,
            renderOverlay,
            hint: getControlHint(controlData.source),
            accentType,
        };

        const isEmptyParamValue = (val: unknown) => {
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
        };

        const currentControlParam = control?.param;
        const isDisabledByEmptyDependency =
            dependentSelectors &&
            Boolean(loadedData?.usedParams) &&
            Object.keys(loadedData!.usedParams!).some((usedParamName) => {
                if (usedParamName === currentControlParam) {
                    return false;
                }
                return isEmptyParamValue(paramsForGroupApis[usedParamName]);
            });
        const isDisabledByMissingDateInSegment = isFlightControlDisabledWithoutDate({
            group,
            controlId: id,
            groupStateParams,
        });

        // due to the logic of calculating the content,
        // the select itself is responsible for its own loading stub
        if (elementType === DashTabItemControlElementType.Select) {
            return (
                <ControlItemSelect
                    id={id}
                    data={data}
                    defaults={data.defaults || {}}
                    status={status}
                    loadedData={loadedData}
                    loadingItems={loadingItems}
                    actualParams={currentSignificantParams.current || paramsForGroupApis}
                    distinctParamsBaseFromGroup={distinctParamsBaseFromGroup}
                    onChange={onChangeParams}
                    init={init}
                    setItemsLoader={setItemsLoader}
                    validationError={validationError}
                    errorData={errorData}
                    validateValue={validateValue}
                    getDistincts={getDistincts}
                    classMixin={b('item')}
                    labelMixin={b('item-label', {vertical})}
                    selectProps={{
                        innerLabel,
                        label,
                        style,
                        limitLabel: true,
                        labelPlacement: titlePlacement,
                        accentType,
                    }}
                    renderOverlay={renderOverlay}
                    disabledUntilDateInGroup={isDisabledByMissingDateInSegment}
                />
            );
        }

        if (status === LOAD_STATUS.FAIL) {
            return (
                <div className={b('item-stub', {error: true})} style={style}>
                    <Error errorData={errorData} onClickRetry={handleClickRetry} />
                </div>
            );
        }

        if (!control) {
            return renderLoadingStub(initialProps);
        }

        // this is data from '/api/run' request
        const {param, disabled, type: controlType} = control;

        const isDateLikeControl =
            controlType === TYPE.DATEPICKER || controlType === TYPE.RANGE_DATEPICKER;
        /*
         * Иначе дата блокируется, пока пусты группа/рейс: usedParams связывает все селекторы,
         * но период обычно задают первым — как на дашборде «Направления за месяц».
         */
        const effectiveDisabled =
            disabled || (!isDateLikeControl && isDisabledByEmptyDependency);

        const preparedValue = unwrapFromArrayAndSkipOperation(params[param]);

        const currentValidationError = getValidationError({
            required,
            value: preparedValue,
        });

        const onChangeControl = (value: string | string[]) => {
            const hasError = validateValue({
                required,
                value,
            });
            dispatch(setValidationError({hasError}));

            if (hasError) {
                return;
            }

            const valueWithOperation = addOperationForValue({
                value,
                operation,
            });

            if (!isEqual(valueWithOperation, unwrapFromArray(params[param]))) {
                onChangeParams({value: valueWithOperation, param});
            }
        };

        const props: Record<string, unknown> = {
            ...initialProps,
            param,
            type: control.type,
            widgetId: id,
            value: effectiveDisabled ? '' : preparedValue,
            required,
            onChange: onChangeControl,
            hasValidationError: Boolean(currentValidationError),
            disabled: effectiveDisabled,
            ...getTypeProps(control, controlData, currentValidationError),
        };

        switch (control.type) {
            case CONTROL_TYPE.INPUT:
                return <ControlInput {...props} />;
            case CONTROL_TYPE.DATEPICKER:
                return <ControlDatepicker {...props} />;
            case CONTROL_TYPE.RANGE_DATEPICKER:
                return <ControlRangeDatepicker returnInterval={true} {...props} />;
            case CONTROL_TYPE.CHECKBOX:
                return <ControlCheckbox {...props} className={b('item', {checkbox: true})} />;
        }

        return null;
    };

    return renderControl();
};
