#!/usr/bin/env python3
"""Test NEGATYWNY weryfikatora P6.M04: zmienia 9 wartosci w KOPII wektorow (jedna na kategorie) i
zapisuje do <WYJSCIE.json>. Weryfikator uruchomiony na kopii musi zglosic rozbieznosci (EXIT=1).
Uzycie: tamper-vectors.py <WEKTORY.json> <WYJSCIE.json>
"""
import json
import sys

src, dst = sys.argv[1:3]
v = json.load(open(src, encoding="utf-8"))
c = v["cases"]

# 1. hashInt3: ostatnia cyfra wyniku
row = c["hashInt3"][100]
row[3] = row[3][:-1] + ("1" if row[3][-1] != "1" else "2")
# 2. classify: inny kod terenu
c["classify"][50][8] = (c["classify"][50][8] + 1) % 8
# 3. reapplyForest: zmieniona nakladka jednego heksa wyniku
case = c["reapplyForest"][3]
case["out"][5][3] = (case["out"][5][3] + 1) % 8
# 4. marginZone: zmieniona liczba adjusted
c["marginZone"][4]["adjusted"] += 1
# 5. fades: zmieniony fade
c["fades"][200][4] = "0.123456789"
# 6. latBuffer: odwrocony wynik
c["latBuffer"][77][3] = 1 - c["latBuffer"][77][3]

# RUNDA 2 (nowe kategorie): 3 dodatkowe zmiany
# 7. parseHexKey: zla wartosc q dla klucza "0x10,0b11" (web: 16) -> 17
phk = [r for r in c["parseHexKey"] if r[0] == "0x10,0b11"][0]
phk[1] = "17"
# 8. reapplyForestTie: zmieniona nakladka jednego heksa wyniku
tie = c["reapplyForestTie"][5]
tie["out"][7][3] = (tie["out"][7][3] + 1) % 8
# 9. reapplyForestTie: sfalszowane `mutantDiffers` (web mowi 1 -> 0): dowod, ze weryfikator liczy mutacje sam
tie2 = [x for x in c["reapplyForestTie"] if x["mutantDiffers"] == 1][0]
tie2["mutantDiffers"] = 0

json.dump(v, open(dst, "w", encoding="utf-8"))
print("zmodyfikowano 9 wartosci ->", dst)
