#!/usr/bin/env python3
"""Mutacje REPIN-DELTA-4 cz. 2 (sight, capsep, topUp, health) przeciw `--test p6_repin4_vectors`.
Uzycie: mutate2.py <repo_root> <id,id,...|all>   (SEKWENCYJNIE, jedno wywolanie naraz - pliki sa edytowane w miejscu)."""
import subprocess, sys, os
root = sys.argv[1]
sel = sys.argv[2]
E = root + '/rust-port/engine/'
D = E + 'src/domain/'
FT = D + 'fort_territory.rs'
CL = D + 'mapgen/cluster_layout.rs'
LS = D + 'mapgen/landsea.rs'
TH = D + 'turn_economy_health.rs'
FW = D + 'freshwater.rs'
M = {
 'T01': (FT, ".filter(|f| f.owner_id == owner_id && f.contested_useless != Some(true))", ".filter(|f| f.owner_id == owner_id)"),
 'T02': (FT, ".filter(|f| f.owner_id == owner_id && f.contested_useless != Some(true))", ".filter(|f| f.contested_useless != Some(true))"),
 'T03': (CL, "    if civ < 2 {\n        return prop;\n    }", "    if civ == 0 {\n        return prop;\n    }"),
 'T04': (CL, "    let factor = if map_w.min(map_h) < 80 {", "    let factor = if map_w.min(map_h) <= 80 {"),
 'T05': (CL, "    table.max(prop.min(cap))", "    prop.min(cap)"),
 'T06': (CL, "return if v >= 4 { v } else { 0 };", "return if v >= 5 { v } else { 0 };"),
 'T07': (LS, "    if target_land - land > deficit_threshold {", "    if target_land - land >= deficit_threshold {"),
 'T08': (LS, "                    .filter(|k| base_ok(hexes, k, min_nb, true))", "                    .filter(|k| base_ok(hexes, k, min_nb, false))"),
 'T09': (LS, "            for min_nb in [2usize, 1] {", "            for min_nb in [2usize] {"),
 'T10': (LS, "const PANGEA_TOPUP_MARGIN_RING_CEIL: f64 = 0.6;", "const PANGEA_TOPUP_MARGIN_RING_CEIL: f64 = 0.7;"),
 'T11': (LS, "const PANGEA_TOPUP_MARGIN_MIN_D: f64 = 4.0;", "const PANGEA_TOPUP_MARGIN_MIN_D: f64 = 5.0;"),
 'T12': (LS, "                let dc = cd[a] - cd[b];\n                if dc.abs() > 1e-9 {\n                    dc\n                } else {\n                    f64::from(locale_compare(a, b))\n                }\n            });\n            for k in &cands {\n                if land >= target_land {\n                    break;\n                }\n                if let Some(h) = hexes.get_mut(k) {\n                    set_hex_to_laka(h);\n                }\n                land += 1;\n                added += 1;\n            }\n            round += 1;\n        }\n        // Faza 3", "                f64::from(locale_compare(a, b))\n            });\n            for k in &cands {\n                if land >= target_land {\n                    break;\n                }\n                if let Some(h) = hexes.get_mut(k) {\n                    set_hex_to_laka(h);\n                }\n                land += 1;\n                added += 1;\n            }\n            round += 1;\n        }\n        // Faza 3"),
 'T13': (TH, "    is_lake_adjacent_cached(map, cq, cr)\n}", "    false\n}"),
 'T14': (LS, "    let clamped = js_max(0.15, js_min(0.85, target_land_fraction));", "    let clamped = js_max(0.10, js_min(0.85, target_land_fraction));"),
 'T15': (LS, "                if ceil_hit(&ring_land, &ring_total, d) {\n                        continue;\n                    }\n                    if let Some(h) = hexes.get_mut(k) {", "                if false {\n                        continue;\n                    }\n                    if let Some(h) = hexes.get_mut(k) {"),
 'T16': (LS, "        if ri < buf || ri >= height - buf {\n            return false;\n        }\n        count_land_neighbors", "        if ri < buf {\n            return false;\n        }\n        count_land_neighbors"),
}
ids = list(M) if sel == 'all' else sel.split(',')
env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/repin4_target', CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
for i in ids:
    path, old, new = M[i]
    src = open(path).read()
    if src.count(old) != 1:
        print(f'{i} BLAD: wzorzec wystepuje {src.count(old)}x', flush=True)
        continue
    open(path, 'w').write(src.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_repin4_vectors'], cwd=E, env=env, capture_output=True, text=True)
        out = r.stdout + r.stderr
        if 'could not compile' in out:
            status = 'BLAD-KOMPILACJI'
        elif 'test result: FAILED' in out:
            status = 'UBITA'
        elif 'test result: ok' in out:
            status = 'PRZETRWALA'
        else:
            status = 'NIEJASNY'
        print(f'{i} {status} rc={r.returncode}', flush=True)
    finally:
        open(path, 'w').write(src)
