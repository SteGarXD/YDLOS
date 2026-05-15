"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpensourceLayoutConfig = void 0;
const shared_1 = require("../../../shared");
const language_1 = require("../../utils/language");
const utils_1 = require("../zitadel/utils");
const utils_2 = require("./utils");
const getOpensourceLayoutConfig = async (args) => {
    var _a, _b;
    const { req, res, settingsId } = args;
    const config = req.ctx.config;
    const requestId = req.id || '';
    const getAppLayoutSettings = req.ctx.get('getAppLayoutSettings');
    const appLayoutSettings = getAppLayoutSettings(req, res, settingsId);
    const regionalEnvConfig = req.ctx.config.regionalEnvConfig;
    const allowLanguages = ((regionalEnvConfig === null || regionalEnvConfig === void 0 ? void 0 : regionalEnvConfig.allowLanguages) || shared_1.FALLBACK_LANGUAGES);
    const cookie = req.cookies[shared_1.USER_SETTINGS_KEY];
    let lang = shared_1.Language.Ru;
    let theme;
    try {
        const preparedCookie = JSON.parse(cookie);
        lang = preparedCookie.language;
        theme = preparedCookie.theme;
    }
    catch {
        console.warn('no userSettings in cookie');
    }
    const isAllowed = allowLanguages.includes(lang || '');
    if (!isAllowed) {
        lang = shared_1.Language.Ru;
    }
    const isZitadelEnabled = req.ctx.config.isZitadelEnabled;
    const isAuthEnabled = req.ctx.config.isAuthEnabled;
    // TODO: check and remove optional props;
    let user = { lang };
    const userSettings = {};
    let iamUserId = '';
    const { scripts: chartkitScripts, inlineScripts: chartkitInlineScripts } = (0, utils_2.getChartkitLayoutSettings)(config.chartkitSettings);
    if (isZitadelEnabled) {
        const userInfo = (0, utils_1.getUserInfo)(req, res);
        iamUserId = userInfo.uid;
        user = { ...user, ...userInfo };
    }
    if (isAuthEnabled) {
        const authUser = req.ctx.get('user');
        iamUserId = authUser === null || authUser === void 0 ? void 0 : authUser.userId;
        const profile = authUser === null || authUser === void 0 ? void 0 : authUser.profile;
        user = {
            ...user,
            uid: iamUserId,
            roles: authUser === null || authUser === void 0 ? void 0 : authUser.roles,
            ...profile,
        };
    }
    const isRebrandingEnabled = req.ctx.get('isEnabledServerFeature')(shared_1.Feature.EnableDLRebranding);
    // applying new favicon from rebranding
    const faviconUrl = isRebrandingEnabled ? '/os-favicon.ico' : config.faviconUrl;
    const tenantSettings = {
        defaultColorPaletteId: res.locals.tenantDefaultColorPaletteId,
    };
    const DL = {
        user,
        userSettings,
        iamUserId,
        deviceType: (0, utils_2.getPlatform)(req.headers['user-agent']),
        requestId,
        env: config.appEnv,
        installationType: config.appInstallation,
        serviceName: config.serviceName,
        endpoints: config.endpoints.ui,
        features: config.features,
        meta: req.ctx.getMetadata(),
        chartkitSettings: config.chartkitSettings,
        defaultColorPaletteId: config.defaultColorPaletteId,
        allowLanguages,
        headersMap: req.ctx.config.headersMap,
        isZitadelEnabled,
        oidc: req.ctx.config.oidc,
        oidc_name: req.ctx.config.oidc_name,
        oidc_base_url: req.ctx.config.oidc_base_url,
        oidc_2: req.ctx.config.oidc_2,
        oidc_name_2: req.ctx.config.oidc_name_2,
        oidc_base_url_2: req.ctx.config.oidc_base_url_2,
        oidc_3: req.ctx.config.oidc_3,
        oidc_name_3: req.ctx.config.oidc_name_3,
        oidc_base_url_3: req.ctx.config.oidc_base_url_3,
        oidc_4: req.ctx.config.oidc_4,
        oidc_name_4: req.ctx.config.oidc_name_4,
        oidc_base_url_4: req.ctx.config.oidc_base_url_4,
        isAuthEnabled,
        ymapApiKey: (_b = (_a = config.chartkitSettings) === null || _a === void 0 ? void 0 : _a.yandexMap) === null || _b === void 0 ? void 0 : _b.token,
        connectorIcons: res.locals.connectorIcons,
        apiPrefix: config.apiPrefix,
        releaseVersion: config.releaseVersion,
        exportDashExcel: req.ctx.config.exportDashExcel,
        docsUrl: config.docsUrl,
        orderedAuthRoles: config.orderedAuthRoles,
        authSignupDisabled: req.ctx.config.authSignupDisabled,
        tenantSettings,
        ...appLayoutSettings.DL,
    };
    const renderConfig = {
        nonce: req.nonce,
        data: { DL },
        lang,
        icon: {
            type: (faviconUrl === null || faviconUrl === void 0 ? void 0 : faviconUrl.endsWith('.png')) ? 'image/png' : 'image/ico',
            href: faviconUrl,
            sizes: '32x32',
        },
        inlineScripts: ['window.DL = window.__DATA__.DL', ...chartkitInlineScripts],
        scripts: [(0, language_1.addTranslationsScript)({ allowLanguages, lang }), ...chartkitScripts],
        links: [
            {
                href: 'fonts.css',
                rel: 'stylesheet',
            }
        ],
        pluginsOptions: {
            layout: { name: appLayoutSettings.bundleName },
            ...(theme ? { uikit: { theme } } : {}),
        },
        ...appLayoutSettings.renderConfig,
    };
    return renderConfig;
};
exports.getOpensourceLayoutConfig = getOpensourceLayoutConfig;
