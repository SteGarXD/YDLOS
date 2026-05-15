"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatform = getPlatform;
exports.getChartkitLayoutSettings = getChartkitLayoutSettings;
const ismobilejs_1 = __importDefault(require("ismobilejs"));
const shared_1 = require("../../../shared");
function getPlatform(userAgent) {
    const ua = (0, ismobilejs_1.default)(userAgent);
    if (ua.phone) {
        return shared_1.DeviceType.Phone;
    }
    else if (ua.tablet) {
        return shared_1.DeviceType.Tablet;
    }
    return shared_1.DeviceType.Desktop;
}
function getChartkitLayoutSettings(chartkitSettings = {}) {
    var _a;
    const chartkitScripts = [];
    const chartkitInlineScripts = [];
    if (!((_a = chartkitSettings.highcharts) === null || _a === void 0 ? void 0 : _a.enabled)) {
        chartkitInlineScripts.push(`window.Highcharts = {enabled: false};`);
    }
    else if (chartkitSettings.highcharts.external) {
        const { protocol = 'https', domain = 'code.highcharts.com', version, modules = [], } = chartkitSettings.highcharts;
        const items = [
            'highcharts',
            'highcharts-more',
            ...modules.map((item) => `modules/${item}`),
        ];
        chartkitScripts.push(...items.map((item) => ({
            src: `${protocol}://${domain}${version ? `/${version}` : ''}/${item}.js`,
            defer: true,
        })));
    }
    return {
        scripts: chartkitScripts,
        inlineScripts: chartkitInlineScripts,
    };
}
