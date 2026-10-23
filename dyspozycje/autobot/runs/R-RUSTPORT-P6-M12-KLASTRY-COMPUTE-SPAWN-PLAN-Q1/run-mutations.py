#!/usr/bin/env python3
"""Testy negatywne (mutacje) P6.M12: kazda mutacja zmienia JEDEN fragment kodu/tabeli silnika,
uruchamia testy p6_m12_* i oczekuje CZERWONYCH testow. Plik jest po kazdej mutacji przywracany
z kopii w pamieci (a na koncu weryfikowany bajt w bajt).

Dwa stopnie (czas): (1) test SZYBKI - grupy map <= 500 hexow (compute, spawn), tabele, integracja,
P6.1C; (2) tylko dla mutacji, ktore przezyly stopien 1 - PELNY zestaw p6_m12_* (rowniez duze mapy).
Mutacja "przezyla", gdy zielone sa oba stopnie.

Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR / CARGO_INCREMENTAL=0):
  python3 ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1/run-mutations.py [--dry] [id ...]
--dry tylko sprawdza, ze kazdy fragment wystepuje oczekiwana liczbe razy (bez budowania).
"""
import re
import signal
import subprocess
import sys
import time


def _term(signum, frame):  # SIGTERM -> ten sam tor co Ctrl-C: blok `finally` przywraca plik
    raise KeyboardInterrupt


signal.signal(signal.SIGTERM, _term)

LIB = "src/domain/mapgen/cluster_compute.rs"
TBL = "data/derived/mapgen-cluster-compute.json"
DERIVED = "src/data/derived.rs"

# Etapy (czas kompilacji dominuje: kazdy etap buduje tylko wskazane crate'y testowe):
#  S1 - compute (grupy <= 500 hexow, domyslne opts, pokrycie, dziennik); S2 - spawn / tabele / integracja
#  (grupy <= 500 hexow); S3 - WSZYSTKIE testy compute i spawn (duze mapy). Mutacja jest WYKRYTA przy pierwszym
#  czerwonym etapie. Mutacje planu spawnu (`plan-*`, `to-start-*`) zaczynaja od S2.
S1 = [
    "--test", "p6_m12_compute",
    "--", "--skip", "501_to_1100", "--skip", "1101_to_2500", "--skip", "2501_to_5000", "--skip", "over_5000",
]
S2 = [
    "--test", "p6_m12_spawn", "--test", "p6_m12_tables", "--test", "p6_m12_integration",
    "--", "--skip", "501_to_1100", "--skip", "1101_to_2500", "--skip", "over_2500",
]
S3 = [
    "--test", "p6_m12_compute", "--test", "p6_m12_spawn",
]

