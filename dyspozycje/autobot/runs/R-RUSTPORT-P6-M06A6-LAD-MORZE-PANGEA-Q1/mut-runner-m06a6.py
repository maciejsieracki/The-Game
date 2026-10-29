#!/usr/bin/env python3
"""Mutacje P6.M06A6 (rodzina Pangei, partia 1). Kazda mutacja zmienia JEDEN fragment
rust-port/engine/src/domain/mapgen/landsea.rs, uruchamia testy p6_m06a6_pangea i oczekuje
CZERWONYCH testow. Po KAZDEJ mutacji plik jest przywracany z bajtow w pamieci, a SHA-256
pliku z dysku porownywane z poczatkowym.

Uzycie (cwd = rust-port/engine; env CARGO_* jak w dispatchu):
  python3 <run>/mut-runner-m06a6.py <LOG> [--dry] [--only id1,id2]
--dry : tylko sprawdza, czy kotwica wystepuje dokladnie tyle razy, ile zadeklarowano.
Wynik: KILLED, SURVIVED (testy zielone -> luka lub rownowaznosc do dowiedzenia), BLAD-KOTWICY,
BLAD-KOMPILACJI, TIMEOUT.
"""
import hashlib
import os
import subprocess
import sys
import time

LIB = "src/domain/mapgen/landsea.rs"
BINS = ["p6_m06a6_pangea"]

