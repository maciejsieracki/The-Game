#!/usr/bin/env python3
"""Generator wartosci HANDEL z pinowanego weba (edb8fb56).

Uzycie: python3 -I gen-trade-web.py <korzen_wyeksportowany_z_git_archive> <wyjscie.json>
Czyta literal z linii definicji (plik:linia z tabeli dokumentu) i zapisuje wartosci.
UWAGA: stale sa literalami TS; generator NIE uruchamia kodu weba (brak loadera TS
w srodowisku), tylko odczytuje literal z podanej linii.
"""
import json
import re
import sys

root, out = sys.argv[1], sys.argv[2]
ROWS = {
    "TRADE_ROUTE_INTERNATIONAL_MULTIPLIER": ("gra/src/game/trade-routes.ts", 1558),
    "TRADE_ROUTE_INCOME_HALF_DIVISOR": ("gra/src/game/trade-routes.ts", 1565),
    "FALLBACK_TRADE_MULT": ("gra/src/game/culture-religion.ts", 1268),
    "TRADE_ROUTE_BUILDING_BONUS_RATE": ("gra/src/game/trade-routes.ts", 1646),
    "PORT_SEA_TRADE_BONUS_PIENIADZ": ("gra/src/game/trade-routes.ts", 1742),
}
result = {}
for cid, (path, line_no) in ROWS.items():
    with open(f"{root}/{path}", encoding="utf-8") as fh:
        line = fh.read().split("\n")[line_no - 1]
    m = re.search(r"=\s*(-?[0-9]+(?:\.[0-9]+)?)\s*;", line)
    if not m:
        raise SystemExit(f"BRAK LITERALU {cid} {path}:{line_no}: {line!r}")
    result[cid] = {"wartosc": float(m.group(1)), "zrodlo": f"{path}:{line_no}"}

path, line_no = "gra/src/game/economy.ts", 810
with open(f"{root}/{path}", encoding="utf-8") as fh:
    block = fh.read().split("\n")[line_no - 1: line_no + 4]
per = {}
for ln in block:
    m = re.search(r"\b(easy|normal|hard)\s*:\s*(-?[0-9]+(?:\.[0-9]+)?)", ln)
    if m:
        per[m.group(1)] = float(m.group(2))
result["MNOZNIK_HANDEL_TRUDNOSC_DELTA"] = {"wartosci_po_trudnosci": per, "zrodlo": f"{path}:{line_no}"}

with open(out, "w", encoding="utf-8") as fh:
    json.dump(result, fh, ensure_ascii=False, indent=2, sort_keys=True)
    fh.write("\n")
print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
