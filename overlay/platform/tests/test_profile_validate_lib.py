#!/usr/bin/env python3
from __future__ import annotations

import sys
import unittest
from pathlib import Path

_LIB = Path(__file__).resolve().parents[1] / "scripts" / "ydl-os" / "lib"
sys.path.insert(0, str(_LIB))
from profile_validate import validate_profile  # noqa: E402


def _minimal_profile() -> dict:
    return {
        "apiVersion": "ydl-os/v1",
        "kind": "DashboardProfile",
        "metadata": {
            "name": "test",
            "dashboardEntryId": "123456",
            "owner": "qa",
            "version": "1",
        },
        "spec": {
            "params": [{"canonical": "p1", "aliases": [], "normalizers": ["trim"]}],
            "selectors": [{"param": "p1", "dependsOn": [], "disabledUntil": []}],
            "permissions": {"reader": [], "editor": [], "admin": []},
            "tests": {"smoke": ["open"], "criticalJourneys": ["filter"]},
        },
    }


class ProfileValidateLibTests(unittest.TestCase):
    def test_valid_minimal(self) -> None:
        self.assertEqual(validate_profile(_minimal_profile(), "x.json"), [])

    def test_bad_api_version(self) -> None:
        p = _minimal_profile()
        p["apiVersion"] = "v0"
        issues = validate_profile(p, "x.json")
        self.assertTrue(any("apiVersion" in i.message for i in issues))

    def test_unknown_normalizer(self) -> None:
        p = _minimal_profile()
        p["spec"]["params"][0]["normalizers"] = ["unknown_norm"]
        issues = validate_profile(p, "x.json")
        self.assertTrue(any("unsupported" in i.message for i in issues))

    def test_selector_unknown_dep(self) -> None:
        p = _minimal_profile()
        p["spec"]["selectors"][0]["dependsOn"] = ["missing"]
        issues = validate_profile(p, "x.json")
        self.assertTrue(any("unknown" in i.message for i in issues))


if __name__ == "__main__":
    unittest.main()
