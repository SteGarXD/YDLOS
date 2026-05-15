/**
 * Tests that UI-only params (e.g. extraSettings.size) are not sent as filters
 * to the dataset API. Sending them causes 400 when the backend has no such field.
 */
import {WizardVisualizationId} from '../../../../../../../../shared';
import {prepareSingleRequest} from '../index';

const DATASET_ID = 'dataset-id-1';

const minimalPivotVisualization = {
    id: WizardVisualizationId.PivotTable,
    placeholders: [
        {id: 'pivot-table-columns', items: []},
        {id: 'rows', items: []},
        {id: 'measures', items: []},
    ],
};

const minimalDatasetSchema = [
    {
        guid: 'field-guid-1',
        title: 'Some Field',
        type: 'DIMENSION',
        datasetId: DATASET_ID,
        data_type: 'string',
    },
];

describe('Reserved params (size) in pivot request', () => {
    it('does not add filter for "size" when params contain size (extraSettings.size from chart settings)', () => {
        const result = prepareSingleRequest({
            apiVersion: '2',
            datasetSchema: minimalDatasetSchema,
            datasetId: DATASET_ID,
            links: [],
            params: {size: 'm'},
            visualization: minimalPivotVisualization as any,
            placeholders: minimalPivotVisualization.placeholders,
            filters: [],
            colors: [],
            shapes: [],
            sort: [],
            labels: [],
            tooltips: [],
            updates: [],
            segments: [],
            extraSettings: {},
            sharedData: {},
            revisionId: 'rev-1',
            layerId: undefined,
        });

        const filters = result.filters || [];
        const sizeFilter = filters.find((f) => f.ref && 'id' in f.ref && f.ref.id === 'size');
        expect(sizeFilter).toBeUndefined();
    });

    it('does not add filter for __datasetId when present in params', () => {
        const result = prepareSingleRequest({
            apiVersion: '2',
            datasetSchema: minimalDatasetSchema,
            datasetId: DATASET_ID,
            links: [],
            params: {__datasetId: DATASET_ID},
            visualization: minimalPivotVisualization as any,
            placeholders: minimalPivotVisualization.placeholders,
            filters: [],
            colors: [],
            shapes: [],
            sort: [],
            labels: [],
            tooltips: [],
            updates: [],
            segments: [],
            extraSettings: {},
            sharedData: {},
            revisionId: 'rev-1',
            layerId: undefined,
        });

        const filters = result.filters || [];
        const reservedFilter = filters.find(
            (f) => f.ref && 'id' in f.ref && f.ref.id === '__datasetId',
        );
        expect(reservedFilter).toBeUndefined();
    });

    it('does not add filter for treeState when present in params (flat table row tree)', () => {
        const result = prepareSingleRequest({
            apiVersion: '2',
            datasetSchema: minimalDatasetSchema,
            datasetId: DATASET_ID,
            links: [],
            params: {
                treeState: ['["B2734"]', '["B2735"]'],
            },
            visualization: minimalPivotVisualization as any,
            placeholders: minimalPivotVisualization.placeholders,
            filters: [],
            colors: [],
            shapes: [],
            sort: [],
            labels: [],
            tooltips: [],
            updates: [],
            segments: [],
            extraSettings: {},
            sharedData: {},
            revisionId: 'rev-1',
            layerId: undefined,
        });

        const filters = result.filters || [];
        const treeStateFilter = filters.find(
            (f) => f.ref && 'id' in f.ref && f.ref.id === 'treeState',
        );
        expect(treeStateFilter).toBeUndefined();
    });
});
