#!/usr/bin/env python3
"""Mutacje P6.M06A5 partia 1 (landsea.rs + mapgen-landsea-fill.json).
Kazda mutacja: jedna zamiana tekstu (liczba wystapien oczekiwana), cargo test --test p6_m06a5_landfrac,
KILLED gdy test czerwony, SURVIVED gdy zielony. Plik przywracany po kazdej mutacji, SHA sprawdzane.
Uzycie: python3 -I mut.py <LOG> [id1,id2,...]   (cwd = rust-port/engine)
"""
import hashlib, os, subprocess, sys, time

LIB = "src/domain/mapgen/landsea.rs"
JSN = "data/derived/mapgen-landsea-fill.json"

M = [
 # --- wartosci / dane (JSON) ---
 ("json-clamp-max-0.8501", JSN, '"clamp_udzialu_max": 0.85,', '"clamp_udzialu_max": 0.8501,', 1),
 ("json-clamp-max-0.8499", JSN, '"clamp_udzialu_max": 0.85,', '"clamp_udzialu_max": 0.8499,', 1),
 ("json-clamp-min-0.1501", JSN, '"clamp_udzialu_min": 0.15,', '"clamp_udzialu_min": 0.1501,', 1),
 ("json-clamp-min-0.1499", JSN, '"clamp_udzialu_min": 0.15,', '"clamp_udzialu_min": 0.1499,', 1),
 ("json-tol-score-0.0401", JSN, '"tolerancja_score_sortowanie": 0.04,', '"tolerancja_score_sortowanie": 0.0401,', 1),
 ("json-tol-score-0.0399", JSN, '"tolerancja_score_sortowanie": 0.04,', '"tolerancja_score_sortowanie": 0.0399,', 1),
 ("json-tol-centrum-0.0151", JSN, '"tolerancja_odleglosci_centrum": 0.015', '"tolerancja_odleglosci_centrum": 0.0151', 1),
 ("json-tol-centrum-0.0149", JSN, '"tolerancja_odleglosci_centrum": 0.015', '"tolerancja_odleglosci_centrum": 0.0149', 1),
 ("json-pangea-min-0.1101", JSN, '"pangea_min_score_wypelnienia": 0.11,', '"pangea_min_score_wypelnienia": 0.1101,', 1),
 ("json-pangea-min-0.1099", JSN, '"pangea_min_score_wypelnienia": 0.11,', '"pangea_min_score_wypelnienia": 0.1099,', 1),
 # --- clamp / NaN / round ---
 ("clamp-off", LIB, "    let clamped = target_land_fraction.clamp(fill.clamp_udzialu_min, fill.clamp_udzialu_max);",
  "    let clamped = target_land_fraction;", 1),
 ("nan-guard-off", LIB, "    if clamped.is_nan() {\n        return 0;", "    if false {\n        return 0;", 1),
 ("round-floor", LIB, "    let target_land = js_round(total as f64 * clamped) as i64;",
  "    let target_land = (total as f64 * clamped).floor() as i64;", 1),
 # --- petle sterujace: granice porownan ---
 ("grow-lt-to-le", LIB, "    if land < target_land {\n        // Wzrost", "    if land <= target_land {\n        // Wzrost", 1),
 ("erode-gt-to-ge", LIB, "    } else if land > target_land {", "    } else if land >= target_land {", 1),
 ("erode-break-lt", LIB, "            if land <= target_land {\n                break;", "            if land < target_land {\n                break;", 1),
 ("grow-break-gt", LIB, "        for k in &candidates {\n            if land >= target_land {", "        for k in &candidates {\n            if land > target_land {", 1),
 ("grow-no-border-filter", LIB, "            .filter(|k| is_sea(hexes, k) && border_ok(k) && mask_ok(k))", "            .filter(|k| is_sea(hexes, k) && mask_ok(k))", 1),
 ("interior-pass-off", LIB, "        if land < target_land && has_border {", "        if false && land < target_land && has_border {", 1),
 ("interior-no-border-gate", LIB, "        if land < target_land && has_border {", "        if land < target_land {", 1),
 ("interior-threshold-ge", LIB, "hex_border_distance(q as f64, r as f64, wf, hf) > map_margin_land_zone_hexes()",
  "hex_border_distance(q as f64, r as f64, wf, hf) >= map_margin_land_zone_hexes()", 1),
 ("interior-threshold-minus1", LIB, "hex_border_distance(q as f64, r as f64, wf, hf) > map_margin_land_zone_hexes()",
  "hex_border_distance(q as f64, r as f64, wf, hf) > map_margin_land_zone_hexes() - 1.0", 1),
 ("interior-sort-reversed", LIB, "js_array_sort_by(&mut interior, |a, b| score(b) - score(a));",
  "js_array_sort_by(&mut interior, |a, b| score(a) - score(b));", 1),
 ("border-ok-invert", LIB, "        !is_in_map_border(q as f64, r as f64, wf, hf, None)", "        is_in_map_border(q as f64, r as f64, wf, hf, None)", 1),
 ("border-buffer-3", LIB, "        !is_in_map_border(q as f64, r as f64, wf, hf, None)", "        !is_in_map_border(q as f64, r as f64, wf, hf, Some(3.0))", 1),
 ("border-buffer-1", LIB, "        !is_in_map_border(q as f64, r as f64, wf, hf, None)", "        !is_in_map_border(q as f64, r as f64, wf, hf, Some(1.0))", 1),
 ("mask-ge-to-gt", LIB, "|| score(k) >= min_mask_fill_score", "|| score(k) > min_mask_fill_score", 1),
 ("tol-score-ge", LIB, "            if (sb - sa).abs() > fill.tolerancja_score_sortowanie {",
  "            if (sb - sa).abs() >= fill.tolerancja_score_sortowanie {", 1),
 ("tol-score-off", LIB, "            if (sb - sa).abs() > fill.tolerancja_score_sortowanie {",
  "            if false {", 1),
 ("mask-tie-reversed", LIB, "                return f64::from(locale_compare(a, b));", "                return f64::from(locale_compare(b, a));", 1),
 ("center-tiebreak-reversed", LIB, "            da - db\n        });", "            db - da\n        });", 1),
 ("rebal-bias-mask", LIB, "            LandFractionFillBias::Center,\n            fill_min,", "            LandFractionFillBias::Mask,\n            fill_min,", 1),
 ("rebal-one-pass", LIB, "    for _ in 0..2 {", "    for _ in 0..1 {", 1),
 ("rebal-no-ring", LIB, "    apply_double_coast_ring(hexes);\n}", "}", 1),
 ("rebal-caps-enforce-swap", LIB, "        apply_marginal_land_zone_caps(hexes, land_scores, width, height, &hooks);\n        enforce_map_border_ocean(hexes, width, height, None);",
  "        enforce_map_border_ocean(hexes, width, height, None);\n        apply_marginal_land_zone_caps(hexes, land_scores, width, height, &hooks);", 1),
 # --- sortowanie erozji ---
 ("sort-ba-reversed", LIB, "        if ba != bb {\n            return ba - bb;", "        if ba != bb {\n            return bb - ba;", 1),
 ("sort-center-reversed", LIB, "            return cb - ca;", "            return ca - cb;", 1),
 ("sort-center-tol-ge", LIB, "        if (ca - cb).abs() > tol {", "        if (ca - cb).abs() >= tol {", 1),
 ("sort-center-tol-off", LIB, "        if (ca - cb).abs() > tol {", "        if false {", 1),
 ("sort-na-reversed", LIB, "        if na != nb {\n            return nb - na;", "        if na != nb {\n            return na - nb;", 1),
 ("sort-rank-reversed", LIB, "            return rka as f64 - rkb as f64;", "            return rkb as f64 - rka as f64;", 1),
 ("sort-input-reversed", LIB, "    let mut items: Vec<String> = keys.to_vec();", "    let mut items: Vec<String> = keys.iter().rev().cloned().collect();", 1),
 ("sort-default-score-1", LIB, "land_scores.get(a).copied().unwrap_or(0.0) - land_scores.get(b).copied().unwrap_or(0.0)",
  "land_scores.get(a).copied().unwrap_or(1.0) - land_scores.get(b).copied().unwrap_or(1.0)", 1),
 ("sort-dims-zero-default", LIB, "    let (sort_w, sort_h) = dims.unwrap_or((1, 1));", "    let (sort_w, sort_h) = dims.unwrap_or((0, 0));", 1),
 # --- assign ---
 ("assign-dw-no-minus1", LIB, "    let dw = f64::from(width.saturating_sub(1).max(1));", "    let dw = f64::from(width.max(1));", 1),
 ("assign-dh-no-minus1", LIB, "    let dh = f64::from(height.saturating_sub(1).max(1));", "    let dh = f64::from(height.max(1));", 1),
]

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def main():
    log = sys.argv[1]
    only = set(sys.argv[2].split(',')) if len(sys.argv) > 2 and sys.argv[2] else None
    os.environ.update(CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0',
                      CARGO_TARGET_DIR='/home/user/cargo-target-shared/wf_de4c1f1c-5c7-2')
    base = {p: sha(p) for p in {LIB, JSN}}
    with open(log, 'a') as L:
        for mid, path, old, new, cnt in M:
            if only and mid not in only:
                continue
            src = open(path, 'rb').read().decode('utf-8')
            n = src.count(old)
            if n != cnt:
                L.write(f"{mid}\tBLAD-KOTWICY\tfound={n} expected={cnt}\n"); L.flush(); continue
            t0 = time.time()
            open(path, 'wb').write(src.replace(old, new).encode('utf-8'))
            try:
                p = subprocess.run(['cargo', 'test', '--test', 'p6_m06a5_landfrac'],
                                   capture_output=True, text=True, timeout=540)
                out = p.stdout + p.stderr
                if 'error[' in out or 'could not compile' in out:
                    res = 'BLAD-KOMPILACJI'
                elif p.returncode != 0:
                    failed = [l.strip() for l in out.splitlines() if l.strip().startswith('test ') and 'FAILED' in l]
                    res = f"KILLED ({len(failed)} failed: {'; '.join(f.split(' ')[1] for f in failed[:4])})"
                else:
                    res = 'SURVIVED'
            except subprocess.TimeoutExpired:
                res = 'TIMEOUT'
            finally:
                open(path, 'wb').write(src.encode('utf-8'))
            L.write(f"{mid}\t{res}\t{int(time.time()-t0)}s\n"); L.flush()
    for p, h in base.items():
        assert sha(p) == h, f"RESTORE FAILED {p}"
    L.close() if False else None
    with open(log, 'a') as L:
        L.write("RESTORE-OK sha256 landsea.rs + mapgen-landsea-fill.json identical to start\n")

if __name__ == '__main__':
    main()
