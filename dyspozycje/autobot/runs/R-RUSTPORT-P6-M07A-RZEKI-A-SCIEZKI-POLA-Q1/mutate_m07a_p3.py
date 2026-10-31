# Mutacje partii 2+3 P6.M07A (rivers_a/walk.rs, rivers_a/grow.rs, rivers_a/profile.rs).
# Kazda mutacja = jedna podmiana tekstu w pliku zrodlowym (old musi wystapic dokladnie raz),
# potem `cargo test` na wskazanych binarkach testowych; mutant ZABITY, gdy test zwroci blad
# (kod != 0) lub przekroczy limit czasu (zawieszenie). Plik jest przywracany po kazdej mutacji.
# Uzycie: python3 -I mutate_m07a_p3.py <ENGINE_DIR> <OD> <DO> <WYNIK.txt>
import os
import subprocess
import sys

WALK = "src/domain/mapgen/rivers_a/walk.rs"
GROW = "src/domain/mapgen/rivers_a/grow.rs"
PROF = "src/domain/mapgen/rivers_a/profile.rs"
T_WALK = ["--test", "p6_m07a_walk", "--test", "p6_m07a_cap", "--test", "p6_m07a_grow"]
T_GROW = ["--test", "p6_m07a_grow"]
T_PROF = ["--test", "p6_m07a_grow"]

