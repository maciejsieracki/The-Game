#!/usr/bin/env python3
"""Mut-runner P6.M06A8 (Operator-pomiary r1).

Dla kazdej mutacji: podmienia DOKLADNIE jedno wystapienie tekstu `old` na `new` w
rust-port/engine/src/domain/mapgen/landsea.rs, uruchamia testy M06A8
(`p6_m06a8_landsea` + `p6_m06a8_pomiary`), zapisuje wynik i przywraca plik.

Uzycie: python3 -I mut-runner-m06a8-r1.py <engine_dir> <wynik.jsonl> <od> <do>
  (indeksy mutacji z listy MUTANTS, od wlacznie, do wylacznie)
"""
import json
import os
import re
import subprocess
import sys
import time

ENGINE = sys.argv[1]
OUT = sys.argv[2]
LO, HI = int(sys.argv[3]), int(sys.argv[4])
SRC = os.path.join(ENGINE, "src/domain/mapgen/landsea.rs")

# (id, opis, old, new)
MUTANTS = [
    ("G01", "group: seed bez testu suchego ladu", "if !is_dry_land_terrain(hex.terrain) || visited.contains(key) {",
     "if visited.contains(key) {"),
    ("G02", "group: seed bez testu visited", "if !is_dry_land_terrain(hex.terrain) || visited.contains(key) {",
     "if !is_dry_land_terrain(hex.terrain) {"),
    ("G03", "group: sasiad bez testu visited",
     "                if visited.contains(&nk) {\n                    continue;\n                }\n                let Some(nh) = hexes.get(&nk) else { continue };",
     "                let Some(nh) = hexes.get(&nk) else { continue };"),
    ("G04", "group: sasiad bez testu suchego ladu",
     "                if !is_dry_land_terrain(nh.terrain) {\n                    continue;\n                }\n                visited.insert(nk.clone());",
     "                visited.insert(nk.clone());"),
    ("G05", "group: klucz niekanoniczny rozwijany jak (0,0)", "let neighbours = key_qr(&k);",
     "let neighbours = key_qr(&k).or(Some((0, 0)));"),
    ("E01", "ensure: BFS rozwija d >= N (zamiast d > N)", "if d > max_bridge {", "if d >= max_bridge {"),
    ("E02", "ensure: BFS rozwija d <= N+1", "if d > max_bridge {", "if d > max_bridge + 1 {"),
    ("E03", "ensure: brak dolnego clampu 18", "        t.bridge_min,", "        1.0,"),
    ("E04", "ensure: brak gornego clampu 48", "            t.bridge_max,", "            1000.0,"),
    ("E05", "ensure: trunc zamiast round w N", "js_round(t.bridge_baza + map_scale * t.bridge_mnoznik)",
     "(t.bridge_baza + map_scale * t.bridge_mnoznik).trunc()"),
    ("E06", "ensure: mnoznik 6 -> 7", "t.bridge_baza + map_scale * t.bridge_mnoznik",
     "t.bridge_baza + map_scale * (t.bridge_mnoznik + 1.0)"),
    ("E07", "ensure: skala pola podwojona (mapScale /sqrt2)", "/ t.bridge_skala_pola).sqrt();",
     "/ (t.bridge_skala_pola * 2.0)).sqrt();"),
    ("E08", "ensure: iteracje 11 zamiast 12", "for _iter in 0..t.bridge_iter_max {", "for _iter in 0..(t.bridge_iter_max - 1) {"),
    ("E09", "ensure: iteracje 13 zamiast 12", "for _iter in 0..t.bridge_iter_max {", "for _iter in 0..(t.bridge_iter_max + 1) {"),
    ("E10", "ensure: break dla masses.len() <= 0", "if masses.len() <= 1 {", "if masses.len() <= 0 {"),
    ("E11", "ensure: break dla masses.len() <= 2", "if masses.len() <= 1 {", "if masses.len() <= 2 {"),
    ("E12", "ensure: sortowanie rosnace", "js_array_sort_by(&mut masses, |a, b| b.len() as f64 - a.len() as f64);",
     "js_array_sort_by(&mut masses, |a, b| a.len() as f64 - b.len() as f64);"),
    ("E13", "ensure: seed bez testu dist (dubel)",
     "if !is_pangea_bridge_water(nh.terrain) || dist.contains_key(&nk) {\n                    continue;\n                }\n                dist.insert(nk.clone(), 1);",
     "if !is_pangea_bridge_water(nh.terrain) {\n                    continue;\n                }\n                dist.insert(nk.clone(), 1);"),
    ("E14", "ensure: BFS bez testu dist (dubel)",
     "if !is_pangea_bridge_water(nh.terrain) || dist.contains_key(&nk) {\n                    continue;\n                }\n                dist.insert(nk.clone(), d + 1);",
     "if !is_pangea_bridge_water(nh.terrain) {\n                    continue;\n                }\n                dist.insert(nk.clone(), d + 1);"),
    ("E15", "ensure: seed dist = 2 zamiast 1", "dist.insert(nk.clone(), 1);", "dist.insert(nk.clone(), 2);"),
    ("E16", "ensure: BFS nie przerywa po trafieniu obcego",
     "if found_foreign {\n                break;\n            }", "if found_foreign {\n            }"),
    ("E17", "ensure: odwrocony warunek obcej masy", "if !main_set.contains(&nk) {", "if main_set.contains(&nk) {"),
    ("E18", "ensure: sciezka konwertuje takze glowna mase",
     "if is_pangea_bridge_water(h.terrain) {\n                set_hex_to_laka(h);", "if true {\n                set_hex_to_laka(h);"),
    ("E19", "ensure: zapas sciezki +1 (cap N+1)", "if path_len > max_bridge + t.bridge_zapas_sciezki {",
     "if path_len > max_bridge + 1 {"),
    ("E20", "ensure: cap sciezki N-2", "if path_len > max_bridge + t.bridge_zapas_sciezki {",
     "if path_len > max_bridge - 2 {"),
    ("E21", "ensure: zapas sciezki +7 (cap N+7)", "if path_len > max_bridge + t.bridge_zapas_sciezki {",
     "if path_len > max_bridge + 7 {"),
    ("E22", "ensure: sciezka nie przerywa na glownej masie",
     "if main_set.contains(&c) {\n                break;\n            }", "if main_set.contains(&c) {\n            }"),
    ("E23", "ensure: obca masa >= limitu usuwana", "if other.len() as f64 > limit {", "if other.len() as f64 >= limit {"),
    ("E24", "ensure: obca masa do limitu+1", "if other.len() as f64 > limit {", "if other.len() as f64 > limit + 1.0 {"),
    ("E25", "ensure: brak dolnego clampu 60 limitu obcej masy",
     "let limit = js_max(\n                t.masa_obca_min,", "let limit = js_max(\n                1.0,"),
    ("E26", "ensure: ulamek glownej masy x1.04",
     "(main.len() as f64 * t.masa_obca_ulamek_glownej).floor()", "(main.len() as f64 * t.masa_obca_ulamek_glownej * 1.04).floor()"),
    ("E27", "ensure: brak testu dry przy usuwaniu obcej masy",
     "if is_dry_land_terrain(h.terrain) {\n                            set_hex_to_morze(h);", "if true {\n                            set_hex_to_morze(h);"),
    ("E28", "ensure: brak licznika przy usuwaniu obcej masy",
     "set_hex_to_morze(h);\n                            converted += 1;", "set_hex_to_morze(h);"),
    ("E29", "ensure: glowna masa tez usuwana (skip(0))", "for other in masses.iter().skip(1) {", "for other in masses.iter().skip(0) {"),
    ("E30", "ensure: brak licznika w sciezce wody",
     "set_hex_to_laka(h);\n                converted += 1;\n            }\n            if main_set.contains(&c) {",
     "set_hex_to_laka(h);\n            }\n            if main_set.contains(&c) {"),
    ("E31", "ensure: brak wywolania hooka fill", "converted += fill_annular(hexes, width, height);",
     "drop(fill_annular);"),
    ("P01", "pangea bridge water: tylko Sea (bez ShallowSea)", "pub fn is_pangea_bridge_water(t: Terrain) -> bool {\n    is_water_terrain_local(t)",
     "pub fn is_pangea_bridge_water(t: Terrain) -> bool {\n    t == Terrain::Sea"),
    ("P02", "dry land: brak wykluczenia Ocean/ShallowSea w group (suchy = wszystko)",
     "pub fn is_dry_land_terrain(t: Terrain) -> bool {\n    !is_water_terrain_local(t)", "pub fn is_dry_land_terrain(t: Terrain) -> bool {\n    t != Terrain::Sea"),
]


