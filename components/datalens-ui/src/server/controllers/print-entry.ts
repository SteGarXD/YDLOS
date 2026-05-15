/**
 * POST /print-entry — экспорт чарта в PDF.
 *
 * Подход (как в Apache Superset и др. BI): **растровый PDF** — full-page screenshot
 * в PNG + встраивание в PDF через `pdf-lib`. Векторная печать Chromium (`page.pdf()`)
 * для сложных дашбордов часто даёт пустой/крошечный файл (~1.2KB) в Puppeteer 22+,
 * независимо от размера таблицы; скриншот страницы использует тот же рендер, что и экран.
 *
 * @see https://github.com/puppeteer/puppeteer/issues/13209 (Uint8Array / корректная передача буфера в v23+)
 *
 * body: { links: string[], host: string, previewPath?: string, urlQuery?: string, options?: object }
 * options: зарезервировано (раньше: format, autoFit для page.pdf); растровый режим их не использует.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {Request, Response} from '@gravity-ui/expresskit';
import {PDFDocument} from 'pdf-lib';
import puppeteer, {type Browser, type Page} from 'puppeteer';

import {SCR_USER_AGENT_HEADER_VALUE} from '../../shared';

/** Минимальный размер PNG-скриншота (байт), иначе считаем съёмку неудачной. */
const MIN_SCREENSHOT_PNG_BYTES = 2500;
/** Минимальный размер итогового PDF (растр + оболочка PDF) — отсекает явный мусор. */
const MIN_RASTER_PDF_BYTES = 2500;
/** Ограничение размера страницы PDF (pt), чтобы не упираться в лимиты просмотрщиков. */
const MAX_PDF_PAGE_DIM_PT = 14400;
/**
 * Предел размеров viewport перед скриншотом (без fullPage — надёжнее, чем fullPage в Chromium).
 * Слишком большой viewport может падать по памяти; при необходимости увеличьте под инфраструктуру.
 */
const MAX_VIEWPORT_WIDTH_PX = 8192;
const MAX_VIEWPORT_HEIGHT_PX = 24576;

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

            const preparedTables = document.querySelectorAll('table.dl-table_prepared');
            for (let i = 0; i < preparedTables.length; i++) {
                const table = preparedTables[i];
                if (!(table instanceof HTMLTableElement)) {
                    continue;
                }
                if (table.closest('.dl-table__background-table') !== null) {
                    continue;
                }
                const row = table.querySelector('tbody tr');
                if (!row || !isVisible(table)) {
                    continue;
                }
                const textLen = (table.innerText || '').replace(/\s+/g, ' ').trim().length;
                if (textLen < 1) {
                    continue;
                }
                return true;
            }

            const chart = document.querySelector(
                '.chart-preview .highcharts-root, .chart-preview .g-charts, .chart-preview .chartkit-graph, ' +
                    '.snapter-container .highcharts-root, .snapter-container .g-charts, .chartkit-graph',
            );
            if (isVisible(chart)) {
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

async function getPrintableDebugInfo(page: Page): Promise<Record<string, unknown>> {
    return page.evaluate(() => {
        const table = document.querySelector('table.dl-table_prepared');
        const tableRowCount = table?.querySelectorAll('tbody tr')?.length ?? 0;
        const tableRect = table instanceof HTMLElement ? table.getBoundingClientRect() : null;
        const wrapper = document.querySelector('.dl-table__table-wrapper');
        const wrapperClass = wrapper?.className ?? '';
        const wrapperStyle =
            wrapper instanceof HTMLElement ? window.getComputedStyle(wrapper) : null;
        const hasChart = Boolean(
            document.querySelector('.highcharts-root, .g-charts, .chartkit-graph, canvas'),
        );
        return {
            tableRowCount,
            tableRect: tableRect ? {width: tableRect.width, height: tableRect.height} : null,
            wrapperClass,
            wrapperVisibility: wrapperStyle?.visibility ?? null,
            wrapperOpacity: wrapperStyle?.opacity ?? null,
            hasChart,
            bodyScrollWidth: document.body?.scrollWidth ?? 0,
            bodyScrollHeight: document.body?.scrollHeight ?? 0,
        };
    });
}

/**
 * Снимок всей страницы (как в BI: «растровый экспорт») и одна страница PDF с этим изображением.
 */
async function buildRasterPdfFromScreenshot(pngBytes: Buffer | Uint8Array): Promise<Buffer> {
    const bytes = Buffer.isBuffer(pngBytes) ? pngBytes : Buffer.from(pngBytes);
    if (bytes.length < MIN_SCREENSHOT_PNG_BYTES) {
        throw new Error(
            `Screenshot is too small (${bytes.length} B) — page may be blank or capture failed`,
        );
    }

    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(bytes);
    let w = image.width;
    let h = image.height;

    if (w > MAX_PDF_PAGE_DIM_PT || h > MAX_PDF_PAGE_DIM_PT) {
        const scale = Math.min(MAX_PDF_PAGE_DIM_PT / w, MAX_PDF_PAGE_DIM_PT / h, 1);
        w *= scale;
        h *= scale;
    }

    const pdfPage = pdfDoc.addPage([w, h]);
    pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: w,
        height: h,
    });

    const out = await pdfDoc.save();
    return Buffer.from(out);
}