# (id, plik, old, new, uwaga, testy)
MUT = [
    ("W01", WALK, "if ocean_connected.contains(nk) {", "if false && ocean_connected.contains(nk) {", "can_river_drain_step: wejscie oceaniczne", T_WALK),
    ("W02", WALK, "if !post_inland_phase {", "if post_inland_phase {", "can_river_drain_step: faza", T_WALK),
    ("W03", WALK, "if nd >= RIVER_MIN_INLAND_FROM_SEA {", "if nd > RIVER_MIN_INLAND_FROM_SEA {", "can_river_drain_step: granica nd (r4 M1)", T_WALK),
    ("W04", WALK, "od <= RIVER_MOUTH_TAIL_LEN as i64", "od < RIVER_MOUTH_TAIL_LEN as i64", "can_river_drain_step: korytarz (r4 M2)", T_WALK),
    ("W05", WALK, "if ocean_connected.contains(&hex_key(q, r)) {", "if false && ocean_connected.contains(&hex_key(q, r)) {", "is_river_drainage_goal: cel oceaniczny", T_WALK),
    ("W06", WALK, "if !ocean_connected.contains(&nk) {", "if ocean_connected.contains(&nk) {", "is_river_drainage_goal: sasiad oceanu", T_WALK),
    ("W07", WALK, "if can_river_flow_through(hexes.get(&nk), &nk, source_key, false, None, false) {", "if !can_river_flow_through(hexes.get(&nk), &nk, source_key, false, None, false) {", "is_river_drainage_goal: negacja przejscia", T_WALK),
    ("W08", WALK, "source_key, false, None, false)", "source_key, true, None, false)", "is_river_drainage_goal: block_existing", T_WALK),
    ("W09", WALK, "if q > max_q {", "if q >= max_q {", "infer dims: ekwiwalent (przypisanie tej samej wartosci)", T_WALK),
    ("W10", WALK, "if r > max_r {", "if r >= max_r {", "infer dims: ekwiwalent", T_WALK),
    ("W11", WALK, "let Some(last) = path.last().copied() else {\n        return false;", "let Some(last) = path.last().copied() else {\n        return true;", "path_ends_at_sea: pusta trasa", T_WALK),
    ("W12", WALK, "let (w, h) = dims.unwrap_or_else(|| infer_map_dims_from_hexes(hexes));", "let (w, h) = dims.unwrap_or((1, 1));", "path_ends_at_sea: wymiary z inferencji", T_WALK),
    ("W13", WALK, "if ocean.contains(&hex_key(last.q, last.r)) {", "if false && ocean.contains(&hex_key(last.q, last.r)) {", "path_ends_at_sea: ostatni heks", T_WALK),
    ("W14", WALK, "if ocean.contains(&hex_key(last.q + dq as i64, last.r + dr as i64)) {", "if false && ocean.contains(&hex_key(last.q + dq as i64, last.r + dr as i64)) {", "path_ends_at_sea: sasiad", T_WALK),
    ("W15", WALK, "path.reverse();", "", "reconstruct_river_path: odwrocenie", T_WALK),
    ("W16", WALK, "while !queue.is_empty() && seen.len() < visit_cap {", "while !queue.is_empty() && seen.len() <= visit_cap {", "centroid: cap < -> <=", T_WALK),
    ("W17", WALK, "let Some((q, r)) = key_qr(&k) else {\n            continue;", "let Some((q, r)) = key_qr(&k) else {\n            break;", "centroid: galaz key_qr (ekwiwalent: klucze zawsze poprawne)", T_WALK),
    ("W18", WALK, "if is_river_land_terrain(h.terrain) {", "if !is_river_land_terrain(h.terrain) {", "centroid: liczenie ladu", T_WALK),
    ("W19", WALK, "                false,\n                None,\n                allow_relief_traversal,\n            ) {", "                true,\n                None,\n                allow_relief_traversal,\n            ) {", "centroid: block_existing w BFS", T_WALK),
    ("W20", WALK, "if count == 0 {", "if count == 1 {", "centroid: brak ladu", T_WALK),
    ("W21", WALK, "let Some((cq, cr)) = centroid else {\n        return 0;", "let Some((cq, cr)) = centroid else {\n        return 1;", "scoreCentroid: brak centroidu", T_WALK),
    ("W22", WALK, "if next_d < cur_d {\n        return 22;", "if next_d <= cur_d {\n        return 22;", "scoreCentroid: zblizenie <=", T_WALK),
    ("W23", WALK, "if next_d > cur_d {\n        return -12;", "if next_d >= cur_d {\n        return -12;", "scoreCentroid: oddalenie >=", T_WALK),
    ("W24", WALK, "let Some(sq) = square else {\n        return 0;", "let Some(sq) = square else {\n        return 1;", "scoreSquare: brak kwadratu", T_WALK),
    ("W25", WALK, "if sq.has(&hex_key(nq, nr)) {", "if false && sq.has(&hex_key(nq, nr)) {", "scoreSquare: krok na kwadrat (40)", T_WALK),
    ("W26", WALK, "if next_d < cur_d {\n        return 32;", "if next_d <= cur_d {\n        return 32;", "scoreSquare: zblizenie <=", T_WALK),
    ("W27", WALK, "if next_d > cur_d {\n        return -22;", "if next_d >= cur_d {\n        return -22;", "scoreSquare: oddalenie >=", T_WALK),
    ("W28", WALK, "if square.is_some() {", "if false && square.is_some() {", "scoreLandCenter: galaz kwadratu", T_WALK),
    ("W29", WALK, "Terrain::Desert => \"pustynia\",", "Terrain::Desert => \"polarny\",", "audit: nazwa terenu", T_WALK),
    ("W30", WALK, "*by_teren.entry(teren_bazowy_name(h.terrain)).or_insert(0) += 1;", "*by_teren.entry(teren_bazowy_name(h.terrain)).or_insert(0) += 2;", "audit: licznik", T_WALK),
    ("W31", WALK, "if visited.contains(start) {", "if false && visited.contains(start) {", "audit: pomijanie odwiedzonych startow", T_WALK),
    ("W32", WALK, "if visited.contains(&nk) || !inland_set.contains(nk.as_str()) {", "if visited.contains(&nk) || false {", "audit: filtr wewnetrznego morza", T_WALK),
    ("W33", WALK, "let Some((q, r)) = key_qr(&cur) else {\n                continue;", "let Some((q, r)) = key_qr(&cur) else {\n                break;", "audit: galaz key_qr (ekwiwalent)", T_WALK),
    ("W34", WALK, "((new_dir - last_dir) % 6 + 6) % 6", "((new_dir - last_dir) % 6 + 6) % 5", "river_hex_dir_delta: modulo", T_WALK),
    ("W35", WALK, "    a == b\n", "    a.0 == b.0\n", "same_river_dir: porownanie", T_WALK),
    ("W36", WALK, "matches!(t, Terrain::Mountains | Terrain::Hills)", "matches!(t, Terrain::Mountains)", "is_relief_river_source: wzgorza", T_WALK),
    ("W37", WALK, "(max_q + 1, max_r + 1)", "(max_q, max_r + 1)", "infer dims: wynik", T_WALK),
    ("W38", WALK, "pub const CENTROID_VISIT_CAP: usize = 6000;", "pub const CENTROID_VISIT_CAP: usize = 5999;", "cap centroidu (domyslny)", T_WALK),
    ("W39", WALK, "estimate_land_centroid_from_seed(hexes, mq, mr, allow_relief_traversal, visit_cap)", "estimate_land_centroid_from_seed(hexes, mq, mr, allow_relief_traversal, CENTROID_VISIT_CAP)", "centroid mouth: cap przekazywany", T_WALK),
    ("W40", WALK, "(dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0", "(dq.abs() + dr.abs() + (dq + dr).abs()) / 2.5", "hex_axial_distance_f: odleglosc", T_WALK),
    ("G01", GROW, "if raw <= 3 {", "if raw < 3 {", "signed_river_dir_delta: granica 3", T_GROW),
    ("G02", GROW, "if step_signed.abs() > 1 {", "if step_signed.abs() > 2 {", "okno: krok +-60", T_GROW),
    ("G03", GROW, "if dirs.is_empty() {\n        return true;", "if dirs.is_empty() {\n        return false;", "okno: trasa jednoheksowa", T_GROW),
    ("G04", GROW, "if step_dir < 0 {\n        return false;", "if step_dir < 0 {\n        return true;", "okno: krok nie-sasiedni", T_GROW),
    ("G05", GROW, "sum.abs() <= RIVER_TURN_WINDOW_MAX_SUM", "sum.abs() < RIVER_TURN_WINDOW_MAX_SUM", "okno: suma <= 1", T_GROW),
    ("G06", GROW, "let start = deltas.len().saturating_sub(RIVER_TURN_WINDOW_HEX);", "let start = deltas.len().saturating_sub(RIVER_TURN_WINDOW_HEX - 1);", "okno: dlugosc slice", T_GROW),
    ("G07", GROW, "pub const RIVER_TURN_WINDOW_HEX: usize = 6;", "pub const RIVER_TURN_WINDOW_HEX: usize = 5;", "okno: stala 6", T_GROW),
    ("G08", GROW, "return i as i64;", "return i as i64 + 1;", "neighbor_dir_index: indeks", T_GROW),
    ("G09", GROW, "if d >= 0 {", "if d >= 1 {", "path_segment_dirs: kierunek 0 pominiety", T_GROW),
    ("G10", GROW, "if ring > 0 && dq.abs() != ring && dr.abs() != ring {", "if false && ring > 0 && dq.abs() != ring && dr.abs() != ring {", "nearest: skan pierscienia (ekwiwalent: min bez zmian)", T_GROW),
    ("G11", GROW, "if best.is_none_or(|b| d < b) {", "if best.is_none_or(|b| d <= b) {", "nearest: remis (ekwiwalent: ta sama wartosc)", T_GROW),
    ("G12", GROW, "if b <= ring * RIVER_SPATIAL_CELL {", "if b < ring * RIVER_SPATIAL_CELL {", "nearest: warunek przerwania", T_GROW),
    ("G13", GROW, "if self.count == 0 {", "if false && self.count == 0 {", "nearest: pusty indeks (ekwiwalent)", T_GROW),
    ("G14", GROW, "const RIVER_SPATIAL_MAX_RING: i64 = 24;", "const RIVER_SPATIAL_MAX_RING: i64 = 23;", "nearest: granica pierscieni N-1", T_GROW),
    ("G15", GROW, "if idx.size() > 0 {", "if idx.size() > 1 {", "nearest: uzycie indeksu dla 1 heksu", T_GROW),
    ("G16", GROW, "if block.is_empty() || min_path_sep <= 0 {", "if min_path_sep <= 0 {", "sep: pusty blok (ekwiwalent)", T_GROW),
    ("G17", GROW, "nearest_river_hex_distance(nq, nr, block, spatial_index) >= min_path_sep as f64", "nearest_river_hex_distance(nq, nr, block, spatial_index) > min_path_sep as f64", "sep: granica >=", T_GROW),
    ("G18", GROW, "let Some(block) = block_river_keys else {\n        return true;", "let Some(block) = block_river_keys else {\n        return false;", "sep: brak bloku", T_GROW),
    ("G19", GROW, "if !is_river_window_turn_allowed(o.path, nq, nr) {", "if false && !is_river_window_turn_allowed(o.path, nq, nr) {", "collect: okno skretu", T_GROW),
    ("G20", GROW, "if !can_river_flow_through(", "if false && !can_river_flow_through(", "collect: przejscie rzeki", T_GROW),
    ("G21", GROW, "if !river_grow_step_passes_sep(nq, nr, o.block_river_keys, o.min_path_sep, o.sep_index) {", "if false && !river_grow_step_passes_sep(nq, nr, o.block_river_keys, o.min_path_sep, o.sep_index) {", "collect: separacja", T_GROW),
    ("G22", GROW, "if !o.relax_sea_buffer && nd < RIVER_MIN_INLAND_FROM_SEA {", "if !o.relax_sea_buffer && nd <= RIVER_MIN_INLAND_FROM_SEA {", "collect: bufor morza", T_GROW),
    ("G23", GROW, "if o.hard_meander && !o.relax_hard_meander && od < cur_od {", "if o.hard_meander && !o.relax_hard_meander && od <= cur_od {", "collect: twardy meander", T_GROW),
    ("G24", GROW, "if od > cur_od + 0.5 {", "if od > cur_od + 0.4 {", "collect: kara od (ekwiwalent dla calkowitych)", T_GROW),
    ("G25", GROW, "if nd > cur_d + 1 {", "if nd >= cur_d + 1 {", "collect: kara nd", T_GROW),
    ("G26", GROW, "if nd == RIVER_MIN_INLAND_FROM_SEA && od < cur_od {", "if nd == RIVER_MIN_INLAND_FROM_SEA && od <= cur_od {", "collect: bonus +8", T_GROW),
    ("G27", GROW, "score -= 18.0;", "score -= 17.0;", "collect: kara -18", T_GROW),
    ("G28", GROW, "score -= 10.0;", "score -= 11.0;", "collect: kara -10", T_GROW),
    ("G29", GROW, "score += 8.0;", "score += 9.0;", "collect: bonus +8 wartosc", T_GROW),
    ("G30", GROW, "let mut score = 1200.0 - od * 30.0;", "let mut score = 1200.0 - od * 29.0;", "collect: wzor score", T_GROW),
    ("G31", GROW, "score += rand() * 0.35;", "score += rand() * 0.36;", "collect: szum score", T_GROW),
    ("G32", GROW, ".or_else(|| p.land_center_square.map(|s| s.centroid))", ".or_else(|| None::<(f64, f64)>)", "grow: centroid z kwadratu", T_GROW),
    ("G33", GROW, "while path.len() < growth_target && path.len() < p.step_cap {", "while path.len() < growth_target && path.len() <= p.step_cap {", "grow: cap krokow N+1", T_GROW),
    ("G34", GROW, "let hard = path.len() < p.hard_meander_len;", "let hard = path.len() <= p.hard_meander_len;", "grow: granica meandru", T_GROW),
    ("G35", GROW, "if hard && path.len() < p.hard_meander_len {", "if hard {", "grow: galaz miekka (ekwiwalent: hard == len<H)", T_GROW),
    ("G36", GROW, "let span = candidates.len().min(3) as f64;", "let span = candidates.len().min(2) as f64;", "grow: losowanie z 3 najlepszych", T_GROW),
    ("G37", GROW, "soft.sort_by(cmp_candidates_desc);", "", "grow: sortowanie galezi miekkiej", T_GROW),
    ("G38", GROW, "candidates.sort_by(cmp_candidates_desc);", "", "grow: sortowanie kandydatow", T_GROW),
    ("G39", GROW, "let d = b.score - a.score;", "let d = a.score - b.score;", "komparator: kierunek", T_GROW),
    ("G40", GROW, "Some(g) => p.inland_target_len.max(g),", "Some(g) => p.inland_target_len.min(g),", "grow: inlandGrowthMax", T_GROW),
    ("G41", GROW, "if soft.is_empty() {\n                    break;", "if soft.is_empty() {\n                    continue;", "grow: pusta galaz miekka (zawieszenie = zabity przez limit)", T_GROW),
    ("P01", PROF, "if next >= b'5' {", "if next > b'5' {", "toFixed: remis w gore", T_PROF),
    ("P02", PROF, "let river_ms = s.generate_rivers_ms + s.top_up_ms;", "let river_ms = s.generate_rivers_ms;", "profil: subtotal", T_PROF),
    ("P03", PROF, "if denom > 0.0 {", "if denom >= 0.0 {", "profil: denom 0", T_PROF),
    ("P04", PROF, "std::env::var(\"CIV_RIVER_PROFILE\").as_deref() == Ok(\"1\")", "std::env::var(\"CIV_RIVER_PROFILE\").is_ok()", "profil: flaga (wartosc inna niz 1 - poza wektorami)", T_PROF),
    # (r5, dopisane po przegladzie pokrycia galezi walk.rs: galezie niezmutowane w pierwszej serii)
    ("W41", WALK, "if let Some((q, r)) = key_qr(k) {\n            path.push(RiverCoord::new(q, r));", "if let Some((q, r)) = key_qr(k).filter(|_| false) {\n            path.push(RiverCoord::new(q, r));", "reconstruct_river_path: galaz key_qr", T_WALK),
    ("W42", WALK, "if let Some(h) = hexes.get(&k) {", "if let Some(h) = hexes.get(&k).filter(|_| false) {", "centroid: galaz odczytu heksu", T_WALK),
    ("W43", WALK, "for start in &inland {", "for start in inland.iter().take(0) {", "audit: petla po startach", T_WALK),
    ("W44", WALK, "if seen.contains(&nk) {", "if false && seen.contains(&nk) {", "centroid: sprawdzenie seen (zawieszenie BFS = zabity przez limit)", T_WALK),
]


