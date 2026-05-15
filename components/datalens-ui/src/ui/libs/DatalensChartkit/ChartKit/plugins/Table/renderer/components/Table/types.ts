import type React from 'react';

import type {RowData, SortingFnOption} from '@tanstack/react-table';
import type {TableCellVeticalAlignment} from 'shared/types/chartkit/table';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        width?: string | number;
        footer?: {
            css?: React.CSSProperties;
        };
        head?: THead;
    }
}

export interface CellData {
    value: unknown;
    formattedValue?: string;
    css?: React.CSSProperties;
    className?: string | (() => string);
    rowSpan?: number;
    isVisible?: boolean;
    verticalAlignment?: TableCellVeticalAlignment;
}

export type RenderCellFn<T extends CellData> = (cellData: T) => React.ReactElement | null;
export type RenderHeaderFn = () => React.ReactElement | null;

export type THead = {
    id: string;
    header?: string | RenderHeaderFn;
    enableSorting?: boolean;
    sortingFn?: SortingFnOption<TData>;
    enableRowGrouping?: boolean;
    pinned?: boolean;
    width?: string | number;
    cell?: RenderCellFn<CellData>;
    columns?: THead[];
    left?: number;
    index?: number;
    verticalAlignment?: TableCellVeticalAlignment;
};

export type TData = CellData[];

export type TFoot = CellData;

export type OnCellClickFn = (args: {row?: TData; cell?: CellData; event: React.MouseEvent}) => void;

export type TableProps = {
    title?: {text: string};
    data: {
        head?: THead[];
        rows?: TData[];
        footer?: TFoot[];
    };
    noData?: {
        text: string;
    };
    header?: {
        sticky?: boolean;
    };
    onCellClick?: OnCellClickFn;
    qa?: string;
    manualSorting?: boolean;
    onSortingChange?: (args: {cell?: THead; sortOrder?: 'asc' | 'desc'}) => void;
    parentContainer?: React.MutableRefObject<HTMLDivElement | null>;
};

export type TableDimensions = {
    head: {width: number; top: number; left: number}[][];
    height: number;
    minWidth?: number;
    prevWidth?: number;
    width?: number;
};

export type HeadCellViewData = {
    id: string;
    index: number;
    /** Логический индекс колонки (как у td); для границ — не использовать nth-child */
    columnStartIndex?: number;
    rowSpan?: number;
    colSpan?: number;
    /** Сводная — по центру; обычная плоская таблица — слева (как в эталоне) */
    headerTextAlign?: 'left' | 'center';
    sortable: boolean;
    pinned: boolean;
    measureNamesColumn?: boolean;
    style?: React.CSSProperties;
    verticalAlignment?: TableCellVeticalAlignment;
    sorting: 'asc' | 'desc' | false;
    content: JSX.Element | React.ReactNode;
    onClick: () => void;
};

export type HeadRowViewData = {
    id: string;
    cells: HeadCellViewData[];
};

export type BodyCellViewData = {
    id: string;
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
    verticalAlignment?: TableCellVeticalAlignment;
    contentType?: 'null';
    content: JSX.Element | React.ReactNode;
    className?: string;
    type?: 'number';
    pinned?: boolean;
    measureNamesColumn?: boolean;
    rowSpan?: number;
    colSpan?: number;
    /** Логический индекс колонки в листовой шапке (стабилен при rowspan в соседних колонках) */
    columnStartIndex?: number;
    /* Index of cells in row (usefula with cell grouping) */
    index: number;
    /* Original cell data */
    data: unknown;
    maxHeight?: number;
};

export type BodyRowViewData = {
    id: string;
    index: number;
    cells: BodyCellViewData[];
    y?: number;
    /** Последняя строка данных перед tfoot — без :last-child (виртуализация ломает :last-child) */
    isLastBeforeFooter?: boolean;
    /** Строка сегмента в плоском дереве рейсов (treeOffset > 1). */
    isSegmentRow?: boolean;
};

export type FooterCellViewData = {
    id: string;
    content: JSX.Element | React.ReactNode;
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
    pinned?: boolean;
    measureNamesColumn?: boolean;
    type?: 'number';
    colSpan?: number;
    isColSpanCovered?: boolean;
    rowSpan?: number;
    isRowSpanCovered?: boolean;
};

export type FooterRowViewData = {
    id: string;
    cells: FooterCellViewData[];
};

export type RowRef = (node: HTMLTableRowElement) => void;

export type TableViewData = {
    colgroup?: {width: string}[];
    /** false для сводной (чёрная сетка шапки); true — как у тела таблицы */
    lightHeaderChrome?: boolean;
    header: {
        rows: HeadRowViewData[];
        style?: React.CSSProperties;
    };
    body: {
        rows: BodyRowViewData[];
        style?: React.CSSProperties;
        rowRef?: RowRef;
    };
    footer: {
        rows: FooterRowViewData[];
        style?: React.CSSProperties;
    };
    measurementFooter: {
        rows: FooterRowViewData[];
    };
    totalSize?: number;
};