/**
 * Расширяем viewport до размеров документа и делаем снимок **без** fullPage — в Chromium
 * `page.screenshot({ fullPage: true })` для сложных страниц часто даёт пустой/белый PNG.
 * Если документ больше лимитов — оставляем типовой viewport и используем fullPage как fallback.
 */
async function expandViewportToDocumentForScreenshot(page: Page): Promise<boolean> {
    const scrollDims = await page.evaluate(() => {
        const el = document.documentElement;
        const body = document.body;
        const w = Math.max(el?.scrollWidth ?? 0, body?.scrollWidth ?? 0, el?.clientWidth ?? 0);
        const h = Math.max(el?.scrollHeight ?? 0, body?.scrollHeight ?? 0, el?.clientHeight ?? 0);
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
    '--mute-audio',
    '--hide-scrollbars',
    '--disable-extensions',
    '--window-position=-2400,-2400',
];

function resolveChromeExecutableForPrint(): string | undefined {
    if (process.env.APP_ENV === 'development') {
        return undefined;
    }
    if (process.platform === 'win32') {
        return process.env.CHROME_PATH || undefined;
    }
    return '/usr/bin/google-chrome-stable';
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
                const defaultPath =
                    '/preview/' +
                    entryId +
                    '?_embedded=1&_no_controls=1' +
                    '&_no_virtual=1' +
                    '&_pdf_export=1' +
                    urlQuery;
                const pathWithParams = hasPreviewPath ? previewPathTrimmed : defaultPath;
                const token = String(req.headers['x-rpc-authorization'] ?? '');
                const authSuffix =
                    (pathWithParams.includes('?') ? '&' : '?') +
                    'x-rpc-authorization=' +
                    encodeURIComponent(token);
                const previewUrl = host + pathWithParams + authSuffix;

                await page.goto(previewUrl, {
                    waitUntil: 'load',
                    timeout: 120000,
                });
                await waitForChartPreviewReady(page, 120000);

                await applyLightAppearanceForPdfCapture(page);

                await page.emulateMediaType('screen');
                await page.addStyleTag({
                    content: `
                        html {
                            color-scheme: light !important;
                        }
                        html, body, #root {
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                            background-color: #ffffff !important;
                            color: #1a1a1a !important;
                        }
                        body.g-root.dl-preview,
                        body.g-root.dl-preview_no-scroll {
                            overflow-y: visible !important;
                            overflow: visible !important;
                        }
                        .app, .app-root, .dl-preview {
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                            background-color: #ffffff !important;
                            color: #1a1a1a !important;
                        }
                        .app {
                            flex: none !important;
                            min-height: min-content !important;
                        }
                        .preview {
                            flex: none !important;
                            height: auto !important;
                            min-height: min-content !important;
                            overflow: visible !important;
                        }
                        .chartkit-base {
                            position: relative !important;
                            height: auto !important;
                            min-height: min-content !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        .chartkit-base__body {
                            position: static !important;
                            inset: auto !important;
                            height: auto !important;
                            min-height: min-content !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        .chartkit-loader {
                            display: none !important;
                        }
                        .chartkit,
                        .chartkit-base,
                        .chartkit-scrollable-node,
                        .snapter-container {
                            background-color: #ffffff !important;
                        }
                        .chartkit {
                            height: auto !important;
                            min-height: min-content !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        .chartkit-scrollable-node,
                        .snapter-container {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                        }
                        .chartkit-scrollable__content {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                        }
                        .chartkit-table, .dl-table {
                            width: max-content !important;
                            min-width: 100% !important;
                            max-width: none !important;
                        }
                        .chartkit-table, .dl-table, table.dl-table_prepared {
                            border: 0 !important;
                            box-shadow: none !important;
                            box-sizing: border-box !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .dl-table__table-wrapper_pending {
                            visibility: visible !important;
                            opacity: 1 !important;
                            pointer-events: auto !important;
                        }`,
                });

                await page.evaluate(() => {
                    document.documentElement.getBoundingClientRect();
                    document.body?.getBoundingClientRect();
                });
                await new Promise<void>((r) => setTimeout(r, 350));

                try {
                    await waitForPrintableChartContent(page, 120000);
                } catch {
                    const debugInfo = await getPrintableDebugInfo(page);
                    throw new Error(
                        `Printable content is not visible in preview: ${JSON.stringify(debugInfo)}`,
                    );
                }

                await page.evaluate(() => {
                    document
                        .querySelector(
                            'table.dl-table_prepared, .snapter-container, .chartkit-table',
                        )
                        ?.scrollIntoView({block: 'start', inline: 'start'});
                });
                await new Promise<void>((r) => setTimeout(r, 500));
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
                await new Promise<void>((r) => setTimeout(r, 250));

                const useFullPageFallback = await expandViewportToDocumentForScreenshot(page);

                const pngBytes = await page.screenshot({
                    type: 'png',
                    fullPage: useFullPageFallback,
                    captureBeyondViewport: useFullPageFallback,
                    /** false: иначе прозрачность PNG в PDF часто даёт «чёрный лист» в просмотрщиках. */
                    omitBackground: false,
                });

                const pdfBuffer = await buildRasterPdfFromScreenshot(
                    Buffer.isBuffer(pngBytes) ? pngBytes : Buffer.from(pngBytes),
                );

                if (pdfBuffer.length < MIN_RASTER_PDF_BYTES) {
                    throw new Error(
                        `Generated PDF is too small (${pdfBuffer.length} B) — raster export failed`,
                    );
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
