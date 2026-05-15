import { path, select } from 'd3';
import { getAxisItems, getXAxisOffset, getXTickPosition, isBandScale } from '../axis';
import { calculateCos, calculateSin } from '../math';
import { getLabelsSize, setEllipsisForOverflowText } from '../text';
const AXIS_BOTTOM_HTML_LABELS_DATA_ATTR = 'data-axis-bottom-html-labels';
function isAxisBottomTickZero(d) {
    if (d === 0 || d === '0') {
        return true;
    }
    if (typeof d === 'number' && Number.isFinite(d) && !Number.isNaN(d) && Math.abs(d) < 1e-9) {
        return true;
    }
    if (typeof d === 'string') {
        const n = Number(d);
        if (Number.isFinite(n) && Math.abs(n) < 1e-9) {
            return true;
        }
    }
    return false;
}
function addDomain(selection, options) {
    const { size, color } = options;
    const domainPath = selection
        .selectAll('.domain')
        .data([null])
        .enter()
        .insert('path', '.tick')
        .attr('class', 'domain')
        .attr('d', `M0,0H${Math.round(size)}`);
    if (color) {
        domainPath.style('stroke', color);
    }
}
function appendSvgLabels(args) {
    var _a;
    const { leftmostLimit, right, ticksSelection, ticks, transform, translateY, x } = args;
    ticksSelection
        .append('text')
        .html(ticks.labelFormat)
        .style('font-size', ((_a = ticks.labelsStyle) === null || _a === void 0 ? void 0 : _a.fontSize) || '')
        .style('font-weight', (_a === null || _a === void 0 ? void 0 : _a.fontWeight) || '400')
        .attr('fill', 'currentColor')
        .attr('text-anchor', () => {
        if (ticks.rotation) {
            return ticks.rotation > 0 ? 'start' : 'end';
        }
        return 'middle';
    })
        .style('transform', transform)
        .style('dominant-baseline', 'text-after-edge');
    const labels = ticksSelection.selectAll('.tick text');
    // FIXME: handle rotated overlapping labels (with a smarter approach)
    if (ticks.rotation) {
        const maxWidth = ticks.labelsMaxWidth * calculateCos(ticks.rotation) +
            ticks.labelsLineHeight * calculateSin(ticks.rotation);
        labels.each(function () {
            setEllipsisForOverflowText(select(this), maxWidth);
        });
    }
    else {
        let elementX = 0;
        // add an ellipsis to the labels that go beyond the boundaries of the chart
        // and remove overlapping labels
        const sortedLabelNodes = labels
            .nodes()
            .map((element) => {
            const r = element.getBoundingClientRect();
            return {
                left: r.left,
                right: r.right,
                node: element,
            };
        }, {})
            .sort((a, b) => {
            return a.left - b.left;
        });
        const skipOverlapCulling = !ticks.rotation && sortedLabelNodes.length <= 120;
        sortedLabelNodes.forEach(function (item, i, nodes) {
            var _a, _b, _c;
            const { node, left, right: currentElementPositionRigth } = item;
            const currentElement = node;
            if (i === 0) {
                const text = select(currentElement);
                const nextElement = (_a = nodes[i + 1]) === null || _a === void 0 ? void 0 : _a.node;
                const nextElementPosition = nextElement === null || nextElement === void 0 ? void 0 : nextElement.getBoundingClientRect();
                if (left < leftmostLimit) {
                    const rightmostPossiblePoint = (_b = nextElementPosition === null || nextElementPosition === void 0 ? void 0 : nextElementPosition.left) !== null && _b !== void 0 ? _b : right;
                    const remainSpace = rightmostPossiblePoint -
                        currentElementPositionRigth +
                        x -
                        ticks.labelsMargin;
                    text.attr('text-anchor', 'start');
                    setEllipsisForOverflowText(text, remainSpace);
                }
            }
            else {
                if (left < elementX) {
                    if (!skipOverlapCulling) {
                        (_c = currentElement.closest('.tick')) === null || _c === void 0 ? void 0 : _c.remove();
                        return;
                    }
                }
                elementX = currentElementPositionRigth + ticks.labelsPaddings;
            }
        });
    }
    const zvn = ticks.zeroLabelVerticalNudgePx;
    const zhn = ticks.zeroLabelHNudgePx;
    const extraDy = typeof zvn === 'number' && Number.isFinite(zvn) ? zvn : 0;
    const manualDx = typeof zhn === 'number' && Number.isFinite(zhn) ? zhn : 0;
    const extraDx = manualDx;
    if (extraDy !== 0 || extraDx !== 0) {
        ticksSelection.each(function (d) {
            if (!isAxisBottomTickZero(d)) {
                return;
            }
            const text = select(this).select('text');
            if (!text.node()) {
                return;
            }
            // <text> already has style('transform', transform); dy/dx are easy to lose vs CSS transform — append translate(px).
            text.style('transform', `${transform} translate(${extraDx}px, ${extraDy}px)`);
        });
    }
}
function appendHtmlLabels(args) {
    const { htmlSelection, labelsData, right, ticks } = args;
    htmlSelection
        .append('div')
        .attr(AXIS_BOTTOM_HTML_LABELS_DATA_ATTR, 1)
        .style('position', 'absolute');
    labelsData.forEach((label) => {
        var _a;
        htmlSelection
            .selectAll(`[${AXIS_BOTTOM_HTML_LABELS_DATA_ATTR}]`)
            .data([label])
            .append('div')
            .html(function (d) {
            return ticks.labelFormat(d.content);
        })
            .style('font-size', ((_a = ticks.labelsStyle) === null || _a === void 0 ? void 0 : _a.fontSize) || '')
            .style('position', 'absolute')
            .style('white-space', 'nowrap')
            .style('color', 'var(--g-color-text-secondary)')
            .style('overflow', 'hidden')
            .style('text-overflow', 'ellipsis')
            .style('left', function (d) {
            const rect = this.getBoundingClientRect();
            return `${d.left - rect.width / 2}px`;
        })
            .style('top', function (d) {
            return `${d.top}px`;
        });
    });
    const labelNodes = htmlSelection
        .selectAll(`[${AXIS_BOTTOM_HTML_LABELS_DATA_ATTR}] > div`)
        .nodes();
    labelNodes.forEach((node, i, nodes) => {
        var _a;
        if (i === nodes.length - 1) {
            const prevNodeSelection = select(nodes[i - 1]);
            const prevRect = (_a = prevNodeSelection.node()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
            const nodeSelection = select(node);
            const rect = node.getBoundingClientRect();
            if (prevRect && prevRect.right + ticks.labelsPaddings > rect.left) {
                const maxWidth = right - prevRect.right - ticks.labelsPaddings;
                const leftMin = prevRect.right - ticks.labelsPaddings / 2;
                nodeSelection.style('left', `${leftMin}px`);
                nodeSelection.style('max-width', `${maxWidth}px`);
            }
        }
    });
}
export async function axisBottom(args) {
    const { boundsOffsetLeft = 0, boundsOffsetTop = 0, domain, htmlLayout, leftmostLimit = 0, scale, ticks: { count: ticksCount, items: tickItems, labelFormat = (value) => String(value), labelsHeight = 0, labelsHtml, labelsLineHeight, labelsMargin = 0, labelsMaxWidth = Infinity, labelsPaddings = 0, labelsStyle, maxTickCount, rotation = 0, tickColor, zeroLabelVerticalNudgePx: ticksZeroLabelVNudgePx, zeroLabelHNudgePx: ticksZeroLabelHNudgePx, }, } = args;
    const htmlSelection = select(htmlLayout);
    const offset = getXAxisOffset();
    const position = getXTickPosition({ scale, offset });
    const values = getAxisItems({ scale, count: ticksCount, maxCount: maxTickCount });
    const labelHeight = (await getLabelsSize({
        labels: values.map(labelFormat),
        style: labelsStyle,
    })).maxHeight;
    return function (selection) {
        var _a, _b, _c;
        selection.selectAll('.tick, .domain').remove();
        htmlSelection.selectAll(`[${AXIS_BOTTOM_HTML_LABELS_DATA_ATTR}]`).remove();
        const rect = (_a = selection.node()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        const x = (rect === null || rect === void 0 ? void 0 : rect.x) || 0;
        const right = x + domain.size;
        const top = -((_c = (_b = tickItems === null || tickItems === void 0 ? void 0 : tickItems[0]) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : 0);
        const translateY = labelHeight + labelsMargin - top;
        let transform = `translate(0, ${translateY}px)`;
        if (rotation) {
            const labelsOffsetTop = labelHeight * calculateCos(rotation) + labelsMargin - top;
            let labelsOffsetLeft = calculateSin(rotation) * labelHeight;
            if (Math.abs(rotation) % 360 === 90) {
                labelsOffsetLeft += ((rotation > 0 ? -1 : 1) * labelHeight) / 2;
            }
            transform = `translate(${-labelsOffsetLeft}px, ${labelsOffsetTop}px) rotate(${rotation}deg)`;
        }
        const tickPath = path();
        tickItems === null || tickItems === void 0 ? void 0 : tickItems.forEach(([start, end]) => {
            const nearAxis = Math.max(start, end);
            const farAxis = Math.min(start, end);
            const liftedStart = nearAxis === 0 ? -2 : nearAxis;
            tickPath.moveTo(0, liftedStart);
            tickPath.lineTo(0, farAxis);
        });
        const domainBand = isBandScale(scale) ? scale.domain() : [];
        const firstBandDomainVal = domainBand.length ? domainBand[0] : null;
        const lastBandDomainVal = domainBand.length ? domainBand[domainBand.length - 1] : null;
        const bandWidth = isBandScale(scale) ? scale.bandwidth() : 0;
        const bandRange = isBandScale(scale) ? scale.range().map(Number) : [];
        const xPlot0 = bandRange.length ? Math.min(...bandRange) : 0;
        const xPlot1 = bandRange.length ? Math.max(...bandRange) : domain.size;
        const singleBandDomain = Boolean(firstBandDomainVal != null &&
            lastBandDomainVal != null &&
            bandWidth > 0 &&
            String(firstBandDomainVal) === String(lastBandDomainVal));
        const xBandMid = Math.round((xPlot0 + xPlot1) / 2);
        const htmlLabelsData = labelsHtml
            ? values.map((v) => {
                var _a;
                const atBandRightEdge = !singleBandDomain &&
                    lastBandDomainVal != null &&
                    bandWidth > 0 &&
                    String(v) === String(lastBandDomainVal);
                const tickLeft = singleBandDomain
                    ? xBandMid
                    : atBandRightEdge
                        ? xPlot1
                        : position(v) + offset;
                return {
                    content: String(v),
                    left: tickLeft + boundsOffsetLeft,
                    top: Math.abs(((_a = tickItems === null || tickItems === void 0 ? void 0 : tickItems[0]) === null || _a === void 0 ? void 0 : _a[1]) || 0) + labelsMargin + boundsOffsetTop,
                };
            })
            : [];
        const ticks = selection
            .selectAll('.tick')
            .data(values)
            .order()
            .join('g')
            .attr('class', 'tick')
            .attr('transform', function (d) {
            const left = Math.round(position(d) + offset);
            return `translate(${left}, ${Math.round(top)})`;
        });
        ticks
            .append('path')
            .attr('d', tickPath.toString())
            .attr('stroke', tickColor !== null && tickColor !== void 0 ? tickColor : 'currentColor')
            .style('shape-rendering', 'crispEdges')
            .style('stroke-width', '1');
        if (singleBandDomain && firstBandDomainVal != null && bandWidth > 0) {
            ticks
                .filter((d) => String(d) === String(firstBandDomainVal))
                .attr('transform', `translate(${xBandMid}, ${Math.round(top)})`);
        }
        if (lastBandDomainVal != null &&
            bandWidth > 0 &&
            String(lastBandDomainVal) !== String(firstBandDomainVal)) {
            const lastLeft = Math.round(xPlot1);
            ticks
                .filter((d) => String(d) === String(lastBandDomainVal))
                .attr('transform', `translate(${lastLeft}, ${Math.round(top)})`);
        }
        // Remove tick that has the same x coordinate like domain
        selection
            .selectAll('.tick')
            .filter((d) => {
            return position(d) === 0;
        })
            .select('path')
            .remove();
        if (labelsHtml) {
            appendHtmlLabels({
                htmlSelection,
                labelsData: htmlLabelsData,
                right,
                ticks: {
                    labelFormat,
                    labelsHeight,
                    labelsMaxWidth,
                    labelsPaddings,
                    labelsStyle,
                    rotation,
                },
            });
        }
        else {
            appendSvgLabels({
                leftmostLimit,
                right,
                ticksSelection: ticks,
                ticks: {
                    labelFormat,
                    labelsLineHeight,
                    labelsMaxWidth,
                    labelsMargin,
                    labelsPaddings,
                    labelsStyle,
                    rotation,
                    zeroLabelVerticalNudgePx: ticksZeroLabelVNudgePx,
                    zeroLabelHNudgePx: ticksZeroLabelHNudgePx,
                },
                transform,
                translateY,
                x,
            });
        }
        const { size: domainSize, color: domainColor } = domain;
        selection.call(addDomain, { size: domainSize, color: domainColor });
    };
}
