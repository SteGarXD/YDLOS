"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareMetricObject = void 0;
const prepareMetricObject = ({ size, title, color, value, }) => {
    return {
        value: {
            type: 'concat',
            className: `markup-metric markup-metric_size_${size}`,
            children: [
                {
                    className: 'markup-metric-title',
                    type: 'text',
                    content: title,
                },
                {
                    type: 'color',
                    color,
                    content: {
                        className: 'markup-metric-value',
                        type: 'text',
                        content: value,
                    },
                },
            ],
        },
    };
};
exports.prepareMetricObject = prepareMetricObject;
