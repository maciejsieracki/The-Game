#!/usr/bin/env python3
"""P6.M07B-Q3 - mutacje portu (trace_coast.rs, astar.rs, extend.rs).

Kazdy mutant = JEDNA podmiana tekstu (liczba wystapien `old` musi wynosic 1). Mutacje sa stosowane
na KOPII roboczej (`--work`, domyslnie /dev/shm/m07b3-mut-<shard>), NIE w drzewie repo - przerwanie
nie zostawia pustych/uszkodzonych plikow w repo (lekcja c). Po kazdym mutancie plik w kopii jest
przywracany z oryginalu z kontrola sha256 (RESTORED=True).

Wynik per mutant: KILLED (test zawiodl lub timeout), SURVIVED (test przeszedl), INVALID (blad
kompilacji - mutant nie liczy sie). Oczekiwanie: K = ma zginac, E = rownowaznosc (dowod w dossierze).
Log wznawialny: identyfikatory juz zapisane w logu sa pomijane.

Uzycie (z katalogu engine):
  python3 -I tests/p6_m07b3_vectors/mutate_m07b3_q3.py --shard 0/4 --log <log>   # jedna czesc
  python3 -I tests/p6_m07b3_vectors/mutate_m07b3_q3.py --check                    # tylko weryfikacja `old`
"""
import argparse
import hashlib
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.abspath(os.path.join(HERE, "..", ".."))
TC = "src/domain/mapgen/rivers_b/trace_coast.rs"
AS = "src/domain/mapgen/rivers_b/astar.rs"
EX = "src/domain/mapgen/rivers_b/extend.rs"

# (id, plik, old, new, oczekiwanie, opis)
M = []


def m(mid, f, old, new, exp, note):
    M.append((mid, f, old, new, exp, note))


# ---------------------------------------------------------------- trace_river_from_coast
m("T01", TC, "Some(&d) if d > 2 => return Vec::new(),", "Some(&d) if d > 3 => return Vec::new(),", "K", ":6251 startD > 2 -> 3")
m("T02", TC, "Some(&d) if d > 2 => return Vec::new(),", "Some(&d) if d >= 2 => return Vec::new(),", "K", ":6251 startD > 2 -> >=2")
m("T03", TC, "None => return Vec::new(),", "None => {}", "K", ":6251 startD == null")
m("T04", TC, "(Some(w), Some(h)) => (w, h),", "(Some(w), Some(h)) => (h, w),", "K", ":6240 jawne wymiary zamienione")
m("T05", TC, "_ => infer_map_dims_from_hexes(hexes),", "_ => (1, 1),", "K", ":6240 wymiary wnioskowane")
m("T06", TC, "opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN)", "opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN + 1)", "K", ":6254 domyslna hardMeanderLen")
m("T07", TC, "opts.allow_relief_traversal.unwrap_or(false)", "opts.allow_relief_traversal.unwrap_or(true)", "K", ":6255 domyslne allowRelief")
m("T08", TC, "opts.min_path_sep.unwrap_or(MAIN_RIVER_MIN_PATH_SEP)", "opts.min_path_sep.unwrap_or(MAIN_RIVER_MIN_PATH_SEP + 1)", "K", ":6259 domyslne minPathSep")
m("T09", TC, "step_cap: max_len,", "step_cap: max_len + 1,", "K", ":6257 growthCap +1")
m("T10", TC, "step_cap: max_len,", "step_cap: max_len.saturating_sub(1),", "K", ":6257 growthCap -1")
m("T11", TC, "if mouth_to_inland.len() < 2 {", "if mouth_to_inland.len() < 3 {", "K", ":6275 len < 2 -> 3")
m("T12", TC, "if mouth_to_inland.len() < 2 {", "if mouth_to_inland.len() < 1 {", "K", ":6275 len < 2 -> 1")
m("T13", TC, "reversed.reverse();", "", "K", ":6277 odwrocenie trasy")
m("T14", TC, "        Some((width, height)),\n        Some(ocean_connected),", "        None,\n        Some(ocean_connected),", "E", ":6278 pathEndsAtSea bez wymiarow (ocean dany -> wymiary nieuzyte) [wymiary w pathEndsAtSea nieuzyte gdy oceanConnected podany]")
m("T15", TC, "        Some(ocean_connected),\n    ) {", "        None,\n    ) {", "K", ":6278 pathEndsAtSea bez oceanConnected")
m("T16", TC, "if !path_ends_at_sea(", "if path_ends_at_sea(", "K", ":6278 negacja pathEndsAtSea")
m("T17", TC, "land_centroid: opts.land_centroid,", "land_centroid: None,", "K", ":6269 landCentroid")
m("T18", TC, "land_center_square: opts.land_center_square,", "land_center_square: None,", "K", ":6270 landCenterSquare")
m("T19", TC, "sep_index: opts.river_sep_index,", "sep_index: None,", "E", ":6271 indeks sep = optymalizacja (rowny brute force)")
m("T20", TC, "block_river_keys: opts.block_river_keys,", "block_river_keys: None,", "K", ":6267 blockRiverKeys")
m("T21", TC, "build_open_ocean_distance_field(hexes, width, height, opts.ocean_connected)", "build_open_ocean_distance_field(hexes, width, height, None)", "E", ":6243 openOcean z oceanConnected [openOceanDist przekazany do growRiverFromCoastInland jest tam nieczytany]")
m("T22", TC, "let mut zero = || 0.0_f64;", "let mut zero = || 0.5_f64;", "K", ":6246 domyslny rand")
m("T23", TC, "let mouth_key = hex_key(mq, mr);", "let mouth_key = hex_key(mr, mq);", "K", ":6248 mouthKey")
m("T24", TC, "sea_owned = build_sea_distance_field(hexes);", "sea_owned = HashMap::new();", "K", ":6237 domyslny seaDist")
m("T25", TC, "ocean_owned = ocean_connected_water_keys(hexes, width, height);", "ocean_owned = ocean_connected_water_keys(hexes, height, width);", "K", ":6246 oceanConnected domyslny")

