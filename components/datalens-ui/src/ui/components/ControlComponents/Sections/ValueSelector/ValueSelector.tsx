import React from 'react';

import {FormRow} from '@gravity-ui/components';
import {Checkbox, RadioGroup, TextInput} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import {DialogControlQa} from 'shared';
import {FieldWrapper} from 'ui/components/FieldWrapper/FieldWrapper';
import {VIEW_MODES} from 'ui/components/Select/hooks/useSelectRenderFilter/useSelectRenderFilter';
import {registry} from 'ui/registry';
import {setSelectorDialogItem} from 'ui/store/actions/controlDialog';
import {CheckboxControlValue} from 'ui/store/constants/controlDialog';
import {
    selectIsControlConfigurationDisabled,
    selectSelectorControlType,
    selectSelectorDefaultValue,
    selectSelectorDialog,
    selectSelectorValidation,
} from 'ui/store/selectors/controlDialog';
import {selectWorkbookId} from 'ui/units/workbooks/store/selectors';

import type {FilterValue} from '../../../../../shared/modules';
import {DATASET_FIELD_TYPES, DashTabItemControlSourceType} from '../../../../../shared/types';
import {getDistinctsByTypedQuery} from '../CommonSettingsSection/ConnectionSettings/helpers/get-distincts-by-typed-query';
import DateDefaultValue from '../Date/Default/Default';

import type {ListValueControlProps} from './ListValueControl/ListValueControl';
import {ListValueControl} from './ListValueControl/ListValueControl';
import {
    DEFAULT_PAGE_SIZE,
    getDistinctsByDatasetField,
} from './helpers/get-distincts-by-dataset-field';

import './ValueSelector.scss';

const b = block('value-selector-wrapper');

const i18n = I18n.keyset('dash.control-dialog.edit');

const InputValueControl = ({className}: {className?: string}) => {
    const dispatch = useDispatch();
    const defaultValue = useSelector(selectSelectorDefaultValue);
    const isFieldDisabled = useSelector(selectIsControlConfigurationDisabled);
    const validation = useSelector(selectSelectorValidation);

    const handleUpdate = React.useCallback((value: string) => {
        dispatch(
            setSelectorDialogItem({
                defaultValue: value,
            }),
        );
    }, []);

    return (
        <FormRow label={i18n('field_default-value')} className={className}>
            <FieldWrapper error={validation.defaultValue}>
                <TextInput
                    disabled={isFieldDisabled}
                    value={(defaultValue ?? '') as string}
                    onUpdate={handleUpdate}
                    qa={DialogControlQa.valueInput}
                />
            </FieldWrapper>
        </FormRow>
    );
};

const DEFAULT_GRANULARITY_ENABLED = {
    day: true,
    week: true,
    month: true,
    quarter: true,
    year: true,
} as const;

const GRANULARITY_KEYS = ['day', 'week', 'month', 'quarter', 'year'] as const;
const GRANULARITY_I18N_KEYS = [
    'field_date-granularity-day',
    'field_date-granularity-week',
    'field_date-granularity-month',
    'field_date-granularity-quarter',
    'field_date-granularity-year',
] as const;
// YDL OS: подписи точности даты всегда по-русски (эталон)
const GRANULARITY_LABELS_RU = [
    'По дню',
    'По неделе',
    'По месяцу',
    'По кварталу',
    'По году',
] as const;

