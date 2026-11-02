#!/usr/bin/env python3
"""P6.M07B-Q4 - mutacje portu (trace.rs, sources.rs, quotas.rs).

Kazdy mutant = JEDNA podmiana tekstu: `old` ma wystepowac dokladnie `total` razy, podmieniane jest
`k`-te wystapienie (domyslnie 1 z 1). Mutacje sa stosowane na KOPII roboczej (`--work`, domyslnie
/dev/shm/m07b4-mut-<shard>), NIE w drzewie repo - przerwanie nie zostawia pustych/uszkodzonych plikow
w repo. Po kazdym mutancie plik w kopii jest przywracany z oryginalu z kontrola sha256
(RESTORED=True).

Wynik per mutant: KILLED (test zawiodl lub timeout), SURVIVED (test przeszedl), INVALID (blad
kompilacji - mutant nie liczy sie). Oczekiwanie: K = ma zginac, E = rownowaznosc (dowod w dossierze).
Log wznawialny: identyfikatory juz zapisane w logu sa pomijane.

Uzycie (z katalogu engine):
  python3 -I tests/p6_m07b4_vectors/mutate_m07b4_q4.py --shard 0/4 --log <log>   # jedna czesc
  python3 -I tests/p6_m07b4_vectors/mutate_m07b4_q4.py --check                    # tylko weryfikacja `old`
"""
import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.abspath(os.path.join(HERE, "..", ".."))
TR = "src/domain/mapgen/rivers_b/trace.rs"
SR = "src/domain/mapgen/rivers_b/sources.rs"
QU = "src/domain/mapgen/rivers_b/quotas.rs"

# (id, plik, old, new, oczekiwanie, opis, (k, total))
M = []


def m(mid, f, old, new, exp, note, nth=(1, 1)):
    M.append((mid, f, old, new, exp, note, nth))


