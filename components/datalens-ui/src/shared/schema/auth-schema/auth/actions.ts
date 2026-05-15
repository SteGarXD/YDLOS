import {AuthHeader, SET_COOKIE_HEADER} from '../../../constants';
import {createAction} from '../../gateway-utils';

import type {SigninArgs, SignupArgs} from './types';

export const actions = {
    refreshTokens: createAction<undefined, undefined>({
        method: 'POST',
        proxyHeaders: [AuthHeader.Cookie],
        proxyResponseHeaders: [SET_COOKIE_HEADER],
        // us-auth: виртуальный префикс /demo + datalens-auth.js (POST /refresh под vPath)
        path: () => '/demo/refresh',
    }),
    signin: createAction<undefined, SigninArgs>({
        method: 'POST',
        proxyResponseHeaders: [SET_COOKIE_HEADER],
        path: () => '/demo/auth',
        params: ({login, password}, headers) => ({
            body: {login, password},
            headers,
        }),
    }),
    signup: createAction<undefined, SignupArgs>({
        method: 'POST',
        proxyResponseHeaders: [SET_COOKIE_HEADER],
        path: () => '/signup',
        params: ({login, password, firstName, lastName, email}, headers) => ({
            body: {login, password, firstName, lastName, email},
            headers,
        }),
    }),
    logout: createAction<undefined, undefined>({
        method: 'GET',
        proxyHeaders: [AuthHeader.Cookie],
        proxyResponseHeaders: [SET_COOKIE_HEADER],
        path: () => '/demo/logout',
    }),
};
