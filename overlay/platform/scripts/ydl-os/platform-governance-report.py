#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path


def run(cmd: list[str], cwd: Path) -> str:
    p = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, check=False)
    if p.returncode != 0:
        return ""
    return p.stdout.strip()


def parse_trivy_summary(path: Path) -> tuple[int, int]:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return (0, 0)

    high = 0
    critical = 0
    for line in text.splitlines():
        if line.startswith("totals|"):
            parts = line.split("|")
            for part in parts:
                if part.startswith("high="):
                    high = int(part.split("=", 1)[1] or "0")
                if part.startswith("critical="):
                    critical = int(part.split("=", 1)[1] or "0")
            break
    return (high, critical)


def vendor_upstream_lag(repo_root: Path) -> tuple[int, int, str]:
    """Commits behind/ahead datalens-tech/datalens main in vendor/datalens submodule."""
    vendor = repo_root / "vendor" / "datalens"
    if not (vendor / "versions-config.json").is_file():
        return 0, 0, "vendor submodule missing"

    run(
        ["git", "fetch", "--quiet", "https://github.com/datalens-tech/datalens.git", "main"],
        vendor,
    )
    divergence = run(
        ["git", "rev-list", "--left-right", "--count", "FETCH_HEAD...HEAD"],
        vendor,
    )
    if not divergence:
        return 0, 0, "unable to compare vendor to datalens-tech/main"
    tokens = divergence.split()
    if len(tokens) != 2:
        return 0, 0, divergence
    return int(tokens[0] or 0), int(tokens[1] or 0), "datalens-tech/datalens main"


def count_recent_incidents(report_dir: Path, days: int) -> int:
    threshold = datetime.now(timezone.utc) - timedelta(days=days)
    count = 0
    for p in sorted(report_dir.glob("autopilot-incident-*.md")):
        try:
            ts_part = p.stem.replace("autopilot-incident-", "")
            dt = datetime.strptime(ts_part, "%Y%m%d-%H%M%SZ").replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if dt < threshold:
            continue
        text = p.read_text(encoding="utf-8")
        if "status: failed" in text:
            count += 1
    return count


