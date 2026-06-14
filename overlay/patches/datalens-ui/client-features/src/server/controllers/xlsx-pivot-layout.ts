/**
 * Разбор дерева шапки сводной (как tableHeadToGraphs в export.js) — две строки Excel.
 */

export type TwoHeaderRows = {
    row1: string[];
    row2: string[];
};

type HeadNode = {
    name?: unknown;
    id?: unknown;
    type?: unknown;
    sub?: HeadNode[];
};

const cellTitle = (column: HeadNode) => String(column?.name ?? column?.id ?? column?.type ?? '');

/**
 * prefix = непосредственный родитель (одна строка), как в дереве колонок.
 */
function collectLeaves(
    nodes: HeadNode[] | undefined,
    parentTitle: string,
): {top: string; bottom: string}[] {
    if (!nodes?.length) {
        return [];
    }
    const out: {top: string; bottom: string}[] = [];
    for (const column of nodes) {
        const title = cellTitle(column);
        if (column.sub?.length) {
            out.push(...collectLeaves(column.sub, title));
        } else {
            out.push({
                top: parentTitle,
                bottom: title,
            });
        }
    }
    return out;
}

export function extractTwoHeaderRowsFromHead(
    head: unknown,
    leafCount: number,
): TwoHeaderRows | null {
    if (!Array.isArray(head) || head.length === 0) {
        return null;
    }
    const leaves = collectLeaves(head as HeadNode[], '');
    if (leaves.length !== leafCount || leaves.length === 0) {
        return null;
    }
    return {
        row1: leaves.map((l) => l.top),
        row2: leaves.map((l) => l.bottom),
    };
}

export function headHasNestedSub(head: unknown): boolean {
    if (!Array.isArray(head)) {
        return false;
    }
    const stack: HeadNode[] = [...(head as HeadNode[])];
    while (stack.length) {
        const n = stack.pop();
        if (n?.sub?.length) {
            return true;
        }
    }
    return false;
}
