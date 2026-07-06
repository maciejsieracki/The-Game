"""
unit_power.py — wspólne liczenie mocy jednostki (pole vs oblężenie).

Decyzja Maciej 2026-06-30 (2A):
  Pole:      A = AP + Obraż + Przeb + Szarża/2 + AD/2 ;  O = OBR + Panc + HP/2
             Oblężnicze (Rola=Oblężnicza) NIE wchodzą do sumy armii.
  Oblężenie: A_siege = wallAttack + AD ;  O_siege = OBR + Panc + HP/10
             Tylko atak na umocnienia — wallAttack z units.json.
"""
from __future__ import annotations


def n(v, default=0.0) -> float:
    if v is None or v == "" or v == "—":
        return float(default)
    return float(v)


def is_siege_unit(u: dict) -> bool:
    return (u.get("Rola (linia)") or "") == "Oblężnicza"


def field_power(u: dict) -> tuple[float, float, float, dict]:
    ma = n(u.get("meleeAttack"))
    wd = n(u.get("weaponDamage"))
    pier = n(u.get("piercing"))
    ch = n(u.get("chargeBonus"))
    ms = n(u.get("missileAttack"))
    mdef = n(u.get("meleeDefence"))
    arm = n(u.get("armor"))
    hp = n(u.get("health"))
    parts = {
        "AP": ma,
        "Obraż": wd,
        "Przeb": pier,
        "Szarża/2": ch / 2,
        "AD/2": ms / 2,
    }
    a = sum(parts.values())
    o = mdef + arm + hp / 2
    parts["OBR"] = mdef
    parts["Panc"] = arm
    parts["HP/2"] = hp / 2
    return round(a, 1), round(o, 1), round(a + o, 1), parts


def siege_power(u: dict) -> tuple[float, float, float, dict]:
    """Moc przy oblężeniu umocnień — NIE używać na polu (armia vs armia)."""
    wall = n(u.get("wallAttack"))
    ms = n(u.get("missileAttack"))
    mdef = n(u.get("meleeDefence"))
    arm = n(u.get("armor"))
    hp = n(u.get("health"))
    parts = {"wallAttack": wall}
    if ms > 0:
        parts["AD"] = ms
    a = wall + ms
    o = mdef + arm + hp / 10
    parts["OBR"] = mdef
    parts["Panc"] = arm
    parts["HP/10"] = hp / 10
    return round(a, 1), round(o, 1), round(a + o, 1), parts


def unit_power(u: dict, mode: str = "field") -> tuple[float, float, float, dict]:
    if mode == "siege" or (mode == "auto" and is_siege_unit(u)):
        return siege_power(u)
    return field_power(u)


def is_combat_unit(u: dict) -> bool:
    """Jednostki z cache M w units.json (zgodne z gen-panel-c)."""
    rola = u.get("Rola (linia)", "")
    if rola in ("Wręcz", "Flanka", "Dystans", "Morska", "Oblężnicza"):
        return True
    if u.get("Jednostka") == "Zwiadowca":
        return True
    if u.get("Super-jednostka") == "TAK":
        return True
    return False


def apply_power_cache(units: list) -> int:
    """Uzupełnia fieldPower / siegePower w units.json (derived, read-only w Panel-C)."""
    changed = 0
    for u in units:
        if not is_combat_unit(u):
            u.pop("fieldPower", None)
            u.pop("siegePower", None)
            continue
        _, _, m_field, _ = field_power(u)
        if u.get("fieldPower") != m_field:
            u["fieldPower"] = m_field
            changed += 1
        if is_siege_unit(u):
            _, _, m_siege, _ = siege_power(u)
            if u.get("siegePower") != m_siege:
                u["siegePower"] = m_siege
                changed += 1
        elif "siegePower" in u:
            u.pop("siegePower")
            changed += 1
    return changed
