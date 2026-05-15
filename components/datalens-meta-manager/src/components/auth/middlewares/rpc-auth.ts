import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {RPC_AUTHORIZATION_HEADER} from '../../../constants/auth';
import {AUTH_ERRORS} from '../constants/error-constants';

const http = require('http');
const https = require('https');

export const rpcAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    isAuthFeature(req, res, (status: number, responseData: any) => {
        if (status == 200 || req.url.indexOf('/auth') >= 0) {
            const r: any = req;
            r.rpc = responseData;

            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');
                let login = responseData[0].login;

                req.originalContext.set('user', {
                    userId: responseData[0].user_id,
                    sessionId: '',
                    accessToken: responseData[0].token,
                    roles: [],
                    claims: responseData[0].claims
                });

                // for ctx info
                res.locals.userId = login;
                res.locals.login = login;

                req.ctx.log('CHECK_ACCESS_TOKEN_SUCCESS');

                next();
                return;
            } catch (error) {
                req.ctx.logError('CHECK_ACCESS_TOKEN_ERROR', error);
            }

        } else {
            req.ctx.logError('NOT_RPC_AUTHORIZATION');
            res.status(401).send({code: AUTH_ERRORS.UNAUTHORIZED_ACCESS, message: 'Unauthorized access'});
        }
    });
};



export const isAuthFeature = (
    req: any,
    res: any,
    callback: (status: number, responseData: any) => void,
) => {
    function getRpcAuthorization(req: any) {
        if(req.id.indexOf('{{') == 0) {
            return req.id.substring(2, req.id.indexOf('}}'));
        }
        
        const authorization = req.headers[RPC_AUTHORIZATION_HEADER] || req.query[RPC_AUTHORIZATION_HEADER];
        if (authorization) {
            return authorization;
        } else {
            const xDlContext = req.headers['x-dl-context'];

            if (xDlContext) {
                try {
                    const data = JSON.parse(xDlContext);
                    return data['rpcAuthorization'];
                } catch (e) {}
            }

            return null;
        }
    }

    function responseCode(token: string) {
        const url = require('url');

        const data = JSON.stringify({
            action: 'datalens',
            method: 'authorization',
            data: [{ url: req.url, method: req.method, rawHeaders: req.rawHeaders }],
            type: 'rpc',
            tid: 0,
        });

        const urlRpc = url.parse(process.env.NODE_RPC_URL, true);

        const options = {
            hostname: urlRpc.hostname,
            path: urlRpc.pathname,
            method: 'POST',
            port: urlRpc.port,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data),
                'rpc-authorization': token,
            },
        };

        const postRequest = (urlRpc.protocol == 'http:' ? http : https)
            .request(options, (response: any) => {
                let body = '';

                response.on('data', (chunk: any) => {
                    body += chunk;
                });

                response.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        callback(response.statusCode, json[0].result.records);
                    } catch (error: any) {
                        req.ctx.logError(`RESPONSE ERR ${process.env.NODE_RPC_URL}: ` + error.stack + ' ' + body);
                        callback(response.statusCode, {msg: body || error.message});
                    }
                });
            })
            .on('error', (error: any) => {
                req.ctx.logError(`REQUEST ERR ${process.env.NODE_RPC_URL}: ` + error.stack);
                callback(401, null);
            });

        postRequest.write(data);
        postRequest.end();
    }

    if (process.env.NODE_RPC_URL) {
        const token = getRpcAuthorization(req);
        if (token) {
            responseCode(token);
        } else {
            req.ctx.log(`Token empty NODE_RPC_URL: ${process.env.NODE_RPC_URL}`);
            callback(req.url.indexOf('/private/') == 0 ? 200 : 401, null);
        }
    } else {
        callback(200, null);
    }
};
