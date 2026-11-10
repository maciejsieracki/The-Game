#!/usr/bin/env python3
"""Testy negatywne (mutacje) P6.M05A: kazda mutacja zmienia JEDEN fragment kodu/tabeli silnika,
uruchamia testy p6_m05a_* i oczekuje CZERWONYCH testow. Po KAZDEJ mutacji plik jest przywracany
przez `git checkout -- <plik>` i sprawdzane sa: czystosc drzewa (`git status --porcelain
--untracked-files=no` puste) oraz SHA-256 bajtow plikow z dysku == skrot poczatkowy.

Wymaga: baza z zacommitowanym kodem silnika (drzewo czyste). Uzycie (z rust-port/engine, ze
ustawionymi CARGO_TARGET_DIR / CARGO_INCREMENTAL=0 / CARGO_PROFILE_DEV_DEBUG=0):
  python3 <run>/mut-runner-m05a.py [--dry] [--equiv] [--rr] [--skip id1,id2] [--only id1,id2] [--from N --to M]
--dry   : sprawdza tylko, czy kazdy fragment pasuje (bez kompilacji);
--equiv : uruchamia zamiast tego liste mutacji ROWNOWAZNYCH (oczekiwane: PRZEZYLY - dowod empiryczny);
--rr    : kolejnosc round-robin po grupach (binarka, filtr); --skip: pomija wskazane id.
Kazda mutacja ma CELOWANY test (binarka + filtr). Gdy test celowany jest zielony, uruchamiane sa
wszystkie 4 binarki p6_m05a_* (mutacja liczy sie jako wykryta, ale zapisane jest "przez inny test").
"""
import hashlib
import re
import signal
import subprocess
import sys
import time

LIB = "src/domain/mapgen/relief.rs"
TBL = "data/derived/mapgen-relief-a.json"
ALL = ["p6_m05a_cover", "p6_m05a_masses", "p6_m05a_relief", "p6_m05a_tables"]
MS, RL, CV, TB = "p6_m05a_masses", "p6_m05a_relief", "p6_m05a_cover", "p6_m05a_tables"

