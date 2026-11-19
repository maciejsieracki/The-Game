#!/usr/bin/env python3
"""Obrona r1 R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: mutanty Evaluatora E01-E18 (wzorce 02-evaluator-mutanty.py; E13 dostosowany
do nowego `finish_siege_battle`) + mutanty poprawek obrony O01-O12. Werdykt: testy `p6_k5loop_wiring_b_pin`,
`p6_k5loop_wiring_b`, `bridge_contract` oraz (mutanty playable.rs) testy biblioteki z filtrem `siege_battle`.
Uzycie: python3 02a-obrona-mutanty.py <rust-port/engine> [ID ...]"""
import os
import subprocess
import sys

ENG = sys.argv[1]
ONLY = set(sys.argv[2:])
A = 'src/domain/siege_battle_apply.rs'
P = 'src/domain/playable.rs'

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
    ('E13', P, '            Ok(payload) => {\n                self.state = next;\n                self.siege_battle = None;\n', '            Ok(payload) => {\n                self.state = next;\n', 'bitwa nie zamknieta po wyniku'),
    ('E14', A, 'Some(l) if l.key == battle.live_key && l.ops == battle.ops.len() => Some(l.session),', 'Some(l) if l.ops == battle.ops.len() => Some(l.session),', 'pamiec podreczna bez klucza bitwy'),
    ('E15', A, 'let owner_era = era(city_owner)?;', 'let owner_era = era(HUMAN_OWNER_ID)?;', 'epoka milicji = epoka atakujacego'),
    ('E16', A, '    if state.oblegane.contains(&cid) {\n        let at_war', '    if false {\n        let at_war', 'brak validateActiveSieges'),
    ('E17', A, 'Some(era(def_owner)?)', 'Some(owner_era)', 'defenderEra = epoka miasta, nie obroncy'),
    ('E18', A, '.map(|p| ikona_id_to_bronze_civ(&p.civilization).to_owned());', '.map(|_| ikona_id_to_bronze_civ("grecy").to_owned());', 'defCiv stale'),
    # Poprawki obrony r1.
    ('O01', A, '.partition(|a| a.t0 <= frame.v_now);', '.partition(|_| true);', 'Z1: akcje z przyszlym t0 oddawane od razu'),
    ('O02', A, '        actions: rest,\n', '        actions: Vec::new(),\n', 'Z1: Finish gubi wstrzymane akcje'),
    ('O03', A, '            live_key: next_live_key(),\n', '            live_key: self.live_key,\n', 'Z3: klon dzieli klucz pamieci podrecznej'),
    ('O04', A, '    if !at_war {\n        return Err(SiegeBattleError::NotAtWar', '    if false {\n        return Err(SiegeBattleError::NotAtWar', 'Z2: szturm bez wojny'),
    ('O05', A, '        if dist(anchor) != 1 {', '        if false {', 'Z2: szturm z daleka'),
    ('O06', A, '    if owner_i64(city.owner_id) == HUMAN_OWNER_ID {\n        return Err(SiegeBattleError::NotEnemyCity', '    if false {\n        return Err(SiegeBattleError::NotEnemyCity', 'Z2: szturm wlasnego miasta'),
    ('O07', A, '        Some(b) if b.id.get() != unit_id => {', '        Some(b) if false && b.id.get() != unit_id => {', 'Z2: panel oblezenia z dowolna kotwica'),
    ('O08', A, '.any(|u| u.id == anchor_id && is_civilian_unit(&u.category, &u.type_id))', '.any(|_| false)', 'Z2: cywil atakuje (attack_choice)'),
    ('O09', A, '        if f64::from(anchor.movement) <= 0.0 {', '        if false {', 'Z2: jednostka bez ruchu atakuje (attack_choice)'),
    ('O10', P, '                let city_id = battle.city_id;\n                self.siege_battle = None;\n', '                let city_id = battle.city_id;\n', 'Z6: blad wyniku nie zamyka bitwy'),
    ('O11', P, '    pub fn select_unit(&mut self, unit_id: u64) -> Result<(), PlayableError> {\n        // D-WIRB-2 (obrona r1, U1): scena zaslania mape (`main.ts:36940-37024`), zaznaczenie niedostepne.\n        self.ensure_no_siege_battle()?;\n', '    pub fn select_unit(&mut self, unit_id: u64) -> Result<(), PlayableError> {\n', 'U1: zaznaczenie w trakcie bitwy'),
    ('O12', P, '        // D-WIRB-2 (obrona r1, U1): w trakcie bitwy stan gry = migawka startu bitwy.\n        self.ensure_no_siege_battle()?;\n', '', 'U1: nowy gracz w trakcie bitwy'),
]


def run(args):
    env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    r = subprocess.run(['cargo', 'test'] + args, cwd=ENG, env=env, capture_output=True, text=True, timeout=3000)
    return r.returncode, r.stdout + r.stderr


def run_tests(rel):
    code, out = run(['--test', 'p6_k5loop_wiring_b_pin', '--test', 'p6_k5loop_wiring_b', '--test', 'bridge_contract'])
    if code == 0 and rel == P:
        code, out2 = run(['--lib', 'siege_battle'])
        out += out2
    return code, out


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
            code, out = run_tests(rel)
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
