"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddedEntryController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isObject_1 = __importDefault(require("lodash/isObject"));
const shared_1 = require("../../../../shared");
const storage_1 = require("../components/storage");
const embeddedEntryController = (req, res) => {
    const { ctx } = req;
    const embedToken = Array.isArray(req.headers[shared_1.DL_EMBED_TOKEN_HEADER])
        ? ''
        : req.headers[shared_1.DL_EMBED_TOKEN_HEADER];
    if (!embedToken) {
        ctx.log('CHARTS_ENGINE_NO_TOKEN');
        res.status(400).send({
            code: shared_1.ErrorCode.InvalidTokenFormat,
            extra: { message: 'You must provide embedToken', hideRetry: true },
        });
        return;
    }
    const payload = jsonwebtoken_1.default.decode(embedToken);
    if (!payload || typeof payload === 'string' || !('embedId' in payload)) {
        ctx.log('CHARTS_ENGINE_WRONG_TOKEN');
        res.status(400).send({
            code: shared_1.ErrorCode.InvalidTokenFormat,
            extra: { message: 'Wrong token format', hideRetry: true },
        });
        return;
    }
    const embedId = payload.embedId;
    res.locals.subrequestHeaders = {
        ...res.locals.subrequestHeaders,
        [shared_1.DL_EMBED_TOKEN_HEADER]: embedToken,
    };
    const configResolveArgs = {
        embedToken,
        // Key is legacy but we using it deeply like cache key, so this is just for compatibility purposes
        key: embedId,
        embedId,
        headers: {
            ...res.locals.subrequestHeaders,
            ...ctx.getMetadata(),
        },
    };
    const configPromise = ctx.call('configLoading', (cx) => (0, storage_1.resolveEmbedConfig)(cx, configResolveArgs));
    ctx.log('CHARTS_ENGINE_LOADING_CONFIG', { embedId });
    Promise.resolve(configPromise)
        .catch((err) => {
        const error = (0, isObject_1.default)(err) && 'message' in err ? err : new Error(err);
        const result = {
            error: {
                code: 'ERR.ENTRY.CONFIG_LOADING_ERROR',
                details: {
                    code: (error.response && error.response.status) || error.status || null,
                },
                extra: { hideRetry: false },
            },
        };
        ctx.logError(`CHARTS_ENGINE_CONFIG_LOADING_ERROR "token"`, error);
        const status = (error.response && error.response.status) || error.status || 500;
        res.status(status).send(result);
    })
        .then(async (response) => {
        if (response && 'entry' in response) {
            if (response.entry.scope === shared_1.EntryScope.Dash) {
                const { entry: { entryId, scope, data }, } = response;
                // Add only necessary fields without personal info like createdBy
                res.status(200).send({
                    entryId,
                    scope,
                    data,
                });
            }
            else {
                res.status(400).send({
                    code: shared_1.ErrorCode.InvalidToken,
                    extra: {
                        message: 'Invalid token',
                        hideRetry: true,
                    },
                });
            }
        }
    })
        .catch((error) => {
        ctx.logError('CHARTS_ENGINE_RUNNER_ERROR', error);
        res.status(500).send({
            error: 'Internal error',
        });
    });
};
exports.embeddedEntryController = embeddedEntryController;