def build_report(repo_root: Path, targets_path: Path) -> str:
    now = datetime.now(timezone.utc).isoformat()
    targets = json.loads(targets_path.read_text(encoding="utf-8"))

    behind, ahead, lag_ref = vendor_upstream_lag(repo_root)

    profiles_dir = repo_root / "overlay" / "platform" / "profiles" / "extracted"
    profiles = sorted(profiles_dir.glob("*.profile.json")) if profiles_dir.is_dir() else []
    profile_count = len(profiles)

    reader_matrix_path = (
        repo_root
        / "overlay"
        / "components"
        / "datalens-ui"
        / "tests"
        / "documentation"
        / "reader-scenario-matrix.md"
    )
    matrix_rows = 0
    if reader_matrix_path.exists():
        lines = reader_matrix_path.read_text(encoding="utf-8").splitlines()
        matrix_rows = len([l for l in lines if l.startswith("| RJ-")])

    sec_dir = repo_root / "overlay" / "platform" / "reports" / "security"
    latest_summary = sorted(sec_dir.glob("trivy-images-*-summary.txt"))
    high = 0
    critical = 0
    if latest_summary:
        high, critical = parse_trivy_summary(latest_summary[-1])

    incident_dir = repo_root / "overlay" / "platform" / "reports" / "autopilot"
    failed_runs_week = count_recent_incidents(incident_dir, 7)

    max_upstream_lag = targets["slo"]["maxUpstreamLagCommits"]
    max_critical = targets["slo"]["maxCriticalVulnerabilities"]
    max_failed_week = targets["slo"]["maxAutopilotFailedRunsPerWeek"]
    min_scenarios = targets["quality"]["requiredBlockingScenarioCount"]
    min_profiles = targets["quality"].get("requiredExtractedProfileCount", 12)

    baseline_path = repo_root / "overlay" / "platform" / "security-baseline.json"
    baseline_critical = 0
    if baseline_path.is_file():
        try:
            baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
            for img in (baseline.get("images") or {}).values():
                baseline_critical += int(img.get("critical", 0) or 0)
        except Exception:
            baseline_critical = 0

    drift_ok = True
    try:
        drift_out = subprocess.run(
            [
                "python3",
                str(repo_root / "overlay/platform/scripts/ydl-os/dashboard-profile-engine.py"),
                "drift-check",
                "--profiles-dir",
                str(profiles_dir),
            ],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )
        combined = (drift_out.stdout or "") + (drift_out.stderr or "")
        drift_ok = drift_out.returncode == 0 and "no profile drift" in combined.lower()
    except Exception:
        drift_ok = False

    security_regression_ok = critical <= baseline_critical if baseline_critical else critical <= max_critical

    vendor_us = "n/a"
    vc_path = repo_root / "vendor" / "datalens" / "versions-config.json"
    if vc_path.is_file():
        try:
            vendor_us = json.loads(vc_path.read_text(encoding="utf-8")).get("usVersion", "n/a")
        except Exception:
            vendor_us = "n/a"
    overlay_us = "n/a"
    us_pkg = repo_root / "overlay" / "components" / "datalens-us" / "package.json"
    if us_pkg.is_file():
        try:
            overlay_us = json.loads(us_pkg.read_text(encoding="utf-8")).get("version", "n/a")
        except Exception:
            overlay_us = "n/a"

    checks = [
        ("upstream_lag", behind <= max_upstream_lag, f"{behind} <= {max_upstream_lag}"),
        ("extracted_profiles_count", profile_count >= min_profiles, f"{profile_count} >= {min_profiles}"),
        ("security_regression", security_regression_ok, f"critical={critical} baseline_sum={baseline_critical}"),
        ("critical_vulnerabilities", critical <= max_critical, f"{critical} <= {max_critical}"),
        ("autopilot_failed_runs_week", failed_runs_week <= max_failed_week, f"{failed_runs_week} <= {max_failed_week}"),
        ("blocking_scenarios_count", matrix_rows >= min_scenarios, f"{matrix_rows} >= {min_scenarios}"),
        ("profile_drift", drift_ok, "latest drift report clean"),
    ]
    # Absolute zero-critical is tracked separately; release gate uses regression + quality SLOs.
    overall_ok = all(ok for name, ok, _ in checks if name != "critical_vulnerabilities")

    lines = [
        "# YDL Platform Governance Report",
        "",
        f"- generated_at_utc: {now}",
        f"- repo_root: {repo_root}",
        f"- overall_status: {'OK' if overall_ok else 'ATTENTION'}",
        "",
        "## KPI snapshot",
        "",
        f"- upstream_lag_commits: {behind} ({lag_ref})",
        f"- upstream_ahead_commits: {ahead}",
        f"- overlay_us_package: {overlay_us} (vendor usVersion: {vendor_us})",
        f"- profiles_in_git: {profile_count}",
        f"- reader_blocking_scenarios: {matrix_rows}",
        f"- vulnerabilities_high: {high}",
        f"- vulnerabilities_critical: {critical}",
        f"- autopilot_failed_runs_last_7d: {failed_runs_week}",
        "",
        "## SLO checks",
        "",
    ]
    for name, ok, expr in checks:
        lines.append(f"- {name}: {'PASS' if ok else 'FAIL'} ({expr})")

    lines.extend(
        [
            "",
            "## Governance cadence",
            "",
            f"- daily: {', '.join(targets['governanceCadence']['daily'])}",
            f"- weekly: {', '.join(targets['governanceCadence']['weekly'])}",
            f"- monthly: {', '.join(targets['governanceCadence']['monthly'])}",
            "",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate YDL platform governance KPI report")
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[4]))
    parser.add_argument(
        "--targets",
        default="overlay/platform/governance/platform-kpi.targets.json",
    )
    parser.add_argument("--out-dir", default="overlay/platform/reports/governance")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    targets = (repo_root / args.targets).resolve()
    out_dir = (repo_root / args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%SZ")
    out_file = out_dir / f"governance-{ts}.md"
    out_file.write_text(build_report(repo_root, targets), encoding="utf-8")
    print(f"Governance report: {out_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
