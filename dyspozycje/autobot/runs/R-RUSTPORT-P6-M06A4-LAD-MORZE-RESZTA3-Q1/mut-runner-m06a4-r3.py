"""Runner mutacji P6.M06A4 - runda 3, partie 3a/3b (obrona po zarzutach Evaluatora r3).

Plan 49 mutacji (ID w tabeli w P6-M06A4-LAD-MORZE-RESZTA.md, sekcja "Mutacje partii 3"):
  0-9   MM01-MM10  morseDepthFromMapBorder (landsea.rs, morse_depth_from_map_border)
  10-18 TM01-TM09  trimEnclosedOceanOnly (trim_enclosed_ocean_only)
  19-26 PM01-PM08  purgeInlandWaterForMultiLandTyp (purge_inland_water_for_multi_land_typ)
  27    JD01       applyJaggedCoastNoise: erozja coast > prog -> >=
  28    JF01       applyJaggedCoastNoise: wypelnienie coast < prog -> <=
  29    JF02       applyJaggedCoastNoise: odwrocony kierunek wypelnienia (coast < prog -> coast > prog)
  30-35 JV01-JV06  skladnia szumu (jagged_coast_value)
  36-43 JL01-JL08  petle, bufor krawedzi, zbieranie decyzji, liczniki (apply_jagged_coast_noise)
  44-48 JS01-JS05  parametry JSON (data/derived/mapgen-jagged-coast.json)

Kazdy mutant: dokladnie jedno wystapienie `old` w pliku (inaczej PATTERN_ERROR), zapis, test, przywrocenie
pliku w `finally`. Testy: p6_m06a4_trim, p6_m06a4_chan, p6_m06a4_jagged (wszystkie trzy, --no-fail-fast).
Statusy: ZABITA (testy nie przechodza bez bledu kompilacji), PRZEZYTA, BUILD_ERROR, PATTERN_ERROR.

Uzycie: python3 -I mut-runner-m06a4-r3.py <ID_OD> <ID_DO_EXCL> <WYJSCIE.jsonl>
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_WT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
ENGINE = os.path.join(REPO_WT, "rust-port", "engine")
LS = os.path.join(ENGINE, "src", "domain", "mapgen", "landsea.rs")
JG = os.path.join(ENGINE, "data", "derived", "mapgen-jagged-coast.json")
ENV = dict(
    os.environ,
    CARGO_INCREMENTAL="0",
    CARGO_TARGET_DIR="/home/user/cargo-target-shared/" + os.path.basename(REPO_WT),
    CARGO_PROFILE_DEV_DEBUG="0",
)
TESTS = ["--test", "p6_m06a4_trim", "--test", "p6_m06a4_chan", "--test", "p6_m06a4_jagged"]

MUTS = [
    # --- MM: morseDepthFromMapBorder ---
    ("MM01 granica: usun warunek q == 0", LS,
     "let on_border = q == 0 || r == 0 || q == width - 1 || r == height - 1;",
     "let on_border = r == 0 || q == width - 1 || r == height - 1;"),
    ("MM02 granica: usun warunek r == 0", LS,
     "let on_border = q == 0 || r == 0 || q == width - 1 || r == height - 1;",
     "let on_border = q == 0 || q == width - 1 || r == height - 1;"),
    ("MM03 granica: usun warunek q == width-1", LS,
     "let on_border = q == 0 || r == 0 || q == width - 1 || r == height - 1;",
     "let on_border = q == 0 || r == 0 || r == height - 1;"),
    ("MM04 granica: usun warunek r == height-1", LS,
     "let on_border = q == 0 || r == 0 || q == width - 1 || r == height - 1;",
     "let on_border = q == 0 || r == 0 || q == width - 1;"),
    ("MM05 ziarno: kazda woda (is_water_terrain_local) zamiast Morze", LS,
     "if hexes.get(&key).is_some_and(|h| h.terrain == Terrain::Sea) {",
     "if hexes.get(&key).is_some_and(|h| is_water_terrain_local(h.terrain)) {"),
    ("MM06 sasiad: kazda woda zamiast Morze", LS,
     "if !hexes.get(&nk).is_some_and(|nh| nh.terrain == Terrain::Sea) {",
     "if !hexes.get(&nk).is_some_and(|nh| is_water_terrain_local(nh.terrain)) {"),
    ("MM07 odleglosc: d+1 -> d", LS,
     "dist.insert(nk, d + 1);", "dist.insert(nk, d);"),
    ("MM08 kolejka: odczyt od konca (nie FIFO)", LS,
     "let (q, r) = queue[head];", "let (q, r) = queue[queue.len() - 1 - head];"),
    ("MM09 ziarno: odleglosc 0 -> 1", LS,
     "dist.insert(key, 0);", "dist.insert(key, 1);"),
    ("MM10 granica: r == height-1 -> r == height-2", LS,
     "q == width - 1 || r == height - 1;\n", "q == width - 1 || r == height - 2;\n"),
    # --- TM: trimEnclosedOceanOnly ---
    ("TM01 zakres: przetwarzaj takze PlytkieMorze", LS,
     "        if hex.terrain != Terrain::Sea {\n            continue;\n        }\n        if depth",
     "        if !matches!(hex.terrain, Terrain::Sea | Terrain::ShallowSea) {\n            continue;\n        }\n        if depth"),
    ("TM02 warunek: odwrocone contains_key", LS,
     "if depth.contains_key(key.as_str()) {", "if !depth.contains_key(key.as_str()) {"),
    ("TM03 cel: Grassland -> Plains", LS,
     "hex.terrain = Terrain::Grassland;", "hex.terrain = Terrain::Plains;"),
    ("TM04 usun overlay = Brak", LS,
     "        hex.overlay = Nakladka::Brak;\n        hex.river_present = false;",
     "        hex.river_present = false;"),
    ("TM05 usun river_present = false", LS,
     "        hex.river_present = false;\n        hex.river_edges.clear();",
     "        hex.river_edges.clear();"),
    ("TM06 usun river_edges.clear()", LS,
     "        hex.river_edges.clear();\n        hex.has_deposit = false;",
     "        hex.has_deposit = false;"),
    ("TM07 usun has_deposit = false", LS,
     "        hex.has_deposit = false;\n        converted += 1;",
     "        converted += 1;"),
    ("TM08 licznik: += 1 -> += 2", LS,
     "        hex.has_deposit = false;\n        converted += 1;", "        hex.has_deposit = false;\n        converted += 2;"),
    ("TM09 usun warunek pomijania heksow z wynikiem BFS", LS,
     "        if depth.contains_key(key.as_str()) {\n            continue;\n        }\n", ""),
    # --- PM: purgeInlandWaterForMultiLandTyp ---
    ("PM01 usun pierwszy fill(5)", LS,
     "    let mut n = fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_A);\n    n += remove_inland_water_pools(hexes, width, height);\n    n += trim",
     "    let mut n = 0usize;\n    n += remove_inland_water_pools(hexes, width, height);\n    n += trim"),
    ("PM02 prog fill A: 5 -> 4", LS,
     "const PURGE_INLAND_FILL_MIN_LAND_A: usize = 5;", "const PURGE_INLAND_FILL_MIN_LAND_A: usize = 4;"),
    ("PM03 prog fill B: 4 -> 5", LS,
     "const PURGE_INLAND_FILL_MIN_LAND_B: usize = 4;", "const PURGE_INLAND_FILL_MIN_LAND_B: usize = 5;"),
    ("PM04 usun OSTATNI removeInland (po fill(B))", LS,
     "    n += fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_B);\n    n += remove_inland_water_pools(hexes, width, height);\n    n\n",
     "    n += fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_B);\n    n\n"),
    ("PM05 usun trim", LS,
     "    n += trim_enclosed_ocean_only(hexes, width, height);\n", ""),
    ("PM06 usun PIERWSZY removeInland (po fill(A))", LS,
     "    n += remove_inland_water_pools(hexes, width, height);\n    n += trim_enclosed",
     "    n += trim_enclosed"),
    ("PM07 licznik: ostatni krok n = zamiast n +=", LS,
     "    n += remove_inland_water_pools(hexes, width, height);\n    n\n}",
     "    n = remove_inland_water_pools(hexes, width, height);\n    n\n}"),
    ("PM08 kolejnosc: fill(B) przed trim", LS,
     "    n += trim_enclosed_ocean_only(hexes, width, height);\n    n += fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_B);",
     "    n += fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_B);\n    n += trim_enclosed_ocean_only(hexes, width, height);"),
    # --- JD/JF: decyzje progowe ---
    ("JD01 erozja: coast > prog -> coast >= prog", LS,
     "    coast > prog\n", "    coast >= prog\n"),
    ("JF01 wypelnienie: coast < prog -> coast <= prog", LS,
     "    coast < prog\n", "    coast <= prog\n"),
    ("JF02 wypelnienie: odwrocony kierunek (coast > prog)", LS,
     "    coast < prog\n", "    coast > prog\n"),
    # --- JV: skladnia szumu ---
    ("JV01 gruby szum x: usun przesuniecie przebiegu x", LS,
     "        qf * s + pass_f * t.przesuniecie_przebiegu_x,", "        qf * s,"),
    ("JV02 gruby szum y: usun przesuniecie przebiegu y", LS,
     "        rf * s + pass_f * t.przesuniecie_przebiegu_y,", "        rf * s,"),
    ("JV03 drobny szum x: usun mnoznik", LS,
     "        qf * s * t.mnoznik_drobnej_skali + t.przesuniecie_drobnej_skali,",
     "        qf * s + t.przesuniecie_drobnej_skali,"),
    ("JV04 drobny szum: usun wage", LS,
     "    ) * t.waga_drobnej_skali;", "    );"),
    ("JV05 suma: coarse - fine", LS,
     "    coarse + fine", "    coarse - fine"),
    ("JV06 gruby szum: oktawy drobnej skali", LS,
     "        t.oktawy_grubej_skali,\n    );", "        t.oktawy_drobnej_skali,\n    );"),
    # --- JL: petle, bufor, zbieranie decyzji, liczniki ---
    ("JL01 petla przebiegow: tylko pierwszy", LS,
     "    for pass in 0..passes {", "    for pass in 0..passes.min(1) {"),
    ("JL02 bufor krawedzi: usun pominiecie", LS,
     "                if is_in_map_border(q as f64, r as f64, width as f64, height as f64, None) {\n                    continue;\n                }\n",
     ""),
    ("JL03 przebieg: szum zawsze z przebiegu 0", LS,
     "let coast = jagged_coast_value(perm, q, r, pass, t);",
     "let coast = jagged_coast_value(perm, q, r, 0, t);"),
    ("JL04 erozja: usun warunek is_coastal_land_hex", LS,
     "if hex.terrain != Terrain::Sea && is_coastal_land_hex(hexes, q, r) {",
     "if hex.terrain != Terrain::Sea {"),
    ("JL05 wypelnienie: usun warunek is_coastal_morse_hex", LS,
     "\n                    && is_coastal_morse_hex(hexes, q, r)", ""),
    ("JL06 licznik erozji: usun changed += 1", LS,
     "                set_hex_to_morze(h);\n                changed += 1;",
     "                set_hex_to_morze(h);"),
    ("JL07 licznik wypelnienia: usun changed += 1", LS,
     "                set_hex_to_laka(h);\n                changed += 1;",
     "                set_hex_to_laka(h);"),
    ("JL08 zbieranie: pominiecie zastosowania erozji", LS,
     "        for key in &to_erode {", "        for key in to_erode.iter().take(0) {"),
    # --- JS: parametry JSON ---
    ("JS01 skala_szumu 0.28 -> 0.29", JG, '"skala_szumu": 0.28', '"skala_szumu": 0.29'),
    ("JS02 mnoznik_drobnej_skali 2.1 -> 2.2", JG, '"mnoznik_drobnej_skali": 2.1', '"mnoznik_drobnej_skali": 2.2'),
    ("JS03 przesuniecie_drobnej_skali 200 -> 201", JG, '"przesuniecie_drobnej_skali": 200.0', '"przesuniecie_drobnej_skali": 201.0'),
    ("JS04 waga_drobnej_skali 0.35 -> 0.36", JG, '"waga_drobnej_skali": 0.35', '"waga_drobnej_skali": 0.36'),
    ("JS05 prog_wypelnienia_morze 0.32 -> 0.33", JG, '"prog_wypelnienia_morze": 0.32', '"prog_wypelnienia_morze": 0.33'),
]


def run(i):
    name, path, old, new = MUTS[i]
    orig = open(path, encoding="utf-8").read()
    n = orig.count(old)
    if n != 1:
        return {"id": name, "status": "PATTERN_ERROR", "old_count": n}
    try:
        open(path, "w", encoding="utf-8").write(orig.replace(old, new))
        p = subprocess.run(
            ["cargo", "test"] + TESTS + ["--no-fail-fast"],
            cwd=ENGINE, env=ENV, capture_output=True, text=True,
        )
        out = p.stdout + p.stderr
        build_error = ("error[E" in out) or ("could not compile" in out)
        fails = [l for l in out.splitlines() if "FAILED" in l or "panicked" in l][:4]
        if build_error:
            status = "BUILD_ERROR"
        elif p.returncode != 0:
            status = "ZABITA"
        else:
            status = "PRZEZYTA"
        return {"id": name, "status": status, "exit": p.returncode, "fails": fails}
    finally:
        open(path, "w", encoding="utf-8").write(orig)


if __name__ == "__main__":
    lo, hi, outpath = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    for i in range(lo, min(hi, len(MUTS))):
        r = run(i)
        with open(outpath, "a", encoding="utf-8") as f:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(json.dumps(r, ensure_ascii=False))
