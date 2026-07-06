#!/usr/bin/env python3
"""
intrinsic-unit-power.py — moc jednostki TYLKO ze własnych statów TW v3 (bez wroga).

Wzór (propozycja A, 2026-06-30):
  Atak (A)   = meleeAttack + weaponDamage + piercing + chargeBonus/2 + missileAttack/2
  Obrona (O) = meleeDefence + armor + health/2
  Moc (M)    = A + O

Usage (from repo root):
  python gra/tools/intrinsic-unit-power.py
  python gra/tools/intrinsic-unit-power.py --md gra/tools/intrinsic-unit-power.md
  python gra/tools/intrinsic-unit-power.py --field   # ranking bez Oblężnicza (walka polna)
  python gra/tools/intrinsic-unit-power.py --siege    # tylko M_siege (3 oblężnicze)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNITS = ROOT / "gra" / "data" / "units.json"
sys.path.insert(0, str(Path(__file__).parent))
from unit_power import field_power, is_siege_unit, siege_power  # noqa: E402


def n(v, default=0) -> float:
    if v is None or v == "" or v == "—":
        return float(default)
    return float(v)


def intrinsic_power(u: dict, mode: str = "field") -> tuple[float, float, float]:
    if mode == "siege":
        a, o, m, _ = siege_power(u)
    else:
        a, o, m, _ = field_power(u)
    return a, o, m


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", type=Path, help="Zapisz raport markdown")
    ap.add_argument("--field", action="store_true", help="Tylko walka polna (bez Oblężnicza)")
    ap.add_argument("--siege", action="store_true", help="Tylko jednostki oblężnicze (M_siege)")
    args = ap.parse_args()

    units = json.loads(UNITS.read_text(encoding="utf-8"))
    mode = "siege" if args.siege else "field"
    if args.field:
        units = [u for u in units if not is_siege_unit(u)]
        mode = "field"
    elif args.siege:
        units = [u for u in units if is_siege_unit(u)]
        mode = "siege"
    rows: list[tuple[str, str, float, float, float, dict]] = []

    for u in units:
        name = u.get("Jednostka") or "?"
        role = u.get("Rola (linia)") or ""
        a, o, m = intrinsic_power(u, mode)
        rows.append((name, role, a, o, m, u))

    rows.sort(key=lambda r: (-r[4], r[0]))

    title = "Moc jednostki (intrinsic) — propozycja A"
    if args.siege:
        title += " · **oblężenie (M_siege)**"
    elif args.field:
        title += " · **tylko pole** (bez Katapulta/Taran/Wieża)"
    lines = [
        f"# {title}",
        "",
        "**Bez wroga** — tylko własne staty z `units.json`.",
        "",
        "```",
        "Pole:  A = AP + Obraż + Przeb + Szarża/2 + AD/2 ; O = OBR + Panc + HP/2",
        "Oblężenie: A_siege = wallAttack + AD ; O = OBR + Panc + HP/10",
        "Pole: oblężnicze NIE wchodzą do sumy armii",
        "M = A + O",
        "```",
        "",
        "| # | Jednostka | Rola | A | O | **M** | AP | OBR | Obraż | Panc | Przeb | Szarża | HP | AD |",
        "|--:|-----------|------|--:|--:|------:|---:|----:|------:|-----:|------:|-------:|---:|---:|",
    ]

    for i, (name, role, a, o, m, u) in enumerate(rows, 1):
        lines.append(
            f"| {i} | {name} | {role} | {a} | {o} | **{m}** | "
            f"{int(n(u.get('meleeAttack')))} | {int(n(u.get('meleeDefence')))} | "
            f"{int(n(u.get('weaponDamage')))} | {int(n(u.get('armor')))} | "
            f"{int(n(u.get('piercing')))} | {int(n(u.get('chargeBonus')))} | "
            f"{int(n(u.get('health')))} | {int(n(u.get('missileAttack')))} |"
        )

    # Skrót: znane typy
    highlights = ["Hastati", "Falanga", "Konnica", "Łucznik", "Katapulta", "Wojownik z mieczem i tarczą"]
    lines += ["", "## Wybrane jednostki", ""]
    by_name = {r[0]: r for r in rows}
    lines.append("| Jednostka | A | O | M |")
    lines.append("|-----------|--:|--:|--:|")
    for hn in highlights:
        if hn in by_name:
            _, _, a, o, m, _ = by_name[hn]
            lines.append(f"| {hn} | {a} | {o} | **{m}** |")

    text = "\n".join(lines) + "\n"
    print(text)

    if args.md:
        args.md.parent.mkdir(parents=True, exist_ok=True)
        args.md.write_text(text, encoding="utf-8")
        print(f"Zapisano: {args.md}", flush=True)


if __name__ == "__main__":
    main()
