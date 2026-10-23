#!/usr/bin/env python3
"""Testy negatywne (mutacje) P6.M11: kazda mutacja zmienia JEDEN fragment kodu/tabeli silnika,
uruchamia testy p6_m11_* i oczekuje CZERWONYCH testow. Plik jest po kazdej mutacji przywracany
z kopii w pamieci (a na koncu weryfikowany bajt w bajt).

Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR / CARGO_INCREMENTAL=0):
  python3 ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M11-KLASTRY-UKLAD-STOLIC-Q1/run-mutations.py [--dry] [id ...]
--dry tylko sprawdza, ze kazdy fragment wystepuje oczekiwana liczbe razy (bez budowania).
"""
import re
import subprocess
import sys

LIB = "src/domain/mapgen/cluster_layout.rs"
TBL = "data/derived/mapgen-cluster-layout.json"
TESTS = [
    "--test", "p6_m11_gates", "--test", "p6_m11_layout", "--test", "p6_m11_repair",
    "--test", "p6_m11_tables", "--test", "p6_m11_integration",
]

# (id, plik, stary fragment, nowy fragment, ktore wystapienie (1-based) albo 0 = wymagane jedyne)
MUTATIONS = [
    ("hub-reach-no-reserve", LIB, "1.max(state_city_count + cluster_growth_reserve())", "1.max(state_city_count)", 0),
    ("max-sea-minus-band", LIB, "capital_min_sea_dist(rozmiar) + capital_sea_band_width()", "capital_min_sea_dist(rozmiar) - capital_sea_band_width()", 0),
    ("for-map-min-sea-le", LIB, "if map_w.min(map_h) < min_short_side() {", "if map_w.min(map_h) <= min_short_side() {", 1),
    ("for-map-max-sea-le", LIB, "if map_w.min(map_h) < min_short_side() {", "if map_w.min(map_h) <= min_short_side() {", 2),
    ("for-map-sep-le", LIB, "if map_w.min(map_h) < min_short_side() {", "if map_w.min(map_h) <= min_short_side() {", 3),
    ("for-map-body-le", LIB, "if map_w.min(map_h) < min_short_side() {", "if map_w.min(map_h) <= min_short_side() {", 4),
    ("for-map-placement-le", LIB, "if map_w.min(map_h) < min_short_side() {", "if map_w.min(map_h) <= min_short_side() {", 5),
    ("band-gate-min-le", LIB, "if min_dist > 0.0 && d < min_dist {", "if min_dist > 0.0 && d <= min_dist {", 0),
    ("penalty-below-le", LIB, "    if sea < lo {", "    if sea <= lo {", 0),
    ("penalty-ideal-lo", LIB, "let ideal = (lo + hi) / 2.0;", "let ideal = lo;", 0),
    ("quadrant-east-gt", LIB, "usize::from(f64::from(q) >= mid_q)", "usize::from(f64::from(q) > mid_q)", 0),
    ("quadrant-weights-swapped", LIB, "    east + south * 2\n", "    east * 2 + south\n", 0),
    ("sep-gate-gt", LIB, "prior_capitals.iter().all(|p| dist_hh(c, *p) >= min_sep)", "prior_capitals.iter().all(|p| dist_hh(c, *p) > min_sep)", 0),
    ("ladder-no-dedupe", LIB, "if !out.contains(&s) {", "if true {", 0),
    ("spawn-preferred-band-always", LIB, "|| sea_min < min_sea_dist", "|| false", 0),
    ("spawn-band-filter-lt", LIB, ".filter(|c| c.sea <= band_max)", ".filter(|c| c.sea < band_max)", 0),
    ("spawn-sort-max-band-only", LIB, "let sort_max = or0(band_max, max_sea_dist);", "let sort_max = band_max;", 0),
    ("spawn-not-progressive", LIB, "let sea_steps: Vec<f64> = if opts.progressive_soft_sea {", "let sea_steps: Vec<f64> = if false {", 0),
    ("poisson-anchor-le", LIB, "if dist_i(c, a) < anchor_min {", "if dist_i(c, a) <= anchor_min {", 0),
    ("poisson-luz-plus", LIB, "min_dist - p.luz_odstepu.wartosc", "min_dist + p.luz_odstepu.wartosc", 0),
    ("capital-sort-copy-not-inplace", LIB,
     "            js_array_sort_by(region, |a, b| cmp(a, b, &mut *rand));\n            Some(region[0])",
     "            let mut copy = region.clone();\n            js_array_sort_by(&mut copy, |a, b| cmp(a, b, &mut *rand));\n            Some(copy[0])", 0),
    ("capital-no-rand-in-comparator", LIB, "let jitter = rand() * jitter_w;", "let jitter = 0.0 * jitter_w;", 0),
    ("capital-in-band-lt", LIB, ".filter(|c| sea_dist_at(sd, c.q, c.r) <= band_max)", ".filter(|c| sea_dist_at(sd, c.q, c.r) < band_max)", 0),
    ("capital-anchor-gt", LIB, ".filter(|c| dist_i(*c, HexCoord::new(a.q, a.r)) >= a.min_dist)", ".filter(|c| dist_i(*c, HexCoord::new(a.q, a.r)) > a.min_dist)", 0),
    ("layout-growth-zero", LIB, "growth_reserve: Some(growth_reserve),", "growth_reserve: Some(0),", 0),
    ("assign-quota-plus", LIB, ".take(quota)", ".take(quota + 1)", 0),
    ("assign-falsy-only-none", LIB, "slot.as_deref().is_none_or(str::is_empty)", "slot.is_none()", 0),
    ("assign-no-shuffle", LIB, "shuffle_in_place_with(&mut shuffled_types, &mut *rand);", "let _ = &mut shuffled_types;", 0),
    ("dominance-keep-all", LIB, "ci == 0 || passes_local_land_gate(map, c.q, c.r, None, None)", "true", 0),
    ("dominance-spread-n-plus", LIB, "spread_n: centrumy.len() as i64,", "spread_n: centrumy.len() as i64 + 1,", 0),
    ("hard-fix-idx-swapped", LIB, "let fix_idx = if caps[j].1 > caps[i].1 { j } else { i };", "let fix_idx = if caps[j].1 > caps[i].1 { i } else { j };", 0),
    ("hard-d-gt", LIB, "if d >= min_capital_sep {", "if d > min_capital_sep {", 0),
    ("body-cap-le", LIB, "if d < min_capital_sep {", "if d <= min_capital_sep {", 0),
    ("body-pending-none", LIB, "k.pending_state_slots = Some(Vec::new());", "k.pending_state_slots = None;", 0),
    ("anchor-for-always-player", LIB, "    if fix_ki == 0 {\n        return None;\n    }\n    player_cap.map(", "    player_cap.map(", 0),
    ("repack-mp-now-gt", LIB, "if mp_now >= state_city_count {", "if mp_now > state_city_count {", 0),
    ("repack-loose-ceil", LIB, "(buffer_radius / rp.luzny_bufor_dzielnik.wartosc).floor()", "(buffer_radius / rp.luzny_bufor_dzielnik.wartosc).ceil()", 0),
    ("quarter-new-spread-lt", LIB, "new_spread.occupied_quadrants <= spread.occupied_quadrants", "new_spread.occupied_quadrants < spread.occupied_quadrants", 0),
    ("quarter-load-ge", LIB, "if counts[quad] as i64 > max_load {", "if counts[quad] as i64 >= max_load {", 0),
    ("quarter-no-centrum-update", LIB, "        k.centrum = new_cap;\n", "", 0),
    ("foreign-anchor-le", LIB, "if cap_dist + cluster_city_state_max_hex() < min_dyst_obcy_od_gracza {", "if cap_dist + cluster_city_state_max_hex() <= min_dyst_obcy_od_gracza {", 0),
    ("body-buffer-floor", LIB, "(s_cluster / 2.0).ceil()", "(s_cluster / 2.0).floor()", 0),
    # --- tabela (edytowalne wartosci balansu): zmiana liczby MUSI lamac testy parytetu ---
    ("table-min-sea-duza-9", TBL, '"wartosc": 10,\n        "zrodlo_web": "gra/src/map/clusters.ts:1374"', '"wartosc": 9,\n        "zrodlo_web": "gra/src/map/clusters.ts:1374"', 0),
    ("table-sep-duza-14", TBL, '"wartosc": 15,\n        "zrodlo_web": "gra/src/map/clusters.ts:1474"', '"wartosc": 14,\n        "zrodlo_web": "gra/src/map/clusters.ts:1474"', 0),
    ("table-band-width-6", TBL, '"wartosc": 5,\n      "zrodlo_web": "gra/src/map/clusters.ts:1386', '"wartosc": 6,\n      "zrodlo_web": "gra/src/map/clusters.ts:1386', 0),
    ("table-short-side-79", TBL, '"wartosc": 80,', '"wartosc": 79,', 0),
    ("table-penalty-below-1", TBL, '"wartosc": 1000,', '"wartosc": 1,', 0),
    ("table-penalty-above-1", TBL, '"wartosc": 100,', '"wartosc": 1,', 0),
    ("table-ladder-first-0.8", TBL, '"wartosc": 0.75,', '"wartosc": 0.8,', 0),
    ("table-quarter-step-3-to-3", TBL, '"od_liczby_typow": 3,\n        "min_cwiartek": 2,', '"od_liczby_typow": 3,\n        "min_cwiartek": 3,', 0),
    ("table-quarter-iters-1", TBL, '"wartosc": 10,\n      "zrodlo_web": "gra/src/map/clusters.ts:3265', '"wartosc": 1,\n      "zrodlo_web": "gra/src/map/clusters.ts:3265', 0),
    ("table-land-attempts-1", TBL, '"wartosc": 5,\n      "zrodlo_web": "gra/src/map/clusters.ts:2616', '"wartosc": 1,\n      "zrodlo_web": "gra/src/map/clusters.ts:2616', 0),
    ("table-guard-hard-0", TBL, '"wartosc": 4,\n      "zrodlo_web": "gra/src/map/clusters.ts:2693', '"wartosc": 0,\n      "zrodlo_web": "gra/src/map/clusters.ts:2693', 0),
    ("table-guard-body-0", TBL, '"wartosc": 6,\n      "zrodlo_web": "gra/src/map/clusters.ts:3055', '"wartosc": 0,\n      "zrodlo_web": "gra/src/map/clusters.ts:3055', 0),
    ("table-desperate-min-dist-3", TBL, '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:2926', '"wartosc": 3,\n      "zrodlo_web": "gra/src/map/clusters.ts:2926', 0),
    ("table-poisson-luz-1", TBL, '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:1836', '"wartosc": 1,\n      "zrodlo_web": "gra/src/map/clusters.ts:1836', 0),
    ("table-placement-add-3", TBL, '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:1509', '"wartosc": 3,\n      "zrodlo_web": "gra/src/map/clusters.ts:1509', 0),
]

