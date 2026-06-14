#!/usr/bin/env python3
"""Vendor versions-config must match official image env pins."""
from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
YDL_ROOT = REPO.parent.parent
VC = YDL_ROOT / "vendor" / "datalens" / "versions-config.json"
ENV = REPO / ".official-images.env"


class VersionAlignmentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not ENV.is_file():
            subprocess = __import__("subprocess")
            subprocess.run(
                ["bash", str(YDL_ROOT / "integration" / "sync-official-image-pins.sh")],
                check=True,
            )
        cls.cfg = json.loads(VC.read_text(encoding="utf-8"))
        cls.env = {}
        for line in ENV.read_text(encoding="utf-8").splitlines():
            if line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            cls.env[k.strip()] = v.strip()

    def test_control_api_pin(self) -> None:
        backend = self.cfg["backendVersion"]
        self.assertEqual(
            self.env["OFFICIAL_CONTROL_API_IMAGE"],
            f"ghcr.io/datalens-tech/datalens-control-api:{backend}",
        )

    def test_meta_manager_pin(self) -> None:
        meta = self.cfg["metaManagerVersion"]
        self.assertEqual(
            self.env["OFFICIAL_META_MANAGER_IMAGE"],
            f"ghcr.io/datalens-tech/datalens-meta-manager:{meta}",
        )


if __name__ == "__main__":
    unittest.main()
