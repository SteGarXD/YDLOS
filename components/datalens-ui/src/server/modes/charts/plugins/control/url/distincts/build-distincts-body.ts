import type {AppContext} from '@gravity-ui/nodekit';

import type {
    ApiV2Filter,
    ApiV2Parameter,
    ApiV2RequestBody,
    FiltersOperationFromURL,
    StringParams,
} from '../../../../../../../shared';
import {
    DashTabItemControlElementType,
    DashTabItemControlSourceType,
    DatasetFieldType,
    Operations,
    resolveIntervalDate,
    resolveOperation,
    resolveRelativeDate,
    splitParamsToParametersAndFilters,
    transformParamsToUrlParams,
    transformUrlParamsToParams,
} from '../../../../../../../shared';
import type {PartialDatasetField} from '../../../../../../../shared/schema';
import type {ControlShared} from '../../types';

function readParamScalarForDistincts(raw: unknown): string | undefined {
    if (raw === undefined || raw === null) {
        return undefined;
    }
    if (Array.isArray(raw)) {
        for (const v of raw) {
            if (v !== undefined && v !== null) {
                const s = String(v).trim();
                if (s !== '') {
                    return s;
                }
            }
        }
        return undefined;
    }
    const s = String(raw).trim();
    return s === '' ? undefined : s;
}

