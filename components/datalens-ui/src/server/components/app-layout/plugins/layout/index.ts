import fs from 'fs';
import path from 'path';

import type {RenderHelpers} from '@gravity-ui/app-layout';
import {createLayoutPlugin as createLayoutPluginBase} from '@gravity-ui/app-layout';

const filename = 'assets-manifest.json';

/** Путь к манифесту сборки: без dist (dev/старый запуск), dist/public/build (наш образ), env. */
function resolveManifestPath(): string {
    const candidates: string[] = [];
    if (process.env.DL_APP_MANIFEST_PATH) {
        candidates.push(process.env.DL_APP_MANIFEST_PATH);
    }
    if (process.env.DL_APP_BUILD_DIR) {
        candidates.push(path.join(process.env.DL_APP_BUILD_DIR, filename));
    }
    const cwd = process.cwd();
    candidates.push(
        path.join(cwd, 'dist', 'public', 'build', filename),
        path.join(cwd, 'public', 'build', filename),
    );
    if (require.main?.filename) {
        candidates.push(
            path.resolve(path.parse(require.main.filename).dir, '../public/build', filename),
            path.resolve(path.parse(require.main.filename).dir, 'public/build', filename),
        );
    }
    // от скомпилированного плагина (dist/.../layout) вверх до dist/public/build
    candidates.push(path.join(__dirname, '..', '..', '..', '..', 'public', 'build', filename));
    for (const p of candidates) {
        if (p && fs.existsSync(p)) return p;
    }
    return path.resolve(path.parse(require.main!.filename).dir, '../public/build', filename);
}

const manifest = resolveManifestPath();
const publicPath = '/build/';

export function createLayoutPlugin(): ReturnType<typeof createLayoutPluginBase> {
    const layoutPlugin = createLayoutPluginBase({publicPath, manifest});
    return {
        name: layoutPlugin.name,
        apply({options, commonOptions, renderContent, utils}) {
            layoutPlugin.apply({options, commonOptions, renderContent, utils});
            // До бандла: ResizeObserver — ложный runtime для overlay (слушатель в capture до React Refresh).
            renderContent.inlineScripts.unshift(`
(function(){
  try {
    var re = /ResizeObserver loop limit exceeded|ResizeObserver loop completed with undelivered notifications/;
    window.addEventListener('error', function (e) {
      if (e && typeof e.message === 'string' && re.test(e.message)) {
        e.stopImmediatePropagation();
      }
    }, true);
  } catch (e) {}
})();`);
            // Не показывать промежуточный неоформленный #root до ReactDOM.render.
            renderContent.inlineStyleSheets.push(`
                /* Базовый sans-serif до бандла — меньше «Times» при первом кадре */
                html:not(.dl-react-ready) body {
                    overflow: hidden;
                    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
                        sans-serif;
                }
                html:not(.dl-react-ready) #root {
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                html.dl-react-ready #root {
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
            `);
            if (!renderContent.bodyContent.root) {
                renderContent.bodyContent.root = getSpinner(utils);
            }
        },
    };
}

function getSpinner(utils: RenderHelpers) {
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

        /*
         * FOUC на /auth: пока не подтянулся чанк со SCSS, React уже рисует форму.
         * Нейтральный «каркас» совпадает с .dl-signin до применения темы.
         */
        #root .dl-signin {
            box-sizing: border-box;
            height: 100%;
            min-height: 100vh;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        #root .dl-signin__form-container {
            box-sizing: border-box;
            background: #ffffff;
            border-radius: 8px;
            width: 440px;
            max-width: calc(100vw - 32px);
            min-height: 200px;
            padding: 48px;
        }
        #root .dl-signin input {
            box-sizing: border-box;
            width: 100%;
            padding: 10px 12px;
            margin: 0 0 12px;
            font: inherit;
            border: 1px solid #ccc;
            border-radius: 8px;
        }
        /* Без фирменного синего: до загрузки SCSS только нейтральная кнопка (бренд задаётся темой/Uikit) */
        #root .dl-signin button {
            box-sizing: border-box;
            font: inherit;
            cursor: pointer;
            border-radius: 8px;
            border: 1px solid #bdbdbd;
            padding: 12px 24px;
            background: #ececec;
            color: #222;
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
