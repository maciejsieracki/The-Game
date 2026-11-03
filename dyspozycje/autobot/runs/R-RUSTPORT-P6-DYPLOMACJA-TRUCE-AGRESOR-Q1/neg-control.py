#!/usr/bin/env python3
"""Kontrola negatywna weryfikatora: kopiuje wektory do <out_dir>, odwraca 2 wyniki (honor[100].out,
ustawFlage[5].out['9']=99) - weryfikator (verify-p6-dypl1.py) musi wtedy zwrocic BAD > 0.
Uzycie: neg-control.py <katalog_wektorow> <out_dir>"""
import json, os, shutil, sys

src, dst = sys.argv[1], sys.argv[2]
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(src, dst)
p = os.path.join(dst, "honor_treaties.json")
d = json.load(open(p, encoding="utf-8"))
d["honor"][100]["out"] = not d["honor"][100]["out"]
json.dump(d, open(p, "w", encoding="utf-8"))
p = os.path.join(dst, "aggressor.json")
d = json.load(open(p, encoding="utf-8"))
d["agg"]["ustawFlage"][5]["out"]["9"] = 99
json.dump(d, open(p, "w", encoding="utf-8"))
