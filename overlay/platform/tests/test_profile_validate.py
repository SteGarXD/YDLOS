#!/usr/bin/env python3
"""Dashboard profile validation (no DB)."""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "scripts" / "ydl-os" / "dashboard-profile-engine.py"
PROFILES = REPO / "profiles" / "extracted"


class ProfileValidateTests(unittest.TestCase):
    def test_all_extracted_profiles_validate(self) -> None:
        if not PROFILES.is_dir():
            self.skipTest(f"profiles/extracted not in tree (public export omits corp profiles)")
        proc = subprocess.run(
            [sys.executable, str(ENGINE), "validate", "--profiles-dir", str(PROFILES)],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            proc.returncode,
            0,
            msg=(proc.stdout or "") + (proc.stderr or ""),
        )

    def test_minimum_profile_count(self) -> None:
        if not PROFILES.is_dir():
            self.skipTest(f"profiles/extracted not in tree (public export omits corp profiles)")
        count = len(list(PROFILES.glob("*.profile.json")))
        self.assertGreaterEqual(count, 12)


if __name__ == "__main__":
    unittest.main()
