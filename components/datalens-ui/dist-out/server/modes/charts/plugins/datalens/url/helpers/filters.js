"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMergedChartAndParamsFilters = void 0;
const getMergedChartAndParamsFilters = (args) => {
    const { chartFilters, paramsFilters } = args;
    const paramsFiltersMap = paramsFilters.reduce((acc, paramFilter) => {
        acc[paramFilter.column] = true;
        return acc;
    }, {});
    const filteredChartFilters = chartFilters.filter((chartFilter) => {
        return !paramsFiltersMap[chartFilter.column];
    });
    return [...filteredChartFilters, ...paramsFilters];
};
exports.getMergedChartAndParamsFilters = getMergedChartAndParamsFilters;
