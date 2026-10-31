#!/usr/bin/env python3
"""P6.M07B-Q2 - skrypt mutacji (lekcja d). Mutuje kod Rust zakresu Q2 i uruchamia testy.

Kazda mutacja: dokladnie jedno wystapienie `old` w pliku (asercja), podmiana na `new`,
`cargo test --test p6_m07b2_coast --test p6_m07b2_edges`, przywrocenie pliku (sha256 sprawdzone).
Wynik: KILLED (test padl / panika / blad kompilacji mutanta liczy sie jako zabicie), SURVIVED
(wszystkie testy zielone). Dowody rownowaznosci dla SURVIVED sa w dossier (tabela mutantow).

Uzycie (cwd dowolny; katalog silnika wyliczany z lokalizacji skryptu):
  python3 -I mutate_m07b2_q2.py <od> <do>      # indeksy [od, do) z listy MUTANTS
  python3 -I mutate_m07b2_q2.py list           # lista mutantow
Log dopisywany do runu: dyspozycje/autobot/runs/R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1/mutate-m07b2-q2-r2.txt
"""
import hashlib
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
LOG = os.path.join(ROOT, "dyspozycje", "autobot", "runs",
                   "R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1", "mutate-m07b2-q2-r2.txt")
CG = "src/domain/mapgen/rivers_b/coast_grow.rs"
MN = "src/domain/mapgen/rivers_b/meander.rs"
ED = "src/domain/mapgen/rivers_b/edges.rs"
WD = "src/domain/mapgen/rivers_b/window.rs"