# ---------------------------------------------------------------- greedy_river_drain_to_sea
m("G01", TC, "for _step in 0..max_len {", "for _step in 0..=max_len {", "K", ":6290 petla step < maxLen -> <=")
m("G02", TC, "for _step in 0..max_len {", "for _step in 0..max_len.saturating_sub(1) {", "K", ":6290 petla maxLen-1")
m("G03", TC, "            break;\n        };\n\n        let in_dir: Option<(i64, i64)> = if path.len() >= 2 {", "            continue;\n        };\n\n        let in_dir: Option<(i64, i64)> = if path.len() >= 2 {", "E", ":6297 curOd == null: break -> continue (stan niezmienny: iteracja idempotentna)")
m("G04", TC, "let in_dir: Option<(i64, i64)> = if path.len() >= 2 {", "let in_dir: Option<(i64, i64)> = if path.len() > 2 {", "K", ":6299 path.length >= 2")
m("G05", TC, "Some(river_step_dir(path[path.len() - 2], cur))", "Some(river_step_dir(cur, path[path.len() - 2]))", "K", ":6301 inDir odwrocony")
m("G06", TC, "            let nk = hex_key(nq, nr);\n            if visited.contains(&nk) {\n                continue;\n            }\n            if !is_river_window_turn_allowed(&path, nq, nr) {", "            let nk = hex_key(nq, nr);\n            if !is_river_window_turn_allowed(&path, nq, nr) {", "K", ":6309 visited [domkniete r2: petla 36 heks. na plateau, web-rivers-b-q3-closure.json]")
m("G07", TC, "if !is_river_window_turn_allowed(&path, nq, nr) {", "if false && !is_river_window_turn_allowed(&path, nq, nr) {", "K", ":6310 okno skretu")
m("G08", TC, "                true,\n                None,\n                allow_relief_traversal,", "                false,\n                None,\n                allow_relief_traversal,", "K", ":6312 blockExisting")
m("G09", TC, "                None,\n                allow_relief_traversal,", "                None,\n                !allow_relief_traversal,", "K", ":6312 allowRelief")
m("G10", TC, "let nd = sea_dist.get(&nk).copied().unwrap_or(i64::MAX);", "let nd = sea_dist.get(&nk).copied().unwrap_or(0);", "K", ":6313 nd ?? Infinity")
m("G11", TC, "if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, false) {", "K", ":6314 postInlandPhase")
m("G12", TC, "if od > cur_od as f64 + 0.5 {", "if od > cur_od as f64 + 1.5 {", "K", ":6316 od > curOd + 0.5 -> +1.5")
m("G13", TC, "if od > cur_od as f64 + 0.5 {", "if od > cur_od as f64 - 0.5 {", "K", ":6316 od > curOd + 0.5 -> -0.5")
m("G14", TC, "if od > cur_od as f64 + 0.5 {", "if od >= cur_od as f64 + 0.5 {", "E", ":6316 > vs >= przy calkowitym od i polowkowym progu")
m("G15", TC, "if od > cur_od as f64 + 0.5 {", "if od > cur_od as f64 {", "E", ":6316 prog 0.5 vs 0 przy calkowitych od")
m("G16", TC, "let mut score = od * 12.0 + rand() * 0.35;", "let mut score = od * 1.0 + rand() * 0.35;", "K", ":6318 waga od")
m("G17", TC, "let mut score = od * 12.0 + rand() * 0.35;", "let mut score = od * 13.0 + rand() * 0.35;", "E", ":6318 waga 12 -> 13 (kolejnosc ta sama: od dominuje, bonus < 12)")
m("G18", TC, "let mut score = od * 12.0 + rand() * 0.35;", "let mut score = od * 12.0 + rand() * 0.34;", "E", ":6318 jitter 0.35 -> 0.34 [jitter 0.35 vs 0.34: kolejnosc kandydatow ta sama (skala jittera < premia 1.8 i < 12)]")
m("G19", TC, "score -= 1.8;", "score += 1.8;", "K", ":6319 bonus prostej")
m("G20", TC, "score -= 1.8;", "score -= 0.3;", "K", ":6319 bonus prostej 1.8 -> 0.3")
m("G21", TC, "if same_river_dir(d, (dq, dr)) {\n                    score -= 1.8;", "if !same_river_dir(d, (dq, dr)) {\n                    score -= 1.8;", "K", ":6319 sameRiverDir")
m("G22", TC, "        if candidates.is_empty() {\n            break;\n        }\n        // Web:", "        if candidates.is_empty() {\n            continue;\n        }\n        // Web:", "E", ":6323 brak kandydatow: break -> continue (brak wolan rand, stan niezmienny)")
m("G23", TC, "let pick = candidates[0];", "let pick = candidates[candidates.len() - 1];", "K", ":6325 wybor najlepszego")
m("G24", TC, "        path.push(RiverCoord::new(pick.q, pick.r));\n        visited.insert(hex_key(pick.q, pick.r));", "        path.push(RiverCoord::new(pick.q, pick.r));", "K", ":6327 visited po wyborze [domkniete r2: lasso (start na ogonie), web-rivers-b-q3-closure.json]")
m("G25", TC, "    visited.insert(hex_key(sq, sr));\n\n    for _step", "\n    for _step", "K", ":6285 visited startu [domkniete r2: start na pierscieniu z ostroga, web-rivers-b-q3-closure.json]")
m("G26", TC, "if path.len() > 1 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)", "if path.len() > 2 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)", "K", ":6331 path.length > 1")
m("G27", TC, "if path.len() > 1 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)", "if path.len() > 0 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)", "K", ":6331 path.length > 1 -> > 0")
m("G28", TC, "if path.len() > 1 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)", "if path.len() > 1 && true", "K", ":6331 koncowy cel drenazu")
m("G29", TC, "        if is_river_drainage_goal(cur.q, cur.r, hexes, source_key, ocean_connected) {\n            return path;", "        if false && is_river_drainage_goal(cur.q, cur.r, hexes, source_key, ocean_connected) {\n            return path;", "K", ":6293 wczesny cel drenazu")

