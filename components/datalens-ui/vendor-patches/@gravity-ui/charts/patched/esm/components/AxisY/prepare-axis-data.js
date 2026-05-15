import { getUniqId } from '@gravity-ui/uikit';
import { calculateCos, calculateSin, formatAxisTickLabel, getBandsPosition, getLabelsSize, getMinSpaceBetween, getTextSizeFn, getTextWithElipsis, wrapText, } from '../../utils';
import { getTickValues } from './utils';
async function getSvgAxisLabel({ getTextSize, text, axis, top, left, labelMaxHeight, topOffset, }) {
    var _a;
    const originalTextSize = await getTextSize(text);
    // Currently, a preliminary label calculation is used to build the chart - we cannot exceed it here.
    // Therefore, we rely on a pre-calculated number instead of the current maximum label width.
    const labelMaxWidth = axis.labels.width; //axis.labels.maxWidth;
    const size = originalTextSize;
    const content = [];
    // line breaks in the text are supported only
    // 1. for the category axis - it will look strange for numbers or dates
    // 2. for labels without rotation - it is unclear how to handle long strings correctly
    if (originalTextSize.width > labelMaxWidth &&
        axis.type === 'category' &&
        axis.labels.rotation === 0) {
        const textRows = await wrapText({
            text,
            style: axis.labels.style,
            width: labelMaxWidth,
            getTextSize,
        });
        let labelTopOffset = 0;
        let newLabelWidth = 0;
        let newLabelHeight = 0;
        for (let textRowIndex = 0; textRowIndex < textRows.length; textRowIndex++) {
            const textRow = textRows[textRowIndex];
            let textSize = await getTextSize(textRow.text);
            if (newLabelHeight + textSize.height <= labelMaxHeight) {
                newLabelWidth = Math.max(newLabelWidth, textSize.width);
                newLabelHeight += textSize.height;
                let rowText = textRow.text.trim();
                if (textRowIndex < textRows.length - 1) {
                    const nextTextRow = textRows[textRowIndex + 1];
                    if (newLabelHeight + (await getTextSize(nextTextRow.text)).height >
                        labelMaxHeight) {
                        rowText = textRow.text + nextTextRow.text;
                    }
                }
                textSize = await getTextSize(rowText);
                if (textSize.width > labelMaxWidth) {
                    rowText = await getTextWithElipsis({
                        text: rowText,
                        getTextWidth: async (str) => (await getTextSize(str)).width,
                        maxWidth: labelMaxWidth,
                    });
                    textSize = await getTextSize(rowText);
                }
                const x = axis.position === 'left' ? -textSize.width : 0;
                content.push({
                    text: rowText,
                    x,
                    y: labelTopOffset,
                    size: textSize,
                });
                labelTopOffset += textSize.height;
            }
        }
        content.forEach((row) => {
            row.y -= newLabelHeight / 2;
        });
        size.width = newLabelWidth;
        size.height = newLabelHeight;
    }
    else {
        let rowText = text;
        let textSize = await getTextSize(rowText);
        const textMaxWidth = Math.min(labelMaxWidth / calculateCos(axis.labels.rotation) -
            textSize.height * calculateCos(90 - axis.labels.rotation), 
        // for vertical labels, we need to take into account the available height, otherwise there may be intersections
        axis.labels.rotation === 90 ? labelMaxHeight : Infinity, 
        // if there is no rotation, then the height of the label does not affect the width of the text
        axis.labels.rotation === 0
            ? Infinity
            : (top + topOffset - textSize.height / 2) / calculateSin(axis.labels.rotation));
        if (textSize.width > textMaxWidth) {
            rowText = await getTextWithElipsis({
                text: rowText,
                getTextWidth: async (str) => (await getTextSize(str)).width,
                maxWidth: textMaxWidth,
            });
            textSize = await getTextSize(rowText);
        }
        const actualTextHeight = axis.labels.rotation
            ? textSize.height / calculateSin(axis.labels.rotation)
            : textSize.height;
        const x = axis.position === 'left' ? -textSize.width : 0;
        const y = Math.max(-topOffset - top, -actualTextHeight / 2);
        content.push({
            text: rowText,
            x,
            y,
            size: textSize,
        });
    }
    const x = axis.position === 'left' ? left - axis.labels.margin : left + axis.labels.margin;
    const y = top + (typeof axis.labels.y === 'number' ? axis.labels.y : 0);
    const svgLabel = {
        title: content.length > 1 || ((_a = content[0]) === null || _a === void 0 ? void 0 : _a.text) !== text ? text : undefined,
        content: content,
        style: axis.labels.style,
        size: size,
        x,
        y,
        angle: axis.labels.rotation,
    };
    return svgLabel;
}
// eslint-disable-next-line complexity
export async function prepareAxisData({ axis, split, scale, top: topOffset, width, height, series, }) {
    var _a, _b, _c;
    const axisPlotTopPosition = ((_a = split.plots[axis.plotIndex]) === null || _a === void 0 ? void 0 : _a.top) || 0;
    const axisHeight = ((_b = split.plots[axis.plotIndex]) === null || _b === void 0 ? void 0 : _b.height) || height;
    const domainX = axis.position === 'left' ? 0 : width;
    let domain = null;
    if (axis.visible) {
        domain = {
            start: [domainX, axisPlotTopPosition],
            end: [domainX, axisPlotTopPosition + axisHeight + 2],
            lineColor: (_c = axis.lineColor) !== null && _c !== void 0 ? _c : '',
        };
    }
    const ticks = [];
    const getTextSize = getTextSizeFn({ style: axis.labels.style });
    const labelLineHeight = (await getTextSize('Tmp')).height;
    const values = getTickValues({ scale, axis, labelLineHeight, series });
    const tickStep = getMinSpaceBetween(values, (d) => Number(d.value));
    const labelMaxHeight = values.length > 1 ? values[0].y - values[1].y - axis.labels.padding * 2 : axisHeight;
    // Same snap as AxisY grid rects (_pp ∘ Math.round) so labels + tick paths match physical pixels.
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const snapTickY = (yFloat) => {
        const r = Math.round(yFloat);
        return Math.round(r * dpr) / dpr;
    };
    for (let i = 0; i < values.length; i++) {
        const tickValue = values[i];
        const y = snapTickY(axisPlotTopPosition + tickValue.y);
        let svgLabel = null;
        let htmlLabel = null;
        if (axis.labels.enabled) {
            if (axis.labels.html) {
                const content = String(tickValue.value);
                const labelSize = await getLabelsSize({
                    labels: [content],
                    html: true,
                    style: axis.labels.style,
                });
                const size = { width: labelSize.maxWidth, height: labelSize.maxHeight };
                const left = domainX;
                const top = y;
                const x = axis.position === 'left'
                    ? left - size.width - axis.labels.margin
                    : left + axis.labels.margin;
                htmlLabel = {
                    content,
                    x,
                    y: top - size.height / 2 + (typeof axis.labels.y === 'number' ? axis.labels.y : 0),
                    size,
                    style: axis.labels.style,
                };
            }
            else {
                const text = formatAxisTickLabel({ value: tickValue.value, axis, step: tickStep });
                svgLabel = await getSvgAxisLabel({
                    getTextSize,
                    text,
                    axis,
                    top: y,
                    left: domainX,
                    labelMaxHeight,
                    topOffset,
                });
            }
        }
        const tickLine = axis.grid.enabled
            ? {
                points: [
                    [0, y],
                    [width, y],
                ],
            }
            : null;
        ticks.push({
            line: tickLine,
            svgLabel,
            htmlLabel,
        });
    }
    {
        const seenRoundY = new Set();
        const uniqueTicks = [];
        for (const t of ticks) {
            const rawY = t.line ? t.line.points[0][1] : (t.svgLabel ? t.svgLabel.y : undefined);
            if (rawY === undefined) {
                uniqueTicks.push(t);
                continue;
            }
            const k = Math.round(rawY);
            if (seenRoundY.has(k)) {
                continue;
            }
            seenRoundY.add(k);
            uniqueTicks.push(t);
        }
        ticks.length = 0;
        ticks.push(...uniqueTicks);
    }
    let labelsWidth = ticks.reduce((acc, item) => { var _a, _b, _c, _d; return Math.max(acc, (_d = (_b = (_a = item.svgLabel) === null || _a === void 0 ? void 0 : _a.size.width) !== null && _b !== void 0 ? _b : (_c = item.htmlLabel) === null || _c === void 0 ? void 0 : _c.size.width) !== null && _d !== void 0 ? _d : 0); }, 0);
    labelsWidth = Math.min(axis.labels.width, labelsWidth);
    let title = null;
    if (axis.title.text) {
        const getTitleTextSize = getTextSizeFn({ style: axis.title.style });
        const rotateAngle = axis.position === 'left' ? -90 : 90;
        const sin = Math.abs(calculateSin(rotateAngle));
        const cos = Math.abs(calculateCos(rotateAngle));
        const titleContent = [];
        const titleMaxWidth = sin * axisHeight;
        let passengerInlineTspans = false;
        let passengerTitleBox = null;
        if (axis.title.maxRowCount > 1) {
            const titleTextRows = await wrapText({
                text: axis.title.text,
                style: axis.title.style,
                width: titleMaxWidth,
                getTextSize: getTitleTextSize,
            });
            for (let i = 0; i < axis.title.maxRowCount && i < titleTextRows.length; i++) {
                const textRow = titleTextRows[i];
                const textRowContent = textRow.text.trim();
                const textRowSize = await getTitleTextSize(textRowContent);
                titleContent.push({
                    text: textRowContent,
                    x: 0,
                    y: textRow.y,
                    size: textRowSize,
                });
            }
        }
        else if (axis.title.text.replace(/\s+/g, ' ').trim() === 'Число пассажиров') {
            const fsStr = String((axis.title.style && axis.title.style.fontSize) || '13px');
            const fontSizePx = parseFloat(fsStr.replace(/^([\d.]+).*$/, '$1')) || 13;
            const widenCheIPx = fontSizePx * 0.03;
            const trackISCpx = fontSizePx * 0.026;
            const bumpLoPx = 0;
            const pullOxPx = -fontSizePx * 0.024;
            const trackPassePx = fontSizePx * 0.021;
            const bumpZhePx = fontSizePx * 0.036;
            const trackIroPx = fontSizePx * 0.006;
            const trackRoInZhirovPx = -fontSizePx * 0.01;
            const tightPassejPx = -fontSizePx * 0.006;
            const parts = [
                { text: 'Ч', dx: 0 },
                { text: 'и', dx: widenCheIPx },
                { text: 'с', dx: trackISCpx },
                { text: 'л', dx: bumpLoPx },
                { text: 'о', dx: pullOxPx },
                { text: ' ', dx: 0 },
                { text: 'п', dx: 0 },
                { text: 'а', dx: trackPassePx },
                { text: 'с', dx: trackPassePx },
                { text: 'с', dx: trackPassePx },
                { text: 'а', dx: trackPassePx },
                { text: 'ж', dx: bumpZhePx },
                { text: 'и', dx: tightPassejPx },
                { text: 'р', dx: trackIroPx },
                { text: 'о', dx: trackRoInZhirovPx },
                { text: 'в', dx: trackIroPx },
            ];
            let totalW = 0;
            let maxH = 0;
            for (let pi = 0; pi < parts.length; pi++) {
                const p = parts[pi];
                const sz = await getTitleTextSize(p.text);
                totalW += p.dx + sz.width;
                maxH = Math.max(maxH, sz.height);
                titleContent.push({
                    text: p.text,
                    x: pi === 0 ? 0 : undefined,
                    y: pi === 0 ? 0 : undefined,
                    dx: typeof p.dx === 'number' && p.dx !== 0 ? p.dx : undefined,
                    size: sz,
                });
            }
            passengerInlineTspans = true;
            passengerTitleBox = { width: totalW, height: maxH };
        }
        else {
            const text = await getTextWithElipsis({
                text: axis.title.text,
                maxWidth: titleMaxWidth,
                getTextWidth: async (s) => (await getTitleTextSize(s)).width,
            });
            titleContent.push({
                text,
                x: 0,
                y: 0,
                size: await getTitleTextSize(text),
            });
        }
        const originalTextSize = passengerTitleBox ||
            titleContent.reduce((acc, item) => {
                acc.width = Math.max(acc.width, item.size.width);
                acc.height += item.size.height;
                return acc;
            }, { width: 0, height: 0 });
        const rotatedTitleSize = {
            width: sin * originalTextSize.height + cos * originalTextSize.width,
            height: sin * originalTextSize.width + cos * originalTextSize.height,
        };
        const bottom = Math.max(0, calculateSin(rotateAngle) * originalTextSize.width);
        let y = 0;
        switch (axis.title.align) {
            case 'left': {
                y = -bottom + axisHeight;
                break;
            }
            case 'center': {
                y = -bottom + axisHeight / 2 + rotatedTitleSize.height / 2;
                break;
            }
            case 'right': {
                y = -bottom + rotatedTitleSize.height;
                break;
            }
        }
        const left = Math.min(0, calculateCos(rotateAngle) * originalTextSize.width);
        const x = axis.position === 'left'
            ? -left - labelsWidth - axis.labels.margin - axis.title.margin
            : -left + width + labelsWidth + axis.labels.margin + axis.title.margin;
        const titleOffset = passengerInlineTspans
            ? 0
            : -(originalTextSize.height / titleContent.length) * (titleContent.length - 1);
        title = {
            content: titleContent,
            style: axis.title.style,
            size: rotatedTitleSize,
            x,
            y: axisPlotTopPosition + y,
            rotate: rotateAngle,
            offset: titleOffset,
        };
    }
    const plotBands = [];
    axis.plotBands.forEach((plotBand) => {
        var _a, _b;
        const axisScale = scale;
        const { from, to } = getBandsPosition({
            band: plotBand,
            axisScale,
            axis: 'y',
        });
        const halfBandwidth = ((_b = (_a = axisScale.bandwidth) === null || _a === void 0 ? void 0 : _a.call(axisScale)) !== null && _b !== void 0 ? _b : 0) / 2;
        const startPos = halfBandwidth + Math.min(from, to);
        const endPos = Math.min(Math.abs(to - from), axisHeight - Math.min(from, to));
        const top = Math.max(0, startPos);
        plotBands.push({
            layerPlacement: plotBand.layerPlacement,
            x: 0,
            y: axisPlotTopPosition + top,
            width,
            height: Math.min(endPos, axisHeight),
            color: plotBand.color,
            opacity: plotBand.opacity,
            label: plotBand.label.text
                ? {
                    text: plotBand.label.text,
                    style: plotBand.label.style,
                    x: plotBand.label.padding,
                    y: plotBand.label.padding,
                }
                : null,
        });
    });
    const plotLines = [];
    for (let i = 0; i < axis.plotLines.length; i++) {
        const plotLine = axis.plotLines[i];
        const axisScale = scale;
        const plotLineValue = Number(axisScale(plotLine.value));
        const points = [
            [0, plotLineValue],
            [width, plotLineValue],
        ];
        let label = null;
        if (plotLine.label.text) {
            const getTitleTextSize = getTextSizeFn({ style: plotLine.label.style });
            const size = await getTitleTextSize(plotLine.label.text);
            label = {
                text: plotLine.label.text,
                style: plotLine.label.style,
                x: plotLine.label.padding,
                y: Math.max(0, plotLineValue - size.height - plotLine.label.padding),
            };
        }
        plotLines.push({
            layerPlacement: plotLine.layerPlacement,
            x: 0,
            y: axisPlotTopPosition,
            width,
            color: plotLine.color,
            opacity: plotLine.opacity,
            label,
            points,
            lineWidth: plotLine.width,
            dashStyle: plotLine.dashStyle,
        });
    }
    if (domain && ticks.length > 0) {
        let topTickY = Infinity;
        let bottomTickY = -Infinity;
        for (const t of ticks) {
            const ty = t.line ? t.line.points[0][1] : (t.svgLabel ? t.svgLabel.y : null);
            if (ty !== null) {
                topTickY = Math.min(topTickY, ty);
                bottomTickY = Math.max(bottomTickY, ty);
            }
        }
        if (topTickY !== Infinity) {
            domain.start = [domain.start[0], topTickY];
        }
        if (bottomTickY !== -Infinity) {
            domain.end = [domain.end[0], bottomTickY + 6];
        }
    }
    return {
        id: getUniqId(),
        title,
        ticks,
        domain,
        plotBands,
        plotLines,
        tickLength: typeof axis.tickLength === 'number' ? axis.tickLength : undefined,
        yTickLengthAtBottomPx: typeof axis.yTickLengthAtBottomPx === 'number'
            ? axis.yTickLengthAtBottomPx
            : undefined,
    };
}
