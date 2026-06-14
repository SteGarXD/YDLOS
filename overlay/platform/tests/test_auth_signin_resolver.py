#!/usr/bin/env python3
"""Contract tests for sign-in body field aliases (login / username / UserName)."""
from __future__ import annotations

import unittest


def resolve_login(body: dict) -> str:
    return str(
        body.get("username") or body.get("login") or body.get("UserName") or ""
    ).strip()


class AuthSigninResolverTests(unittest.TestCase):
    def test_username_wins(self) -> None:
        self.assertEqual(
            resolve_login({"username": " u ", "login": "x", "UserName": "y"}),
            "u",
        )

    def test_login_fallback(self) -> None:
        self.assertEqual(resolve_login({"login": "alice"}), "alice")

    def test_user_name_fallback(self) -> None:
        self.assertEqual(resolve_login({"UserName": "bob"}), "bob")

    def test_empty(self) -> None:
        self.assertEqual(resolve_login({}), "")


if __name__ == "__main__":
    unittest.main()