# (id, plik, stary fragment, nowy fragment, ktore wystapienie (1-based) albo 0 = wymagane jedyne, binarka, filtr)
MUTATIONS = [
    # --- masy, centroid, kwadrat centrum, partycje ---
    ("group-bfs-queue", LIB, "while let Some(k) = stack.pop() {", "while let Some(k) = (!stack.is_empty()).then(|| stack.remove(0)) {", 0, MS, "group_land_mass_keys"),
    ("group-neighbor-water-ignored", LIB, "if is_water_terrain_local(nh.terrain) {", "if false && is_water_terrain_local(nh.terrain) {", 0, MS, "group_land_mass_keys"),
    ("group-start-water-ignored", LIB, "if is_water_terrain_local(hex.terrain) {\n            continue;\n        }\n        if visited.contains(key) {", "if visited.contains(key) {", 0, MS, "group_land_mass_keys"),
    ("river-land-polar-removed", LIB, "| Terrain::Desert\n            | Terrain::Polar\n", "| Terrain::Desert\n", 0, MS, "centroid_center_square"),
    ("centroid-count-doubled", LIB, "count += 1.0;", "count += 2.0;", 0, MS, "centroid_center_square"),
    ("center-span-le-to-lt", LIB, "span_q <= size && span_r <= size", "span_q < size && span_r < size", 0, MS, "centroid_center_square"),
    ("center-round-to-floor", LIB, "let cq = js_round(centroid.0);", "let cq = centroid.0.floor();", 0, MS, "centroid_center_square"),
    ("center-round-r-to-floor", LIB, "let cr = js_round(centroid.1);", "let cr = centroid.1.floor();", 0, MS, "centroid_center_square"),
    ("center-half-floor-to-ceil", LIB, "(size / 2.0).floor()", "(size / 2.0).ceil()", 0, MS, "centroid_center_square"),
    ("center-qmax-le-to-lt", LIB, "&& q <= bbox.q_max", "&& q < bbox.q_max", 0, MS, "centroid_center_square"),
    ("center-rmin-ge-to-gt", LIB, "&& r >= bbox.r_min", "&& r > bbox.r_min", 0, MS, "centroid_center_square"),
    ("center-fallback-disabled", LIB, "    if keys.is_empty() {\n        for k in &land_keys {", "    if false {\n        for k in &land_keys {", 0, MS, "centroid_center_square"),
    ("dist-axial-divisor", LIB, "(dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0", "(dq.abs() + dr.abs() + (dq + dr).abs()) / 3.0", 0, MS, "centroid_center_square"),
    ("partition-upper-clamp-removed", LIB, "js_min(n_continents - 1.0, js_max(0.0, raw))", "js_max(0.0, raw)", 0, MS, "land_partition"),
    ("partition-islands-to-pangea", LIB, "(typ == WorldType::Continents || typ == WorldType::Islands)", "(typ == WorldType::Continents || typ == WorldType::Pangea)", 0, MS, "land_partition"),
    ("partition-keeps-empty-zones", LIB, ".filter(|z| !z.is_empty())", ".filter(|_| true)", 0, MS, "land_partition"),
    ("partition-missing-entry-default", LIB, "continent_of.get(key).copied().unwrap_or(0.0)", "continent_of.get(key).copied().unwrap_or(1.0)", 0, MS, "land_partition"),
    ("partition-needs-positive-n", LIB, "&& n_continents > 0.0 {", "&& n_continents >= 0.0 {", 0, MS, "land_partition"),
    ("cells-floor-to-trunc", LIB, "js_num_str((q / cell_size).floor())", "js_num_str((q / cell_size).trunc())", 0, MS, "land_hexes_by_coverage_cell"),
    ("cells-r-floor-to-trunc", LIB, "js_num_str((r / cell_size).floor())", "js_num_str((r / cell_size).trunc())", 0, MS, "land_hexes_by_coverage_cell"),
    ("forest-eligible-desert", LIB, "        && tb != Terrain::Desert\n", "", 0, TB, "forest_eligible"),
    # --- tabele, capy, minima ---
    ("bonus-cap-mountain-ceil-to-floor", LIB, "js_max(0.0, (land_count * frac).ceil())", "js_max(0.0, (land_count * frac).floor())", 1, TB, "caps_match_web"),
    ("bonus-cap-highland-ceil-to-floor", LIB, "js_max(0.0, (land_count * frac).ceil())", "js_max(0.0, (land_count * frac).floor())", 2, TB, "caps_match_web"),
    ("spread-cap-mountain-max-to-min", LIB, "js_max(min_mountains_iron_cell(tier), (land_count * frac).ceil())", "js_min(min_mountains_iron_cell(tier), (land_count * frac).ceil())", 0, TB, "caps_match_web"),
    ("spread-cap-highland-ceil-to-floor", LIB, "js_max(min_highlands_copper_cell(tier), (land_count * frac).ceil())", "js_max(min_highlands_copper_cell(tier), (land_count * frac).floor())", 0, TB, "caps_match_web"),
    ("spread-frac-mountain-uses-highland", LIB, "let frac = map_gen_relief_overflow_cap_frac(tier).0;", "let frac = map_gen_relief_overflow_cap_frac(tier).1;", 0, TB, "caps_match_web"),
    ("overflow-resolve-mountain-ge", LIB, "mountain.filter(|v| *v > 0.0)", "mountain.filter(|v| *v >= 0.0)", 0, TB, "damaged_json"),
    ("overflow-resolve-highland-nan-only", LIB, "highland.filter(|v| *v > 0.0)", "highland.filter(|v| !v.is_nan())", 0, TB, "damaged_json"),
    ("min-land-floor-to-ceil", LIB, "(cell_size * p.ulamek_rozmiaru_komorki.wartosc).floor(),", "(cell_size * p.ulamek_rozmiaru_komorki.wartosc).ceil(),", 0, TB, "min_land_hexes"),
    ("min-land-max-to-min", LIB, "js_max(\n        p.dolna_granica.wartosc,", "js_min(\n        p.dolna_granica.wartosc,", 0, TB, "min_land_hexes"),
    ("deprecated-min-mountains-tier", LIB, "min_mountains_iron_cell(DensityTier::Medium)\n}", "min_mountains_iron_cell(DensityTier::Low)\n}", 0, TB, "consts_and_tier_tables"),
    ("tier-value-low-reads-medium", LIB, "DensityTier::Low => t.low.wartosc,", "DensityTier::Low => t.medium.wartosc,", 0, TB, "consts_and_tier_tables"),
    ("forest-cap-reads-share", LIB, "mapgen_relief_a().las.sufit_nakladki_ulamek.wartosc", "mapgen_relief_a().las.udzial_suchego_ladu.medium.wartosc", 0, TB, "consts_and_tier_tables"),
    ("center-size-plus-one", LIB, "mapgen_relief_a().kwadrat_centrum.rozmiar_boku.wartosc", "mapgen_relief_a().kwadrat_centrum.rozmiar_boku.wartosc + 1.0", 0, TB, "consts_and_tier_tables"),
    ("fair-play-size-uses-forest", LIB, "pub fn fair_play_resource_cell_size(tier: DensityTier) -> f64 {\n    iron_coverage_cell_size(tier)", "pub fn fair_play_resource_cell_size(tier: DensityTier) -> f64 {\n    forest_coverage_cell_size(tier)", 0, TB, "consts_and_tier_tables"),
    ("river-sources-plus-one", LIB, "        .min_zrodel_rzek_na_komorke_wody\n        .wartosc", "        .min_zrodel_rzek_na_komorke_wody\n        .wartosc\n        + 1.0", 0, TB, "consts_and_tier_tables"),
    # --- liczniki i pokrycie ---
    ("iron-package-ge-to-gt", LIB, "count_mountains_in_cell(cell_land, hexes) >= min_mountains_iron_cell(tier)", "count_mountains_in_cell(cell_land, hexes) > min_mountains_iron_cell(tier)", 0, MS, "cell_counters"),
    ("copper-package-ge-to-gt", LIB, "count_highlands_in_cell(cell_land, hexes) >= min_highlands_copper_cell(tier)", "count_highlands_in_cell(cell_land, hexes) > min_highlands_copper_cell(tier)", 0, MS, "cell_counters"),
    ("has-mountain-always", LIB, "count_mountains_in_cell(cell_land, hexes) > 0.0", "count_mountains_in_cell(cell_land, hexes) >= 0.0", 0, MS, "cell_counters"),
    ("relief-package-and-to-or", LIB, "cell_has_mountain(cell_land, hexes) && cell_has_highland(cell_land, hexes)", "cell_has_mountain(cell_land, hexes) || cell_has_highland(cell_land, hexes)", 0, MS, "cell_counters"),
    ("eligible-relief-counts-water", LIB, "is_some_and(|h| !is_water_terrain_local(h.terrain)))\n        .count() as f64", "is_some_and(|h| is_water_terrain_local(h.terrain)))\n        .count() as f64", 0, MS, "cell_counters"),
    ("host-min-land-lt-to-le", LIB, "if eligible_deposit_land_count(land, hexes) < min_land {", "if eligible_deposit_land_count(land, hexes) <= min_land {", 0, MS, "cell_counters"),
    ("host-river-negated", LIB, ".any(|&(q, r)| hex_at(hexes, q, r).is_some_and(|h| h.river_present))", ".any(|&(q, r)| hex_at(hexes, q, r).is_some_and(|h| !h.river_present))", 0, MS, "cell_counters"),
    ("eligible-forest-uses-water-test", LIB, "is_some_and(|h| is_forest_eligible_terrain(h.terrain))", "is_some_and(|h| !is_water_terrain_local(h.terrain))", 0, MS, "cell_counters"),
    ("coverage-empty-ratio-zero", LIB, "    } else {\n        1.0\n    }\n}\n\n/// Web `ironGridCoverageRatio", "    } else {\n        0.0\n    }\n}\n\n/// Web `ironGridCoverageRatio", 0, MS, "grid_coverage"),
    ("coverage-min-land-lt-to-le", LIB, "if eligible_relief_land_count(&land, hexes) < min_land {\n            continue;\n        }\n        need += 1.0;", "if eligible_relief_land_count(&land, hexes) <= min_land {\n            continue;\n        }\n        need += 1.0;", 0, MS, "grid_coverage"),
    ("relief-ratio-sum-not-averaged", LIB, "(iron + copper) / 2.0", "iron + copper", 0, MS, "grid_coverage"),
    ("relief-ratio-default-tier", LIB, "iron_grid_coverage_ratio(mass_land_keys, hexes, iron_cell_size, DensityTier::Medium)", "iron_grid_coverage_ratio(mass_land_keys, hexes, iron_cell_size, DensityTier::High)", 0, MS, "grid_coverage"),
    ("relief-ratio-copper-size-unrounded", LIB, "js_round(\n            iron_cell_size", "f64::floor(\n            iron_cell_size", 0, MS, "grid_coverage"),
    ("assert-coverage-lt", LIB, ") >= mapgen_relief_a().pokrycie.prog_pokrycia_siatki.wartosc", ") < mapgen_relief_a().pokrycie.prog_pokrycia_siatki.wartosc", 0, MS, "grid_coverage"),
    # --- rozmieszczanie ---
    ("apply-sort-ascending", LIB, "js_array_sort_by(&mut candidates, |a, b| b.1 - a.1);", "js_array_sort_by(&mut candidates, |a, b| a.1 - b.1);", 0, RL, "apply_relief_to_land_keys"),
    ("apply-iron-skips-hills", LIB, "Terrain::Mountains, width, height)", "Terrain::Hills, width, height)", 0, RL, "apply_relief_to_land_keys"),
    ("apply-copper-skips-mountains", LIB, "Terrain::Hills, width, height)", "Terrain::Mountains, width, height)", 0, RL, "apply_relief_to_land_keys"),
    ("apply-iron-bonus-floor", LIB, "js_round(candidates.len() as f64 * fr.mountain)", "(candidates.len() as f64 * fr.mountain).floor()", 0, RL, "apply_relief_to_land_keys"),
    ("apply-copper-bonus-floor", LIB, "js_round(candidates.len() as f64 * fr.highland)", "(candidates.len() as f64 * fr.highland).floor()", 0, RL, "apply_relief_to_land_keys"),
    ("apply-iron-min-to-max", LIB, "let n_mtn = js_min(", "let n_mtn = js_max(", 0, RL, "apply_relief_to_land_keys"),
    ("apply-copper-min-to-max", LIB, "let n_hi = js_min(", "let n_hi = js_max(", 0, RL, "apply_relief_to_land_keys"),
    ("apply-iron-keeps-overlay", LIB, "h.terrain = Terrain::Mountains;\n                h.overlay = Nakladka::Brak;", "h.terrain = Terrain::Mountains;", 0, RL, "apply_relief_to_land_keys"),
    ("apply-copper-keeps-overlay", LIB, "h.terrain = Terrain::Hills;\n                h.overlay = Nakladka::Brak;", "h.terrain = Terrain::Hills;", 0, RL, "apply_relief_to_land_keys"),
    ("apply-iron-min-land-lt-to-le", LIB, "if (land.len() as f64) < min_land {\n            continue;\n        }\n        let candidates =\n            relief_candidates", "if (land.len() as f64) <= min_land {\n            continue;\n        }\n        let candidates =\n            relief_candidates", 0, RL, "apply_relief_to_land_keys"),
    ("apply-copper-min-land-lt-to-le", LIB, "if (land.len() as f64) < min_land {\n            continue;\n        }\n        let candidates = relief_candidates(&land, hexes, scratch, Terrain::Hills", "if (land.len() as f64) <= min_land {\n            continue;\n        }\n        let candidates = relief_candidates(&land, hexes, scratch, Terrain::Hills", 0, RL, "apply_relief_to_land_keys"),
    ("apply-mass-set-not-deduped", LIB, "let mass_set = unique_in_order(keys);\n    let min_dist = mapgen_relief_a().rozrzut_reliefu.min_odleglosc_gor.wartosc;", "let mass_set = keys.to_vec();\n    let min_dist = mapgen_relief_a().rozrzut_reliefu.min_odleglosc_gor.wartosc;", 0, RL, "apply_relief_to_land_keys"),
    ("rank-ignores-candidate-filter", LIB, "let (q, r) = parse_hex_key(key);\n                is_relief_candidate_hex(hex, q, r, width, height)", "let _ = (parse_hex_key(key), hex);\n                true", 0, RL, "apply_relief_by_noise_rank"),
    ("rank-ignores-world-type", LIB, "land_partition_keys_for_distribution(hexes, typ, continent_of, n_continents);", "land_partition_keys_for_distribution(hexes, WorldType::Pangea, continent_of, n_continents);", 0, RL, "apply_relief_by_noise_rank"),
    ("pick-spread-dist-ge-to-gt", LIB, "hex_distance_axial_f64(q, r, pq, pr) >= min_dist", "hex_distance_axial_f64(q, r, pq, pr) > min_dist", 0, MS, "pick_spread"),
    ("pick-spread-second-pass-off", LIB, "if !picked.contains(&c.0) {", "if false {", 0, MS, "pick_spread"),
    ("pick-spread-axial-drops-s", LIB, "js_max(js_max(dq, dr), ds)", "js_max(dq, dr)", 0, MS, "pick_spread"),
    ("pick-spread-count-ge-to-gt", LIB, "if picked.len() as f64 >= count {\n            break;\n        }\n        let (q, r)", "if picked.len() as f64 > count {\n            break;\n        }\n        let (q, r)", 0, MS, "pick_spread"),
    ("pick-spread-axial-ds-sign", LIB, "let ds = ((-aq - ar) - (-bq - br)).abs();", "let ds = ((aq - ar) - (bq - br)).abs();", 0, MS, "pick_spread"),
    # --- wymuszanie ---
    ("force-no-rand-call", LIB, "score += rand() * p.waga_losowa.wartosc;", "score += 0.0 * p.waga_losowa.wartosc;", 0, CV, "pick_relief_force_hex"),
    ("force-rank-ascending", LIB, "js_array_sort_by(&mut ranked, |a, b| b.2 - a.2);\n    ranked.first()", "js_array_sort_by(&mut ranked, |a, b| a.2 - b.2);\n    ranked.first()", 0, CV, "pick_relief_force_hex"),
    ("force-highland-mult-dropped", LIB, "score *= p.mnoznik_wyniku_wzgorza.wartosc;", "score *= 1.0;", 0, CV, "pick_relief_force_hex"),
    ("force-border-dist-unclamped", LIB, "p.limit_odleglosci_od_brzegu.wartosc,\n            hex_border_distance(q as f64, r as f64, width, height),", "f64::INFINITY,\n            hex_border_distance(q as f64, r as f64, width, height),", 0, CV, "pick_relief_force_hex"),
    ("force-avoid-ignored", LIB, "            if avoid.contains(&k) {\n                return false;\n            }", "            if false && avoid.contains(&k) {\n                return false;\n            }", 0, CV, "pick_relief_force_hex"),
    ("force-protect-highland-ignored", LIB, "if want == ReliefWant::Mountain && protect_highland && hex.terrain == Terrain::Hills {", "if want == ReliefWant::Mountain && false && hex.terrain == Terrain::Hills {", 0, CV, "pick_relief_force_hex"),
    ("force-protect-mountain-ignored", LIB, "if want == ReliefWant::Highland && protect_mountain && hex.terrain == Terrain::Mountains\n            {", "if want == ReliefWant::Highland && false && hex.terrain == Terrain::Mountains\n            {", 0, CV, "pick_relief_force_hex"),
    ("force-water-allowed", LIB, "            if is_water_terrain_local(hex.terrain) {\n                return false;\n            }\n            if want == ReliefWant::Mountain && hex.terrain == Terrain::Mountains {", "            if want == ReliefWant::Mountain && hex.terrain == Terrain::Mountains {", 0, CV, "pick_relief_force_hex"),
    ("force-protect-highland-le-to-lt", LIB, "count_highlands_in_cell(land, hexes) <= min_highlands_copper_cell(tier)", "count_highlands_in_cell(land, hexes) < min_highlands_copper_cell(tier)", 0, CV, "force_relief_type_in_cell"),
    ("force-protect-mountain-le-to-lt", LIB, "count_mountains_in_cell(land, hexes) <= min_mountains_iron_cell(tier)", "count_mountains_in_cell(land, hexes) < min_mountains_iron_cell(tier)", 0, CV, "force_relief_type_in_cell"),
    ("force-clears-deposit-removed", LIB, "forced.has_deposit = false;", "forced.has_deposit = forced.has_deposit;", 0, CV, "force_relief_type_in_cell"),
    ("force-clears-overlay-removed", LIB, "forced.overlay = Nakladka::Brak;", "forced.overlay = forced.overlay;", 0, CV, "force_relief_type_in_cell"),
    ("force-loop-ge-to-gt", LIB, "        if count(hexes) >= min_count {\n            break;\n        }\n        let guard_now", "        if count(hexes) > min_count {\n            break;\n        }\n        let guard_now", 0, CV, "force_relief_type_in_cell"),
    ("force-second-pick-keeps-protect", LIB, "land, hexes, scratch, width, height, want, &placed, &mut *rand, false, false,", "land, hexes, scratch, width, height, want, &placed, &mut *rand, protect_highland, protect_mountain,", 0, CV, "force_relief_type_in_cell"),
    ("force-wrapper-iron-uses-highland", LIB, "        ReliefWant::Mountain,\n        min_mountains_iron_cell(tier),\n        tier,", "        ReliefWant::Highland,\n        min_mountains_iron_cell(tier),\n        tier,", 0, CV, "force_relief_type_in_cell"),
    ("force-deprecated-short-circuits", LIB, "    a || b\n}", "    a\n}", 0, CV, "force_relief_type_in_cell"),
    ("force-deprecated-uses-low-tier", LIB, "        &mut *rand,\n        DensityTier::Medium,\n    );\n    let b =", "        &mut *rand,\n        DensityTier::Low,\n    );\n    let b =", 0, CV, "force_relief_type_in_cell"),
    # --- sufit przepelnienia ---
    ("deposit-protection-off", LIB, "hex.is_some_and(|h| h.has_deposit)", "hex.is_some_and(|_| false)", 0, CV, "cap_overflow_in_cell"),
    ("cap-protected-not-skipped", LIB, "        if cand.3 {\n            i += 1;\n            continue;\n        }", "        if false && cand.3 {\n            i += 1;\n            continue;\n        }", 0, CV, "cap_overflow_in_cell"),
    ("cap-total-gt-to-ge", LIB, "while total > max && total > min && i < list.len() {", "while total >= max && total > min && i < list.len() {", 0, CV, "cap_overflow_in_cell"),
    ("cap-mountain-drops-to-plains", LIB, "cap_overflow_loop(hexes, list, max_mtn, min_mtn, Terrain::Hills)", "cap_overflow_loop(hexes, list, max_mtn, min_mtn, Terrain::Plains)", 0, CV, "cap_overflow_in_cell"),
    ("cap-highland-drops-to-grass", LIB, "cap_overflow_loop(hexes, list, max_hi, min_hi, Terrain::Plains)", "cap_overflow_loop(hexes, list, max_hi, min_hi, Terrain::Grassland)", 0, CV, "cap_overflow_in_cell"),
    ("cap-sort-descending", LIB, "js_array_sort_by(&mut list, |a, b| a.2 - b.2);", "js_array_sort_by(&mut list, |a, b| b.2 - a.2);", 0, CV, "cap_overflow_in_cell"),
    ("cap-mountain-bonus-without-min", LIB, "relief_bonus_cap_mountain(tier, land.len() as f64) + min_mtn,", "relief_bonus_cap_mountain(tier, land.len() as f64),", 0, CV, "cap_overflow_in_cell"),
    ("cap-highland-bonus-without-min", LIB, "relief_bonus_cap_highland(tier, land.len() as f64) + min_hi,", "relief_bonus_cap_highland(tier, land.len() as f64),", 0, CV, "cap_overflow_in_cell"),
    ("cap-mountain-spread-flag-ignored", LIB, "    let base_max_mtn = if spread_only {", "    let base_max_mtn = if false && spread_only {", 0, CV, "cap_overflow_in_cell"),
    ("cap-highland-spread-flag-inverted", LIB, "    let base_max_hi = if spread_only {", "    let base_max_hi = if !spread_only {", 0, CV, "cap_overflow_in_cell"),
    ("cap-clears-overlay-removed", LIB, "drop_hex.overlay = Nakladka::Brak;", "drop_hex.overlay = drop_hex.overlay;", 0, CV, "cap_overflow_in_cell"),
    ("cap-relief-no-short-circuit", LIB, "cap_mountain_overflow_in_cell(land, hexes, scratch, tier, false)\n        || cap_highland_overflow_in_cell(land, hexes, scratch, tier, false)", "cap_mountain_overflow_in_cell(land, hexes, scratch, tier, false)\n        | cap_highland_overflow_in_cell(land, hexes, scratch, tier, false)", 0, CV, "cap_overflow_in_cell"),
    ("cap-spread-skips-highland", LIB, "        cap_highland_overflow_in_cell(&land, hexes, scratch, tier, true);\n", "", 0, CV, "cap_iron_cell_relief_spread"),
    ("cap-spread-min-land-lt-to-le", LIB, "if (land.len() as f64) < min_iron_land {", "if (land.len() as f64) <= min_iron_land {", 0, CV, "cap_iron_cell_relief_spread"),
    ("cap-spread-not-spread", LIB, "        cap_mountain_overflow_in_cell(&land, hexes, scratch, tier, true);", "        cap_mountain_overflow_in_cell(&land, hexes, scratch, tier, false);", 0, CV, "cap_iron_cell_relief_spread"),
    # --- domykanie pokrycia masy ---
    ("ensure-skip-cap-ignored", LIB, "    if !skip_cap {", "    if true {", 0, CV, "ensure_mass_grid_coverage"),
    ("ensure-eligible-ge-to-gt", LIB, ".filter(|land| eligible_relief_land_count(land, hexes) >= min_land)", ".filter(|land| eligible_relief_land_count(land, hexes) > min_land)", 0, CV, "ensure_mass_grid_coverage"),
    ("ensure-fixed-counts-double", LIB, "                inner += 1.0;", "                inner += 2.0;", 0, CV, "ensure_mass_grid_coverage"),
    ("ensure-copper-checks-iron-package", LIB, "ReliefWant::Highland => cell_has_copper_package(land, hexes, tier),", "ReliefWant::Highland => cell_has_iron_package(land, hexes, tier),", 0, CV, "ensure_mass_grid_coverage"),
    ("ensure-cap-copper-caps-mountains", LIB, "                    cap_highland_overflow_in_cell(land, hexes, scratch, tier, false);\n                }\n            }\n        }\n    }\n    let mut pass", "                    cap_mountain_overflow_in_cell(land, hexes, scratch, tier, false);\n                }\n            }\n        }\n    }\n    let mut pass", 0, CV, "ensure_mass_grid_coverage"),
    ("ensure-iron-wrapper-want", LIB, "        skip_cap,\n        ReliefWant::Mountain,\n    )\n}", "        skip_cap,\n        ReliefWant::Highland,\n    )\n}", 0, CV, "ensure_mass_grid_coverage"),
    # --- tabela danych (zmiana liczby balansu MUSI zlamac wektory) ---
    ("tbl-center-size", TBL, '"rozmiar_boku": { "wartosc": 5,', '"rozmiar_boku": { "wartosc": 6,', 0, TB, "consts_and_tier_tables"),
    ("tbl-forest-share-medium", TBL, '"medium": { "wartosc": 0.58,', '"medium": { "wartosc": 0.5,', 0, TB, "consts_and_tier_tables"),
    ("tbl-forest-cap", TBL, '"sufit_nakladki_ulamek": { "wartosc": 0.95,', '"sufit_nakladki_ulamek": { "wartosc": 0.9,', 0, TB, "consts_and_tier_tables"),
    ("tbl-bonus-mountain-medium", TBL, '"medium": { "wartosc": 0.1, "zrodlo_web": "gra/src/map/gen-helpers.ts:1621" }', '"medium": { "wartosc": 0.2, "zrodlo_web": "gra/src/map/gen-helpers.ts:1621" }', 0, TB, "caps_match_web"),
    ("tbl-bonus-highland-high", TBL, '"high": { "wartosc": 0.275,', '"high": { "wartosc": 0.3,', 0, TB, "caps_match_web"),
    ("tbl-spread-mountain-dist", TBL, '"min_odleglosc_gor": { "wartosc": 4,', '"min_odleglosc_gor": { "wartosc": 3,', 0, RL, "apply_relief_to_land_keys"),
    ("tbl-spread-highland-dist", TBL, '"min_odleglosc_wzgorz": { "wartosc": 3,', '"min_odleglosc_wzgorz": { "wartosc": 2,', 0, RL, "apply_relief_to_land_keys"),
    ("tbl-min-mountains-medium", TBL, '"medium": { "wartosc": 4, "zrodlo_web": "gra/src/map/gen-helpers.ts:1779" }', '"medium": { "wartosc": 3, "zrodlo_web": "gra/src/map/gen-helpers.ts:1779" }', 0, TB, "consts_and_tier_tables"),
    ("tbl-min-highlands-high", TBL, '"high": { "wartosc": 5, "zrodlo_web": "gra/src/map/gen-helpers.ts:1780" }', '"high": { "wartosc": 4, "zrodlo_web": "gra/src/map/gen-helpers.ts:1780" }', 0, TB, "consts_and_tier_tables"),
    ("tbl-water-cell-low", TBL, '"low": { "wartosc": 15, "zrodlo_web": "gra/src/map/gen-helpers.ts:1801" }', '"low": { "wartosc": 14, "zrodlo_web": "gra/src/map/gen-helpers.ts:1801" }', 0, TB, "consts_and_tier_tables"),
    ("tbl-iron-cell-medium", TBL, '"medium": { "wartosc": 15, "zrodlo_web": "gra/src/map/gen-helpers.ts:1812" }', '"medium": { "wartosc": 16, "zrodlo_web": "gra/src/map/gen-helpers.ts:1812" }', 0, RL, "apply_relief_to_land_keys"),
    ("tbl-copper-cell-high", TBL, '"high": { "wartosc": 12, "zrodlo_web": "gra/src/map/gen-helpers.ts:1820" }', '"high": { "wartosc": 13, "zrodlo_web": "gra/src/map/gen-helpers.ts:1820" }', 0, RL, "apply_relief_to_land_keys"),
    ("tbl-forest-cell-medium", TBL, '"medium": { "wartosc": 10, "zrodlo_web": "gra/src/map/gen-helpers.ts:1841" }', '"medium": { "wartosc": 11, "zrodlo_web": "gra/src/map/gen-helpers.ts:1841" }', 0, TB, "consts_and_tier_tables"),
    ("tbl-min-land-floor", TBL, '"dolna_granica": { "wartosc": 8,', '"dolna_granica": { "wartosc": 9,', 0, TB, "min_land_hexes"),
    ("tbl-min-land-fraction", TBL, '"ulamek_rozmiaru_komorki": { "wartosc": 0.32,', '"ulamek_rozmiaru_komorki": { "wartosc": 0.3,', 0, TB, "min_land_hexes"),
    ("tbl-river-sources", TBL, '"min_zrodel_rzek_na_komorke_wody": { "wartosc": 1,', '"min_zrodel_rzek_na_komorke_wody": { "wartosc": 2,', 0, TB, "consts_and_tier_tables"),
    ("tbl-copper-multiplier", TBL, '"mnoznik_miedzi_wzgledem_zelaza": { "wartosc": 0.6,', '"mnoznik_miedzi_wzgledem_zelaza": { "wartosc": 0.5,', 0, MS, "grid_coverage"),
    ("tbl-coverage-threshold", TBL, '"prog_pokrycia_siatki": { "wartosc": 0.999,', '"prog_pokrycia_siatki": { "wartosc": 0.5,', 0, MS, "grid_coverage"),
    ("tbl-highland-multiplier", TBL, '"mnoznik_wyniku_wzgorza": { "wartosc": 0.9,', '"mnoznik_wyniku_wzgorza": { "wartosc": 1.0,', 0, CV, "pick_relief_force_hex"),
    ("tbl-border-cap", TBL, '"limit_odleglosci_od_brzegu": { "wartosc": 8,', '"limit_odleglosci_od_brzegu": { "wartosc": 7,', 0, CV, "pick_relief_force_hex"),
    ("tbl-border-weight", TBL, '"waga_odleglosci_od_brzegu": { "wartosc": 0.04,', '"waga_odleglosci_od_brzegu": { "wartosc": 0.05,', 0, CV, "pick_relief_force_hex"),
    ("tbl-rand-weight", TBL, '"waga_losowa": { "wartosc": 0.1,', '"waga_losowa": { "wartosc": 0.2,', 0, CV, "pick_relief_force_hex"),
    ("tbl-overflow-multiplier", TBL, '"mnoznik": { "wartosc": 1,', '"mnoznik": { "wartosc": 2,', 0, CV, "cap_overflow_in_cell"),
    ("tbl-fallback-mountain-medium", TBL, '"medium": { "wartosc": 0.1, "zrodlo_web": "gra/src/data/map-gen-params-loader.ts:38" }', '"medium": { "wartosc": 0.2, "zrodlo_web": "gra/src/data/map-gen-params-loader.ts:38" }', 0, TB, "damaged_json"),
    ("tbl-fallback-highland-low", TBL, '"low": { "wartosc": 0.132, "zrodlo_web": "gra/src/data/map-gen-params-loader.ts:37" }', '"low": { "wartosc": 0.2, "zrodlo_web": "gra/src/data/map-gen-params-loader.ts:37" }', 0, TB, "damaged_json"),
]

