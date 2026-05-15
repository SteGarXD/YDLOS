"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntryNameByKey = getEntryNameByKey;
exports.normalizeDestination = normalizeDestination;
exports.isUsersFolder = isUsersFolder;
function getEntryNameByKey({ key, index = -1 }) {
    let name = '';
    if (key && typeof key === 'string') {
        let pathSplit = key.split('/');
        pathSplit = pathSplit.filter(Boolean);
        if (pathSplit.length !== 0) {
            name = pathSplit.splice(index, 1)[0];
        }
    }
    return name;
}
function normalizeDestination(destination = '') {
    // Delete extreme slashes, and add one to the right
    return destination.replace(/^\/+|\/+$/g, '') + '/';
}
function isUsersFolder(key = '') {
    return key.toLowerCase() === 'users/';
}
