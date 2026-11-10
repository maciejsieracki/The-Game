#!/usr/bin/env python3
"""Test negatywny weryfikatora P6.M11: kopiuje wektory z weba i psuje 3 wartosci
(wynik pickSpawn, stan klastrow po naprawie, kara pasa). Weryfikator uruchomiony na zepsutej
kopii MUSI zglosic dokladnie te rozbieznosci i zakonczyc sie kodem 1.

Uzycie: mutate-vectors.py <WEKTORY_WEJSCIE> <WEKTORY_WYJSCIE>
"""
import json
import sys

src, dst = sys.argv[1:3]
v = json.load(open(src, encoding="utf-8"))
c = v["cases"]
# 1. wynik pickSpawn: zmien hex (pierwszy przypadek z wynikiem niepustym)
for case in c["pickSpawn"]:
    if case["result"] is not None:
        case["result"] = [case["result"][0] + 1, case["result"][1]]
        break
# 2. stan klastrow po naprawie: przesun stolice pierwszego klastra
for case in c["repair_hard"]:
    if case["after"]["klastry"]:
        case["after"]["klastry"][0]["miasta"][0][0] += 1
        break
# 3. kara pasa: zmien wynik w pasie
for case in c["bandPenalty"]:
    if case["result"] not in ("0", "NaN"):
        case["result"] = str(float(case["result"]) + 1)
        break
json.dump(v, open(dst, "w", encoding="utf-8"))
print("zmutowano 3 wartosci")
