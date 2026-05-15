"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsFetcher = void 0;
const querystring_1 = require("querystring");
const axios_1 = __importDefault(require("axios"));
const get_1 = __importDefault(require("lodash/get"));
const moment_1 = __importDefault(require("moment"));
const TEN_SECONDS = 10000;
class CommentsFetcher {
    static async fetch({ feeds, meta: { matchType = 'full', dateFrom, dateTo } }, headers, ctx) {
        const comments = [];
        const logs = [];
        const usEndpoint = ctx.config.endpoints.api.us;
        // Filtering feeds to cancel loading same feeds
        const knownFeeds = new Set();
        const filteredFeeds = feeds.filter((feedData) => {
            if (knownFeeds.has(feedData.feed)) {
                return false;
            }
            else {
                knownFeeds.add(feedData.feed);
                return true;
            }
        });
        const requests = filteredFeeds.map(({ feed, params = {} }) => {
            const paramsArray = Object.keys(params);
            const processedParams = paramsArray.reduce((result, key) => {
                result[`params[${key}]`] = params[key];
                return result;
            }, {});
            const query = (0, querystring_1.stringify)({
                feed,
                dateFrom,
                dateTo,
                ...processedParams,
                matchType,
            });
            return (0, axios_1.default)({
                method: 'get',
                url: `${usEndpoint}/v1/comments?${query}`,
                headers,
                timeout: TEN_SECONDS,
            }).then((response) => {
                return comments.push(...response.data);
            }, (error) => {
                logs.push({ feed, error: error.message });
                ctx.logError('FETCH_COMMENTS_UNITED_STORAGE_ERROR', error);
            });
        });
        await Promise.all(requests);
        return {
            comments: comments.sort((a, b) => (0, moment_1.default)(b.date).valueOf() - (0, moment_1.default)(a.date).valueOf()),
            logs,
        };
    }
    static prepareComments({ chartName, config = {}, data, params }, headers, ctx) {
        var _a;
        // Possible data structure:
        // * [{...},...]
        // * {graphs: [{...},...]}
        // * {graphs: [{...},...], categories_ms: [...]}
        const series = Array.isArray(data) ? data : data.graphs;
        if (!Array.isArray(series)) {
            return undefined;
        }
        const seriesIds = series.map((graph) => graph.id || graph.fname || graph.title || graph.name || '');
        let dateFromMs;
        let dateToMs;
        if (!Array.isArray(data) && ((_a = data.categories_ms) === null || _a === void 0 ? void 0 : _a.length)) {
            dateFromMs = data.categories_ms[0];
            dateToMs = data.categories_ms[data.categories_ms.length - 1];
        }
        else {
            series.forEach(({ data }) => {
                if (Array.isArray(data)) {
                    data.forEach((value) => {
                        let x;
                        if (Array.isArray(value)) {
                            x = value[0];
                        }
                        else if (value !== null && typeof value === 'object') {
                            x = value.x;
                        }
                        if (typeof x === 'number') {
                            dateFromMs = dateFromMs === undefined ? x : Math.min(dateFromMs, x);
                            dateToMs = dateToMs === undefined ? x : Math.max(dateToMs, x);
                        }
                    });
                }
            });
        }
        if (!dateFromMs || !dateToMs) {
            return undefined;
        }
        const fetchCommentsArgs = getFetchCommentsArgs({
            config,
            chartName,
            params,
            seriesIds,
            dateFromMs,
            dateToMs,
        });
        return CommentsFetcher.fetch({
            ...fetchCommentsArgs,
        }, headers, ctx);
    }
    static prepareGravityChartsComments({ chartName, config = {}, data, params, }, headers, ctx) {
        var _a, _b;
        const series = (_b = (_a = data.series) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : [];
        const seriesIds = series.map((s) => (0, get_1.default)(s, 'name', ''));
        let dateFromMs;
        let dateToMs;
        series.forEach((s) => {
            s.data.forEach((value) => {
                const field = s.type === 'bar-y' ? 'y' : 'x';
                const val = (0, get_1.default)(value, field);
                if (typeof val === 'number') {
                    dateFromMs = dateFromMs === undefined ? val : Math.min(dateFromMs, val);
                    dateToMs = dateToMs === undefined ? val : Math.max(dateToMs, val);
                }
            });
        });
        if (!dateFromMs || !dateToMs) {
            return undefined;
        }
        const fetchCommentsArgs = getFetchCommentsArgs({
            config,
            chartName,
            params,
            seriesIds,
            dateFromMs,
            dateToMs,
        });
        return CommentsFetcher.fetch({
            ...fetchCommentsArgs,
        }, headers, ctx);
    }
}
exports.CommentsFetcher = CommentsFetcher;
function getFetchCommentsArgs({ config, chartName, params, seriesIds, dateFromMs, dateToMs, }) {
    const { path, matchedParams = [], matchType, feeds = [] } = config;
    return {
        feeds: [{ feed: chartName, matchedParams }].concat(feeds).map(({ feed, matchedParams = [] }) => matchedParams.reduce((result, name) => {
            result.params[name] = params[name];
            return result;
        }, { feed, params: {} })),
        statFeed: path ? { path, field_name: ['none'].concat(seriesIds).join(',') } : null,
        meta: {
            matchType,
            dateFrom: moment_1.default.utc(dateFromMs).format(),
            dateTo: moment_1.default.utc(dateToMs).format(),
        },
    };
}
