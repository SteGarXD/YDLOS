import React from 'react';

import {ArrowDownToLine, Picture} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton';
import {I18n} from 'i18n';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';
import type {ExportFormatsType} from 'shared';
import {EXPORT_FORMATS, Feature, MenuItemsIds} from 'shared';
import {URL_OPTIONS} from 'ui/constants/common';
import type {MenuItemConfig, MenuItemModalProps} from 'ui/libs/DatalensChartkit/menu/Menu';
import {registry} from 'ui/registry';
import Utils from 'ui/utils';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';

import {ICONS_MENU_DEFAULT_SIZE, type MenuItemArgs} from '../../../../../../../../menu/MenuItems';
import type {ChartKitDataProvider} from '../../../../../../types';

import {csvExportAction} from './CsvExport/CsvExport';
import {setLoadingToast, updateLoadingToast} from './ToastContent/ToastContent';
import type {ExportActionArgs, ExportChartArgs} from './types';
import {copyData, downloadData, getFileName, isExportPdfVisible, isExportVisible} from './utils';

const i18n = I18n.keyset('chartkit.menu.export');

const downloadPdfBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    document.body.appendChild(anchorElement);
    anchorElement.style.display = 'none';
    anchorElement.href = url;
    anchorElement.download = filename;
    anchorElement.rel = 'noopener';
    anchorElement.click();
    document.body.removeChild(anchorElement);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

const autoExportPdfAction = (chartsDataProvider: ChartKitDataProvider) => {
    return async (data: ExportActionArgs) => {
        const chartId =
            data.propsData.id ||
            data.loadedData?.entryId ||
            (data.loadedData as {id?: string})?.id ||
            '';
        if (!chartId) {
            throw new Error('Chart id is empty');
        }
        const previewPathBase =
            chartsDataProvider
                .getGoAwayLink(
                    {loadedData: data.loadedData, propsData: data.propsData},
                    {
                        idPrefix: '/preview/',
                        extraParams: {
                            [URL_OPTIONS.EMBEDDED]: '1',
                            [URL_OPTIONS.NO_CONTROLS]: '1',
                            [URL_OPTIONS.ACTION_PARAMS_ENABLED]: '1',
                        },
                    },
                )
                ?.replace(chartsDataProvider?.endpoint || '', '') || '';
        const previewPath = `${previewPathBase}${previewPathBase.includes('?') ? '&' : '?'}_no_virtual=1&_pdf_export=1`;

        const loadingToastName = `${getFileName(data.loadedData.key || 'chart')}.`;
        setLoadingToast(loadingToastName, 'pdf');

        try {
            const res = await fetch('/print-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rpc-authorization': Utils.getRpcAuthorization(),
                },
                body: JSON.stringify({
                    links: [chartId],
                    host: window.location.origin,
                    previewPath,
                    urlQuery: window.location.search
                        ? window.location.search.replace(/^\?/, '')
                        : '',
                    options: {
                        format: 'a4',
                        /** Сервер: `print-entry` сам подбирает landscape + scale по ширине контента */
                        autoFit: true,
                    },
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`PDF export failed: ${res.status} ${errorText || ''}`.trim());
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/pdf')) {
                const maybeText = await res.text();
                throw new Error(`Unexpected response type: ${contentType}. ${maybeText}`.trim());
            }

            const blob = await res.blob();
            /** Растровый PDF (скриншот) — минимальный размер согласован с `print-entry` */
            if (blob.size < 2500) {
                throw new Error(i18n('pdf_too_small', {size: String(blob.size)}));
            }
            downloadPdfBlob(blob, `${data.propsData.id || 'chart'}.pdf`);
            updateLoadingToast(loadingToastName, undefined);
        } catch (error) {
            toaster.remove(loadingToastName);
            const message = error instanceof Error ? error.message : String(error);
            toaster.add({
                theme: 'danger',
                name: 'toastAfterExportPdf',
                title: `${i18n('export_failed')}. ${message ? `(${message})` : ''}`,
            });
        }
    };
};

