import type {
    DatasetField,
    ParameterDefaultValue,
    ServerDatasetField,
    ServerField,
} from '../../../../../../../shared';
import {normalizeIntervalValueForMssqlScalar} from '../../../../../../../shared/modules/charts-shared';
import type {ApiV2Parameter} from '../../../../../../../shared/types/bi-api/v2';
import type {PayloadParameter} from '../../types';

import {isParamValid, isRawParamValid} from './misc';

/**
 * YDL OS: TVF placeholders часто ждут один скаляр — строку со списком через запятую
 * (мультивыбор дашборда). Массив значений склеиваем в ту же форму; строку не режем.
 */
function normalizeMultiValueParam(raw: unknown): string {
    if (Array.isArray(raw)) {
        return raw
            .map((v) => String(v).trim())
            .filter((s) => s.length > 0)
            .join(',');
    }
    return String(raw ?? '');
}

export const mapItemToPayloadParameter = (
    field: Partial<ServerField> & {guid: string},
): PayloadParameter => {
    return {
        id: field.guid,
        value: field.default_value ?? '',
    };
};
export const prepareParameterForPayload = (
    fields: ServerField[],
    datasetId: string,
): PayloadParameter[] => {
    return fields
        .filter((field: ServerField) => field.datasetId === datasetId)
        .map(mapItemToPayloadParameter);
};
export const getParametersMap = (parameters: PayloadParameter[]) => {
    return parameters.reduce(
        (acc, curr) => {
            return {...acc, [curr.id]: true};
        },
        {} as Record<string, boolean>,
    );
};
export const mapParameterToRequestFormat = (parameter: PayloadParameter): ApiV2Parameter => {
    return {
        ref: {
            type: 'id',
            id: parameter.id,
        },
        value: parameter.value,
    };
};

type PrepareParamsParameters = {
    params: Record<string, ParameterDefaultValue> | undefined;
    resultSchema: DatasetField[] | ServerDatasetField[];
};

export const prepareParamsParameters = ({params, resultSchema}: PrepareParamsParameters) => {
    if (!params) {
        return [];
    }

    const filteredParamsKeys = Object.keys(params).filter((key) => {
        const param = params[key];
        const isRawParameterValid = isRawParamValid(param);

        if (!isRawParameterValid) {
            return false;
        }

        return isParamValid(param);
    });

    const preparedParamsParameters: Array<PayloadParameter | null> = filteredParamsKeys.map(
        (paramKey) => {
            let param = normalizeMultiValueParam(params[paramKey]);
            param = normalizeIntervalValueForMssqlScalar(param, paramKey);

            const datasetField = resultSchema.find(
                (item) => item.guid === paramKey || item.title === paramKey,
            );

            const guid = paramKey.length !== 36 && datasetField ? datasetField.guid : paramKey;

            return mapItemToPayloadParameter({guid, default_value: param});
        },
    );

    return preparedParamsParameters.filter((p): p is PayloadParameter => Boolean(p));
};

export const prepareParameters = (
    parameters: PayloadParameter[],
    params: Record<string, ParameterDefaultValue> | undefined,
    resultSchema: DatasetField[] | ServerDatasetField[],
) => {
    const paramsParameters = prepareParamsParameters({params, resultSchema});

    const paramsParametersMap = getParametersMap(paramsParameters);

    const filteredWizardParameters = parameters.filter(
        (parameter) => !paramsParametersMap[parameter.id],
    );

    return [...filteredWizardParameters, ...paramsParameters];
};