# Mutacje ROWNOWAZNE (uzasadnienie w dokumencie, §6a): oczekiwane PRZEZYLY wszystkie testy.
EQUIVALENT = [
    ("eq-dist-inside-square-zero", LIB, "    if square.has(&js_hex_key(q, r)) {\n        return 0.0;\n    }\n", "", 0, MS, "centroid_center_square"),
    ("eq-dist-empty-keys-zero", LIB, "    if square.keys.is_empty() {\n        return 0.0;\n    }\n", "", 0, MS, "centroid_center_square"),
    ("eq-partition-lower-clamp", LIB, "js_min(n_continents - 1.0, js_max(0.0, raw))", "js_min(n_continents - 1.0, raw)", 0, MS, "land_partition"),
    ("eq-apply-nonpositive-count-lt", LIB, "if n_mtn <= 0.0 {", "if n_mtn < 0.0 {", 0, RL, "apply_relief_to_land_keys"),
    ("eq-apply-empty-keys-guard", LIB, "    if keys.is_empty() {\n        return;\n    }\n    apply_iron_mountains_to_land_keys", "    apply_iron_mountains_to_land_keys", 0, RL, "apply_relief_to_land_keys"),
    ("eq-pick-spread-count-le-to-lt", LIB, "if count <= 0.0 || candidates.is_empty() {", "if count < 0.0 || candidates.is_empty() {", 0, MS, "pick_spread"),
    ("eq-force-guard-ge-to-gt", LIB, "if guard_now >= land.len() as f64 + guard_extra {", "if guard_now > land.len() as f64 + guard_extra {", 0, CV, "force_relief_type_in_cell"),
    ("eq-force-third-branch-sort", LIB, "js_array_sort_by(&mut ranked, |a, b| b.2 - a.2);\n            match ranked.first() {", "js_array_sort_by(&mut ranked, |a, b| a.2 - b.2);\n            match ranked.first() {", 0, CV, "force_relief_type_in_cell"),
    ("eq-cap-min-guard-dropped", LIB, "while total > max && total > min && i < list.len() {", "while total > max && i < list.len() {", 0, CV, "cap_overflow_in_cell"),
    ("eq-ensure-never-breaks-early", LIB, "        if inner == 0.0 {\n            break;\n        }", "        if inner < 0.0 {\n            break;\n        }", 0, CV, "ensure_mass_grid_coverage"),
    ("eq-assert-coverage-ge-to-gt", LIB, ") >= mapgen_relief_a().pokrycie.prog_pokrycia_siatki.wartosc", ") > mapgen_relief_a().pokrycie.prog_pokrycia_siatki.wartosc", 0, MS, "grid_coverage"),
    ("eq-tbl-guard-extra", TBL, '"dodatek_do_straznika_petli": { "wartosc": 8,', '"dodatek_do_straznika_petli": { "wartosc": 0,', 0, CV, "force_relief_type_in_cell"),
    # apply-iron-uses-copper-cell: jw. - iron_coverage_cell_size == copper_coverage_cell_size dla kazdego poziomu
    ("apply-iron-uses-copper-cell", LIB, "let cell_size = iron_coverage_cell_size(tier);\n    let min_land = min_land_hexes_for_relief_cell(cell_size);\n    let mass_set = unique_in_order(keys);\n    let min_dist = mapgen_relief_a().rozrzut_reliefu.min_odleglosc_gor.wartosc;", "let cell_size = copper_coverage_cell_size(tier);\n    let min_land = min_land_hexes_for_relief_cell(cell_size);\n    let mass_set = unique_in_order(keys);\n    let min_dist = mapgen_relief_a().rozrzut_reliefu.min_odleglosc_gor.wartosc;", 0, RL, "apply_relief_to_land_keys"),
    # force-shallow-penalty-sign: martwy kod takze w webie: PlytkieMorze to woda, odfiltrowana wczesniej w pickReliefForceHex
    ("force-shallow-penalty-sign", LIB, "score -= p.kara_plytkie_morze.wartosc;", "score += p.kara_plytkie_morze.wartosc;", 0, CV, "pick_relief_force_hex"),
    # force-initial-ge-to-gt: petla wymuszania sama ponownie sprawdza licznik; przy rownosci nic nie dodaje
    ("force-initial-ge-to-gt", LIB, "    if count(hexes) >= min_count {\n        return false;\n    }\n\n    let guard_extra", "    if count(hexes) > min_count {\n        return false;\n    }\n\n    let guard_extra", 0, CV, "force_relief_type_in_cell"),
    # force-placed-not-recorded: wymuszony heks jest juz wykluczony filtrem terenu docelowego, wiec rejestr placed jest redundantny
    ("force-placed-not-recorded", LIB, "        placed.insert(k);\n        changed = true;", "        changed = true;", 0, CV, "force_relief_type_in_cell"),
    # cap-clears-deposit-removed: przycinany heks nie jest chroniony, czyli nie ma zloza (chroniony == ma zloze) - has_deposit=false redundantne
    ("cap-clears-deposit-removed", LIB, "drop_hex.has_deposit = false;", "drop_hex.has_deposit = drop_hex.has_deposit;", 0, CV, "cap_overflow_in_cell"),
    # ensure-copper-uses-iron-size: tabele rozmiarow komorek zelaza i miedzi sa identyczne (web :1809-1822), wiec zamiana funkcji nie zmienia wartosci
    ("ensure-copper-uses-iron-size", LIB, "ReliefWant::Highland => copper_coverage_cell_size(tier),", "ReliefWant::Highland => iron_coverage_cell_size(tier),", 0, CV, "ensure_mass_grid_coverage"),
    # ensure-sort-reversed: komorki rozlaczne, dzialanie tylko na komorkach bez pakietu, kolejnosc stabilna - wynik niezalezny od kolejnosci
    ("ensure-sort-reversed", LIB, "f64::from(u8::from(has_package(a, hexes_ref)))\n                    - f64::from(u8::from(has_package(b, hexes_ref)))", "f64::from(u8::from(has_package(b, hexes_ref)))\n                    - f64::from(u8::from(has_package(a, hexes_ref)))", 0, CV, "ensure_mass_grid_coverage"),
    # ensure-pass-not-incremented-twice: force_*_in_cell jest idempotentne (petla do minimum lub wyczerpania kandydatow) - drugi przebieg nic nie zmienia
    ("ensure-pass-not-incremented-twice", LIB, "        pass += 1.0;\n    }\n    fixed", "        pass += 2.0;\n    }\n    fixed", 0, CV, "ensure_mass_grid_coverage"),
    # tbl-shallow-penalty: jw. - kara za plytkie morze nigdy nie jest stosowana (woda odfiltrowana)
    ("tbl-shallow-penalty", TBL, '"kara_plytkie_morze": { "wartosc": 0.15,', '"kara_plytkie_morze": { "wartosc": 0.05,', 0, CV, "pick_relief_force_hex"),
    # tbl-passes: jw. - jeden przebieg wystarcza, drugi daje 0 napraw
    ("tbl-passes", TBL, '"max_przebiegow_domykania_komorek": { "wartosc": 14,', '"max_przebiegow_domykania_komorek": { "wartosc": 1,', 0, CV, "ensure_mass_grid_coverage"),
]