# ---------------------------------------------------------------- trace_river (:6708)
DIMS_T = "(Some(w), Some(h)) => (w, h),\n        _ => infer_map_dims_from_hexes(hexes),\n    };\n    let open_owned;"
m("T01", TR, DIMS_T, DIMS_T.replace("(w, h),", "(h, w),"), "K", ":6718 jawne wymiary zamienione")
m("T02", TR, "_ => infer_map_dims_from_hexes(hexes),\n    };\n    let open_owned;", "_ => (1, 1),\n    };\n    let open_owned;", "K", ":6718 wymiary wnioskowane")
m("T03", TR, "sea_dist.get(&src_key) else {", "sea_dist.get(&hex_key(sr, sq)) else {", "K", ":6738 startDist zrodla")
m("T04", TR, "opts.min_len.unwrap_or(4) as i64", "opts.min_len.unwrap_or(5) as i64", "K", ":6742 minLen domyslne 4->5")
m("T05", TR, "opts.min_len.unwrap_or(4) as i64", "opts.min_len.unwrap_or(3) as i64", "K", ":6742 minLen domyslne 4->3")
m("T06", TR, "unwrap_or(RIVER_MOUTH_TAIL_LEN) as i64", "unwrap_or(RIVER_MOUTH_TAIL_LEN + 1) as i64", "K", ":6743 mouthTailLen domyslne +1")
m("T07", TR, "opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN)", "opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN + 1)", "K", ":6744 hardMeanderLen domyslne +1")
m("T08", TR, "opts.allow_relief_traversal.unwrap_or(false)", "opts.allow_relief_traversal.unwrap_or(true)", "K", ":6745 allowRelief domyslne")
m("T09", TR, "opts.relax_sea_buffer.unwrap_or(false)", "opts.relax_sea_buffer.unwrap_or(true)", "K", ":6746 relaxSeaBuffer domyslne")
m("T10", TR, "(inland_target + mouth_tail_len + 12)", "(inland_target + mouth_tail_len + 11)", "K", ":6747 stepCap dolny prog 12->11")
m("T11", TR, "(inland_target + mouth_tail_len + 12)", "(inland_target + mouth_tail_len + 13)", "K", ":6747 stepCap dolny prog 12->13")
m("T12", TR, ".max(max_len_i.min(", ".max(max_len_i.max(", "K", ":6748 min(maxLen, ..) -> max")
m("T13", TR, "(start_dist as f64 * 2.5).ceil()", "(start_dist as f64 * 2.0).ceil()", "K", ":6749 mnoznik 2.5")
m("T14", TR, "(start_dist as f64 * 2.5).ceil()", "(start_dist as f64 * 2.5).floor()", "K", ":6749 ceil -> floor")
m("T15", TR, "+ inland_target + 10))", "+ inland_target + 11))", "K", ":6749 +10 -> +11")
m("T16", TR, "+ inland_target + 10))", "+ inland_target + 9))", "K", ":6749 +10 -> +9")
m("T17", TR, "(step_cap_i - mouth_tail_len - 4).min(max_len_i)", "(step_cap_i - mouth_tail_len - 3).min(max_len_i)", "K", ":6752 inlandGrowthMax -4 -> -3")
m("T18", TR, "(step_cap_i - mouth_tail_len - 4).min(max_len_i)", "(step_cap_i - mouth_tail_len - 5).min(max_len_i)", "K", ":6752 inlandGrowthMax -4 -> -5")
m("T19", TR, "(step_cap_i - mouth_tail_len - 4).min(max_len_i)", "(step_cap_i - mouth_tail_len - 4).min(max_len_i + 1)", "K", ":6753 min(.., maxLen) +1")
m("T20", TR, "(step_cap_i - mouth_tail_len - 4).min(max_len_i)", "(step_cap_i - mouth_tail_len - 4).min(max_len_i - 1)", "K", ":6753 min(.., maxLen) -1")
m("T21", TR, "min_path_sep: opts.min_path_sep.unwrap_or(0),", "min_path_sep: opts.min_path_sep.unwrap_or(3),", "K", ":6763 minPathSep domyslne 0->3")
m("T22", TR, "        land_centroid: opts.land_centroid,\n", "        land_centroid: None,\n", "K", ":6764 landCentroid")
m("T23", TR, "        land_center_square: opts.land_center_square,\n    };\n    let mut path", "        land_center_square: None,\n    };\n    let mut path", "K", ":6765 landCenterSquare")
m("T24", TR, "        block_river_keys: opts.block_river_keys,\n", "        block_river_keys: None,\n", "K", ":6762 blockRiverKeys")
m("T25", TR, "        relax_sea_buffer,\n        inland_growth_max", "        relax_sea_buffer: false,\n        inland_growth_max", "K", ":6760 relaxSeaBuffer do wzrostu")
m("T26", TR, "        allow_relief_traversal: allow_relief,\n        relax_sea_buffer", "        allow_relief_traversal: false,\n        relax_sea_buffer", "K", ":6759 allowRelief do wzrostu")
m("T27", TR, "(mouth_tail_len + 4).max(", "(mouth_tail_len + 5).max(", "K", ":6770 drainBudget dolny prog +4 -> +5")
m("T28", TR, "(mouth_tail_len + 4).max(", "(mouth_tail_len + 3).max(", "K", ":6770 drainBudget dolny prog +4 -> +3")
m("T29", TR, "step_cap_i - path.len() as i64 + 1)", "step_cap_i - path.len() as i64 + 2)", "K", ":6770 drainBudget +1 -> +2")
m("T30", TR, "step_cap_i - path.len() as i64 + 1)", "step_cap_i - path.len() as i64)", "K", ":6770 drainBudget +1 -> +0")
m("T31", TR, "    if drain_path.len() <= 1 {", "    if drain_path.len() < 1 {", "K", ":6784 fallback zjazdu: <=1 -> <1")
m("T32", TR, "    if drain_path.len() <= 1 {", "    if drain_path.len() <= 2 {", "K", ":6784 fallback zjazdu: <=1 -> <=2")
m("T33", TR, "    if drain_path.len() > 1 {\n        path.extend_from_slice", "    if drain_path.len() > 2 {\n        path.extend_from_slice", "K", ":6797 doklejenie drenazu: >1 -> >2")
m("T34", TR, "path.extend_from_slice(&drain_path[1..]);", "path.extend_from_slice(&drain_path[0..]);", "K", ":6798 slice(1)")
m("T35", TR, "    } else if path.len() <= 1 {", "    } else if path.len() < 1 {", "K", ":6799 path<=1 -> <1")
m("T37", TR, "            step_cap,\n            &mut *rand,\n            allow_relief,\n        );\n        if path.len() <= 1 {", "            drain_budget,\n            &mut *rand,\n            allow_relief,\n        );\n        if path.len() <= 1 {", "K", ":6800 A* od zrodla: budzet stepCap")
m("T38", TR, "        if path.len() <= 1 {\n            path = greedy_river_drain_to_sea(", "        if path.len() < 1 {\n            path = greedy_river_drain_to_sea(", "K", ":6803 fallback greedy od zrodla: <=1 -> <1")
m("T39", TR, "                step_cap,\n                &mut *rand,\n                &src_key,", "                drain_budget,\n                &mut *rand,\n                &src_key,", "K", ":6806 greedy od zrodla: budzet stepCap")
m("T40", TR, "    if path.len() > step_cap {", "    if path.len() >= step_cap {", "E", ":6811 slice gdy len > cap: przy len == cap obciecie do cap = bez zmiany")
m("T41", TR, "path.truncate(step_cap);", "path.truncate(step_cap - 1);", "K", ":6811 slice(0, stepCap) -1")
m("T42", TR, "    extend_river_to_wybrzeze(hexes, &mut path, sea_dist);\n", "", "K", ":6812 extendRiverToWybrzeze")
m("T43", TR, "    finish_river_mouth_at_sea(\n        hexes,\n        &mut path,\n        sea_dist,\n        open_ocean_dist,\n        ocean_connected,\n        &src_key,\n    );\n", "", "K", ":6813 finishRiverMouthAtSea")
m("T44", TR, "    let path = repair_river_path_adjacency(&path, hexes, &src_key);\n", "", "K", ":6814 repairRiverPathAdjacency")
m("T45", TR, "    let path = sanitize_river_turn_window(&path, hexes, &src_key);\n", "", "K", ":6815 sanitizeRiverTurnWindow")
m("T46", TR, "path_ends_at_sea(hexes, &path, Some((width, height)), Some(ocean_connected));", "path_ends_at_sea(hexes, &path, None, Some(ocean_connected));", "E", ":6819 pathEndsAtSea: wymiary nieuzyte gdy oceanConnected podany")
m("T47", TR, "            RIVER_MIN_INLAND_FROM_SEA,\n            RIVER_MOUTH_TAIL_LEN,\n        ) || !ends", "            RIVER_MIN_INLAND_FROM_SEA + 1,\n            RIVER_MOUTH_TAIL_LEN,\n        ) || !ends", "K", ":6818 bufor minInland +1")
m("T48", TR, "            RIVER_MIN_INLAND_FROM_SEA,\n            RIVER_MOUTH_TAIL_LEN,\n        ) || !ends", "            RIVER_MIN_INLAND_FROM_SEA,\n            RIVER_MOUTH_TAIL_LEN + 1,\n        ) || !ends", "K", ":6818 bufor mouthTail +1")
m("T49", TR, ") || !ends\n        {", ") || ends\n        {", "K", ":6819 negacja pathEndsAtSea (bufor)")
m("T50", TR, "    } else if !ends {", "    } else if ends {", "K", ":6822 negacja pathEndsAtSea (relax)")
m("T51", TR, "    if !relax_sea_buffer {\n        if !river_path_respects_sea_buffer(", "    if relax_sea_buffer {\n        if !river_path_respects_sea_buffer(", "K", ":6817 relaxSeaBuffer gate")
m("T52", TR, "let mut zero = || 0.0_f64;", "let mut zero = || 0.5_f64;", "K", ":6727 domyslny rand")
m("T53", TR, "sea_owned = build_sea_distance_field(hexes);", "sea_owned = HashMap::new();", "K", ":6714 domyslny seaDist")
m("T54", TR, "ocean_owned = ocean_connected_water_keys(hexes, width, height);\n            &ocean_owned\n        }\n    };\n    let mut zero", "ocean_owned = ocean_connected_water_keys(hexes, height, width);\n            &ocean_owned\n        }\n    };\n    let mut zero", "K", ":6724 oceanConnected domyslny")
m("T55", TR, "open_owned =\n                build_open_ocean_distance_field(hexes, width, height, opts.ocean_connected);", "open_owned =\n                build_open_ocean_distance_field(hexes, width, height, None);", "K", ":6720 openOcean z oceanConnected opcji")