const directExportAction = (
    format: ExportFormatsType,
    onExportLoading?: ExportChartArgs['onExportLoading'],
) => {
    return async (chartData: ExportActionArgs) => {
        const params = {
            format,
            delValues: null,
            delNumbers: null,
            encoding: null,
        };

        if (format === EXPORT_FORMATS.XLSX) {
            downloadData({chartData, params, onExportLoading});
            return;
        }
        copyData({chartData, params});
    };
};

const screenshotExportAction = (
    chartsDataProvider: ChartKitDataProvider,
    customConfig?: Partial<MenuItemConfig>,
) => {
    return (args: ExportActionArgs) => {
        const menuAction =
            customConfig?.action ||
            (({event, loadedData, propsData}) => {
                const path =
                    chartsDataProvider
                        .getGoAwayLink(
                            {loadedData, propsData},
                            {
                                idPrefix: '/preview/',
                                extraParams: {[URL_OPTIONS.ACTION_PARAMS_ENABLED]: '1'},
                            },
                        )
                        ?.replace(chartsDataProvider?.endpoint || '', '') || '';

                const {DownloadScreenshot} = registry.common.components.getAll();

                return function DownloadScreenshotModalRenderer(props: MenuItemModalProps) {
                    return (
                        <DownloadScreenshot
                            filename={'charts'}
                            path={path}
                            initDownload={event.ctrlKey || event.metaKey}
                            onClose={props.onClose}
                        />
                    );
                };
            });
        if (customConfig?.actionWrapper) {
            return customConfig.actionWrapper(menuAction)(args);
        }

        return menuAction(args);
    };
};

const getSubItems = ({
    showWiki,
    showScreenshot,
    chartsDataProvider,
    customConfig,
}: {
    showWiki?: boolean;
    showScreenshot?: boolean;
    chartsDataProvider: ChartKitDataProvider;
    customConfig?: Partial<MenuItemConfig>;
}) => {
    const onExportLoading = customConfig?.onExportLoading;

    let csvAction =
        customConfig?.items?.find((item) => item.id === MenuItemsIds.EXPORT_CSV)?.action ??
        csvExportAction(chartsDataProvider, onExportLoading);

    if (customConfig?.actionWrapper) {
        csvAction = customConfig.actionWrapper(csvAction);
    }

    const submenuItems = [
        {
            id: MenuItemsIds.EXPORT_XLSX,
            title: i18n('format_xlsx'),
            isVisible: ({loadedData, error}: MenuItemArgs) =>
                isEnabledFeature(Feature.XlsxChartExportEnabled) &&
                isExportVisible({loadedData, error}),
            action: directExportAction(EXPORT_FORMATS.XLSX, onExportLoading),
        },
        {
            id: MenuItemsIds.EXPORT_ODS,
            title: i18n('format_ods'),
            isVisible: ({loadedData, error}: MenuItemArgs) => isExportVisible({loadedData, error}),
            action: directExportAction(EXPORT_FORMATS.ODS, onExportLoading),
        },
        {
            id: MenuItemsIds.EXPORT_CSV,
            title: i18n('format_csv'),
            isVisible: ({loadedData, error}: MenuItemArgs) => isExportVisible({loadedData, error}),
            action: csvAction,
        },
        {
            id: MenuItemsIds.EXPORT_MARKDOWN,
            title: i18n('format_markdown'),
            isVisible: isExportVisible,
            action: directExportAction(EXPORT_FORMATS.MARKDOWN),
        },
        {
            id: MenuItemsIds.EXPORT_WIKI,
            title: i18n('format_wiki'),
            isVisible: ({loadedData, error}: MenuItemArgs) =>
                Boolean(showWiki) && isExportVisible({loadedData, error}),
            action: directExportAction(EXPORT_FORMATS.WIKI),
        },
        {
            id: MenuItemsIds.EXPORT_SCREENSHOT,
            title: i18n('format_image'),
            isVisible: ({loadedData, error}: MenuItemArgs) =>
                Boolean(showScreenshot) && isExportVisible({loadedData, error}),
            action: screenshotExportAction(chartsDataProvider, customConfig),
        },
    ];

    return submenuItems;
};

