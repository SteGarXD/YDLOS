#!/usr/bin/env node
/**
 * Some IDEs on Windows save sources as UTF-16 LE; Rspack/tsc then fail with
 * "Unexpected character" at line 1. Re-read as UTF-16 and write UTF-8 (no BOM).
 *
 * Runs on `npm run dev` (see package.json). Also: `npm run fix:utf16:flat-tree`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcRoot = path.join(root, 'src');

/** Explicit list — always checked first (historical flat-tree files). */
const relPaths = [
    'src/ui/libs/DatalensChartkit/ChartKit/plugins/Table/renderer/utils/flatTableRowTreeKeys.ts',
    'src/ui/libs/DatalensChartkit/menu/flatTableRowTreeMenuItems.tsx',
    'src/ui/libs/DatalensChartkit/menu/flatTableRowTreeMenuUtils.ts',
];

function decodeUtf16Buffer(b) {
    if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
        return b.subarray(2).toString('utf16le');
    }
    if (b.length >= 4 && b[1] === 0 && b[3] === 0 && b[0] !== 0 && b[0] >= 0x20) {
        return b.toString('utf16le');
    }
    return null;
}

function normalizeToUtf8Text(t) {
    return t.replace(/^\uFEFF/, '');
}

function tryFixFile(absPath) {
    if (!fs.existsSync(absPath)) {
        return false;
    }
    const b = fs.readFileSync(absPath);
    const decoded = decodeUtf16Buffer(b);
    if (decoded == null) {
        return false;
    }
    fs.writeFileSync(absPath, normalizeToUtf8Text(decoded), 'utf8');
    return true;
}

function walkSourceFiles(dir, out) {
    let entries;
    try {
        entries = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
        return;
    }
    for (const ent of entries) {
        if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') {
            continue;
        }
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            walkSourceFiles(full, out);
        } else if (
            /\.(ts|tsx|cjs|mjs|jsx|js)$/i.test(ent.name) &&
            !ent.name.endsWith('.d.ts') &&
            !ent.name.endsWith('.min.js')
        ) {
            out.push(full);
        }
    }
}

let fixed = 0;
const seen = new Set();

for (const rel of relPaths) {
    const p = path.join(root, rel);
    if (tryFixFile(p)) {
        console.log('fixed utf-16 -> utf-8:', rel);
        fixed++;
    }
    seen.add(path.normalize(p));
}

if (fs.existsSync(srcRoot)) {
    const all = [];
    walkSourceFiles(srcRoot, all);
    for (const abs of all) {
        if (seen.has(path.normalize(abs))) {
            continue;
        }
        if (tryFixFile(abs)) {
            console.log('fixed utf-16 -> utf-8:', path.relative(root, abs).split(path.sep).join('/'));
            fixed++;
        }
    }
}

if (fixed === 0) {
    console.log('[fix:utf16] no UTF-16 LE sources under src (already UTF-8)');
}
process.exit(0);
