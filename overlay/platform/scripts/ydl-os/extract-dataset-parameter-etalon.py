#!/usr/bin/env python3
"""Extract dataset parameter defaults from sanitized US export → JSON etalon."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

EXPORT = (
    Path(__file__).resolve().parents[3]
    / "infra/exports/platform-state/sanitized/pg-us-db.sql"
)
OUT = Path(__file__).resolve().parent / "dataset-parameter-etalon.json"


def main() -> int:
    text = EXPORT.read_text(encoding="utf-8", errors="replace")
    entry_names: dict[str, str] = {}
    entry_published: dict[str, str] = {}

    for m in re.finditer(
        r"INSERT INTO public\.entries \([^)]+\) VALUES \('(\d+)', 'dataset', '((?:[^']|'')*)'",
        text,
    ):
        eid = m.group(1)
        name = m.group(2).replace("''", "'")
        entry_names[eid] = name

    for m in re.finditer(
        r"INSERT INTO public\.entries \([^)]+\) VALUES \('(\d+)', 'dataset', '[^']*',[^']*'[^']*'[^']*'[^']*'[^']*'[^']*'(\d+)'",
        text,
    ):
        entry_published[m.group(1)] = m.group(2)

    etalon: dict[str, dict] = {}
    for line in text.splitlines():
        if "INSERT INTO public.revisions" not in line or '"calc_mode": "parameter"' not in line:
            continue
        idx = line.find("VALUES ('")
        if idx < 0:
            continue
        start = idx + len("VALUES ('")
        jend = line.rfind("', '")
        if jend <= start:
            continue
        blob = line[start:jend].replace("''", "'")
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            continue
        tail = line[jend + 4 :]
        ids = re.findall(r"^(\d+)", tail)
        if not ids:
            continue
        rev_id = ids[0]
        tail2 = tail[len(rev_id) + 3 :]
        entry_ids = re.findall(r"^(\d+)", tail2)
        if not entry_ids:
            continue
        entry_id = entry_ids[0]
        if entry_published.get(entry_id) != rev_id:
            continue

        params: dict[str, dict] = {}
        for field in data.get("result_schema", []):
            if field.get("calc_mode") != "parameter":
                continue
            guid = field.get("guid")
            if not guid:
                continue
            params[guid] = {
                "default_value": field.get("default_value"),
                "data_type": field.get("data_type"),
                "cast": field.get("cast"),
                "value_constraint": field.get("value_constraint"),
                "template_enabled": field.get("template_enabled"),
                "valid": field.get("valid", True),
            }
        if params:
            etalon[entry_id] = {
                "name": entry_names.get(entry_id, entry_id),
                "params": params,
            }

    OUT.write_text(json.dumps(etalon, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"etalon: {len(etalon)} datasets -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
