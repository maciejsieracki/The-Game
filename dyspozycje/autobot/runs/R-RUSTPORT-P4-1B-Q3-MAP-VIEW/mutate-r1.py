"""Mutacje zrodla map_view.rs: kazda musi dac czerwony test p4_1b_map_view (lub lib)."""
import os
import subprocess
import sys

ROOT = sys.argv[1]  # rust-port/engine
OUT = sys.argv[2]
SEL = sys.argv[3:] if len(sys.argv) > 3 else None
SRC = os.path.join(ROOT, 'src/domain/map_view.rs')

MUTS = [
    ('M1 brak trimu dla medium',
     'let for_render = trim_medium_render_path_at_main(path, &main_paths);',
     'let for_render = path.clone();'),
    ('M2 None jako nie-main (short)',
     'kinds.get(i).copied().flatten().unwrap_or(RiverKind::Main)',
     'kinds.get(i).copied().flatten().unwrap_or(RiverKind::Short)'),
    ('M3 maska z filtrem mgly',
     '.filter(|(_, hex)| hex_has_road(&hex_like(hex)))',
     '.filter(|(_, hex)| hex_has_road(&hex_like(hex)) && hex.widocznosc.get("0") == Some("widoczny"))'),
    ('M4 bez sortowania heksow',
     'hexes.sort_by_key(|(_, h)| (h.coords.r, h.coords.q));',
     ''),
    ('M5 wioska ignoruje miasta',
     'village_present: hex.wioska.istnieje && !cities.contains(&HexCoord::new(q, r)),',
     'village_present: hex.wioska.istnieje,'),
    ('M6 medium przez land (bez mediumRiverRenderPath)',
     'medium_river_render_path(hexes, &for_render)',
     'land_river_render_path(hexes, &for_render)'),
    ('M7 sasiad spoza mapy = droga',
     'road_keys.contains(hex_key(i64::from(q), i64::from(r)).as_str())',
     'road_keys.contains(hex_key(i64::from(q), i64::from(r)).as_str()) || q < 0 || r < 0'),
]

orig = open(SRC).read()
env = dict(os.environ)
lines = []
try:
    for name, old, new in MUTS:
        if SEL and name.split()[0] not in SEL:
            continue
        assert orig.count(old) == 1, name
        open(SRC, 'w').write(orig.replace(old, new))
        p = subprocess.run(['cargo', 'test', '--test', 'p4_1b_map_view'], cwd=ROOT, env=env,
                           capture_output=True, text=True)
        out = p.stdout + p.stderr
        failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        verdict = 'WYKRYTA' if p.returncode != 0 and failed else ('BLAD KOMPILACJI' if p.returncode != 0 else 'NIEWYKRYTA')
        lines.append(f'{verdict:10} | {name} | exit={p.returncode} | czerwone: {", ".join(failed)}')
        print(lines[-1], flush=True)
finally:
    open(SRC, 'w').write(orig)
with open(OUT, 'a') as f:
    f.write('\n'.join(lines) + '\n')
