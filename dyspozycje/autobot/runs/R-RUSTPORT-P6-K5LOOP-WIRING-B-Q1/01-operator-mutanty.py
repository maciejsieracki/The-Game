#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 Operator r1: mutanty zastosowania wyniku i mostu bitwy oblezniczej.

Kazdy mutant = jedna podmiana tekstu (dokladnie jedno wystapienie) w pliku zrodlowym; werdykt = testy
`p6_k5loop_wiring_b_pin`, `p6_k5loop_wiring_b`, `bridge_contract` (ZABITY = test pada albo kompilacja pada z bledem
typu; PRZEZYL = testy zielone). Zrodla przywracane po kazdym mutancie (tresc z pamieci, bez git stash).

Uzycie: CARGO_TARGET_DIR=... python3 01-operator-mutanty.py <rust-port/engine> [ID ...]
"""
import os
import subprocess
import sys

ENG = sys.argv[1]
ONLY = set(sys.argv[2:])
A = 'src/domain/siege_battle_apply.rs'
P = 'src/domain/playable.rs'
B = 'src/bridge.rs'

MUTANTS = [
    ('M01', A, 'u.hp > 0.0 && (!u.dead || u.routed)', 'u.hp > 0.0 && !u.dead', 'rozbity (routed) nie jest ocalalym'),
    ('M02', A, 'LoopWinner::Draw => &[0, 1],', 'LoopWinner::Draw => &[0],', 'remis: ocalali tylko atakujacego'),
    ('M03', A, 'if !logged.contains(u.id.as_str()) {', 'if false {', 'rezerwa (poza logiem sceny) usuwana'),
    ('M04', A, '.min(VETERAN_MAX_BATTLES_TRACKED)', '', 'brak sufitu weterana 3'),
    ('M05', A, '.map_or(0.0, f64::floor);', '.map_or(0.0, |v| v);', 'battlesSurvived bez floor'),
    ('M06', A, 'let capture_blocked = winner == LoopWinner::Attacker && !breached;', 'let capture_blocked = winner == LoopWinner::Attacker && breached;', 'odwrocony warunek muru (canCaptureCity)'),
    ('M07', A, 'MovementPoints::new((left - 1.0).max(0.0))', 'MovementPoints::new(left)', 'brak spendAttackMpOnLive'),
    ('M08', A, 'if is_civilian_unit(&r.category, &r.type_id) && r.id != anchor_id {', 'if false {', 'cywil (nie kotwica) traci ruch'),
    ('M09', A, 'state.siege_machines_ready.remove(&cid).unwrap_or_default()', 'state.siege_machines_ready.get(&cid).cloned().unwrap_or_default()', 'machiny nie zuzyte'),
    ('M10', A, '    if winner == LoopWinner::Draw {\n        end_map_siege', '    if false {\n        end_map_siege', 'remis nie konczy oblezenia'),
    ('M11', A, 'if !at_war || !adjacent {', 'if !adjacent {', 'validateActiveSieges bez bramki wojny'),
    ('M12', A, 'rp.centroid(battle.atk_roster), true)', 'rp.centroid(battle.atk_roster), false)', 'obroncy uciekaja w strone atakujacych'),
    ('M13', A, 'for step in 1..=3 {', 'for step in 1..=1 {', 'fan-out tylko 1 krok'),
    ('M14', A, 'if city_center == Some((uq, ur)) {', 'if false {', 'obroncy z centrum miasta tez sie rozchodza'),
    ('M15', A, 'if matches!(tile.terrain, PlayableTerrain::Water) {', 'if false {', 'woda przejezdna przy odwrocie'),
    ('M16', A, '    ordered.sort_by(|a, b| a.t0.partial_cmp(&b.t0).unwrap_or(std::cmp::Ordering::Equal));\n', '', 'akcje bez sortowania po t0 (D-WIRB-6)'),
    ('M17', A, '    inp.relations.alliances = alliance_pairs_from_deals(state);\n', '', 'sojusz ze statusu zamiast z umowy (D-ADP-11)'),
    ('M18', A, '.filter(|d| d.kind.is_alliance())', '', 'kazda umowa = sojusz'),
    ('M19', A, '    battle.ops.push(DriverOp::Step(wall_ms));\n', '', 'krok nie zapisany do powtorki (D-WIRB-1)'),
    ('M20', A, '        s.battle_loop_mut().take_actions();\n        for op', '        for op', 'powtorka oddaje akcje startu ponownie'),
    ('M21', B, 'let events = if matches!(command, EngineCommand::FinishSiegeBattle) {', 'let events = if false {', 'wynik bez StateChanged'),
    ('M22', P, '    pub fn advance_turn(&mut self) -> Result<(), PlayableError> {\n        self.ensure_no_siege_battle()?;\n', '    pub fn advance_turn(&mut self) -> Result<(), PlayableError> {\n', 'koniec tury w trakcie bitwy (D-WIRB-2)'),
    ('M23', A, ') == 1\n', ') <= 1\n', 'oblegajacy na heksie miasta liczy sie jako przy murach'),
    ('M24', A, '        state.economy.units.remove(&uid);\n', '', 'usunieta jednostka zostawia wpis ekonomii'),
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
