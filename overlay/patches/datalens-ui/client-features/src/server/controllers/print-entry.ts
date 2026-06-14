/**
 * POST /print-entry — экспорт чарта в PDF.
 *
 * Режим по умолчанию (**auto**): корпоративный **растровый** PDF (A4, поля ГОСТ, Times New Roman,
 * нумерация страниц) с многостраничной разбивкой по ширине и высоте — графики и сводные не обрезаются.
 * Векторный Chromium print (PUPPETEER_PDF_MODE=vector) — только для простых таблиц без canvas/SVG.
 *
 * Fallback/visual mode: PNG-скриншот + pdf-lib (как в Superset).
 *
 * body: { links: string[], host: string, previewPath?: string, urlQuery?: string, options?: object }
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {Request, Response} from '@gravity-ui/expresskit';
import {PDFDocument, StandardFonts, rgb} from 'pdf-lib';
import puppeteer, {type Browser, type Page} from 'puppeteer';

import {rewritePreviewPathEntryIds, resolveUsEntryId} from '../../shared/modules/encode-entry-id';
import {SCR_USER_AGENT_HEADER_VALUE} from '../../shared';

/** Минимальный размер PNG-скриншота (байт), иначе считаем съёмку неудачной. */
const MIN_SCREENSHOT_PNG_BYTES = 2500;
/** Минимальный размер векторного PDF (байт) — отсекает пустой page.pdf(). */
const MIN_VECTOR_PDF_BYTES = 3500;
/** Поля страницы A4 по ГОСТ Р 7.0.97-2016 (мм): левое 30, правое 15, верх/низ 20. */
const GOST_PAGE_MARGINS_MM = {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '30mm',
} as const;
/** Ограничение размера страницы PDF (pt), чтобы не упираться в лимиты просмотрщиков. */
/**
 * Предел размеров viewport перед скриншотом (без fullPage — надёжнее, чем fullPage в Chromium).
 * Слишком большой viewport может падать по памяти; при необходимости увеличьте под инфраструктуру.
 */
const MAX_VIEWPORT_WIDTH_PX = 8192;
const MAX_VIEWPORT_HEIGHT_PX = 24576;
/** 1 mm → PDF points (pt). */
const MM_TO_PT = 72 / 25.4;
const GOST_MARGIN_PT = {
    top: 20 * MM_TO_PT,
    right: 15 * MM_TO_PT,
    bottom: 20 * MM_TO_PT,
    left: 30 * MM_TO_PT,
} as const;
/** pdf-lib StandardFonts — только WinAnsi; кириллица в drawText даёт 500. */
const MAX_RASTER_PDF_PAGES = 200;
/** Предел пикселей в одном PNG-скриншоте (ширина × высота) — иначе Chromium падает по памяти. */
const MAX_CAPTURE_PIXELS = 100_000_000;

/** Пустые ds=/dt1= в preview перебивают default датасета → пустой PDF. */
function stripEmptyQueryParams(pathOrUrl: string): string {
    const qIndex = pathOrUrl.indexOf('?');
    if (qIndex < 0) {
        return pathOrUrl;
    }
    const base = pathOrUrl.slice(0, qIndex);
    const query = pathOrUrl.slice(qIndex + 1);
    const kept = query
        .split('&')
        .filter((pair) => {
            const eq = pair.indexOf('=');
            if (eq < 0) {
                return pair.length > 0;
            }
            const value = decodeURIComponent(pair.slice(eq + 1));
            return value.trim() !== '';
        })
        .join('&');
    return kept ? `${base}?${kept}` : base;
}

async function waitForChartPreviewReady(page: Page, timeoutMs: number): Promise<void> {
    await page.evaluate((timeout) => {
        return new Promise<void>((resolve, reject) => {
            const ref: {t?: ReturnType<typeof setTimeout>} = {};
            const cleanup = () => {
                if (ref.t !== undefined) {
                    clearTimeout(ref.t);
                }
                window.removeEventListener('chart-preview.done', onDone, true);
                window.removeEventListener('chart-preview.error', onErr, true);
            };
            const onDone = () => {
                cleanup();
                resolve();
            };
            const onErr = (ev: Event) => {
                cleanup();
                let msg = 'chart-preview.error';
                try {
                    const detail = (ev as CustomEvent<unknown>).detail;
                    msg += `: ${typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : String(detail)}`;
                } catch {
                    msg += ' (detail unavailable)';
                }
                reject(new Error(msg));
            };
            ref.t = setTimeout(() => {
                cleanup();
                reject(
                    new Error(
                        'Timeout waiting for chart preview (chart-preview.done / chart-preview.error)',
                    ),
                );
            }, timeout);
            window.addEventListener('chart-preview.done', onDone, true);
            window.addEventListener('chart-preview.error', onErr, true);
        });
    }, timeoutMs);
}

async function waitForPrintableChartContent(page: Page, timeoutMs: number): Promise<void> {
    await page.waitForFunction(
        () => {
            const isVisible = (el: Element | null): el is HTMLElement => {
                if (!(el instanceof HTMLElement)) {
                    return false;
                }
                const style = window.getComputedStyle(el);
                if (
                    style.display === 'none' ||
                    style.visibility === 'hidden' ||
                    Number(style.opacity) === 0
                ) {
                    return false;
                }
                const rect = el.getBoundingClientRect();
                return rect.width > 60 && rect.height > 60;
            };

            const preparedTables = document.querySelectorAll(
                'table.dl-table_prepared, .chartkit-table table, .dl-table table, table.chartkit-table__table',
            );
            for (let i = 0; i < preparedTables.length; i++) {
                const table = preparedTables[i];
                if (!(table instanceof HTMLTableElement)) {
                    continue;
                }
                if (table.closest('.dl-table__background-table') !== null) {
                    continue;
                }
                const pendingWrapper = table.closest('.dl-table__table-wrapper_pending');
                if (pendingWrapper instanceof HTMLElement) {
                    pendingWrapper.classList.remove('dl-table__table-wrapper_pending');
                    pendingWrapper.style.visibility = 'visible';
                    pendingWrapper.style.opacity = '1';
                }
                if (!isVisible(table)) {
                    continue;
                }
                const textLen = (table.innerText || '').replace(/\s+/g, ' ').trim().length;
                const hasHeader = table.querySelector('thead th, thead td') !== null;
                const bodyRows = table.querySelectorAll(
                    'tbody tr, .dl-table__body .dl-table__tr',
                ).length;
                if (textLen < 60 || bodyRows < 1 || !hasHeader) {
                    continue;
                }
                return true;
            }

            const chart = document.querySelector(
                '.chart-preview .highcharts-root, .chart-preview .g-charts, .chart-preview .chartkit-graph, ' +
                    '.snapter-container .highcharts-root, .snapter-container .g-charts, .chartkit-graph',
            );
            if (isVisible(chart)) {
                const svg = chart?.querySelector('svg');
                if (svg instanceof SVGSVGElement) {
                    const bbox = svg.getBoundingClientRect();
                    if (bbox.width > 40 && bbox.height > 40) {
                        return true;
                    }
                }
                return true;
            }

            const canvasInChart = document.querySelector(
                '.chart-preview canvas, .snapter-container canvas, .chartkit-scrollable__content canvas',
            );
            if (isVisible(canvasInChart)) {
                return true;
            }
            return false;
        },
        {timeout: timeoutMs},
    );
}

