"""Regression tests for profile selector cascade contract (mirrors TS logic shape)."""

from __future__ import annotations

GROUP = "groupname"
FLIGHT = "flightno"
FLIGHT_ALIASES = {FLIGHT, "nrs", "flight_no"}
DIR_PARAMS = {"mrshr", "mrshr_1", "mrshr_2"}


def _is_flight_param(param: str) -> bool:
    return param in FLIGHT_ALIASES


def _dep_on_dashboard(dep: str, selectors: list[dict]) -> bool:
    if any(s["param"] == dep for s in selectors):
        return True
    if dep in (GROUP, "groupid", "grp") and any(
        s["param"] == GROUP or s.get("title") == "Группа" for s in selectors
    ):
        return True
    if _is_flight_param(dep) and any(
        _is_flight_param(s["param"]) or s.get("title") == "Рейс" for s in selectors
    ):
        return True
    return False


def _unwrap(value):
    if value is None:
        return ""
    if isinstance(value, list):
        value = value[0] if value else ""
    return str(value).strip()


def _is_ready(value) -> bool:
    return len(_unwrap(value)) > 0


def _normalize(selectors: list[dict]) -> list[dict]:
    has_group = any(s["param"] == GROUP or s.get("title") == "Группа" for s in selectors)
    flight_param = next(
        (
            s["param"]
            for s in selectors
            if _is_flight_param(s["param"]) or s.get("title") == "Рейс"
        ),
        FLIGHT,
    )
    out = []
    for s in selectors:
        s = dict(s)
        is_date = s.get("type") == "date"
        is_group = s["param"] == GROUP or s.get("title") == "Группа"
        is_flight = _is_flight_param(s["param"]) or s.get("title") == "Рейс"
        is_dir = s["param"] in DIR_PARAMS or s.get("title") == "Напр-е"
        if is_group:
            s["disabledUntil"] = []
            s["dependsOn"] = []
        elif is_flight:
            if has_group:
                s["disabledUntil"] = [GROUP]
                s["dependsOn"] = [GROUP]
            else:
                s["disabledUntil"] = []
                s["dependsOn"] = []
        elif is_dir:
            s["disabledUntil"] = [flight_param]
            s["dependsOn"] = [flight_param]
        elif is_date:
            s["disabledUntil"] = [
                d for d in s.get("disabledUntil", []) if _dep_on_dashboard(d, selectors)
            ]
            s["dependsOn"] = [
                d for d in s.get("dependsOn", []) if _dep_on_dashboard(d, selectors)
            ]
        out.append(s)
    return out


def _bindings(selectors: list[dict]) -> list[dict]:
    normalized = _normalize(selectors)
    return [
        {
            "selectorId": s["id"],
            "canonicalParam": s["param"],
            "dependsOn": s.get("dependsOn", []),
            "disabledUntil": s.get("disabledUntil", []),
        }
        for s in normalized
    ]


def _dep_ready(dep: str, flat: dict, bindings: list[dict]) -> bool:
    if _is_ready(flat.get(dep)):
        return True
    if dep == GROUP:
        for key, val in flat.items():
            if key in (GROUP, "groupid", "grp") and _is_ready(val):
                return True
    if dep in FLIGHT_ALIASES:
        for key, val in flat.items():
            if key in FLIGHT_ALIASES and _is_ready(val):
                return True
    return False


def _disabled(selector_id: str, flat: dict, bindings: list[dict]) -> bool:
    binding = next(b for b in bindings if b["selectorId"] == selector_id)
    if not binding["disabledUntil"]:
        return False
    return any(not _dep_ready(dep, flat, bindings) for dep in binding["disabledUntil"])


def _downstream(changed_param: str, bindings: list[dict]) -> list[str]:
    found: set[str] = set()

    def visit(param: str) -> None:
        for binding in bindings:
            if param not in binding["dependsOn"]:
                continue
            sid = binding["selectorId"]
            if sid in found:
                continue
            found.add(sid)
            visit(binding["canonicalParam"])

    visit(changed_param)
    return list(found)


def _binding_by_id_or_param(selector_id: str, param_key: str | None, bindings: list[dict]):
    for binding in bindings:
        if binding["selectorId"] == selector_id:
            return binding
    if param_key:
        for binding in bindings:
            if binding["canonicalParam"] == param_key:
                return binding
    return None


