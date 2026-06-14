#!/usr/bin/env python3
"""YDL OS production readiness score (100% = all automated gates pass)."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PLATFORM = REPO / "overlay" / "platform"


def run(cmd: list[str]) -> tuple[bool, str]:
    p = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True)
    return p.returncode == 0, (p.stdout or "") + (p.stderr or "")


def main() -> int:
    checks = [
        ("profiles_12", (PLATFORM / "profiles" / "extracted").is_dir() and len(list((PLATFORM / "profiles" / "extracted").glob("*.profile.json"))) >= 12),
        ("compose_hardening", (PLATFORM / "compose" / "docker-compose.security-hardening.yaml").is_file()),
        ("built_images_env", (PLATFORM / ".ydl-built-images.env").is_file()),
        ("ping_200", run(["curl", "-sf", "http://127.0.0.1/ping"])[0]),
    ]
    ok, _ = run(["bash", "integration/test-overlay-max.sh"])
    checks.append(("overlay_tests", ok))
    ok, out = run(["bash", "overlay/platform/scripts/ydl-os/security-secrets-check.sh"])
    checks.append(("secrets_scan", ok))

    passed = sum(1 for _, v in checks if v)
    total = len(checks)
    pct = 100.0 * passed / total if total else 0

    lines = [
        "# YDL OS Production Readiness (automated)",
        "",
        f"- generated_at_utc: {datetime.now(timezone.utc).isoformat()}",
        f"- score_percent: **{pct:.0f}%** ({passed}/{total} gates)",
        "",
        "## Gates",
        "",
    ]
    for name, ok in checks:
        lines.append(f"- {name}: {'PASS' if ok else 'FAIL'}")

    out_dir = PLATFORM / "reports" / "governance"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%SZ")
    path = out_dir / f"production-readiness-{ts}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Production readiness: {path}")
    print(f"score_percent={pct:.0f}")
    return 0 if pct >= 100 else 1


if __name__ == "__main__":
    raise SystemExit(main())
