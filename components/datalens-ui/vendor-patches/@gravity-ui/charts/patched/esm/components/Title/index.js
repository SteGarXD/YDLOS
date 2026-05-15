import React from 'react';
export const Title = (props) => {
    const { chartWidth, chartOffsetLeft, titleOffsetTop, text, height, style } = props;
    return (React.createElement("text", { dx: (chartOffsetLeft || 0) + chartWidth / 2, dy: height / 2 + (titleOffsetTop || 0), dominantBaseline: "middle", textAnchor: "middle", style: {
            fill: style === null || style === void 0 ? void 0 : style.fontColor,
            fontSize: style === null || style === void 0 ? void 0 : style.fontSize,
            fontWeight: style === null || style === void 0 ? void 0 : style.fontWeight,
            lineHeight: `${height}px`,
        } },
        React.createElement("tspan", { dangerouslySetInnerHTML: { __html: text } })));
};
