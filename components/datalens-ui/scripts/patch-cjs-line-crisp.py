# -*- coding: utf-8 -*-
path = r"D:\YDLOS\components\datalens-ui\vendor-patches\@gravity-ui\charts\patched\cjs\hooks\useShapes\line\index.js"
with open(path, encoding="utf-8") as f:
    s = f.read()
old1 = """        const ps = 1 / dpr;
        const isHorizontalCrisp = (seriesPrepared) => {
            var _a;
            const crisp = Boolean((_a = seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.series) === null || _a === void 0 ? void 0 : _a.crisp);
            if (!crisp) {
                return false;
            }
            const points = (seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.points) || [];
            if (points.length < 2) {
                return false;
            }
            const firstY = points[0].y;
            return (typeof firstY === 'number' &&
                Number.isFinite(firstY) &&
                points.every((p) => typeof p.y === 'number' && Number.isFinite(p.y) && p.y === firstY));
        };"""
new1 = """        const ps = 1 / dpr;
        const Y_FLAT_EPS = 1e-3;
        const isHorizontalCrisp = (seriesPrepared) => {
            var _a;
            const crisp = Boolean((_a = seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.series) === null || _a === void 0 ? void 0 : _a.crisp);
            if (!crisp) {
                return false;
            }
            const points = (seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.points) || [];
            if (points.length < 2) {
                return false;
            }
            const ys = points
                .map((p) => p.y)
                .filter((y) => typeof y === 'number' && Number.isFinite(y));
            if (ys.length < 2) {
                return false;
            }
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return maxY - minY < Y_FLAT_EPS;
        };"""
old2 = """            .attr('y', (d) => pp(Math.round(d.points[0].y)))
            .attr('height', ps)"""
new2 = """            .attr('y', (d) => {
            const ys = d.points
                .map((p) => p.y)
                .filter((y) => typeof y === 'number' && Number.isFinite(y));
            const rawY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : d.points[0].y;
            return pp(Math.round(rawY));
        })
            .attr('height', ps)"""
if old1 not in s:
    raise SystemExit("old1 not found")
if old2 not in s:
    raise SystemExit("old2 not found")
s = s.replace(old1, new1, 1).replace(old2, new2, 1)
with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(s)
print("ok")