def run(engine, sel_tests, timeout_s):
    cmd = ["cargo", "test", "--no-fail-fast"] + sel_tests
    env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
    try:
        p = subprocess.run(cmd, cwd=engine, env=env, capture_output=True, text=True, timeout=timeout_s)
    except subprocess.TimeoutExpired:
        return "ZABITY-TIMEOUT", ""
    out = p.stdout + p.stderr
    if p.returncode == 0:
        return "PRZETRWAL", ""
    if "could not compile" in out and "test result" not in out:
        return "BLAD-KOMPILACJI", out
    failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
    return ("ZABITY" if failed else "ZABITY-INNY-BLAD"), "; ".join(failed[:3])


def main():
    engine, lo, hi, res_path = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    with open(res_path, "a", encoding="utf-8") as res:
        for idx in range(lo, min(hi, len(MUT))):
            mid, rel, old, new, note, tests = MUT[idx]
            path = os.path.join(engine, rel)
            with open(path, encoding="utf-8") as f:
                orig = f.read()
            n = orig.count(old)
            if n != 1:
                res.write(f"{mid}\tBLAD-DOPASOWANIA(n={n})\t{note}\n")
                res.flush()
                continue
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(orig.replace(old, new, 1))
                verdict, detail = run(engine, tests, 240)
            finally:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(orig)
            res.write(f"{mid}\t{verdict}\t{note}\t{detail}\n")
            res.flush()


if __name__ == "__main__":
    main()