# (id, plik, old, new, opis, oczekiwanie: "K" zabic, "E" rownowazny (dowod w dossier), "L" luka/znany)
MUTANTS = [
    # --- coast_grow.rs: collectCoastInlandGrowCandidates (web :6098-6127)
    ("C01", CG, "if !is_river_window_turn_allowed(o.path, nq, nr) {", "if false {",
     "collect: filtr okna skrętu usuniety (:6106)", "K"),
    ("C02", CG, "if !can_river_flow_through(", "if can_river_flow_through(",
     "collect: filtr przechodnosci odwrocony (:6107)", "K"),
    ("C03", CG, "            o.allow_relief_traversal,\n        ) {", "            false,\n        ) {",
     "collect: allowReliefTraversal -> false (:6107)", "K"),
    ("C04", CG, "if !river_grow_step_passes_sep(", "if river_grow_step_passes_sep(",
     "collect: filtr sep odwrocony (:6108)", "K"),
    ("C05", CG, "if !o.path.is_empty() && nd < RIVER_MIN_INLAND_FROM_SEA {",
     "if nd < RIVER_MIN_INLAND_FROM_SEA {",
     "collect: guard path>=1 usuniety (:6110) - E: Rust panikuje wczesniej w is_river_window_turn_allowed (expect), web TypeError", "E"),
    ("C06", CG, "if !o.path.is_empty() && nd < RIVER_MIN_INLAND_FROM_SEA {",
     "if !o.path.is_empty() && nd <= RIVER_MIN_INLAND_FROM_SEA {",
     "collect: prog MIN_INLAND <= zamiast < (:6110)", "K"),
    ("C07", CG, "if o.hard_meander && !o.relax_hard_meander && nd < cur_d {",
     "if o.hard_meander && nd < cur_d {",
     "collect: relaxHardMeander ignorowany (:6111)", "K"),
    ("C08", CG, "if o.hard_meander && !o.relax_hard_meander && nd < cur_d {",
     "if !o.relax_hard_meander && nd < cur_d {",
     "collect: hardMeander ignorowany (:6111)", "K"),
    ("C09", CG, "let mut score = (nd * 28) as f64;", "let mut score = (nd * 27) as f64;",
     "collect: mnoznik 28 -> 27 (:6115)", "K"),
    ("C10", CG, "    if nd > cur_d {\n            score += 18.0;", "    if nd >= cur_d {\n            score += 18.0;",
     "collect: gałąź nd>curD -> >= (:6116)", "K"),
    ("C11", CG, "score += 18.0;\n        } else if nd == cur_d {", "score += 17.0;\n        } else if nd == cur_d {",
     "collect: bonus +18 -> +17 (:6116)", "K"),
    ("C12", CG, "score += if center_step > 8 {", "score += if center_step > 7 {",
     "collect: prog centerStep > 8 -> 7 (:6118)", "K"),
    ("C13", CG, "                22.0\n", "                21.0\n",
     "collect: +22 -> +21 (:6118)", "K"),
    ("C14", CG, "                -36.0", "                -35.0",
     "collect: -36 -> -35 (:6118)", "K"),
    ("C15", CG, "            } else {\n                2.0", "            } else {\n                3.0",
     "collect: +2 -> +3 (:6118)", "K"),
    ("C16", CG, "} else if nd == cur_d {", "} else if nd == -999 {",
     "collect: gałąź nd==curD wylaczona (:6117)", "K"),
    ("C17", CG, "score += center_step as f64 * 6.5;", "score += center_step as f64 * 6.0;",
     "collect: waga centerStep 6.5 -> 6.0 (:6121)", "K"),
    ("C18", CG, "if center_step < 0 {\n            score -= 18.0;", "if center_step <= 0 {\n            score -= 18.0;",
     "collect: kara centerStep < 0 -> <= 0 (:6122)", "K"),
    ("C19", CG, "score -= 18.0;", "score -= 17.0;",
     "collect: kara -18 -> -17 (:6122)", "K"),
    ("C20", CG, "score += rand() * 0.35;\n        out.push", "score += rand() * 0.36;\n        out.push",
     "collect: szum rand*0.35 -> 0.36 (:6123)", "K"),
    ("C21", CG, "let cur_d = o.sea_dist.get(&cur_key).copied().unwrap_or(0);",
     "let cur_d = o.sea_dist.get(&cur_key).copied().unwrap_or(1);",
     "collect: brak seaDist(cur) -> 1 zamiast 0 (:6100)", "K"),
    # --- coast_grow.rs: growRiverFromCoastInland (web :6181-6228)
    ("G01", CG, "while path.len() < p.step_cap {", "while path.len() <= p.step_cap {",
     "grow: cap stepCap N -> N+1 (:6204)", "K"),
    ("G02", CG, "let hard_meander = path.len() < p.hard_meander_len;",
     "let hard_meander = path.len() <= p.hard_meander_len;",
     "grow: hardMeanderLen granica (:6206)", "K"),
    ("G03", CG, "        if candidates.is_empty() {\n            let relaxed", "        if false {\n            let relaxed",
     "grow: fallback relaxHardMeander pominiety (:6215)", "K"),
    ("G04", CG, "relax_hard_meander: true,", "relax_hard_meander: false,",
     "grow: relaxed przebieg bez relaksu (:6216)", "K"),
    ("G05", CG, "let mut candidates: Vec<GrowCandidate> = collect_coast_inland_grow_candidates(&base, rand)\n            .into_iter()\n            .filter(|c| !visited.contains(&hex_key(c.q, c.r)))",
     "let mut candidates: Vec<GrowCandidate> = collect_coast_inland_grow_candidates(&base, rand)\n            .into_iter()\n            .filter(|_c| true)",
     "grow: filtr visited (przebieg 1) usuniety (:6214)", "K"),
    ("G06", CG, "collect_coast_inland_grow_candidates(&relaxed, rand)\n                .into_iter()\n                .filter(|c| !visited.contains(&hex_key(c.q, c.r)))",
     "collect_coast_inland_grow_candidates(&relaxed, rand)\n                .into_iter()\n                .filter(|_c| true)",
     "grow: filtr visited (przebieg relaxed) usuniety (:6217)", "K"),
    ("G07", CG, "if candidates.is_empty() {\n            break;\n        }",
     "if candidates.is_empty() && false {\n            break;\n        }",
     "grow: break przy braku kandydatow usuniety (:6219) - panika zamiast konca", "K"),
    ("G08", CG, "candidates.sort_by(cmp_candidates_desc);", "// sort usuniety",
     "grow: sortowanie kandydatow usuniete (:6221)", "K"),
    ("G09", CG, "let bound = candidates.len().min(3) as f64;", "let bound = candidates.len().min(4) as f64;",
     "grow: okno losowania min(3,len) -> min(4,len) (:6222)", "K"),
    ("G10", CG, "(candidates.len() - 1).min(idx_f)", "(candidates.len() - 1).min(idx_f + 1)",
     "grow: indeks wyboru +1 (:6222)", "K"),
    ("G11", CG, "        visited.insert(hex_key(pick.q, pick.r));", "        let _ = 0;",
     "grow: oznaczenie wybranego heksa jako odwiedzony usuniete (:6225)", "K"),
    ("G12", CG, "visited.insert(mouth_key.clone());", "let _ = 0;",
     "grow: ujscie nieoznaczone jako odwiedzone (:6199)", "K"),
    ("G13", CG, "        .or_else(|| p.land_center_square.map(|s| s.centroid))\n", "",
     "grow: galaz landCenterSquare (centroid kwadratu) usunieta (:6201)", "L"),
    ("G14", CG, "                CENTROID_VISIT_CAP,\n            )", "                CENTROID_VISIT_CAP / 2,\n            )",
     "grow: visitCap estimateLandCentroidFromMouth 6000 -> 3000 (:6202) - L: cap nieosiagalny na mapach <=127 hexow", "L"),
    # --- coast_grow.rs: meander/ edges - meander.rs (web :6485-6519)
    ("M01", MN, "if nk == tgt_k || used.contains(&nk) {", "if nk == tgt_k {",
     "meander: pominiecie 'used' usuniete (:6503)", "K"),
    ("M02", MN, "if nk == tgt_k || used.contains(&nk) {", "if used.contains(&nk) {",
     "meander: pominiecie celu usuniete (:6503) - E: sasiad==cel nie dotyka celu (touches=false)", "E"),
    ("M03", MN, "if same_river_dir((dq, dr), to_target) {", "if false {",
     "meander: filtr kierunku celu usuniety (:6504)", "K"),
    ("M04", MN, "if !can_river_flow_through(hexes.get(&nk), &nk, \"\", true, None, false) {",
     "if can_river_flow_through(hexes.get(&nk), &nk, \"\", true, None, false) {",
     "meander: przechodnosc odwrocona (:6507)", "K"),
    ("M05", MN, "if !can_river_flow_through(hexes.get(&nk), &nk, \"\", true, None, false) {",
     "if !can_river_flow_through(hexes.get(&nk), &nk, \"\", false, None, false) {",
     "meander: blockExisting=false (:6507)", "K"),
    ("M06", MN, "let Some(&nd) = sea_dist.get(&nk) else {\n            continue;\n        };",
     "let nd: i64 = sea_dist.get(&nk).copied().unwrap_or(0);",
     "meander: brak seaDist(nk) -> 0 zamiast pominiecia (:6509) - E: 0 < RIVER_MIN_INLAND (2) odrzuca", "E"),
    ("M07", MN, "if nd > cur_d {", "if nd >= cur_d {",
     "meander: nd > curD -> >= (:6509)", "K"),
    ("M08", MN, "if nd < RIVER_MIN_INLAND_FROM_SEA {", "if nd <= RIVER_MIN_INLAND_FROM_SEA {",
     "meander: prog MIN_INLAND <= (:6510)", "K"),
    ("M09", MN, "if !touches_target {", "if touches_target {",
     "meander: filtr dotykania celu odwrocony (:6514)", "K"),
    ("M10", MN, ".any(|&(eq, er)| nq + i64::from(eq) == target.q && nr + i64::from(er) == target.r)",
     ".any(|&(eq, er)| nq + i64::from(eq) == target.q || nr + i64::from(er) == target.r)",
     "meander: warunek dotykania && -> || (:6512)", "K"),
    ("M11", MN, "let cur_d = sea_dist.get(&cur_k).copied().unwrap_or(999);",
     "let cur_d = sea_dist.get(&cur_k).copied().unwrap_or(0);",
     "meander: brak seaDist(cur) -> 0 zamiast 999 (:6494)", "K"),
    ("M12", MN, "if opts.is_empty() {\n        return None;\n    }", "if opts.is_empty() && false {\n        return None;\n    }",
     "meander: zwrot null przy pustych opcjach usuniety (:6518) - panika", "K"),
    ("M13", MN, ".min(opts.len() - 1);", ";",
     "meander: klamra indeksu usunieta (:6519) - E: rand()<1, floor(rand*len)<len", "E"),
    ("M14", MN, "    if opts.is_empty() {\n        return None;", "    let _ = rand();\n    if opts.is_empty() {\n        return None;",
     "meander: rand() zuzyte takze przy pustych opcjach (wywolanie pojedyncze w harnessie) - L: harness nie testuje wspoldzielonego rand", "L"),
    ("M15", MN, ".any(|&(eq, er)| nq + i64::from(eq) == target.q && nr + i64::from(er) == target.r)",
     ".any(|&(eq, er)| nq + i64::from(eq) == target.q && nr + i64::from(er) != target.r)",
     "meander: warunek dotykania (drugi operand) zanegowany (:6512)", "K"),
    # --- window.rs: sanitizeRiverTurnWindow (web :7094-7119)
    ("W01", WD, "if deltas[i].abs() > 1 {\n                cut_at = i as i64 + 1;",
     "if deltas[i].abs() > 2 {\n                cut_at = i as i64 + 1;",
     "window: prog |delta| > 1 -> 2 (:7105)", "K"),
    ("W02", WD, "if i + 1 >= RIVER_TURN_WINDOW_HEX {", "if i + 1 > RIVER_TURN_WINDOW_HEX {",
     "window: granica okna (i+1 >= 6) -> > 6 (:7106)", "K"),
    ("W03", WD, "if sum.abs() > RIVER_TURN_WINDOW_MAX_SUM {\n                    cut_at = i as i64 + 1;",
     "if sum.abs() >= RIVER_TURN_WINDOW_MAX_SUM {\n                    cut_at = i as i64 + 1;",
     "window: |suma| > 1 -> >= 1 (:7108)", "K"),
    ("W04", WD, "if sum.abs() > RIVER_TURN_WINDOW_MAX_SUM {\n                    cut_at = i as i64 + 1;",
     "if sum.abs() > RIVER_TURN_WINDOW_MAX_SUM {\n                    cut_at = i as i64;",
     "window: indeks ciecia okna -1 (:7109)", "K"),
    ("W05", WD, "if cut_at <= 0 || cut_at >= out.len() as i64 - 1 {", "if cut_at <= 0 {",
     "window: break przy ciecie na koncu usuniety (:7114)", "K"),
    ("W06", WD, "while guard < 48 && out.len() >= 3 {", "while guard < 47 && out.len() >= 3 {",
     "window: cap 48 -> 47 (N-1) (:7100) - L: maks. iteracji w wektorach ponizej 47 (zmierzono w dossier)", "L"),
    ("W07", WD, "if !river_path_violates_turn_window(", "if river_path_violates_turn_window(",
     "window: negacja warunku 'brak naruszen' (:7101)", "K"),
    ("W08", WD, "out = repair_river_path_adjacency(&out, hexes, source_key);", "let _ = hexes;",
     "window: naprawa sasiedztwa pominieta (:7116)", "K"),
    ("W09", WD, "out = sanitize_river_path(&next);", "out = next.clone();",
     "window: sanityzacja po cieciu pominieta (:7115)", "K"),
    # --- edges.rs (web :7122-7249)
    ("E01", ED, "    if h.terrain == Terrain::Sea {\n        return false;", "    if false {\n        return false;",
     "canReceive: brak zwrotu dla Morza (:7123) - E: is_dry(Sea)=false i Sea != ShallowSea", "E"),
    ("E02", ED, "is_dry_land_terrain(h.terrain) || h.terrain == Terrain::ShallowSea",
     "is_dry_land_terrain(h.terrain)",
     "canReceive: PlytkieMorze pominiete (:7124)", "K"),
    ("E03", ED, "    if edge_idx < 0 {\n        return;\n    }\n    let key = hex_key(q, r);",
     "    if false {\n        return;\n    }\n    let key = hex_key(q, r);",
     "markRiverEdge: edgeIdx<0 guard usuniety (:7128) - E: u8::try_from(-1) zwraca Err", "E"),
    ("E04", ED, "if !can_receive_river_yield_mark(Some(&*hex)) {", "if false {",
     "markRiverEdge: guard canReceive usuniety (:7130)", "K"),
    ("E05", ED, "if !hex.river_edges.contains(&e) {", "if true {",
     "markRiverEdge: deduplikacja krawedzi usunieta (:7132)", "K"),
    ("E06", ED, "hex.river_present = !hex.river_edges.is_empty();", "hex.river_present = true;",
     "markRiverEdge: obecna = true zamiast !empty (:7133) - E: po push krawedzie zawsze niepuste", "E"),
    ("E07", ED, "pub fn mark_river_edge_pair(hexes: &mut HexRecord, q: i64, r: i64, edge_idx: i64) {\n    if edge_idx < 0 {\n        return;\n    }",
     "pub fn mark_river_edge_pair(hexes: &mut HexRecord, q: i64, r: i64, edge_idx: i64) {",
     "markRiverEdgePair: guard edgeIdx<0 usuniety (:7138) - E: mark_river_edge(-1) no-op, get(usize) None", "E"),
    ("E08", ED, "        (edge_idx + 3) % 6,", "        (edge_idx + 2) % 6,",
     "markRiverEdgePair: przeciwna krawedz (+3) -> (+2) (:7142)", "K"),
    ("E09", ED, "    if cw {\n        (from + 1) % 6", "    if !cw {\n        (from + 1) % 6",
     "riverHexCornerStep: kierunek odwrocony (:7147)", "K"),
    ("E10", ED, "    if from_corner == to_corner {", "    if false {",
     "walkRiverHexPerimeter: wczesny zwrot dla from==to usuniety (:7151) - E: petla zwraca to samo", "E"),
    ("E11", ED, "    for _ in 0..7 {", "    for _ in 0..5 {",
     "walkRiverHexPerimeter: cap 7 -> 5 (N-1) (:7154) - zabija przypadki 6-wpisowe", "K"),
    ("E12", ED, "    if a == b {\n        return Vec::new();", "    if false {\n        return Vec::new();",
     "riverCornersAlongHexEdges: wczesny zwrot a==b usuniety (:7169)", "K"),
    ("E13", ED, "if score == best_score && hex_parity % 2 == 0 {", "if score == best_score && hex_parity % 2 == 1 {",
     "riverCornersAlongHexEdges: parzystosc odwrocona (:7183)", "K"),
    ("E14", ED, "score += if cw { 0.0 } else { 0.01 };", "score += if cw { 0.01 } else { 0.0 };",
     "riverCornersAlongHexEdges: tie-break parzystosci cw/ccw zamieniony (:7183)", "K"),
    ("E15", ED, "if walked.len() - 1 < MIN_BOKI {", "if walked.len() - 1 <= MIN_BOKI {",
     "riverCornersAlongHexEdges: prog MIN_BOKI <= (:7186)", "K"),
    ("E16", ED, "if score < best_score {", "if score <= best_score {",
     "riverCornersAlongHexEdges: remis nadpisuje best (:7187)", "K"),
    ("E17", ED, "if score < fallback_score {", "if score <= fallback_score {",
     "riverCornersAlongHexEdges: remis nadpisuje fallback (:7185)", "K"),
    ("E18", ED, "    if best.is_empty() {\n        fallback", "    if false {\n        fallback",
     "riverCornersAlongHexEdges: wybor fallback usuniety (:7191)", "K"),
    ("E19", ED, "for cw in [true, false] {", "for cw in [false, true] {",
     "riverCornersAlongHexEdges: kolejnosc cw/ccw odwrocona (:7179)", "K"),
    ("E20", ED, "let entry_opts = [(a + 1) % 6, (a + 2) % 6];", "let entry_opts = [(a + 2) % 6, (a + 1) % 6];",
     "riverCornersAlongHexEdges: kolejnosc wejsc (:7170)", "K"),
    ("E21", ED, "if c2 == (c1 + 1) % 6 {", "if c2 == (c1 + 2) % 6 {",
     "riverEdgeBetweenCorners: galaz +1 (:7196)", "K"),
    ("E22", ED, "return (c1 + 5) % 6;", "return (c1 + 4) % 6;",
     "riverEdgeBetweenCorners: wynik galezi +1 (:7196)", "K"),
    ("E23", ED, "if c2 == (c1 + 5) % 6 {", "if c2 == (c1 + 4) % 6 {",
     "riverEdgeBetweenCorners: galaz -1 (:7197)", "K"),
    ("E24", ED, "if corners.len() < 2 {", "if corners.len() < 1 {",
     "riverTransitEdgeIndices: prog len<2 -> <1 (:7204) - E: petla 0..0 pusta", "E"),
    ("E25", ED, "if ei >= 0 && !edges.contains(&ei) {", "if ei >= 0 {",
     "riverTransitEdgeIndices: deduplikacja usunieta (:7208)", "K"),
    ("E26", ED, "if ei >= 0 && !edges.contains(&ei) {", "if ei > 0 && !edges.contains(&ei) {",
     "riverTransitEdgeIndices: krawedz 0 odrzucana (:7208)", "K"),
    ("E27", ED, "    if p.len() < 3 {\n        return p;", "    if p.len() < 2 {\n        return p;",
     "simplifyRiverRenderPath: prog len<3 -> <2 (:7216) - E: petla i in 1..len-1 pusta dla len 2", "E"),
    ("E28", ED, "while changed && guard < 4000 {", "while changed && guard < 3999 {",
     "simplifyRiverRenderPath: cap 4000 -> 3999 (N-1) - L: nieosiagalny (iteracje <= len sciezki <=15)", "L"),
    ("E29", ED, "            if a == c {", "            if false {",
     "simplifyRiverRenderPath: powrot a==c nieusuwany (:7224)", "K"),
    ("E30", ED, "if neighbor_dir_index(a.q, a.r, c.q, c.r) >= 0 {", "if neighbor_dir_index(a.q, a.r, c.q, c.r) < 0 {",
     "simplifyRiverRenderPath: zbedny heks - warunek sasiedztwa odwrocony (:7225)", "K"),
    ("E31", ED, "    if rp.len() < 2 {\n        return;", "    if rp.len() < 1 {\n        return;",
     "markRiverTransitEdgesOnPath: prog len<2 -> <1 (:7234) - E: petla bez krawedzi", "E"),
    ("E32", ED, "if dir_in < 0 || dir_out < 0 {", "if dir_in < 0 && dir_out < 0 {",
     "markRiverTransitEdgesOnPath: warunek pominiecia heksa (:7243)", "K"),
    ("E33", ED, "let dir_in = if i > 0 {", "let dir_in = if i > 1 {",
     "markRiverTransitEdgesOnPath: kierunek wejscia dla i=1 (:7237)", "K"),
    ("E34", ED, "let dir_out = if i < rp.len() - 1 {", "let dir_out = if i < rp.len() - 2 {",
     "markRiverTransitEdgesOnPath: kierunek wyjscia (:7240)", "K"),
    ("E35", ED, "for ei in river_transit_edge_indices(dir_in, dir_out, cur.q + cur.r) {",
     "for ei in river_transit_edge_indices(dir_in, dir_out, cur.q + cur.r + 1) {",
     "markRiverTransitEdgesOnPath: parzystosc heksa przesunieta (:7244)", "K"),
    # --- dodatkowe mutanty gałęzi nieobjętych wyzej (runda r2, lekcja d)
    ("G15", CG, "                p.allow_relief_traversal,\n                CENTROID_VISIT_CAP,",
     "                !p.allow_relief_traversal,\n                CENTROID_VISIT_CAP,",
     "grow: estimateLandCentroidFromMouth z odwroconym allowReliefTraversal (:6202)", "K"),
    ("G16", CG, "            hard_meander,\n            relax_hard_meander: false,",
     "            hard_meander: false,\n            relax_hard_meander: false,",
     "grow: hardMeander w bazowym przebiegu wylaczony (:6209)", "K"),
    ("E36", ED, "let a = dir_in.rem_euclid(6);", "let a = dir_in % 6;",
     "riverCornersAlongHexEdges: normalizacja ((d%6)+6)%6 zastapiona %6 (:7167)", "K"),
    ("E37", ED, "        if c == to_corner {\n            break;\n        }", "        if false {\n            break;\n        }",
     "walkRiverHexPerimeter: wczesne wyjscie na rogu docelowym usuniete (:7157)", "K"),
    ("E38", ED, "    let Some(h) = hex else { return false };", "    let Some(h) = hex else { return true };",
     "canReceiveRiverYieldMark: brak heksa -> true zamiast false (:7123)", "K"),
    ("W10", WD, "let mut out = sanitize_river_path(path);", "let mut out = path.to_vec();",
     "sanitizeRiverTurnWindow: wstepna sanityzacja pominieta (:7099)", "K"),
]


