#!/usr/bin/env python3
"""Аудит aliases и connections на всех дашбордах с group_control."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from dash_alias_rules import (
    DASH_ENTRY_ALIASES,
    build_alias_groups,
    chart_param_guids,
    revision_data_from_row,
)
from repka_db import connect_us_db

SELECTOR_DATASET_LINK = "x095jl108vtah"
DASH6_ENTRY = 2188596311840786050
DASH6_FLIGHT_FIELDS = {"9g": "flightno_1", "BM": "flightno_2"}
DASH6_DIRECTION_FIELDS = {"vr": "mrshr_1", "Ay": "mrshr_2"}


def _inner_ids(tab: dict) -> set[str]:
    ids: set[str] = set()
    for item in tab.get("items", []):
        if item.get("type") != "group_control":
            continue
        for g in (item.get("data") or {}).get("group", []):
            if g.get("id"):
                ids.add(g["id"])
    return ids


def _widget_tab_ids(tab: dict) -> set[str]:
    out: set[str] = set()
    for item in tab.get("items", []):
        if item.get("type") != "widget":
            continue
        for wt in (item.get("data") or {}).get("tabs", []):
            if wt.get("id"):
                out.add(wt["id"])
    return out


def _alias_groups(tab: dict) -> list[set[str]]:
    aliases = tab.get("aliases") or {}
    return [
        {str(x) for x in g}
        for g in aliases.get("default") or []
        if isinstance(g, list)
    ]


def _expected_alias_groups(entry_id: int, chart_params: set[str], tab: dict) -> list[set[str]]:
    if entry_id in DASH_ENTRY_ALIASES:
        return [{str(x) for x in g} for g in DASH_ENTRY_ALIASES[entry_id]]
    return [{str(x) for x in g} for g in build_alias_groups(entry_id, chart_params, tab)]


def main() -> int:
    conn = connect_us_db()
    issues: list[str] = []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT e.entry_id, e.name, r.data
            FROM entries e
            JOIN revisions r ON e.published_id = r.rev_id
            WHERE e.scope = 'dash' AND NOT e.is_deleted
            ORDER BY e.name
            """
        )
        for entry_id, name, data in cur.fetchall():
            if not isinstance(data, dict):
                continue
            cur.execute(
                """
                SELECT DISTINCT dr.data
                FROM links l1
                JOIN entries w ON w.entry_id = l1.to_id AND w.scope = 'widget'
                JOIN links l2 ON l2.from_id = w.entry_id AND l2.name = 'dataset'
                JOIN entries ds ON ds.entry_id = l2.to_id
                JOIN revisions dr ON dr.rev_id = ds.published_id
                WHERE l1.from_id = %s
                """,
                (entry_id,),
            )
            chart_params: set[str] = set()
            for row in cur.fetchall():
                ddata = revision_data_from_row(row)
                if ddata:
                    chart_params |= chart_param_guids(ddata)

            for ti, tab in enumerate(data.get("tabs") or []):
                inner = _inner_ids(tab)
                if not inner:
                    continue
                charts = _widget_tab_ids(tab)
                groups = _alias_groups(tab)
                expected = _expected_alias_groups(entry_id, chart_params, tab)
                tab_label = f"{name} tab#{ti}"

                for need in expected:
                    if not any(need.issubset(g) for g in groups):
                        issues.append(
                            f"{tab_label}: missing alias group {sorted(need)} "
                            f"(have {groups})"
                        )

                if entry_id == DASH6_ENTRY:
                    for item in tab.get("items", []):
                        if item.get("type") != "group_control":
                            continue
                        for g in (item.get("data") or {}).get("group", []):
                            gid = g.get("id")
                            want = DASH6_FLIGHT_FIELDS.get(gid) or DASH6_DIRECTION_FIELDS.get(gid)
                            if not want:
                                continue
                            got = (g.get("source") or {}).get("fieldName")
                            if got != want:
                                issues.append(
                                    f"{tab_label}: selector {gid} fieldName={got!r}, want {want!r}"
                                )

                for cid in inner:
                    for chart_id in charts:
                        if not any(
                            c.get("from") == cid
                            and c.get("to") == chart_id
                            and c.get("kind") == "incoming"
                            for c in tab.get("connections") or []
                        ):
                            issues.append(
                                f"{tab_label}: missing connection {cid} -> {chart_id} (incoming)"
                            )

                for item in tab.get("items", []):
                    if item.get("type") != "group_control":
                        continue
                    for g in (item.get("data") or {}).get("group", []):
                        src = g.get("source") or {}
                        title = (g.get("title") or "").lower()
                        if g.get("sourceType") == "manual":
                            continue
                        if "групп" in title or src.get("datasetFieldId") in (
                            "groupname",
                            "groupid",
                        ):
                            if src.get("datasetId") != SELECTOR_DATASET_LINK:
                                issues.append(
                                    f"{tab_label}: group selector datasetId={src.get('datasetId')!r}"
                                )
                        elif "рейс" in title or src.get("datasetFieldId") == "flightno":
                            if (
                                entry_id != DASH6_ENTRY
                                and src.get("datasetId") != SELECTOR_DATASET_LINK
                            ):
                                issues.append(
                                    f"{tab_label}: flight selector datasetId={src.get('datasetId')!r}"
                                )

    conn.close()
    if issues:
        print("ISSUES:")
        for line in issues:
            print(f"  - {line}")
        print(f"total: {len(issues)}")
        return 1
    print("OK: all dashboards pass alias/connection checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
