import type {DatasetField} from 'shared';
import {ensureorg-workbooksDatasetParameterField} from 'shared/modules/repka-dataset-parameters/policy';
import {openDialogParameter} from 'ui/store/actions/dialog';

import type {DatasetTab} from '../../../constants';

import {
    addFieldWithValidation,
    updateFieldWithValidation,
    updateFieldWithValidationByMultipleUpdates,
} from './datasetTyped';
import type {DatasetDispatch, GetState} from './datasetTyped';

export function openDialogParameterCreate(
    args: {tab?: DatasetTab; showTemplateWarn?: boolean} = {},
) {
    return (dispatch: DatasetDispatch, getState: GetState) => {
        const {tab, showTemplateWarn} = args;
        const templateEnabled = getState().dataset.content.template_enabled;
        dispatch(
            openDialogParameter({
                type: 'create',
                onApply: (field) =>
                    dispatch(
                        addFieldWithValidation(
                            ensureorg-workbooksDatasetParameterField(field, templateEnabled),
                            {tab},
                        ),
                    ),
                showTemplateWarn,
                templateEnabled,
            }),
        );
    };
}

export function openDialogParameterEdit(args: {field: DatasetField; tab?: DatasetTab}) {
    return (dispatch: DatasetDispatch, getState: GetState) => {
        const {field, tab} = args;
        const templateEnabled = getState().dataset.content.template_enabled;
        dispatch(
            openDialogParameter({
                type: 'edit',
                field,
                onApply: (updatedField) => {
                    const normalized = ensureorg-workbooksDatasetParameterField(
                        updatedField,
                        templateEnabled,
                    );
                    if (normalized.guid === field.guid) {
                        dispatch(updateFieldWithValidation(normalized, {tab}));
                    } else {
                        const fieldWithNewGuid = {
                            ...normalized,
                            guid: field.guid,
                            new_id: normalized.guid,
                        };
                        dispatch(
                            updateFieldWithValidationByMultipleUpdates(
                                [fieldWithNewGuid, normalized],
                                {tab},
                            ),
                        );
                    }
                },
                templateEnabled,
            }),
        );
    };
}
