#!/usr/bin/env python3
# migrate-units-tw-v3.py — TW v3 hard input
"""Reguly (hard input = liczby gotowe do silnika TW, bez dzielnikow w kodzie):
  ÷10 ze starego JSON (skala 0-100): Atak, Obrona, Obrażenia, Pancerz, Przebicie, Uderzenie
  1:1 (NIE dzielic): Atak dystansowy — stary silnik (rangeDamage) nie uzywal ÷10
  health = stary Health × 0,25 → int
  Wszystkie liczby: calkowite (int)

Użycie (z gra/):
  python tools/migrate-units-tw-v3.py --from-backup
  python tools/migrate-units-tw-v3.py --report
  python tools/migrate-units-tw-v3.py --apply
"""
from __future__ import annotations

import argparse
import json
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNITS_PATH = ROOT / "gra" / "data" / "units.json"
BACKUP_PATH = UNITS_PATH.with_suffix(".json.bak-TW-v3-2026-06-29")
REPORT_PATH = ROOT / "gra" / "tools" / "TW-v3-migracja-jednostek.md"

OLD_TO_NEW = {
    "Atak": "meleeAttack",
    "Obrona": "meleeDefence",
    "Obrażenia": "weaponDamage",
    "Pancerz": "armor",
    "Przebicie": "piercing",
    "Uderzenie": "chargeBonus",
    "Health": "health",
    "Atak dystansowy": "missileAttack",
}

# Skala 0-100 → hard input ÷10 (jak w playtestach TW)
DIV10_OLD_KEYS = {
    "Atak",
    "Obrona",
    "Obrażenia",
    "Pancerz",
    "Przebicie",
    "Uderzenie",
}

# Stary silnik NIE dzielil ataku dystansowego (rangeDamage 1:1)
COPY1_OLD_KEYS = {"Atak dystansowy"}

# Super-jednostki: stary JSON mial skale TW (Atak 8-10), NIE ÷10 — Maciej 2026-06-30
# Obrażenia=10 dla wszystkich super (decyzja; archiwum mialo 0)
OVERRIDES: dict[str, dict[str, int]] = {
    "Hastati": {"meleeAttack": 7, "meleeDefence": 7, "weaponDamage": 7, "armor": 9, "piercing": 3, "chargeBonus": 7, "health": 19, "missileAttack": 8},
    "Konnica": {"meleeAttack": 8, "meleeDefence": 5, "weaponDamage": 7, "armor": 4, "piercing": 6, "chargeBonus": 10, "health": 14},
    "Gwardia Królewska Sumeru": {
        "meleeAttack": 10, "meleeDefence": 8, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 8,
    },
    "Hieros Lochos (Święty Zastęp)": {
        "meleeAttack": 8, "meleeDefence": 10, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 8,
    },
    "Hu Ben Wei (Gwardia Tygrysa)": {
        "meleeAttack": 10, "meleeDefence": 7, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 8,
    },
    "Królewska Gwardia": {
        "meleeAttack": 10, "meleeDefence": 8, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 8,
    },
    "Medżaj (Gwardia Faraona)": {
        "meleeAttack": 10, "meleeDefence": 8, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 8,
    },
    "Triari": {
        "meleeAttack": 8, "meleeDefence": 8, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 10,
    },
    "uThulwana (Białe Tarcze)": {
        "meleeAttack": 8, "meleeDefence": 7, "weaponDamage": 10,
        "armor": 6, "piercing": 4, "chargeBonus": 10,
    },
}


def to_int(v: float) -> int:
    return int(round(float(v)))


def convert_value(old_key: str, raw) -> int:
    if raw is None or raw == "—" or raw == "":
        return 0
    if not isinstance(raw, (int, float)):
        return 0
    if old_key == "Health":
        return to_int(float(raw) * 0.25)
    if old_key in DIV10_OLD_KEYS:
        return to_int(float(raw) / 10)
    if old_key in COPY1_OLD_KEYS:
        return to_int(float(raw))
    return to_int(float(raw))


def migrate_unit(u: dict) -> tuple[dict, dict]:
    name = u.get("Jednostka", "?")
    out = {k: v for k, v in u.items() if not k.startswith("_tw_v3") and k not in OLD_TO_NEW.values()}
    changes: dict[str, tuple] = {}

    for old_key, new_key in OLD_TO_NEW.items():
        if old_key not in out and old_key != "Obrażenia":
            new_val = 0
        else:
            new_val = convert_value(old_key, out.get(old_key, 0))
        if name in OVERRIDES and new_key in OVERRIDES[name]:
            new_val = OVERRIDES[name][new_key]
        changes[new_key] = (out.get(old_key, 0), new_val)
        out[new_key] = new_val
        if old_key in out:
            del out[old_key]

    out["_tw_v3_migrated"] = date.today().isoformat()
    return out, changes


def load_units(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_report(rows: list[tuple]) -> None:
    lines = [
        "# TW v3 — migracja jednostek",
        "",
        f"Data: {date.today().isoformat()}",
        "",
        "Reguły:",
        "- ÷10: Atak, Obrona, Obrażenia, Pancerz, Przebicie, Uderzenie (hard input ze skali 0-100)",
        "- 1:1: Atak dystansowy (stary silnik nie dzielił)",
        "- health × 0,25",
        "- liczby całkowite",
        "- Hastati: meleeAttack=8, weaponDamage=8 (nerf playtest)",
        "",
        "| Jednostka | Pole | Stara | Nowa |",
        "|---|---|---:|---:|",
    ]
    for name, field, old, new in rows:
        lines.append(f"| {name} | {field} | {old} | {new} |")
    lines.append("")
    lines.append(f"**Jednostek:** {len({r[0] for r in rows})}")
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def run_migrate(source: Path, dest: Path) -> None:
    units = load_units(source)
    migrated = []
    rows: list[tuple] = []
    for u in units:
        nu, changes = migrate_unit(u)
        migrated.append(nu)
        for new_key, (old, new) in changes.items():
            rows.append((u.get("Jednostka", "?"), new_key, old, new))
    shutil.copy2(dest, dest.with_suffix(f".json.bak-TW-v3-fix-{date.today().isoformat()}"))
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(migrated, f, ensure_ascii=False, indent=2)
        f.write("\n")
    write_report(rows)
    print(f"OK: {dest} ({len(migrated)} jednostek)")
    print(f"Raport: {REPORT_PATH}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-backup", action="store_true")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if args.from_backup:
        if not BACKUP_PATH.is_file():
            raise SystemExit(f"Brak backupu: {BACKUP_PATH}")
        run_migrate(BACKUP_PATH, UNITS_PATH)
    elif args.apply:
        run_migrate(BACKUP_PATH if BACKUP_PATH.is_file() else UNITS_PATH, UNITS_PATH)
    elif args.report:
        units = load_units(BACKUP_PATH if BACKUP_PATH.is_file() else UNITS_PATH)
        rows = []
        for u in units:
            _, ch = migrate_unit(u)
            for nk, (o, n) in ch.items():
                rows.append((u.get("Jednostka", "?"), nk, o, n))
        write_report(rows)
        print(f"Raport: {REPORT_PATH} ({len(rows)} wierszy)")
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