async function waitForPreviewShellReady(page: Page, timeoutMs: number): Promise<void> {
    await page
        .waitForFunction(
            () => {
                if (document.querySelector('.preview__loader')) {
                    return false;
                }
                const chartRoot =
                    document.querySelector('.chartkit-base') ||
                    document.querySelector('.snapter-container') ||
                    document.querySelector('.chartkit-error');
                return chartRoot instanceof HTMLElement;
            },
            {timeout: timeoutMs},
        )
        .catch(() => {
            /* fallback to printable-content wait */
        });
}

async function waitForPreviewOrPrintableContent(page: Page, timeoutMs: number): Promise<void> {
    try {
        await waitForChartPreviewReady(page, timeoutMs);
        return;
    } catch {
        /* chart-preview.done may never fire; chart-preview.error should not block raster capture */
    }
    try {
        await waitForPrintableChartContent(page, timeoutMs);
    } catch {
        /* best-effort before raster fallback */
    }
}

/** До загрузки DOM: только медиа-запрос (без evaluate). */
async function setPreferLightColorScheme(page: Page): Promise<void> {
    try {
        await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: 'light'}]);
    } catch {
        /* Puppeteer без emulateMediaFeatures */
    }
}

/**
 * В headless нет userSettings/cookie — часто берётся тёмная тема (Windows + prefers-color-scheme),
 * скриншот получается «чёрным экраном». Для PDF нужна светлая схема как у обычного отчёта.
 */
async function applyLightAppearanceForPdfCapture(page: Page): Promise<void> {
    await setPreferLightColorScheme(page);

    await page.evaluate(() => {
        const toLight = (el: Element) => {
            if (!(el instanceof HTMLElement)) {
                return;
            }
            el.classList.remove('g-root_theme_dark', 'g-root_theme_dark-hc');
            if (!el.classList.contains('g-root_theme_light')) {
                el.classList.add('g-root_theme_light');
            }
        };

        toLight(document.documentElement);
        if (document.body) {
            toLight(document.body);
        }
        document.querySelectorAll('.g-root_theme_dark, .g-root_theme_dark-hc').forEach(toLight);
        document.querySelectorAll('.app-root').forEach(toLight);
    });
}

function parseCookieHeaderForPuppeteer(
    cookieHeader: string,
    url: string,
): Parameters<Page['setCookie']>[number][] {
    if (!cookieHeader.trim()) {
        return [];
    }

    const cookies: Parameters<Page['setCookie']>[number][] = [];
    for (const partRaw of cookieHeader.split(';')) {
        const part = partRaw.trim();
        if (!part) {
            continue;
        }
        const eqIdx = part.indexOf('=');
        if (eqIdx < 1) {
            continue;
        }
        const name = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1).trim();
        if (!name) {
            continue;
        }
        cookies.push({name, value, url});
    }
    return cookies;
}

async function applyRequestAuthToPreviewPage(
    page: Page,
    req: Request,
    previewUrl: string,
    token: string,
): Promise<void> {
    const cookieHeader = String(req.headers.cookie ?? '');
    const headers: Record<string, string> = {};

    if (token) {
        headers['x-rpc-authorization'] = token;
    }
    if (cookieHeader) {
        headers.cookie = cookieHeader;
    }
    if (Object.keys(headers).length) {
        await page.setExtraHTTPHeaders(headers);
    }

    const cookies = parseCookieHeaderForPuppeteer(cookieHeader, previewUrl);
    if (cookies.length) {
        await page.setCookie(...cookies);
    }
}

async function assertPreviewDidNotOpenLogin(page: Page): Promise<void> {
    const loginInfo = await page.evaluate(() => {
        const password = document.querySelector('input[type="password"]');
        const text = (document.body?.innerText || '').toLowerCase();
        const hasLoginText =
            text.includes('ydl') &&
            (text.includes('логин') || text.includes('пароль') || text.includes('войти'));
        return {
            isLogin: Boolean(password) && hasLoginText,
            title: document.title,
            path: window.location.pathname,
        };
    });

    if (loginInfo.isLogin) {
        throw new Error(
            `PDF preview opened login page instead of dashboard (${loginInfo.title}, ${loginInfo.path})`,
        );
    }
}

/**
 * Корпоративная вёрстка печати: A4, поля ГОСТ, шрифт Times, сохранение цветов таблиц.
 * Текст и таблица остаются векторными (Chromium print-to-PDF), не растровым скриншотом.
 */
