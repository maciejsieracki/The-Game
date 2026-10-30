import subprocess, sys, os
LS = "/home/user/The-Game/.claude/worktrees/wf_dd947043-660-2/rust-port/engine/src/domain/mapgen/landsea.rs"
ENV = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_TARGET_DIR="/home/user/cargo-target-shared/wf_dd947043-660-2", CARGO_PROFILE_DEV_DEBUG="0")
CWD = "/home/user/The-Game/.claude/worktrees/wf_dd947043-660-2/rust-port/engine"
MUTS = [
 ("M01-inward-le-to-lt", "(i as f64) <= max_w && (o as f64) <= max_w", "(i as f64) < max_w && (o as f64) <= max_w"),
 ("M02-outward-and-to-or", "(i as f64) <= max_w && (o as f64) <= max_w", "(i as f64) <= max_w || (o as f64) <= max_w"),
 ("M03-seaband-gt-to-ge", "if sea_band as f64 > max_w + t.fill_prog_pasma_zapas", "if sea_band as f64 >= max_w + t.fill_prog_pasma_zapas"),
 ("M04-seaband-zapas-minus1", "if sea_band as f64 > max_w + t.fill_prog_pasma_zapas", "if sea_band as f64 > max_w + t.fill_prog_pasma_zapas - 1.0"),
 ("M05-centroid-min-lt-to-le", "if n < t.fill_centroid_min_land {", "if n <= t.fill_centroid_min_land {"),
 ("M06-border-branch-inverted", "if border_depth.contains_key(key) {", "if !border_depth.contains_key(key) {"),
 ("M07-limit-minus-zapas", "let limit = max_w + zapas;", "let limit = max_w;"),
 ("M08-radial-steps-lt", "while step <= max_steps {", "while step < max_steps {"),
 ("M09-ratio-land-lt-to-le", "        if land < target_land {\n            let mut to_fill", "        if land <= target_land {\n            let mut to_fill"),
 ("M19-ratio-erode-ge-to-gt", "            if land >= target_land {\n                // Cofnij nadmiar - erozja najnizszego priorytetu na brzegu (wynik skanu wiersz po wierszu).\n", "            if land > target_land {\n                // Cofnij nadmiar - erozja najnizszego priorytetu na brzegu (wynik skanu wiersz po wierszu).\n"),
 ("M20-ratio-total-plus1", "    let target_land = js_round(total * clamped) as i64;\n    let mut adjusted = 0usize;\n    let max_layers = total.sqrt().ceil() as i64;", "    let target_land = js_round(total * clamped) as i64 + 1;\n    let mut adjusted = 0usize;\n    let max_layers = total.sqrt().ceil() as i64;"),
 ("M21-ratio-maxlayers-minus1", "    let max_layers = total.sqrt().ceil() as i64;\n\n    let mut layer", "    let max_layers = total.sqrt().ceil() as i64 - 1;\n\n    let mut layer"),
 ("M10-ratio-rank-le1-to-le0", "if erode_terrain_rank(hex.terrain) <= 1 {", "if erode_terrain_rank(hex.terrain) <= 0 {"),
 ("M11-ratio-pick-le", "best_score.is_none_or(|b| score < b)", "best_score.is_none_or(|b| score <= b)"),
 ("M12-ratio-clamp-max", "    let clamped = js_max(\n        fill.clamp_udzialu_min,\n        js_min(fill.clamp_udzialu_max, target_land_fraction),\n    );\n    let total = (width as f64) * (height as f64);\n    let target_land = js_round(total * clamped) as i64;\n    let mut adjusted = 0usize;\n    let max_layers = total.sqrt().ceil() as i64;\n\n    let mut layer = 0i64;\n    while layer < max_layers {\n        layer += 1;\n        let mut land = count_land_sea_hexes(hexes).land as i64;\n        if land == target_land {\n            break;\n        }\n\n        if land < target_land {\n            let mut to_fill", "    let clamped = js_max(\n        fill.clamp_udzialu_min,\n        js_min(fill.clamp_udzialu_max - 0.01, target_land_fraction),\n    );\n    let total = (width as f64) * (height as f64);\n    let target_land = js_round(total * clamped) as i64;\n    let mut adjusted = 0usize;\n    let max_layers = total.sqrt().ceil() as i64;\n\n    let mut layer = 0i64;\n    while layer < max_layers {\n        layer += 1;\n        let mut land = count_land_sea_hexes(hexes).land as i64;\n        if land == target_land {\n            break;\n        }\n\n        if land < target_land {\n            let mut to_fill"),
 ("M13-pangea-final-hook-null", "    ensure_pangea_single_continent(hexes, width, height, fill_hook);\n    enforce_map_border_ocean(hexes, width, height, None);\n}", "    ensure_pangea_single_continent(hexes, width, height, |_, _, _| 0);\n    enforce_map_border_ocean(hexes, width, height, None);\n}"),
 ("M14-pangea-mid-hook-null", "    ensure_pangea_single_continent(hexes, width, height, fill_hook);\n    apply_land_fraction_by_score(", "    ensure_pangea_single_continent(hexes, width, height, |_, _, _| 0);\n    apply_land_fraction_by_score("),
 ("M15-pangea-drop-jagged-fill", "    apply_jagged_coast_noise(hexes, perm, width, height, jagged_passes);\n    fill_pangea_annular_sea_corridors(hexes, width, height, None);", "    apply_jagged_coast_noise(hexes, perm, width, height, jagged_passes);"),
 ("M16-pangea-swap-erode-carve", "    erode_pangea_bbox_low_score_rim(\n        hexes,\n        land_scores,\n        p.erode_docelowe_wypelnienie_bbox,\n        p.erode_max,\n    );\n    carve_pangea_long_side_gulfs(\n        hexes,\n        land_scores,\n        perm,\n        p.carve_max_aspect,\n        p.carve_max_wyciec,\n    );\n    fill_pangea_annular_sea_corridors(hexes, width, height, None);\n    apply_land_fraction_by_score(", "    carve_pangea_long_side_gulfs(\n        hexes,\n        land_scores,\n        perm,\n        p.carve_max_aspect,\n        p.carve_max_wyciec,\n    );\n    erode_pangea_bbox_low_score_rim(\n        hexes,\n        land_scores,\n        p.erode_docelowe_wypelnienie_bbox,\n        p.erode_max,\n    );\n    fill_pangea_annular_sea_corridors(hexes, width, height, None);\n    apply_land_fraction_by_score("),
 ("M17-dist-eps-le", "if dist_self < eps {", "if dist_self <= eps {"),
 ("M18-pangea-jagged-passes-minus1", "let jagged_passes = crate::data::derived::mapgen_landsea_pangea_fill().rebalance_jagged_passes;", "let jagged_passes = crate::data::derived::mapgen_landsea_pangea_fill().rebalance_jagged_passes - 1;"),
]
lo, hi = int(sys.argv[1]), int(sys.argv[2])
orig = open(LS, encoding="utf-8").read()
assert orig.count("pub fn fill_pangea_annular_sea_corridors") == 1
try:
    for name, old, new in MUTS[lo:hi]:
        n = orig.count(old)
        if n != 1:
            print(name, "NOMATCH", n, flush=True)
            continue
        open(LS, "w", encoding="utf-8").write(orig.replace(old, new))
        p = subprocess.run(["cargo", "test", "--test", "p6_m06a9_landsea"], cwd=CWD, env=ENV, capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        if "error[" in out or "could not compile" in out:
            verdict = "COMPILE-ERROR"
        elif p.returncode != 0:
            failed = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and "FAILED" in l]
            verdict = "KILLED " + ";".join(failed)
        else:
            verdict = "SURVIVED"
        print(name, verdict, p.returncode, flush=True)
finally:
    open(LS, "w", encoding="utf-8").write(orig)
print("RESTORED", open(LS, encoding="utf-8").read() == orig, flush=True)