# ---------------------------------------------------------------- RiverAStarOpenHeap
m("H01", AS, "a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)", "a.0 <= b.0 || (a.0 == b.0 && a.1 < b.1)", "K", ":6381 less: f<= (przy rownym f decyduje seq, wynik taki sam) [etykieta E z r1 skorygowana: mutant ZABITY - f<= psuje porzadek kopca]")
m("H02", AS, "a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)", "a.0 < b.0 || (a.0 == b.0 && a.1 > b.1)", "K", ":6381 remis: seq malejaco")
m("H03", AS, "a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)", "a.0 < b.0", "K", ":6381 brak tie-break seq")
m("H04", AS, "a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)", "a.0 > b.0 || (a.0 == b.0 && a.1 < b.1)", "K", ":6381 odwrocone f")
m("H05", AS, "let p = (i - 1) >> 1;", "let p = i >> 1;", "K", ":6347 rodzic")
m("H06", AS, "if less(&d[i], &d[p]) {", "if less(&d[p], &d[i]) {", "K", ":6349 sift-up porownanie")
m("H07", AS, "        while i > 0 {\n            let p", "        while i > 1 {\n            let p", "K", ":6346 sift-up do korzenia")
m("H08", AS, "        if d.is_empty() {\n            return Some(last);\n        }", "        if false {\n            return Some(last);\n        }", "K", ":6361 pop ostatniego elementu")
m("H09", AS, "let l = 2 * i + 1;", "let l = 2 * i + 2;", "K", ":6367 lewe dziecko")
m("H10", AS, "if l < d.len() && less(&d[l], &d[best]) {", "if l < d.len() && less(&d[best], &d[l]) {", "K", ":6369 sift-down lewe")
m("H11", AS, "if r < d.len() && less(&d[r], &d[best]) {", "if r < d.len() && less(&d[best], &d[r]) {", "K", ":6370 sift-down prawe")
m("H12", AS, "if r < d.len() && less(&d[r], &d[best]) {", "if false && less(&d[r], &d[best]) {", "K", ":6370 prawe dziecko pominiete")
m("H13", AS, "if l < d.len() && less(&d[l], &d[best]) {", "if false && less(&d[l], &d[best]) {", "K", ":6369 lewe dziecko pominiete")
m("H14", AS, "let top = std::mem::replace(&mut d[0], last);", "let top = d[0].clone(); d[0] = last;", "E", ":6363 top/last: przypisanie rownowazne mem::replace")