# ---------------------------------------------------------------- trace_river_for_grid_fill (:6822)
m("R01", TR, "    let tries: Vec<usize> = if fast_mode {", "    let tries: Vec<usize> = if !fast_mode {", "K", ":6834 fastMode")
m("R02", TR, "        vec![\n            accept_len,\n            3usize.max(", "        vec![\n            accept_len + 1,\n            3usize.max(", "K", ":6834 fast: acceptLen +1")
m("R03", TR, "(accept_len as f64 * 0.75)", "(accept_len as f64 * 0.7)", "K", ":6834 fast: 0.75")
m("R04", TR, "            3usize.max(", "            2usize.max(", "K", ":6834 fast: max(3, ..) -> 2")
m("R05", TR, "            catalog_min_len,\n            accept_len.max(", "            catalog_min_len + 1,\n            accept_len.max(", "K", ":6835 catalogMinLen +1")
m("R06", TR, "(catalog_min_len as f64 * 0.6)", "(catalog_min_len as f64 * 0.5)", "K", ":6835 0.6 -> 0.5")
m("R07", TR, "            accept_len.max((catalog", "            accept_len.min((catalog", "K", ":6835 max(acceptLen, ..) -> min")
m("R08", TR, "            accept_len,\n            3,\n        ]", "            accept_len,\n            4,\n        ]", "K", ":6835 ostatnia proba 3 -> 4")
m("R09", TR, "        if !seen.insert(try_min) {\n            continue;\n        }", "        if seen.insert(try_min) {\n            continue;\n        }", "K", ":6838 seen - negacja")
m("R10", TR, "        if !seen.insert(try_min) {\n            continue;\n        }", "        seen.insert(try_min);", "E", ":6838 seen: powtorka proby = ten sam wynik oprocz rand wspolnego [KILL/EQ wg wektorow]")
m("R11", TR, "        opts.min_len = Some(try_min);\n", "", "K", ":6841 minLen proby")
m("R12", TR, "        if path.len() < accept_len {", "        if path.len() <= accept_len {", "K", ":6842 acceptLen <  -> <=")
m("R13", TR, "        if !relax_sea_buffer {\n            return path;", "        if relax_sea_buffer {\n            return path;", "K", ":6843 relaxSeaBuffer gate")
m("R14", TR, "            _ => infer_map_dims_from_hexes(hexes),\n        };\n        let ocean_owned;", "            _ => (1, 1),\n        };\n        let ocean_owned;", "K", ":6846 wymiary wnioskowane (grid)")
m("R15", TR, "ocean_owned = ocean_connected_water_keys(hexes, width, height);\n                &ocean_owned\n            }\n        };\n        if path_ends_at_sea", "ocean_owned = ocean_connected_water_keys(hexes, height, width);\n                &ocean_owned\n            }\n        };\n        if path_ends_at_sea", "K", ":6849 oceanConnected domyslny (grid)")
m("R16", TR, "        if path_ends_at_sea(hexes, &path, Some((width, height)), Some(ocean)) {", "        if !path_ends_at_sea(hexes, &path, Some((width, height)), Some(ocean)) {", "K", ":6851 pathEndsAtSea (grid)")

