import type {Request, Response} from '@gravity-ui/expresskit';

import type {Graph} from '../components/charts-engine/components/processor/comments-fetcher';

export type XlsxConverterFn = (
    req: Request,
    res: Response,
    chartData: {
        widgetKey?: string;
        categories_ms?: number[];
        categories?: string[] | number[];
        graphs: Graph[];
        /** Сетка [строка][колонка] — css backgroundColor (как в export.js) */
        cellStyles?: (string | null)[][];
        tableHead?: unknown;
        xlsxFooterMeta?: {
            bodyRowCount: number;
            footerRowCount: number;
            mergeFooterItogoLabel?: boolean;
        };
    },
    dataArray: number[],
    downloadConfig: {
        filename: string;
    },
) => void;
