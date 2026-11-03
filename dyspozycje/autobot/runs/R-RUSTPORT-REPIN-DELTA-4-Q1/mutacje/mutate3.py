#!/usr/bin/env python3
"""Mutacje REPIN-DELTA-4 runda 2 (hunki 23-25: sep stolic w compute_clusters, komparator, unikanie Polarny) przeciw
wektorom M09/M10/M11/M12/P6.1C regenerowanym z weba 23dd158e9.
Uzycie: mutate3.py <repo_root> <id,id,...|all>   (SEKWENCYJNIE - pliki sa edytowane w miejscu, po ttescie przywracane)."""
import subprocess, sys, os
root = sys.argv[1]
sel = sys.argv[2]
E = root + '/rust-port/engine/'
D = E + 'src/domain/mapgen/'
CM = D + 'cluster_mass.rs'
CL = D + 'cluster_layout.rs'
CC = D + 'cluster_compute.rs'
TESTS = ['p6_m10_placement', 'p6_m11_gates', 'p6_m11_layout', 'p6_m11_integration', 'p6_m12_compute', 'p6_m12_spawn']
M = {
 'P01': (CM, "        let pol = (a.polar - b.polar) as f64;\n        if pol != 0.0 {\n            return pol;\n        }\n        let da = dist_hp(a.h, map_center);", "        let da = dist_hp(a.h, map_center);"),
 'P02': (CM, "        let pol = (a.c.polar - b.c.polar) as f64;\n        if pol != 0.0 {\n            return pol;\n        }\n        if b.min_exist", "        if b.min_exist"),
 'P03': (CM, "    let mut candidates = drop_polar_hex_candidates(map, candidates, |c| c.h);", "    let mut candidates = candidates;"),
 'P04': (CM, "    candidates = drop_polar_hex_candidates(map, candidates, |i| base[*i].h);", ""),
 'P05': (CL, "    let avoid_polar = !opts.require_player_mass_gate\n        && pool", "    let avoid_polar = false\n        && pool"),
 'P06': (CL, "or0((da + jitter) - (db + jitter), f64::from(a.q - b.q)),", "or0((db + jitter) - (da + jitter), f64::from(a.q - b.q)),"),
 'P07': (CL, "            && (is_player_layout\n", "            && (false\n"),
 'P08': (CC, "    let land_count_for_sep = land_pool(map).len() as i64;", "    let land_count_for_sep = 0i64;"),
 'P09': (CC, "    let mut shuffled_lad = ladowe_player.clone();", "    let mut shuffled_lad = ladowe.clone();"),
 'P10': (CC, "                h,\n                Some(n_typy),\n                Some(land_count_for_sep),", "                h,\n                None,\n                Some(land_count_for_sep),"),
 'P11': (CM, "let t = if d <= 1.0 { 2 } else { 1 };", "let t = if d <= 2.0 { 2 } else { 1 };"),
 'P12': (CM, "    if is_polar(q, r) {\n        return 3;\n    }", "    if is_polar(q, r) {\n        return 2;\n    }"),
 'P13': (CC, "    let placement = ClusterPlacement {\n        rozmiar_mapy,\n        aktywne_typy: placed_typy,\n        requested_typy: n_typy,\n        capital_min_sep: Some(min_capital_sep_i),", "    let placement = ClusterPlacement {\n        rozmiar_mapy,\n        aktywne_typy: placed_typy,\n        requested_typy: n_typy,\n        capital_min_sep: None,"),
 'P14': (CC, "    let ladowe = if ladowe_non_polar.is_empty() && !ladowe_player.is_empty() {", "    let ladowe = if false && !ladowe_player.is_empty() {"),
 'P15': (CC, "        &ladowe,\n        &HOOKS,\n    );\n\n    // FALA 188: dopelnij", "        &ladowe_player,\n        &HOOKS,\n    );\n\n    // FALA 188: dopelnij"),
 'P16': (CC, "    let land_cache = create_mass_land_cache(&ladowe_player);", "    let land_cache = create_mass_land_cache(&ladowe);"),
 'P17': (CL, "                polar: if avoid_polar {\n                    polar_proximity_tier(map, h.q, h.r)\n                } else {\n                    0\n                },", "                polar: 0,"),
 'P18': (CL, "            if avoid_polar\n                && u32::try_from(h.q)", "            if false\n                && u32::try_from(h.q)"),
}
ids = list(M) if sel == 'all' else sel.split(',')
env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/repin4_r3', CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
for i in ids:
    path, old, new = M[i]
    src = open(path).read()
    if src.count(old) != 1:
        print(f'{i} BLAD: wzorzec wystepuje {src.count(old)}x', flush=True)
        continue
    open(path, 'w').write(src.replace(old, new))
    try:
        args = ['cargo', 'test', '-j', '2', '--no-fail-fast']
        for t in TESTS:
            args += ['--test', t]
        r = subprocess.run(args, cwd=E, env=env, capture_output=True, text=True)
        out = r.stdout + r.stderr
        if 'could not compile' in out:
            status = 'BLAD-KOMPILACJI'
        elif 'test result: FAILED' in out:
            failed = sorted({l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.rstrip().endswith('FAILED')})
            status = 'UBITA ' + ','.join(failed[:3])
        elif 'test result: ok' in out:
            status = 'PRZETRWALA'
        else:
            status = 'NIEJASNY'
        print(f'{i} {status}', flush=True)
    finally:
        open(path, 'w').write(src)
