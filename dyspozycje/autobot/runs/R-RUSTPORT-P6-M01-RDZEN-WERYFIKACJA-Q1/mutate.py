#!/usr/bin/env python3
"""Mutacje P6.M01: dla kazdej zmiany (plik, stary tekst -> nowy) uruchamia testy p6_m01_* i wymaga,
zeby co najmniej jeden test sie wywalil. Plik jest zawsze przywracany. Uzycie:
  python3 -I mutate.py <katalog_engine> <CARGO_TARGET_DIR> [M01 M02 ...]  (opcjonalny podzbior)
"""
import os
import subprocess
import sys

engine, target = sys.argv[1], sys.argv[2]
env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_TARGET_DIR=target, CARGO_PROFILE_DEV_DEBUG='0')
TESTS = ['--test', 'p6_m01_prims', '--test', 'p6_m01_earth_mask', '--test', 'p6_m01_climate',
         '--test', 'p6_m01_params_shape']
P = 'src/domain/mapgen/prims.rs'
D = 'data/derived/mapgen-core-params.json'
M = 'data/derived/earth-land-mask.json'
MUT = [
    ('M01 mulberry: stala kroku', P, 'const MULBERRY_INCREMENT: u32 = 0x6d2b_79f5;', 'const MULBERRY_INCREMENT: u32 = 0x6d2b_79f4;'),
    ('M02 perm: Fisher-Yates bez i=1', P, 'for i in (1..PERM_TABLE_LEN).rev() {', 'for i in (2..PERM_TABLE_LEN).rev() {'),
    ('M03 cosLerp: std cos zamiast fdlibm', P, 'let f = (1.0 - js_cos(t * std::f64::consts::PI)) * 0.5;', 'let f = (1.0 - (t * std::f64::consts::PI).cos()) * 0.5;'),
    ('M04 noise: saturujace rzutowanie zamiast ToInt32', P, 'let xi = js_to_int32(x_floor) & PERM_MASK;', 'let xi = (x_floor as i32) & PERM_MASK;'),
    ('M05 fbm: czestotliwosc x2.1', P, 'frequency *= 2.0;', 'frequency *= 2.1;'),
    ('M06 hexDistance: bez skladowej s', P, 'let ds = ((-aq - ar) - (-bq - br)).unsigned_abs();', 'let ds = 0_u64;'),
    ('M07 klimat: dzielenie calkowite height/2 (stary stan)', P, 'return if (r as f64) < f64::from(height) / 2.0 {', 'return if r < i64::from(height / 2) {'),
    ('M08 klimat: granica polarna <=', P, '} else if rel_r < 1.0 - climate.polarny_proc {', '} else if rel_r <= 1.0 - climate.polarny_proc {'),
    ('M09 bufor: floor zamiast round', P, 'let scaled = (f64::from(height) * climate.bufor_proceduralny_proc).round() as u32;', 'let scaled = (f64::from(height) * climate.bufor_proceduralny_proc).floor() as u32;'),
    ('M10 polarne wiersze: min zamiast max w limicie', P, '.polarny_ocean_wiersze_ref\n        .max((inner_h', '.polarny_ocean_wiersze_ref\n        .min((inner_h'),
    ('M11 JSON: prog_szablonu_ladu 0.46', D, '"prog_szablonu_ladu": 0.45', '"prog_szablonu_ladu": 0.46'),
    ('M12 probka: zly skladnik dwuliniowy (x1,y0 zamiast x1,y1)', P, '+ tx * ty * bit(x1, y1);', '+ tx * ty * bit(x1, y0);'),
    ('M13 hexToNorm: > zamiast >= dla bufora S', P, 'if rel_r < north || rel_r >= inner_h - south {', 'if rel_r < north || rel_r > inner_h - south {'),
    ('M14 templateLandAt: prog >', P, 'if f64::from(land_hits) / f64::from(total) >= earth_land_fraction_threshold(width, height) {', 'if f64::from(land_hits) / f64::from(total) > earth_land_fraction_threshold(width, height) {'),
    ('M15 las: plus zamiast minus delta (znak)', P, 'base_for_th + climate.las_umiarkowany_delta', 'base_for_th - climate.las_umiarkowany_delta'),
    ('M16 pustynia: None nie przypisuje', P, 'matches!(band, None | Some(ClimateBand::Desert))', 'matches!(band, Some(ClimateBand::Desert))'),
    ('M17 kierunki: zamiana pierwszych dwoch', P, 'pub const HEX_DIRECTIONS: [(i32, i32); 6] = [(1, 0), (1, -1),', 'pub const HEX_DIRECTIONS: [(i32, i32); 6] = [(1, -1), (1, 0),'),
    ('M18 cosLerp: mnoznik 0.51', P, 'let f = (1.0 - js_cos(t * std::f64::consts::PI)) * 0.5;', 'let f = (1.0 - js_cos(t * std::f64::consts::PI)) * 0.51;'),
    ('M19 JSON: delta lasu -0.05', D, '"las_umiarkowany_delta": -0.06', '"las_umiarkowany_delta": -0.05'),
    ('M20 JSON: podprobkowanie_domyslne 5', D, '"podprobkowanie_domyslne": 7', '"podprobkowanie_domyslne": 5'),
    ('M21 JSON: pustynia_pol_wiersze 4.0', D, '"pustynia_pol_wiersze": 3.5', '"pustynia_pol_wiersze": 4.0'),
    ('M22 JSON: maska - zamiana sasiednich przebiegow', M, '0338;16;04', '0337;17;04'),
    ('M23 JSON: bbox min_x', M, '"min_x": 0.0723', '"min_x": 0.0724'),
    ('M24 JSON(ksztalt): progi w zlej kolejnosci', D, '{\n        "min_wewn": 420,\n        "kroki": 1\n      },\n      {\n        "min_wewn": 220,\n        "kroki": 3\n      }', '{\n        "min_wewn": 220,\n        "kroki": 3\n      },\n      {\n        "min_wewn": 420,\n        "kroki": 1\n      }'),
    ('M25 map_generator: HexCoord::distance bez prims', 'src/domain/map_generator.rs', 'prims::hex_distance_axial(self.q as i64, self.r as i64, other.q as i64, other.r as i64)\n            as u32', '(self.q - other.q).unsigned_abs()'),
]

only = set(sys.argv[3:])
results = []
for name, path, old, new in MUT:
    if only and name.split()[0] not in only:
        continue
    full = os.path.join(engine, path)
    src = open(full, encoding='utf8').read()
    if src.count(old) != 1:
        results.append((name, f'BLAD: wzorzec wystepuje {src.count(old)}x'))
        print(results[-1], flush=True)
        continue
    try:
        open(full, 'w', encoding='utf8').write(src.replace(old, new))
        proc = subprocess.run(['cargo', 'test', '-q'] + TESTS, cwd=engine, env=env,
                              capture_output=True, text=True)
        out = proc.stdout + proc.stderr
        failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        if 'error[' in out or 'could not compile' in out:
            status = 'BLAD KOMPILACJI'
        elif proc.returncode != 0:
            status = 'WYKRYTA (testy czerwone: ' + ', '.join(failed[:4]) + ('...' if len(failed) > 4 else '') + ')'
        else:
            status = 'NIEWYKRYTA'
    finally:
        open(full, 'w', encoding='utf8').write(src)
    results.append((name, status))
    print(name, '->', status, flush=True)

det = sum(1 for _, s in results if s.startswith('WYKRYTA'))
print(f'\nWYKRYTE: {det}/{len(results)}')
sys.exit(0 if det == len(results) else 1)