async function applyCorporatePrintStyles(page: Page, title?: string): Promise<void> {
    const docTitle = (title || 'Отчёт').replace(/[<>&"]/g, '');
    await page.emulateMediaType('print');
    await page.addStyleTag({
        content: `
            @page {
                size: A4 portrait;
                margin: ${GOST_PAGE_MARGINS_MM.top} ${GOST_PAGE_MARGINS_MM.right} ${GOST_PAGE_MARGINS_MM.bottom} ${GOST_PAGE_MARGINS_MM.left};
            }
            html, body {
                font-family: "Times New Roman", Times, serif !important;
                font-size: 12pt !important;
                line-height: 1.25 !important;
                color: #000000 !important;
                background: #ffffff !important;
            }
            .chartkit-table, .dl-table, table.dl-table_prepared {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .chartkit-loader { display: none !important; }
            .dl-table__background-table,
            .background-table { display: none !important; }
            html, body, .chartkit-base, .chartkit-base__body {
                height: auto !important;
                min-height: 0 !important;
            }
        `,
    });
    await page.evaluate((t) => {
        document.title = t;
    }, docTitle);
}

async function buildCorporateVectorPdfFromPage(
    page: Page,
    options?: {landscape?: boolean; title?: string},
): Promise<Buffer> {
    await applyCorporatePrintStyles(page, options?.title);

    const pdfBytes = await page.pdf({
        format: 'A4',
        landscape: Boolean(options?.landscape),
        printBackground: true,
        preferCSSPageSize: true,
        margin: {...GOST_PAGE_MARGINS_MM},
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="width:100%;font-size:8pt;font-family:'Times New Roman',Times,serif;
                color:#333;padding:0 30mm 0 30mm;box-sizing:border-box;">
                <span>${(options?.title || 'Отчёт').replace(/[<>&"]/g, '')}</span>
            </div>`,
        footerTemplate: `
            <div style="width:100%;font-size:8pt;font-family:'Times New Roman',Times,serif;
                color:#666;text-align:center;padding:0 15mm;">
                <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>`,
    });

    const buf = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
    if (buf.length < MIN_VECTOR_PDF_BYTES) {
        throw new Error(
            `Vector PDF is too small (${buf.length} B) — Chromium print layout may be empty`,
        );
    }
    return buf;
}

/** Растровый fallback, если векторная печать недоступна или даёт пустой файл. */
const MIN_RASTER_PDF_BYTES = 2500;

type RasterPdfOptions = {
    landscape?: boolean;
    title?: string;
};

/** Снимок (PNG) → корпоративный PDF: A4 + ГОСТ, плитка по ширине и высоте. */
async function buildRasterPdfFromScreenshot(
    pngBytes: Buffer | Uint8Array,
    options?: RasterPdfOptions,
): Promise<Buffer> {
    const bytes = Buffer.isBuffer(pngBytes) ? pngBytes : Buffer.from(pngBytes);
    if (bytes.length < MIN_SCREENSHOT_PNG_BYTES) {
        throw new Error(
            `Screenshot is too small (${bytes.length} B) — page may be blank or capture failed`,
        );
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const image = await pdfDoc.embedPng(bytes);
    const imgW = image.width;
    const imgH = image.height;

    const useLandscape =
        options?.landscape === true ||
        (options?.landscape !== false && (imgW > imgH * 1.12 || imgW > 1050));
    const pageW = useLandscape ? 841.89 : 595.28;
    const pageH = useLandscape ? 595.28 : 841.89;
    const m = GOST_MARGIN_PT;
    const contentW = pageW - m.left - m.right;
    const contentH = pageH - m.top - m.bottom;

    let scale = Math.min(contentW / imgW, 1);
    const scaledH0 = imgH * scale;
    const pagesNeeded = Math.max(1, Math.ceil(scaledH0 / contentH));
    if (pagesNeeded > MAX_RASTER_PDF_PAGES) {
        scale *= MAX_RASTER_PDF_PAGES / pagesNeeded;
    }
    /** Не допускаем микроскопического масштаба — иначе PDF выглядит пустым. */
    const minScale = Math.min(contentW / imgW, contentH / imgH) * 0.35;
    if (scale < minScale) {
        scale = minScale;
    }
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const pages: ReturnType<PDFDocument['addPage']>[] = [];

    for (let tileY = 0; tileY < scaledH; tileY += contentH) {
        const page = pdfDoc.addPage([pageW, pageH]);
        pages.push(page);

        const drawY = pageH - m.top - scaledH + tileY;
        page.drawImage(image, {
            x: m.left,
            y: drawY,
            width: scaledW,
            height: scaledH,
        });
    }

    const totalPages = pages.length;
    pages.forEach((page, idx) => {
        const footer = `${idx + 1} / ${totalPages}`;
        const footerW = font.widthOfTextAtSize(footer, 8);
        page.drawText(footer, {
            x: (pageW - footerW) / 2,
            y: m.bottom / 2,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
        });
    });

    return Buffer.from(await pdfDoc.save());
}

/** Разворачиваем scroll и фиксируем светлую тему перед скриншотом. */
async function applyRasterCaptureStyles(page: Page): Promise<void> {
    await page.emulateMediaType('screen');
    await page.addStyleTag({
        content: `
            html { color-scheme: light !important; }
            html, body, #root, .app, .app-root, .dl-preview,
            .chartkit, .chartkit-base, .chartkit-scrollable-node,
            .snapter-container {
                background-color: #ffffff !important;
                color: #1a1a1a !important;
            }
            html, body, #root, .app, .dl-preview, .preview, .chartkit-base,
            .chartkit-base__body, .chartkit-scrollable-node,
            .chartkit-scrollable__content, .dl-table__table-wrapper {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
            }
            .chartkit-base { position: relative !important; min-height: min-content !important; }
            .chartkit-base__body { position: static !important; inset: auto !important; }
            .chartkit-loader { display: none !important; }
            .dl-table__background-table,
            .background-table { display: none !important; }
            .preview__loader { display: none !important; }
            table.dl-table_prepared tbody tr,
            .dl-table__body .dl-table__tr {
                visibility: visible !important;
                display: table-row !important;
            }
            .chartkit-table, .dl-table, table.dl-table_prepared {
                width: max-content !important;
                min-width: 100% !important;
                max-width: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .dl-table__table-wrapper_pending {
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
            .dl-preview, .preview, .chartkit-base__body {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
            }`,
    });
}

type PrintCaptureClip = {x: number; y: number; width: number; height: number};

/** Разворачиваем scroll и находим foreground-таблицу (не BackgroundTable для замеров ширины). */
async function prepareScrollableChartForCapture(page: Page): Promise<{width: number; height: number}> {
    const clip = await resolvePrintCaptureClip(page);
    if (clip && clip.width > 0 && clip.height > 0) {
        return {width: clip.width, height: clip.height};
    }
    return {width: 0, height: 0};
}

async function resolvePrintCaptureClip(page: Page): Promise<PrintCaptureClip | null> {
    return page.evaluate(() => {
        const isVisible = (el: Element | null): el is HTMLElement => {
            if (!(el instanceof HTMLElement)) {
                return false;
            }
            const style = window.getComputedStyle(el);
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) === 0
            ) {
                return false;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 40 && rect.height > 40;
        };

        const isForegroundTable = (table: Element): table is HTMLTableElement => {
            if (!(table instanceof HTMLTableElement)) {
                return false;
            }
            if (
                table.closest('.dl-table__background-table, .background-table') !== null
            ) {
                return false;
            }
            if (!isVisible(table)) {
                return false;
            }
            const textLen = (table.innerText || '').replace(/\s+/g, ' ').trim().length;
            const bodyRows = table.querySelectorAll('tbody tr, .dl-table__body .dl-table__tr').length;
            return textLen >= 40 && bodyRows >= 1;
        };

        const unlock = [
            'html',
            'body',
            '#root',
            '.dl-preview',
            '.app',
            '.chartkit-base',
            '.chartkit-base__body',
            '.chartkit-scrollable-node',
            '.chartkit-scrollable__content',
            '.dl-table__table-wrapper',
        ];
        unlock.forEach((sel) => {
            document.querySelectorAll(sel).forEach((node) => {
                if (node instanceof HTMLElement) {
                    node.style.overflow = 'visible';
                    node.style.maxHeight = 'none';
                    node.style.height = 'auto';
                }
            });
        });
        document.querySelectorAll('.dl-table__table-wrapper_pending').forEach((node) => {
            if (node instanceof HTMLElement) {
                node.classList.remove('dl-table__table-wrapper_pending');
                node.style.visibility = 'visible';
                node.style.opacity = '1';
            }
        });

        const tables = Array.from(document.querySelectorAll('table.dl-table_prepared')).filter(
            isForegroundTable,
        );
        let bestTable: HTMLTableElement | null = null;
        let bestArea = 0;
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const rect = table.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > bestArea) {
                bestArea = area;
                bestTable = table;
            }
        }

        if (bestTable) {
            const tableRect = bestTable.getBoundingClientRect();
            let top = tableRect.top;
            let left = tableRect.left;
            let right = tableRect.right;
            let bottom = tableRect.bottom;

            const chartBase = bestTable.closest('.chartkit-base');
            if (chartBase instanceof HTMLElement) {
                chartBase
                    .querySelectorAll(
                        '.chartkit-base__header, .chartkit-header, .chartkit-base__title-row, .chartkit-base__title, .chartkit-header__title',
                    )
                    .forEach((node) => {
                        if (!isVisible(node)) {
                            return;
                        }
                        const rect = node.getBoundingClientRect();
                        top = Math.min(top, rect.top);
                        left = Math.min(left, rect.left);
                        right = Math.max(right, rect.right);
                    });
                const baseRect = chartBase.getBoundingClientRect();
                left = Math.min(left, baseRect.left);
                right = Math.max(right, baseRect.right);
                bottom = Math.max(bottom, baseRect.bottom);
            }

            const wrapper = bestTable.closest(
                '.dl-table__table-wrapper, .chartkit-scrollable__content, .chartkit-base__body',
            );
            if (wrapper instanceof HTMLElement) {
                const wrapperRect = wrapper.getBoundingClientRect();
                left = Math.min(left, wrapperRect.left);
                right = Math.max(right, wrapperRect.right);
                bottom = Math.max(bottom, wrapperRect.bottom);
            }

            return {
                x: Math.max(0, Math.floor(left)),
                y: Math.max(0, Math.floor(top)),
                /** Видимый rect для clip; scrollWidth/Height — только для viewport (readTableScrollDimensions). */
                width: Math.max(80, Math.ceil(right - left)),
                height: Math.max(80, Math.ceil(bottom - top)),
            };
        }

        const chartBaseOnly = document.querySelector('.chartkit-base');
        if (isVisible(chartBaseOnly)) {
            const rect = chartBaseOnly!.getBoundingClientRect();
            const textLen = (chartBaseOnly!.innerText || '').replace(/\s+/g, ' ').trim().length;
            if (textLen >= 40) {
                return {
                    x: Math.max(0, Math.floor(rect.x)),
                    y: Math.max(0, Math.floor(rect.y)),
                    width: Math.max(120, Math.ceil(rect.width)),
                    height: Math.max(120, Math.ceil(rect.height)),
                };
            }
        }

        const chartSelectors = [
            '.chartkit-graph',
            '.highcharts-root',
            '.g-charts',
            '.yagrHost',
            '.snapter-container',
        ];
        for (let si = 0; si < chartSelectors.length; si++) {
            const nodes = document.querySelectorAll(chartSelectors[si]);
            for (let ni = 0; ni < nodes.length; ni++) {
                const node = nodes[ni];
                if (!isVisible(node)) {
                    continue;
                }
                const rect = node.getBoundingClientRect();
                return {
                    x: Math.max(0, Math.floor(rect.x)),
                    y: Math.max(0, Math.floor(rect.y)),
                    width: Math.max(80, Math.ceil(rect.width)),
                    height: Math.max(80, Math.ceil(rect.height)),
                };
            }
        }

        const chartBase = document.querySelector('.chartkit-base');
        if (isVisible(chartBase)) {
            const rect = chartBase!.getBoundingClientRect();
            return {
                x: Math.max(0, Math.floor(rect.x)),
                y: Math.max(0, Math.floor(rect.y)),
                width: Math.max(80, Math.ceil(rect.width)),
                height: Math.max(80, Math.ceil(rect.height)),
            };
        }

        return null;
    });
}

/**
 * Расширяем viewport до размеров документа и делаем снимок **без** fullPage — в Chromium
 * `page.screenshot({ fullPage: true })` для сложных страниц часто даёт пустой/белый PNG.
 * Если документ больше лимитов — оставляем типовой viewport и используем fullPage как fallback.
 */
async function findForegroundTableHandle(page: Page) {
    return page.evaluateHandle(() => {
        const isVisible = (el: Element | null): el is HTMLElement => {
            if (!(el instanceof HTMLElement)) {
                return false;
            }
            const style = window.getComputedStyle(el);
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) === 0
            ) {
                return false;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 40 && rect.height > 40;
        };
        const tables = Array.from(document.querySelectorAll('table.dl-table_prepared'));
        let best: HTMLTableElement | null = null;
        let bestArea = 0;
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            if (!(table instanceof HTMLTableElement)) {
                continue;
            }
            if (table.closest('.dl-table__background-table, .background-table') !== null) {
                continue;
            }
            if (!isVisible(table)) {
                continue;
            }
            const textLen = (table.innerText || '').replace(/\s+/g, ' ').trim().length;
            if (textLen < 40) {
                continue;
            }
            const rect = table.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > bestArea) {
                bestArea = area;
                best = table;
            }
        }
        return best;
    });
}

async function isPngMostlyBlank(page: Page, pngBytes: Buffer): Promise<boolean> {
    try {
        return await page.evaluate(async (b64) => {
            const img = new Image();
            const loaded = new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('png decode failed'));
                img.src = `data:image/png;base64,${b64}`;
            });
            await loaded;
            if (img.width < 2 || img.height < 2) {
                return true;
            }
            const canvas = document.createElement('canvas');
            const sw = Math.min(img.width, 96);
            const sh = Math.min(img.height, 96);
            canvas.width = sw;
            canvas.height = sh;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return true;
            }
            ctx.drawImage(img, 0, 0, sw, sh);
            const px = ctx.getImageData(0, 0, sw, sh).data;
            let nonWhite = 0;
            for (let i = 0; i < px.length; i += 4) {
                const a = px[i + 3];
                if (a > 16 && (px[i] < 245 || px[i + 1] < 245 || px[i + 2] < 245)) {
                    nonWhite += 1;
                }
            }
            return nonWhite < 12;
        }, pngBytes.toString('base64'));
    } catch {
        return false;
    }
}

async function acceptPngCapture(page: Page, pngBytes: Buffer | Uint8Array): Promise<Buffer | null> {
    const buf = Buffer.isBuffer(pngBytes) ? pngBytes : Buffer.from(pngBytes);
    if (buf.length < MIN_SCREENSHOT_PNG_BYTES) {
        return null;
    }
    if (await isPngMostlyBlank(page, buf)) {
        return null;
    }
    return buf;
}

async function captureChartPng(
    page: Page,
    fullPageFallback: boolean,
): Promise<Buffer> {
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await new Promise<void>((r) => setTimeout(r, 120));

    const tableHandle = await findForegroundTableHandle(page);
    const tableElement = tableHandle.asElement();
    if (tableElement) {
        try {
            const elementPng = await tableElement.screenshot({
                type: 'png',
                captureBeyondViewport: true,
                omitBackground: false,
            });
            const accepted = await acceptPngCapture(page, elementPng);
            if (accepted) {
                return accepted;
            }
        } finally {
            await tableHandle.dispose();
        }
    } else {
        await tableHandle.dispose();
    }

    const chartBaseHandle = await page.$('.chartkit-base');
    if (chartBaseHandle) {
        try {
            const elementPng = await chartBaseHandle.screenshot({
                type: 'png',
                captureBeyondViewport: true,
                omitBackground: false,
            });
            const accepted = await acceptPngCapture(page, elementPng);
            if (accepted) {
                return accepted;
            }
        } finally {
            await chartBaseHandle.dispose();
        }
    }

    const clip = await resolvePrintCaptureClip(page);
    if (clip && clip.width > 80 && clip.height > 80) {
        const padding = 10;
        const clipRect = {
            x: Math.max(0, clip.x - padding),
            y: Math.max(0, clip.y - padding),
            width: clip.width + padding * 2,
            height: clip.height + padding * 2,
        };
        if (clipRect.width > 80 && clipRect.height > 80) {
            const clippedPng = await page.screenshot({
                type: 'png',
                clip: clipRect,
                captureBeyondViewport: true,
                omitBackground: false,
            });
            const clippedBuf = Buffer.isBuffer(clippedPng)
                ? clippedPng
                : Buffer.from(clippedPng);
            const accepted = await acceptPngCapture(page, clippedBuf);
            if (accepted) {
                return accepted;
            }
        }
    }

    const captureSelector = await page.evaluate(() => {
        const visible = (el: Element | null): el is HTMLElement => {
            if (!(el instanceof HTMLElement)) {
                return false;
            }
            const style = window.getComputedStyle(el);
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) === 0
            ) {
                return false;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 80 && rect.height > 80;
        };
        const selectors = [
            '.chartkit-graph',
            '.highcharts-root',
            '.g-charts',
            '.snapter-container',
            '.chartkit-base',
        ];
        for (let i = 0; i < selectors.length; i++) {
            const nodes = document.querySelectorAll(selectors[i]);
            for (let j = 0; j < nodes.length; j++) {
                if (visible(nodes[j])) {
                    return selectors[i];
                }
            }
        }
        return null;
    });

    if (captureSelector) {
        const handle = await page.$(captureSelector);
        if (handle) {
            try {
                const elementPng = await handle.screenshot({
                    type: 'png',
                    captureBeyondViewport: true,
                    omitBackground: false,
                });
                const buf = Buffer.isBuffer(elementPng) ? elementPng : Buffer.from(elementPng);
                const accepted = await acceptPngCapture(page, buf);
                if (accepted) {
                    return accepted;
                }
            } finally {
                await handle.dispose();
            }
        }
    }

    const pngBytes = await page.screenshot({
        type: 'png',
        fullPage: fullPageFallback,
        captureBeyondViewport: fullPageFallback,
        omitBackground: false,
    });
    const accepted = await acceptPngCapture(page, pngBytes);
    if (accepted) {
        return accepted;
    }
    throw new Error('Screenshot capture returned blank PNG — table may not have rendered in preview');
}

async function assertScreenshotHasChartContent(page: Page, pngBytes: Buffer): Promise<void> {
    const visual = await page.evaluate(() => {
        const root =
            (document.querySelector('.chartkit-base') as HTMLElement | null) ||
            (document.querySelector('.dl-preview') as HTMLElement | null) ||
            (document.querySelector('.chart-preview') as HTMLElement | null) ||
            (document.querySelector('.snapter-container') as HTMLElement | null);

        const tableRows = document.querySelectorAll(
            'table.dl-table_prepared tbody tr, table.chartkit-table__table tbody tr, .dl-table table tbody tr, ' +
                '.dl-table__body .dl-table__tr',
        ).length;
        const tableHeaders = document.querySelectorAll(
            'table.dl-table_prepared thead th, table.chartkit-table__table thead th, .dl-table table thead th, ' +
                '.dl-table__header .dl-table__th, .dl-table__th',
        ).length;
        const pieSlices = document.querySelectorAll(
            '.highcharts-point, .highcharts-series path, .g-charts path, .chartkit-graph path, ' +
                '.chartkit-base svg path, .highcharts-series-group path',
        ).length;
        const legendItems = document.querySelectorAll(
            '.highcharts-legend-item, .g-legend-item, .chartkit-legend__item, ' +
                '[class*="legend"] text, [class*="legend"] tspan',
        ).length;
        const flatTableRows = document.querySelectorAll(
            '.dl-table tr, .dl-table__tr, .chartkit-table__row, .chartkit-table tbody tr, [role="row"]',
        ).length;
        const tableCells = document.querySelectorAll('.dl-table__td, .dl-table__th').length;
        const pivotCells = document.querySelectorAll(
            '.snapter-container td, .snapter-container th, .pivot-table td, .pivot-table th',
        ).length;
        const linePoints = document.querySelectorAll(
            '.highcharts-markers .highcharts-point, .highcharts-line-series path',
        ).length;

        let canvasPixels = 0;
        const canvases = (root || document).querySelectorAll(
            'canvas, .g-charts canvas, .chartkit-graph canvas, .chart-preview canvas',
        );
        for (let ci = 0; ci < canvases.length; ci++) {
            const canvas = canvases[ci];
            if (!(canvas instanceof HTMLCanvasElement) || canvas.width < 40 || canvas.height < 40) {
                continue;
            }
            try {
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    continue;
                }
                const sw = Math.min(canvas.width, 128);
                const sh = Math.min(canvas.height, 128);
                const sx = Math.max(0, Math.floor((canvas.width - sw) / 2));
                const sy = Math.max(0, Math.floor((canvas.height - sh) / 2));
                const sample = ctx.getImageData(sx, sy, sw, sh);
                for (let i = 0; i < sample.data.length; i += 4) {
                    const r = sample.data[i];
                    const g = sample.data[i + 1];
                    const b = sample.data[i + 2];
                    const a = sample.data[i + 3];
                    if (a > 16 && (r < 245 || g < 245 || b < 245)) {
                        canvasPixels += 1;
                    }
                }
            } catch {
                canvasPixels = -1;
                break;
            }
        }

        const bodyText = (root?.innerText || document.body?.innerText || '')
            .replace(/\s+/g, ' ')
            .trim();
        const titleOnly =
            bodyText.length < 40 &&
            tableRows === 0 &&
            tableHeaders === 0 &&
            flatTableRows === 0 &&
            pieSlices === 0 &&
            legendItems === 0 &&
            pivotCells === 0 &&
            linePoints === 0 &&
            canvasPixels <= 0;

        return {
            tableRows,
            tableHeaders,
            pieSlices,
            legendItems,
            flatTableRows,
            tableCells,
            pivotCells,
            linePoints,
            canvasPixels,
            bodyTextLen: bodyText.length,
            titleOnly,
        };
    });

    const hasVisual =
        visual.tableRows > 0 ||
        visual.flatTableRows > 3 ||
        visual.tableCells > 12 ||
        visual.pieSlices > 2 ||
        visual.legendItems > 2 ||
        visual.pivotCells > 4 ||
        visual.linePoints > 0 ||
        visual.canvasPixels > 12;

    const hasTableWithBody =
        (visual.tableRows > 0 || visual.flatTableRows > 2) && visual.bodyTextLen > 80;

    if ((hasVisual || hasTableWithBody) && !visual.titleOnly) {
        return;
    }

    throw new Error(
        `Screenshot has no chart content (png ${pngBytes.length} B, ` +
            `rows=${visual.tableRows}, headers=${visual.tableHeaders}, flatRows=${visual.flatTableRows}, cells=${visual.tableCells}, ` +
            `slices=${visual.pieSlices}, legend=${visual.legendItems}, ` +
            `pivot=${visual.pivotCells}, canvas=${visual.canvasPixels}, text=${visual.bodyTextLen})`,
    );
}

async function applyPdfCaptureScaleDownIfNeeded(page: Page): Promise<number> {
    return page.evaluate((maxPixels) => {
        const table = document.querySelector('table.dl-table_prepared');
        const target = (table?.closest('.chartkit-base') ?? table) as HTMLElement | null;
        if (!target) {
            return 1;
        }
        const w = Math.max(table?.scrollWidth ?? target.scrollWidth, target.getBoundingClientRect().width, 1);
        const h = Math.max(table?.scrollHeight ?? target.scrollHeight, target.getBoundingClientRect().height, 1);
        if (w * h <= maxPixels) {
            return 1;
        }
        const scale = Math.sqrt(maxPixels / (w * h));
        target.style.transform = `scale(${scale})`;
        target.style.transformOrigin = 'top left';
        const parent = target.parentElement;
        if (parent instanceof HTMLElement) {
            parent.style.overflow = 'visible';
        }
        return scale;
    }, MAX_CAPTURE_PIXELS);
}

async function readTableScrollDimensions(page: Page): Promise<{width: number; height: number}> {
    return page.evaluate(() => {
        const table = document.querySelector('table.dl-table_prepared');
        if (!(table instanceof HTMLTableElement)) {
            return {width: 0, height: 0};
        }
        return {
            width: Math.ceil(table.scrollWidth || table.getBoundingClientRect().width),
            height: Math.ceil(table.scrollHeight || table.getBoundingClientRect().height),
        };
    });
}

async function expandViewportToDocumentForScreenshot(
    page: Page,
    contentHint?: {width: number; height: number},
): Promise<boolean> {
    const clip = await resolvePrintCaptureClip(page);
    const tableDims = await readTableScrollDimensions(page);
    const w = Math.max(contentHint?.width ?? 0, clip?.width ?? 0, tableDims.width);
    const h = Math.max(contentHint?.height ?? 0, clip?.height ?? 0, tableDims.height);

    if (w > 0 && h > 0) {
        const vw = Math.min(Math.max(w + 48, 640), MAX_VIEWPORT_WIDTH_PX);
        const vh = Math.min(Math.max(h + 96, 480), MAX_VIEWPORT_HEIGHT_PX);
        await page.setViewport({width: vw, height: vh, deviceScaleFactor: 1});
        await new Promise<void>((r) => setTimeout(r, 450));
        return false;
    }

    const scrollDims = await page.evaluate(() => {
        const el = document.documentElement;
        const body = document.body;
        const chart = document.querySelector('.chartkit-base, .snapter-container');
        const chartRect = chart?.getBoundingClientRect();
        const w = Math.max(
            el?.scrollWidth ?? 0,
            body?.scrollWidth ?? 0,
            chartRect?.width ?? 0,
            el?.clientWidth ?? 0,
        );
        const h = Math.max(
            chartRect?.height ?? 0,
            el?.clientHeight ?? 0,
            body?.clientHeight ?? 0,
        );
        return {w, h};
    });

    const canFitOneViewport =
        scrollDims.w > 0 &&
        scrollDims.h > 0 &&
        scrollDims.w <= MAX_VIEWPORT_WIDTH_PX &&
        scrollDims.h <= MAX_VIEWPORT_HEIGHT_PX;

    if (canFitOneViewport) {
        const vw = Math.min(Math.max(scrollDims.w, 640), MAX_VIEWPORT_WIDTH_PX);
        const vh = Math.min(Math.max(scrollDims.h, 480), MAX_VIEWPORT_HEIGHT_PX);
        await page.setViewport({width: vw, height: vh, deviceScaleFactor: 1});
        await new Promise<void>((r) => setTimeout(r, 450));
        return false;
    }

    await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
    await new Promise<void>((r) => setTimeout(r, 250));
    return true;
}

let sharedBrowser: Browser | null = null;
let sharedBrowserLaunch: Promise<Browser> | null = null;

/**
 * Без `--disable-gpu`: на части окружений ухудшает отрисовку в headless.
 * `shell` headless оставляем опционально (Windows).
 */
const PUPPETEER_HEADLESS_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-crash-reporter',
    '--disable-breakpad',
    '--mute-audio',
    '--hide-scrollbars',
    '--disable-extensions',
    '--window-position=-2400,-2400',
];

const PUPPETEER_CACHE_DIR =
    process.env.PUPPETEER_CACHE_DIR || '/opt/app/.cache/puppeteer';

/** Chrome из `npx puppeteer browsers install` в образе UI (версия в имени каталога). */
function findBundledChromeInCache(cacheDir: string): string | undefined {
    const chromeRoot = path.join(cacheDir, 'chrome');
    if (!fs.existsSync(chromeRoot)) {
        return undefined;
    }
    for (const entry of fs.readdirSync(chromeRoot)) {
        const candidate = path.join(chromeRoot, entry, 'chrome-linux64', 'chrome');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

function resolveChromeExecutableForPrint(): string | undefined {
    // Puppeteer 22 ищет браузер в $HOME/.cache, если HOME=/home/app — Chrome «пропадает».
    process.env.PUPPETEER_CACHE_DIR = PUPPETEER_CACHE_DIR;
    process.env.HOME = '/opt/app';
    process.env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || '/tmp/.puppeteer-config';

    const candidates = [
        process.env.CHROME_PATH,
        process.env.PUPPETEER_EXECUTABLE_PATH,
        findBundledChromeInCache(PUPPETEER_CACHE_DIR),
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].filter((p): p is string => Boolean(p));

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    try {
        const bundled = puppeteer.executablePath();
        if (bundled && fs.existsSync(bundled)) {
            return bundled;
        }
    } catch {
        /* puppeteer without bundled browser */
    }

    return undefined;
}

function getPuppeteerLaunchOptions(): Parameters<typeof puppeteer.launch>[0] {
    const executablePath = resolveChromeExecutableForPrint();
    const useShell = process.env.PUPPETEER_PDF_HEADLESS_SHELL === '1';
    return {
        headless: useShell ? 'shell' : true,
        args: PUPPETEER_HEADLESS_ARGS,
        ...(executablePath ? {executablePath} : {}),
    };
}

async function getSharedBrowser(): Promise<Browser> {
    if (sharedBrowser && sharedBrowser.isConnected()) {
        return sharedBrowser;
    }
    if (!sharedBrowserLaunch) {
        sharedBrowserLaunch = puppeteer.launch(getPuppeteerLaunchOptions()).then((b) => {
            sharedBrowser = b;
            sharedBrowserLaunch = null;
            b.on('disconnected', () => {
                sharedBrowser = null;
            });
            return b;
        });
    }
    return sharedBrowserLaunch;
}

export async function printEntry(req: Request, res: Response) {
    try {
        await runPrintEntry(req, res);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[print-entry] PDF export failed:', message);
        if (!res.headersSent) {
            res.status(500).type('text/plain').send(`PDF export failed: ${message}`);
        }
    }
}

async function runPrintEntry(req: Request, res: Response): Promise<void> {
    const r: {body?: Record<string, unknown>} & Record<string, unknown> = req as unknown as {
        body?: Record<string, unknown>;
    };

    const host = (typeof r.body?.host === 'string' && r.body.host) || 'http://localhost:8080';

    if (r.body?.links) {
        const links = r.body.links as string[];
        const files: string[] = [];

        for (let i = 0; i < links.length; i++) {
            const entryId = links[i];
            if (!entryId || typeof entryId !== 'string') {
                continue;
            }

            const exportPath = path.join(__dirname, '../', '../', '../', 'export');
            await fs.promises.mkdir(exportPath, {recursive: true});

            const sheetName =
                (entryId.includes('/') ? entryId.split('/').pop() : entryId) + '-' + Date.now();
            const publicOutputPDFPath = path.join(exportPath, `${sheetName}.pdf`);
            files.push(publicOutputPDFPath);

            const browser = await getSharedBrowser();
            const page = await browser.newPage();
            try {
                await page.setUserAgent(SCR_USER_AGENT_HEADER_VALUE);
                await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
                await setPreferLightColorScheme(page);

                const urlQuery =
                    typeof r.body.urlQuery === 'string' && r.body.urlQuery.length
                        ? `&${String(r.body.urlQuery).replace(/^\?/, '')}`
                        : '';
                const previewPathRaw =
                    typeof r.body.previewPath === 'string' ? r.body.previewPath : '';
                const previewPathTrimmed = previewPathRaw.trim();
                const hasPreviewPath = previewPathTrimmed.length > 0;
                const previewEntryId = resolveUsEntryId(
                    (entryId.includes('/') ? entryId.split('/').pop() : entryId) ?? entryId,
                );
                const defaultPath =
                    '/preview/' +
                    previewEntryId +
                    '?_embedded=1&_no_controls=1' +
                    '&_no_virtual=1' +
                    '&_pdf_export=1' +
                    urlQuery;
                const pathWithParams = stripEmptyQueryParams(
                    rewritePreviewPathEntryIds(
                        hasPreviewPath ? previewPathTrimmed : defaultPath,
                    ),
                );
                const token = String(req.headers['x-rpc-authorization'] ?? '');
                const authSuffix =
                    (pathWithParams.includes('?') ? '&' : '?') +
                    'x-rpc-authorization=' +
                    encodeURIComponent(token);
                const previewUrl = stripEmptyQueryParams(host + pathWithParams + authSuffix);

                await applyRequestAuthToPreviewPage(page, req, previewUrl, token);

                await page.goto(previewUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 45000,
                });
                await assertPreviewDidNotOpenLogin(page);
                try {
                    await waitForPreviewOrPrintableContent(page, 8000);
                } catch {
                    /* fallback wait below */
                }
                await waitForPreviewShellReady(page, 20000);
                await assertPreviewDidNotOpenLogin(page);

                await applyLightAppearanceForPdfCapture(page);

                const chartTitle = await page.evaluate(() => {
                    const h = document.querySelector(
                        '.chartkit-base__title, .chartkit-header__title, h1',
                    );
                    return (h?.textContent || document.title || 'Отчёт').trim();
                });

                await applyRasterCaptureStyles(page);

                await page.evaluate(() => {
                    document.documentElement.getBoundingClientRect();
                    document.body?.getBoundingClientRect();
                });
                await new Promise<void>((r) => setTimeout(r, 400));

                try {
                    await waitForPrintableChartContent(page, 15000);
                } catch {
                    /* proceed with raster capture — element screenshot may still succeed */
                }
                await page
                    .waitForFunction(
                        () => {
                            const tableRows = document.querySelectorAll(
                                'table.dl-table_prepared tbody tr',
                            );
                            if (tableRows.length > 0) {
                                return true;
                            }
                            const canvases = document.querySelectorAll(
                                '.chart-preview canvas, .chartkit-graph canvas, .g-charts canvas',
                            );
                            for (let i = 0; i < canvases.length; i++) {
                                const canvas = canvases[i];
                                if (!(canvas instanceof HTMLCanvasElement) || canvas.width < 40) {
                                    continue;
                                }
                                try {
                                    const ctx = canvas.getContext('2d');
                                    if (!ctx) {
                                        continue;
                                    }
                                    const w = Math.min(canvas.width, 48);
                                    const h = Math.min(canvas.height, 48);
                                    const x = Math.floor((canvas.width - w) / 2);
                                    const y = Math.floor((canvas.height - h) / 2);
                                    const px = ctx.getImageData(x, y, w, h).data;
                                    for (let j = 0; j < px.length; j += 4) {
                                        const a = px[j + 3];
                                        if (
                                            a > 16 &&
                                            (px[j] < 245 || px[j + 1] < 245 || px[j + 2] < 245)
                                        ) {
                                            return true;
                                        }
                                    }
                                } catch {
                                    return true;
                                }
                            }
                            const paths = document.querySelectorAll(
                                '.g-charts path, .highcharts-series path',
                            );
                            return paths.length > 0;
                        },
                        {timeout: 12000},
                    )
                    .catch(() => {
                        /* best-effort canvas wait */
                    });

                const contentDims = await prepareScrollableChartForCapture(page);
                await page.evaluate(() => {
                    document
                        .querySelector(
                            'table.dl-table_prepared, .chartkit-graph, .highcharts-root, ' +
                                '.snapter-container, .chartkit-base',
                        )
                        ?.scrollIntoView({block: 'start', inline: 'start'});
                });
                await new Promise<void>((r) => setTimeout(r, 150));
                await page.evaluate(
                    () =>
                        new Promise<void>((resolve) => {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => resolve());
                            });
                        }),
                );

                try {
                    await page.evaluate(() => document.fonts.ready);
                } catch {
                    /* ignore */
                }

                await applyLightAppearanceForPdfCapture(page);
                await new Promise<void>((r) => setTimeout(r, 300));

                await page.evaluate(() => {
                    document
                        .querySelectorAll('.dl-table__table-wrapper_pending')
                        .forEach((node) => {
                            if (node instanceof HTMLElement) {
                                node.classList.remove('dl-table__table-wrapper_pending');
                                node.style.visibility = 'visible';
                                node.style.opacity = '1';
                            }
                        });
                });

                const contentWidth = Math.max(
                    contentDims.width,
                    await page.evaluate(() => {
                        const table = document.querySelector('table.dl-table_prepared');
                        const chart = document.querySelector(
                            '.chartkit-graph, .highcharts-root, .g-charts',
                        );
                        const el = (table ?? chart ?? document.querySelector('.chartkit-base')) as
                            | HTMLElement
                            | null;
                        return el ? Math.ceil(el.scrollWidth || el.getBoundingClientRect().width) : 0;
                    }),
                );
                const useLandscape = contentWidth > 900;

                const pdfMode = String(process.env.PUPPETEER_PDF_MODE || 'auto');
                /** Vector auto-mode давал PDF только с header/footer без таблицы — raster надёжнее. */
                const tryVectorPdf = pdfMode === 'vector';

                let pdfBuffer: Buffer | null = null;

                if (tryVectorPdf) {
                    try {
                        pdfBuffer = await buildCorporateVectorPdfFromPage(page, {
                            landscape: useLandscape,
                            title: chartTitle,
                        });
                    } catch {
                        pdfBuffer = null;
                    }
                }
                if (!pdfBuffer) {
                    await applyPdfCaptureScaleDownIfNeeded(page);
                    const refreshedDims = await prepareScrollableChartForCapture(page);
                    const useFullPageFallback = await expandViewportToDocumentForScreenshot(page, {
                        width: Math.max(refreshedDims.width, contentWidth),
                        height: refreshedDims.height,
                    });

                    const pngBytes = await captureChartPng(page, useFullPageFallback);
                    await assertScreenshotHasChartContent(page, pngBytes);

                    pdfBuffer = await buildRasterPdfFromScreenshot(pngBytes, {
                        landscape: useLandscape,
                        title: chartTitle,
                    });

                    if (pdfBuffer.length < MIN_RASTER_PDF_BYTES) {
                        throw new Error(
                            `Generated PDF is too small (${pdfBuffer.length} B) — raster export failed`,
                        );
                    }
                    const embeddedImages = pdfBuffer.toString('latin1').split('/Subtype /Image').length - 1;
                    if (embeddedImages < 1) {
                        throw new Error(
                            `Raster PDF has no embedded image (${pdfBuffer.length} B) — preview was blank`,
                        );
                    }
                }

                await fs.promises.writeFile(publicOutputPDFPath, pdfBuffer);
            } finally {
                await page.close();
            }
        }

        const destroy = async () => {
            for (let i = 0; i < files.length; i++) {
                if (fs.existsSync(files[i])) {
                    await fs.promises.unlink(files[i]);
                }
            }
        };

        if (files.length === 0) {
            res.status(404).send('Output file is empty');
            return;
        }

        if (fs.existsSync(files[0])) {
            const payload = await fs.promises.readFile(files[0]);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="chart.pdf"');
            res.status(200).send(payload);
        } else {
            res.status(404).send('Output file not found');
        }

        await destroy();
    } else {
        res.status(404).send('Entry ID not found');
    }
}
