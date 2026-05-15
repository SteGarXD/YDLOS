import React, {useState} from 'react';

import type {SelectOption, SelectOptions} from '@gravity-ui/uikit';
import {Button, Select} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import DialogManager from 'components/DialogManager/DialogManager';
import {I18n} from 'i18n';
import type {LowerCasePaperFormat} from 'puppeteer';
import {useDispatch} from 'react-redux';
import {AdaptiveDialog} from 'ui/components/AdaptiveDialog/AdaptiveDialog';
import {DL} from 'ui/constants';
import {showToast} from 'ui/store/actions/toaster';
import Utils from 'ui/utils';
import {MOBILE_SIZE} from 'ui/utils/mobile';

import './ExportDialog.scss';

const b = block('dialog-export');
const i18n = I18n.keyset('chartkit.menu.export-dialog');
const i18nExport = I18n.keyset('chartkit.menu.export');

type Props = {
    entryId: string;
    previewPath?: string;
    onClose: () => void;
};

export const DIALOG_EXPORT_PDF = Symbol('DIALOG_EXPORT_PDF');

export type OpenDialogExportPdfArgs = {
    id: typeof DIALOG_EXPORT_PDF;
    props: Props;
};

export const ExportDialog: React.FC<Props> = (props) => {
    /** A4 — типичный формат для EU/RU; Letter — США. Совпадает с fallback в print-entry. */
    const [format, setFormat] = useState<LowerCasePaperFormat>('a4');
    const [landscape, setLandscape] = useState<string>('true');

    const [loading, setLoading] = useState<boolean>(false);

    const dispatch = useDispatch();

    const formatOptions = [
        'letter',
        'legal',
        'tabloid',
        'ledger',
        'a0',
        'a1',
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
    ].map(
        (item: string): SelectOption => ({
            value: item,
            content: item,
            qa: item,
        }),
    );

    const landscapeOptions: SelectOptions = [
        {content: i18n('orientation_portrait'), value: 'false'},
        {content: i18n('orientation_landscape'), value: 'true'},
    ];

    const selectSize = DL.IS_MOBILE ? MOBILE_SIZE.SELECT : 'm';

    const {entryId, previewPath, onClose} = props;

    async function onClick() {
        setLoading(true);
        try {
            const res = await fetch('/print-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rpc-authorization': Utils.getRpcAuthorization(),
                },
                body: JSON.stringify({
                    links: [entryId],
                    host: window.location.origin,
                    previewPath: previewPath || '',
                    /** Параметры страницы (фильтры дашборда и т.д.) — как в адресной строке */
                    urlQuery: window.location.search
                        ? window.location.search.replace(/^\?/, '')
                        : '',
                    options: {
                        landscape: landscape === 'true',
                        format: format,
                        /** Ручной режим: не пересчитывать на сервере */
                        autoFit: false,
                    },
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                dispatch(
                    showToast({
                        title: i18n('toast_error'),
                        error: Error(errText.trim() || i18n('error')),
                    }),
                );
                return;
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/pdf')) {
                const maybeText = await res.text();
                dispatch(
                    showToast({
                        title: i18n('toast_error'),
                        error: Error(maybeText.trim() || i18n('error')),
                    }),
                );
                return;
            }

            const blob = await res.blob();
            if (blob.size < 2500) {
                dispatch(
                    showToast({
                        title: i18nExport('pdf_too_small', {size: String(blob.size)}),
                        error: Error(i18n('error')),
                    }),
                );
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const anchorElement = document.createElement('a');
            document.body.appendChild(anchorElement);
            anchorElement.style.display = 'none';
            anchorElement.href = url;
            anchorElement.download = `${entryId || 'chart'}.pdf`;
            anchorElement.rel = 'noopener';
            anchorElement.click();
            document.body.removeChild(anchorElement);
            window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
            onClose();
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_error'),
                    error: e instanceof Error ? e : Error(String(e)),
                }),
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdaptiveDialog
            onClose={onClose}
            visible={true}
            title={i18n('export_title')}
            dialogProps={{className: b()}}
        >
            <div className={b('body')}>
                <Select
                    value={[format]}
                    onUpdate={(value) => setFormat(value[0] as LowerCasePaperFormat)}
                    options={formatOptions}
                    label={i18n('page_format')}
                    size={selectSize}
                />
                <Select
                    value={[landscape]}
                    onUpdate={(value) => setLandscape(value[0])}
                    options={landscapeOptions}
                    label={i18n('page_orientation')}
                    size={selectSize}
                />
                <Button size="xl" width="max" view="action" loading={loading} onClick={onClick}>
                    {i18n('export_submit')}
                </Button>
            </div>
        </AdaptiveDialog>
    );
};

DialogManager.registerDialog(DIALOG_EXPORT_PDF, ExportDialog);
