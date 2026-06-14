#!/usr/bin/env python3
"""Compare chart 9/10 column guids vs dataset fields in US."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from psycopg2.extras import RealDictCursor

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from repka_db import connect_us_db  # noqa: E402

CHART9 = 2235151361433929011
CHART10 = 2235158399425709364


def parse_shared(data: dict) -> dict:
    raw = data.get("shared")
    if isinstance(raw, str):
        return json.loads(raw)
    return raw or {}


PAX_DATASET = 2234609395340150023
TRANS_DATASET = 2234611653930910984
ENC_TO_DATASET = {
    "3mthkry7crjun": PAX_DATASET,
    "sbi7198vnxxgc": TRANS_DATASET,
}


def load_dataset_schema(cur, entry_id: int) -> list[dict]:
    cur.execute(
        """
        SELECT r.data, e.name
        FROM revisions r
        JOIN entries e ON e.published_id = r.rev_id
        WHERE e.entry_id = %s
        """,
        (entry_id,),
    )
    row = cur.fetchone()
    if not row:
        return []
    d = row["data"]
    fields = d.get("result_schema") or d.get("dataset", {}).get("fields") or []
    print(f"  dataset entry {entry_id} ({row['name']}): {len(fields)} schema fields")
    return fields


def dataset_fields(cur, enc_id: str) -> list[tuple[str, str | None, str | None]]:
    entry_id = ENC_TO_DATASET.get(enc_id)
    if not entry_id:
        return []
    fields = load_dataset_schema(cur, entry_id)
    out: list[tuple[str, str | None, str | None]] = []
    for f in fields:
        out.append(
            (
                f.get("guid") or f.get("title") or "",
                f.get("calc_mode"),
                f.get("title"),
            )
        )
    return out


def audit_chart(cur, entry_id: int) -> None:
    cur.execute(
        "SELECT published_id, name FROM entries WHERE entry_id = %s",
        (entry_id,),
    )
    e = cur.fetchone()
    print(f"\n=== {entry_id} {e['name']} ===")
    cur.execute("SELECT data FROM revisions WHERE rev_id = %s", (e["published_id"],))
    data = cur.fetchone()["data"]
    shared = parse_shared(data)
    items = shared.get("visualization", {}).get("placeholders", [{}])[0].get("items", [])
    cols = [
        (i.get("guid"), i.get("source"), i.get("calc_mode"), i.get("title"), i.get("parameter"))
        for i in items
    ]
    print(f"  chart columns ({len(cols)}):")
    for c in cols:
        print(f"    guid={c[0]!r} source={c[1]!r} calc_mode={c[2]!r} title={c[3]!r} param={c[4]!r}")

    ds_ids = shared.get("datasetsIds") or []
    print(f"  datasetsIds: {ds_ids}")
    for ds in ds_ids:
        print(f"  --- fields for encoded id {ds} ---")
        fields = dataset_fields(cur, ds)
        guid_set = {g[0] for g in fields}
        missing = [c[0] for c in cols if c[0] not in guid_set]
        print(f"  MISSING in dataset: {missing}")
        purple = [c for c in cols if c[2] == "parameter" or c[4]]
        if purple:
            print(f"  PARAMETER-like columns: {purple}")
        params = [g for g in fields if g[1] == "parameter"]
        print(f"  dataset parameters ({len(params)}): {params}")


def dump_dataset(cur, entry_id: int) -> None:
    fields = load_dataset_schema(cur, entry_id)
    for f in fields:
        print(
            "  guid={guid!r} title={title!r} calc_mode={cm!r} type={tp!r}".format(
                guid=f.get("guid"),
                title=f.get("title"),
                cm=f.get("calc_mode"),
                tp=f.get("type"),
            )
        )


def main() -> int:
    conn = connect_us_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    for ds_id in (PAX_DATASET, TRANS_DATASET):
        print(f"\n=== DATASET {ds_id} ===")
        dump_dataset(cur, ds_id)
    audit_chart(cur, CHART9)
    audit_chart(cur, CHART10)
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
