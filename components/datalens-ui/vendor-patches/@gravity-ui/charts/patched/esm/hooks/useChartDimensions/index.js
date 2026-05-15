import React from 'react';
import { isAxisRelatedSeries } from '../../utils';
import { getBoundsWidth } from './utils';
export { getBoundsWidth } from './utils';
const getBottomOffset = (args) => {
    const { hasAxisRelatedSeries, preparedLegend, preparedXAxis } = args;
    let result = 0;
    // Right-panel legend does not consume vertical space at the bottom
    if ((preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.enabled) && preparedLegend.position !== 'right') {
        result += preparedLegend.height + preparedLegend.margin;
    }
    if (!(preparedXAxis === null || preparedXAxis === void 0 ? void 0 : preparedXAxis.visible)) {
        return result;
    }
    if (hasAxisRelatedSeries) {
        if (preparedXAxis.title.text) {
            result += preparedXAxis.title.height + preparedXAxis.title.margin;
        }
        if (preparedXAxis.labels.enabled) {
            result += preparedXAxis.labels.margin + preparedXAxis.labels.height;
        }
    }
    return result;
};
export const useChartDimensions = (args) => {
    const { margin, width, height, preparedLegend, preparedXAxis, preparedYAxis, preparedSeries } = args;
    return React.useMemo(() => {
        const hasAxisRelatedSeries = preparedSeries.some(isAxisRelatedSeries);
        // When legend is a right panel, subtract its width + margin from the plot area
        const legendPanelReserve =
            (preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.enabled) &&
            preparedLegend.position === 'right'
                ? preparedLegend.panelWidth + preparedLegend.margin
                : 0;
        const boundsWidth = getBoundsWidth({ chartWidth: width, chartMargin: margin, preparedYAxis }) - legendPanelReserve;
        const bottomOffset = getBottomOffset({
            hasAxisRelatedSeries,
            preparedLegend,
            preparedXAxis,
        });
        const boundsHeight = Math.round(height - margin.top - margin.bottom - bottomOffset);
        return { boundsWidth: Math.round(boundsWidth), boundsHeight };
    }, [margin, width, height, preparedLegend, preparedXAxis, preparedYAxis, preparedSeries]);
};
