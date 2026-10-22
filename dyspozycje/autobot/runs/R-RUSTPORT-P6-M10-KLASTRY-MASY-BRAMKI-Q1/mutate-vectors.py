#!/usr/bin/env python3
"""Test negatywny weryfikatora: zmutowana kopia wektorow (3 wartosci) => weryfikator musi zglosic
rozbieznosci (kod wyjscia 1). Uzycie: mutate-vectors.py <IN_JSON> <OUT_JSON>"""
import json
import sys

v = json.load(open(sys.argv[1], encoding="utf-8"))
c = v["cases"]
# (a) pierwszy niepusty wynik rozmieszczenia srodkow: przesun pierwszy hex o 1
for case in c["place"]:
    if case["result"]:
        case["result"][0][0] += 1
        break
# (b) sortowanie V8: zamien dwa sasiednie id w pierwszym duzym przypadku
for case in c["v8sort"]:
    if len(case["order"]) > 10:
        case["order"][3], case["order"][4] = case["order"][4], case["order"][3]
        break
# (c) przydzial typow do mas: zwieksz pierwszy niezerowy slot
for case in c["allocate"]:
    if any(case["result"]):
        i = next(k for k, x in enumerate(case["result"]) if x)
        case["result"][i] += 1
        break
json.dump(v, open(sys.argv[2], "w", encoding="utf-8"))
print("zmutowano 3 wartosci")
