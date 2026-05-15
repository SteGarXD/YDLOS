import fs from 'fs';
import {unlink} from 'fs/promises';
import os from 'os';
import * as path from 'path';

import {dateTime} from '@gravity-ui/date-utils';
import type {Request, Response} from '@gravity-ui/expresskit';
import ExcelJS from 'exceljs';
import {isObject} from 'lodash';
import mime from 'mime';
import {v4 as uuidv4} from 'uuid';

import type {Graph} from '../components/charts-engine/components/processor/comments-fetcher';

import {extractTwoHeaderRowsFromHead} from './xlsx-pivot-layout';

const XLS_DATA_LIMIT = 1024 * 1024 * 50; // 50MB
const MAX_EXCEL_CELL_LENGTH = 32767;

type Cell = {x: number; t: string; v: Date};
type Row = (number | Date | string | Cell | XlsxStyledCell)[];
type XlsxStyledCell = {
    v?: unknown;
    t?: string;
    z?: string;
};

function isCell(cellData: unknown): cellData is Cell {
    return isObject(cellData) && 't' in cellData && 'v' in cellData;
}

function isStyledXlsxCell(c: unknown): c is XlsxStyledCell {
    return isObject(c) && ('v' in c || 't' in c);
}

/** ARGB для ExcelJS из css color (#hex или rgb) */
export function cssBackgroundToArgb(css?: string | null): string | undefined {
    if (!css || typeof css !== 'string') {
        return undefined;
    }
    const s = css.trim();
    if (s.startsWith('var(') || s === 'transparent') {
        return undefined;
    }
    if (s.startsWith('#')) {
        let h = s.slice(1);
        if (h.length === 3) {
            h = h
                .split('')
                .map((c) => c + c)
                .join('');
        }
        if (h.length === 6) {
            return `FF${h.toUpperCase()}`;
        }
    }
    const m = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        const r = Number(m[1]).toString(16).padStart(2, '0');
        const g = Number(m[2]).toString(16).padStart(2, '0');
        const b = Number(m[3]).toString(16).padStart(2, '0');
        return `FF${r}${g}${b}`.toUpperCase();
    }
    return undefined;
}

const thinBorder: Partial<ExcelJS.Borders> = {
    top: {style: 'thin', color: {argb: 'FFB8B8B8'}},
    left: {style: 'thin', color: {argb: 'FFB8B8B8'}},
    bottom: {style: 'thin', color: {argb: 'FFB8B8B8'}},
    right: {style: 'thin', color: {argb: 'FFB8B8B8'}},
};

const blackBorder: Partial<ExcelJS.Borders> = {
    top: {style: 'thin', color: {argb: 'FF000000'}},
    left: {style: 'thin', color: {argb: 'FF000000'}},
    bottom: {style: 'thin', color: {argb: 'FF000000'}},
    right: {style: 'thin', color: {argb: 'FF000000'}},
};

function applyBorder(cell: ExcelJS.Cell, b: Partial<ExcelJS.Borders>) {
    cell.border = {
        top: b.top,
        left: b.left,
        bottom: b.bottom,
        right: b.right,
    };
}

function getWorkSheetTemplatePath(widgetKey?: string): string | null {
    if (!widgetKey) {
        return null;
    }
    const name = widgetKey.split('/')?.[1] || '';
    if (!name) {
        return null;
    }
    const exportPath = path.join(__dirname, '../', '../', '../', 'table-report-headers');
    const templatePath = path.join(exportPath, `${name}.xlsx`);
    return fs.existsSync(templatePath) ? templatePath : null;
}

function getPlainCellValue(val: unknown): string | number | Date | null {
    if (val === undefined || val === null) {
        return null;
    }
    if (isStyledXlsxCell(val) && 'v' in val && val.v !== undefined) {
        const inner = val.v;
        if (isCell(inner as unknown) && (inner as Cell).t === 'd') {
            return dateTime({input: (inner as Cell).v})
                .utc()
                .toDate();
        }
        return inner as number | string | Date;
    }
    if (isCell(val as unknown) && (val as Cell).t === 'd') {
        return dateTime({input: (val as Cell).v})
            .utc()
            .toDate();
    }
    return val as number | string | Date;
}

