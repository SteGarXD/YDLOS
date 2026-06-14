import type {} from '../../shared/types/common';

declare module '../../shared/types/common' {
    interface DLGlobalData {
        flightGroupsEditorToken?: string;
        flightGroupsEditorDatasetIds?: string[];
        flightGroupsEditorEnabled?: boolean;
        useOfficialAuth?: boolean;
        exportDashExcel?: boolean;
        useOfficialAdmin?: boolean;
        authResolveUsersByIdsEnabled?: boolean;
        authAsideHeaderLandingBypassAllowed?: boolean;
        usMasterToken?: string;
        oidc?: boolean;
        oidc_name?: string;
        oidc_base_url?: string;
        oidc_2?: boolean;
        oidc_name_2?: string;
        oidc_base_url_2?: string;
        oidc_3?: boolean;
        oidc_name_3?: string;
        oidc_base_url_3?: string;
        oidc_4?: boolean;
        oidc_name_4?: string;
        oidc_base_url_4?: string;
    }
}