# (id, plik, stary fragment, nowy fragment, ktore wystapienie (1-based) albo 0 = wymagane jedyne)
MUTATIONS = [
    # --- stale i ziarna ---
    ("default-seed-43", LIB, "const DEFAULT_SEED: u32 = 42;", "const DEFAULT_SEED: u32 = 43;", 0),
    ("player-cap-xor-1", LIB, "const PLAYER_CAP_SEED_XOR: u32 = 0xca04_1a01;", "const PLAYER_CAP_SEED_XOR: u32 = 0xca04_1a03;", 0),
    ("player-cap-xor-retry", LIB, "const PLAYER_CAP_RETRY_SEED_XOR: u32 = 0xca04_1a02;", "const PLAYER_CAP_RETRY_SEED_XOR: u32 = 0xca04_1a04;", 0),
    ("ki-seed-mul", LIB, "const KI_SEED_MUL: u32 = 0x9e37_79b1;", "const KI_SEED_MUL: u32 = 0x9e37_79b3;", 0),
    # --- rozmiar, typy, dystanse ---
    ("empty-map-label-mala", LIB, "    let rozmiar_mapy = if empty_map {\n        MapSizeLabel::Super\n", "    let rozmiar_mapy = if empty_map {\n        MapSizeLabel::Mala\n", 0),
    ("n-typy-no-cap", LIB, "let n_typy = requested_typy.min(roster_cap);", "let n_typy = requested_typy;", 0),
    ("min-dyst-order-sep", LIB, "} else if min_capital_sep_early > 0 {", "} else if min_capital_sep_early > 1000 {", 0),
    ("min-dyst-center-sep", LIB, "        if center_placement_sep > 0 {\n", "        if center_placement_sep > 1000 {\n", 0),
    ("obcy-no-max", LIB, "let min_dyst_obcy_od_gracza = min_dist_foreign_from_player().max(min_dyst_klastrow);", "let min_dyst_obcy_od_gracza = min_dist_foreign_from_player();", 0),
    ("map-center-q", LIB, "q: (f64::from(min_q) + f64::from(max_q)) / 2.0,", "q: (f64::from(min_q) + f64::from(max_q)) / 3.0,", 0),
    ("map-center-r", LIB, "r: (f64::from(min_r) + f64::from(max_r)) / 2.0,", "r: (f64::from(min_r) + f64::from(max_r)) / 3.0,", 0),
    ("shuffle-removed", LIB, "shuffle_in_place(&mut shuffled_lad, &mut rng);", "let _ = &mut shuffled_lad;", 0),
    ("land-pool-with-mountains", LIB, "Terrain::Sea | Terrain::Mountains | Terrain::ShallowSea", "Terrain::Sea | Terrain::ShallowSea", 0),
    ("sea-field-step", LIB, "dist.insert(nk, d + 1.0);", "dist.insert(nk, d + 2.0);", 0),
    ("sea-field-shallow-not-water", LIB, "if is_water_terrain_local(t.terrain) {", "if t.terrain == Terrain::Sea {", 0),
    # --- srodki klastrow ---
    ("fill-centers-player-gate", LIB, "require_player_mass_gate: centrumy.is_empty(),", "require_player_mass_gate: false,", 0),
    ("fill-centers-sep-capital", LIB, "min_sep: min_dyst_klastrow_f,", "min_sep: min_capital_sep,", 1),
    ("topup-centers-sep-capital", LIB, "min_sep: min_dyst_klastrow_f,", "min_sep: min_capital_sep,", 2),
    ("player-in-epoch-true", LIB, "let player_in_epoch = roster_source.contains(&player_typ_klucz);", "let player_in_epoch = true;", 0),
    ("foreign-slice-plus-one", LIB, ".take(usize::try_from((n_typy - 1).max(0)).unwrap_or(0))", ".take(usize::try_from(n_typy.max(0)).unwrap_or(0))", 0),
    ("topup-centers-local-land", LIB, "require_local_land: (active_centrumy.len() as i64) < n_typy - 1,", "require_local_land: true,", 0),
    ("reassign-never", LIB, "if active_centrumy.len() > regiony.len() || active_centrumy.len() > active_klucze.len() {", "if false {", 0),
    # --- klaster gracza ---
    ("player-mass-gate-negated", LIB, "    if !passes_player_start_mass_gate(\n", "    if passes_player_start_mass_gate(\n", 0),
    ("player-sea-gate-negated", LIB, "        && !passes_min_sea_dist_gate(&sea_dist, st.capital_pos.q, st.capital_pos.r, min_sea_dist)", "        && passes_min_sea_dist_gate(&sea_dist, st.capital_pos.q, st.capital_pos.r, min_sea_dist)", 0),
    ("player-placed-push-removed", LIB, "    placed_capitals.push(st.capital_pos);\n", "", 0),
    ("player-repack-empty-negated", LIB, "if !player_repack.state_cities.is_empty() {", "if player_repack.state_cities.is_empty() {", 0),
    ("player-growth-reserve-0-initial", LIB, "growth_reserve: Some(cluster_growth_reserve()),", "growth_reserve: Some(0),", 1),
    ("player-growth-reserve-0-final", LIB, "growth_reserve: Some(cluster_growth_reserve()),", "growth_reserve: Some(0),", 2),
    ("player-pending-from-layout", LIB, "pending_state_slots: Some(player_state_slots),", "pending_state_slots: Some(Vec::new()),", 0),
    ("player-typ-fallback", LIB, "            .first()\n            .cloned()\n            .unwrap_or_else(|| player_klucz.clone()),", "            .get(1)\n            .cloned()\n            .unwrap_or_else(|| player_klucz.clone()),", 0),
    # --- klastry obce ---
    ("foreign-loop-start-2", LIB, "let mut ci = 1usize;", "let mut ci = 2usize;", 0),
    ("foreign-anchor-min-dist", LIB, "min_dist: min_dyst_obcy_od_gracza,", "min_dist: min_dyst_klastrow,", 1),
    ("foreign-existing-all", LIB, "&active_centrumy[..ci],", "&active_centrumy[..],", 0),
    ("foreign-retry-no-preferred", LIB, "preferred: Some(centrum),", "preferred: None,", 1),
    ("foreign-last-no-preferred", LIB, "preferred: Some(centrum),", "preferred: None,", 2),
    ("foreign-growth-no-or", LIB, "growth_slot: Some(foreign_repack.growth_slot.or(foreign_layout.growth_slot)),", "growth_slot: Some(foreign_repack.growth_slot),", 0),
    ("foreign-pending-empty", LIB, "            pending_state_slots: None,\n", "            pending_state_slots: Some(Vec::new()),\n", 0),
    ("foreign-typ-fallback", LIB, ".unwrap_or_else(|| format!(\"typ{ci}\")),", ".unwrap_or_else(|| format!(\"typ{}\", ci + 1)),", 0),
    ("foreign-seed-ci", LIB, "mix_seed(seed, ci),", "mix_seed(seed, ci + 1),", 0),
    ("foreign-cap-skip-sea-floor", LIB, "if soft_sea_floor > 0.0\n", "if soft_sea_floor >= 0.0\n", 0),
    ("foreign-cap-skip-sep", LIB, "if !passes_min_capital_separation_gate(foreign_cap, &placed_capitals, min_capital_sep) {", "if passes_min_capital_separation_gate(foreign_cap, &placed_capitals, min_capital_sep) {", 0),
    # --- dopelnienia ---
    ("topup-dedupe-removed", LIB, "if !unused_keys.contains(k) {", "if true {", 0),
    ("topup-player-dist-le", LIB, "let chosen = if dist(cap, player_capital_pos) < min_dyst_obcy_od_gracza {", "let chosen = if dist(cap, player_capital_pos) <= min_dyst_obcy_od_gracza {", 0),
    ("topup-alt-sep", LIB, "min_sep: min_capital_sep.max(min_dyst_obcy_od_gracza as f64),", "min_sep: min_capital_sep,", 0),
    ("topup-key-idx-stuck", LIB, "            key_idx += 1;\n            klastry.push(capital_only_cluster(klastry.len(), typ, chosen));", "            klastry.push(capital_only_cluster(klastry.len(), typ, chosen));", 0),
    ("topup-region-lt", LIB, ".filter(|h| dist(**h, chosen) <= top_up_radius)", ".filter(|h| dist(**h, chosen) < top_up_radius)", 0),
    ("topup-placed-push-removed", LIB, "            placed_capitals.push(chosen);\n", "", 0),
    ("repack-final-and", LIB, "if !repack_final.state_cities.is_empty() || repack_final.growth_slot.is_some() {", "if !repack_final.state_cities.is_empty() && repack_final.growth_slot.is_some() {", 0),
    ("repack-final-region", LIB, "let player_region_final: &[HexCoord] = cluster_regions.first().map_or(&[], Vec::as_slice);", "let player_region_final: &[HexCoord] = &[];", 0),
    # --- naprawy (wywolania) ---
    ("enforce-hard-removed", LIB, "    enforce_hard_capital_separation_on_klastry(\n        &mut klastry,", "    let _ = (\n        &mut klastry,", 0),
    ("enforce-body-removed", LIB, "    enforce_cluster_body_separation_on_klastry(\n        &mut klastry,", "    let _ = (\n        &mut klastry,", 0),
    ("enforce-quarter-removed", LIB, "    enforce_quarter_spread_on_klastry(\n        &mut klastry,", "    let _ = (\n        &mut klastry,", 0),
    ("repack-all-removed", LIB, "    repack_all_sparse_cluster_state_cities(\n        &mut klastry,", "    let _ = (\n        &mut klastry,", 0),
    ("fillup-caps-empty", LIB, "let mut caps_now: Vec<HexCoord> = klastry.iter().filter_map(cluster_capital_hex).collect();", "let mut caps_now: Vec<HexCoord> = Vec::new();", 0),
    ("fillup-unused-all", LIB, "            .filter(|k| !used_typs.contains(*k))\n            .collect();", "            .collect();", 0),
    # --- wynik i dziennik ---
    ("diag-le", LIB, "(k.miasta.len() as i64) < state_city_count + 1 && *ki >= regiony.len()", "(k.miasta.len() as i64) <= state_city_count + 1 && *ki >= regiony.len()", 0),
    ("diag-region-gt", LIB, "(k.miasta.len() as i64) < state_city_count + 1 && *ki >= regiony.len()", "(k.miasta.len() as i64) < state_city_count + 1 && *ki > regiony.len()", 0),
    ("diag-missing-always-ok", LIB, "        None => Ok(placement),", "        None => Ok(placement),\n        #[allow(unreachable_patterns)]\n        _ if false => Ok(placement),", 0),
    ("requested-typy-min", LIB, "        requested_typy: n_typy,\n        min_dystans_miasta_panstwa: min_dyst_miasta_panstwa,\n        max_dystans_miasta_panstwa: cluster_city_state_max_hex(),\n        min_dystans_obcy_od_gracza: min_dyst_obcy_od_gracza,\n        player_typ_index: 0,\n        klastry,", "        requested_typy: requested_typy,\n        min_dystans_miasta_panstwa: min_dyst_miasta_panstwa,\n        max_dystans_miasta_panstwa: cluster_city_state_max_hex(),\n        min_dystans_obcy_od_gracza: min_dyst_obcy_od_gracza,\n        player_typ_index: 0,\n        klastry,", 0),
    # --- plan spawnu ---
    ("plan-fallback-hex", LIB, "let fallback_hex = HexCoord::new(0, 0);", "let fallback_hex = HexCoord::new(1, 0);", 0),
    ("plan-xor-no-preferred", LIB, "player_pick(PLAYER_CAP_SEED_XOR, Some(cap_pos))", "player_pick(PLAYER_CAP_SEED_XOR, None)", 0),
    ("plan-foreign-capitals-all", LIB, "        .filter(|k| k.typ_index != placement.player_typ_index)\n        .filter_map(cluster_capital_hex)", "        .filter_map(cluster_capital_hex)", 0),
    ("plan-local-land-removed", LIB, "if !passes_local_land_gate(map, cap.q, cap.r, None, None) {", "if false {", 0),
    ("plan-sep-skip-removed", LIB, "if !passes_min_capital_separation_gate(cap, &placed_capitals, min_capital_sep) {", "if false {", 0),
    ("plan-owner-start-0", LIB, "let mut next_owner_id: u64 = 1;", "let mut next_owner_id: u64 = 0;", 0),
    ("plan-cluster-cap-flag", LIB, "is_cluster_capital: Some(m.is_capital),", "is_cluster_capital: Some(true),", 0),
    ("plan-reserve-extra", LIB, "for _ in 0..pending_same_type_rivals.max(0) {", "for _ in 0..pending_same_type_rivals.max(0) + 1 {", 0),
    ("plan-hard-gate-le", LIB, "if !passes_min_capital_separation_gate(slot.hex, &hard_placed_capitals, min_capital_sep)\n            {", "if passes_min_capital_separation_gate(slot.hex, &hard_placed_capitals, min_capital_sep)\n            {", 0),
    ("plan-rival-index-0", LIB, "rival_index_by_civ.get(&slot.typ).copied().unwrap_or(0) + 1;", "rival_index_by_civ.get(&slot.typ).copied().unwrap_or(0);", 0),
    ("plan-capital-name-swap", LIB, "let name = if slot.is_cluster_capital == Some(true) {", "let name = if slot.is_cluster_capital == Some(false) {", 0),
    ("plan-used-names-not-updated", LIB, "        used.insert(name.clone());\n        named_accepted_slots", "        named_accepted_slots", 0),
    ("plan-pending-hexes-empty", LIB, "    let pending_same_type_rival_hexes: Vec<HexCoord> = player_cluster\n        .pending_state_slots\n        .as_ref()\n        .cloned()\n        .unwrap_or_default();", "    let pending_same_type_rival_hexes: Vec<HexCoord> = Vec::new();", 0),
    ("plan-dropped-typ-not-skipped", LIB, "        if dropped_foreign_typs.contains(&slot.typ) {\n            continue;\n        }\n", "", 0),
    ("plan-player-name-used", LIB, "        player_start_city_name: player_start_city_name(\n            &civ_defs,\n            player_typ,\n            city_names_pools,\n            None,\n        ),\n        slots: named_accepted_slots,", "        player_start_city_name: String::new(),\n        slots: named_accepted_slots,", 0),
    ("to-start-plan-swap-owners", LIB, "            cluster_capital_owner_ids: self.cluster_capital_owner_ids.clone(),\n            pending_same_type_rival_owner_ids: self.pending_same_type_rival_owner_ids.clone(),", "            cluster_capital_owner_ids: self.pending_same_type_rival_owner_ids.clone(),\n            pending_same_type_rival_owner_ids: self.cluster_capital_owner_ids.clone(),", 0),
    ("to-start-plan-pending-count", LIB, "pending_same_type_rivals: u32::try_from(self.pending_same_type_rivals.max(0))", "pending_same_type_rivals: u32::try_from(self.pending_same_type_rivals.max(1))", 0),
    # --- tabela (edytowalne wartosci balansu): zmiana liczby MUSI lamac testy parytetu ---
    ("table-default-rivals-8", TBL, '"wartosc": 9,', '"wartosc": 8,', 0),
    ("table-center-dist-min-5", TBL, '"wartosc": 4,\n      "zrodlo_web": "gra/src/map/clusters.ts:3433', '"wartosc": 5,\n      "zrodlo_web": "gra/src/map/clusters.ts:3433', 0),
    ("table-center-dist-div-10", TBL, '"wartosc": 15,', '"wartosc": 10,', 0),
    ("table-margin-min-3", TBL, '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:3463', '"wartosc": 3,\n      "zrodlo_web": "gra/src/map/clusters.ts:3463', 0),
    ("table-margin-div-2", TBL, '"wartosc": 3,\n      "zrodlo_web": "gra/src/map/clusters.ts:3463', '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:3463', 0),
    ("table-topup-min-9", TBL, '"wartosc": 8,', '"wartosc": 9,', 0),
    ("table-topup-div-3", TBL, '"wartosc": 2,\n      "zrodlo_web": "gra/src/map/clusters.ts:4054', '"wartosc": 3,\n      "zrodlo_web": "gra/src/map/clusters.ts:4054', 0),
]

