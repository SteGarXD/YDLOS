/* eslint-disable import/order -- load-env must execute before other imports */
import './load-env';

import * as path from 'path';

import {NodeKit} from '@gravity-ui/nodekit';

import {AppEnvironment} from '../shared/constants/common';
import {getAppEndpointsConfig} from '../shared/endpoints';
import {authSchema, schema} from '../shared/schema';

import {getFeaturesConfig} from './components/features';
import {registry} from './registry';
import {getGatewayConfig} from './utils/gateway';

const nodekit = new NodeKit({
    configsPath: path.resolve(__dirname, 'configs'),
});

const {appName, appEnv, appInstallation, appDevMode} = nodekit.config;
nodekit.ctx.log('AppConfig details', {
    appName,
    appEnv,
    appInstallation,
    appDevMode,
});

nodekit.config.features = getFeaturesConfig(appEnv);

// YDL OS: dev-мерж opensource-конфига и endpoints до setupGateway, чтобы gateway видел endpoints (избегаем "Endpoint has been not found in service us")
if (process.env.APP_ENV === 'development') {
    if (!nodekit.config.getSourcesByEnv) {
        const configOpensourceCommon = require('./configs/opensource/common').default;
        Object.assign(nodekit.config, configOpensourceCommon);
    }
    nodekit.config.releaseVersion =
        process.env.RELEASE_VERSION || nodekit.config.releaseVersion || '2.7.0-night';
}
const endpointsEnv: AppEnvironment.Production | AppEnvironment.Development =
    appEnv === AppEnvironment.Prod || appEnv === 'prod'
        ? AppEnvironment.Production
        : (appEnv as AppEnvironment.Production | AppEnvironment.Development);
nodekit.config.endpoints = getAppEndpointsConfig(endpointsEnv);

registry.setupGateway(getGatewayConfig(nodekit), {
    root: schema,
    auth: authSchema,
});

export {nodekit};
