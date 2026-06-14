/** US entryId encoding (snowflake bigint → 13-char id), same as datalens-us Utils.encodeId. */
const CODING_BASE = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

export const ENCODED_US_ENTRY_ID_LENGTH = 13;

function rotate<T>(array: T[], n: number): T[] {
    return array.slice(n).concat(array.slice(0, n));
}

function getRotationNumber(bigIntId: string): number {
    return Number(bigIntId.slice(-2)) % CODING_BASE.length;
}

function toAlphabet(value: bigint, alphabet: string[]): string {
    const zero = BigInt(0);
    if (value === zero) {
        return alphabet[0] ?? '';
    }
    const base = BigInt(alphabet.length);
    let n = value;
    let result = '';
    while (n > zero) {
        result = alphabet[Number(n % base)] + result;
        n /= base;
    }
    return result;
}

export function encodeSnowflakeEntryId(bigIntId: string): string {
    if (!bigIntId) {
        return '';
    }

    const rotationNumber = getRotationNumber(bigIntId);
    const rotatedCodingBase = rotate(CODING_BASE, rotationNumber);
    const encodedLongPart = toAlphabet(BigInt(bigIntId), rotatedCodingBase);
    const encodedRotationNumber = toAlphabet(BigInt(rotationNumber), CODING_BASE);

    return encodedLongPart + encodedRotationNumber;
}

/** org-workbooks PostgreSQL snowflake (14+ digits) → US API entryId. */
export function isorg-workbooksSnowflakeEntryId(id: string): boolean {
    return /^\d{14,22}$/.test(id);
}

export function isEncodedUsEntryId(id: string): boolean {
    return (
        id.length === ENCODED_US_ENTRY_ID_LENGTH && /^[0-9a-z]+$/.test(id) && !/^\d{13}$/.test(id)
    );
}

export function resolveUsEntryId(rawId: string): string {
    if (!rawId) {
        return rawId;
    }
    if (isorg-workbooksSnowflakeEntryId(rawId)) {
        return encodeSnowflakeEntryId(rawId);
    }
    return rawId;
}

/** Rewrite /preview/{snowflake} segments for PDF export and headless preview. */
export function rewritePreviewPathEntryIds(previewPath: string): string {
    return previewPath.replace(
        /(\/preview\/)(\d{14,22})(?=\/|\?|$)/g,
        (_match, prefix: string, snowflake: string) => prefix + encodeSnowflakeEntryId(snowflake),
    );
}