# Mutacje ROWNOWAZNE (analiza, nie ma testu ktory moglby je wykryc) - uzasadnienie tez w P6-M11 §6a.
# Sa jawnie WYLACZONE z listy MUTATIONS i raportowane w podsumowaniu (EQUIVALENT), zeby nie znikaly po cichu:
EQUIVALENT = {
    "preferred-occupied-le": "`occupied < required && !empty.is_empty()` -> `<=`: gdy istnieja puste cwiartki, min(counts) == 0, wiec "
                             "druga galaz (`counts == minCount`) zwraca dokladnie ten sam zbior pustych cwiartek",
    "spawn-bias-ignores-prior": "`&& priorCapitals.length > 0` usuniete: przy pustej liscie stolic sortowanie z biasem cwiartek ma "
                                "minExist=999 u wszystkich, zerowe liczniki i filtr = wszystkie 4 cwiartki, a dalsze komparatory sa "
                                "identyczne jak w sortSpawnLandCandidates => ten sam porzadek",
    "spawn-sea-fallback-min": "`sea: seaDist ? ... : seaMin` -> `minSeaDist`: bez seaDist bramki morza nie zaleza od stopnia drabinki, "
                              "wiec drugi stopien nigdy nie znajdzie kandydatow, ktorych nie znalazl pierwszy (seaMin == minSeaDist)",
    "poisson-no-skip-picked": "`picked.some(p => p.q === c.q ...) continue` w luznym przebiegu: bez skipu tooClose(c, luzMin) i tak "
                              "odrzuca juz wybrany hex (odleglosc 0 < luzMin, a luzMin >= MIN_DIST_START_CITY_STATE > 0)",
    "capital-penalty-hi-no-band": "`bandMax || minSeaDist + 5` -> `minSeaDist + 5`: bandMax jest 0 albo minSeaDist + 5, wiec "
                                  "wyrazenie jest zawsze rowne minSeaDist + 5",
    "seed-mul-ki": "mnozniki ziaren per klaster (0x9e3779b1 / 0x85ebca6b / 0xc2b2ae35) zasilaja WYLACZNIE `mulberry32` lancucha hubow, "
                   "a lancuch tasuje kandydatow i sortuje je po (q, r) (porzadek calkowity) => wynik pakowania nie zalezy od ziarna",
    "capital-active-sea-min": "`activeMinSea = seaMin` -> `minSeaDist` (miekki stopien drabinki w pickCapitalHexInRegion): kandydaci na "
                              "stopniu miekkim maja sea w [stopien, poprzedni stopien) i dla CALKOWITYCH odleglosci od morza oraz "
                              "minSeaDist <= 31 kolejnosc kary pasa jest identyczna (sprawdzone wyczerpujaco dla minSeaDist 1..79: "
                              "rozne dopiero od 32); tabela ma max 14, mapy <= 80x60 maja seaDist < 32",
    "body-no-last-try": "galaz `lastTry` w enforceClusterBodySeparationOnKlastry jest NIEOSIAGALNA: po przycieciu obcych MP zostaje "
                        "tylko konflikt stolica-stolica `d < minCapitalSep`, a nowa stolica pochodzi z pickCapitalHexInRegion / "
                        "pickSpawnHexWithCapitalGates, ktore GWARANTUJA separacje >= minCapitalSep od wszystkich pozostalych stolic",
}

