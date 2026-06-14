import '@gravity-ui/nodekit';

declare module '@gravity-ui/nodekit' {
    interface AppConfig {
        authCookieName?: string;
        usDynamicMasterTokenPrivateKey?: string;
    }

    interface AppContextParams {
        usDynamicMasterToken?: string;
    }
}
