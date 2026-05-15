"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentsYAxis = void 0;
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const shared_1 = require("../../../../../../../../../shared");
const ui_sandbox_1 = require("../../../../../../../../../shared/utils/ui-sandbox");
const axis_helpers_1 = require("../../../../utils/axis-helpers");
const axis_1 = require("../../../helpers/axis");
const get_axis_formatting_1 = require("../../../helpers/axis/get-axis-formatting");
const DEFAULT_SPACE_BETWEEN_SEGMENTS = 4;
const getSegmentsYAxis = (args) => {
    const { segment, segmentsMap, placeholders, visualizationId } = args;
    const segments = (0, sortBy_1.default)(Object.values(segmentsMap), (s) => s.index);
    const isHtmlSegment = (0, shared_1.isHtmlField)(segment);
    const segmentsNumber = segments.filter((s) => !s.isOpposite).length;
    const takenSpaceBetweenSegments = DEFAULT_SPACE_BETWEEN_SEGMENTS * (segmentsNumber - 1);
    const freeSpaceForSegments = 100 - takenSpaceBetweenSegments;
    const segmentsSpace = Math.floor(freeSpaceForSegments / segmentsNumber);
    let leftAxisSegment = -1;
    let rightAxisSegment = -1;
    const yAxis = new Array(segments.length);
    const yAxisFormattings = new Array(segments.length);
    segments.forEach((segment) => {
        var _a;
        const isY2Axis = segment.isOpposite;
        const yAxisIndex = segment.index;
        let segmentIndex;
        if (isY2Axis) {
            rightAxisSegment += 1;
            segmentIndex = rightAxisSegment;
        }
        else {
            leftAxisSegment += 1;
            segmentIndex = leftAxisSegment;
        }
        const segmentTitle = isHtmlSegment ? (0, ui_sandbox_1.wrapHtml)(segment.title) : String(segment.title);
        const placeholder = isY2Axis ? placeholders.y2 : placeholders.y;
        const axis = {
            top: `${DEFAULT_SPACE_BETWEEN_SEGMENTS * segmentIndex + segmentsSpace * segmentIndex}%`,
            height: `${segmentsSpace}%`,
            offset: 0,
            lineWidth: 1,
            gridLineWidth: 1,
            opposite: isY2Axis,
            title: isY2Axis
                ? undefined
                : {
                    text: segmentTitle,
                    useHTML: isHtmlSegment,
                    align: 'middle',
                    textAlign: 'center',
                    offset: 120,
                    rotation: 0,
                    style: {
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        width: 120,
                    },
                },
        };
        (0, axis_helpers_1.applyPlaceholderSettingsToAxis)(placeholder, axis, { title: true });
        (0, axis_1.addAxisFormatter)({
            axisConfig: axis,
            placeholder: placeholder,
        });
        yAxis[yAxisIndex] = axis;
        const formatMode = (_a = placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings) === null || _a === void 0 ? void 0 : _a.axisFormatMode;
        if (formatMode && formatMode !== "auto" /* AxisLabelFormatMode.Auto */) {
            yAxisFormattings[yAxisIndex] = (0, get_axis_formatting_1.getAxisChartkitFormatting)(placeholder, visualizationId);
        }
    });
    return { yAxisSettings: yAxis, yAxisFormattings };
};
exports.getSegmentsYAxis = getSegmentsYAxis;
