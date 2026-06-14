#!/usr/bin/env python3
"""Compute weighted maturity score and gap list for future BI platform."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--checklist",
        default="overlay/platform/governance/bi-future-platform-checklist.json",
    )
    parser.add_argument("--out-dir", default="overlay/platform/reports/governance")
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    checklist_path = (repo / args.checklist).resolve()
    data = json.loads(checklist_path.read_text(encoding="utf-8"))

    total_weight = 0
    weighted_score = 0.0
    all_gaps: list[str] = []
    lines = [
        f"# {data['title']}",
        "",
        f"- generated_at_utc: {datetime.now(timezone.utc).isoformat()}",
        f"- target_maturity_percent: {data['target_maturity']}",
        "",
        "## Оценка по измерениям",
        "",
        "| Измерение | Вес | Текущий % | Вклад | Не хватает до «будущего BI» |",
        "|-----------|-----|-----------|-------|------------------------------|",
    ]

    for dim in data["dimensions"]:
        w = int(dim["weight"])
        s = float(dim["current_score"])
        total_weight += w
        weighted_score += w * s
        gap_text = "; ".join(dim.get("gaps", []))
        all_gaps.extend(f"[{dim['id']}] {g}" for g in dim.get("gaps", []))
        lines.append(
            f"| {dim['name']} | {w} | {s:.0f} | {w * s / 100:.1f} | {gap_text[:120]}{'…' if len(gap_text) > 120 else ''} |"
        )

    maturity = weighted_score / total_weight if total_weight else 0
    gap_to_target = max(0, float(data["target_maturity"]) - maturity)

    lines.extend(
        [
            "",
            "## Итог",
            "",
            f"- **Текущая зрелость (взвешенная): {maturity:.1f}%**",
            f"- **До цели {data['target_maturity']}% не хватает: {gap_to_target:.1f} п.п.**",
            f"- Всего зафиксированных gap-пунктов: **{len(all_gaps)}**",
            "",
            "## Полный перечень недостающего",
            "",
        ]
    )
    for i, g in enumerate(all_gaps, 1):
        lines.append(f"{i}. {g}")

    out_dir = (repo / args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%SZ")
    out_file = out_dir / f"bi-future-gap-{ts}.md"
    out_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"BI future gap report: {out_file}")
    print(f"maturity_percent={maturity:.1f} gap_to_target={gap_to_target:.1f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