def run_tests():
    env = dict(os.environ)
    env.update({
        "CARGO_INCREMENTAL": "0",
        "CARGO_TARGET_DIR": "/home/user/cargo-target-shared/wf_fac0d57f-23a-2",
        "CARGO_PROFILE_DEV_DEBUG": "0",
    })
    t0 = time.time()
    p = subprocess.run(
        ["cargo", "test", "--test", "p6_m06a8_landsea", "--test", "p6_m06a8_pomiary"],
        cwd=ENGINE, env=env, capture_output=True, text=True,
    )
    text = p.stdout + p.stderr
    compile_err = "error[E" in text or "could not compile" in text
    failed = re.findall(r"^test (\S+) \.\.\. FAILED", text, re.M)
    return {
        "exit": p.returncode,
        "compile_error": compile_err,
        "failed_tests": failed,
        "secs": round(time.time() - t0, 1),
    }


def main():
    original = open(SRC, "rb").read()
    results = []
    try:
        for idx in range(LO, min(HI, len(MUTANTS))):
            mid, desc, old, new = MUTANTS[idx]
            text = original.decode("utf-8")
            cnt = text.count(old)
            if cnt != 1:
                rec = {"id": mid, "desc": desc, "status": "NO-APPLY", "count": cnt}
            else:
                mutated = text.replace(old, new, 1)
                with open(SRC, "wb") as f:
                    f.write(mutated.encode("utf-8"))
                r = run_tests()
                if r["compile_error"]:
                    status = "COMPILE-ERR"
                elif r["exit"] != 0:
                    status = "KILLED"
                else:
                    status = "SURVIVED"
                rec = {"id": mid, "desc": desc, "status": status, **r}
            results.append(rec)
            with open(OUT, "a", encoding="utf-8") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            print(json.dumps(rec, ensure_ascii=False), flush=True)
    finally:
        with open(SRC, "wb") as f:
            f.write(original)


if __name__ == "__main__":
    main()