# ---------------------------------------------------------------- zrodla (:6867-6987)
LOOP_R = "    for r in margin..height - margin {\n        for q in margin..width - margin {"
for k, name, line in ((1, "foothill", ":6872"), (2, "spring", ":6906"), (3, "sources", ":6932")):
    m(f"S{k}A", SR, LOOP_R, "    for r in margin..=height - margin {\n        for q in margin..width - margin {", "K", f"{line} {name}: r < h-margin -> <=", (k, 3))
    m(f"S{k}B", SR, LOOP_R, "    for r in margin..height - margin {\n        for q in margin..=width - margin {", "K", f"{line} {name}: q < w-margin -> <=", (k, 3))
    m(f"S{k}C", SR, LOOP_R, "    for r in margin + 1..height - margin {\n        for q in margin..width - margin {", "K", f"{line} {name}: r od margin+1", (k, 3))
    m(f"S{k}D", SR, LOOP_R, "    for r in margin..height - margin {\n        for q in margin + 1..width - margin {", "K", f"{line} {name}: q od margin+1", (k, 3))
FOOT_TAIL = "            let d = sea_dist.get(&hex_key(q, r)).copied().unwrap_or(0);\n            if !(2..=120)"
SPR_TAIL = "            let d = sea_dist.get(&hex_key(q, r)).copied().unwrap_or(0);\n            if !(3..=65)"
m("S10", SR, "(2..=120).contains(&d)", "(3..=120).contains(&d)", "K", ":6878 podnoze: d >= 2 -> 3")
m("S11", SR, "(2..=120).contains(&d)", "(1..=120).contains(&d)", "K", ":6878 podnoze: d >= 2 -> 1")
m("S12", SR, "(2..=120).contains(&d)", "(2..=121).contains(&d)", "E", ":6878 podnoze: d <= 120 -> 121 [seaDist <= ~15 na mapach generatora; NIE_ZMIERZONO dla wiekszych]")
m("S13", SR, "(3..=65).contains(&d)", "(2..=65).contains(&d)", "K", ":6912 zrodliska: d >= 3 -> 2")
m("S14", SR, "(3..=65).contains(&d)", "(4..=65).contains(&d)", "K", ":6912 zrodliska: d >= 3 -> 4")
m("S15", SR, "(3..=65).contains(&d)", "(3..=66).contains(&d)", "E", ":6912 zrodliska: d <= 65 -> 66 [seaDist <= ~15 na mapach generatora; NIE_ZMIERZONO dla wiekszych]")
m("S16", SR, "DensityTier::High => 0.11,", "DensityTier::High => 0.12,", "K", ":6905 high 0.11 -> 0.12")
m("S17", SR, "DensityTier::Low => 0.035,", "DensityTier::Low => 0.04,", "K", ":6905 low 0.035 -> 0.04")
m("S18", SR, "DensityTier::Medium => 0.065,", "DensityTier::Medium => 0.07,", "K", ":6905 medium 0.065 -> 0.07")
m("S19", SR, "if rand() > sample_rate {", "if rand() >= sample_rate {", "E", ":6913 rand > rate -> >=: rand() = k/2^32, a progi 0.11/0.035/0.065 nie sa wielokrotnoscia 2^-32")
m("S20", SR, "            if rand() > sample_rate {\n                continue;\n            }\n", "", "K", ":6913 brak losowania")
m("S21", SR, "if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {", "if is_relief_river_source(hex.terrain) {", "K", ":6874 podnoze: lad rzeczny", (1, 2))
m("S22", SR, "if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {", "if is_relief_river_source(hex.terrain) {", "K", ":6908 zrodliska: lad rzeczny", (2, 2))
m("S23", SR, "if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {", "if !is_river_land_terrain(hex.terrain) {", "K", ":6875 podnoze: wyklucz relief", (1, 2))
m("S24", SR, "if !is_river_land_terrain(hex.terrain) || is_relief_river_source(hex.terrain) {", "if !is_river_land_terrain(hex.terrain) {", "K", ":6909 zrodliska: wyklucz relief", (2, 2))
m("S25", SR, "let relief_adj = HEX_DIRECTIONS.iter().any(", "let relief_adj = HEX_DIRECTIONS.iter().all(", "K", ":6880 sasiad reliefowy: any -> all")
m("S26", SR, ".is_some_and(|nh| is_relief_river_source(nh.terrain))", ".is_some_and(|nh| is_river_land_terrain(nh.terrain))", "K", ":6882 sasiad = relief")
m("S27", SR, "unwrap_or(0);\n            if !(2..=120)", "unwrap_or(2);\n            if !(2..=120)", "K", ":6877 podnoze: brak seaDist -> 0")
m("S28", SR, "unwrap_or(0);\n            if !(3..=65)", "unwrap_or(3);\n            if !(3..=65)", "K", ":6911 zrodliska: brak seaDist -> 0")
m("S29", SR, "            if is_relief_river_source(hex.terrain) {\n                sources.push((q, r));", "            if !is_relief_river_source(hex.terrain) {\n                sources.push((q, r));", "K", ":6933 gory/wzgorza")
m("S30", SR, "(&hex_key(nq, nr))\n                    .is_some_and", "(&hex_key(nr, nq))\n                    .is_some_and", "K", ":6881 klucz sasiada")
# pick_spread_river_sources (:6960)
m("P01", SR, "if used_sources.contains(&k) {", "if !used_sources.contains(&k) {", "K", ":6969 uzyte zrodla")
m("P02", SR, "let dist = sea_dist.get(&k).copied().unwrap_or(0);", "let dist = sea_dist.get(&k).copied().unwrap_or(1);", "K", ":6973 brak seaDist -> 0")
m("P03", SR, "b.dist.cmp(&a.dist)", "a.dist.cmp(&b.dist)", "K", ":6978 sort dist malejaco")
m("P04", SR, "let d = a.tie - b.tie;", "let d = b.tie - a.tie;", "K", ":6978 remis rosnaco")
m("P05", SR, "let d = a.tie - b.tie;", "let d = 0.0;", "K", ":6978 remis ignorowany (stabilnie)")
m("P06", SR, "            tie: rand(),", "            tie: 0.0,", "K", ":6975 rand() na zrodlo")
m("P07", SR, "if picked.len() as i64 >= count {", "if picked.len() as i64 > count {", "K", ":6982 count")
m("P08", SR, "hex_axial_distance(pq, pr, s.q, s.r) < min_sep", "hex_axial_distance(pq, pr, s.q, s.r) <= min_sep", "K", ":6985 minSep scisle")
m("P09", SR, "        if too_close {\n            continue;\n        }", "", "K", ":6986 tooClose")
m("P10", SR, "hex_axial_distance(pq, pr, s.q, s.r) < min_sep", "hex_axial_distance(pq, pr, s.r, s.q) < min_sep", "K", ":6985 odleglosc: zamiana q/r")

