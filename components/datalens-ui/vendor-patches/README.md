# vendor-patches

Copies of manually patched files from `node_modules` (excluded by `.gitignore`).
Stored under `patched/` (not `dist/`) to avoid the root `.gitignore` `dist/` rule.

## @gravity-ui/charts

Files under `@gravity-ui/charts/patched/` mirror the structure of
`node_modules/@gravity-ui/charts/dist/` and were patched to fix:

- **AxisX/AxisX.js** — pixel-perfect X-axis: domain + ticks as `<rect fill>` (1/devicePixelRatio), rightmost tick suppressed.
- **AxisY/AxisY.js** — pixel-perfect Y-axis: same rect approach; Y=0 tick restored; title uses `text-rendering: geometricPrecision`.
- **AxisX/styles.css, AxisY/styles.css** — removed default `stroke` overrides conflicting with rect-based rendering.
- **hooks/useSeries/prepare-legend.js** — legend series preparation.
- **hooks/useShapes/line/prepare-data.js, index.js** — line series data fixes.
- **components/ChartInner/index.js, useChartInnerProps.js** — layout/dimension fixes.
- **hooks/useChartDimensions/index.js** — chart dimension calculation.
- **utils/chart/axis-generators/bottom.js** — bottom axis generator.
- **hooks/useAxisScales/index.js, hooks/useChartOptions/{x,y}-axis.js** — axis scale/option fixes.
- **components/Legend/index.js, components/Title/index.js** — positioning fixes.

## How to restore after `npm install`

Run from `components/datalens-ui/`:

```powershell
$src = "vendor-patches\@gravity-ui\charts\patched"
$dst = "node_modules\@gravity-ui\charts\dist"
Get-ChildItem $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring((Resolve-Path $src).Path.Length + 1)
    $target = Join-Path $dst $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item $_.FullName $target -Force
}
Write-Host "Patches restored."
```
