#!/usr/bin/env python3
"""Evaluator: dodatkowe mutanty adwersarialne R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (wzorzec 01-operator-mutanty.py)."""
import os
import subprocess
import sys

ENG = sys.argv[1]
ONLY = set(sys.argv[2:])
A = 'src/domain/siege_battle_apply.rs'
P = 'src/domain/playable.rs'
B = 'src/bridge.rs'

MUTANTS = [
    ('E01', A, 'if !logged.contains(r.id.as_str()) || !seen.insert(r.id.clone()) {', 'if !seen.insert(r.id.clone()) {', 'rezerwa zwyciezcy dostaje weterana'),
    ('E02', A, '        state.selected_unit_id = None;\n', '', 'wygrana obroncy nie czysci zaznaczenia'),
    ('E03', P, 'let index = self.siege_battles_started.wrapping_add(1);', 'let index = 1u32;', 'numer bitwy staly (D-WIR-5)'),
    ('E04', A, 'pick_retreat_target(state, battle_hex, rp.centroid(battle.atk_roster), false);', 'pick_retreat_target(state, battle_hex, rp.centroid(battle.atk_roster), true);', 'remis: atakujacy odchodza od siebie'),
    ('E05', A, '.any(|c| c.position == p && state.oblegane.contains(&c.id))', '.any(|c| c.position == p && false)', 'oblegane miasto przejezdne przy odwrocie'),
    ('E06', A, 'if is_civilian_unit(&r.category, &r.type_id) && r.id != anchor_id {\n            continue;\n        }\n        if let Some(i) = unit_index(state, &r.id) {\n            let left', 'if is_civilian_unit(&r.category, &r.type_id) {\n            continue;\n        }\n        if let Some(i) = unit_index(state, &r.id) {\n            let left', 'cywilna kotwica nie traci ruchu'),
    ('E07', A, 'Ok(1.0 + if bonus.is_finite() { bonus } else { 0.0 })', 'Ok(1.0)', 'trudnosc AI ignorowana'),
    ('E08', A, 'PlayableTerrain::Forest => ("rownina", true),', 'PlayableTerrain::Forest => ("rownina", false),', 'las nie jest nakladka'),
    ('E09', A, ') == battle_hex\n                    })', ') != battle_hex\n                    })', 'remis: lider obroncow nie z heksu bitwy'),
    ('E10', P, '        attack_unit_id: Option<u64>,\n    ) -> Result<(), PlayableError> {\n        self.ensure_no_siege_battle()?;\n', '        attack_unit_id: Option<u64>,\n    ) -> Result<(), PlayableError> {\n', 'ruch w trakcie bitwy'),
    ('E11', A, '        for u in &mut state.units {\n            u.selected = false;\n        }\n', '', 'flaga selected zostaje po wygranej obroncy'),
    ('E12', A, '                        state.economy.units.entry(uid).or_default().hp = Some(hp);\n', '', 'HP ocalalych nie zapisane'),
    ('E13', P, '        self.state = next;\n        self.siege_battle = None;\n', '        self.state = next;\n', 'bitwa nie zamknieta po wyniku'),
    ('E14', A, 'Some(l) if l.key == battle.live_key && l.ops == battle.ops.len() => Some(l.session),', 'Some(l) if l.ops == battle.ops.len() => Some(l.session),', 'pamiec podreczna bez klucza bitwy'),
    ('E15', A, 'let owner_era = era(city_owner)?;', 'let owner_era = era(HUMAN_OWNER_ID)?;', 'epoka milicji = epoka atakujacego'),
    ('E16', A, '    if state.oblegane.contains(&cid) {\n        let at_war', '    if false {\n        let at_war', 'brak validateActiveSieges'),
    ('E17', A, 'Some(era(def_owner)?)', 'Some(owner_era)', 'defenderEra = epoka miasta, nie obroncy'),
    ('E18', A, '.map(|p| ikona_id_to_bronze_civ(&p.civilization).to_owned());', '.map(|_| ikona_id_to_bronze_civ("grecy").to_owned());', 'defCiv stale'),
]


def run_tests():
    env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    r = subprocess.run(['cargo', 'test', '--test', 'p6_k5loop_wiring_b_pin', '--test', 'p6_k5loop_wiring_b',
                        '--test', 'bridge_contract'], cwd=ENG, env=env, capture_output=True, text=True, timeout=1800)
    return r.returncode, r.stdout + r.stderr


def main():
    results = []
    for mid, rel, old, new, what in MUTANTS:
        if ONLY and mid not in ONLY:
            continue
        path = os.path.join(ENG, rel)
        src = open(path, encoding='utf8').read()
        n = src.count(old)
        if n != 1:
            results.append((mid, 'BLAD-WZORCA', f'{n} wystapien', what))
            print(mid, 'BLAD-WZORCA', n, flush=True)
            continue
        open(path, 'w', encoding='utf8').write(src.replace(old, new, 1))
        try:
            code, out = run_tests()
        finally:
            open(path, 'w', encoding='utf8').write(src)
        if code == 0:
            verdict, why = 'PRZEZYL', ''
        else:
            failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
            compile_err = 'error[E' in out or 'could not compile' in out
            verdict = 'ZABITY'
            why = ','.join(failed) if failed else ('kompilacja' if compile_err else 'kod != 0')
        results.append((mid, verdict, why, what))
        print(mid, verdict, why, '|', what, flush=True)
    print('PODSUMOWANIE', sum(1 for r in results if r[1] == 'ZABITY'), '/', len(results), 'zabitych', flush=True)


main()
