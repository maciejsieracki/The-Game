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
    ('M01 hypot=libm', MASKS, r'(pub fn js_hypot\(a: f64, b: f64\) -> f64 \{)', r'\1 return a.hypot(b);'),
    ('M02 pow=libm', MASKS, r'(pub fn js_pow\(x: f64, y: f64\) -> f64 \{)', r'\1 return x.powf(y);'),
    ('M03 atan2=libm', MASKS, r'(pub fn js_atan2\(y: f64, x: f64\) -> f64 \{)', r'\1 return y.atan2(x);'),
    ('M04 sin=libm', MASKS, r'(pub fn js_sin\(x: f64\) -> f64 \{)', r'\1 return x.sin();'),
    ('M05 pow mianownik fdlibm klasyczny', MASKS, r'\(z \* t1b\) / \(\(t1b - 2\.0\) - \(w \+ z \* w\)\)', '(z * t1b) / (t1b - 2.0) - (w + z * w)'),
    ('M06 atan2 bez m&=1', MASKS, r'm &= 1;', 'm &= 3;'),
    ('M07 shape: zamiana pol offsetow', MASKS, r'off_mtn_x: rand\(\)(.*?)off_mtn_y: rand\(\)', r'off_mtn_y: rand()\1off_mtn_x: rand()'),
    ('M08 land_mask_at bez dodatku 0.5', MASKS, r'let dx = \(q as f64 - cx\) / \(cx \+ p\.dodatek_polowki\);', 'let dx = (q as f64 - cx) / cx;'),
    ('M09 centra: n>=1 -> n>1', MASKS, r'o\.anchor_center != Some\(false\) && n >= 1', 'o.anchor_center != Some(false) && n > 1'),
    ('M10 centra: anchor odwrocony', MASKS, r'o\.anchor_center != Some\(false\)', 'o.anchor_center == Some(false)'),
    ('M11 centra: proby <=', MASKS, r'while attempt < p\.proby', 'while attempt <= p.proby'),
    ('M12 piecio: zamiana jitter nq/nr', MASKS, r'let nq = clamp01_with\(border_margin, anchor_q \+ \(rand\(\) - HALF\) \* p\.piecio_jitter\);\s*let nr = clamp01_with\(border_margin, anchor_r \+ \(rand\(\) - HALF\) \* p\.piecio_jitter\);',
     'let nr = clamp01_with(border_margin, anchor_r + (rand() - HALF) * p.piecio_jitter); let nq = clamp01_with(border_margin, anchor_q + (rand() - HALF) * p.piecio_jitter);'),
    ('M13 nearest: < -> <=', MASKS, r'if d < best_d \{', 'if d <= best_d {'),
    ('M14 second_nearest: get(1)->get(0)', MASKS, r'dists\.get\(1\)', 'dists.get(0)'),
    ('M15 kontynenty: ciesnina <=', MASKS, r'if dist2 - dist_c < p\.ciesnina', 'if dist2 - dist_c <= p.ciesnina'),
    ('M16 kontynenty: bez odjemnika', MASKS, r'\(radial \+ warp_coarse \+ warp_fine \+ angle_n - p\.odjemnik\) \* border_fade \* edge_rect', '(radial + warp_coarse + warp_fine + angle_n) * border_fade * edge_rect'),
    ('M17 angle_noise: bez strefy', MASKS, r'\+ zone_idx as f64 \* layer\.mnoznik_strefy', '+ 0.0 * layer.mnoznik_strefy'),
    ('M18 isotropic: bez wysokosci w max_dim', MASKS, r'(pub fn map_isotropic_from_center.*?let max_dim = )max3\(1\.0, f64::from\(width\) - 1\.0, f64::from\(height\) - 1\.0\)', r'\1max3(1.0, f64::from(width) - 1.0, 1.0)'),
    ('M19 norm_to_isotropic: bez HALF', MASKS, r'\(nq - HALF\) \* \(f64::from\(width\) - 1\.0\) / max_dim', 'nq * (f64::from(width) - 1.0) / max_dim'),
    ('M20 pangea_t: bez gornego clampa', MASKS, r'js_max\(0\.0, js_min\(1\.0, \(land_fraction - p\.t_dolny\) / p\.t_zakres\)\)', 'js_max(0.0, (land_fraction - p.t_dolny) / p.t_zakres)'),
    ('M21 layout: n_blobs <=', MASKS, r'n_blobs: if t < p\.prog_male', 'n_blobs: if t <= p.prog_male'),
    ('M22 layout: ring_pull wysoki<->niski', MASKS, r'high_land \* p\.sciagniecie\.wysoki\s*\+ low_land \* p\.sciagniecie\.niski', 'high_land * p.sciagniecie.niski + low_land * p.sciagniecie.wysoki'),
    ('M23 layout: size_boost max', MASKS, r'let size_boost = js_min\(p\.boost_max', 'let size_boost = js_max(p.boost_max'),
    ('M24 pangea centra: zamiana mnoznik/rozrzut', MASKS, r'layout\.blob_radius_min \* p\.pierscien_promien_mnoznik\s*\+ rand\(\) \* span \* p\.pierscien_rozrzut', 'layout.blob_radius_min * p.pierscien_rozrzut + rand() * span * p.pierscien_promien_mnoznik'),
    ('M25 blob_score: bez strefy w szumie grubym', MASKS, r'\+ zone \* p\.przesuniecie_strefy_gruby', '+ 0.0 * p.przesuniecie_strefy_gruby'),
    ('M26 pangea: merged zamiana wsp', MASKS, r'blob_sum \* layout\.merge_sum \+ blob_max \* layout\.merge_max', 'blob_sum * layout.merge_max + blob_max * layout.merge_sum'),
    ('M27 pangea: dolina +', MASKS, r'\(merged \+ global_warp - valley - layout\.threshold\)', '(merged + global_warp + valley - layout.threshold)'),
    ('M28 wyspy centra: zamiana kolejnosci petli', MASKS, r'for row in 0\.\.grid \{\s*for col in 0\.\.grid \{', 'for col in 0..grid { for row in 0..grid {'),
    ('M29 island_cell: round', MASKS, r'scaled\.floor\(\)', 'scaled.round()'),
    ('M30 assign: zamiana petli', MASKS, r'for r in 0\.\.i64::from\(height\) \{\s*for q in 0\.\.i64::from\(width\) \{', 'for q in 0..i64::from(width) { for r in 0..i64::from(height) {'),
    ('M31 wyspy: dist_to_edge bez dolu', MASKS, r'js_min\(js_min\(js_min\(nq - cell_left, cell_right - nq\), nr - cell_top\), cell_bottom - nr\)', 'js_min(js_min(nq - cell_left, cell_right - nq), nr - cell_top)'),
    ('M32 wyspy: zone col*grid+row', MASKS, r'let zone_idx = \(row \* i64::from\(grid\) \+ col\) as usize;', 'let zone_idx = (col * i64::from(grid) + row) as usize;'),
    ('M33 ziemia: template < 0', MASKS, r'if template <= 0\.0', 'if template < 0.0'),
    ('M34 ziemia: szum -', MASKS, r'p\.poziom_ladu \+ coast_noise - p\.odjemnik', 'p.poziom_ladu - coast_noise - p.odjemnik'),
    ('M35 brzeg: d < strefa', MASKS, r'if d <= map_margin_land_zone_hexes\(\)', 'if d < map_margin_land_zone_hexes()'),
    ('M36 brzeg: fade bez min', MASKS, r'Some\(cap\) => js_min\(1\.0, cap / mapgen_masks\(\)\.brzeg\.dzielnik_zaniku\)', 'Some(cap) => cap / mapgen_masks().brzeg.dzielnik_zaniku'),
    ('M37 edge_rect: bez dolnego progu', MASKS, r'js_min\(nq, 1\.0 - nq\) / js_max\(margin_q, p\.min_margines\)', 'js_min(nq, 1.0 - nq) / margin_q'),
    ('M38 hex_border_distance: bez h', MASKS, r'\.min\(h - 1 - r\) as f64', ' as f64'),
    ('M39 js_max: znak zera', MASKS, r'return if a\.is_sign_positive\(\) \{ a \} else \{ b \};', 'return if a.is_sign_positive() { b } else { a };'),
    ('M40 kontynenty: pow wykladnik (radial) 1.55->tabela', MASKS, r'js_pow\(dist_c / c\.radius, p\.wykladnik_radialny\)\);\s*let warp_coarse = noise_warp\(perm, q, r, noise_scale, &p\.szum_gruby\);\s*let warp_fine = noise_warp\(perm, q, r, noise_scale, &p\.szum_drobny\);\s*let angle = js_atan2\(nr - c\.nr, nq - c\.nq\);',
     'js_pow(dist_c / c.radius, p.wykladnik_radialny)); let warp_coarse = noise_warp(perm, q, r, noise_scale, &p.szum_drobny); let warp_fine = noise_warp(perm, q, r, noise_scale, &p.szum_gruby); let angle = js_atan2(nr - c.nr, nq - c.nq);'),
    ('M41 five_zone: pickR przed jitterami', MASKS, r'let radius = radius_min \+ rand\(\) \* \(radius_max - radius_min\);\s*centers\.push\(ContinentCenter \{ nq, nr, radius \}\);\s*\}\s*centers\s*\}\s*/// Web `nearestContinentZoneIndex`', 'let radius = radius_min + rand() * (radius_max - radius_min); centers.push(ContinentCenter { nq: nr, nr: nq, radius }); } centers }\n\n/// Web `nearestContinentZoneIndex`'),
    ('J01 json skala_szumu', JSON, r'"skala_szumu": 0\.13', '"skala_szumu": 0.131'),
    ('J02 json ciesnina', JSON, r'"ciesnina": 0\.018', '"ciesnina": 0.019'),
    ('J03 json prog.baza', JSON, r'"prog": \{ "baza": 0\.17', '"prog": { "baza": 0.18'),
    ('J04 json pas_morski', JSON, r'"pas_morski": 0\.062', '"pas_morski": 0.063'),
    ('J05 json poziom_ladu', JSON, r'"poziom_ladu": 0\.94', '"poziom_ladu": 0.95'),
    ('J06 json krok_limitu', JSON, r'"krok_limitu": 0\.05', '"krok_limitu": 0.051'),
    ('J07 json pangea jitter', JSON, r'"jitter": 0\.028', '"jitter": 0.029'),
    ('J08 json centrum Ziemi', JSON, r'"nq": 0\.6,', '"nq": 0.61,'),
    ('J09 json proby', JSON, r'"proby": 40', '"proby": 39'),
    ('J10 json wyspy rozmiar max', JSON, r'"max": 1\.14', '"max": 1.13'),
    ('J11 json liczba_duze', JSON, r'"liczba_duze": 4', '"liczba_duze": 5'),
    ('J12 json wysoki_prog', JSON, r'"wysoki_prog": 0\.55', '"wysoki_prog": 0.56'),
    ('J13 json eliptyczna promien', JSON, r'"promien": 0\.85', '"promien": 0.86'),
    ('J14 json zakres_przesuniec', JSON, r'"zakres_przesuniec": 500', '"zakres_przesuniec": 501'),
    ('J15 json oktawy szum_drobny kontynenty', JSON, r'"przesuniecie": 510, "oktawy": 3, "amplituda": 0\.16 \},\s*"szum_kata": \{ "mnoznik_kata": 4, "mnoznik_strefy": 11, "przesuniecie": 220, "oktawy": 2, "amplituda": 0\.1 \},\s*"odjemnik": 0\.09\s*\},\s*"pangea"', '"przesuniecie": 510, "oktawy": 2, "amplituda": 0.16 }, "szum_kata": { "mnoznik_kata": 4, "mnoznik_strefy": 11, "przesuniecie": 220, "oktawy": 2, "amplituda": 0.1 }, "odjemnik": 0.09 }, "pangea"'),
    ('E01 core polarny_ocean_limit_proc', CORE, r'"polarny_ocean_limit_proc": 0\.12', '"polarny_ocean_limit_proc": 0.13'),
    ('E02 core podprobkowanie 220->221', CORE, r'"min_wewn": 220,', '"min_wewn": 221,'),
    ('E03 core prog_ulamka 160->161', CORE, r'"min_wewn": 160,', '"min_wewn": 161,'),
    ('E04 core prog_ulamka_domyslny', CORE, r'"prog_ulamka_ladu_domyslny": 0\.26', '"prog_ulamka_ladu_domyslny": 0.27'),
    ('E05 core granica_grywalna', CORE, r'"granica_grywalna": 2', '"granica_grywalna": 3'),
    ('E06 core polarny_ocean_wiersze_ref', CORE, r'"polarny_ocean_wiersze_ref": 30', '"polarny_ocean_wiersze_ref": 31'),
    ('E07 core prog_szablonu_ladu', CORE, r'"prog_szablonu_ladu": 0\.45', '"prog_szablonu_ladu": 0.46'),
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
            for t in ['p6_m03_jsmath', 'p6_m03_centers', 'p6_m03_tables', 'p6_m03_earth', 'p6_m03_masks']:
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
