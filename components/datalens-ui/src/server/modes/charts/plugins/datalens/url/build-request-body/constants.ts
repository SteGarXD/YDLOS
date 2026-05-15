/**
 * Param keys that must not be sent to the dataset API as filters (see formatParamsFilters in build-request-body).
 * - __datasetId: internal; baseline had it.
 * - size: UI-only (pivot table S/M/L); sending as filter causes 400 (no "size" field in dataset).
 * - treeState: flat table row tree expansion (chart runtime); preparer reads it via getTreeState(params).
 *   Sending it as a dataset filter joins paths into one value and breaks expand/collapse.
 */
export const RESERVED_PARAM_KEYS = new Set(['__datasetId', 'size', 'treeState']);