function getNumFmt(val: unknown): string | undefined {
    if (isStyledXlsxCell(val) && val.z) {
        return String(val.z).replace(/y/g, 'y').replace(/m/g, 'm').replace(/d/g, 'd');
    }
    return undefined;
}

function colIndexToLetters(col: number): string {
    let s = '';
    let c = col;
    while (c > 0) {
        const r = (c - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        c = Math.floor((c - 1) / 26);
    }
    return s;
}

/** Цвет шапки = цвет блока ИТОГО (эталон сводной) */
const PIVOT_HEADER_FILL_ARGB = 'FFD3D3D3';

/** Границы того же цвета, что заливка шапки Excel — «невидимая» обводка для ячейки Measure names */
const headerFillBorder: Partial<ExcelJS.Borders> = {
    top: {style: 'thin', color: {argb: PIVOT_HEADER_FILL_ARGB}},
    left: {style: 'thin', color: {argb: PIVOT_HEADER_FILL_ARGB}},
    bottom: {style: 'thin', color: {argb: PIVOT_HEADER_FILL_ARGB}},
    right: {style: 'thin', color: {argb: PIVOT_HEADER_FILL_ARGB}},
};

function findMeasureNamesColumnIndex(row1: string[], row2: string[]): number | undefined {
    if (!row1?.length) {
        return undefined;
    }
    const re = /measure\s*names/i;
    for (let i = 0; i < row1.length; i++) {
        if (re.test(String(row1[i] ?? '')) || re.test(String(row2[i] ?? ''))) {
            return i;
        }
    }
    return undefined;
}

/** Шапка (2 строки): чёрные границы; ячейка Measure names — «невидимая» обводка под заливку */
function enforcePivotHeaderBorders(
    worksheet: ExcelJS.Worksheet,
    colCount: number,
    measureNamesCol0?: number,
) {
    for (let c = 1; c <= colCount; c++) {
        const isMn = measureNamesCol0 !== undefined && c - 1 === measureNamesCol0;
        for (let r = 1; r <= 2; r++) {
            const cell = worksheet.getRow(r).getCell(c);
            // Для вертикально merged ячеек (например скрытое Measure names) не ставим бордер на нижнюю
            // «дочернюю» ячейку, иначе Excel рисует лишнюю горизонтальную линию посередине блока.
            if (r === 2 && cell.isMerged) {
                continue;
            }
            if (isMn) {
                applyBorder(cell, headerFillBorder);
            } else {
                applyBorder(cell, blackBorder);
            }
        }
    }
}

/** Вертикальное объединение подряд идущих одинаковых значений в колонке (1-based col, Excel rows) */
function mergeConsecutiveInColumn(
    worksheet: ExcelJS.Worksheet,
    col1Based: number,
    startRow: number,
    endRowInclusive: number,
) {
    if (endRowInclusive < startRow) {
        return;
    }
    const L = colIndexToLetters(col1Based);
    const cellStr = (val: unknown) => (val === null || val === undefined ? '' : String(val).trim());

    let r = startRow;
    while (r <= endRowInclusive) {
        const v = worksheet.getRow(r).getCell(col1Based).value;
        const vs = cellStr(v);
        if (vs === '') {
            r++;
            continue;
        }
        let r2 = r + 1;
        while (
            r2 <= endRowInclusive &&
            cellStr(worksheet.getRow(r2).getCell(col1Based).value) === vs
        ) {
            r2++;
        }
        const span = r2 - r;
        if (span > 1) {
            try {
                worksheet.mergeCells(`${L}${r}:${L}${r2 - 1}`);
            } catch {
                /* ignore */
            }
        }
        r = r2;
    }
}

/** Весь блок футера — чёрные границы (включая линию тело/футер и пересечения) */
function applyPivotFooterBlockBorders(
    worksheet: ExcelJS.Worksheet,
    firstFooterRow: number,
    lastFooterRow: number,
    colCount: number,
) {
    for (let r = firstFooterRow; r <= lastFooterRow; r++) {
        for (let c = 1; c <= colCount; c++) {
            const cell = worksheet.getRow(r).getCell(c);
            applyBorder(cell, blackBorder);
        }
    }
}

/** На первой строке футера — тонкая чёрная верхняя граница (как нижняя граница блока ИТОГО). Без medium: иначе + нижняя линия тела давали «супер-жирную» линию. */
function enforcePivotFooterTopBorder(
    worksheet: ExcelJS.Worksheet,
    firstFooterRow: number,
    colCount: number,
) {
    for (let c = 1; c <= colCount; c++) {
        const cell = worksheet.getRow(firstFooterRow).getCell(c);
        const prev = cell.border ?? {};
        cell.border = {
            ...prev,
            top: blackBorder.top,
        };
    }
}

/**
 * Excel Online не всегда рисует top у merged A:B в футере.
 * Дублируем разделитель как bottom у последней строки тела только в A:B (тонкий, чёрный).
 */
function enforceItogoLabelTopViaBodyBottom(worksheet: ExcelJS.Worksheet, lastBodyRowExcel: number) {
    for (const c of [1, 2]) {
        const cell = worksheet.getRow(lastBodyRowExcel).getCell(c);
        const prev = cell.border ?? {};
        cell.border = {
            ...prev,
            bottom: blackBorder.bottom,
        };
    }
}

/** Две строки шапки + вертикальные merge, где верхняя строка пустая (колонки «Рейс», «Напр-е», …) */
function writeTwoRowHeaders(
    worksheet: ExcelJS.Worksheet,
    row1: string[],
    row2: string[],
    colCount: number,
) {
    const r1 = worksheet.getRow(1);
    const r2 = worksheet.getRow(2);
    r1.height = 18;
    r2.height = 18;

    for (let i = 0; i < colCount; i++) {
        const c = i + 1;
        const top = row1[i] ?? '';
        const bottom = row2[i] ?? '';
        const L = colIndexToLetters(c);

        if (!top && bottom) {
            const cell = r1.getCell(c);
            cell.value = bottom;
            cell.font = {bold: false, size: 11};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
            };
            cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            applyBorder(cell, blackBorder);
            worksheet.mergeCells(`${L}1:${L}2`);
        } else if (!top && !bottom) {
            /* Скрытый заголовок (обе строки пустые): одна merged-ячейка — иначе две с border дают линию посередине */
            const cell = r1.getCell(c);
            cell.value = '';
            cell.font = {bold: false, size: 11};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
            };
            cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            applyBorder(cell, blackBorder);
            worksheet.mergeCells(`${L}1:${L}2`);
        } else if (top && !bottom) {
            /*
             * Типично для Measure names: в дереве есть родитель (верх), имя листа пустое.
             * Две отдельные ячейки с чёрной обводкой дают видимую горизонталь между строками 1 и 2.
             */
            const cell = r1.getCell(c);
            cell.value = top;
            cell.font = {bold: false, size: 11};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
            };
            cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            applyBorder(cell, blackBorder);
            worksheet.mergeCells(`${L}1:${L}2`);
        } else {
            const cell1 = r1.getCell(c);
            cell1.value = top;
            cell1.font = {bold: false, size: 11};
            cell1.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
            };
            cell1.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            applyBorder(cell1, blackBorder);

            const cell2 = r2.getCell(c);
            cell2.value = bottom;
            cell2.font = {bold: false, size: 11};
            cell2.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
            };
            cell2.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            applyBorder(cell2, blackBorder);
        }
    }
}

