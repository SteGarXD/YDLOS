import type {OutgoingHttpHeaders} from 'http';

import type {AppContext} from '@gravity-ui/nodekit';
import {REQUEST_ID_PARAM_NAME} from '@gravity-ui/nodekit';
import {isObject} from 'lodash';
import isNumber from 'lodash/isNumber';

import type {WorkbookId} from '../../../../../shared';
import {DL_EMBED_TOKEN_HEADER} from '../../../../../shared';
import type {GetDataSetFieldsByIdResponse, PartialDatasetField} from '../../../../../shared/schema';
import Cache from '../../../../components/cache-client';
import {
    type AuthParams,
    type ZitadelParams,
    addAuthHeaders,
    addZitadelHeaders,
} from '../../../../components/charts-engine/components/processor/data-fetcher';
import {registry} from '../../../../registry';
import type {DatalensGatewaySchemas} from '../../../../types/gateway';

import type {ConfigurableRequestWithDatasetPluginOptions} from './index';

export const DEFAULT_CACHE_TTL = 30;
/** Control-api кратковременно рвёт соединение (ECONNRESET) — чуть больше попыток и пауза снижают шум 500 на /api/run. */
const DATASET_FIELDS_MAX_ATTEMPTS = 5;

type DatasetFieldsLoadResult = {datasetFields: PartialDatasetField[]; revisionId: string};

/** Coalesce concurrent getDatasetFields for the same dataset (e.g. many selectors / parallel /api/run). */
const inFlightDatasetFieldsLoads = new Map<string, Promise<DatasetFieldsLoadResult>>();