# (id, stary fragment, nowy fragment, liczba wystapien oczekiwana)
MUTATIONS = [
    # --- erodePangeaBboxLowScoreRim (:3551) ---
    ("E01-bbox-stop-lt", "    if bbox_fill <= target_bbox_fill {\n        return 0;",
     "    if bbox_fill < target_bbox_fill {\n        return 0;", 1),
    ("E02-early-guard-off", "    if bbox_fill <= target_bbox_fill {\n        return 0;",
     "    if false {\n        return 0;", 1),
    ("E03-rim-qmin-lt", "q <= q_min + band ||", "q < q_min + band ||", 1),
    ("E04-rim-qmax-gt", "q >= q_max - band ||", "q > q_max - band ||", 1),
    ("E05-rim-rmin-lt", "r <= r_min + band ||", "r < r_min + band ||", 1),
    ("E06-rim-rmax-gt", "r >= r_max - band", "r > r_max - band", 1),
    ("E07-tol-ge", "if (sa - sb).abs() > tol {", "if (sa - sb).abs() >= tol {", 1),
    ("E08-sort-reverse-dist", "        db - da\n    });", "        da - db\n    });", 1),
    ("E09-stop-struct-no-fill", "        if bbox_fill <= target_bbox_fill || eroded >= max_erode {",
     "        if eroded >= max_erode {", 1),
    ("E10-max-gt", "|| eroded >= max_erode {", "|| eroded > max_erode {", 1),
    ("E11-no-recount", "        land_count -= 1.0;\n        bbox_fill = land_count / bbox_area;\n        eroded += 1;",
     "        eroded += 1;", 1),
    ("E12-no-morze", "        if let Some(h) = hexes.get_mut(k) {\n            set_hex_to_morze(h);\n        }\n        land_count -= 1.0;",
     "        land_count -= 1.0;", 1),
    ("E13-area-noclamp", "    let bbox_area = js_max(1.0, (q_max - q_min + 1.0) * (r_max - r_min + 1.0));",
     "    let bbox_area = (q_max - q_min + 1.0) * (r_max - r_min + 1.0);", 1),
    # --- carvePangeaLongSideGulfs (:3606) ---
    ("C01-minland-le", "if land_keys.len() < p.carve_min_liczba_ladu {", "if land_keys.len() <= p.carve_min_liczba_ladu {", 1),
    ("C02-aspect-lt", "if aspect <= max_aspect {", "if aspect < max_aspect {", 1),
    ("C03-longisq-gt", "let long_is_q = span_q >= span_r;", "let long_is_q = span_q > span_r;", 1),
    ("C04-onlong-min-lt", "across <= short_min + carve_depth", "across < short_min + carve_depth", 1),
    ("C05-onlong-max-gt", "across >= short_max - carve_depth", "across > short_max - carve_depth", 1),
    ("C06-nearmid-le", "(along - mid_long).abs() < long_span * p.carve_blisko_srodka_udzial",
     "(along - mid_long).abs() <= long_span * p.carve_blisko_srodka_udzial", 1),
    ("C07-struct-no-nearmid", "if !(on_long_side && near_mid) {", "if !(on_long_side) {", 1),
    ("C08-noise-drop", "score: base + noise * p.carve_szum_waga,", "score: base,", 1),
    ("C09-sort-reverse", "js_array_sort_by(&mut scored, |a, b| a.score - b.score);",
     "js_array_sort_by(&mut scored, |a, b| b.score - a.score);", 1),
    ("C10-max-gt", "if carved >= max_carve {", "if carved > max_carve {", 1),
    ("C11-edge-ge", "if dist_edge > carve_depth {", "if dist_edge >= carve_depth {", 1),
    ("C12-depth-nofloor", "(short_span * p.carve_glebokosc_udzial).floor()", "(short_span * p.carve_glebokosc_udzial)", 1),
    ("C13-depth-nomin", "        p.carve_glebokosc_min,\n        (short_span", "        0.0,\n        (short_span", 1),
    ("C14-edge-min-max", "let dist_edge = js_min(x.across - short_min, short_max - x.across);",
     "let dist_edge = js_max(x.across - short_min, short_max - x.across);", 1),
    # --- applyLandFractionByContinent (:3701) ---
    ("K01-clamp-noupper", "js_min(fill.clamp_udzialu_max, target_land_fraction),", "target_land_fraction,", 1),
    ("K02-last-quota", "            target_land - assigned\n", "            target_land\n", 1),
    ("K03-round-floor", "js_round(target_land * (score_sums[ci] / total_score))",
     "(target_land * (score_sums[ci] / total_score)).floor()", 1),
    ("K04-deficit-le", "    if land < quota {\n", "    if land <= quota {\n", 1),
    ("K05-morse-nobreak", "            for k in &morse {\n                if land >= quota {\n                    break;\n                }\n",
     "            for k in &morse {\n", 1),
    ("K06-erode-branch-off", "        } else if land > quota {", "        } else if false {", 1),
    ("K07-reconcile-off", "    if final_land != target_land {", "    if false {", 1),
    ("K08-nan-guard-off", "    let total_score = if sum_all == 0.0 || sum_all.is_nan() {", "    let total_score = if sum_all == 0.0 {", 1),
    ("K09-sort-tol-ge", "                let sb = score(b);\n                if (sb - sa).abs() > fill.tolerancja_score_sortowanie {",
     "                let sb = score(b);\n                if (sb - sa).abs() >= fill.tolerancja_score_sortowanie {", 1),
    ("K10-ci-noclamp-hi", "let ci = (last as i64).min(raw.max(0)) as usize;", "let ci = raw.max(0) as usize;", 1),
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
    initial_sha = sha(LIB)
    original = open(LIB, "rb").read()
    log = open(log_path, "a", encoding="utf-8")

    def emit(line):
        print(line, flush=True)
        log.write(line + "\n")
        log.flush()

    emit(f"SHA poczatkowe: {LIB}={initial_sha}")
    for mid, old, new, cnt in MUTATIONS:
        if only is not None and mid not in only:
            continue
        text = original.decode("utf-8")
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
            with open(LIB, "wb") as f:
                f.write(mutated)
            cmd = ["cargo", "test", "--offline", "--no-fail-fast"]
            for b in BINS:
                cmd += ["--test", b]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=540, env=dict(os.environ))
            out = proc.stdout + proc.stderr
            failed = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and l.strip().endswith("FAILED")]
            if "error[E" in out or "could not compile" in out:
                status = "BLAD-KOMPILACJI"
                detail = "; ".join(l for l in out.splitlines() if l.startswith("error"))[:300]
            elif proc.returncode != 0 and failed:
                status = "KILLED"
                detail = f"{len(failed)} FAILED: " + ", ".join(x.split()[1] for x in failed[:4])
            elif proc.returncode != 0:
                status = "BLAD-INNY"
                detail = out[-300:]
            else:
                detail = "wszystkie testy zielone"
        except subprocess.TimeoutExpired:
            status = "TIMEOUT"
        finally:
            with open(LIB, "wb") as f:
                f.write(original)
            restored = sha(LIB) == initial_sha
        dt = int(time.time() - t0)
        emit(f"{status:16s} {mid} ({dt} s) przywrocono={'OK' if restored else 'BLAD'} {detail}")
        if not restored:
            emit("KRYTYCZNE: przywracanie nieudane - przerwano")
            break
    final_sha = sha(LIB)
    emit(f"SHA koncowe: {LIB}={final_sha} zgodne={final_sha == initial_sha}")


if __name__ == "__main__":
    main()
