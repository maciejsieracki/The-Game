#!/usr/bin/env python3
"""Test negatywny weryfikatora: zmutowana kopia wektorow (2 wartosci) => weryfikator musi zglosic rozbieznosci.
Uzycie: mutate-vectors.py <IN_JSON> <OUT_JSON>"""
import json
import sys

v = json.load(open(sys.argv[1], encoding="utf-8"))
c = v["cases"]
# (a) pozycja pierwszego niepustego wyniku hubChain
for case in c["hubChain"]:
    if case["out"]:
        case["out"][0][0] += 1
        break
# (b) nazwa pierwszego slotu rywala -> pusta (ksztalt)
for case in c["slots"]:
    if case["out"]:
        case["out"][0]["ownerId"] += 5
        break
json.dump(v, open(sys.argv[2], "w", encoding="utf-8"))
print("zmutowano 2 wartosci")