export const getExportPDF = ({
    showScreenshot,
    chartsDataProvider,
}: {
    showWiki?: boolean;
    showScreenshot?: boolean;
    chartsDataProvider: ChartKitDataProvider;
    customConfig?: Partial<MenuItemConfig>;
}): MenuItemConfig => {
    return {
        id: MenuItemsIds.EXPORT_PDF,
        title: ({loadedData, error}: MenuItemArgs) => {
            return isExportPdfVisible({loadedData, error})
                ? i18n('menu-export-pdf')
                : i18n('menu-screenshot');
        },
        icon: ({loadedData, error}: MenuItemArgs) => {
            const iconData =
                isExportPdfVisible({loadedData, error}) && !error ? ArrowDownToLine : Picture;
            return (
                <Icon
                    size={ICONS_MENU_DEFAULT_SIZE}
                    data={iconData}
                    //className={ICONS_MENU_DEFAULT_CLASSNAME}
                />
            );
        },
        items: [],
        isVisible: ({loadedData, error}: MenuItemArgs) => {
            const isExportAllowed = !loadedData?.extra.dataExportForbidden;
            const isScreenshotVisible = loadedData?.data && showScreenshot;

            return Boolean(
                isExportAllowed && (isExportPdfVisible({loadedData, error}) || isScreenshotVisible),
            );
        },
        action: (data: ExportActionArgs) => {
            autoExportPdfAction(chartsDataProvider)(data).catch(() => {});
        },
    };
};

export function isExportItemDisabled() {
    return ({loadedData}: MenuItemArgs) => {
        const forbiddenExportFromExtra = loadedData?.extra.dataExportForbidden
            ? i18n('label_data-export-forbidden')
            : false;
        const dataExports = loadedData?.dataExport
            ? Object.values(loadedData.dataExport).filter(Boolean)
            : [];

        if (dataExports.length > 0) {
            if (dataExports.every((exp) => !exp || exp.basic.allowed)) {
                return forbiddenExportFromExtra;
            }

            const uniqDisableReasons = uniq(flatMap(dataExports, (exp) => exp?.basic.reason || []));
            const reason = uniqDisableReasons[0]
                ? i18n(`label_export-forbidden.${uniqDisableReasons[0]}`)
                : undefined;

            return reason ?? i18n('label_data-export-forbidden');
        }
        return forbiddenExportFromExtra;
    };
}

export const getExportItem = ({
    showWiki,
    showScreenshot,
    chartsDataProvider,
    customConfig,
}: {
    showWiki?: boolean;
    showScreenshot?: boolean;
    chartsDataProvider: ChartKitDataProvider;
    customConfig?: Partial<MenuItemConfig>;
    extraOptions?: Record<string, unknown>;
}): MenuItemConfig => ({
    id: MenuItemsIds.EXPORT,
    title: ({loadedData, error}: MenuItemArgs) => {
        return isExportVisible({loadedData, error}) ? i18n('menu-export') : i18n('menu-screenshot');
    },
    icon: ({loadedData, error}: MenuItemArgs) => {
        const iconData = isExportVisible({loadedData, error}) && !error ? ArrowDownToLine : Picture;
        return <Icon size={ICONS_MENU_DEFAULT_SIZE} data={iconData} />;
    },
    items: getSubItems({
        showWiki,
        showScreenshot,
        chartsDataProvider,
        customConfig,
    }),
    isDisabled: (args) => {
        const customIsDisabled = customConfig?.isDisabled?.(args) ?? false;
        return customIsDisabled || isExportItemDisabled()(args);
    },
    isVisible: ({loadedData, error}: MenuItemArgs) => {
        const isScreenshotVisible = loadedData?.data && showScreenshot;

        return Boolean(isExportVisible({loadedData, error}) || isScreenshotVisible);
    },
    action: (data: ExportActionArgs) => {
        if (!isExportVisible({loadedData: data.loadedData, error: data.error})) {
            return screenshotExportAction(chartsDataProvider, customConfig)(data);
        }
    },
});
