#!/usr/bin/env python3
"""
import-roster-6-civs.py — dopisuje 6 nacji do civs.json + migracja Sumer (Q1A).

Uruchamiać PO export-d.py (Panel-D), gdy nowe nacje nie istnieją jeszcze w civs.json.
export-d aktualizuje tylko ISTNIEJĄCE wpisy (bonusy/klastry).

  python gra/tools/import-roster-6-civs.py --dry-run
  python gra/tools/import-roster-6-civs.py

Draft: Civ-CYWILIZACJE/draft/roster-6-REZERWA.json
"""
import argparse
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
DRAFT = os.path.join(ROOT, "Civ-CYWILIZACJE", "draft", "roster-6-REZERWA.json")
CIVS = os.path.join(HERE, "..", "data", "civs.json")


def draft_to_civ_entry(cyw):
    klastry = cyw.get("nazwyKlastra") or []
    epoki = cyw.get("epokiStartowe") or [cyw.get("epokaStartowaGracz", "kamien")]
    return {
        "Cywilizacja": cyw["Cywilizacja"],
        "Styl / charakter": cyw.get("Styl / charakter", ""),
        "Jednostka specjalna": cyw.get("Jednostka specjalna", ""),
        "Bonus startowy": cyw.get("Bonus startowy", ""),
        "Bonusy/minusy (do dopracowania)": cyw.get("Bonusy/minusy (do dopracowania)", ""),
        "Uwagi": cyw.get("Uwagi", f"roster-6 tier {cyw.get('tier', '?')}"),
        "Religia": cyw.get("Religia", ""),
        "nazwyKlastra": klastry,
        "mnoznikHandelPieniadz": cyw.get("mnoznikHandelPieniadz", 2.0),
        "ikonaId": cyw.get("ikonaId", ""),
        "bonusy": cyw.get("bonusy") or [],
        "typCywilizacji": cyw.get("typCywilizacji", ""),
        "archetyp": cyw.get("archetyp", cyw.get("typCywilizacji", "")),
        "epokiStartowe": epoki,
    }


def migrate_sumer(cyw_list):
    for row in cyw_list:
        if row.get("Cywilizacja") == "Sumerowie":
            if row.get("typCywilizacji") == "babilon":
                row["typCywilizacji"] = "sumer"
                row["archetyp"] = row.get("archetyp") or "sumer"
            if row.get("ikonaId") == "babilon":
                row["ikonaId"] = "sumer"
            return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--draft", default=DRAFT)
    ap.add_argument("--json", default=CIVS)
    args = ap.parse_args()

    with open(args.draft, encoding="utf-8") as f:
        draft_civs = json.load(f)["cywilizacje"]
    with open(args.json, encoding="utf-8") as f:
        data = json.load(f)

    cyw_list = data.get("cywilizacje") or []
    by_name = {c.get("Cywilizacja"): c for c in cyw_list}

    sumer_migrated = migrate_sumer(cyw_list)
    if sumer_migrated:
        print("Sumerowie: typCywilizacji/ikonaId -> sumer (Q1A)")

    added = []
    for d in draft_civs:
        name = d["Cywilizacja"]
        if name in by_name:
            print(f"SKIP (juz jest): {name}")
            continue
        entry = draft_to_civ_entry(d)
        cyw_list.append(entry)
        by_name[name] = entry
        added.append(name)
        print(f"+ civs.json: {name}")

    data["cywilizacje"] = cyw_list

    if args.dry_run:
        print(f"DRY-RUN: +{len(added)} nacji, lacznie {len(cyw_list)}")
        return

    if not added and not sumer_migrated:
        print("Brak zmian.")
        return

    bak = args.json + ".bak-ROSTER6"
    shutil.copy2(args.json, bak)
    with open(args.json, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"OK -> {args.json} (+{len(added)}) backup: {bak}")
    print("Następne: TypCywilizacji enum + diplomacy ARCHETYPE + import-roster handoff SILNIK")


if __name__ == "__main__":
    main()