# Mutacje, ktorych przezycie jest OCZEKIWANE i uzasadnione (wynik raportowany jako "rownowazna/nieosiagalna").
EXPECTED_SURVIVORS = {
    "ki-seed-mul": "mnoznik ziarna per klaster zasila wylacznie lancuch hubow, ktory tasuje kandydatow i sortuje po (q, r) "
                   "(porzadek calkowity) => wynik pakowania nie zalezy od ziarna (jak w M11: seed-mul-ki)",
    "player-cap-xor-1": "ziarno wyboru hexu gracza wplywa na wynik tylko gdy `preferred` jest niewazny (pierwsza proba zwraca preferred) - "
                        "w nagraniach `hunt-rare-branches.mjs` nie znalazl takiego wejscia (patrz doc §6)",
    "player-cap-xor-retry": "druga proba (bez preferred) jest nieosiagalna w nagraniach (patrz doc §6)",
    "diag-missing-always-ok": "mutant rownowazny: dodane ramie `_ if false` jest nieosiagalne (brak zmiany zachowania)",
    "foreign-seed-ci": "j.w. (ziarno pakowania obcego klastra nie wplywa na wynik)",
    "player-sea-gate-negated": "galaz `fixed` (clusters.ts:3739-3781) NIEOSIAGALNA w nagraniach: pokrycie V8 = 0 (patrz doc §6)",
    "foreign-cap-skip-sea-floor": "`softSeaFloor` = ostatni stopien drabinki = 0, wiec `softSeaFloor > 0` jest zawsze falszywe (kod martwy w webie)",
    "foreign-cap-skip-sep": "separacja stolicy obcej jest gwarantowana przez `buildClusterCitiesWithLandGate` / `pickSpawnHex...` (kod martwy)",
    "plan-hard-gate-le": "separacja stolic w planie spawnu jest juz gwarantowana przez computeClusters (galaz HARD apply niepokryta w nagraniach)",
    "plan-sep-skip-removed": "j.w.",
    "plan-foreign-capitals-all": "gracz jest pomijany takze przez `pickSpawnHex...` (stolica gracza == preferred), wiec dolozenie jej do `planned` nie zmienia wyniku",
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
        if count != 1:
            return None, f"fragment wystepuje {count} razy (oczekiwano 1)"
        return text.replace(old, new), None
    if count < nth:
        return None, f"fragment wystepuje {count} razy, a wymagane wystapienie {nth}"
    idx = -1
    for _ in range(nth):
        idx = text.index(old, idx + 1)
    return text[:idx] + new + text[idx + len(old):], None


def run(args):
    t0 = time.time()
    p = subprocess.run(["cargo", "test", *args], capture_output=True, text=True, timeout=1800)
    out = p.stdout + p.stderr
    failed = re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)
    compile_err = "could not compile" in out or "error[E" in out or "error: " in out and "test result" not in out
    passed = re.findall(r"test result: ok\. (\d+) passed", out)
    return p.returncode, failed, compile_err, sum(int(x) for x in passed), time.time() - t0, out


