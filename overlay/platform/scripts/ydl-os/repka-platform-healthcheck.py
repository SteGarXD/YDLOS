#!/usr/bin/env python3
"""
Прогон по дашбордам org-workbooks: aliases, параметры датасетов vs селектор ds/dt/dta, пустые defaults.
Возвращает код 1 при наличии проблем (для CI/cron).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from dash_alias_rules import build_alias_groups, chart_param_guids

PGHOST = os.environ.get("PGHOST", "postgres")
PGPORT = int(os.environ.get("PGPORT", "5432") or "5432")
PGUSER = os.environ.get("POSTGRES_USER", os.environ.get("PGUSER", "pg-user"))
PGPASSWORD = os.environ.get("POSTGRES_PASSWORD", "CHANGE_ME_STRONG_PASSWORD")
PGDATABASE = os.environ.get("POSTGRES_DB_US", os.environ.get("PGDATABASE", "pg-us-db"))


def _manual_ds_default(tab: dict) -> str | None:
    for item in tab.get("items", []):
        if item.get("type") != "group_control":
            continue
        for g in (item.get("data") or {}).get("group", []):
            src = g.get("source") or {}
            if g.get("sourceType") == "manual" and src.get("fieldName") == "ds":
                return (g.get("defaults") or {}).get("ds")
    return None


def main() -> int:
    issues: list[str] = []
    conn = psycopg2.connect(
        host=PGHOST,
        port=PGPORT,
        user=PGUSER,
        password=PGPASSWORD,
        dbname=PGDATABASE,
    )
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT e.entry_id, e.name, r.data
            FROM entries e
            JOIN revisions r ON e.published_id = r.rev_id
            WHERE e.scope = 'dash' AND NOT e.is_deleted
              AND e.name ~ '^[0-9]'
            ORDER BY e.name
            """
        )
        for row in cur.fetchall():
            entry_id = row["entry_id"]
            name = row["name"]
            data = row["data"]
            if not isinstance(data, dict):
                continue
            tab = (data.get("tabs") or [{}])[0]
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
            for ds_row in cur.fetchall():
                ddata = ds_row["data"]
                if isinstance(ddata, dict):
                    chart_params |= chart_param_guids(ddata)

            ds_default = _manual_ds_default(tab)
            if ds_default == "":
                issues.append(f"[{name}] пустой default ds у селектора даты")

            if "ds" in chart_params and {"dt1", "dt2"}.issubset(chart_params):
                issues.append(
                    f"[{name}] датасет: dt1/dt2, нет ds — нужны aliases ds→dt1/dt2"
                )
            alias_groups = (tab.get("aliases") or {}).get("default") or []
            has_ds_dta_alias = any(
                isinstance(g, list) and {"ds", "dta1", "dta2"}.issubset({str(x) for x in g})
                for g in alias_groups
            )
            if (
                "ds" not in chart_params
                and {"dta1", "dta2"}.issubset(chart_params)
                and not has_ds_dta_alias
            ):
                issues.append(
                    f"[{name}] датасет: dta1/dta2, селектор ds — нужны aliases ds→dta1/dta2"
                )

            expected = build_alias_groups(entry_id, chart_params, tab)
            actual = (tab.get("aliases") or {}).get("default") or []
            if expected and actual != expected:
                issues.append(
                    f"[{name}] aliases: ожидалось {expected}, сейчас {actual}"
                )

    conn.close()
    if not issues:
        print("OK: проблем не найдено")
        return 0
    print(f"Найдено проблем: {len(issues)}")
    for line in issues:
        print(" -", line)
    return 1


if __name__ == "__main__":
    sys.exit(main())
