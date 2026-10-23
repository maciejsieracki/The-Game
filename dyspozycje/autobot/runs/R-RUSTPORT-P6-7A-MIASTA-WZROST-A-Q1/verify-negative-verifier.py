#!/usr/bin/env python3
"""Test negatywny weryfikatora: kopiuje wektory, psuje JEDNA wartosc w kazdym z 3 plikow, uruchamia
verify-p67a-vectors.py i oczekuje ROZBIEZNOSCI > 0 (exit 1). Uzycie: <WEB_DATA> <VEC_DIR> <VERIFY_PY> <TMP_DIR>"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

web, vec, verify, tmp = sys.argv[1:5]
results = []
for name, mutate in [
    ("growth.json", lambda d: d["percent"][0]["out"].__setitem__("total", 12345)),
    ("empire.json", lambda d: d["advance"][0]["out"]["perOwner"][0].__setitem__("zapasyPo", 777777)),
    ("post_central.json", lambda d: d["scenarios"][0]["out"]["econ"].__setitem__("growth", 424242)),
]:
    t = Path(tmp) / ("neg-" + name.split(".")[0])
    if t.exists():
        shutil.rmtree(t)
    shutil.copytree(vec, t)
    p = t / name
    data = json.loads(p.read_text(encoding="utf-8"))
    mutate(data)
    p.write_text(json.dumps(data), encoding="utf-8")
    r = subprocess.run(["python3", "-I", verify, web, str(t)], capture_output=True, text=True)
    last = [l for l in r.stdout.splitlines() if l.startswith("ROZBIEZNOSCI")]
    print(f"{name}: exit={r.returncode} {last[0] if last else r.stdout[-80:]}")
    results.append(r.returncode != 0)
print("WSZYSTKIE ZEPSUTE WEKTORY WYKRYTE" if all(results) else "BLAD: weryfikator nie wykryl zepsutego wektora")
sys.exit(0 if all(results) else 1)
