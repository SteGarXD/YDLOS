import type {DatasetsListData} from '../../../../../types';

import {hasAliasWithSameDataset} from '../helpers';

const datasets: DatasetsListData = {
    selDs: {
        name: 'Selector dataset',
        fields: [{title: 'ds', guid: 'ds'}],
    },
    chartDs: {
        name: 'Chart dataset',
        fields: [
            {title: 'dt1', guid: 'dt1'},
            {title: 'dt2', guid: 'dt2'},
            {title: 'x', guid: 'x'},
        ],
    },
};

describe('hasAliasWithSameDataset', () => {
    it('allows one dataset with exactly 2 fields + others with 1 (date range to dt1, dt2)', () => {
        expect(hasAliasWithSameDataset([['ds', 'dt1', 'dt2']], datasets)).toBe(false);
    });

    it('still rejects three fields from the same dataset', () => {
        const res = hasAliasWithSameDataset([['dt1', 'dt2', 'x']], datasets);
        expect(res).not.toBe(false);
        expect(res).toMatchObject({alias: ['dt1', 'dt2', 'x']});
    });

    it('still rejects two datasets each contributing 2 fields', () => {
        const ds2 = {
            ...datasets,
            other: {
                name: 'Other',
                fields: [
                    {title: 'a', guid: 'a'},
                    {title: 'b', guid: 'b'},
                ],
            },
        };
        const res = hasAliasWithSameDataset([['dt1', 'dt2', 'a', 'b']], ds2);
        expect(res).not.toBe(false);
    });
});