args = sys.argv[1:]
DRY = "--dry" in args
EQUIV = "--equiv" in args
ONLY = None
SKIP = set()
FROM, TO = 0, 10**9
if "--only" in args:
    ONLY = set(args[args.index("--only") + 1].split(","))
if "--skip" in args:
    SKIP = set(args[args.index("--skip") + 1].split(","))
if "--from" in args:
    FROM = int(args[args.index("--from") + 1])
if "--to" in args:
    TO = int(args[args.index("--to") + 1])

LIST = EQUIVALENT if EQUIV else MUTATIONS
if ONLY is not None:
    LIST = [m for m in LIST if m[0] in ONLY]
if "--rr" in args:
    # kolejnosc round-robin po grupach (binarka, filtr): przerwanie przebiegu w dowolnym momencie zostawia
    # pokrycie kazdej funkcji, a nie tylko kilku pierwszych kategorii
    groups = {}
    for m in LIST:
        groups.setdefault((m[5], m[6]), []).append(m)
    rr = []
    while any(groups.values()):
        for g in list(groups):
            if groups[g]:
                rr.append(groups[g].pop(0))
    LIST = rr
LIST = [m for m in LIST if m[0] not in SKIP]
LIST = LIST[FROM:TO]


def disk_sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


orig = {}
for p in (LIB, TBL):
    with open(p, encoding="utf-8", newline="") as fh:
        orig[p] = fh.read()


