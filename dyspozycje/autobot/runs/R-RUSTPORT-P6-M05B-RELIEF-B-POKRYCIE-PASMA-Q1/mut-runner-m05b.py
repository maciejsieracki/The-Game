#!/usr/bin/env python3
"""Mutacje P6.M05B (relief B). Kazda mutacja zmienia JEDEN fragment kodu (relief.rs) albo
JEDNA liczbe tabeli (mapgen-relief-b.json), uruchamia trzy binarki testow p6_m05b_* i oczekuje
CZERWONYCH testow. Po KAZDEJ mutacji plik jest przywracany z bajtow w pamieci, a SHA-256 plikow
z dysku jest porownywane z poczatkowym.

Uzycie (cwd = rust-port/engine; env CARGO_* jak w dispatchu):
  python3 <run>/mut-runner-m05b.py <LOG> [--dry] [--only id1,id2]
--dry : tylko sprawdza, czy kotwica wystepuje dokladnie tyle razy, ile zadeklarowano (bez kompilacji).
Wynik: KILLED (testy czerwone), SURVIVED (testy zielone -> luka), BLAD-KOTWICY, BLAD-KOMPILACJI.
"""
import hashlib
import os
import subprocess
import sys
import time

LIB = "src/domain/mapgen/relief.rs"
TBL = "data/derived/mapgen-relief-b.json"
BINS = ["p6_m05b_grow", "p6_m05b_helpers", "p6_m05b_tables"]

# (id, plik, stary fragment, nowy fragment, liczba wystapien oczekiwana)
MUTATIONS = [
    ("ens-filter-gt", LIB, "        .filter(|m| m.len() as f64 >= min_masa)", "        .filter(|m| m.len() as f64 > min_masa)", 1),
    ("ens-mop-min-le", LIB, "            if (mass.len() as f64) < min_masa_mop {", "            if (mass.len() as f64) <= min_masa_mop {", 1),
    ("ens-outer-once", LIB, "    for _ in 0..outer_n {", "    for _ in 0..outer_n.min(1) {", 1),
    ("ens-restore-off", LIB, "    for _ in 0..restore_n {", "    for _ in 0..0 {", 1),
    ("ens-mop-off", LIB, "    for _ in 0..mop_n {", "    for _ in 0..0 {", 1),
    ("ens-outer-no-break", LIB, "        fixed += pass_fixed;\n        if pass_fixed == 0.0 {\n            break;\n        }\n    }\n\n    for mass in &masses {\n        cap_iron_cell_relief_spread",
     "        fixed += pass_fixed;\n    }\n\n    for mass in &masses {\n        cap_iron_cell_relief_spread", 1),
    ("cap-size-lt", LIB, "        if cluster.len() as f64 <= max_size {", "        if (cluster.len() as f64) < max_size {", 1),
    ("cap-biggest-lt", LIB, "            if biggest.len() as f64 <= max_size {", "            if (biggest.len() as f64) < max_size {", 1),
    ("cap-noise-reverse", LIB, "                if na != nb {\n                    return na - nb;", "                if na != nb {\n                    return nb - na;", 1),
    ("cap-ret-zero", LIB, "            reverted += 1.0;", "            reverted += 0.0;", 1),
    ("safety-hills-off", LIB, "    cap_mountain_range_cluster_size(hexes, scratch, Terrain::Hills, Terrain::Plains, max);", "    let _unused = max;", 1),
    ("grow-cap-plus1", LIB, "    let cap_count = js_floor(land * sufit_udzialu);", "    let cap_count = js_floor(land * sufit_udzialu) + 1.0;", 1),
    ("regrow-mult-x2", LIB, "js_round((mtn_reverted + hi_reverted) * mnoznik_celu)", "js_round((mtn_reverted + hi_reverted) * mnoznik_celu * 2.0)", 1),
    ("params-dlugosc-max-fb", LIB, "js_max(fb.dlugosc_max, dlugosc_min)", "js_max(fb.dlugosc_max, 0.0)", 1),
    ("walk-seed-noise-zero", LIB, "let szum = mapgen_relief_b().pasma.szum_seed_pasma.wartosc;", "let szum = 0.0;", 1),
    ("json-sufit-0.45", TBL, '"udzial_gor_wzgorz_w_ladzie_sufit": { "wartosc": 0.4,', '"udzial_gor_wzgorz_w_ladzie_sufit": { "wartosc": 0.45,', 1),
    ("json-kroku-pasma-0.31", TBL, '"szum_kroku_pasma": { "wartosc": 0.3,', '"szum_kroku_pasma": { "wartosc": 0.31,', 1),
    ("json-regrow-min-5", TBL, '"regrow_dlugosc_min": { "wartosc": 4,', '"regrow_dlugosc_min": { "wartosc": 5,', 1),
]


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def main():
    args = sys.argv[1:]
    log_path = args[0]
    dry = "--dry" in args
    only = None
    if "--only" in args:
        only = set(args[args.index("--only") + 1].split(","))
    initial = {p: sha(p) for p in (LIB, TBL)}
    originals = {p: open(p, "rb").read() for p in (LIB, TBL)}
    log = open(log_path, "a", encoding="utf-8")

    def emit(line):
        print(line, flush=True)
        log.write(line + "\n")
        log.flush()

    emit(f"SHA poczatkowe: {LIB}={initial[LIB]} {TBL}={initial[TBL]}")
    for mid, path, old, new, cnt in MUTATIONS:
        if only is not None and mid not in only:
            continue
        text = originals[path].decode("utf-8")
        found = text.count(old)
        if found != cnt:
            emit(f"BLAD-KOTWICY {mid}: wystapien={found}, oczekiwano {cnt}")
            continue
        if dry:
            emit(f"OK-KOTWICA {mid}")
            continue
        mutated = text.replace(old, new, 1).encode("utf-8")
        t0 = time.time()
        status = "SURVIVED"
        detail = ""
        try:
            with open(path, "wb") as f:
                f.write(mutated)
            cmd = ["cargo", "test", "--offline", "--no-fail-fast"]
            for b in BINS:
                cmd += ["--test", b]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=540,
                                  env=dict(os.environ))
            out = proc.stdout + proc.stderr
            failed = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and l.strip().endswith("FAILED")]
            if "error[E" in out or "could not compile" in out:
                status = "BLAD-KOMPILACJI"
                detail = "; ".join(l for l in out.splitlines() if l.startswith("error"))[:300]
            elif proc.returncode != 0 and failed:
                status = "KILLED"
                detail = f"{len(failed)} testow FAILED: " + ", ".join(x.split()[1] for x in failed[:4])
            elif proc.returncode != 0:
                status = "BLAD-INNY"
                detail = out[-300:]
            else:
                detail = "wszystkie testy zielone"
        except subprocess.TimeoutExpired:
            status = "TIMEOUT"
        finally:
            with open(path, "wb") as f:
                f.write(originals[path])
            restored = sha(path) == initial[path]
        dt = int(time.time() - t0)
        emit(f"{status:16s} {mid} ({dt} s) przywrocono={'OK' if restored else 'BLAD'} {detail}")
        if not restored:
            emit("KRYTYCZNE: przywracanie nieudane - przerwano")
            break
    final = {p: sha(p) for p in (LIB, TBL)}
    emit(f"SHA koncowe: {LIB}={final[LIB]} {TBL}={final[TBL]} zgodne={final == initial}")


if __name__ == "__main__":
    main()
