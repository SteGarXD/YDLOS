import type {AppContext} from '@gravity-ui/nodekit';

import {WizardVisualizationId} from '../../../../shared';
import {chartGenerator} from '../components/chart-generator';
import type {ChartBuilder} from '../components/processor/types';
import type {ChartStorageType} from '../types';

import type {Runners} from './common';
import {commonRunner} from './common';

import type {RunnerHandlerProps} from '.';

/** Derive chart storage type from visualization.id when meta.stype is missing (e.g. after changing size in chart settings). */
function getChartTypeFromVisualizationId(visualizationId: string): string {
    switch (visualizationId) {
        case WizardVisualizationId.PivotTable:
        case WizardVisualizationId.FlatTable:
            return 'table_wizard_node';
        case WizardVisualizationId.Metric:
            return 'metric_wizard_node';
        case WizardVisualizationId.Geolayer:
        case 'geopoint':
        case 'geopolygon':
        case 'heatmap':
            return 'ymap_wizard_node';
        default:
            return 'graph_wizard_node';
    }
}

// eslint-disable-next-line complexity
export const runWorkerChart = async (
    cx: AppContext,
    props: RunnerHandlerProps & {chartBuilder: ChartBuilder; runnerType?: Runners},
): Promise<void> => {
    const {
        chartsEngine,
        req,
        res,
        config,
        configResolving,
        workbookId,
        chartBuilder,
        runnerType = 'Worker',
        forbiddenFields,
    } = props;
    let generatedConfig;
    let chartType;
    const {template} = config;

    const ctx = cx.create('templateChartRunner');

    if (config) {
        let result;
        let metadata = null;

        try {
            let data: {type?: string} | undefined;

            if (typeof config.data.shared === 'string') {
                data = JSON.parse(config.data.shared);
            } else if (config.data.shared && typeof config.data.shared === 'object') {
                data = config.data.shared as {type?: string};
            } else if (
                config.data &&
                typeof config.data === 'object' &&
                'visualization' in config.data
            ) {
                // Wizard edit mode: client sends config.data as the shared config directly (no .shared wrapper)
                data = config.data as {type?: string};
            } else {
                data = undefined;
            }

            if (!data) {
                throw new Error('CHART_RUNNER_CONFIG_DATA_MISSING');
            }

            if (!template && !data.type) {
                const visId = (data as {visualization?: {id?: string}}).visualization?.id;
                data.type =
                    config.meta?.stype ||
                    (visId ? getChartTypeFromVisualizationId(visId) : undefined);
            }

            result = chartGenerator.generateChart({
                data,
                template,
                req,
                ctx,
            });

            metadata = {
                entryId: config.entryId,
                key: config.key,
                owner: config.owner,
                scope: config.scope,
            };

            chartType = template || data.type;
        } catch (error) {
            ctx.logError('Failed to generate chart in chart runner', error);
            ctx.end();

            res.status(400).send({
                error,
            });
            return;
        }

        generatedConfig = {
            data: result.chart as Record<string, string>,
            meta: {
                stype: result.type as ChartStorageType,
            },
            publicAuthor: config.publicAuthor,
        };

        if (metadata) {
            Object.assign(generatedConfig, metadata);
        }
    } else {
        const error = new Error('CHART_RUNNER_CONFIG_MISSING');

        ctx.logError('CHART_RUNNER_CONFIG_MISSING', error);
        ctx.end();

        res.status(400).send({
            error,
        });
        return;
    }

    const hrStart = process.hrtime();

    return commonRunner({
        res,
        req,
        ctx,
        chartType,
        chartsEngine,
        configResolving,
        builder: chartBuilder,
        generatedConfig,
        workbookId,
        runnerType,
        hrStart,
        localConfig: config,
        forbiddenFields,
    });
};
