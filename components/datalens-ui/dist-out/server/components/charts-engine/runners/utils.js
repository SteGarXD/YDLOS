"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareErrorForLogger = prepareErrorForLogger;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const { DATA_FETCHING_ERROR } = constants_1.config;
function prepareErrorForLogger(error) {
    if ((0, lodash_1.isObject)(error) && 'code' in error && error.code === DATA_FETCHING_ERROR) {
        let errorDetails = {};
        if ('details' in error &&
            (0, lodash_1.isObject)(error.details) &&
            'sources' in error.details &&
            (0, lodash_1.isObject)(error.details.sources)) {
            const sources = error.details.sources;
            errorDetails = Object.keys(sources).map((key) => {
                const source = sources[key];
                const body = 'body' in source && (0, lodash_1.isObject)(source.body) ? source.body : {};
                return {
                    [key]: {
                        sourceType: source.sourceType,
                        status: source.status,
                        body: {
                            message: 'message' in body ? body.message : undefined,
                            code: 'code' in body ? body.code : undefined,
                        },
                    },
                };
            });
        }
        return {
            code: DATA_FETCHING_ERROR,
            message: 'message' in error ? error.message : 'Data fetching error',
            statusCode: 'statusCode' in error ? error.statusCode : undefined,
            details: errorDetails,
        };
    }
    return (0, lodash_1.isObject)(error) ? error : { error };
}
