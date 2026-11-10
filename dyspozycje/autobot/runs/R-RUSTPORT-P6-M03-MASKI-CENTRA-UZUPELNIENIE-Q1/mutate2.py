#!/usr/bin/env python3
"""Mutacje P6.M03: kazda mutacja psuje kod/dane, uruchamia testy p6_m03_*, musi dac FAIL.
Plik zawsze przywracany. Uzycie: mutate.py <engine> <log> [od_numeru]"""
import os
import re
import subprocess
import sys

engine, logp = sys.argv[1], sys.argv[2]
start_at = int(sys.argv[3]) if len(sys.argv) > 3 else 1
MASKS = f'{engine}/src/domain/mapgen/masks.rs'
JSON = f'{engine}/data/derived/mapgen-masks.json'
CORE = f'{engine}/data/derived/mapgen-core-params.json'
env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0',
           CARGO_TARGET_DIR='/home/user/cargo-target-shared/wf_1cdaadde-d5c-1')

# (nazwa, plik, regex, zamiennik)  -- regex musi trafic dokladnie 1 raz
M = [
    ('R31 wyspy: dist_to_edge bez dolu', MASKS, r'js_min\(\s*js_min\(js_min\(nq - cell_left, cell_right - nq\), nr - cell_top\),\s*cell_bottom - nr,?\s*\)', 'js_min(js_min(nq - cell_left, cell_right - nq), nr - cell_top)'),
    ('R37 edge_rect: bez dolnego progu 0.001', MASKS, r'js_min\(nq, 1\.0 - nq\) / js_max\(margin_q, p\.min_margines\)', 'js_min(nq, 1.0 - nq) / margin_q'),
    ('R21 layout: n_blobs prog_srednie <=', MASKS, r'\} else if t < p\.prog_srednie \{', '} else if t <= p.prog_srednie {'),
    ('R40 kontynenty: zamiana szumu gruby/drobny', MASKS, r'(pub fn land_mask_kontynenty.*?)let warp_coarse = noise_warp\(perm, q, r, noise_scale, &p\.szum_gruby\);\s*let warp_fine = noise_warp\(perm, q, r, noise_scale, &p\.szum_drobny\);', r'\1let warp_coarse = noise_warp(perm, q, r, noise_scale, &p.szum_drobny); let warp_fine = noise_warp(perm, q, r, noise_scale, &p.szum_gruby);'),
    ('R36 brzeg: fade bez min (rownowazna?)', MASKS, r'Some\(cap\) => js_min\(1\.0, cap / mapgen_masks\(\)\.brzeg\.dzielnik_zaniku\)', 'Some(cap) => cap / mapgen_masks().brzeg.dzielnik_zaniku'),
]

results = []
with open(logp, 'a') as log:
    for idx, (name, path, pat, rep) in enumerate(M, 1):
        if idx < start_at:
            continue
        orig = open(path, encoding='utf8').read()
        new, n = re.subn(pat, rep, orig, count=0, flags=re.S)
        if n != 1:
            log.write(f'{idx:02d} {name}: BLAD WZORCA (trafien: {n})\n')
            log.flush()
            continue
        open(path, 'w', encoding='utf8').write(new)
        try:
            verdict = 'NIEWYKRYTA'
            for t in ['p6_m03_jsmath', 'p6_m03_centers', 'p6_m03_tables', 'p6_m03_earth', 'p6_m03_edges', 'p6_m03_masks']:
                p = subprocess.run(['cargo', 'test', '--test', t], cwd=engine, env=env,
                                   capture_output=True, text=True, timeout=1500)
                out = p.stdout + p.stderr
                if 'error[E' in out or 'could not compile' in out:
                    verdict = 'NIEWAZNA (blad kompilacji)'
                    break
                if p.returncode != 0:
                    failed = re.findall(r'^test (\S+) \.\.\. FAILED', out, re.M)
                    verdict = 'WYKRYTA [' + t + ']: ' + ', '.join(sorted(set(failed))[:3])
                    break
        finally:
            open(path, 'w', encoding='utf8').write(orig)
        log.write(f'{idx:02d} {name}: {verdict}\n')
        log.flush()
print('KONIEC')
