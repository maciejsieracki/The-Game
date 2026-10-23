#!/usr/bin/env python3
"""Scala logi mutacji P6.M12 w JEDEN wynik koncowy (R2, zarzut 6: `mutations-r1.log` ma stare znaczniki
`PRZEZYLA` dla `diag-missing-always-ok` i `BLAD DEFINICJI` dla `shuffle-removed`, poprawione dopiero w
`mutations-r1c.log`; `mutations-r2a.log` + `mutations-r2b.log` zawieraja ponowny przebieg mutacji, ktore przezyly w R1).

Kolejnosc nadpisywania: r1 -> r1c -> r2a -> r2b (pozniejszy log wygrywa). Wejscia sa surowymi logami; wynik to
`mutations-final.log` (tekst), z podaniem zrodla kazdego wyniku. Mutacje z `EXPECTED_SURVIVORS`
(`run-mutations.py`, dowody D1-D8 w doc §7.2) sa oznaczane `ROWNOWAZNA/NIEOSIAGALNA (dowod)`, pozostale
przezyte jako `PRZEZYLA-NIE_ZMIERZONO`.

Uzycie: merge-mutation-logs.py <katalog_runu> > mutations-final.log
"""
import re
import sys

run = sys.argv[1]
LINE = re.compile(r"^\[([a-z0-9-]+)\] (WYKRYTA|PRZEZYLA-OCZEKIWANA|PRZEZYLA|BLAD DEFINICJI|BLAD-KOMPILACJI)[:]?\s*(.*)$")

final = {}
order = []
for name in ("mutations-r1.log", "mutations-r1c.log", "mutations-r2a.log", "mutations-r2b.log"):
    try:
        text = open(f"{run}/{name}", encoding="utf-8").read()
    except FileNotFoundError:
        continue
    for line in text.splitlines():
        m = LINE.match(line)
        if not m:
            continue
        mid, status, rest = m.groups()
        if mid not in final:
            order.append(mid)
        final[mid] = (status, rest, name)

src = open(f"{run}/run-mutations.py", encoding="utf-8").read()
block = src[src.index("EXPECTED_SURVIVORS = {"):]
block = block[: block.index("\n}\n")]
expected = set(re.findall(r'^    "([a-z0-9-]+)":', block, re.M))

counts = {}
rows = []
for mid in order:
    status, rest, name = final[mid]
    if status.startswith("PRZEZYLA"):
        status = "ROWNOWAZNA/NIEOSIAGALNA (dowod w doc §7.2)" if mid in expected else "PRZEZYLA-NIE_ZMIERZONO"
    elif status == "BLAD DEFINICJI":
        status = "BLAD-DEFINICJI"
    counts[status] = counts.get(status, 0) + 1
    rows.append(f"[{mid}] {status} (zrodlo: {name}) {rest}")

print("# mutations-final.log - wynik KONCOWY P6.M12 (r1 -> r1c -> r2a -> r2b; pozniejszy log nadpisuje wczesniejszy)")
print("\n".join(rows))
print()
print("PODSUMOWANIE:", dict(sorted(counts.items())), "razem", len(order))
