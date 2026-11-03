#!/usr/bin/env python3
"""Mutacje REPIN-DELTA-4 (picker + freshwater). Uzycie: mutate.py <repo_root> <id,id,...|all>
Kazda mutacja: podmiana tekstu w pliku zrodlowym -> `cargo test --test p6_8i_pick` -> UBITA (test FAIL) / PRZETRWALA.
Plik jest zawsze przywracany z kopii w pamieci."""
import subprocess, sys, os
root = sys.argv[1]
sel = sys.argv[2]
E = root + '/rust-port/engine/'
D = E + 'src/domain/'
CP = D + 'auto_improvements/city_phases.rs'
HP = D + 'auto_improvements/hex_phases.rs'
SP = D + 'auto_improvements/single_pass.rs'
FW = D + 'freshwater.rs'
M = {
 'M01': (FW, "        if self.has_freshwater_access(map, q, r) {\n            return true;\n        }\n        NEIGHBORS.iter().any(|(dq, dr)| {", "        if self.has_river_water_access(map, q, r) {\n            return true;\n        }\n        NEIGHBORS.iter().any(|(dq, dr)| {"),
 'M02': (SP, "        let (q, r) = parse_key(hk);\n        [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]\n            .iter()\n            .any(|(dq, dr)| {\n                self.map\n                    .hex(&format!(\"{},{}\", q + dq, r + dr))\n                    .is_some_and(|h| h.river_present)\n            })", "        false"),
 'M03': (CP, "            } else if sh.on_river_hex(&k) {\n                1\n            } else {\n                2\n            }", "            } else {\n                1\n            }"),
 'M04': (HP, "            if is_fort_key {\n                let cand_rad = fort_key_radius(key);", "            if false {\n                let cand_rad = fort_key_radius(key);"),
 'M05': (HP, "        if !enclosed {\n            continue;\n        }", "        if !enclosed || true {\n            continue;\n        }"),
 'M06': (FW, "    if ocean.is_empty() && !water.is_empty() {", "    if false && ocean.is_empty() && !water.is_empty() {"),
 'M07': (FW, "        NEIGHBORS.iter().any(|(dq, dr)| {\n            map.hex(&crate::domain::improvement_build::hex_key(q + dq, r + dr))\n                .is_some_and(|h| h.river_present)\n        })", "        false"),
 'M08': (FW, "            if !exists.contains(&(q + dq, r + dr)) {", "            if false && !exists.contains(&(q + dq, r + dr)) {"),
 'M09': (CP, "            if sh.food_reserved_hex(&hk) {\n                continue;", "            if sh.has_river_access(&hk) {\n                continue;"),
 'M10': (HP, "        acc.praca_left += pk.koszt_praca;\n", ""),
 'M11': (CP, "        if livestock && !sh.on_river_hex(hex_key) {", "        if livestock && !sh.river_hex_keys.contains(hex_key) {"),
 'M12': (HP, "        && !sh.on_river_hex(hex_key)", "        && !sh.river_hex_keys.contains(hex_key)"),
 'M13': (FW, "        NEIGHBORS\n            .iter()\n            .any(|(dq, dr)| self.lakes.contains(&(q + dq, r + dr)))", "        false"),
 'M14': (CP, "        if (key == \"tartak\" || key == \"oboz_lowiecki\") && sh.food_reserved_hex(hex_key) {", "        if (key == \"tartak\" || key == \"oboz_lowiecki\") && sh.has_river_access(hex_key) {"),
 'M15': (HP, "<= frad)", "< frad)"),
 'M16': (HP, "                    <= fort_key_radius(\"fort\")", "                    < fort_key_radius(\"fort\")"),
 'M17': (HP, "        acc.placed_this_city -= 1.0;\n", ""),
 'M18': (CP, "        if !sh.on_river_hex(&hk) {\n            return false;\n        }\n        if acc.scheduled_wyrab.contains(&hk) {\n            return false;\n        }\n        if sh.map.hex(&hk).map(|h| h.overlay) != Some(Overlay::Las) {", "        if !sh.river_hex_keys.contains(&hk) {\n            return false;\n        }\n        if acc.scheduled_wyrab.contains(&hk) {\n            return false;\n        }\n        if sh.map.hex(&hk).map(|h| h.overlay) != Some(Overlay::Las) {"),
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
        r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_8i_pick', 'pick_auto_improvements_matches_pinned_web_vectors'], cwd=E, env=env, capture_output=True, text=True)
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
