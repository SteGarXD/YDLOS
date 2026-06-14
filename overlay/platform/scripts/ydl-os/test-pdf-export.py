#!/usr/bin/env python3
"""Full PDF export smoke test via print-entry (run inside datalens-ui container)."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
import http.cookiejar

CHARTS = [
    ("pie_dash7", "2203039584890127818", ""),
    ("tree_dash7", "2203031947624580552", ""),
    ("table_dash9", "2235151361433929011", "&dta1=2025-06-01&dta2=2025-06-15"),
    ("tree_dash10", "2235158399425709364", "&dta1=2025-06-01&dta2=2025-06-15&io=I,O"),
]

MIN_PDF_BYTES = 5_000


def main() -> int:
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    base = "http://127.0.0.1:8080"
    signin = urllib.request.Request(
        base + "/gateway/auth/auth/signin",
        data=json.dumps({"login": "admin", "password": "qwe-123"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    opener.open(signin, timeout=30)
    cookies = "; ".join(f"{c.name}={c.value}" for c in cj)
    host = base

    print("=== PDF export full run ===")
    ok_n = 0
    for label, chart_id, extra in CHARTS:
        preview = (
            f"/preview/{chart_id}"
            "?_embedded=1&_no_controls=1&_no_virtual=1&_pdf_export=1&_action_params=1"
            f"{extra}"
        )
        payload = {
            "links": [chart_id],
            "host": host,
            "previewPath": preview,
            "urlQuery": "",
        }
        req = urllib.request.Request(
            base + "/print-entry",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "Cookie": cookies},
            method="POST",
        )
        t0 = time.time()
        try:
            with opener.open(req, timeout=420) as resp:
                data = resp.read()
            dt = time.time() - t0
            imgs = len(re.findall(rb"/Subtype /Image", data))
            ok = data[:4] == b"%PDF" and len(data) >= MIN_PDF_BYTES and imgs >= 1
            status = "OK" if ok else "SMALL"
            if ok:
                ok_n += 1
            print(f"{label:16} {status:6} {len(data):7} B  imgs={imgs}  {dt:.0f}s")
        except urllib.error.HTTPError as exc:
            err = exc.read().decode("utf-8", errors="replace")[:300]
            print(f"{label:16} FAIL {exc.code}")
            print(f"  {err}")

    print(f"PASSED {ok_n}/{len(CHARTS)}")
    return 0 if ok_n == len(CHARTS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