def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def log(line):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(line, flush=True)


def run_tests():
    env = dict(os.environ)
    env.update({"CARGO_TARGET_DIR": "/dev/shm/m07b2-r2-target", "CARGO_INCREMENTAL": "0",
                "CARGO_PROFILE_DEV_DEBUG": "0", "CARGO_PROFILE_TEST_DEBUG": "0"})
    try:
        p = subprocess.run(
            ["cargo", "test", "--no-fail-fast", "--test", "p6_m07b2_coast", "--test", "p6_m07b2_edges"],
            cwd=ENGINE, env=env, capture_output=True, text=True, timeout=420)
    except subprocess.TimeoutExpired:
        return "TIMEOUT", "timeout 420s"
    out = p.stdout + p.stderr
    if " error[" in out or "could not compile" in out:
        return "BUILD-FAIL", "compile error"
    if p.returncode == 0:
        return "SURVIVED", "all green"
    failed = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and l.strip().endswith("FAILED")]
    panics = [l for l in out.splitlines() if "panicked" in l]
    return "KILLED", ("; ".join(failed) or "no FAILED line") + (" | panic" if panics else "")


def main(argv):
    if len(argv) >= 2 and argv[1] == "list":
        for i, m in enumerate(MUTANTS):
            print(i, m[0], m[1], m[5], m[4])
        return 0
    lo, hi = int(argv[1]), int(argv[2])
    for idx in range(lo, min(hi, len(MUTANTS))):
        mid, rel, old, new, desc, exp = MUTANTS[idx]
        path = os.path.join(ENGINE, rel)
        orig = open(path, "rb").read()
        orig_sha = hashlib.sha256(orig).hexdigest()
        text = orig.decode("utf-8")
        cnt = text.count(old)
        if cnt != 1:
            log(f"{mid} | {rel} | ASSERT-FAIL count={cnt} | {desc}")
            continue
        try:
            with open(path, "wb") as f:
                f.write(text.replace(old, new, 1).encode("utf-8"))
            verdict, detail = run_tests()
        finally:
            with open(path, "wb") as f:
                f.write(orig)
            restored = sha(path) == orig_sha
        if not restored:
            log(f"{mid} | RESTORE-FAIL")
            return 2
        log(f"{mid} | {verdict} | oczek={exp} | {desc} | {detail} | RESTORED={restored}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