results = []
for mid, path, old, new, nth in MUTATIONS:
    mutated, err = apply(orig[path], old, new, nth)
    if err:
        print(f"[{mid}] BLAD DEFINICJI: {err}")
        results.append((mid, "BLAD-DEFINICJI"))
        continue
    if dry:
        print(f"[{mid}] OK (fragment znaleziony)")
        continue
    try:
        open(path, "w", encoding="utf-8").write(mutated)
        order = [("S2", S2), ("S1", S1), ("S3", S3)] if mid.startswith(("plan-", "to-start-")) else [("S1", S1), ("S2", S2), ("S3", S3)]
        result = None
        total = 0.0
        for name, args in order:
            rc, failed, cerr, npass, dt, out = run(args)
            total += dt
            if rc != 0 and not failed:
                result = ("BLAD-KOMPILACJI", out[-1500:])
                break
            if rc != 0:
                result = ("WYKRYTA", f"etap {name}, {total:.0f}s: {', '.join(failed[:4])}{' ...' if len(failed) > 4 else ''}")
                break
        if result is None:
            tag = "PRZEZYLA-OCZEKIWANA" if mid in EXPECTED_SURVIVORS else "PRZEZYLA"
            result = (tag, f"wszystkie 3 etapy zielone ({total:.0f}s)")
        results.append((mid, result[0]))
        print(f"[{mid}] {result[0]}: {result[1]}")
    finally:
        open(path, "w", encoding="utf-8").write(orig[path])

# koniec: pliki przywrocone?
ok = all(open(p, encoding="utf-8").read() == orig[p] for p in orig)
from collections import Counter

summary = Counter(r[1] for r in results)
print("PODSUMOWANIE:", dict(summary))
for mid, tag in results:
    if tag in ("PRZEZYLA", "BLAD-DEFINICJI", "BLAD-KOMPILACJI"):
        print("  UWAGA:", mid, tag)
for mid, why in EXPECTED_SURVIVORS.items():
    if any(r[0] == mid for r in results):
        print("  OCZEKIWANE PRZEZYCIE:", mid, "-", why)
print("pliki przywrocone:", ok)
sys.exit(0 if ok else 1)