def build(mid, path, old, new, nth):
    text = orig[path]
    count = text.count(old)
    if nth == 0:
        assert count == 1, f"{mid}: fragment wystepuje {count}x (wymagane 1): {old[:80]!r}"
        mutated = text.replace(old, new, 1)
    else:
        assert count >= nth, f"{mid}: fragment wystepuje {count}x, wymagane >= {nth}: {old[:80]!r}"
        idx = -1
        for _ in range(nth):
            idx = text.index(old, idx + 1)
        mutated = text[:idx] + new + text[idx + len(old):]
    assert mutated != text, f"{mid}: mutacja nic nie zmienia"
    return mutated


if DRY:
    for m in MUTATIONS + EQUIVALENT:
        build(m[0], m[1], m[2], m[3], m[4])
    ids = [m[0] for m in MUTATIONS + EQUIVALENT]
    assert len(ids) == len(set(ids)), "powtorzone id mutacji"
    print(f"DRY OK: {len(MUTATIONS)} mutacji + {len(EQUIVALENT)} rownowaznych pasuje")
    sys.exit(0)

signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
signal.signal(signal.SIGINT, lambda *_: sys.exit(130))

ORIG_SHA = {p: disk_sha(p) for p in (LIB, TBL)}
print("SHA256 poczatkowe: " + " ".join(f"{p}={h}" for p, h in ORIG_SHA.items()))
st = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], capture_output=True, text=True)
if st.stdout.strip():
    print("BLAD: drzewo nie jest czyste przed przebiegiem:\n" + st.stdout)
    sys.exit(3)
