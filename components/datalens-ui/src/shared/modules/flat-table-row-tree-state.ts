/**
 * Flat table row tree: each expanded node is a separate string key, usually JSON.stringify([flightId]).
 * Dash URL / hash serialization sometimes joins multiple keys into one comma-separated string
 * (same as multi-value filters). That breaks toggle/merge — normalize back to a list of keys.
 */
const TREE_KEY_CHUNK = /\[[^\]]*\]/g;

function tryParseJsonArrayFragment(fragment: string): boolean {
    try {
        const v = JSON.parse(fragment);
        return Array.isArray(v);
    } catch {
        return false;
    }
}

/**
 * If `entry` is a single string containing several `["..."]` fragments, split into separate keys.
 * Otherwise return `[entry]` (trimmed).
 */
export function expandConcatenatedFlatTableTreeStateEntry(entry: string): string[] {
    const trimmed = entry.trim();
    if (!trimmed) {
        return [];
    }
    const chunks = trimmed.match(TREE_KEY_CHUNK);
    if (!chunks || chunks.length <= 1) {
        return [trimmed];
    }
    const valid = chunks.filter((c) => tryParseJsonArrayFragment(c));
    return valid.length > 0 ? valid : [trimmed];
}

/** Deduped list of tree keys after splitting any comma-joined blobs. */
export function normalizeFlatTableTreeStateList(raw: string[] | undefined): string[] {
    const out: string[] = [];
    for (const item of raw ?? []) {
        if (item) {
            out.push(...expandConcatenatedFlatTableTreeStateEntry(item));
        }
    }
    return [...new Set(out)].filter(Boolean);
}
