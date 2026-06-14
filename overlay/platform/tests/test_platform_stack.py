#!/usr/bin/env python3
from __future__ import annotations

import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
COMPOSE = REPO / "compose"


class PlatformStackTests(unittest.TestCase):
    def test_required_compose_files(self) -> None:
        required = [
            "docker-compose.official-images.yaml",
            "docker-compose.ydl-official-auth.yaml",
            "docker-compose.ydl-built-images.yaml",
            "docker-compose.security-hardening.yaml",
        ]
        deprecated_legacy = COMPOSE / "deprecated" / "docker-compose.ydl-legacy-auth.yaml"
        for name in required:
            self.assertTrue((COMPOSE / name).is_file(), name)
        self.assertTrue(deprecated_legacy.is_file(), str(deprecated_legacy))

    def test_official_images_use_ghcr(self) -> None:
        text = (COMPOSE / "docker-compose.official-images.yaml").read_text(encoding="utf-8")
        self.assertIn("ghcr.io/datalens-tech", text)


if __name__ == "__main__":
    unittest.main()
