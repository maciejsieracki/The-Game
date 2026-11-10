#!/usr/bin/env python3
"""Test negatywny weryfikatora P6.M12: kopiuje wektory z weba i psuje 3 wartosci
(centrum klastra w wyniku computeClusters, nazwa miasta w planie spawnu, sygnatura pola morza).
Weryfikator uruchomiony na zepsutej kopii MUSI zglosic dokladnie te rozbieznosci i zakonczyc sie
kodem 1.

Uzycie: mutate-vectors.py <WEKTORY_WEJSCIE> <WEKTORY_WYJSCIE>
"""
import json
import sys

src, dst = sys.argv[1:3]
v = json.load(open(src, encoding="utf-8"))
c = v["cases"]
# 1. computeClusters: przesun centrum pierwszego klastra pierwszego niethrowing przypadku na malej mapie
done = False
for case in c["compute"]:
    if not case["threw"] and case["result"]["klastry"] and v["maps"][case["map"]]["w"] * v["maps"][case["map"]]["h"] <= 1200:
        case["result"]["klastry"][0]["centrum"][0] += 1
        done = True
        break
assert done
# 2. buildClusterSpawnPlan: zmien nazwe pierwszego slotu
done = False
for case in c["spawn"]:
    if not case["threw"] and case["result"]["slots"] and v["maps"][case["map"]]["w"] * v["maps"][case["map"]]["h"] <= 1200:
        case["result"]["slots"][0]["nazwa"] += "X"
        done = True
        break
assert done
# 3. pole morza: zmien FNV w pierwszej mapie
c["seaField"][0]["sea"]["fnv"] = "0" * 16
json.dump(v, open(dst, "w", encoding="utf-8"))
print("zmutowano 3 wartosci")
