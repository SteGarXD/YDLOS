"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppLayoutSettings = void 0;
const getAppLayoutSettings = (req, _res, settingsId) => {
    const config = req.ctx.config;
    switch (settingsId) {
        case 'dl-main': {
            return {
                renderConfig: { title: config.serviceName },
                DL: {},
                bundleName: 'dl-main',
            };
        }
        case 'navigation': {
            return {
                renderConfig: {
                    title: `Navigation - ${config.serviceName}`,
                },
                DL: {},
                bundleName: 'dl-main',
            };
        }
        case 'landing-layout': {
            const pageSettings = req.ctx.get('landingPageSettings');
            if (!pageSettings) {
                throw new Error('Page settings are required');
            }
            const meta = pageSettings.pageMeta;
            return {
                renderConfig: {
                    title: pageSettings.title || '',
                    meta,
                    links: pageSettings.pageLinks,
                },
                DL: {
                    landingPageSettings: pageSettings,
                    isLanding: true,
                },
                bundleName: 'dl-main',
            };
        }
        case 'auth-layout': {
            return {
                renderConfig: { title: config.serviceName },
                DL: {},
                bundleName: 'dl-main',
            };
        }
        default: {
            return {
                renderConfig: { title: 'default' },
                DL: {},
                bundleName: 'default',
            };
        }
    }
};
exports.getAppLayoutSettings = getAppLayoutSettings;