# ---------------------------------------------------------------- cap_river_quotas (:6943)
m("C01", QU, "quotas.iter().map(|&n| n.max(0)).collect()", "quotas.iter().map(|&n| n).collect()", "K", ":6944 ujemne -> 0")
m("C02", QU, "    if sum <= max_total {", "    if sum < max_total {", "E", ":6946 sum <= max: przy rownosci petla while nie startuje")
m("C03", QU, "    while sum > max_total {", "    while sum >= max_total {", "K", ":6948 while sum > max")
m("C04", QU, "            if q[i] > q[idx] {", "            if q[i] >= q[idx] {", "K", ":6951 idx: pierwszy max (>) vs ostatni (>=)")
m("C05", QU, "unwrap_or(0) <= 1 {", "unwrap_or(0) <= 0 {", "K", ":6953 prog <= 1 -> <= 0")
m("C06", QU, "unwrap_or(0) <= 1 {", "unwrap_or(0) <= 2 {", "K", ":6953 prog <= 1 -> <= 2")
m("C07", QU, "        q[idx] -= 1;", "        q[idx] -= 2;", "K", ":6954 dekrement kwoty")
m("C08", QU, "        sum -= 1;", "        sum -= 2;", "K", ":6955 dekrement sumy")
m("C09", QU, "for i in 1..q.len() {", "for i in 0..q.len() {", "E", ":6950 start petli idx od 0: q[0] > q[0] nigdy prawdziwe")
m("C10", QU, "for i in 1..q.len() {", "for i in 2..q.len() {", "K", ":6950 start petli od 2")


