#!/usr/bin/env python3
"""Migrate legacy core.pd_users → official datalens-auth (automated signup)."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# Official auth password policy (legacy qwe-123 is too weak).
DEFAULT_PASSWORD = os.environ.get("YDL_MIGRATION_PASSWORD", "Qwe-123!")
LEGACY_PASSWORD = os.environ.get("YDL_LEGACY_PASSWORD", "qwe-123")

# org-workbooks: only admin + user (no master/oidc seeds).
ALLOWED_AUTH_LOGINS = frozenset({"admin", "user"})

ROLE_MAP = {
    "admin": ["datalens.admin"],
    "user": ["datalens.viewer"],
}


def run_psql(sql: str) -> str:
    user = os.environ.get("POSTGRES_USER", "pg-user")
    db = os.environ.get("POSTGRES_DB_US", "pg-us-db")
    container = os.environ.get("POSTGRES_CONTAINER", "datalens-postgres-prod")
    return subprocess.check_output(
        ["docker", "exec", container, "psql", "-U", user, "-d", db, "-tAc", sql],
        text=True,
        stderr=subprocess.STDOUT,
    ).strip()


def load_legacy_users() -> list[str]:
    rows = run_psql(
        "SELECT c_login FROM core.pd_users WHERE NOT sn_delete AND NOT b_disabled ORDER BY c_login;"
    )
    return [ln.strip() for ln in rows.splitlines() if ln.strip()]


def wait_auth(base: str, timeout_sec: int = 120) -> None:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{base.rstrip('/')}/ping", timeout=5) as resp:
                if resp.status == 200:
                    return
        except Exception:
            pass
        time.sleep(3)
    raise RuntimeError(f"auth not ready at {base}")


def signup(base: str, login: str, password: str) -> tuple[int, str]:
    body = json.dumps(
        {
            "login": login,
            "password": password,
            "email": f"{login}@local.ydl",
            "firstName": login,
            "lastName": "YDL",
        }
    ).encode()
    req = urllib.request.Request(
        f"{base.rstrip('/')}/signup",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def cmd_report() -> int:
    print("=== Legacy pd_users → official auth ===")
    try:
        users = load_legacy_users()
    except subprocess.CalledProcessError as e:
        print("WARN:", e.output or e)
        return 0
    for login in users:
        print(f"  {login} -> password {DEFAULT_PASSWORD} (official policy; legacy was {LEGACY_PASSWORD})")
    return 0


def cmd_apply() -> int:
    base = os.environ.get("AUTH_HTTP_BASE", "http://127.0.0.1:8081")
    wait_auth(base)
    logins = load_legacy_users()
    if not logins:
        print("No legacy users.")
        return 0
    ok = 0
    for login in logins:
        if login not in ALLOWED_AUTH_LOGINS:
            print(f"  SKIP {login} (not in allowed list: admin, user)")
            ok += 1
            continue
        if login == "admin":
            continue  # bootstrap admin already exists
        code, resp = signup(base, login, DEFAULT_PASSWORD)
        if code in (200, 201):
            print(f"  OK signup {login}")
            ok += 1
        elif "already exists" in resp.lower() or code == 409:
            print(f"  EXISTS {login}")
            ok += 1
        else:
            print(f"  FAIL {login} HTTP {code}: {resp[:180]}", file=sys.stderr)
    print(f"Migrated {ok}/{len(logins)} users. Allowed: admin/user only. Password: {DEFAULT_PASSWORD}")
    return 0 if ok >= len(logins) - 1 else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["report", "apply"], nargs="?", default="report")
    args = parser.parse_args()
    return cmd_report() if args.command == "report" else cmd_apply()


if __name__ == "__main__":
    raise SystemExit(main())
