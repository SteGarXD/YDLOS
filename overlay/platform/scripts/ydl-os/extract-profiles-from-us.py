#!/usr/bin/env python3
"""
Extract DashboardProfile v1 specs from existing US dashboard revisions.

org-workbooks/YDL dashboards already carry behavior in revision.data (group_control,
aliases, buttonApply, selector defaults). This script materializes that into
Git profile specs so the new profile engine becomes the single contract layer.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from psycopg2.extras import RealDictCursor

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
from repka_db import connect_us_db  # noqa: E402


def slugify(name: str) -> str:
    value = name.strip().lower()
    value = re.sub(r"[^a-z0-9а-яё_-]+", "-", value, flags=re.IGNORECASE)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "dashboard"


def _selector_param(g: dict[str, Any]) -> str:
    src = g.get("source") or {}
    if src.get("fieldName"):
        return str(src["fieldName"])
    if src.get("datasetFieldId"):
        return str(src["datasetFieldId"])
    return str(g.get("id") or "unknown")


def _selector_type(g: dict[str, Any]) -> str:
    src = g.get("source") or {}
    if g.get("sourceType") == "manual" or src.get("fieldName") == "ds":
        return "date"
    if g.get("multiselectable"):
        return "multiselect"
    return "select"


def _depends_on(selectors: list[dict[str, Any]], idx: int) -> list[str]:
    if idx <= 0:
        return []
    return [selectors[idx - 1]["param"]]


def _aliases_from_tab(tab: dict[str, Any]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for group in tab.get("aliases", {}).get("default", []) or []:
        if not isinstance(group, list) or len(group) < 2:
            continue
        canonical = str(group[0])
        out[canonical] = [str(x) for x in group[1:]]
    return out


def _params_from_selectors(
    selectors: list[dict[str, Any]], alias_map: dict[str, list[str]]
) -> list[dict[str, Any]]:
    seen: set[str] = set()
    params: list[dict[str, Any]] = []
    for sel in selectors:
        canonical = sel["param"]
        if canonical in seen:
            continue
        seen.add(canonical)
        defaults = sel.get("defaults") or {}
        default_value = defaults.get(canonical, "")
        param_type = "date" if sel["type"] == "date" else "string"
        if sel["type"] == "multiselect":
            param_type = "string[]"
            if isinstance(default_value, str) and default_value:
                default_value = [x.strip() for x in default_value.split(",") if x.strip()]
            elif not default_value:
                default_value = []
        params.append(
            {
                "canonical": canonical,
                "type": param_type,
                "aliases": alias_map.get(canonical, []),
                "defaultValue": default_value,
                "nullable": True,
                "normalizers": ["trim"],
            }
        )
    return params


def profile_from_dashboard(row: dict[str, Any]) -> dict[str, Any] | None:
    data = row.get("data") or {}
    tabs = data.get("tabs") or []
    if not tabs:
        return None

    selectors: list[dict[str, Any]] = []
    button_apply = False
    alias_map: dict[str, list[str]] = {}

    for tab in tabs:
        alias_map.update(_aliases_from_tab(tab))
        for item in tab.get("items", []):
            if item.get("type") != "group_control":
                continue
            gdata = item.get("data") or {}
            if gdata.get("buttonApply"):
                button_apply = True
            for g in gdata.get("group", []) or []:
                param = _selector_param(g)
                selectors.append(
                    {
                        "id": str(g.get("id") or param),
                        "title": str(g.get("title") or param),
                        "param": param,
                        "type": _selector_type(g),
                        "defaults": g.get("defaults") or {},
                        "dependsOn": [],
                        "disabledUntil": [],
                    }
                )

    if not selectors:
        return None

    for idx, sel in enumerate(selectors):
        param = sel["param"]
        sel_type = sel["type"]
        deps = _depends_on(selectors, idx)
        if param == "groupname" and deps == ["ds"]:
            deps = []
        if sel_type == "date":
            deps = []
        elif param in ("mrshr_1", "mrshr_2") and deps:
            flight_key = "flightno_1" if param == "mrshr_1" else "flightno_2"
            deps = [flight_key]
        sel["dependsOn"] = deps
        sel["disabledUntil"] = list(deps)
        sel.pop("defaults", None)

    params = _params_from_selectors(selectors, alias_map)
    name = slugify(str(row.get("name") or row.get("entry_id")))

    return {
        "apiVersion": "ydl-os/v1",
        "kind": "DashboardProfile",
        "metadata": {
            "name": name,
            "dashboardEntryId": str(row["entry_id"]),
            "owner": "extracted-from-us",
            "version": "1.0.0",
            "labels": {
                "domain": "repka" if "repka" in name.lower() else "general",
                "source": "us-extract",
                "buttonApply": str(button_apply).lower(),
            },
        },
        "spec": {
            "params": params,
            "selectors": selectors,
            "permissions": {
                "reader": {
                    "view": True,
                    "changeFilters": True,
                    "edit": False,
                    "openGroupEditor": False,
                    "share": False,
                },
                "editor": {
                    "view": True,
                    "changeFilters": True,
                    "edit": True,
                    "openGroupEditor": True,
                    "share": True,
                },
                "admin": {
                    "view": True,
                    "changeFilters": True,
                    "edit": True,
                    "openGroupEditor": True,
                    "share": True,
                },
            },
            "uiBehavior": {
                "topbar": {
                    "editButton": True,
                    "groupEditorButton": True,
                    "saveButton": True,
                },
                "menu": {
                    "leftNavigation": True,
                    "collections": True,
                    "workbooks": True,
                },
                "groupEditor": {
                    "enabled": True,
                    "readerVisible": False,
                },
            },
            "runtimePolicy": {
                "maxFilterLatencyMs": 1200,
                "maxRenderLatencyMs": 3000,
                "rollbackOnProfileFailure": True,
                "canaryPercent": 10,
            },
            "tests": {
                "smoke": ["dashboard_opens", "filter_chain_available"],
                "criticalJourneys": ["reader_open_and_filter_chain"],
            },
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract dashboard profiles from US metadata")
    parser.add_argument(
        "--out-dir",
        default="datalens/profiles/extracted",
        help="Output directory for *.profile.json files",
    )
    parser.add_argument("--entry-id", help="Extract only one dashboard entry_id")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = connect_us_db()
    extracted = 0
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if args.entry_id:
                cur.execute(
                    """
                    SELECT e.entry_id, e.name, r.data
                    FROM entries e
                    JOIN revisions r ON e.published_id = r.rev_id
                    WHERE e.entry_id = %s
                    """,
                    (int(args.entry_id),),
                )
            else:
                cur.execute(
                    """
                    SELECT e.entry_id, e.name, r.data
                    FROM entries e
                    JOIN revisions r ON e.published_id = r.rev_id
                    WHERE e.scope = 'dash' AND NOT e.is_deleted
                    ORDER BY e.name
                    """
                )
            rows = cur.fetchall()
    finally:
        conn.close()

    for row in rows:
        profile = profile_from_dashboard(row)
        if not profile:
            continue
        out_path = out_dir / f"{profile['metadata']['name']}.profile.json"
        out_path.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        extracted += 1
        print(f"extracted: {row['name']} -> {out_path}")

    print(f"done: extracted={extracted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
