#!/usr/bin/env python3
"""Test negatywny weryfikatora P6.7B: zepsuj JEDNA wartosc w kopii wektorow i sprawdz, czy
verify-p67b-vectors.py ja wykrywa (kod wyjscia 1, rozbieznosci > 0). Uzycie:
  python3 -I verify-negative-p67b.py <WEB_ROOT> <VECTORS_DIR> <SCRATCH_DIR>
"""
import copy
import json
import shutil
import subprocess
import sys
from pathlib import Path

web, vdir, scratch = (Path(a) for a in sys.argv[1:4])
here = Path(__file__).resolve().parent
verifier = here / "verify-p67b-vectors.py"


def run(label, mutate):
    work = scratch / label.replace(" ", "_").replace("/", "_")
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    docs = {n: json.loads((vdir / n).read_text(encoding="utf-8")) for n in ("cost.json", "nfd.json", "pool.json", "gate.json")}
    docs = copy.deepcopy(docs)
    mutate(docs)
    for n, d in docs.items():
        (work / n).write_text(json.dumps(d), encoding="utf-8")
    r = subprocess.run([sys.executable, "-I", str(verifier), str(web), str(work)], capture_output=True, text=True)
    last = (r.stdout.strip().splitlines() or ["<brak wyjscia>"])[-1]
    detected = r.returncode == 1
    print(("WYKRYTO  " if detected else "NIEWYKRYTO ") + f"{label}: exit={r.returncode} {last}")
    return detected


def m_pace(d):
    d["cost.json"]["pace"][5]["out"] = 123456


def m_epoch(d):
    d["cost.json"]["epochMult"][3]["out"] = 99


def m_unit(d):
    for u in d["cost.json"]["units"]:
        if u["out"]:
            k = next(iter(u["out"]))
            u["out"][k] = 7777
            return


def m_nfd(d):
    d["nfd.json"]["changed"][10][1] = "zepsute"


def m_pool(d):
    for t in d["pool.json"]["deduct"]:
        for c in t["after"]:
            if "surowce" in c and c["surowce"]:
                k = next(iter(c["surowce"]))
                c["surowce"][k] = 424242
                return


def m_gate(d):
    d["gate.json"]["required"][20]["out"] = ["Zepsute"]


def m_prereq(d):
    d["gate.json"]["prereq"][0]["out"] = not d["gate.json"]["prereq"][0]["out"]


def m_sp(d):
    d["gate.json"]["spDrain"][0]["out"]["ceramikaPaid"] = not d["gate.json"]["spDrain"][0]["out"]["ceramikaPaid"]


def m_inactive(d):
    d["gate.json"]["inactive"][0]["out"]["tooltip"] = "zepsute"


ok = all(
    [
        run("tempo", m_pace),
        run("mnoznik epoki", m_epoch),
        run("koszt jednostki", m_unit),
        run("nfd", m_nfd),
        run("pula", m_pool),
        run("etykiety bramki", m_gate),
        run("prerekwizyt", m_prereq),
        run("spichlerz drain", m_sp),
        run("status nieaktywny", m_inactive),
    ]
)
sys.exit(0 if ok else 1)
