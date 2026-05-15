/**
 * Tests for build-request-body constants.
 * RESERVED_PARAM_KEYS: keys that must not be sent to the dataset API as filters
 * (e.g. UI-only extraSettings like "size" — sending them causes 400).
 */
import {RESERVED_PARAM_KEYS} from '../constants';

describe('RESERVED_PARAM_KEYS', () => {
    it('contains __datasetId (internal key)', () => {
        expect(RESERVED_PARAM_KEYS.has('__datasetId')).toBe(true);
    });

    it('contains size (table/chart cell size — extraSettings.size, UI-only)', () => {
        expect(RESERVED_PARAM_KEYS.has('size')).toBe(true);
    });

    it('contains treeState (flat row tree UI — must not hit SQL as a filter)', () => {
        expect(RESERVED_PARAM_KEYS.has('treeState')).toBe(true);
    });

    it('does not treat dataset field names as reserved', () => {
        expect(RESERVED_PARAM_KEYS.has('some_guid_123')).toBe(false);
        expect(RESERVED_PARAM_KEYS.has('column_name')).toBe(false);
    });
});