def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()


def replace_nth(src, old, new, k):
    idx = -1
    for _ in range(k):
        idx = src.index(old, idx + 1)
    return src[:idx] + new + src[idx + len(old):]


def prepare(work):
    if os.path.isdir(work):
        shutil.rmtree(work)
    os.makedirs(os.path.join(work, "tests", "p6_m07b4_vectors"))
    for f in ("Cargo.toml", "Cargo.lock"):
        if os.path.exists(os.path.join(ENGINE, f)):
            shutil.copy(os.path.join(ENGINE, f), work)
    for d in ("src", "data", "benches"):
        if os.path.isdir(os.path.join(ENGINE, d)):
            # copyfile (bez mtime zrodla): cargo ma przebudowac, a nie uzyc starego artefaktu
            shutil.copytree(os.path.join(ENGINE, d), os.path.join(work, d), copy_function=shutil.copyfile)
    shutil.copyfile(os.path.join(ENGINE, "tests", "p6_m07b4_q4.rs"), os.path.join(work, "tests", "p6_m07b4_q4.rs"))
    shutil.copyfile(os.path.join(HERE, "web-rivers-b-q4.json"),
                    os.path.join(work, "tests", "p6_m07b4_vectors", "web-rivers-b-q4.json"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shard", default="0/1")
    ap.add_argument("--ids", default="")
    ap.add_argument("--log", default="")
    ap.add_argument("--work", default="")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--budget", type=int, default=0, help="s: nie startuj nowych mutantow po tym czasie (wznowienie z logu)")
    a = ap.parse_args()
    si, sn = (int(x) for x in a.shard.split("/"))

    if a.check:
        bad = 0
        ids = set()
        for mid, f, old, new, exp, note, (k, total) in M:
            assert mid not in ids, f"duplikat id {mid}"
            ids.add(mid)
            src = open(os.path.join(ENGINE, f)).read()
            c = src.count(old)
            if c != total:
                bad += 1
                print(f"{mid}: liczba wystapien old = {c} (oczekiwano {total})")
            if old == new:
                bad += 1
                print(f"{mid}: old == new")
        print(f"mutantow: {len(M)}, bledne: {bad}")
        sys.exit(1 if bad else 0)

    work = a.work or f"/dev/shm/m07b4-mut-{si}"
    target = f"/dev/shm/m07b4-mut-target-{si}"
    log = a.log or (work + "-log.txt")
    done = set()
    if os.path.exists(log):
        for line in open(log):
            done.add(line.split("|")[0].strip())
    want = set(x for x in a.ids.split(",") if x)
    prepare(work)
    env = dict(os.environ, CARGO_TARGET_DIR=target, CARGO_INCREMENTAL="0",
               CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
    mine = [x for j, x in enumerate(M) if j % sn == si and (not want or x[0] in want)]
    todo = [x for x in mine if x[0] not in done]
    if not todo:
        print("nic do zrobienia")
        return
    r0 = subprocess.run(["cargo", "test", "-j", "2", "--test", "p6_m07b4_q4", "--quiet"], cwd=work, env=env,
                        capture_output=True, text=True)
    if r0.returncode != 0:
        print("BASELINE CZERWONY - przerwano", (r0.stdout + r0.stderr)[-1500:])
        sys.exit(4)
    print("BASELINE ZIELONY", flush=True)
    t0 = time.time()
    for mid, f, old, new, exp, note, (k, total) in todo:
        if a.budget and time.time() - t0 > a.budget:
            break
        path = os.path.join(work, f)
        orig = open(path).read()
        assert orig.count(old) == total, f"{mid}: old nie wystepuje {total} razy"
        open(path, "w").write(replace_nth(orig, old, new, k))
        status = "?"
        try:
            for attempt in range(3):
                r = subprocess.run(
                    ["timeout", str(a.timeout), "cargo", "test", "-j", "2", "--test", "p6_m07b4_q4", "--quiet"],
                    cwd=work, env=env, capture_output=True, text=True)
                out = r.stdout + r.stderr
                if r.returncode == 0:
                    status = "SURVIVED"
                elif r.returncode == 124:
                    status = "KILLED(timeout)"
                elif "could not compile" in out or "error[E" in out:
                    cause = next((l for l in out.splitlines() if l.startswith("error[E") or "signal" in l
                                  or "SIGKILL" in l or "No space" in l), "")
                    status = "INVALID(kompilacja: " + cause[:90].replace("|", "/") + ")"
                else:
                    status = "KILLED"
                if not status.startswith("INVALID") or "error[E" in status:
                    break
        finally:
            open(path, "w").write(orig)
        restored = sha(open(path).read()) == sha(orig)
        with open(log, "a") as fh:
            fh.write(f"{mid} | {status} | {os.path.basename(f)} | oczek={exp} | {note} | RESTORED={restored}\n")
        print(mid, status, f"RESTORED={restored}", flush=True)
        if not restored:
            sys.exit(3)


if __name__ == "__main__":
    main()