# ---------------------------------------------------------------- aStarRiverToSea
m("A01", AS, ".or_else(|| sea_dist.get(&start_k))", ".or_else(|| None)", "K", ":6399 h0 = openOceanDist ?? seaDist")
m("A02", AS, "        .map(|&v| v as f64)\n    else {\n        return Vec::new();", "        .map(|&v| v as f64 + 1.0)\n    else {\n        return Vec::new();", "E", ":6399 h0 [h0 tylko startowy f/bestH: poza petla nieuzywany (fallback po petli martwy)]")
m("A03", AS, "if ocean_connected.contains(&start_k) {\n        return vec![RiverCoord::new(sq, sr)];", "if false && ocean_connected.contains(&start_k) {\n        return vec![RiverCoord::new(sq, sr)];", "E", ":6401 start w oceanie [start w oceanie: bez galezi start jest zdejmowany pierwszy i goal-check zwraca [start]]")
m("A04", AS, "    heap.push(h0, heap_seq, start_k.clone());\n    heap_seq += 1;", "    heap.push(h0, heap_seq, start_k.clone());", "E", ":6411 seq startu [seq startu: start zdjety pierwszy, kolejnosc seq potomkow zachowana]")
m("A05", AS, "            if !open.contains(&k) {\n                continue;\n            }", "", "E", ":6420 pomin wpisy spoza open [wpis spoza open: nieaktualny wpis ma f != fScore[k] (A06 go odrzuca); h = BFS openOceanDist jest spojna (koszt >= 1)]")
m("A06", AS, "            if f != entry.0 {\n                continue;\n            }", "", "E", ":6422 pomin przestarzale f [f != fScore: nieaktualny wpis wychodzi z kopca PO nowszym (nizsze f), wezel jest wtedy zamkniety (A05)]")
m("A07", AS, "if cur_h < best_h {", "if cur_h <= best_h {", "E", ":6431 bestH < [bestK/bestH: fallback po petli martwy (kazdy zdjety wezel jest od razu sprawdzany jako cel)]")
m("A08", AS, "        if is_river_drainage_goal(q, r, hexes, &start_k, ocean_connected) {\n            return reconstruct_river_path(&came_from, &current);", "        if false && is_river_drainage_goal(q, r, hexes, &start_k, ocean_connected) {\n            return reconstruct_river_path(&came_from, &current);", "K", ":6435 cel w petli")
m("A09", AS, "        open.remove(&current);\n", "", "E", ":6439 open.delete(current) [open.delete: spojna heurystyka - zamkniety wezel nie poprawia g; nieaktualne wpisy odrzuca test f]")
m("A10", AS, "if cur_g >= max_len_f {", "if cur_g > max_len_f {", "K", ":6440 curG >= maxLen -> >")
m("A11", AS, "if cur_g >= max_len_f {", "if cur_g >= max_len_f + 1.0 {", "K", ":6440 curG >= maxLen + 1")
m("A12", AS, "if cur_g >= max_len_f {", "if cur_g >= max_len_f - 1.0 {", "K", ":6440 curG >= maxLen - 1")
m("A13", AS, "river_step_dir(RiverCoord::new(pq, pr), RiverCoord::new(q, r))", "river_step_dir(RiverCoord::new(q, r), RiverCoord::new(pq, pr))", "K", ":6446 inDir odwrocony")
m("A14", AS, "                true,\n                None,\n                allow_relief_traversal,", "                false,\n                None,\n                allow_relief_traversal,", "K", ":6450 blockExisting")
m("A15", AS, "                None,\n                allow_relief_traversal,", "                None,\n                !allow_relief_traversal,", "K", ":6450 allowRelief")
m("A16", AS, "let nd = sea_dist.get(&nk).copied().unwrap_or(i64::MAX);", "let nd = sea_dist.get(&nk).copied().unwrap_or(0);", "K", ":6451 nd ?? Infinity")
m("A17", AS, "if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, false) {", "K", ":6452 postInlandPhase")
m("A18", AS, "let mut step_cost = 1.0_f64;", "let mut step_cost = 1.1_f64;", "K", ":6453 koszt kroku")
m("A19", AS, "step_cost += 0.18 + rand() * 0.12;", "step_cost += 0.19 + rand() * 0.12;", "K", ":6454 kara prostej 0.18")
m("A20", AS, "step_cost += 0.18 + rand() * 0.12;", "step_cost += 0.18 + rand() * 0.13;", "K", ":6454 jitter 0.12 [domkniete r2: prawie-remis tras prosta/zygzak, web-rivers-b-q3-closure.json]")
m("A21", AS, "step_cost += 0.18 + rand() * 0.12;", "step_cost -= 0.18 + rand() * 0.12;", "K", ":6454 znak kary")
m("A22", AS, "if same_river_dir(d, (dq, dr)) {\n                    step_cost", "if !same_river_dir(d, (dq, dr)) {\n                    step_cost", "K", ":6454 sameRiverDir")
m("A23", AS, "if tg > max_len_f + 2.0 {", "if tg >= max_len_f + 2.0 {", "E", ":6456 tg > maxLen + 2 -> >= [tg > maxLen+2 nieosiagalne: curG < maxLen i koszt < 1.3]")
m("A24", AS, "if tg > max_len_f + 2.0 {", "if tg > max_len_f + 3.0 {", "E", ":6456 tg > maxLen + 3 [tg > maxLen+3 nieosiagalne: curG < maxLen i koszt < 1.3]")
m("A25", AS, "if tg > max_len_f + 2.0 {", "if tg > max_len_f + 1.0 {", "K", ":6456 tg > maxLen + 1")
m("A26", AS, "if tg >= g_score.get(&nk).copied().unwrap_or(f64::INFINITY) {", "if tg > g_score.get(&nk).copied().unwrap_or(f64::INFINITY) {", "K", ":6457 tg >= gScore -> >")
m("A27", AS, "            came_from.insert(nk.clone(), current.clone());\n", "", "K", ":6458 cameFrom")
m("A28", AS, "heap.push(nf, heap_seq, nk);", "heap.push(tg, heap_seq, nk);", "K", ":6465 f wpisu kopca")
m("A29", AS, "            heap_seq += 1;\n        }\n    }", "        }\n    }", "K", ":6466 heapSeq++")
m("A30", AS, "if best_k != start_k {", "if true {", "E", ":6471 bestK != startK (start nie jest celem, bo odpytany jako pierwszy) [bestK != startK: start zdjety pierwszy i nie jest celem (inaczej return)]")
m("A31", AS, "        if is_river_drainage_goal(q, r, hexes, &start_k, ocean_connected) {\n            return reconstruct_river_path(&came_from, &best_k);", "        if true {\n            return reconstruct_river_path(&came_from, &best_k);", "K", ":6473 cel dla bestK")
m("A32", AS, "            .map_or(f64::INFINITY, |&v| v as f64);\n        let (q, r) = key_qr(&current)", "            .map_or(0.0, |&v| v as f64);\n        let (q, r) = key_qr(&current)", "E", ":6429 curH ?? Infinity [curH default wplywa tylko na bestH/bestK: fallback po petli martwy]")
m("A33", AS, "                + open_ocean_dist\n                    .get(&nk)\n                    .map_or(f64::INFINITY, |&v| v as f64);", "                + open_ocean_dist\n                    .get(&nk)\n                    .map_or(0.0, |&v| v as f64);", "E", ":6462 nf: openOcean ?? Infinity [wezel w oceanConnected bez openOceanDist nie jest nigdy wstawiany: rodzic bylby juz celem drenazu]")
m("A34", AS, "let max_len_f = max_len as f64;", "let max_len_f = (max_len + 1) as f64;", "K", ":6387 maxLen")
m("A35", AS, "best_h = cur_h;\n            best_k = current.clone();", "best_h = cur_h;", "E", ":6432 bestK [bestK: fallback po petli martwy]")

