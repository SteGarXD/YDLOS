import * as fs from 'fs';
import * as path from 'path';
import webpack from 'webpack';

import type {ServiceConfig} from '@gravity-ui/app-builder';
// eslint-disable-next-line import/no-extraneous-dependencies
import type {FileCacheOptions, MemoryCacheOptions} from 'webpack';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);

// Как в akrasnov87: dev — filesystem, иначе memory (мы используем только production).
const getFileCacheConfig = () => {
    if (process.env.APP_ENV === 'development') {
        return {type: 'filesystem'} as FileCacheOptions;
    }
    return {type: 'memory'} as MemoryCacheOptions;
};

// На Windows сокет dist/run/client.sock часто даёт EACCES — клиентский dev-сервер (Rspack) слушает TCP.
// Браузер открывают на этом порту (прокси на API): 13031 = страница+HMR, 14040 = Express/API в dev.
// «Только API-порт» без клиентского нельзя: иначе некуда отдавать webpack/rspack-бандл в dev.
const devClientPort =
    process.env?.['DEV_CLIENT_PORT'] || (process.platform === 'win32' ? '3031' : undefined);
/** Порт Express в dev. На Windows используем 14040, чтобы совпадать с proxy webpack-dev-server. */
const devServerPortEnv = process.env?.['DEV_SERVER_PORT'];
const serverDevListenPort =
    devServerPortEnv !== undefined && devServerPortEnv !== ''
        ? parseInt(devServerPortEnv, 10)
        : process.platform === 'win32'
          ? 14040
          : 3030;

const vendors = (vendorsList: string[]) => {
    return vendorsList.concat([
        'react-split-pane',
        'react-dnd',
        'react-grid-layout',
        'react-beautiful-dnd',
        '@floating-ui/react',
    ]);
};

const config: ServiceConfig = {
    client: {
        // YDL OS: явный publicPath — иконки (визуализации, коллекции, палитры) и прочие ассеты должны грузиться по /build/...
        publicPath: '/build/',
        bundler: 'rspack',
        alias: {
            i18n: 'src/i18n',
            shared: 'src/shared',
            ui: 'src/ui',
            assets: 'src/ui/assets',
        },
        modules: [
            'node_modules',
            resolveApp('node_modules'),
            resolveApp('src/ui'),
            resolveApp('src/ui/units'),
        ],
        includes: ['src/shared', 'src/i18n', 'node_modules/monaco-editor/esm/vs'],
        excludeFromClean: ['!i18n', '!i18n/**/*'],
        vendors,
        icons: ['src/ui/assets/icons', 'node_modules/@gravity-ui/icons'],
        monaco: {
            languages: ['typescript', 'javascript', 'json', 'sql', 'mysql'],
        },
        polyfill: {
            process: true,
        },
        disableReactRefresh: false,
        contextReplacement: {
            locale: ['ru', 'en'],
        },
        watchOptions: {
            ignored: '**/server',
            aggregateTimeout: 1000,
        },
        cache: getFileCacheConfig(),
        externals: {
            highcharts: 'Highcharts',
        },
        fallback: {
            url: require.resolve('url'),
            'react/jsx-runtime': require.resolve('react/jsx-runtime'),
            path: false,
            fs: false,
            'cose-base': false,
            'layout-base': false,
            'highlight.js': false,
            buffer: false,
        },
        javaScriptLoader: 'swc',
        ...(devClientPort
            ? {
                  /**
                   * @gravity-ui/app-builder по умолчанию: webSocketPath = `/build/sockjs-node`.
                   * @rspack/dev-server (webpack-dev-server@5) и клиент HMR ожидают тот же путь, что слушает сервер;
                   * при рассинхроне React Refresh пишет «Failed to set up the socket connection».
                   * Явно `/ws` — стандарт WDS5, одинаково для devMiddleware и overlay.
                   */
                  devServer: {
                      port: parseInt(devClientPort, 10),
                      webSocketPath: '/ws',
                      // Avoid broken hot-update runtime in long sessions; use full page reload instead.
                      hot: false,
                      liveReload: true,
                  },
              }
            : {}),
        // YDL OS: rspack callback. Правило SVG в начало oneOf — на Windows пути с \ не матчатся дефолтным /icons\/.*\.svg$/, иконки в сайдбаре не отображались. Не трогаем правило SCSS (quietDeps) — его замена вызывала __esModule.
        rspack: (cfg) => {
            const next = {
                ...cfg,
                performance: false,
                cache: false,
                experiments:
                    typeof cfg.experiments === 'object' &&
                    cfg.experiments &&
                    !Array.isArray(cfg.experiments)
                        ? {...cfg.experiments, cache: false}
                        : {cache: false},
            };
            const normalize = (p: string) => p.replace(/\\/g, '/');
            const isIconPath = (pathOrObj: string | {resource?: string}) => {
                const pathVal =
                    typeof pathOrObj === 'string' ? pathOrObj : pathOrObj?.resource ?? '';
                const n = normalize(pathVal);
                return (
                    n.includes('ui/assets/icons') ||
                    n.includes('src/ui/assets/icons') ||
                    n.includes('@gravity-ui/icons')
                );
            };
            const oneOfRule = next.module?.rules?.find((r: {oneOf?: unknown[]}) =>
                Array.isArray(r.oneOf),
            );
            if (oneOfRule?.oneOf) {
                // Найти правило иконок с jsLoader (SVGR): use = [jsLoader, svgr]
                const iconRuleWithJs = (
                    oneOfRule.oneOf as {test?: RegExp; use?: {loader?: string}[]}[]
                ).find(
                    (r) =>
                        r.test instanceof RegExp &&
                        r.test.test('.svg') &&
                        Array.isArray(r.use) &&
                        r.use.some((u) => String(u?.loader).includes('svgr')),
                );
                const existingUse = iconRuleWithJs?.use;
                if (existingUse && existingUse.length >= 2) {
                    const ydlosSvgRule = {
                        test: /\.svg($|\?)/,
                        issuer: /\.[jt]sx?$/,
                        include: isIconPath,
                        use: [...existingUse],
                    };
                    oneOfRule.oneOf.unshift(ydlosSvgRule);
                }
            }

            // Keep Fast Refresh enabled for app code, but shim worker chunks where
            // React Refresh globals are not present (Monaco editor workers).
            const workerRefreshShim = `;(function(){if(typeof self!=="undefined"){self.$RefreshReg$=self.$RefreshReg$||function(){};self.$RefreshSig$=self.$RefreshSig$||function(){return function(type){return type;};};}})();`;
            next.plugins = [
                ...(next.plugins || []),
                new webpack.BannerPlugin({
                    raw: true,
                    entryOnly: false,
                    test: /(?:^|[\\/])(editor|simple|json|ts|css|html)Worker(?:\\.|-|$)|(?:^|[\\/])worker(?:\\.|-|$)/i,
                    banner: workerRefreshShim,
                }),
            ];

            return next;
        },
    },
    server: {
        watch: ['dist/i18n', 'dist/shared'],
        // Задержка перезапуска (мс), чтобы после "File change detected" tsc успел дописать dist/server/index.js — иначе MODULE_NOT_FOUND
        watchThrottle: 2500,
        // Windows: см. serverDevListenPort (по умолчанию 14040). Явно: DEV_SERVER_PORT=14040
        port: serverDevListenPort,
    },
};

export default config;
