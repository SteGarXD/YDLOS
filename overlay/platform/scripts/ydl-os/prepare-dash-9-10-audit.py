#!/usr/bin/env python3
"""Read-only audit: готовность дашбордов 9 и 10 (виджет, aliases, параметры чарта)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from dash_alias_rules import build_alias_groups, chart_param_guids, revision_data_from_row
from repka_db import connect_us_db

DASHBOARDS = {
    2206099161223267881: "9. Перечень пассажиров",
    2206100069801788973: "10. Трансферные пассажиры",
}

EXPECTED_CHART_PARAMS = {
    2206099161223267881: {"dta1", "dta2", "flights"},
    2206100069801788973: {"dta1", "dta2", "flights", "io"},
}


def main() -> int:
    conn = connect_us_db()
    cur = conn.cursor()
    exit_code = 0

    for entry_id, title in DASHBOARDS.items():
        print(f"\n=== {title} ({entry_id}) ===")
        cur.execute(
            """
            SELECT r.data
            FROM entries e
            JOIN revisions r ON r.rev_id = e.published_id
            WHERE e.entry_id = %s
            """,
            (entry_id,),
        )
        row = cur.fetchone()
        data = revision_data_from_row(row)
        if not data:
            print("  ERROR: no published revision")
            exit_code = 1
            continue

        tab = data["tabs"][0]
        widgets = [i for i in tab.get("items", []) if i.get("type") == "widget"]
        controls = [i for i in tab.get("items", []) if i.get("type") == "group_control"]
        print(f"  widgets: {len(widgets)}, group_controls: {len(controls)}")

        if not widgets:
            print("  BLOCKED: add chart widget (see DASHBOARD-9/10-*.md)")
            exit_code = 1
        else:
            for w in widgets:
                t = w["data"]["tabs"][0]
                print(f"  chartId: {t.get('chartId')} title: {t.get('title')}")

        aliases = tab.get("aliases", {}).get("default", [])
        print(f"  aliases: {aliases}")

        chart_ids = []
        for w in widgets:
            for t in w.get("data", {}).get("tabs", []):
                cid = t.get("chartId")
                if cid:
                    chart_ids.append(cid)

        if not chart_ids:
            continue

        # chartId is display key; resolve via entries.key suffix is unreliable — report only ids
        expected = EXPECTED_CHART_PARAMS[entry_id]
        print(f"  expected chart params (min): {sorted(expected)}")

        # Try to infer params from linked chart revisions by scanning workbook charts
        cur.execute(
            """
            SELECT e.key, r.data
            FROM entries e
            JOIN revisions r ON r.rev_id = e.published_id
            WHERE e.workbook_id = (SELECT workbook_id FROM entries WHERE entry_id = %s)
              AND e.type IN ('', 'table_wizard_node', 'd3_wizard_node')
            """,
            (entry_id,),
        )
        found_params: set[str] = set()
        for key, rev_data in cur.fetchall():
            if not isinstance(rev_data, dict):
                continue
            key_str = str(key or "")
            if not any(cid in key_str for cid in chart_ids):
                shared = rev_data.get("shared")
                if isinstance(shared, str):
                    try:
                        shared = json.loads(shared)
                    except json.JSONDecodeError:
                        shared = {}
                ds_ids = shared.get("datasetsIds") if isinstance(shared, dict) else None
                if not ds_ids:
                    continue
            # load datasets in workbook for params
            pass

        cur.execute(
            """
            SELECT r.data
            FROM entries e
            JOIN revisions r ON r.rev_id = e.published_id
            WHERE e.workbook_id = (SELECT workbook_id FROM entries WHERE entry_id = %s)
              AND r.data::text ILIKE '%%fnAZ_Rep_%%'
            """,
            (entry_id,),
        )
        for (ds_data,) in cur.fetchall():
            if not isinstance(ds_data, dict):
                continue
            name = ds_data.get("name", "")
            if entry_id == 2206099161223267881 and "PAXES" not in str(
                ds_data.get("source_collections", [])
            ):
                sub = ""
                try:
                    sub = ds_data["source_collections"][0]["origin"]["parameters"]["subsql"]
                except (KeyError, IndexError, TypeError):
                    sub = ""
                if "PAXESByPeriod" in sub:
                    print(f"  dataset OK: {name}")
                    found_params |= chart_param_guids(ds_data)
            if entry_id == 2206100069801788973:
                try:
                    sub = ds_data["source_collections"][0]["origin"]["parameters"]["subsql"]
                except (KeyError, IndexError, TypeError):
                    sub = ""
                if "TransfersByPeriod2_partners" in sub:
                    print(f"  dataset OK: {name}")
                    found_params |= chart_param_guids(ds_data)

        if found_params:
            missing = expected - found_params
            if missing:
                print(f"  WARN: dataset missing params: {sorted(missing)}")
                exit_code = 1
            else:
                print(f"  dataset params OK: {sorted(found_params & expected)}")

        suggested = build_alias_groups(entry_id, found_params or expected, tab)
        if aliases != suggested and widgets:
            print(f"  suggest running fix-dash-selector-links.py (expected aliases ~ {suggested})")

    conn.close()
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