export type ChartDataWithStyles = {
    widgetKey?: string;
    categories_ms?: number[];
    categories?: string[] | number[];
    graphs: Graph[];
    /** Параллель сетке таблицы: [строка][колонка] — css backgroundColor из cell.css (export.js) */
    cellStyles?: (string | null)[][];
    /** Сырое дерево шапки сводной (для 2 строк в Excel) */
    tableHead?: unknown;
    xlsxFooterMeta?: {
        bodyRowCount: number;
        footerRowCount: number;
        mergeFooterItogoLabel?: boolean;
    };
};

export function xlsxConverter(
    req: Request,
    res: Response,
    chartData: ChartDataWithStyles,
    dataArray: number[],
    downloadConfig: {
        filename: string;
    },
) {
    const {ctx} = req;
    ctx.log('EXPORT_XLS');
    const reqDataLength = req.body.data.length;

    if (reqDataLength > XLS_DATA_LIMIT) {
        ctx.logError(`EXPORT_XLS_DATA_LIMIT_ERROR`, {
            bytes: reqDataLength,
        });
        res.sendStatus(413);
        return;
    }

    const titleRow: (string | number)[] = [];
    if (chartData.categories_ms || chartData.categories) {
        titleRow.push('');
    }
    chartData.graphs.forEach((graph) => {
        titleRow.push(graph.title ?? '');
    });

    const rows: Row[] = [];
    const cellStyles = chartData.cellStyles;

    ctx.log('EXPORT_XLS_START_PREPARING');

    dataArray.forEach((item, i) => {
        let row: Row;
        if (item !== undefined && item !== null) {
            row = chartData.categories_ms ? [new Date(item)] : [item];
        } else {
            row = [];
        }

        chartData.graphs.forEach((graph) => {
            const dataItem = graph.data[i] as number[];
            if (dataItem && dataItem.length >= MAX_EXCEL_CELL_LENGTH) {
                const cell = dataItem.slice(0, MAX_EXCEL_CELL_LENGTH - 3) + '...';
                (row as string[]).push(cell);
            } else {
                let cellData = graph.data[i] as Cell;
                if (graph.type === 'diff' && Array.isArray(cellData)) {
                    cellData = cellData[0];
                }

                if (isCell(cellData) && cellData.t === 'd') {
                    cellData = {
                        ...cellData,
                        v: dateTime({input: cellData.v}).utc().toDate(),
                    } as Cell;
                }

                row.push(cellData as unknown as Row[number]);
            }
        });

        rows.push(row);
    });
    ctx.log('EXPORT_XLS_FINISH_PREPARING');

    ctx.log('EXPORT_XLS_ADD_WORKBOOK_SHEET');

    const workbook = new ExcelJS.Workbook();
    const templatePath = getWorkSheetTemplatePath(chartData.widgetKey);

    const run = async () => {
        let worksheet: ExcelJS.Worksheet;
        let startDataRow = 1;

        if (templatePath) {
            await workbook.xlsx.readFile(templatePath);
            worksheet = workbook.worksheets[0] || workbook.addWorksheet('Chart data');
            startDataRow = (worksheet.lastRow?.number ?? 0) + 1;
        } else {
            worksheet = workbook.addWorksheet('Chart data');
            const twoRows = extractTwoHeaderRowsFromHead(chartData.tableHead, titleRow.length);
            if (twoRows && twoRows.row1.length === titleRow.length) {
                writeTwoRowHeaders(worksheet, twoRows.row1, twoRows.row2, titleRow.length);
                enforcePivotHeaderBorders(
                    worksheet,
                    titleRow.length,
                    findMeasureNamesColumnIndex(twoRows.row1, twoRows.row2),
                );
                startDataRow = 3;
            } else {
                const headerRow = worksheet.getRow(1);
                titleRow.forEach((title, c) => {
                    const cell = headerRow.getCell(c + 1);
                    cell.value = title;
                    cell.font = {bold: false, size: 11};
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb: PIVOT_HEADER_FILL_ARGB},
                    };
                    applyBorder(cell, blackBorder);
                    cell.alignment = {vertical: 'middle', horizontal: 'center'};
                });
                headerRow.height = 20;
                startDataRow = 2;
            }
        }

        const stylesAligned =
            cellStyles &&
            cellStyles.length === rows.length &&
            cellStyles.every((sr, idx) => sr && sr.length === rows[idx]?.length);

        const footerMeta = chartData.xlsxFooterMeta;

        rows.forEach((row, ri) => {
            const excelRow = worksheet.getRow(startDataRow + ri);
            const isFirstBodyRow = ri === 0;
            const inFooter =
                footerMeta &&
                ri >= footerMeta.bodyRowCount &&
                ri < footerMeta.bodyRowCount + footerMeta.footerRowCount;

            row.forEach((cellVal, ci) => {
                const cell = excelRow.getCell(ci + 1);
                const plain = getPlainCellValue(cellVal);
                cell.value = plain === null ? '' : plain;
                const nf = getNumFmt(cellVal);
                if (nf) {
                    cell.numFmt = nf;
                }
                if (ci < 2 && !inFooter) {
                    cell.alignment = {horizontal: 'center', vertical: 'top'};
                } else if (typeof plain === 'number') {
                    cell.alignment = {horizontal: 'right', vertical: 'middle'};
                } else {
                    cell.alignment = {vertical: 'middle'};
                }

                const bgCss = stylesAligned ? cellStyles?.[ri]?.[ci] ?? null : null;
                const argb = cssBackgroundToArgb(bgCss);
                if (argb) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb},
                    };
                }

                if (inFooter) {
                    cell.border = thinBorder;
                } else if (isFirstBodyRow) {
                    cell.border = {
                        top: blackBorder.top,
                        left: thinBorder.left,
                        bottom: thinBorder.bottom,
                        right: thinBorder.right,
                    };
                } else {
                    cell.border = thinBorder;
                }
            });
        });

        const bodyRowCount = footerMeta?.bodyRowCount ?? rows.length;
        if (bodyRowCount > 0 && !templatePath) {
            mergeConsecutiveInColumn(worksheet, 1, startDataRow, startDataRow + bodyRowCount - 1);
            mergeConsecutiveInColumn(worksheet, 2, startDataRow, startDataRow + bodyRowCount - 1);
        }
        if (footerMeta && footerMeta.footerRowCount > 0) {
            const fr = startDataRow + footerMeta.bodyRowCount;
            const lr = fr + footerMeta.footerRowCount - 1;
            applyPivotFooterBlockBorders(worksheet, fr, lr, titleRow.length);
            // После merge Excel иногда ослабляет верхнюю линию на старте блока ИТОГО.
            enforcePivotFooterTopBorder(worksheet, fr, titleRow.length);
        }

        if (
            footerMeta?.mergeFooterItogoLabel &&
            footerMeta.footerRowCount >= 2 &&
            footerMeta.bodyRowCount >= 0
        ) {
            const fr = startDataRow + footerMeta.bodyRowCount;
            const lr = fr + footerMeta.footerRowCount - 1;
            const L1 = colIndexToLetters(1);
            const L2 = colIndexToLetters(2);
            try {
                worksheet.mergeCells(`${L1}${fr}:${L2}${lr}`);
                const corner = worksheet.getCell(fr, 1);
                corner.value = 'ИТОГО';
                corner.font = {bold: false, size: 11};
                corner.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
                corner.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD3D3D3'}};
                applyBorder(corner, blackBorder);
            } catch (e) {
                ctx.log(`EXPORT_XLS_FOOTER_MERGE ${e}`);
            }
        }
        if (footerMeta && footerMeta.footerRowCount > 0) {
            const fr = startDataRow + footerMeta.bodyRowCount;
            // После merge A:B у "ИТОГО" Excel может съесть верхнюю линию над merged-блоком.
            // Повторно фиксируем верхнюю черную границу уже на финальной структуре ячеек.
            enforcePivotFooterTopBorder(worksheet, fr, titleRow.length);
            if (bodyRowCount > 0) {
                const lastBodyRow = startDataRow + bodyRowCount - 1;
                enforceItogoLabelTopViaBodyBottom(worksheet, lastBodyRow);
            }
        }

        worksheet.views = [{state: 'normal', showGridLines: true}];

        const mimeType = mime.lookup('.xlsx');
        res.setHeader(
            'Content-disposition',
            `attachment; filename=${downloadConfig.filename}.xlsx`,
        );
        res.setHeader(
            'Content-type',
            mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        const file = path.join(os.tmpdir(), `${uuidv4()}.xlsx`);

        await workbook.xlsx.writeFile(file);
        ctx.log('EXPORT_XLS_FILE_IS_WRITTEN');

        const fileStream = fs.createReadStream(file);
        fileStream.on('error', (err: Error) => {
            ctx.logError('EXPORT_XLS_STREAM_ERROR', err);
            if (!res.headersSent) {
                res.sendStatus(500);
            }
        });
        fileStream.pipe(res);
        res.on('finish', () => {
            unlink(file).catch((e) => ctx.log(`unlink ${e.message}`));
        });
    };

    run().catch((error: Error) => {
        ctx.log(`EXPORT_XLS_ASYNC_ERROR ${error.message}`);
        res.sendStatus(500);
    });
}
