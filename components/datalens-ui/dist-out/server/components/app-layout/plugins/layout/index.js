"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLayoutPlugin = createLayoutPlugin;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_layout_1 = require("@gravity-ui/app-layout");
const filename = 'assets-manifest.json';
/** Путь к манифесту сборки: без dist (dev/старый запуск), dist/public/build (наш образ), env. */
function resolveManifestPath() {
    var _a;
    const candidates = [];
    if (process.env.DL_APP_MANIFEST_PATH) {
        candidates.push(process.env.DL_APP_MANIFEST_PATH);
    }
    if (process.env.DL_APP_BUILD_DIR) {
        candidates.push(path_1.default.join(process.env.DL_APP_BUILD_DIR, filename));
    }
    const cwd = process.cwd();
    candidates.push(path_1.default.join(cwd, 'dist', 'public', 'build', filename), path_1.default.join(cwd, 'public', 'build', filename));
    if ((_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) {
        candidates.push(path_1.default.resolve(path_1.default.parse(require.main.filename).dir, '../public/build', filename), path_1.default.resolve(path_1.default.parse(require.main.filename).dir, 'public/build', filename));
    }
    // от скомпилированного плагина (dist/.../layout) вверх до dist/public/build
    candidates.push(path_1.default.join(__dirname, '..', '..', '..', '..', 'public', 'build', filename));
    for (const p of candidates) {
        if (p && fs_1.default.existsSync(p))
            return p;
    }
    return path_1.default.resolve(path_1.default.parse(require.main.filename).dir, '../public/build', filename);
}
const manifest = resolveManifestPath();
const publicPath = '/build/';
function createLayoutPlugin() {
    const layoutPlugin = (0, app_layout_1.createLayoutPlugin)({ publicPath, manifest });
    return {
        name: layoutPlugin.name,
        apply({ options, commonOptions, renderContent, utils }) {
            layoutPlugin.apply({ options, commonOptions, renderContent, utils });
            if (!renderContent.bodyContent.root) {
                renderContent.bodyContent.root = getSpinner(utils);
            }
        },
    };
}
function getSpinner(utils) {
    const styles = utils.renderInlineStyle(`
        @keyframes yc-pulse {
            50% {
                background: rgb(255, 190, 92);
            }
        }
        .g-loader {
            position: relative;
            background: rgba(255, 190, 92, 0.14);
            animation: yc-pulse ease 800ms infinite;
            animation-delay: 400ms;
        }
        .g-loader:before, .g-loader:after {
            content: "";
            position: absolute;
            display: block;
            background: rgba(255, 190, 92, 0.14);
            top: 50%;
            transform: translateY(-50%);
            animation: yc-pulse ease 800ms infinite;
        }
        .g-loader:before {
            animation-delay: 200ms;
        }
        .g-loader:after {
            animation-delay: 600ms;
        }
        .g-loader_size_l {
            width: 9px;
            height: 36px;
        }
        .g-loader_size_l:before {
            height: 24px;
            width: 9px;
            left: -18px;
        }
        .g-loader_size_l:after {
            height: 24px;
            width: 9px;
            left: 18px;
        }

        .local_wrapper {
            justify-content: center;
            align-items: center;
            height: 100%;
        }

        .g-root_theme_dark .local_wrapper {
            background-color: var(--g-color-base-background, rgb(45, 44, 51));
        }
        .g-root_theme_dark-hc .local_wrapper {
            background-color: var(--g-color-base-background, rgb(34, 35, 38));
        }

        html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
        }
    `);
    const loader = `
        <div class="local_wrapper" id="local_wrapper" style="display: none">
            <div class="yc-loader yc-loader_size_l"></div>
        </div>
    `;
    const template = `
    ${styles}
    ${loader}
    ${utils.renderInlineScript(`
        setTimeout(function() {
            const element = document.getElementById("local_wrapper");
            element && element.setAttribute('style', 'display: flex');
        }, 100);
    `)}
`;
    return template;
}
