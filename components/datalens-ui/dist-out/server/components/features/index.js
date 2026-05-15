"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeaturesConfig = getFeaturesConfig;
const shared_1 = require("../../../shared");
const features_list_1 = __importDefault(require("./features-list"));
const FEATURES = {};
function getFeaturesConfig(appEnvironment) {
    if (!appEnvironment) {
        throw new Error('Environment must be specified');
    }
    features_list_1.default.forEach(({ name, state }) => {
        // @ts-ignore
        registerFeature(name, state[appEnvironment]);
    });
    let featureConfigMissed = false;
    Object.values(shared_1.Feature).forEach((feature) => {
        if (typeof FEATURES[feature] === 'undefined') {
            featureConfigMissed = true;
            console.error(`Missed config for feature: ${feature}`);
        }
    });
    if (featureConfigMissed) {
        console.error('Missed config for some feature, see output above');
    }
    return FEATURES;
}
const registerFeature = (featureName, FeatureStatus) => {
    if (typeof FEATURES[featureName] !== 'undefined') {
        throw new Error(`Feature ${featureName} is already registered!`);
    }
    FEATURES[featureName] = FeatureStatus;
};