const DateValueControl = ({rowClassName}: {rowClassName?: string}) => {
    const {isRange, dateGranularityEnabled, acceptableValues, defaultValue, fieldType, sourceType} =
        useSelector(selectSelectorDialog);
    const isFieldDisabled = useSelector(selectIsControlConfigurationDisabled);
    const validation = useSelector(selectSelectorValidation);

    const enabled = dateGranularityEnabled ?? DEFAULT_GRANULARITY_ENABLED;

    const dispatch = useDispatch();

    const handleIsRangeUpdate = React.useCallback((value: boolean) => {
        dispatch(
            setSelectorDialogItem({
                isRange: value,
                defaultValue: undefined,
                ...(value ? {dateGranularityEnabled: DEFAULT_GRANULARITY_ENABLED} : {}),
            }),
        );
    }, []);

    const handleGranularityToggle = React.useCallback(
        (key: (typeof GRANULARITY_KEYS)[number], value: boolean) => {
            dispatch(
                setSelectorDialogItem({
                    dateGranularityEnabled: {
                        ...(enabled as Record<string, boolean>),
                        [key]: value,
                    } as Record<'year' | 'month' | 'day' | 'quarter' | 'week', boolean>,
                }),
            );
        },
        [dispatch, enabled],
    );

    const handleTimeChange = React.useCallback((value: boolean) => {
        dispatch(
            setSelectorDialogItem({
                fieldType: value ? DATASET_FIELD_TYPES.GENERICDATETIME : undefined,
                defaultValue: undefined,
            }),
        );
    }, []);

    const handleDefaultValueChange = React.useCallback((value: {defaultValue: FilterValue}) => {
        dispatch(
            setSelectorDialogItem({
                defaultValue: value.defaultValue!,
            }),
        );
    }, []);

    return (
        <React.Fragment>
            <FormRow label={i18n('field_date-range')} className={rowClassName}>
                <Checkbox
                    qa={DialogControlQa.dateRangeCheckbox}
                    className={b('checkbox-option')}
                    checked={isRange ?? false}
                    disabled={isFieldDisabled}
                    onUpdate={handleIsRangeUpdate}
                    size="l"
                />
            </FormRow>

            {isRange ? (
                <FormRow
                    label={(() => {
                        const t = i18n('field_date-granularity');
                        return t && t !== 'field_date-granularity' ? t : 'Точность выбора';
                    })()}
                    className={rowClassName}
                >
                    <div className={b('granularity-checkboxes')}>
                        {GRANULARITY_KEYS.map((key, i) => (
                            <Checkbox
                                key={key}
                                className={b('checkbox-option')}
                                checked={enabled[key] ?? true}
                                disabled={isFieldDisabled}
                                onUpdate={(value) => handleGranularityToggle(key, value)}
                                size="l"
                            >
                                {(() => {
                                    const t = i18n(GRANULARITY_I18N_KEYS[i]);
                                    return t && t !== GRANULARITY_I18N_KEYS[i]
                                        ? t
                                        : GRANULARITY_LABELS_RU[i];
                                })()}
                            </Checkbox>
                        ))}
                    </div>
                </FormRow>
            ) : null}

            {sourceType === 'manual' ? (
                <FormRow label={i18n('field_date-with-time')} className={rowClassName}>
                    <Checkbox
                        qa={DialogControlQa.dateTimeCheckbox}
                        className={b('checkbox-option')}
                        checked={fieldType === DATASET_FIELD_TYPES.GENERICDATETIME}
                        disabled={isFieldDisabled}
                        onUpdate={handleTimeChange}
                        size="l"
                    />
                </FormRow>
            ) : null}
            <FormRow label={i18n('field_default-value')} className={rowClassName}>
                <FieldWrapper error={validation.defaultValue}>
                    <DateDefaultValue
                        disabled={isFieldDisabled}
                        acceptableValues={acceptableValues}
                        defaultValue={defaultValue as string | undefined}
                        isRange={Boolean(isRange)}
                        onApply={handleDefaultValueChange}
                        fieldType={fieldType}
                        hasValidationError={Boolean(validation.defaultValue)}
                    />
                </FieldWrapper>
            </FormRow>
        </React.Fragment>
    );
};

