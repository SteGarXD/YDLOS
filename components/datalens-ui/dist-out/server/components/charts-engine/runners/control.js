"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runControl = void 0;
const shared_1 = require("../../../../shared");
const control_builder_1 = require("../components/processor/control-builder");
const common_1 = require("./common");
const runControl = async (cx, props) => {
    var _a;
    const { chartsEngine, req, res, config, configResolving, workbookId, forbiddenFields, secureConfig, } = props;
    const ctx = cx.create('templateControlRunner');
    if (!config ||
        !('data' in config) ||
        !('shared' in config.data) ||
        ((_a = config.meta) === null || _a === void 0 ? void 0 : _a.stype) !== shared_1.ControlType.Dash) {
        const error = new Error('CONTROL_RUNNER_CONFIG_MISSING');
        ctx.logError('CONTROL_RUNNER_CONFIG_MISSING', error);
        ctx.end();
        res.status(400).send({
            error,
        });
        return;
    }
    const generatedConfig = {
        data: {
            js: '',
            documentation_en: '',
            documentation_ru: '',
            ui: '',
            url: '',
            graph: '',
            params: '',
            statface_graph: '',
            shared: config.data.shared,
        },
        meta: {
            stype: shared_1.ControlType.Dash,
        },
        publicAuthor: config.publicAuthor,
    };
    const hrStart = process.hrtime();
    const controlBuilder = await (0, control_builder_1.getControlBuilder)({
        config: generatedConfig,
    });
    return (0, common_1.commonRunner)({
        res,
        req,
        ctx,
        chartsEngine,
        configResolving,
        builder: controlBuilder,
        generatedConfig,
        workbookId,
        runnerType: 'Control',
        hrStart,
        localConfig: config,
        forbiddenFields,
        secureConfig,
    });
};
exports.runControl = runControl;
