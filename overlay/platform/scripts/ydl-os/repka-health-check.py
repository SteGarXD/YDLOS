#!/usr/bin/env python3
"""
Проверка org-workbooks: дашборды, ydlProfile, датасеты (raw_schema), связи MSSQL.

Usage:
  PGHOST=172.18.0.3 python3 repka-health-check.py
  PGHOST=172.18.0.3 python3 repka-health-check.py --profiles-dir profiles/extracted
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from psycopg2.extras import RealDictCursor

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR / "lib"))
from profile_validate import validate_profile  # noqa: E402
from repka_db import connect_us_db  # noqa: E402

DATE_UPSTREAM = {"ds", "cf_d1", "cf_d2", "dta1", "dta2", "dt1", "dt2"}
KNOWN_DASH_DATASETS = {
    2234609395340150023,
    2234611653930910984,
}


def _load_profiles(profiles_dir: Path) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for path in sorted(profiles_dir.glob("*.profile.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        eid = str(data.get("metadata", {}).get("dashboardEntryId", ""))
        if eid:
            out[eid] = data
    return out


def _raw_schema_ok(data: dict) -> list[str]:
    issues: list[str] = []
    sc = (data.get("source_collections") or [{}])[0]
    for col in sc.get("origin", {}).get("raw_schema") or []:
        if "description" not in col or "native_type" not in col:
            issues.append(f"raw_schema[{col.get('name')}]: missing description/native_type")
    ce = data.get("component_errors")
    if ce is not None and not isinstance(ce, dict):
        issues.append("component_errors must be object with items[]")
    return issues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--profiles-dir",
        default=str(_SCRIPT_DIR.parent.parent / "profiles" / "extracted"),
    )
    args = ap.parse_args()
    profiles_dir = Path(args.profiles_dir).resolve()
    expected_profiles = _load_profiles(profiles_dir)

    conn = connect_us_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    errors: list[str] = []
    warnings: list[str] = []

    for path in sorted(profiles_dir.glob("*.profile.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for issue in validate_profile(data, path):
            errors.append(f"profile {path.name}: {issue.message}")

    for eid, profile in expected_profiles.items():
        cur.execute(
            """
            SELECT e.entry_id, e.name, e.is_deleted, r.data
            FROM entries e
            JOIN revisions r ON r.rev_id = e.published_id
            WHERE e.entry_id = %s
            """,
            (int(eid),),
        )
        row = cur.fetchone()
        if not row:
            errors.append(f"dashboard {eid}: missing in US")
            continue
        if row["is_deleted"]:
            errors.append(f"dashboard {eid}: is_deleted=true")
        live = (row["data"] or {}).get("ydlProfile") or {}
        exp_selectors = {
            s.get("param"): s for s in profile.get("spec", {}).get("selectors", [])
        }
        live_selectors = {s.get("param"): s for s in live.get("spec", {}).get("selectors", [])}
        for param, exp in exp_selectors.items():
            live_sel = live_selectors.get(param)
            if not live_sel:
                warnings.append(f"dashboard {eid}: selector {param} missing in live ydlProfile")
                continue
            if live_sel.get("disabledUntil") != exp.get("disabledUntil"):
                errors.append(
                    f"dashboard {eid} selector {param}: disabledUntil drift "
                    f"live={live_sel.get('disabledUntil')} expected={exp.get('disabledUntil')}"
                )
            if param == "groupname":
                for dep in live_sel.get("disabledUntil") or []:
                    if dep in DATE_UPSTREAM:
                        errors.append(f"dashboard {eid}: groupname blocked by date ({dep})")

    cur.execute(
        """
        SELECT e.entry_id, e.name, r.data
        FROM entries e
        JOIN revisions r ON r.rev_id = e.published_id
        WHERE e.scope = 'dataset' AND e.is_deleted = false
          AND e.workbook_id = 2174370279772390401
        ORDER BY e.name
        """
    )
    for row in cur.fetchall():
        data = row["data"] or {}
        for msg in _raw_schema_ok(data):
            errors.append(f"dataset {row['entry_id']} ({row['name']}): {msg}")

    for ds_id in KNOWN_DASH_DATASETS:
        cur.execute(
            "SELECT 1 FROM entries WHERE entry_id = %s AND is_deleted = false",
            (ds_id,),
        )
        if not cur.fetchone():
            errors.append(f"dataset {ds_id}: missing")

    conn.close()

    print(f"org-workbooks health check — profiles={len(expected_profiles)}")
    if warnings:
        print("\nWARNINGS:")
        for w in warnings:
            print(f"  ! {w}")
    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  x {e}")
        print(f"\nFAILED ({len(errors)} error(s))")
        return 1

    print("\nOK — dashboards, profiles, datasets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
