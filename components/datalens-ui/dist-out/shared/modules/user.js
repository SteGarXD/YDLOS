"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterUsersIds = exports.isUserId = exports.getUserId = exports.makeUserId = void 0;
const UID_PREFIX = 'uid:';
const ANONYMOUS_USER_PREFIX = '__ANONYMOUS';
const makeUserId = (userId) => `uid:${userId}`;
exports.makeUserId = makeUserId;
const getUserId = (userIdWithPrefix) => userIdWithPrefix.slice(UID_PREFIX.length);
exports.getUserId = getUserId;
const isUserId = (userIdOrLogin = '') => {
    return userIdOrLogin.startsWith(UID_PREFIX) && !userIdOrLogin.includes(ANONYMOUS_USER_PREFIX);
};
exports.isUserId = isUserId;
const filterUsersIds = (ids) => ids.filter(exports.isUserId).map(exports.getUserId);
exports.filterUsersIds = filterUsersIds;
