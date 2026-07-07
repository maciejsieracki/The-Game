#!/usr/bin/env python3
"""
export-city-names.py — synchronizacja pul nazw → civs.json.

Źródło prawdy (propozycje AI / research): gra/data/city-names-pools.json
Cel: gra/data/civs.json — pola nazwyKlastra[10] + nazwyMiast[100]

Po edycji Macieja w Excelu (w czacie: „eksportuj nazwy miast"):
  1. python tools/import-city-names-from-xlsx.py   # Excel → city-names-pools.json + auto export
  2. (opcjonalnie) python tools/generate-city-names-xlsx.py  # odśwież podgląd Excel

import-city-names-from-xlsx.py sam wywołuje ten skrypt po zapisie pul.

Użycie (z katalogu gra/):
  python tools/export-city-names.py
  python tools/export-city-names.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEF_POOLS = os.path.normpath(os.path.join(HERE, "..", "data", "city-names-pools.json"))
DEF_CIVS = os.path.normpath(os.path.join(HERE, "..", "data", "civs.json"))

MIASTA_CYW = 100
MIASTA_PAN = 10


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def validate_pools(pools: dict, civ_ids: list[str]) -> list[str]:
    errs: list[str] = []
    for cid in civ_ids:
        if cid not in pools:
            errs.append(f"Brak wpisu: {cid}")
            continue
        e = pools[cid]
        cyw = e.get("miasta_cywilizacji", [])
        pan = e.get("miasta_panstwa", [])
        if len(cyw) != MIASTA_CYW:
            errs.append(f"{cid}: miasta_cywilizacji {len(cyw)}/{MIASTA_CYW}")
        if len(pan) != MIASTA_PAN:
            errs.append(f"{cid}: miasta_panstwa {len(pan)}/{MIASTA_PAN}")
        if len(set(cyw)) != len(cyw):
            errs.append(f"{cid}: duplikaty miasta_cywilizacji")
        if len(set(pan)) != len(pan):
            errs.append(f"{cid}: duplikaty miasta_panstwa")
    return errs


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pools", default=DEF_POOLS)
    ap.add_argument("--civs", default=DEF_CIVS)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    pools = load_json(args.pools)
    civs = load_json(args.civs)
    civ_ids = [c["ikonaId"] for c in civs["cywilizacje"] if c.get("ikonaId")]

    errs = validate_pools(pools, civ_ids)
    if errs:
        print("[export-city-names] WALIDACJA:")
        for e in errs:
            print(f"  ! {e}")
        sys.exit(1)

    updated = 0
    for civ in civs["cywilizacje"]:
        cid = civ.get("ikonaId")
        if not cid or cid not in pools:
            continue
        entry = pools[cid]
        civ["nazwyKlastra"] = list(entry["miasta_panstwa"])
        civ["nazwyMiast"] = list(entry["miasta_cywilizacji"])
        updated += 1

    if args.dry_run:
        print(f"[export-city-names] dry-run: zaktualizowano by {updated} cywilizacji")
        return

    save_json(args.civs, civs)
    print(f"[export-city-names] zapisano {args.civs} ({updated} cywilizacji)")


if __name__ == "__main__":
    main()