# ---------------------------------------------------------------- injectRiverMeanders
m("I01", EX, "if path.len() < 5 || max_extra_steps <= 0 {", "if path.len() < 4 || max_extra_steps <= 0 {", "K", ":6535 path.length < 5 -> 4")
m("I02", EX, "if path.len() < 5 || max_extra_steps <= 0 {", "if path.len() < 6 || max_extra_steps <= 0 {", "K", ":6535 path.length < 5 -> 6")
m("I03", EX, "if path.len() < 5 || max_extra_steps <= 0 {", "if path.len() < 5 || max_extra_steps < 0 {", "K", ":6535 maxExtraSteps <= 0")
m("I04", EX, "if path.len() < 5 || max_extra_steps <= 0 {", "if path.len() < 5 && max_extra_steps <= 0 {", "K", ":6535 || -> &&")
m("I05", EX, "while i + 2 < result.len() && extra < max_extra_steps {", "while i + 3 < result.len() && extra < max_extra_steps {", "K", ":6542 i < len - 2 -> len - 3")
m("I06", EX, "while i + 2 < result.len() && extra < max_extra_steps {", "while i + 1 < result.len() && extra < max_extra_steps {", "K", ":6542 i < len - 2 -> len - 1")
m("I07", EX, "while i + 2 < result.len() && extra < max_extra_steps {", "while i + 2 < result.len() && extra <= max_extra_steps {", "K", ":6542 extra < max -> <=")
m("I08", EX, "while i + 2 < result.len() && extra < max_extra_steps {", "while i + 2 < result.len() && extra + 1 < max_extra_steps {", "K", ":6542 extra < max - 1")
m("I09", EX, "Some(ld) if same_river_dir(ld, d) => straight_run += 1,", "Some(ld) if !same_river_dir(ld, d) => straight_run += 1,", "K", ":6544 sameRiverDir(lastDir, d)")
m("I10", EX, "                    straight_run = 1;\n                    last_dir = Some(d);", "                    straight_run = 0;\n                    last_dir = Some(d);", "K", ":6546 straightRun = 1")
m("I11", EX, "                    last_dir = Some(d);\n                }\n            }\n            if straight_run < 4 {", "                    last_dir = None;\n                }\n            }\n            if straight_run < 4 {", "K", ":6547 lastDir = d")
m("I12", EX, "if straight_run < 4 {", "if straight_run < 3 {", "K", ":6550 straightRun < 4 -> 3")
m("I13", EX, "if straight_run < 4 {", "if straight_run < 5 {", "K", ":6550 straightRun < 4 -> 5")
m("I14", EX, "if rand() >= 0.34 {", "if rand() > 0.34 {", "E", ":6551 rand() >= 0.34: mulberry32 daje wielokrotnosci 2^-32, 0.34 nie jest wielokrotnoscia")
m("I15", EX, "if rand() >= 0.34 {", "if rand() >= 0.35 {", "K", ":6551 prog 0.34 -> 0.35")
m("I16", EX, "if rand() >= 0.34 {", "if rand() >= 0.33 {", "K", ":6551 prog 0.34 -> 0.33")
m("I17", EX, "if rand() >= 0.34 {", "if rand() < 0.34 {", "K", ":6551 negacja")
m("I18", EX, "find_river_meander_step(hexes, result[i + 1], result[i + 2], sea_dist, &used, rand)", "find_river_meander_step(hexes, result[i], result[i + 1], sea_dist, &used, rand)", "K", ":6555 argumenty findRiverMeanderStep")
m("I19", EX, "result.insert(i + 2, bend);", "result.insert(i + 1, bend);", "K", ":6561 splice(i + 2)")
m("I20", EX, "            extra += 1;\n", "            extra += 2;\n", "K", ":6562 extra++")
m("I21", EX, "            straight_run = 0;\n            i += 2;", "            straight_run = 1;\n            i += 2;", "K", ":6563 straightRun = 0")
m("I22", EX, "            straight_run = 0;\n            i += 2;", "            straight_run = 0;\n            i += 1;", "K", ":6564 i += 2 -> 1")
m("I23", EX, "            straight_run = 0;\n            i += 2;", "            straight_run = 0;\n            i += 3;", "K", ":6564 i += 2 -> 3")
m("I24", EX, "        i += 1;\n    }\n\n    repair_river_path_adjacency(\n        &sanitize_river_path(&result),", "        i += 2;\n    }\n\n    repair_river_path_adjacency(\n        &sanitize_river_path(&result),", "K", ":6542 i++ petli")
m("I25", EX, "        &sanitize_river_path(&result),\n        hexes,\n        &hex_key(path[0].q, path[0].r),", "        &result,\n        hexes,\n        &hex_key(path[0].q, path[0].r),", "U", ":6568 sanitizeRiverPath(result)")
m("I26", EX, "        &sanitize_river_path(&result),\n        hexes,\n        &hex_key(path[0].q, path[0].r),", "        &sanitize_river_path(&result),\n        hexes,\n        &hex_key(path[1].q, path[1].r),", "E", ":6568 sourceKey [sourceKey w repair: path[0] zawsze odwiedzony, a cel d==1 omija canRiverFlowThrough]")
m("I27", EX, "            let used: HashSet<String> = result.iter().map(|p| hex_key(p.q, p.r)).collect();", "            let used: HashSet<String> = HashSet::new();", "K", ":6553 used")

