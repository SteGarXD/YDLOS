from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SUPPORTED_NORMALIZERS = {
    "trim",
    "to_csv",
    "interval_to_scalar_date",
    "drop_text_for_integer_alias",
}


@dataclass
class ValidationIssue:
    file: str
    message: str


def validate_profile(profile: dict[str, Any], file_path: Path | str) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    file_s = str(file_path)

    if profile.get("apiVersion") != "ydl-os/v1":
        issues.append(ValidationIssue(file_s, "apiVersion must be 'ydl-os/v1'"))
    if profile.get("kind") != "DashboardProfile":
        issues.append(ValidationIssue(file_s, "kind must be 'DashboardProfile'"))

    meta = profile.get("metadata")
    if not isinstance(meta, dict):
        issues.append(ValidationIssue(file_s, "metadata must be object"))
        return issues

    spec = profile.get("spec")
    if not isinstance(spec, dict):
        issues.append(ValidationIssue(file_s, "spec must be object"))
        return issues

    for key in ("name", "dashboardEntryId", "owner", "version"):
        if key not in meta:
            issues.append(ValidationIssue(file_s, f"metadata.{key} is required"))

    dash_id = str(meta.get("dashboardEntryId", ""))
    if not re.match(r"^[0-9]{6,}$", dash_id):
        issues.append(ValidationIssue(file_s, "metadata.dashboardEntryId must be numeric string"))

    params = spec.get("params")
    if not isinstance(params, list) or not params:
        issues.append(ValidationIssue(file_s, "spec.params must be non-empty array"))
        return issues

    selectors = spec.get("selectors")
    if not isinstance(selectors, list) or not selectors:
        issues.append(ValidationIssue(file_s, "spec.selectors must be non-empty array"))
        return issues

    canonical_params: set[str] = set()
    alias_pool: set[str] = set()
    for item in params:
        if not isinstance(item, dict):
            issues.append(ValidationIssue(file_s, "spec.params entries must be objects"))
            continue
        canonical = item.get("canonical")
        if not isinstance(canonical, str) or canonical.strip() == "":
            issues.append(ValidationIssue(file_s, "spec.params[].canonical must be string"))
            continue
        canonical_params.add(canonical)
        aliases = item.get("aliases", [])
        if not isinstance(aliases, list):
            issues.append(ValidationIssue(file_s, f"aliases for {canonical} must be array"))
            continue
        for a in aliases:
            if isinstance(a, str):
                alias_pool.add(a)
        normalizers = item.get("normalizers", [])
        if not isinstance(normalizers, list):
            issues.append(ValidationIssue(file_s, f"normalizers for {canonical} must be array"))
            continue
        unsupported = [n for n in normalizers if n not in SUPPORTED_NORMALIZERS]
        if unsupported:
            issues.append(
                ValidationIssue(
                    file_s,
                    f"normalizers for {canonical} contain unsupported values: {unsupported}",
                )
            )

    known_param_names = canonical_params | alias_pool
    for sel in selectors:
        if not isinstance(sel, dict):
            issues.append(ValidationIssue(file_s, "spec.selectors entries must be objects"))
            continue
        sel_param = sel.get("param")
        if sel_param not in canonical_params:
            issues.append(
                ValidationIssue(file_s, f"selector param '{sel_param}' is not in canonical params")
            )
        for dep_key in ("dependsOn", "disabledUntil"):
            deps = sel.get(dep_key, [])
            if not isinstance(deps, list):
                issues.append(ValidationIssue(file_s, f"selector.{dep_key} must be array"))
                continue
            for dep in deps:
                if dep not in known_param_names:
                    issues.append(
                        ValidationIssue(
                            file_s,
                            f"selector dependency '{dep}' is unknown in params/aliases",
                        )
                    )
        if sel_param == "groupname":
            for dep in sel.get("disabledUntil", []):
                if dep in ("ds", "cf_d1", "cf_d2", "dta1", "dta2", "dt1", "dt2"):
                    issues.append(
                        ValidationIssue(
                            file_s,
                            "groupname selector must not be disabledUntil date param",
                        )
                    )

    permissions = spec.get("permissions", {})
    if not isinstance(permissions, dict):
        issues.append(ValidationIssue(file_s, "spec.permissions must be object"))
    else:
        for role in ("reader", "editor", "admin"):
            if role not in permissions:
                issues.append(ValidationIssue(file_s, f"permissions.{role} is required"))

    tests = spec.get("tests", {})
    if not isinstance(tests, dict):
        issues.append(ValidationIssue(file_s, "spec.tests must be object"))
    else:
        if not isinstance(tests.get("smoke"), list) or not tests.get("smoke"):
            issues.append(ValidationIssue(file_s, "spec.tests.smoke must be non-empty array"))
        if not isinstance(tests.get("criticalJourneys"), list) or not tests.get("criticalJourneys"):
            issues.append(
                ValidationIssue(file_s, "spec.tests.criticalJourneys must be non-empty array")
            )

    return issues