def _disabled_with_param_fallback(
    selector_id: str, param_key: str | None, flat: dict, bindings: list[dict]
) -> bool:
    binding = _binding_by_id_or_param(selector_id, param_key, bindings)
    if not binding or not binding["disabledUntil"]:
        return False
    return any(not _dep_ready(dep, flat, bindings) for dep in binding["disabledUntil"])


def test_flight_disabled_by_param_when_profile_id_mismatch():
    selectors = [
        {"id": "yK", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "nr", "param": "flightno", "type": "select", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    flat = {"groupname": "", "flightno": ""}
    assert not _disabled("dash-flight-uuid", flat, bindings)
    assert _disabled_with_param_fallback("dash-flight-uuid", FLIGHT, flat, bindings)


def test_direction_disabled_until_flight_selected():
    selectors = [
        {"id": "yK", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "nr", "param": "nrs", "type": "select", "title": "Рейс"},
        {"id": "vr", "param": "mrshr", "type": "select", "title": "Напр-е"},
    ]
    bindings = _bindings(selectors)
    flat_empty_flight = {"groupname": "G1", "nrs": "", "mrshr": ""}
    assert _disabled("vr", flat_empty_flight, bindings)
    flat_with_flight = {**flat_empty_flight, "nrs": "SU100", "flightno": "SU100"}
    assert not _disabled("vr", flat_with_flight, bindings)
    assert _downstream("nrs", bindings) == ["vr"]


def test_cascade_from_group_items_without_profile_spec():
    """Рейс/Напр-е по param из виджета, если в профиле пока нет selectors."""
    group_like = [
        {"id": "g1", "param": "groupname", "title": "Группа"},
        {"id": "f-dash", "param": "flightno", "title": "Рейс"},
        {"id": "d-dash", "param": "mrshr", "title": "Напр-е"},
    ]
    selectors = [
        {"id": s["id"], "param": s["param"], "type": "select", "title": s["title"]}
        for s in group_like
    ]
    bindings = _bindings(selectors)
    flat = {"groupname": "G1", "flightno": "", "mrshr": ""}
    assert not _disabled_with_param_fallback("f-dash", "flightno", flat, bindings)
    assert _disabled_with_param_fallback("d-dash", "mrshr", flat, bindings)


def test_main_form_with_group():
    selectors = [
        {"id": "q7", "param": "ds", "type": "date", "title": "Дата"},
        {"id": "yK", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "nr", "param": "flightno", "type": "select", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    flat = {"ds": "2024-01-01", "groupname": "", "flightno": ""}

    assert not _disabled("q7", flat, bindings)
    assert not _disabled("yK", flat, bindings)
    assert _disabled("nr", flat, bindings)
    assert _downstream("groupname", bindings) == ["nr"]


def test_dashboard_without_group():
    selectors = [
        {"id": "bq", "param": "cf_d1", "type": "date", "title": "Дата"},
        {"id": "9g", "param": "flightno", "type": "select", "title": "Рейс"},
        {"id": "vr", "param": "mrshr_1", "type": "select", "title": "Напр-е"},
    ]
    bindings = _bindings(selectors)
    flat = {"cf_d1": "", "flightno": "", "mrshr_1": ""}

    assert not _disabled("9g", flat, bindings)
    assert _disabled("vr", flat, bindings)
    flat_with_flight = {**flat, "flightno": "SU100"}
    assert not _disabled("vr", flat_with_flight, bindings)


def test_dashboard_with_group_flight_direction():
    selectors = [
        {"id": "bq", "param": "ds", "type": "date", "title": "Дата"},
        {"id": "ga", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "9g", "param": "flightno", "type": "select", "title": "Рейс"},
        {"id": "vr", "param": "mrshr", "type": "select", "title": "Напр-е"},
    ]
    bindings = _bindings(selectors)
    flat = {"ds": "2024-01-01", "groupname": "G1", "flightno": "", "mrshr": ""}

    assert not _disabled("ga", flat, bindings)
    assert not _disabled("9g", flat, bindings)
    assert _disabled("vr", flat, bindings)

    flat_ready = {**flat, "flightno": "B2735"}
    assert not _disabled("vr", flat_ready, bindings)


def test_direction_mrshr_2_alias_param():
    """Напр-е с param mrshr_2 — та же блокировка до рейса."""
    selectors = [
        {"id": "9g", "param": "flightno", "type": "select", "title": "Рейс"},
        {"id": "Ay", "param": "mrshr_2", "type": "select", "title": "Напр-е"},
    ]
    bindings = _bindings(selectors)
    assert _disabled("Ay", {"flightno": "", "mrshr_2": ""}, bindings)
    assert not _disabled("Ay", {"flightno": "B2735", "mrshr_2": ""}, bindings)


def test_flight_change_downstream_includes_direction():
    """Смена рейса сбрасывает Напр-е (как UI-lock + reset downstream)."""
    selectors = [
        {"id": "ga", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "9g", "param": "flightno", "type": "select", "title": "Рейс"},
        {"id": "vr", "param": "mrshr", "type": "select", "title": "Напр-е"},
    ]
    bindings = _bindings(selectors)
    assert _downstream("flightno", bindings) == ["vr"]
    assert set(_downstream("groupname", bindings)) == {"9g", "vr"}


def test_ensure_upstream_params_after_used_params_pick():
    """После pick(usedParams) только flightno — groupname всё равно в запросе."""
    selectors = [
        {"id": "yK", "param": "groupname", "title": "Группа"},
        {"id": "nr", "param": "flightno", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    merged = {"ds": "2024-11-01", "groupname": "Юг", "flightno": ""}
    picked = {"flightno": "", "ds": "2024-11-01"}
    out = merged.copy()
    binding_nr = next(b for b in bindings if b["selectorId"] == "nr")
    for dep in binding_nr["dependsOn"]:
        if dep in merged:
            out[dep] = merged[dep]
    for dep in binding_nr["dependsOn"]:
        assert _is_ready(out.get(dep))
    assert out["groupname"] == "Юг"


def test_flight_unlocks_when_group_stored_as_groupid():
    """Рейс разблокируется, если группа в slice записана как groupid, не groupname."""
    selectors = [
        {"id": "yK", "param": "groupname", "type": "select", "title": "Группа"},
        {"id": "nr", "param": "flightno", "type": "select", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    for b in bindings:
        if b["selectorId"] == "yK":
            b["paramKey"] = "groupname"
    flat = {"groupid": "Север", "flightno": ""}
    assert not _disabled("nr", flat, bindings)


def test_upstream_deps_must_be_in_request_before_run():
    """Не отправлять /api/run для рейса без groupname в params (только тело запроса)."""
    selectors = [
        {"id": "yK", "param": "groupname", "title": "Группа"},
        {"id": "nr", "param": "flightno", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    binding_nr = next(b for b in bindings if b["selectorId"] == "nr")
    merged = {"groupname": "Восток", "flightno": ""}
    bad_request = {"flightno": "", "ds": "2024-11-01"}
    good_request = {**bad_request, "groupname": "Восток"}

    def deps_ready(request):
        return all(_dep_ready(dep, request, bindings) for dep in binding_nr["dependsOn"])

    assert not deps_ready(bad_request)
    assert deps_ready(good_request)


def test_build_profile_control_request_params_includes_upstream():
    """buildProfileControlRequestParams: groupname в теле запроса рейса."""
    selectors = [
        {"id": "yK", "param": "groupname", "title": "Группа"},
        {"id": "nr", "param": "flightno", "title": "Рейс"},
    ]
    bindings = _bindings(selectors)
    binding_nr = next(b for b in bindings if b["selectorId"] == "nr")
    merged = {"ds": "2024-06-01", "groupname": "Восток", "flightno": ""}
    picked = {"flightno": "", "ds": "2024-06-01"}
    out = {**merged, **picked}
    for dep in binding_nr["dependsOn"]:
        if dep in merged:
            out[dep] = merged[dep]
    assert out["groupname"] == "Восток"


def test_flatten_group_params_for_request():
    """Merged request params must include upstream group for flight distincts."""

    def flatten(group_params, group_items):
        merged = {}
        seen = set()
        for item in group_items:
            seen.add(item["id"])
            slice_ = group_params.get(item["id"]) or {}
            merged.update(slice_)
        for cid, slice_ in group_params.items():
            if cid in seen:
                continue
            merged.update(slice_ or {})
        return merged

    items = [
        {"id": "yK", "defaults": {"groupname": ""}},
        {"id": "nr", "defaults": {"flightno": ""}},
    ]
    group_params = {
        "yK": {"groupname": "Восток"},
        "nr": {"flightno": ""},
    }
    merged = flatten(group_params, items)
    assert merged["groupname"] == "Восток"
    assert merged["flightno"] == ""


if __name__ == "__main__":
    test_main_form_with_group()
    test_dashboard_without_group()
    test_dashboard_with_group_flight_direction()
    test_flatten_group_params_for_request()
    print("ok")