# ---------------------------------------------------------------- extendRiverToMinimumLength
m("X01", EX, "if path.len() >= min_len || path.len() < 3 {", "if path.len() > min_len || path.len() < 3 {", "E", ":6578 length >= minLen -> > [length == minLen: petla while i tak sie nie wykonuje, wynik = path]")
m("X02", EX, "if path.len() >= min_len || path.len() < 3 {", "if path.len() >= min_len || path.len() < 2 {", "K", ":6578 length < 3 -> 2")
m("X03", EX, "if path.len() >= min_len || path.len() < 3 {", "if path.len() >= min_len || path.len() < 4 {", "K", ":6578 length < 3 -> 4")
m("X04", EX, "if path.len() >= min_len || path.len() < 3 {", "if path.len() >= min_len && path.len() < 3 {", "K", ":6578 || -> &&")
m("X05", EX, "while pass < 12 && out.len() < min_len && out.len() < step_cap {", "while pass < 11 && out.len() < min_len && out.len() < step_cap {", "K", ":6581 pass < 12 -> 11")
m("X06", EX, "while pass < 12 && out.len() < min_len && out.len() < step_cap {", "while pass < 13 && out.len() < min_len && out.len() < step_cap {", "K", ":6581 pass < 12 -> 13")
m("X07", EX, "while pass < 12 && out.len() < min_len && out.len() < step_cap {", "while pass < 12 && out.len() <= min_len && out.len() < step_cap {", "K", ":6581 length < minLen -> <=")
m("X08", EX, "while pass < 12 && out.len() < min_len && out.len() < step_cap {", "while pass < 12 && out.len() < min_len && out.len() <= step_cap {", "K", ":6581 length < stepCap -> <=")
m("X09", EX, "let need = (min_len - out.len()).min(step_cap - out.len()).min(6) as i64;", "let need = (min_len - out.len()).min(step_cap - out.len()).min(5) as i64;", "K", ":6582 min(.., 6) -> 5")
m("X10", EX, "let need = (min_len - out.len()).min(step_cap - out.len()).min(6) as i64;", "let need = (min_len - out.len()).min(step_cap - out.len()).min(7) as i64;", "K", ":6582 min(.., 6) -> 7")
m("X11", EX, "let need = (min_len - out.len()).min(step_cap - out.len()).min(6) as i64;", "let need = (min_len - out.len()).min(6) as i64;", "K", ":6582 bez stepCap")
m("X12", EX, "let need = (min_len - out.len()).min(step_cap - out.len()).min(6) as i64;", "let need = (step_cap - out.len()).min(6) as i64;", "K", ":6582 bez minLen")
m("X13", EX, "if meandered.len() > out.len() {", "if meandered.len() >= out.len() {", "K", ":6584 meandered.length > out.length")
m("X14", EX, "            out = meandered;\n            continue;", "            out = meandered;", "K", ":6586 continue po meandrach")
m("X15", EX, "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(1);", "let mid = ((out.len() as f64 * 0.5).floor() as usize).max(1);", "K", ":6589 0.45 -> 0.5")
m("X16", EX, "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(1);", "let mid = ((out.len() as f64 * 0.4).floor() as usize).max(1);", "K", ":6589 0.45 -> 0.4")
m("X17", EX, "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(1);", "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(2);", "K", ":6589 max(1, ..) -> 2")
m("X18", EX, "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(1);", "let mid = ((out.len() as f64 * 0.45).floor() as usize).max(0);", "K", ":6589 max(1, ..) -> 0: len>=3 daje floor(0.45*3)=1 [etykieta E z r1 skorygowana: mutant ZABITY - wejscia po skroceniu sanitize/repair do dl. 2]")
m("X19", EX, "let b = out[(out.len() - 1).min(mid + 1)];", "let b = out[mid + 1];", "K", ":6592 min(len-1, mid+1): mid+1 <= len-1 dla len>=3 [etykieta E z r1 skorygowana: mutant ZABITY - wejscia po skroceniu sanitize/repair do dl. 2]")
m("X20", EX, "let b = out[(out.len() - 1).min(mid + 1)];", "let b = out[mid];", "K", ":6592 b = out[mid]")
m("X21", EX, "let a = out[mid];", "let a = out[mid - 1];", "K", ":6591 a = out[mid]")
m("X22", EX, "next.extend_from_slice(&out[..=mid]);", "next.extend_from_slice(&out[..mid]);", "K", ":6595 slice(0, mid + 1)")
m("X23", EX, "next.extend_from_slice(&out[mid + 1..]);", "next.extend_from_slice(&out[mid..]);", "E", ":6595 slice(mid + 1) [duplikat out[mid] usuwa sanitize_river_path (seen) przed repair - wynik ten sam]")
m("X24", EX, "            None => break,\n        }\n    }\n    out", "            None => continue,\n        }\n    }\n    out", "U", ":6599 brak meandru: break")
m("X25", EX, "out = repair_river_path_adjacency(&sanitize_river_path(&next), hexes, &src_key);", "out = next;", "K", ":6597 repair(sanitize(out))")
m("X26", EX, "out = repair_river_path_adjacency(&sanitize_river_path(&next), hexes, &src_key);", "out = repair_river_path_adjacency(&next, hexes, &src_key);", "U", ":6597 bez sanitize")
m("X27", EX, "    let src_key = hex_key(path[0].q, path[0].r);\n    let mut out", "    let src_key = hex_key(path[1].q, path[1].r);\n    let mut out", "E", ":6579 srcKey [sourceKey w repair: jak I26]")
m("X28", EX, "        pass += 1;\n", "", "K", ":6581 pass++ (petla do cap kroku)")