print("DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)")
sys.stdout.flush()


def restore_and_check(mid):
    subprocess.run(["git", "checkout", "--", LIB, TBL], check=True)
    st = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], capture_output=True, text=True)
    bad = [p for p in ORIG_SHA if disk_sha(p) != ORIG_SHA[p]]
    status = "git checkout OK; " + " ".join(f"{p}:sha256={disk_sha(p)[:16]}..={'OK' if p not in bad else 'ROZNI-SIE'}" for p in ORIG_SHA)
    status += "; drzewo " + ("CZYSTE" if not st.stdout.strip() else "BRUDNE:" + st.stdout.strip())
    print(f"   {mid}: PRZYWROCONO {status}")
    if bad or st.stdout.strip():
        print(f"BLAD KRYTYCZNY: po mutacji {mid} drzewo nie jest czyste / plik rozni sie od oryginalu")
        sys.exit(3)


def run_cargo(binary, flt):
    cmd = ["cargo", "test", "--offline", "--no-fail-fast"]
    for b in ([binary] if binary else ALL):
        cmd += ["--test", b]
    if flt:
        cmd += ["--", flt]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1500)
        out = r.stdout + r.stderr
    except subprocess.TimeoutExpired:
        return "TIMEOUT", [], False, False, True
    failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
    compile_err = "error[" in out or "could not compile" in out
    # INFRA: brak miejsca na dysku albo proces cargo ubity sygnalem z zewnatrz (nie wynik mutacji)
    infra = "No space left on device" in out or r.returncode < 0 or "Killed" in out
    return out, failed, compile_err, infra, False