function isFlightDependencyDatasetFieldForDistinct(
    f: PartialDatasetField,
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

function resolveFlightScalarForDirectionDistinctsServer(
    params: StringParams,
    directionFieldId: string,
    datasetFlightGuids: string[],
): string | undefined {
    for (const guid of datasetFlightGuids) {
        const v = readParamScalarForDistincts(params[guid]);
        if (v) {
            return v;
        }
    }
    for (const [key, raw] of Object.entries(params)) {
        if (key === directionFieldId || datasetFlightGuids.includes(key)) {
            continue;
        }
        const kl = key.toLowerCase();
        const looksFlight =
            kl.includes('flightno') ||
            kl.includes('flight_no') ||
            kl === 'nrs' ||
            kl.startsWith('nrs_') ||
            kl === 'nr_s';
        if (!looksFlight) {
            continue;
        }
        const v = readParamScalarForDistincts(raw);
        if (v) {
            return v;
        }
    }
    return undefined;
}

function isDirectionDistinctControl(
    shared: ControlShared,
    datasetFields: PartialDatasetField[],
): boolean {
    if (shared.sourceType !== DashTabItemControlSourceType.Dataset) {
        return false;
    }
    if (shared.source.elementType !== DashTabItemControlElementType.Select) {
        return false;
    }
    const t = `${shared.title || ''}`.toLowerCase();
    if (
        t.includes('напр') ||
        t.includes('direction') ||
        t.includes('маршрут') ||
        t.includes('route') ||
        t.includes('куда')
    ) {
        return true;
    }
    const field = datasetFields.find((f) => f.guid === shared.source.datasetFieldId);
    if (!field) {
        return false;
    }
    const tt = field.title.toLowerCase();
    const g = field.guid.toLowerCase();
    return (
        tt.includes('напр') ||
        tt.includes('направ') ||
        tt.includes('маршрут') ||
        tt.includes('direction') ||
        tt.includes('route') ||
        g.includes('direction') ||
        g.includes('route_') ||
        g.startsWith('mrshr')
    );
}

// См. клиент ControlItemSelect: без непустого cf_nr* TVF не отдаёт distinct; parameter_values на сервере отбрасывают пустые строки.
function propagateEmptyCfNrParamsForDistinctsServer(
    params: StringParams,
    datasetFields: PartialDatasetField[],
    directionFieldId: string,
): StringParams {
    const flightGuids = datasetFields
        .filter((f) => isFlightDependencyDatasetFieldForDistinct(f, directionFieldId))
        .map((f) => f.guid);
    const flightScalar = resolveFlightScalarForDirectionDistinctsServer(
        params,
        directionFieldId,
        flightGuids,
    );
    if (!flightScalar) {
        return params;
    }
    const fromSchema = datasetFields
        .filter(
            (f) =>
                f.guid !== directionFieldId &&
                f.calc_mode === 'parameter' &&
                f.guid.toLowerCase().startsWith('cf_nr'),
        )
        .map((f) => f.guid);
    const fromParams = Object.keys(params).filter(
        (k) =>
            k !== directionFieldId &&
            k.toLowerCase().startsWith('cf_nr') &&
            !readParamScalarForDistincts(params[k]),
    );
    const targetGuids = [...new Set([...fromSchema, ...fromParams])];
    if (targetGuids.length === 0) {
        return params;
    }
    const next: StringParams = {...params};
    let changed = false;
    for (const guid of targetGuids) {
        if (!readParamScalarForDistincts(next[guid])) {
            next[guid] = flightScalar;
            changed = true;
        }
    }
    return changed ? next : params;
}

function buildDistinctsBodyRequest({
    where,
    fieldGuid,
    parameters,
    datasetFieldsMap,
}: {
    where: {
        column: string;
        operation: Operations;
        values: string[];
    }[];
    fieldGuid: string;
    parameters: StringParams;
    datasetFieldsMap: Record<string, {guid: string; fieldType: string}>;
}): ApiV2RequestBody {
    const finalFieldGuid = datasetFieldsMap[fieldGuid]?.guid || fieldGuid;

    const filters: ApiV2Filter[] = (where || [])
        .filter((el) => datasetFieldsMap[el.column]?.fieldType !== DatasetFieldType.Measure)
        .map<ApiV2Filter>((el) => {
            return {
                ref: {type: 'id', id: datasetFieldsMap[el.column]?.guid || el.column || ''},
                operation: el.operation,
                values: el.values,
            };
        })
        .filter((filter) => {
            return filter.ref.type === 'id' && filter.ref.id !== finalFieldGuid;
        });

    const parameter_values = Object.keys(parameters)
        .map<ApiV2Parameter>((key) => {
            const guid = datasetFieldsMap[key]?.guid || key;
            let parameterValue: string = Array.isArray(parameters[key])
                ? (parameters[key] as string[])[0]
                : (parameters[key] as string);
            // YDL OS: MSSQL TVF parameters must receive a single scalar date, not __interval_FROM_TO.
            if (typeof parameterValue === 'string' && parameterValue.startsWith('__interval_')) {
                const m = parameterValue.match(/^__interval_(.+?)_(.+)$/);
                if (m) {
                    parameterValue = m[1].replace('T', ' ').split('.')[0].trim();
                }
            }
            return {
                ref: {type: 'id', id: guid},
                value: parameterValue,
            };
        })
        .filter((item) => item.value !== '');

    return {
        ignore_nonexistent_filters: true,
        fields: [
            {
                ref: {
                    type: 'id',
                    id: finalFieldGuid,
                },
                role_spec: {
                    role: 'distinct',
                },
            },
        ],
        filters,
        parameter_values,
    };
}

export const getDistinctsRequestBody = ({
    shared,
    params,
    datasetFields,
    ctx,
}: {
    shared: ControlShared;
    params: StringParams;
    datasetFields: PartialDatasetField[];
    ctx?: AppContext;
}): ApiV2RequestBody => {
    ctx?.log('CONTROLS_START_PREPARING_DISTINCTS_BODY');
    const targetParam = shared.param;

    const where: {
        column: string;
        operation: Operations;
        values: string[];
    }[] = [];

    ctx?.log('CONTROLS_START_MAPPING_DATASET_FIELDS');

    const datasetFieldsMap = datasetFields.reduce(
        (acc, field) => {
            const fieldData = {
                fieldType: field.type,
                guid: field.guid,
            };
            acc[field.guid] = fieldData;
            acc[field.title] = fieldData;

            return acc;
        },
        {} as Record<string, {guid: string; fieldType: string}>,
    );

    ctx?.log('CONTROLS_END_MAPPING_DATASET_FIELDS');

    ctx?.log?.('CONTROLS_START_TRANSFORMING_PARAMS');

    let workingParams: StringParams = {...params};
    if (isDirectionDistinctControl(shared, datasetFields)) {
        workingParams = propagateEmptyCfNrParamsForDistinctsServer(
            workingParams,
            datasetFields,
            shared.source.datasetFieldId,
        );
    }
    const urlSearchParams = transformParamsToUrlParams(workingParams);

    ctx?.log?.('CONTROLS_END_TRANSFORMING_PARAMS');

    ctx?.log?.('CONTROLS_START_SPLIT_PARAMS');

    const {filtersParams, parametersParams} = splitParamsToParametersAndFilters(
        urlSearchParams,
        datasetFields,
    );

    ctx?.log?.('CONTROLS_START_TRANSFORMING_PARAMS');

    const transformedFilterParams = transformUrlParamsToParams(filtersParams);
    const transformedParametersParams = transformUrlParamsToParams(parametersParams);

    ctx?.log?.('CONTROLS_END_TRANSFORMING_PARAMS');

    ctx?.log('CONTROLS_START_PROCESSING_FILTERS');

    Object.keys(transformedFilterParams).forEach((param) => {
        if (param === targetParam) {
            return;
        }

        let values: string[] | string = [];
        let operation;
        const paramValue = workingParams[param];
        if (Array.isArray(paramValue)) {
            const valuesWithOperations = paramValue
                .filter((value) => value)
                .map((value) => resolveOperation(value));

            values = valuesWithOperations.map(
                (item: FiltersOperationFromURL | null) => item!.value,
            );
            operation = valuesWithOperations.find((item) => item && item.operation)?.operation;

            if (values.length === 1 && String(values[0]).startsWith('__relative')) {
                const resolvedRelative = resolveRelativeDate(values[0]);

                if (resolvedRelative) {
                    values[0] = resolvedRelative;
                }
            }

            if (values.length === 1 && String(values[0]).startsWith('__interval')) {
                const resolvedInterval = resolveIntervalDate(values[0]);

                if (resolvedInterval) {
                    const {from, to} = resolvedInterval;

                    values = [from, to];
                    operation = Operations.BETWEEN;
                }
            }
        }

        operation = operation || Operations.IN;

        if (values.length) {
            where.push({
                column: param,
                operation,
                values,
            });
        }
    });

    ctx?.log('CONTROLS_END_PROCESSING_FILTERS');

    const apiV2RequestBody = buildDistinctsBodyRequest({
        where,
        fieldGuid: targetParam,
        parameters: transformedParametersParams,
        datasetFieldsMap,
    });

    ctx?.log('CONTROLS_END_PREPARING_DISTINCTS_BODY');

    return apiV2RequestBody;
};
