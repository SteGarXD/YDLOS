#!/usr/bin/env python3
"""
Dashboard profile tooling (no templates, no full-profile copy).

- NEW dashboard  → extract unique spec from US after the dashboard exists in BI.
- Reuse logic    → copy only named sections from an existing profile (inherit-sections).
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

INHERITABLE_SECTIONS = frozenset(
    {"params", "selectors", "permissions", "uiBehavior", "tests", "runtimePolicy"}
)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9_-]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "dashboard-profile"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def resolve_profile_path(profiles_root: Path, name_or_path: str) -> Path:
    raw = Path(name_or_path)
    if raw.is_file():
        return raw.resolve()
    stem = name_or_path.removesuffix(".profile.json")
    candidate = profiles_root / "extracted" / f"{stem}.profile.json"
    if candidate.is_file():
        return candidate.resolve()
    raise FileNotFoundError(f"Profile not found: {name_or_path}")


def cmd_extract(args: argparse.Namespace) -> int:
    """Extract a NEW unique profile from US (source of truth = real dashboard)."""
    script = Path(__file__).resolve().parent / "extract-profiles-from-us.py"
    out_dir = Path(args.out_dir).resolve()
    cmd = [
        sys.executable,
        str(script),
        "--out-dir",
        str(out_dir),
        "--entry-id",
        str(args.dashboard_entry_id),
    ]
    print("NEW dashboard profile = extract from US (not a copy of another profile).")
    print("Running:", " ".join(cmd))
    return subprocess.call(cmd)


def cmd_inherit_sections(args: argparse.Namespace) -> int:
    """Copy only explicit spec sections from an existing profile into a target profile."""
    repo = Path(args.repo_root).resolve()
    profiles_root = repo / "overlay" / "platform" / "profiles"
    source_path = resolve_profile_path(profiles_root, args.from_profile)
    source = read_json(source_path)
    source_name = source.get("metadata", {}).get("name") or source_path.stem

    sections = [s.strip() for s in args.sections.split(",") if s.strip()]
    unknown = [s for s in sections if s not in INHERITABLE_SECTIONS]
    if unknown:
        raise SystemExit(f"Unknown sections: {unknown}. Allowed: {sorted(INHERITABLE_SECTIONS)}")

    if args.into:
        target_path = resolve_profile_path(profiles_root, args.into)
        target = read_json(target_path)
    else:
        if not args.name or not args.dashboard_entry_id:
            raise SystemExit("--name and --dashboard-entry-id required when --into is omitted")
        profile_name = slugify(args.name)
        target_path = profiles_root / "extracted" / f"{profile_name}.profile.json"
        target = {
            "apiVersion": "ydl-os/v1",
            "kind": "DashboardProfile",
            "metadata": {
                "name": profile_name,
                "dashboardEntryId": str(args.dashboard_entry_id),
                "owner": args.owner,
                "version": "1.0.0",
                "labels": {
                    "domain": args.domain,
                    "source": "new-dashboard",
                },
            },
            "spec": {
                "params": [],
                "selectors": [],
                "permissions": {},
                "uiBehavior": {},
                "tests": {"smoke": [], "criticalJourneys": []},
                "runtimePolicy": {},
            },
        }

    spec = target.setdefault("spec", {})
    inherited: list[str] = []
    for section in sections:
        if section not in source.get("spec", {}):
            continue
        spec[section] = copy.deepcopy(source["spec"][section])
        inherited.append(section)

    meta = target.setdefault("metadata", {})
    labels = meta.setdefault("labels", {})
    if inherited:
        labels["inheritedSections"] = ",".join(inherited)
        labels["inheritedFrom"] = source_name

    if target_path.exists() and not args.force:
        raise SystemExit(f"Target exists: {target_path} (use --force)")

    write_json(target_path, target)
    print(f"Updated {target_path}")
    print(f"Inherited sections from {source_name}: {', '.join(inherited) or '(none)'}")
    print("Note: this is partial reuse only — the dashboard profile remains its own file.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="YDL dashboard profiles: extract new from US, or inherit parts only"
    )
    p.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[4]))
    sub = p.add_subparsers(dest="command", required=True)

    ex = sub.add_parser(
        "extract",
        help="NEW dashboard: extract unique profile from US by entry_id (recommended)",
    )
    ex.add_argument("--dashboard-entry-id", required=True)
    ex.add_argument(
        "--out-dir",
        default="overlay/platform/profiles/extracted",
        help="Output directory for *.profile.json",
    )

    inh = sub.add_parser(
        "inherit-sections",
        help="Reuse parts of an old profile (params/selectors/…) in another profile — not a full copy",
    )
    inh.add_argument("--from-profile", required=True, help="Existing extracted profile name or path")
    inh.add_argument(
        "--sections",
        required=True,
        help="Comma-separated: params,selectors,permissions,uiBehavior,tests,runtimePolicy",
    )
    inh.add_argument("--into", help="Target profile name or path (must exist unless creating shell)")
    inh.add_argument("--name", help="New profile slug if creating target shell")
    inh.add_argument("--dashboard-entry-id", help="US entry_id for new target shell")
    inh.add_argument("--owner", default="bi-platform")
    inh.add_argument("--domain", default="general")
    inh.add_argument("--force", action="store_true")
    return p


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "extract":
        return cmd_extract(args)
    if args.command == "inherit-sections":
        return cmd_inherit_sections(args)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
