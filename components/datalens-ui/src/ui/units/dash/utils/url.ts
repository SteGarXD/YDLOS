import type {DashKitProps} from '@gravity-ui/dashkit';
import {FOCUSED_WIDGET_PARAM_NAME} from 'shared';
import type {StringParams} from 'shared';
import type {EntryDialogOnCloseArg} from 'ui/components/EntryDialogues/types';
import {URL_QUERY} from 'ui/constants/common';

import {stringifyMemoize} from '../modules/helpers';

/** Query keys that are app routing/UI, not dashboard dataset/global parameters */
const URL_GLOBAL_PARAMS_RESERVED = new Set<string>([
    URL_QUERY.TAB_ID,
    URL_QUERY.REV_ID,
    URL_QUERY.CURRENT_PATH,
    URL_QUERY.OPEN_DASH_INFO,
    URL_QUERY.DEBUG,
    URL_QUERY.LOCAL_CONFIG,
    URL_QUERY.UNRELEASED,
    URL_QUERY.HIGHLIGHT_LINES,
    URL_QUERY.ACTIVE_TAB,
    URL_QUERY.CHART_TYPE,
    URL_QUERY.CONNECTION_FORM,
    URL_QUERY.API_CONNECTION_ID,
    URL_QUERY.CONNECTION_ID,
    'state',
    FOCUSED_WIDGET_PARAM_NAME,
]);

export const getDashEntryUrl = (response: EntryDialogOnCloseArg) => {
    return `/${response.data?.entryId}`;
};

export const getNewDashUrl = (workbookId?: string) => {
    return `/workbooks/${workbookId}/dashboards`;
};

export const getUrlGlobalParams = stringifyMemoize<DashKitProps['globalParams']>(
    (search: string, globalParams?: StringParams) => {
        if (!search) {
            return {};
        }
        const searchParams = new URLSearchParams(search);
        const settingsKeys = globalParams ? Object.keys(globalParams) : [];

        const fromSettings = settingsKeys.reduce(
            (result, key) =>
                searchParams.has(key) ? {...result, [key]: searchParams.getAll(key)} : result,
            {} as Record<string, string[]>,
        );

        const extra: Record<string, string[]> = {};
        const uniqueKeys = new Set<string>();
        searchParams.forEach((_, key) => uniqueKeys.add(key));
        for (const key of uniqueKeys) {
            if (URL_GLOBAL_PARAMS_RESERVED.has(key) || settingsKeys.includes(key)) {
                continue;
            }
            extra[key] = searchParams.getAll(key);
        }

        return {...fromSettings, ...extra};
    },
);
