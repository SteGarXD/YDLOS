/**
 * YDLOS feature registry (Ring 2). Each entry maps to overlay modules or L1 env.
 * Import from extensions package docs — runtime registration stays in datalens-ui overlay until upstream PR merge.
 */

export type FeatureLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';
export type FeatureClass = 'CONFIG' | 'OFFICIAL' | 'REGISTRY' | 'UPSTREAM-PR' | 'INTERIM' | 'PRIVATE';

export interface YdlFeature {
    id: string;
    title: string;
    level: FeatureLevel;
    class: FeatureClass;
    env?: string[];
    overlayPaths?: string[];
    status: 'done' | 'interim' | 'gap' | 'upstream';
}

export const YDL_FEATURES: YdlFeature[] = [
    {
        id: 'auth.required',
        title: 'Обязательная авторизация',
        level: 'L1',
        class: 'OFFICIAL',
        env: ['AUTH_ENABLED', 'UI_AUTH_ENABLED'],
        status: 'done',
    },
    {
        id: 'auth.oidc.multi',
        title: 'OIDC до 4 провайдеров',
        level: 'L1',
        class: 'CONFIG',
        env: ['OIDC', 'OIDC_2', 'OIDC_3', 'OIDC_4'],
        status: 'done',
    },
    {
        id: 'auth.oidc.seamless',
        title: 'OIDC auto-redirect (portal iframe)',
        level: 'L5',
        class: 'OFFICIAL',
        status: 'gap',
    },
    {
        id: 'admin.official',
        title: 'Админка service-settings',
        level: 'L2',
        class: 'OFFICIAL',
        env: ['YDL_USE_OFFICIAL_ADMIN'],
        status: 'done',
    },
    {
        id: 'admin.legacy-pd',
        title: 'Админка pd_* (akrasnov parity)',
        level: 'L7',
        class: 'INTERIM',
        status: 'gap',
    },
    {
        id: 'share.view-only',
        title: 'Поделиться ссылкой',
        level: 'L5',
        class: 'REGISTRY',
        overlayPaths: ['DialogShare', 'ShareButton'],
        status: 'done',
    },
    {
        id: 'permissions.related',
        title: 'Связанные объекты',
        level: 'L5',
        class: 'REGISTRY',
        overlayPaths: ['DialogRelatedEntities'],
        status: 'done',
    },
    {
        id: 'ql.user-embed',
        title: 'QL __user_id / __embed',
        level: 'L6',
        class: 'UPSTREAM-PR',
        overlayPaths: ['charts-engine/controllers/run.ts'],
        status: 'done',
    },
    {
        id: 'export.excel',
        title: 'Экспорт дашборда Excel',
        level: 'L1',
        class: 'CONFIG',
        env: ['EXPORT_DASH_EXCEL'],
        status: 'done',
    },
    {
        id: 'export.pdf.d3',
        title: 'PDF для D3 (HC=0)',
        level: 'L6',
        class: 'UPSTREAM-PR',
        overlayPaths: ['print-entry'],
        status: 'done',
    },
    {
        id: 'export.workbook',
        title: 'Экспорт workbook',
        level: 'L1',
        class: 'CONFIG',
        env: ['EXPORT_WORKBOOK_ENABLED'],
        status: 'done',
    },
    {
        id: 'aero.flight-groups',
        title: 'Flight Groups Editor',
        level: 'L8',
        class: 'PRIVATE',
        env: ['FLIGHT_GROUPS_EDITOR_DATASET_IDS', 'FLIGHT_GROUPS_MSSQL_CONNECTION_STRING'],
        overlayPaths: ['FlightGroupsEditor'],
        status: 'done',
    },
    {
        id: 'aero.profiles',
        title: 'Dashboard profiles',
        level: 'L8',
        class: 'PRIVATE',
        overlayPaths: ['overlay/platform/profiles'],
        status: 'done',
    },
];
