"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const gateway_utils_1 = require("../gateway-utils");
const utils_1 = require("../utils");
const PATH_PREFIX = '/v1';
exports.actions = {
    addUsersRoles: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/management/users/roles/add`,
        params: ({ deltas }, headers) => ({ body: { deltas }, headers }),
    }),
    updateUsersRoles: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/management/users/roles/update`,
        params: ({ deltas }, headers) => ({ body: { deltas }, headers }),
    }),
    removeUsersRoles: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/management/users/roles/remove`,
        params: ({ deltas }, headers) => ({ body: { deltas }, headers }),
    }),
    createUser: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/management/users/create`,
        params: ({ login, password, email, firstName, lastName, roles }, headers) => ({
            body: { login, password, email, firstName, lastName, roles },
            headers,
        }),
    }),
    deleteUser: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ userId }) => `${PATH_PREFIX}/management/users/${userId}`,
        params: (_args, headers) => ({ headers }),
    }),
    getUserProfile: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ userId }) => `${PATH_PREFIX}/management/users/${userId}/profile`,
        params: (_args, headers) => ({ headers }),
    }),
    updateUserProfile: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ userId }) => `${PATH_PREFIX}/management/users/${userId}/profile`,
        params: ({ email, firstName, lastName }, headers) => ({
            body: { email, firstName, lastName },
            headers,
        }),
    }),
    updateUserPassword: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ userId }) => `${PATH_PREFIX}/management/users/${userId}/password`,
        params: ({ newPassword }, headers) => ({ body: { newPassword }, headers }),
    }),
    getMyUserProfile: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/users/me/profile`,
        params: (_args, headers) => ({ headers }),
    }),
    updateMyUserProfile: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/users/me/profile`,
        params: ({ email, firstName, lastName }, headers) => ({
            body: { email, firstName, lastName },
            headers,
        }),
    }),
    updateMyUserPassword: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/users/me/password`,
        params: ({ oldPassword, newPassword }, headers) => ({
            body: { oldPassword, newPassword },
            headers,
        }),
    }),
    getUsersList: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/users/list`,
        params: ({ page, pageSize, filterString, roles, idpType }, headers) => ({
            query: { page, pageSize, filterString, roles, idpType },
            headers,
        }),
        paramsSerializer: utils_1.defaultParamsSerializer,
    }),
    getUsersByIds: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/users/get-by-ids`,
        params: ({ subjectIds }, headers) => ({
            body: { subjectIds },
            headers,
        }),
    }),
};
