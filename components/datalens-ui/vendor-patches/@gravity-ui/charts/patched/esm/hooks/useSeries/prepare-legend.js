import { select } from 'd3';
import clone from 'lodash/clone';
import get from 'lodash/get';
import merge from 'lodash/merge';
import { CONTINUOUS_LEGEND_SIZE, legendDefaults } from '../../constants';
import { getDefaultColorStops, getDomainForContinuousColorScale, getLabelsSize } from '../../utils';
export async function getPreparedLegend(args) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { legend, series } = args;
    const enabled = Boolean(typeof (legend === null || legend === void 0 ? void 0 : legend.enabled) === 'boolean' ? legend === null || legend === void 0 ? void 0 : legend.enabled : series.length > 1);
    const defaultItemStyle = clone(legendDefaults.itemStyle);
    const itemStyle = get(legend, 'itemStyle');
    const computedItemStyle = merge(defaultItemStyle, itemStyle);
    const lineHeight = (await getLabelsSize({ labels: ['Tmp'], style: computedItemStyle })).maxHeight;
    const legendType = get(legend, 'type', 'discrete');
    const isTitleEnabled = Boolean((_a = legend === null || legend === void 0 ? void 0 : legend.title) === null || _a === void 0 ? void 0 : _a.text);
    const titleMargin = isTitleEnabled ? get(legend, 'title.margin', 4) : 0;
    const titleStyle = Object.assign({ fontSize: '12px', fontWeight: 'bold' }, get(legend, 'title.style'));
    const titleText = isTitleEnabled ? get(legend, 'title.text', '') : '';
    const titleSize = await getLabelsSize({ labels: [titleText], style: titleStyle });
    const titleHeight = isTitleEnabled ? titleSize.maxHeight : 0;
    const tickStyle = {
        fontSize: '12px',
    };
    const ticks = {
        labelsMargin: 4,
        labelsLineHeight: (await getLabelsSize({ labels: ['Tmp'], style: tickStyle })).maxHeight,
        style: tickStyle,
    };
    const colorScale = {
        colors: [],
        domain: [],
        stops: [],
    };
    let height = 0;
    if (enabled) {
        height += titleHeight + titleMargin;
        if (legendType === 'continuous') {
            height += CONTINUOUS_LEGEND_SIZE.height;
            height += ticks.labelsLineHeight + ticks.labelsMargin;
            colorScale.colors = (_c = (_b = legend === null || legend === void 0 ? void 0 : legend.colorScale) === null || _b === void 0 ? void 0 : _b.colors) !== null && _c !== void 0 ? _c : [];
            colorScale.stops =
                (_e = (_d = legend === null || legend === void 0 ? void 0 : legend.colorScale) === null || _d === void 0 ? void 0 : _d.stops) !== null && _e !== void 0 ? _e : getDefaultColorStops(colorScale.colors.length);
            colorScale.domain =
                (_g = (_f = legend === null || legend === void 0 ? void 0 : legend.colorScale) === null || _f === void 0 ? void 0 : _f.domain) !== null && _g !== void 0 ? _g : getDomainForContinuousColorScale({ series });
        }
        else {
            height += lineHeight;
        }
    }
    const legendWidth = get(legend, 'width', CONTINUOUS_LEGEND_SIZE.width);
    const legendPosition = get(legend, 'position', 'bottom');
    const legendPanelWidth = legendPosition === 'right' ? get(legend, 'width', 160) : legendWidth;
    return {
        align: legendPosition === 'right' ? 'left' : get(legend, 'align', legendDefaults.align),
        justifyContent: legendPosition === 'right' ? 'start' : get(legend, 'justifyContent', legendDefaults.justifyContent),
        enabled,
        height,
        itemDistance: get(legend, 'itemDistance', legendDefaults.itemDistance),
        itemStyle: computedItemStyle,
        lineHeight,
        margin: get(legend, 'margin', legendDefaults.margin),
        type: legendType,
        position: legendPosition,
        panelWidth: legendPanelWidth,
        title: {
            enable: isTitleEnabled,
            text: titleText,
            margin: titleMargin,
            style: titleStyle,
            height: titleHeight,
            align: get(legend, 'title.align', 'left'),
        },
        width: legendWidth,
        ticks,
        colorScale,
        html: get(legend, 'html', false),
    };
}
function getFlattenLegendItems(series, preparedLegend) {
    return series.reduce((acc, s) => {
        const legendEnabled = get(s, 'legend.enabled', true);
        if (legendEnabled) {
            acc.push(Object.assign(Object.assign({}, s), { height: preparedLegend.lineHeight, symbol: s.legend.symbol }));
        }
        return acc;
    }, []);
}
function getGroupedLegendItems(args) {
    const { maxLegendWidth, items, preparedLegend } = args;
    const result = [[]];
    const bodySelection = select(document.body);
    let textWidthsInLine = [0];
    let lineIndex = 0;
    items.forEach((item) => {
        const itemSelection = preparedLegend.html
            ? bodySelection
                .append('div')
                .html(item.name)
                .style('position', 'absolute')
                .style('display', 'inline-block')
                .style('white-space', 'nowrap')
            : bodySelection.append('text').text(item.name).style('white-space', 'nowrap');
        itemSelection
            .style('font-size', preparedLegend.itemStyle.fontSize)
            .each(function () {
            const resultItem = clone(item);
            const { height, width: textWidth } = this.getBoundingClientRect();
            resultItem.height = height;
            if (textWidth >
                maxLegendWidth - resultItem.symbol.width - resultItem.symbol.padding) {
                resultItem.overflowed = true;
                resultItem.textWidth =
                    maxLegendWidth - resultItem.symbol.width - resultItem.symbol.padding;
            }
            else {
                resultItem.textWidth = textWidth;
            }
            textWidthsInLine.push(textWidth);
            const textsWidth = textWidthsInLine.reduce((acc, width) => acc + width, 0);
            if (!result[lineIndex]) {
                result[lineIndex] = [];
            }
            result[lineIndex].push(resultItem);
            const symbolsWidth = result[lineIndex].reduce((acc, { symbol }) => {
                return acc + symbol.width + symbol.padding;
            }, 0);
            const distancesWidth = (result[lineIndex].length - 1) * preparedLegend.itemDistance;
            const isOverflowedAsOnlyItemInLine = resultItem.overflowed && result[lineIndex].length === 1;
            const isCurrentLineOverMaxWidth = maxLegendWidth < textsWidth + symbolsWidth + distancesWidth;
            if (isOverflowedAsOnlyItemInLine) {
                lineIndex += 1;
                textWidthsInLine = [];
            }
            else if (isCurrentLineOverMaxWidth) {
                result[lineIndex].pop();
                lineIndex += 1;
                textWidthsInLine = [textWidth];
                const nextLineIndex = lineIndex;
                result[nextLineIndex] = [];
                result[nextLineIndex].push(resultItem);
            }
        })
            .remove();
    });
    return result;
}
function getPagination(args) {
    const { items, maxLegendHeight, paginatorHeight } = args;
    const pages = [];
    let currentPageIndex = 0;
    let currentHeight = 0;
    items.forEach((item, i) => {
        if (!pages[currentPageIndex]) {
            pages[currentPageIndex] = { start: i, end: i };
        }
        const legendLineHeight = Math.max(...item.map(({ height }) => height));
        currentHeight += legendLineHeight;
        if (currentHeight > maxLegendHeight - paginatorHeight) {
            pages[currentPageIndex].end = i;
            currentPageIndex += 1;
            currentHeight = legendLineHeight;
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#end
            pages[currentPageIndex] = { start: i, end: i + (i === items.length - 1 ? 1 : 0) };
        }
        else if (i === items.length - 1) {
            pages[currentPageIndex].end = i + 1;
        }
    });
    return { pages };
}
function getVerticalLegendItems(items, preparedLegend, panelWidth) {
    const result = [];
    const bodySelection = select(document.body);
    items.forEach((item) => {
        const itemSelection = preparedLegend.html
            ? bodySelection
                .append('div')
                .html(item.name)
                .style('position', 'absolute')
                .style('display', 'inline-block')
                .style('white-space', 'nowrap')
            : bodySelection.append('text').text(item.name).style('white-space', 'nowrap');
        itemSelection.style('font-size', preparedLegend.itemStyle.fontSize).each(function () {
            const resultItem = clone(item);
            const { height, width: textWidth } = this.getBoundingClientRect();
            resultItem.height = height || preparedLegend.lineHeight;
            const maxTextWidth = panelWidth - resultItem.symbol.width - resultItem.symbol.padding - 4;
            if (textWidth > maxTextWidth) {
                resultItem.overflowed = true;
                resultItem.textWidth = maxTextWidth;
            } else {
                resultItem.textWidth = textWidth;
            }
            result.push([resultItem]);
        }).remove();
    });
    return result;
}
export function getLegendComponents(args) {
    const { chartWidth, chartHeight, chartMargin, series, preparedLegend } = args;

    if (preparedLegend.position === 'right' && preparedLegend.enabled) {
        const panelWidth = preparedLegend.panelWidth;
        const flattenItems = getFlattenLegendItems(series, preparedLegend);
        const items = getVerticalLegendItems(flattenItems, preparedLegend, panelWidth);
        const maxLegendHeight = chartHeight - chartMargin.top - chartMargin.bottom;
        let pagination;
        if (preparedLegend.type === 'discrete') {
            const totalHeight = items.reduce((acc, row) => {
                return acc + (row.length ? Math.max(...row.map(({ height }) => height)) : 0);
            }, 0);
            preparedLegend.height = Math.min(totalHeight, maxLegendHeight);
            if (totalHeight > maxLegendHeight) {
                pagination = getPagination({
                    items,
                    maxLegendHeight: maxLegendHeight - preparedLegend.lineHeight,
                    paginatorHeight: preparedLegend.lineHeight,
                });
            }
        }
        const offset = {
            left: chartWidth - chartMargin.right - panelWidth + 52,
            top: chartMargin.top,
        };
        return {
            legendConfig: { offset, pagination, maxWidth: panelWidth, position: 'right' },
            legendItems: items,
        };
    }

    const maxLegendWidth = chartWidth - chartMargin.right - chartMargin.left;
    const maxLegendHeight = (chartHeight - chartMargin.top - chartMargin.bottom - preparedLegend.margin) / 2;
    const flattenLegendItems = getFlattenLegendItems(series, preparedLegend);
    const items = getGroupedLegendItems({
        maxLegendWidth,
        items: flattenLegendItems,
        preparedLegend,
    });
    let pagination;
    if (preparedLegend.type === 'discrete') {
        const lineHeights = items.reduce((acc, item) => {
            if (item.length) {
                acc.push(Math.max(...item.map(({ height }) => height)));
            }
            return acc;
        }, []);
        let legendHeight = lineHeights.reduce((acc, height) => acc + height, 0);
        if (maxLegendHeight < legendHeight) {
            const lines = Math.floor(maxLegendHeight / preparedLegend.lineHeight);
            legendHeight = preparedLegend.lineHeight * lines;
            pagination = getPagination({
                items,
                maxLegendHeight: legendHeight,
                paginatorHeight: preparedLegend.lineHeight,
            });
        }
        preparedLegend.height = legendHeight;
    }
    const top = chartHeight - chartMargin.bottom - preparedLegend.height;
    const offset = {
        left: chartMargin.left,
        top,
    };
    return { legendConfig: { offset, pagination, maxWidth: maxLegendWidth }, legendItems: items };
}
