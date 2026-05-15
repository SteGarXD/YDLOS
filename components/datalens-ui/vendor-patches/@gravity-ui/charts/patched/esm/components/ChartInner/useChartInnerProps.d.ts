import React from 'react';
import type { Dispatch } from 'd3';
import type { ZoomState } from '../../hooks/useZoom/types';
import type { ChartInnerProps } from './types';
type Props = ChartInnerProps & {
    clipPathId: string;
    dispatcher: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    plotNode: SVGGElement | null;
    svgContainer: SVGGElement | null;
    updateZoomState: (nextZoomState: Partial<ZoomState>) => void;
    zoomState: Partial<ZoomState>;
};
export declare function useChartInnerProps(props: Props): {
    svgXPos: number | undefined;
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    boundsWidth: number;
    handleLegendItemClick: import("../../hooks").OnLegendItemClick;
    isOutsideBounds: (x: number, y: number) => boolean;
    legendConfig: {
        offset: {
            left: number;
            top: number;
        };
        pagination: {
            pages: {
                start: number;
                end: number;
            }[];
        } | undefined;
        maxWidth: number;
    } | undefined;
    legendItems: never[] | import("../../hooks").LegendItem[][];
    preparedLegend: import("../../hooks").PreparedLegend | null;
    preparedSeries: import("../../hooks").PreparedSeries[];
    preparedSplit: import("../../hooks").PreparedSplit;
    preparedZoom: Required<{
        type?: import("../../constants").ZoomType | undefined;
        brush?: Required<{
            style?: Required<{
                fillOpacity?: number | undefined;
            } | undefined>;
        } | undefined>;
        resetButton?: Required<{
            align?: ("bottom-left" | "bottom-right" | "top-left" | "top-right") | undefined;
            offset?: Required<{
                x?: number | undefined;
                y?: number | undefined;
            } | undefined>;
            relativeTo?: ("chart-box" | "plot-box") | undefined;
        } | undefined>;
    }> | null;
    prevHeight: number | undefined;
    prevWidth: number | undefined;
    shapes: React.ReactElement<any, string | React.JSXElementConstructor<any>>[];
    shapesData: import("../../hooks").ShapeData[];
    title: (import("../..").ChartTitle & {
        height: number;
    }) | undefined;
    xAxis: import("../../hooks").PreparedAxis | null;
    xScale: import("../../hooks").ChartScale | undefined;
    yAxis: import("../../hooks").PreparedAxis[];
    yScale: (import("../../hooks").ChartScale | undefined)[] | undefined;
};
export {};
