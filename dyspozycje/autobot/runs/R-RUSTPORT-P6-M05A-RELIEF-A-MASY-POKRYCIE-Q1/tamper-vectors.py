#!/usr/bin/env python3
"""Test NEGATYWNY weryfikatora P6.M05A: zmienia 25 wartosci w KOPII wektorow (po jednej na KAZDA z 25 kategorii
wektorow) i zapisuje do <WYJSCIE.json>. Weryfikator uruchomiony na kopii musi zglosic rozbieznosci (EXIT=1).
Uzycie: tamper-vectors.py <WEKTORY.json> <WYJSCIE.json>
"""
import json
import sys

src, dst = sys.argv[1:3]
v = json.load(open(src, encoding="utf-8"))
c = v["cases"]


def flip_digit(text):
    return text[:-1] + ("1" if text[-1] != "1" else "2")


# 1. caps: wynik reliefSpreadCapMountain
row = c["caps"][700]
row[4] = flip_digit(row[4])
# 2. minLand: wynik
row = c["minLand"][40]
row[1] = flip_digit(row[1])
# 3. landCells: przesuniety heks w komorce
case = c["landCells"][3]
while not case["out"]:
    case = c["landCells"][c["landCells"].index(case) + 1]
case["out"][0][1][0][0] += 1
# 4. pickSpread: usuniety pierwszy wybrany klucz
case = [x for x in c["pickSpread"] if x["out"]][5]
case["out"] = case["out"][1:]
# 5. masses: zamiana kolejnosci dwoch heksow w masie
case = [x for x in c["masses"] if len(x["out"]) and len(x["out"][0]) > 3][2]
case["out"][0][0], case["out"][0][1] = case["out"][0][1], case["out"][0][0]
# 6. center: zmieniony bbox
case = [x for x in c["center"] if x["squares"] and x["squares"][0]["out"]][4]
case["squares"][0]["out"]["bbox"][0] = flip_digit(case["squares"][0]["out"]["bbox"][0])
# 7. partition: zmieniony skrot strefy
case = c["partition"][50]
case["hashes"][0] = "0" * 16
# 8. cellCounts: liczba gor w komorce
case = c["cellCounts"][100]
case["mtn"] += 1
# 9. ratios: wynik wskaznika zelaza
case = c["ratios"][20]
case["iron"][0][1] = "0.123456789"
# 10. forceType: lista zmian stanu (dodany wpis)
case = [x for x in c["forceType"] if x["diff"]][7]
case["diff"].append([0, "0", "0", "0"])
# 11. ensureMass: liczba losowan
case = c["ensureMass"][33]
case["calls"] += 1
# 12. applyRank: skrot stanu
case = c["applyRank"][10]
case["hash"] = "f" * 16
# 13. pickForceWater: liczba losowan (woda w liscie land)
case = c["pickForceWater"][17]
case["calls"] += 1

# 14. consts: stala tabeli (perTier[0] waterCoverageCellSize)
c["consts"]["perTier"][0]["waterCoverageCellSize"] = flip_digit(c["consts"]["perTier"][0]["waterCoverageCellSize"])
# 15. overflowVariants: wynik wariantu
c["overflowVariants"][0]["rows"][0]["out"][0] = "0.987"
# 16. nullSquareDist: dystans
c["nullSquareDist"][0][2] = flip_digit(c["nullSquareDist"][0][2])
# 17. forestEligible: odwrocony wynik
c["forestEligible"][1][1] = 1 - c["forestEligible"][1][1]
# 18. riverLand: odwrocony wynik
c["riverLand"][1][1] = 1 - c["riverLand"][1][1]
# 19. canHostEdge: odwrocony wynik
c["canHostEdge"][50]["out"] = 1 - c["canHostEdge"][50]["out"]
# 20. pickForce: liczba losowan
c["pickForce"][100]["calls"] += 1
# 21. capCell: zwrot
c["capCell"][100]["ret"] += 1
# 22. depositProtected: odwrocony wynik
c["depositProtected"][2][1] = 1 - c["depositProtected"][2][1]
# 23. capSpread: skrot stanu
c["capSpread"][10]["hash"] = "e" * 16
# 24. applyKeys: skrot stanu
c["applyKeys"][20]["hash"] = "d" * 16
# 25. applyRankDefault: skrot stanu
c["applyRankDefault"][5]["hash"] = "c" * 16

json.dump(v, open(dst, "w", encoding="utf-8"))
print("zmodyfikowano 25 wartosci ->", dst)
