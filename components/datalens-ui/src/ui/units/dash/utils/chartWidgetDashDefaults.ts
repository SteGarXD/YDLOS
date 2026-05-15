import type {Config, ConfigItem} from '@gravity-ui/dashkit';
import type {StringParams} from 'shared';

export const CHART_WIDGET_DASH_RUNTIME_PARAM_KEYS = [
    'treeState',
    '_page',
    'drillDownLevel',
    'drillDownFilters',
    '_columnId',
    '_sortOrder',
    '__sortMeta',
    '_sortColumnMeta',
    '_sortRowMeta',
] as const;

function withRuntimeKeys(defaults: StringParams | undefined): StringParams {
    const d: StringParams = {...(defaults || {})};
    for (const key of CHART_WIDGET_DASH_RUNTIME_PARAM_KEYS) {
        if (Object.prototype.hasOwnProperty.call(d, key)) {
            continue;
        }
        switch (key) {
            case 'treeState':
            case 'drillDownFilters':
                d[key] = [];
                break;
            case '_page':
                d[key] = '1';
                break;
            default:
                d[key] = '';
        }
    }
    return d;
}

type ChartWidgetTab = {
    id: string;
    isDefault?: boolean;
    params?: StringParams;
    [key: string]: unknown;
};

function augmentWidgetItem(item: ConfigItem): ConfigItem {
    if (item.type !== 'widget') {
        return item;
    }
    const data = item.data as {tabs?: ChartWidgetTab[]} | undefined;
    if (data?.tabs?.length) {
        const itemDefaults = (item.defaults || {}) as StringParams;
        const tabs: ChartWidgetTab[] = data.tabs.map((tab) => ({
            ...tab,
            params: withRuntimeKeys({
                ...itemDefaults,
                ...(tab.params || {}),
            }),
        }));
        return {
            ...item,
            defaults: withRuntimeKeys(item.defaults as StringParams | undefined),
            data: {
                ...data,
                tabs,
            },
        };
    }
    return {
        ...item,
        defaults: withRuntimeKeys(item.defaults as StringParams | undefined),
    };
}

export function withChartWidgetRuntimeDefaultsInConfig(config: Config | null): Config | null {
    if (!config?.items?.length) {
        return config;
    }
    return {
        ...config,
        items: config.items.map(augmentWidgetItem),
    };
}
