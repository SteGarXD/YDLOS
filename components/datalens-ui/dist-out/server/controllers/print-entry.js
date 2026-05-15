"use strict";
/**
 * Обработчик запроса POST /print-entry - печать графика в PDF
 *
 * headers:
 *  x-rpc-authorization: [Токен авторизации]
 *
 * body:
 *
{
    "links": ["3rf68dw1mhxoq"],
    "host": "http://localhost:3030",
    "options": {}
    "params": {
        
    }
}
 *
 * где,
 * - links: string[] - массив идентификатор chart'ов, по умолчанию передать только один идентификатор
 * - host: string - текущий хост
 * - options: any - параметры печати PDF https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.pdfoptions.md
 * - params: any - параметры для чартов, по умолчанию не передавать
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printEntry = printEntry;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const getChartData = async (host, token, links, params) => {
    let data = {};
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const axiosInstance = axios_1.default.create();
        (0, axios_retry_1.default)(axiosInstance, { retries: 3 });
        const response = await axiosInstance({
            method: 'post',
            url: `${host}/api/run`,
            headers: {
                'x-rpc-authorization': token
            },
            data: {
                "id": link,
                "params": params || {},
                "responseOptions": {
                    "includeConfig": true,
                    "includeLogs": false
                },
                "workbookId": null
            }
        });
        data[link] = response.data;
    }
    return data;
};
async function printEntry(req, res) {
    var r = req;
    var host = r.body['host'] || 'http://localhost:8080';
    var options = r.body['options'] || {};
    if (r.body['links']) {
        const links = r.body['links'];
        const chartData = await getChartData(host, req.headers['x-rpc-authorization'], links, r.body['params']);
        const filteredLinks = Object.keys(chartData);
        let files = [];
        for (let i = 0; i < filteredLinks.length; i++) {
            const exportPath = path.join(__dirname, '../', '../', '../', 'export');
            if (chartData[filteredLinks[i]].extra.datasets) {
                let sheetName = (chartData[filteredLinks[i]].key.split('/').length > 1 ? chartData[filteredLinks[i]].key.split('/')[1] : filteredLinks[i]) + '-' + Date.now();
                const publicOutputPDFPath = path.join(exportPath, `${sheetName}.pdf`);
                files.push(publicOutputPDFPath);
                // TODO: Try running `which google-chrome-stable` in Docker and using the full path to the binary that is returned.
                const _isDevelopment = process.env.APP_ENV === 'development';
                let browser;
                if (_isDevelopment) {
                    browser = await puppeteer_1.default.launch();
                }
                else {
                    browser = await puppeteer_1.default.launch({ executablePath: '/usr/bin/google-chrome-stable' });
                }
                const page = await browser.newPage();
                await page.goto(host + '/preview/' + chartData[filteredLinks[i]].id + '?_embedded=1&_no_controls=1&x-rpc-authorization=' + req.headers['x-rpc-authorization'], {
                    waitUntil: 'networkidle0',
                });
                await page.pdf(Object.assign({
                    path: publicOutputPDFPath,
                    displayHeaderFooter: true,
                    headerTemplate: '',
                    footerTemplate: '',
                    printBackground: true,
                    format: 'A4'
                }, options));
                await browser.close();
            }
        }
        const destroy = async () => {
            for (let i = 0; i < files.length; i++) {
                if (fs.existsSync(files[i])) {
                    await fs.promises.unlink(files[i]);
                }
            }
        };
        if (filteredLinks.length == 0) {
            res.status(404).send('Output file is empty');
            return;
        }
        if (fs.existsSync(files[0])) {
            res.status(200).send(await fs.promises.readFile(files[0]));
        }
        else {
            res.status(404).send('Output file not found');
        }
        await destroy();
    }
    else {
        res.status(404).send('Entry ID not found');
    }
}