detected = 0
survived = []
elsewhere = []
timeouts = []
infra_retries = []
try:
    for mid, path, old, new, nth, binary, flt in LIST:
        mutated = build(mid, path, old, new, nth)
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(mutated)
        t0 = time.time()
        out, failed, compile_err, infra, timeout = run_cargo(binary, flt)
        attempts = 0
        while infra and attempts < 8:
            attempts += 1
            infra_retries.append(f"{mid}#{attempts}")
            print(f"INFRA     {mid}: brak miejsca / proces ubity -> powtorzenie {attempts}/8 po 60 s")
            sys.stdout.flush()
            time.sleep(60)
            out, failed, compile_err, infra, timeout = run_cargo(binary, flt)
        via = "celowany"
        if not compile_err and not failed and not timeout:
            # test celowany zielony: sprawdz pelny zestaw 4 binarek
            out2, failed2, compile_err2, infra2, timeout2 = run_cargo(None, None)
            if failed2:
                failed, via = failed2, "INNY TEST (celowany zielony)"
                elsewhere.append(mid)
            timeout = timeout2
        restore_and_check(mid)
        dt = int(time.time() - t0)
        if timeout:
            timeouts.append(mid)
            print(f"TIMEOUT   {mid} ({dt} s)")
        elif compile_err:
            print(f"BLAD-KOMPILACJI {mid}: " + " | ".join(l for l in out.splitlines() if "error" in l)[:300])
            survived.append(mid + " (blad kompilacji)")
        elif failed:
            detected += 1
            print(f"WYKRYTA   {mid} [{via}] ({dt} s): {len(failed)} testow FAILED: {', '.join(failed[:4])}")
        else:
            survived.append(mid)
            print(f"PRZEZYLA  {mid} ({dt} s): wszystkie testy zielone")
        sys.stdout.flush()
finally:
    subprocess.run(["git", "checkout", "--", LIB, TBL])
final_ok = all(disk_sha(p) == ORIG_SHA[p] for p in ORIG_SHA)
st = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], capture_output=True, text=True)
print("SHA256 koncowe:    " + " ".join(f"{p}={disk_sha(p)}" for p in ORIG_SHA))
print(f"DRZEWO na koncu: {'CZYSTE' if not st.stdout.strip() else 'BRUDNE ' + st.stdout.strip()}")
print(f"WYKRYTE PRZEZ INNY TEST NIZ CELOWANY: {elsewhere}")
print(f"POWTORZENIA Z POWODU INFRA: {infra_retries}")
print(f"TIMEOUTY: {timeouts}")
mode = "ROWNOWAZNE (oczekiwane: przezyly)" if EQUIV else "MUTACJE (oczekiwane: wszystkie wykryte)"
print(f"PODSUMOWANIE [{mode}]: wykryte {detected}/{len(LIST)}, przezyly: {survived}, pliki przywrocone bajt w bajt: {final_ok}")
if EQUIV:
    sys.exit(0 if len(survived) == len(LIST) and final_ok else 1)
sys.exit(0 if not survived and not timeouts and final_ok else 1)
