import {
    expandConcatenatedFlatTableTreeStateEntry,
    normalizeFlatTableTreeStateList,
} from '../flat-table-row-tree-state';

describe('normalizeFlatTableTreeStateList', () => {
    it('leaves a single key unchanged', () => {
        expect(normalizeFlatTableTreeStateList(['["B2733"]'])).toEqual(['["B2733"]']);
    });

    it('splits dash-style comma-joined blob into separate keys', () => {
        const blob = '["B2733"],["B2738"],["B2746"]';
        expect(normalizeFlatTableTreeStateList([blob])).toEqual([
            '["B2733"]',
            '["B2738"]',
            '["B2746"]',
        ]);
    });

    it('merges proper array with blob and dedupes', () => {
        expect(
            normalizeFlatTableTreeStateList(['["B2733"],["B2738"]', '["B2738"]', '["B2740"]']),
        ).toEqual(['["B2733"]', '["B2738"]', '["B2740"]']);
    });

    it('returns empty for empty input', () => {
        expect(normalizeFlatTableTreeStateList([])).toEqual([]);
        expect(normalizeFlatTableTreeStateList(undefined)).toEqual([]);
    });
});

describe('expandConcatenatedFlatTableTreeStateEntry', () => {
    it('returns one element for a plain key', () => {
        expect(expandConcatenatedFlatTableTreeStateEntry('["x"]')).toEqual(['["x"]']);
    });
});
