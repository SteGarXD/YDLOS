#!/usr/bin/env python3
"""Port all legacy bulk diffs into overlay/patches/datalens-ui (0 files left outside)."""
from __future__ import annotations

import csv
import os
import shutil
import subprocess
import sys
from pathlib import Path

YDL_REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(YDL_REPO))

LEGACY_ROOT = Path(
    os.environ.get(
        "LEGACY_ROOT",
        Path.home() / "ydl-os-future/overlay/components/datalens-ui/src",
    )
)
CORP_PATCH = YDL_REPO / "overlay/patches/datalens-ui"
TAXONOMY_CSV = YDL_REPO / "integration/reports/bulk-overlay-taxonomy.csv"
REMAINING = YDL_REPO / "integration/reports/legacy-not-in-overlay.txt"

VENDOR = YDL_REPO / "vendor/datalens/versions-config.json"
import json

ui_ver = json.loads(VENDOR.read_text())["uiVersion"]
UPSTREAM_DIR = Path(
    os.environ.get(
        "YDL_UI_WORKDIR",
        YDL_REPO / ".cache/datalens-ui",
    )
) / f"v{ui_ver}"
UPSTREAM_TAG = f"v{ui_ver}"

LEGACY_SUFFIXES = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".scss",
    ".svg",
    ".json",
    ".md",
    ".html",
}


def is_legacy_source_file(path: Path) -> bool:
    return path.is_file() and path.suffix in LEGACY_SUFFIXES


VALID_BUCKETS = {
    "ydl-only",
    "client-branding",
    "client-features",
    "client-date-controls",
    "client-viz-settings",
    "charts-engine-run",
    "charts-params",
    "ydl-config",
    "ydl-routes",
    "us-corporate",
    "layout-branding",
    "ydl-types",
    "legacy-bulk",
}


def log(msg: str) -> None:
    print(f"[port-all-legacy] {msg}", flush=True)


def in_corp_overlay(rel: str) -> bool:
    for module_dir in CORP_PATCH.glob("*/src"):
        if (module_dir / rel).exists():
            return True
    return False


def upstream_identical(rel: str, legacy_file: Path) -> bool:
    if not (UPSTREAM_DIR / ".git").exists():
        return False
    upstream_rel = f"src/{rel}"
    try:
        content = subprocess.run(
            ["git", "-C", str(UPSTREAM_DIR), "show", f"{UPSTREAM_TAG}:{upstream_rel}"],
            capture_output=True,
            check=True,
        ).stdout
        return content == legacy_file.read_bytes()
    except subprocess.CalledProcessError:
        return False


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)


def resolve_bucket(cls: str, mod: str) -> str:
    if mod in VALID_BUCKETS and mod != "ydl-corp":
        return mod
    return "legacy-bulk"


def port_from_taxonomy() -> tuple[int, int]:
    ported = skipped = 0
    if not TAXONOMY_CSV.exists():
        return 0, 0
    with TAXONOMY_CSV.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rel = row["path"].strip()
            cls = row["class"].strip()
            mod = row.get("module", "—").strip()
            if cls == "PORTED":
                skipped += 1
                continue
            src = LEGACY_ROOT / rel
            if not src.exists():
                continue
            bucket = resolve_bucket(cls, mod)
            if bucket != "legacy-bulk" and in_corp_overlay(rel):
                skipped += 1
                continue
            dst = CORP_PATCH / bucket / "src" / rel
            copy_file(src, dst)
            ported += 1
    return ported, skipped


def gap_fill_all_diffs() -> int:
    """Ensure every legacy≠upstream path exists in some overlay module."""
    filled = 0
    for legacy_file in LEGACY_ROOT.rglob("*"):
        if not is_legacy_source_file(legacy_file):
            continue
        rel = str(legacy_file.relative_to(LEGACY_ROOT))
        if upstream_identical(rel, legacy_file):
            continue
        if in_corp_overlay(rel):
            continue
        dst = CORP_PATCH / "legacy-bulk" / "src" / rel
        if dst.exists():
            continue
        copy_file(legacy_file, dst)
        filled += 1
    return filled


def verify_zero_remaining() -> int:
    remaining: list[str] = []
    for legacy_file in LEGACY_ROOT.rglob("*"):
        if not is_legacy_source_file(legacy_file):
            continue
        rel = str(legacy_file.relative_to(LEGACY_ROOT))
        if upstream_identical(rel, legacy_file):
            continue
        if in_corp_overlay(rel):
            continue
        remaining.append(rel)
    REMAINING.write_text("\n".join(remaining) + ("\n" if remaining else ""))
    return len(remaining)


def main() -> int:
    if not LEGACY_ROOT.is_dir():
        log(f"ERROR: legacy root missing: {LEGACY_ROOT}")
        return 1
    p1, s1 = port_from_taxonomy()
    p2 = gap_fill_all_diffs()
    rem = verify_zero_remaining()
    total_files = sum(
        1
        for _ in (CORP_PATCH / "legacy-bulk" / "src").rglob("*")
        if _.is_file()
    ) if (CORP_PATCH / "legacy-bulk" / "src").exists() else 0
    log(f"taxonomy_ported={p1} skipped_ported={s1} gap_fill={p2} legacy-bulk_files={total_files}")
    if rem:
        log(f"FAIL: {rem} paths still outside overlay → {REMAINING}")
        return 1
    log("OK: 0 legacy diff files left outside overlay/patches")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
