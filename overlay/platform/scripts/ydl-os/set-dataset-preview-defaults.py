#!/usr/bin/env python3
"""
Только default_value параметров датасета — для preview в UI.

Не меняет subsql, result_schema (поля), дашборды, чарты.
Заполняет пустые defaults по lib/repka_dataset_param_defaults.py;
уже заданные значения не трогает.

Default: dry-run. Write: --apply --confirm PREVIEW
"""
from __future__ import annotations

import argparse
import copy
import sys
from datetime import datetime, timezone
from pathlib import Path

from psycopg2.extras import Json, RealDictCursor

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from repka_dataset_param_defaults import (  # noqa: E402
    DEFAULT_DATASET_ENTRIES,
    PREVIEW_DEFAULTS_BY_GUID,
)
from repka_db import connect_us_db  # noqa: E402


def _default_scalar(default_value: object) -> str:
    if default_value is None:
        return ""
    if isinstance(default_value, dict):
        v = default_value.get("value")
        return "" if v is None else str(v).strip()
    return str(default_value).strip()


def _is_empty(default_value: object) -> bool:
    return _default_scalar(default_value) == ""


def _patch_parameter_defaults(data: dict) -> list[str]:
    changes: list[str] = []
    for field in data.get("result_schema") or []:
        if field.get("calc_mode") != "parameter":
            continue
        guid = str(field.get("guid") or "")
        want = PREVIEW_DEFAULTS_BY_GUID.get(guid)
        if not want:
            continue
        if not _is_empty(field.get("default_value")):
            continue
        field["default_value"] = {"type": "string", "value": want}
        changes.append(f"{guid} -> {want!r}")
    return changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--entry-id",
        type=int,
        action="append",
        dest="entry_ids",
        help="dataset entry_id (default: dash 9/10 datasets)",
    )
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--confirm", default="")
    args = ap.parse_args()

    if args.apply and args.confirm != "PREVIEW":
        print("Use --apply --confirm PREVIEW")
        return 1

    entry_ids = args.entry_ids or list(DEFAULT_DATASET_ENTRIES)

    conn = connect_us_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    for entry_id in entry_ids:
        cur.execute(
            """
            SELECT e.name, e.published_id, e.saved_id
            FROM entries e
            WHERE e.entry_id = %s AND e.scope = 'dataset'
            """,
            (entry_id,),
        )
        row = cur.fetchone()
        if not row:
            print(f"[{entry_id}] not found or not a dataset — skip")
            continue
        rev_ids = {row["published_id"], row["saved_id"]}
        for rev_id in sorted(r for r in rev_ids if r):
            cur.execute("SELECT data FROM revisions WHERE rev_id = %s", (rev_id,))
            data = copy.deepcopy(cur.fetchone()["data"])
            changes = _patch_parameter_defaults(data)
            print(f"\n[{entry_id}] {row['name']} rev {rev_id}")
            if not changes:
                print("  no empty defaults to fill")
                continue
            for c in changes:
                print(f"  - {c}")
            if args.apply:
                cur.execute(
                    "UPDATE revisions SET data = %s, updated_at = %s WHERE rev_id = %s",
                    (Json(data), datetime.now(timezone.utc), rev_id),
                )
                print("  APPLIED")

    if args.apply:
        conn.commit()
        print("\nDone. Re-open dataset preview in UI.")
    else:
        print("\nDry-run. Re-run with --apply --confirm PREVIEW")

    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
