"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configController = void 0;
const data_fetcher_1 = require("../components/processor/data-fetcher");
const configController = (chartsEngine) => {
    return (_req, res) => {
        res.status(200).send(data_fetcher_1.DataFetcher.getChartKitSources({
            sourcesConfig: chartsEngine.sources,
            lang: res.locals.lang,
        }));
    };
};
exports.configController = configController;
