#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 r2: mutanty gałęzi sterownika pełnej bitwy sesji (siege_battle_session.rs)
sprawdzane testem wektorów pinu `cargo test --release --test p6_k5loop_wiring_a_pin`.
ZABITY = test FAIL (albo błąd kompilacji); plik przywracany po każdym mutancie.
Uruchomienie (z rust-port/engine, CARGO_TARGET_DIR ustawione): python3 <ten plik>
"""
import subprocess
import sys

F = 'src/domain/siege_battle_session.rs'
MUTANTS = [
    ('W01 RNG: inne mieszanie ziarna', '^ 0x5349_4547; // "SIEG"', '^ 0x5349_4548; // "SIEG"'),
    ('W02 RNG: bez numeru bitwy', 'seed ^ battle_index.wrapping_mul(0x9E37_79B9)', 'seed ^ 0u32.wrapping_mul(battle_index)'),
    ('W03 krok czasu: klatka 15 ms', 'while self.wall_acc >= BATTLE_FRAME_WALL_MS && !self.lp.st.finished {\n            self.wall_acc -= BATTLE_FRAME_WALL_MS;\n            self.wall_now += BATTLE_FRAME_WALL_MS;',
     'while self.wall_acc >= BATTLE_FRAME_WALL_MS && !self.lp.st.finished {\n            self.wall_acc -= BATTLE_FRAME_WALL_MS;\n            self.wall_now += BATTLE_FRAME_WALL_MS - 1.0;'),
    ('W04 skip przed startem przewija', 'SessionPhase::Prepared => return Err(SessionError::SkipBeforeStartNotPorted),', 'SessionPhase::Prepared => self.play(),'),
    ('W05 finish: tura +1', 'round_no: self.lp.st.round_no,', 'round_no: self.lp.st.round_no + 1,'),
    ('W06 finish: hp = max_hp', 'hp: u.c.hp,', 'hp: self.max_hp[s][i],'),
    ('W07 finish: routed = false', 'routed: u.c.routed,', 'routed: false,'),
    ('W08 finish: removed = dead', 'removed: u.c.removed,', 'removed: u.c.dead,'),
    ('W09 finish: wyłom zawsze', 'wall_ever_breached: self.lp.env.wall_ever_breached,', 'wall_ever_breached: true,'),
    ('W10 wieża bez skutków _resolveBlowOutcome', 'body.tower_outcome_effects = true;', 'body.tower_outcome_effects = false;'),
    ('W11 strzelec wieży bez kontekstu obrońcy', '.zip(sc.defender_side.as_ref())', '.zip(None::<&(Vec<CivBonusEntry>, f64)>)'),
    ('W12 bonus muru 0', 'wall_defense_total_proc: wall_totals.total_proc,', 'wall_defense_total_proc: 0.0,'),
    ('W13 bez kary morale startowej', 'let _penalty = apply_starting_morale_power_penalty(', 'let _penalty = |_: &[AdapterBattleUnit], _: &[AdapterBattleUnit], _: &mut Vec<crate::domain::siege_battle_adapter_unit::SpawnFields>, _: &mut Vec<crate::domain::siege_battle_adapter_unit::SpawnFields>, _: &ToCombatUnitOpts, _: &StartingMoraleParams| 0.0;\n        let _p2 = _penalty('),
    ('W14 finish: rzuty 0', 'rolls_drawn: body.rolls.drawn,', 'rolls_drawn: 0,'),
]


def main():
    src = open(F, encoding='utf8').read()
    results = []
    try:
        for name, old, new in MUTANTS:
            if src.count(old) != 1:
                results.append((name, f'BRAK WZORCA ({src.count(old)})'))
                continue
            open(F, 'w', encoding='utf8').write(src.replace(old, new))
            r = subprocess.run(['cargo', 'test', '--release', '--test', 'p6_k5loop_wiring_a_pin'],
                               capture_output=True, text=True)
            out = r.stdout + r.stderr
            if r.returncode == 0:
                verdict = 'PRZEŻYŁ'
            elif 'error[' in out or 'could not compile' in out:
                verdict = 'ZABITY (kompilacja)'
            else:
                verdict = 'ZABITY'
            results.append((name, verdict))
            print(name, verdict, flush=True)
    finally:
        open(F, 'w', encoding='utf8').write(src)
    for n, v in results:
        print(f'| {n} | {v} |')
    return 0


if __name__ == '__main__':
    sys.exit(main())
