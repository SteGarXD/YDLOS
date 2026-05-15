"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QlConfigVersions = void 0;
var QlConfigVersions;
(function (QlConfigVersions) {
    QlConfigVersions["V1"] = "1";
    // add required queryName field to queries
    QlConfigVersions["V2"] = "2";
    // shapes, colors, tooltips and labels are required
    QlConfigVersions["V3"] = "3";
    // A new 'dimensions' section has been added to the pie chart, the old section 'dimensions' has been moved to 'colors'.
    QlConfigVersions["V4"] = "4";
    // Rename 'default-palette' to classic20
    QlConfigVersions["V5"] = "5";
    // rename the palette id (remove the word "palette" from the value)
    QlConfigVersions["V6"] = "6";
})(QlConfigVersions || (exports.QlConfigVersions = QlConfigVersions = {}));