argv = [a for a in sys.argv[1:] if a != "--dry"]
dry = "--dry" in sys.argv[1:]
if argv:
    wanted = set(argv)
    MUTATIONS = [m for m in MUTATIONS if m[0] in wanted]

orig = {p: open(p, encoding="utf-8").read() for p in (LIB, TBL)}


def apply(text, old, new, nth):
    count = text.count(old)
    if nth == 0:
        assert count == 1, f"fragment wystepuje {count}x: {old!r}"
        return text.replace(old, new)
    assert count >= nth, f"fragment wystepuje {count}x < {nth}: {old!r}"
    parts = text.split(old)
    return old.join(parts[:nth]) + new + old.join(parts[nth:])


detected = 0
survived = []
try:
    for mid, path, old, new, nth in MUTATIONS:
        text = orig[path]
        mutated = apply(text, old, new, nth)
        assert mutated != text, f"{mid}: mutacja nic nie zmienia"
        if dry:
            print(f"OK-DRY {mid}")
            continue
        open(path, "w", encoding="utf-8").write(mutated)
        r = subprocess.run(["cargo", "test", "--no-fail-fast", *TESTS], capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
        compile_err = "error[" in out or "could not compile" in out
        open(path, "w", encoding="utf-8").write(text)
        if compile_err:
            print(f"BLAD-KOMPILACJI {mid}: " + " | ".join(l for l in out.splitlines() if "error" in l)[:300])
            survived.append(mid + " (blad kompilacji)")
        elif failed:
            detected += 1
            print(f"WYKRYTA   {mid}: {len(failed)} testow FAILED: {', '.join(failed[:4])}")
        else:
            survived.append(mid)
            print(f"PRZEZYLA  {mid}: wszystkie testy zielone")
        sys.stdout.flush()
finally:
    for p, t in orig.items():
        open(p, "w", encoding="utf-8").write(t)
same = all(open(p, encoding="utf-8").read() == t for p, t in orig.items())
print(f"ROWNOWAZNE (wylaczone z listy, patrz §6a): {sorted(EQUIVALENT)}")
if dry:
    print(f"DRY: {len(MUTATIONS)} mutacji, pliki przywrocone: {same}")
    sys.exit(0 if same else 1)
print(f"PODSUMOWANIE: wykryte {detected}/{len(MUTATIONS)}, przezyly: {survived}, pliki przywrocone: {same}")
sys.exit(0 if not survived and same else 1)
