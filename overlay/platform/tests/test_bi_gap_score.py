#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

PLATFORM = Path(__file__).resolve().parents[1]
YDL_ROOT = PLATFORM.parent.parent


class BiGapScoreTests(unittest.TestCase):
    def test_checklist_loads_and_maturity_computed(self) -> None:
        checklist = PLATFORM / "governance" / "bi-future-platform-checklist.json"
        data = json.loads(checklist.read_text(encoding="utf-8"))
        total_w = sum(int(d["weight"]) for d in data["dimensions"])
        score = sum(int(d["weight"]) * float(d["current_score"]) for d in data["dimensions"])
        maturity = score / total_w
        self.assertGreater(maturity, 40)
        self.assertLess(maturity, data["target_maturity"])

    def test_gap_report_script(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(YDL_ROOT / "integration" / "compute-bi-future-gap.py")],
            cwd=str(YDL_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("maturity_percent=", proc.stdout)


import sys  # noqa: E402

if __name__ == "__main__":
    unittest.main()
