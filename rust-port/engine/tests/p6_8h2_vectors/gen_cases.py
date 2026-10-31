#!/usr/bin/env python3
"""Generator przypadkow testowych dla wektorow P6.8H2 (resource-access.ts, pin 91dc998a).

Wyjscie: JSON z przypadkami dla entry.ts (bundle esbuild z pinu). Deterministyczny.
Uzycie: gen_cases.py <plik-wyjsciowy-cases.json>
"""
import json
import sys
from itertools import product

TEREN = ["plytkie_morze", "rownina"]
NAKLADKI = [None, "brak", "las", "zloze_gliny", "zloze_rudy", "zloze_konia",
            "zloze_owiec", "zloze_bydla", "zloze_lamy"]
ZLOZA = [None, "", "  ", "miedz", "MIEDZ ", "zelazo", "cyna", "zloto", "sol",
         "wegiel", "stal", "constructor", "glina", "xyz", " sol ",
         "﻿sol", "\u0085sol"]
ZLOZA_MIN = [None]  # Z3: BuildHex nie niesie zlozeMinEra; realistyczny stan (ensureDepositEraMeta = tabela)
ERAS = [1, 2, 3, 99]
KEYS = ["glinianka", "kopalnia_miedzi", "kopalnia_zelaza", "kopalnia_cyny",
        "kopalnia_zlota", "warzelnia_soli", "stadnina", "tartak", "kamieniolom",
        "bydlo", "owce", "lama", "farma", "kopalnia", "Kopalnia_Miedzi", " tartak ",
        "brak", "", "constructor", "toString", "nieistniejace", "obóz_łowiecki"]
POPS = [0, 1, 2, 3, 5, 9, "NaN"]
KULT = [None, 0, 5, 50, 500, 5000, "NaN"]

LABELS = ["Glina", "Ruda", "Koń", "Ruda miedzi", "Węgiel", "Sól", "Stal", "Złoto",
          "Ruda cyny", "Ruda żelaza", "Żelazo", "Drewno", "Kamień", "Brąz", "Owce",
          "Lama", "Trzoda (krowa/świnia)", "Złoto ", "Zloto", "Żelazo ", "Stal ",
          "Ślad", "Ćma", "Łąka", "Ąkra", "Ęter", "Ńoc", "Óda", "Źródło", "Ruda Żelaza"]


def hexes_for_city():
    out = []
    for q in range(-3, 4):
        for r in range(-3, 4):
            if abs(q + r) > 3:
                continue
            i = (q * 7 + r * 3) % 9
            out.append({
                "q": q, "r": r,
                "teren": TEREN[(q + r) % 2],
                "nakladka": NAKLADKI[i],
                "zloze": ZLOZA[(q * 5 + r * 11) % len(ZLOZA)],
                "zlozeMinEra": ZLOZA_MIN[(q + 2 * r) % len(ZLOZA_MIN)],
            })
    return out


def cases_city():
    hexes = hexes_for_city()
    placed_variants = [
        None,
        [],
        [["0,0", "kopalnia_zlota"]],
        [["1,0", "kopalnia_miedzi"], ["0,1", "stadnina"]],
        [["-1,0", ["bydlo", "stadnina"]]],
        [["2,-1", "warzelnia_soli"], ["0,-2", "glinianka"]],
        [["0,2", "kopalnia"], ["3,0", "tartak"]],
        [["-2,2", "kopalnia_zelaza"], ["1,1", "kopalnia_cyny"]],
        [["0,0", "constructor"], ["1,-1", "xyz"]],
        [["-3,0", "kamieniolom"], ["0,-3", "lama"]],
        # Klucz spoza mapy (web: `hexes[klucz]` = undefined -> pominiety), przed poprawnym wpisem.
        [["9,9", "kopalnia_zlota"], ["0,0", "kopalnia_zlota"]],
    ]
    stock_variants = [
        None,
        {},
        {"braz": 2.0},
        {"braz": 0.0},
        {"zloto": 0.5},
        {"zloto": 1.0},
        {"zloto": 3.0},
        {"zloto": "NaN"},
        {"braz": "NaN", "zloto": 0.0},
    ]
    builtin_variants = [None, [], ["piec_hutniczy"], ["odlewnia_brazu"],
                        ["odlewnia_zelaza", "piec_hutniczy"]]
    out = []
    n = 0
    for placed, stock, built, pop, kult in product(
            placed_variants, stock_variants, builtin_variants, POPS[:4], KULT[:4]):
        livestock = "UNDEF" if placed is None else ["kon"] if (n % 2 == 0) else []
        out.append({
            "name": f"city-{n}",
            "q": 0, "r": 0,
            "population": pop,
            "kultura": kult,
            "era": ERAS[n % len(ERAS)],
            "mapIdx": 0,
            "placed": placed,
            "options": {"builtIds": built, "livestock": livestock, "stock": stock},
        })
        n += 1
    # Brzegi: pop NaN/Infinity-like, kultura NaN, rozne eras.
    for pop, kult, era in product(POPS, KULT, ERAS):
        out.append({
            "name": f"city-edge-{n}",
            "q": 1, "r": -1,
            "population": pop, "kultura": kult, "era": era,
            "mapIdx": 0,
            "placed": [["1,0", "kopalnia_miedzi"], ["0,0", "kopalnia_zlota"]],
            "options": {"builtIds": None, "livestock": ["kon"], "stock": {"zloto": 2.0}},
        })
        n += 1
    return out


def cases_hex():
    out = []
    n = 0
    for teren, nak, zl, zmin, era in product(TEREN, NAKLADKI, ZLOZA, ZLOZA_MIN, ERAS):
        out.append({
            "name": f"hex-{n}",
            "era": era,
            "hex": {"q": 0, "r": 0, "name": f"h{n}", "teren": teren, "nakladka": nak,
                    "zloze": zl, "zlozeMinEra": zmin},
        })
        n += 1
    return out


def cases_unlock():
    out = []
    for teren, nak, zl in product(TEREN, NAKLADKI, ZLOZA[:10]):
        hex_obj = {"q": 0, "r": 0, "name": f"{teren}|{nak}|{zl}", "teren": teren,
                   "nakladka": nak, "zloze": zl, "zlozeMinEra": None}
        for key in KEYS:
            out.append({"key": key, "hex": hex_obj})
    return out


def main():
    cases = {
        "maps": [hexes_for_city()],
        "city": cases_city(),
        "hex": cases_hex(),
        "unlock": cases_unlock(),
        "labelKeys": KEYS,
        "labelUniverse": LABELS,
    }
    with open(sys.argv[1], "w", encoding="utf-8") as fh:
        json.dump(cases, fh, ensure_ascii=False)
    print(f"city={len(cases['city'])} hex={len(cases['hex'])} "
          f"unlock={len(cases['unlock'])} labels={len(LABELS)}")


if __name__ == "__main__":
    main()
