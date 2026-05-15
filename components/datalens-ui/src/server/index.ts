/** Первым: см. `load-env.ts` — несколько путей к `.env`, не только cwd. */
/* eslint-disable import/order -- load-env must run first; shared init order is intentional */
import './load-env';

import cluster from 'cluster';

// Without this import shared object is empty in runtime and it should be exactly here
import '../shared';
import {AppEnvironment} from '../shared/constants/common';
import {getAppEndpointsConfig} from '../shared/endpoints';

import {appEnv} from './app-env';
import {appAuth} from './components/auth/middlewares/auth';
import {getOpensourceLayoutConfig} from './components/layout/opensource-layout-config';
import {serverFeatureWithBoundedContext} from './middlewares';
import authZitadel from './middlewares/auth-zitadel';
import {getConnectorToQlConnectionTypeMap} from './modes/charts/plugins/ql/utils/connection';
import initOpensourceApp from './modes/opensource/app';
import {nodekit} from './nodekit';
import {registry} from './registry';
import {registerAppPlugins} from './registry/utils/register-app-plugins';

// endpoints только development | production; prod → production (как у akrasnov87)
const endpointsEnv: AppEnvironment.Production | AppEnvironment.Development =
    appEnv === AppEnvironment.Prod || appEnv === 'prod'
        ? AppEnvironment.Production
        : (appEnv as AppEnvironment.Production | AppEnvironment.Development);

// YDL OS: в dev при отсутствии APP_INSTALLATION NodeKit не грузит opensource/common →
// нет getSourcesByEnv и chartsEngineConfig, падает initChartsEngine. Подмешиваем opensource-конфиг.
// Для полного совпадения с prod задайте в env: APP_INSTALLATION=opensource, RELEASE_VERSION=2.7.0-night
if (process.env.APP_ENV === 'development') {
    if (!nodekit.config.getSourcesByEnv) {
        const configOpensourceCommon = require('./configs/opensource/common').default;
        Object.assign(nodekit.config, configOpensourceCommon);
    }
    nodekit.config.releaseVersion =
        process.env.RELEASE_VERSION || nodekit.config.releaseVersion || '2.7.0-night';
}

registry.registerGetLayoutConfig(getOpensourceLayoutConfig);
registry.setupQLConnectionTypeMap(getConnectorToQlConnectionTypeMap());

registerAppPlugins();

nodekit.config.endpoints = getAppEndpointsConfig(endpointsEnv);

if (nodekit.config.isZitadelEnabled) {
    nodekit.config.appAuthHandler = authZitadel;
}

if (nodekit.config.isAuthEnabled) {
    nodekit.config.appAuthHandler = appAuth;
}

nodekit.config.appAllowedLangs = nodekit.config.regionalEnvConfig?.allowLanguages;
nodekit.config.appDefaultLang = nodekit.config.regionalEnvConfig?.defaultLang;

nodekit.config.appBeforeAuthMiddleware = [serverFeatureWithBoundedContext];

const app = initOpensourceApp(nodekit);
registry.setupApp(app);

if (nodekit.config.workers && nodekit.config.workers > 1 && cluster.isPrimary) {
    for (let i = 0; i < nodekit.config.workers; i++) {
        cluster.fork();
    }
} else {
    app.run();
}