# ---------------------------------------------------------------- extendRiverToWybrzeze
WYB_VIS = "            let nq = cq + i64::from(dq);\n            let nr = cr + i64::from(dr);\n            let nk = hex_key(nq, nr);\n            if visited.contains(&nk) {\n                continue;\n            }\n"
m("W01", EX, "    if path.is_empty() {\n        return;\n    }\n    let mut visited: HashSet<String> = path.iter().map(|p| hex_key(p.q, p.r)).collect();\n    let last = *path.last().expect(\"niepusta\");\n    let (mut cq", "    let mut visited: HashSet<String> = path.iter().map(|p| hex_key(p.q, p.r)).collect();\n    let last = *path.last().expect(\"niepusta\");\n    let (mut cq", "K", ":6604 path.length === 0 (panika przy pustej)")
m("W02", EX, "for _extra in 0..RIVER_MOUTH_TAIL_LEN {", "for _extra in 0..RIVER_MOUTH_TAIL_LEN + 1 {", "K", ":6612 extra < RIVER_MOUTH_TAIL_LEN -> +1")
m("W03", EX, "for _extra in 0..RIVER_MOUTH_TAIL_LEN {", "for _extra in 0..RIVER_MOUTH_TAIL_LEN - 1 {", "K", ":6612 extra < RIVER_MOUTH_TAIL_LEN -> -1")
m("W04", EX, "        let Some(end_hex) = hexes.get(&hex_key(cq, cr)) else {\n            break;\n        };", "        let Some(end_hex) = hexes.get(&hex_key(cq, cr)) else {\n            continue;\n        };", "E", ":6613 brak heksu konca: break -> continue (stan niezmienny, iteracje idempotentne)")
m("W05", EX, "if is_water_terrain_local(end_hex.terrain) {", "if end_hex.terrain == Terrain::Sea {", "K", ":6615 isWaterTerrainLocal -> tylko Morze")
m("W06", EX, "if is_water_terrain_local(end_hex.terrain) {", "if false {", "K", ":6615 koniec na wodzie")
m("W07", EX, WYB_VIS, "            let nq = cq + i64::from(dq);\n            let nr = cr + i64::from(dr);\n            let nk = hex_key(nq, nr);\n", "K", ":6623 visited")
m("W08", EX, "            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let mut score = sea_dist", "            if is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let mut score = sea_dist", "K", ":6625 Morze wykluczone")
m("W09", EX, "            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let mut score = sea_dist", "            if nh.terrain == Terrain::Sea {\n                continue;\n            }\n            let mut score = sea_dist", "K", ":6625 relief wykluczony")
m("W10", EX, "            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let mut score = sea_dist", "            if nh.terrain == Terrain::Sea && is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let mut score = sea_dist", "K", ":6625 || -> &&")
m("W11", EX, "sea_dist.get(&nk).map_or(999.0, |&v| v as f64)", "sea_dist.get(&nk).map_or(998.0, |&v| v as f64)", "E", ":6626 seaDist ?? 999 -> 998 [seaDist ?? 999 vs 998: stala przesuwa wszystkich kandydatow bez seaDist jednakowo (finitowe < 990)]")
m("W12", EX, "sea_dist.get(&nk).map_or(999.0, |&v| v as f64)", "sea_dist.get(&nk).map_or(0.0, |&v| v as f64)", "K", ":6626 seaDist ?? 999 -> 0")
m("W13", EX, "                score -= 8.0;", "                score += 8.0;", "K", ":6627 PlytkieMorze -8 -> +8")
m("W14", EX, "                score -= 8.0;", "                score -= 0.0;", "K", ":6627 PlytkieMorze: -8 vs -0 (shallow nd=0 < land nd>=1; brak seaDist -> oba 999) [etykieta E z r1 skorygowana: ZABITY wektorami `csea` (brak seaDist na pasie przybrzeznym: 991 vs 999 -> remis przy -0)]")
m("W15", EX, "            if score < best_score {\n                best_score = score;\n                best = Some((nq, nr));", "            if score <= best_score {\n                best_score = score;\n                best = Some((nq, nr));", "K", ":6628 score < bestScore -> <=")
m("W16", EX, "            if score < best_score {\n                best_score = score;\n                best = Some((nq, nr));", "            if score > best_score {\n                best_score = score;\n                best = Some((nq, nr));", "K", ":6628 score < bestScore -> >")
m("W17", EX, "        let Some((bq, br)) = best else {\n            break;\n        };", "        let Some((bq, br)) = best else {\n            continue;\n        };", "E", ":6633 brak kandydata: break -> continue (stan niezmienny)")
m("W18", EX, "        visited.insert(hex_key(bq, br));\n        cq = bq;", "        cq = bq;", "K", ":6636 visited.add")
m("W19", EX, "        cq = bq;\n        cr = br;", "        cr = br;", "K", ":6637 cq = best[0]")
m("W20", EX, "        cq = bq;\n        cr = br;", "        cq = bq;", "K", ":6638 cr = best[1]")
m("W21", EX, "        path.push(RiverCoord::new(bq, br));\n", "", "K", ":6635 path.push")