const CheckboxValueControl = ({className}: {className?: string}) => {
    const dispatch = useDispatch();
    const defaultValue = useSelector(selectSelectorDefaultValue);
    const isFieldDisabled = useSelector(selectIsControlConfigurationDisabled);

    const handleUpdate = React.useCallback(
        (value: string) => {
            dispatch(
                setSelectorDialogItem({
                    defaultValue: value,
                }),
            );
        },
        [dispatch],
    );

    return (
        <FormRow label={i18n('field_default-value')} className={className}>
            <RadioGroup
                className={b('radio-option')}
                onUpdate={handleUpdate}
                disabled={isFieldDisabled}
                defaultValue={CheckboxControlValue.FALSE}
                value={defaultValue as CheckboxControlValue | undefined}
            >
                <RadioGroup.Option
                    value={CheckboxControlValue.TRUE}
                    content={i18n('value_checkbox-default-value-true')}
                />
                <RadioGroup.Option
                    value={CheckboxControlValue.FALSE}
                    content={i18n('value_checkbox-default-value-false')}
                />
            </RadioGroup>
        </FormRow>
    );
};

const ValueSelector = ({rowClassName}: {rowClassName?: string}) => {
    const {sourceType} = useSelector(selectSelectorDialog);
    const controlType = useSelector(selectSelectorControlType);
    const workbookId = useSelector(selectWorkbookId);

    const {datasetId, datasetFieldId} = useSelector(selectSelectorDialog);

    const {connectionId, connectionQueryContent, connectionQueryType, selectorParameters} =
        useSelector(selectSelectorDialog);

    const connectionFetcher = React.useCallback(
        () =>
            getDistinctsByTypedQuery({
                workbookId,
                connectionId,
                connectionQueryContent,
                connectionQueryType,
                parameters: selectorParameters || {},
            }),
        [connectionId, connectionQueryContent, connectionQueryType, workbookId, selectorParameters],
    );

    const [searchPattern, setSearchPattern] = React.useState('');

    const onFilterChange = (pattern: string, mode: 'ALL' | 'SELECTED') => {
        if (mode === VIEW_MODES.ALL) {
            setSearchPattern(pattern);
        }
    };

    const datasetFetcher = React.useCallback(
        ({pageNumber, pageSize} = {pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE}) =>
            getDistinctsByDatasetField({
                datasetId,
                workbookId,
                datasetFieldId,
                nextPageToken: pageNumber,
                searchPattern,
                pageSize,
            }),
        [datasetId, workbookId, datasetFieldId, searchPattern],
    );

    const listValueProps = React.useMemo((): ListValueControlProps => {
        switch (sourceType) {
            case DashTabItemControlSourceType.Connection:
                return {
                    type: 'dynamic',
                    custom: {
                        fetcher: connectionFetcher,
                        disabled: !connectionId || !connectionQueryContent || !connectionQueryType,
                        filterable: false,
                        onRetry: async () => {
                            await connectionFetcher();
                        },
                    },
                    hasMultiselect: false,
                };
            case DashTabItemControlSourceType.Dataset:
                return {
                    type: 'dynamic',
                    custom: {
                        fetcher: datasetFetcher,
                        onFilterChange,
                        disabled: !datasetId || !datasetFieldId,
                    },
                };
            default:
                return {type: 'manual'};
        }
    }, [
        connectionFetcher,
        connectionId,
        connectionQueryContent,
        connectionQueryType,
        datasetFetcher,
        datasetFieldId,
        datasetId,
        sourceType,
    ]);

    const {useExtendedValueSelector} = registry.dash.functions.getAll();

    let inputControl = useExtendedValueSelector(controlType);

    if (inputControl) {
        return inputControl;
    }

    switch (controlType) {
        case 'date': {
            inputControl = <DateValueControl rowClassName={rowClassName} />;
            break;
        }
        case 'select': {
            inputControl = <ListValueControl {...listValueProps} rowClassName={rowClassName} />;
            break;
        }
        case 'input': {
            inputControl = <InputValueControl className={rowClassName} />;
            break;
        }
        case 'checkbox': {
            inputControl = <CheckboxValueControl className={rowClassName} />;
        }
    }

    return inputControl;
};

export {ValueSelector};
