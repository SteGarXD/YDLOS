#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from psycopg2.extras import Json, RealDictCursor

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR / "lib"))
from profile_validate import ValidationIssue, validate_profile  # noqa: E402
from repka_db import connect_us_db  # noqa: E402


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _iter_profile_paths(profiles_dir: Path) -> list[Path]:
    return sorted(
        [
            p
            for p in profiles_dir.rglob("*")
            if p.is_file() and p.suffix.lower() in {".json"}
        ]
    )


def cmd_validate(args: argparse.Namespace) -> int:
    profiles_dir = Path(args.profiles_dir).resolve()
    paths = _iter_profile_paths(profiles_dir)
    if not paths:
        print(f"No profiles found in {profiles_dir}", file=sys.stderr)
        return 1

    issues: list[ValidationIssue] = []
    for p in paths:
        try:
            data = _load_json(p)
        except Exception as e:
            issues.append(ValidationIssue(str(p), f"json parse failed: {e}"))
            continue
        issues.extend(validate_profile(data, p))

    if issues:
        print("Profile validation failed:")
        for i in issues:
            print(f"- {i.file}: {i.message}")
        return 2

    print(f"Validated {len(paths)} profile(s): OK")
    return 0


def _bundle_profiles(profiles_dir: Path) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for p in _iter_profile_paths(profiles_dir):
        data = _load_json(p)
        rows.append(
            {
                "path": str(p),
                "metadata": data.get("metadata", {}),
                "spec": data.get("spec", {}),
            }
        )
    return {
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "count": len(rows),
        "profiles": rows,
    }


def cmd_compile(args: argparse.Namespace) -> int:
    profiles_dir = Path(args.profiles_dir).resolve()
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = _bundle_profiles(profiles_dir)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)
    print(f"Compiled {bundle['count']} profiles -> {out_path}")
    return 0


def _apply_runtime_patch(_data: dict[str, Any], _profile: dict[str, Any]) -> bool:
    # Массовый патч дашбордов (fix-repka-all-dashboards) удалён — только ydlProfile в entry, без правки connections/aliases.
    return False


def _read_profiles(profiles_dir: Path) -> list[dict[str, Any]]:
    result = []
    for p in _iter_profile_paths(profiles_dir):
        data = _load_json(p)
        result.append({"path": str(p), "data": data})
    return result


def cmd_sync(args: argparse.Namespace) -> int:
    profiles_dir = Path(args.profiles_dir).resolve()
    profiles = _read_profiles(profiles_dir)
    if not profiles:
        print("No profiles to sync", file=sys.stderr)
        return 1

    conn = connect_us_db()
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            changed = 0
            for profile in profiles:
                payload = profile["data"]
                meta = payload.get("metadata", {})
                dashboard_entry_id = int(meta["dashboardEntryId"])
                profile_name = meta.get("name")

                cur.execute(
                    """
                    SELECT e.entry_id, e.name, e.published_id AS rev_id, r.data, r.annotation
                    FROM entries e
                    JOIN revisions r ON r.rev_id=e.published_id
                    WHERE e.entry_id=%s
                    """,
                    (dashboard_entry_id,),
                )
                row = cur.fetchone()
                if not row:
                    print(f"SKIP dashboard not found: {dashboard_entry_id}")
                    continue

                data = row["data"] or {}
                ann = row["annotation"] or {}
                runtime_patched = _apply_runtime_patch(data, payload)
                ann["ydlProfile"] = {
                    "name": profile_name,
                    "version": meta.get("version"),
                    "path": profile["path"],
                    "syncedAtUtc": datetime.now(timezone.utc).isoformat(),
                    "runtimePatchApplied": runtime_patched,
                }
                data["ydlProfile"] = payload

                changed += 1
                if args.apply:
                    cur.execute(
                        "UPDATE revisions SET data=%s, annotation=%s WHERE rev_id=%s",
                        (Json(data), Json(ann), row["rev_id"]),
                    )
                    suffix = " + repka runtime patch" if runtime_patched else ""
                    print(f"SYNC {row['name']} ({dashboard_entry_id}) <- {profile_name}{suffix}")
                else:
                    print(f"DRY-RUN {row['name']} ({dashboard_entry_id}) <- {profile_name}")

        if args.apply:
            conn.commit()
            print("Profile sync applied")
        else:
            conn.rollback()
            print("Profile sync dry-run completed (rolled back)")
    finally:
        conn.close()
    return 0


def cmd_drift_check(args: argparse.Namespace) -> int:
    profiles_dir = Path(args.profiles_dir).resolve()
    profiles = _read_profiles(profiles_dir)
    if not profiles:
        print("No profiles found", file=sys.stderr)
        return 1

    expected = {
        str(p["data"]["metadata"]["dashboardEntryId"]): {
            "name": p["data"]["metadata"]["name"],
            "version": p["data"]["metadata"]["version"],
            "path": p["path"],
        }
        for p in profiles
    }

    conn = connect_us_db()
    drifts: list[str] = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            for entry_id, exp in expected.items():
                cur.execute(
                    """
                    SELECT e.entry_id, e.name, r.annotation
                    FROM entries e
                    JOIN revisions r ON r.rev_id=e.published_id
                    WHERE e.entry_id=%s
                    """,
                    (int(entry_id),),
                )
                row = cur.fetchone()
                if not row:
                    drifts.append(f"{entry_id}: dashboard missing in US")
                    continue
                ann = row.get("annotation") or {}
                state = ann.get("ydlProfile") or {}
                if not state:
                    drifts.append(f"{entry_id}: profile annotation missing")
                    continue
                if state.get("name") != exp["name"] or state.get("version") != exp["version"]:
                    drifts.append(
                        f"{entry_id}: expected {exp['name']}:{exp['version']} but found {state.get('name')}:{state.get('version')}"
                    )
    finally:
        conn.close()

    if drifts:
        print("DRIFT DETECTED:")
        for d in drifts:
            print(f"- {d}")
        return 2

    print("No profile drift detected")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="YDL OS Dashboard Profile Engine")
    sub = p.add_subparsers(dest="command", required=True)

    p_validate = sub.add_parser("validate")
    p_validate.add_argument("--profiles-dir", required=True)
    p_validate.set_defaults(func=cmd_validate)

    p_compile = sub.add_parser("compile")
    p_compile.add_argument("--profiles-dir", required=True)
    p_compile.add_argument("--out", required=True)
    p_compile.set_defaults(func=cmd_compile)

    p_sync = sub.add_parser("sync")
    p_sync.add_argument("--profiles-dir", required=True)
    p_sync.add_argument("--apply", action="store_true")
    p_sync.set_defaults(func=cmd_sync)

    p_drift = sub.add_parser("drift-check")
    p_drift.add_argument("--profiles-dir", required=True)
    p_drift.set_defaults(func=cmd_drift_check)

    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