const getStatusFromError = (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error && error.status;

const getCodeFromError = (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;

const getMessageFromError = (error: unknown) =>
    typeof error === 'object' && error !== null && 'message' in error ? error.message : undefined;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryDatasetFieldsRequest = (error: unknown, attempt: number) => {
    if (attempt >= DATASET_FIELDS_MAX_ATTEMPTS) {
        return false;
    }

    const status = getStatusFromError(error);
    if (isNumber(status) && (status >= 500 || status === 429)) {
        return true;
    }

    const code = String(getCodeFromError(error) ?? '').toUpperCase();
    if (
        code === 'ECONNABORTED' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'EAI_AGAIN' ||
        code === 'ENOTFOUND'
    ) {
        return true;
    }

    const message = String(getMessageFromError(error) ?? '').toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
};

const getDatasetFieldsById = async ({
    datasetId,
    workbookId,
    ctx,
    rejectFetchingSource,
    iamToken,
    pluginOptions,
    zitadelParams,
    authParams,
    headers,
}: {
    datasetId: string;
    workbookId: string | null;
    ctx: AppContext;
    rejectFetchingSource: (reason?: any) => void;
    iamToken?: string;
    pluginOptions?: ConfigurableRequestWithDatasetPluginOptions;
    zitadelParams: ZitadelParams | undefined;
    authParams: AuthParams | undefined;
    headers: OutgoingHttpHeaders;
}): Promise<GetDataSetFieldsByIdResponse> => {
    const {gatewayApi} = registry.getGatewayApi<DatalensGatewaySchemas>();

    const requestDatasetFields =
        pluginOptions?.getDataSetFieldsById || gatewayApi.bi.getDataSetFieldsById;

    const requestDatasetFieldsByToken = gatewayApi.bi.embedsGetDataSetFieldsById;
    for (let attempt = 1; attempt <= DATASET_FIELDS_MAX_ATTEMPTS; attempt++) {
        try {
            if (zitadelParams) {
                addZitadelHeaders({headers, zitadelParams});
            }

            if (authParams) {
                addAuthHeaders({headers, authParams});
            }

            const response = headers[DL_EMBED_TOKEN_HEADER]
                ? await requestDatasetFieldsByToken({
                      ctx,
                      headers,
                      //requestId: headers['x-request-id'] ? headers['x-request-id']: req.id,
                      requestId:
                          headers['x-request-id']?.toString() || ctx.get(REQUEST_ID_PARAM_NAME) || '',
                      args: {
                          dataSetId: datasetId,
                      },
                  })
                : await requestDatasetFields({
                      ctx: ctx,
                      headers,
                      //requestId: headers['x-request-id'] ? headers['x-request-id']: req.id,
                      requestId:
                          headers['x-request-id']?.toString() || ctx.get(REQUEST_ID_PARAM_NAME) || '',
                      authArgs: {iamToken},
                      args: {
                          dataSetId: datasetId,
                          workbookId: workbookId,
                      },
                  });

            return response.responseData;
        } catch (err: unknown) {
            const sourceError =
                typeof err === 'object' && err !== null && 'error' in err ? err.error : err;

            if (shouldRetryDatasetFieldsRequest(sourceError, attempt)) {
                ctx.log('RETRY_GET_DATASET_FIELDS', {
                    datasetId,
                    attempt,
                    status: getStatusFromError(sourceError),
                    code: getCodeFromError(sourceError),
                });
                await sleep(200 + attempt * 200);
                continue;
            }

            if (typeof err === 'object' && err !== null && 'error' in err) {
                const {error} = err;
                let preparedError = error;
                if (isObject(error) && 'message' in error) {
                    const message = error.message as string;
                    preparedError = new Error(message);
                }
                ctx.logError('FAILED_TO_RECEIVE_FIELDS', preparedError);
                const status = getStatusFromError(error);
                if (isNumber(status) && status < 500) {
                    rejectFetchingSource({
                        [`${datasetId}_result`]: error,
                    });
                }
            }
            throw new Error('FAILED_TO_RECEIVE_DATASET_FIELDS');
        }
    }

    throw new Error('FAILED_TO_RECEIVE_DATASET_FIELDS');
};

export const getDatasetFields = async (args: {
    datasetId: string;
    workbookId: WorkbookId;
    ctx: AppContext;
    iamToken?: string;
    cacheClient: Cache;
    userId: string | null;
    rejectFetchingSource: (reason: any) => void;
    pluginOptions?: ConfigurableRequestWithDatasetPluginOptions;
    zitadelParams: ZitadelParams | undefined;
    authParams: AuthParams | undefined;
    requestHeaders: OutgoingHttpHeaders;
}): Promise<DatasetFieldsLoadResult> => {
    const {
        datasetId,
        workbookId,
        cacheClient,
        ctx,
        userId,
        iamToken,
        rejectFetchingSource,
        pluginOptions,
        zitadelParams,
        authParams,
        requestHeaders,
    } = args;

    const cacheKey = `${datasetId}__${workbookId ?? 'no-workbook'}__${userId ?? 'anonymous'}`;

    ctx.log('DATASET_FOR_CHARTS_MIDDLEWARE', {cacheKey});

    if (cacheClient.client) {
        const cacheResponse = await cacheClient.get({key: cacheKey});

        if (cacheResponse.status === Cache.OK) {
            ctx.log('DATASET_FIELDS_WAS_RECEIVED_FROM_CACHE');
            ctx.log('DATASET_FIELDS_WAS_SUCCESSFULLY_PROCESSED');
            return {
                datasetFields: cacheResponse.data.datasetFields,
                revisionId: cacheResponse.data.revisionId,
            };
        }

        ctx.log('DATASET_FIELDS_IN_CACHE_WAS_NOT_FOUND');
    }

    const loadOnce = async (): Promise<DatasetFieldsLoadResult> => {
        const response = await getDatasetFieldsById({
            datasetId,
            workbookId,
            ctx,
            rejectFetchingSource,
            iamToken,
            pluginOptions,
            zitadelParams,
            authParams,
            headers: requestHeaders,
        });
        const datasetFields = response.fields;
        const revisionId = response.revision_id;

        if (cacheClient.client) {
            cacheClient
                .set({
                    key: cacheKey,
                    ttl: pluginOptions?.cache || DEFAULT_CACHE_TTL,
                    value: {datasetFields, revisionId},
                })
                .then((setCacheResponse) => {
                    if (setCacheResponse.status === Cache.OK) {
                        ctx.log('SET_DATASET_IN_CACHE_SUCCESS');
                    } else {
                        ctx.logError(
                            'SET_DATASET_FIELDS_IN_CACHE_FAILED',
                            new Error(setCacheResponse.message),
                        );
                    }
                })
                .catch((error) => {
                    ctx.logError('SET_DATASET_FIELDS_UNHANDLED_ERROR', error);
                });
        }

        return {datasetFields, revisionId};
    };

    let inFlight = inFlightDatasetFieldsLoads.get(cacheKey);
    if (!inFlight) {
        inFlight = loadOnce().finally(() => {
            inFlightDatasetFieldsLoads.delete(cacheKey);
        });
        inFlightDatasetFieldsLoads.set(cacheKey, inFlight);
    }

    const result = await inFlight;
    ctx.log('DATASET_FIELDS_WAS_SUCCESSFULLY_PROCESSED');

    return result;
};
