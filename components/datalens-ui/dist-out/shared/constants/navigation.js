"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAP_PLACE_TO_SCOPE = exports.PLACE = void 0;
exports.PLACE = {
    ROOT: 'navigation',
    FAVORITES: 'favorites',
    DASHBOARDS: 'dashboards',
    DATASETS: 'datasets',
    WIDGETS: 'widgets',
    CONNECTIONS: 'connections',
    CLUSTERS: 'clusters',
    REPORTS: 'reports',
};
exports.MAP_PLACE_TO_SCOPE = {
    [exports.PLACE.ROOT]: 'folder',
    [exports.PLACE.FAVORITES]: 'folder',
    [exports.PLACE.DASHBOARDS]: 'dash',
    [exports.PLACE.DATASETS]: 'dataset',
    [exports.PLACE.WIDGETS]: 'widget',
    [exports.PLACE.CONNECTIONS]: 'connection',
    [exports.PLACE.CLUSTERS]: 'clusters',
    [exports.PLACE.REPORTS]: 'report',
};
