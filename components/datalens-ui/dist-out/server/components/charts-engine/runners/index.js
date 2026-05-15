"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultRunners = getDefaultRunners;
const shared_1 = require("../../../../shared");
const control_1 = require("./control");
const wizard_1 = require("./wizard");
function getDefaultRunners() {
    const runners = [
        {
            name: 'wizard',
            trigger: new Set([
                'graph_wizard_node',
                'table_wizard_node',
                'ymap_wizard_node',
                'metric_wizard_node',
                'markup_wizard_node',
                'timeseries_wizard_node',
                'd3_wizard_node',
            ]),
            safeConfig: true,
            handler: wizard_1.runWizardChart,
        },
        {
            // for all types of controls except editor control
            name: 'dashControls',
            trigger: new Set([shared_1.ControlType.Dash]),
            safeConfig: true,
            handler: control_1.runControl,
        },
    ];
    return runners;
}