# ---------------------------------------------------------------- finishRiverMouthAtSea
m("F01", EX, "        |q: i64, r: i64| is_river_drainage_goal(q, r, hexes, source_key, ocean_connected);", "        |_q: i64, _r: i64| false;", "K", ":6657 mouthReady")
m("F02", EX, "    if mouth_ready(last.q, last.r) {\n        return;\n    }\n    let mut visited", "    let mut visited", "E", ":6661 wczesny return: petla sprawdza mouthReady(cur) w 1. iteracji")
m("F03", EX, "for _step in 0..(RIVER_MOUTH_TAIL_LEN + 2) {", "for _step in 0..(RIVER_MOUTH_TAIL_LEN + 3) {", "K", ":6666 step < TAIL + 2 -> +3")
m("F04", EX, "for _step in 0..(RIVER_MOUTH_TAIL_LEN + 2) {", "for _step in 0..(RIVER_MOUTH_TAIL_LEN + 1) {", "K", ":6666 step < TAIL + 2 -> +1")
m("F05", EX, "        if mouth_ready(cur.q, cur.r) {\n            return;\n        }\n        let mut best: Option<RiverCoord>", "        let mut best: Option<RiverCoord>", "K", ":6667 mouthReady w petli")
m("F06", EX, "let nd = nd_opt.unwrap_or(i64::MAX);", "let nd = nd_opt.unwrap_or(0);", "K", ":6679 nd ?? Infinity")
m("F07", EX, "if !shallow && !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "K", ":6680 wyjatek PlytkieMorze (drain)")
m("F08", EX, "if !shallow && !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "if !shallow && !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, false) {", "K", ":6680 postInlandPhase")
m("F09", EX, "if !shallow && !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "if shallow || !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {", "K", ":6680 !shallow && -> shallow ||")
m("F10", EX, "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) && !shallow {", "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) || !shallow {", "K", ":6682 && -> ||")
m("F11", EX, "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) && !shallow {", "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) {", "E", ":6682 wyjatek PlytkieMorze (flow) [canRiverFlowThrough dla PlytkieMorze zawsze true (nie Morze, nie relief)]")
m("F12", EX, "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) && !shallow {", "if !can_river_flow_through(Some(nh), &nk, source_key, true, None, false) && !shallow {", "K", ":6682 blockExisting domyslnie false")
m("F13", EX, "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) && !shallow {", "if !can_river_flow_through(Some(nh), &nk, source_key, false, None, true) && !shallow {", "E", ":6682 allowRelief: relief odrzucony wczesniej (:6677)")
m("F14", EX, "            let mut score = open_ocean_dist\n                .get(&nk)\n                .map_or_else(|| nd_opt.map_or(f64::INFINITY, |v| v as f64), |&v| v as f64);", "            let mut score = nd_opt.map_or(f64::INFINITY, |v| v as f64);", "K", ":6684 openOceanDist ?? nd")
m("F15", EX, "|| nd_opt.map_or(f64::INFINITY, |v| v as f64)", "|| nd_opt.map_or(0.0, |v| v as f64)", "K", ":6684 nd = Infinity")
m("F16", EX, "                score -= 15.0;", "                score += 15.0;", "K", ":6686 PlytkieMorze -15 -> +15")
m("F17", EX, "                score -= 15.0;", "                score -= 14.0;", "E", ":6686 PlytkieMorze -15 -> -14: shallow o=0 vs land o>=1 (w obu wypadkach shallow wygrywa)")
m("F18", EX, "            if score < best_score {\n                best_score = score;\n                best = Some(RiverCoord::new(nq, nr));", "            if score <= best_score {\n                best_score = score;\n                best = Some(RiverCoord::new(nq, nr));", "K", ":6688 score < bestScore -> <=")
m("F19", EX, "        let Some(b) = best else {\n            break;\n        };", "        let Some(b) = best else {\n            continue;\n        };", "E", ":6693 brak kandydata: break -> continue (stan niezmienny)")
m("F20", EX, "        visited.insert(hex_key(b.q, b.r));", "", "K", ":6695 visited.add")
m("F21", EX, "        path.push(b);\n", "", "K", ":6694 path.push")
m("F22", EX, "    let mut visited: HashSet<String> = path.iter().map(|p| hex_key(p.q, p.r)).collect();\n    let mut cur = last;", "    let mut visited: HashSet<String> = HashSet::new();\n    let mut cur = last;", "K", ":6666 visited poczatkowy")
m("F23", EX, "    if path.is_empty() {\n        return;\n    }\n    let mouth_ready", "    let mouth_ready", "K", ":6650 path.length === 0")
FIN_VIS = "            let nq = cur.q + i64::from(dq);\n            let nr = cur.r + i64::from(dr);\n            let nk = hex_key(nq, nr);\n            if visited.contains(&nk) {\n                continue;\n            }\n"
m("F24", EX, FIN_VIS, "            let nq = cur.q + i64::from(dq);\n            let nr = cur.r + i64::from(dr);\n            let nk = hex_key(nq, nr);\n", "K", ":6673 visited")
m("F25", EX, "            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let nd_opt", "            if is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let nd_opt", "E", ":6677 Morze wykluczone [Morze odrzucane i tak przez canRiverFlowThrough (false dla Morza)]")
m("F26", EX, "            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {\n                continue;\n            }\n            let nd_opt", "            if nh.terrain == Terrain::Sea {\n                continue;\n            }\n            let nd_opt", "K", ":6677 relief wykluczony")


def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()


def prepare(work):
    if os.path.isdir(work):
        shutil.rmtree(work)
    os.makedirs(os.path.join(work, "tests", "p6_m07b3_vectors"))
    for f in ("Cargo.toml", "Cargo.lock"):
        if os.path.exists(os.path.join(ENGINE, f)):
            shutil.copy(os.path.join(ENGINE, f), work)
    for d in ("src", "data", "benches"):
        # copyfile (bez mtime zrodla): cargo ma przebudowac, a nie uzyc starego (zmutowanego) artefaktu
        shutil.copytree(os.path.join(ENGINE, d), os.path.join(work, d), copy_function=shutil.copyfile)
    shutil.copyfile(os.path.join(ENGINE, "tests", "p6_m07b3_q3.rs"), os.path.join(work, "tests", "p6_m07b3_q3.rs"))
    for vf in ("web-rivers-b-q3.json", "web-rivers-b-q3-closure.json"):
        shutil.copyfile(os.path.join(HERE, vf), os.path.join(work, "tests", "p6_m07b3_vectors", vf))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shard", default="0/1")
    ap.add_argument("--ids", default="")
    ap.add_argument("--log", default="")
    ap.add_argument("--work", default="")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--show", action="store_true", help="wypisz koncowke wyjscia cargo (diagnostyka, bez logu)")
    a = ap.parse_args()
    si, sn = (int(x) for x in a.shard.split("/"))

    if a.check:
        bad = 0
        ids = set()
        for mid, f, old, new, exp, note in M:
            assert mid not in ids, f"duplikat id {mid}"
            ids.add(mid)
            src = open(os.path.join(ENGINE, f)).read()
            c = src.count(old)
            if c != 1:
                bad += 1
                print(f"{mid}: liczba wystapien old = {c}")
            if old == new:
                bad += 1
                print(f"{mid}: old == new")
        print(f"mutantow: {len(M)}, bledne: {bad}")
        sys.exit(1 if bad else 0)

    work = a.work or f"/dev/shm/m07b3-mut-{si}"
    target = f"/dev/shm/m07b3-mut-target-{si}"
    log = a.log or os.path.join(work + "-log.txt")
    done = set()
    if os.path.exists(log):
        for line in open(log):
            done.add(line.split("|")[0].strip())
    want = set(x for x in a.ids.split(",") if x)
    prepare(work)
    env = dict(os.environ, CARGO_TARGET_DIR=target, CARGO_INCREMENTAL="0",
               CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
    if not a.show:
        r0 = subprocess.run(["cargo", "test", "--test", "p6_m07b3_q3", "--quiet"], cwd=work, env=env,
                            capture_output=True, text=True)
        if r0.returncode != 0:
            print("BASELINE CZERWONY - przerwano", (r0.stdout + r0.stderr)[-1500:])
            sys.exit(4)
        print("BASELINE ZIELONY", flush=True)
    mine = [x for k, x in enumerate(M) if k % sn == si and (not want or x[0] in want)]
    for mid, f, old, new, exp, note in mine:
        if mid in done:
            continue
        path = os.path.join(work, f)
        orig = open(path).read()
        assert orig.count(old) == 1, f"{mid}: old nie jest unikalny"
        open(path, "w").write(orig.replace(old, new, 1))
        status = "?"
        try:
            for attempt in range(3):  # INVALID bez bledu E**** = awaria infrastruktury (np. OOM kompilatora) - ponow
                r = subprocess.run(
                    ["timeout", str(a.timeout), "cargo", "test", "--test", "p6_m07b3_q3", "--quiet"],
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
        if a.show:
            print(mid, status, out[-1800:], flush=True)
            continue
        with open(log, "a") as fh:
            fh.write(f"{mid} | {status} | {os.path.basename(f)} | oczek={exp} | {note} | RESTORED={restored}\n")
        print(mid, status, f"RESTORED={restored}", flush=True)
        if not restored:
            sys.exit(3)


if __name__ == "__main__":
    main()
