#!/usr/bin/env python3
"""Obrona r2 (R-RUSTPORT-P4-364-RENDER-FRAME-R1): mutanty EV1-EV11 Evaluatora r2 + Z1 na kodzie po obronie.

Uzycie: python3 -I mutate-obrona-r2.py <katalog rust-port/engine> <CARGO_TARGET_DIR> <log>
Kazdy mutant: podmiana jednego fragmentu w render_frame.rs (dokladnie 1 wystapienie), `cargo test --test
p4_364_render_frame`, przywrocenie zrodla. ZABITY = exit != 0 bez bledu kompilacji.
"""
import os
import subprocess
import sys

ENG, TGT, LOG = sys.argv[1], sys.argv[2], sys.argv[3]
RF = os.path.join(ENG, 'src/domain/render_frame.rs')
M = [
    ("EV1-zalozenie-fotel-glowny-zamiast-seat",
     "        let me = owner_raw(seat)?;\n        let forts = fort_nodes_of(state)?;",
     "        let _ = owner_raw(seat)?;\n        let me = HUMAN_OWNER_ID;\n        let seat = PlayerId::new(1);\n        let forts = fort_nodes_of(state)?;"),
    ("EV2-bez-obcego-fortu",
     "                    self.me,\n                    &self.forts,",
     "                    self.me,\n                    &[],"),
    ("EV3-bez-city-limit-base",
     "                city_limit_base: Some(self.city_limit_base),",
     "                city_limit_base: None,"),
    ("EV4-zwiadowca-w-mocy-pola",
     'const BATTLE_EXCLUDED_TYPES: [&str; 2] = ["Zwiadowca", "Osadnik"];',
     'const BATTLE_EXCLUDED_TYPES: [&str; 2] = ["-", "--"];'),
    ("EV5-latwy-jako-normalny",
     '"Łatwy" | "easy" => Ok(1),',
     '"Łatwy" | "easy" => Ok(2),'),
    ("EV6-hp-bez-dolnej-granicy",
     "hp.clamp(0.0, max_hp)",
     "hp.min(max_hp)"),
    ("EV7-poziom-weterana-prog-2",
     "    if won >= 3.0 {",
     "    if won >= 2.0 {"),
    ("EV8-cud-fotel-glowny",
     "        .filter(|c| c.owner_id == seat)",
     "        .filter(|c| c.owner_id == PlayerId::new(1))"),
    ("EV9-trudnosc-dla-czlowieka",
     "    if owner == HUMAN_OWNER_ID {\n        return Ok(1.0);",
     "    if owner == HUMAN_OWNER_ID && false {\n        return Ok(1.0);"),
    ("EV10-kon-zawsze-0",
     "        .filter_map(|stock| stock.get(\"kon\"))\n        .sum();",
     "        .filter_map(|stock| stock.get(\"kon\"))\n        .sum::<f64>() * 0.0;"),
    ("EV11-wlasne-jednostki-puste",
     "    for u in state.units.iter().filter(|u| u.owner_id == primary) {",
     "    for u in state.units.iter().filter(|u| u.owner_id == primary && false) {"),
    ("Z1-epoka-fotela-zapytania (oczekiwany: rownowazny, patrz 02a-obrona-r2.md)",
     "            era: owner_era(state, HUMAN_OWNER_ID)?,",
     "            era: owner_era(state, me)?,"),
]
src = open(RF, encoding='utf-8').read()
env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0',
           CARGO_PROFILE_TEST_DEBUG='0', CARGO_TARGET_DIR=TGT)
with open(LOG, 'w', encoding='utf-8') as out:
    try:
        for name, old, new in M:
            n = src.count(old)
            if n != 1:
                out.write(f"{name}: BLAD-WZORCA (wystapien {n})\n")
                out.flush()
                continue
            open(RF, 'w', encoding='utf-8').write(src.replace(old, new))
            r = subprocess.run(['cargo', 'test', '--test', 'p4_364_render_frame'], cwd=ENG, env=env,
                               capture_output=True, text=True)
            fails = [l.split()[1] for l in r.stdout.splitlines()
                     if l.startswith('test ') and l.endswith('FAILED')]
            comp = 'error[' in r.stderr or 'error:' in r.stderr and 'could not compile' in r.stderr
            verdict = 'BLAD-KOMPILACJI' if comp else ('ZABITY' if r.returncode != 0 else 'PRZEZYL')
            out.write(f"{name}: exit={r.returncode} {verdict}; FAILED: {', '.join(fails)}\n")
            out.flush()
    finally:
        open(RF, 'w', encoding='utf-8').write(src)
    out.write('DONE\n')
