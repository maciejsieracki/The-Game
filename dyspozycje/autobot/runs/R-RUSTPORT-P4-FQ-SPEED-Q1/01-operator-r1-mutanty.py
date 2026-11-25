#!/usr/bin/env python3
"""R-RUSTPORT-P4-FQ-SPEED-Q1 (Operator r1): mutanty kodu prędkości bitwy.

Każdy mutant: podmiana tekstu w źródle (dokładnie jedno wystąpienie), build + wskazane testy, przywrócenie źródła.
ZABITY = testy padają. Uruchomienie z katalogu `rust-port` (CARGO_TARGET_DIR z otoczenia):
    python3 ../dyspozycje/autobot/runs/R-RUSTPORT-P4-FQ-SPEED-Q1/01-operator-r1-mutanty.py [ID ...]
"""
import os
import subprocess
import sys

LOOP = 'engine/src/domain/siege_tactics_loop.rs'
SESS = 'engine/src/domain/siege_battle_session.rs'
CLOCK = 'engine/src/domain/siege_tactics_clock.rs'
PB = 'renderer/src/battle/playback.rs'
CLI = 'client/src/lib.rs'

ENGINE_T = ('engine', ['cargo', 'test', '--release', '--test', 'p6_k5loop_wiring_a_pin', '--test', 'p4_fq_speed'])
RENDER_T = ('renderer', ['cargo', 'test', '--test', 'battle_playback', '--test', 'battle_playback_move_shot'])
CLIENT_T = ('client', ['cargo', 'test', '--test', 'siege_battle_client', 'fq_speed'])

MUTANTS = [
    ('S1', 'BodyDone strzału odkładany do fazy `_raf` (dawny model D-PIN3-3)', LOOP,
     'LoopTimer::BodyDone(u) => self.body_done_raf && !self.env.body.done_is_timer(u),',
     'LoopTimer::BodyDone(u) => self.body_done_raf || self.env.body.done_is_timer(u),', ENGINE_T),
    ('S2', 'strzał w chwili wywołania: czas do trafienia skwantyzowany zamiast nominalnego `due`', LOOP,
     '                            self.shot_done_timer[ix][unit.idx] = true;\n                            return RANGED_FLY_MS;',
     '                            self.shot_done_timer[ix][unit.idx] = true;\n                            return fly;', ENGINE_T),
    ('S3', 'strzał z wejścia marszu bez flagi zegara', LOOP,
     '                    // FQ-SPEED-Q1 (D-FQS-1): strzał z wejścia marszu = zegar `_schedule(RANGED_FLY_MS)` z tej chwili.\n                    self.shot_done_timer[ix][unit.idx] = true;',
     '                    // FQ-SPEED-Q1 (D-FQS-1): strzał z wejścia marszu = zegar `_schedule(RANGED_FLY_MS)` z tej chwili.\n                    self.shot_done_timer[ix][unit.idx] = false;', ENGINE_T),
    ('S4', 'strzał po krokach (`attack_pre > 0`) też jako zegar z nominalnym czasem', LOOP,
     '                        if attack_pre == 0.0 {\n                            // FQ-SPEED-Q1 (D-FQS-1)',
     '                        if attack_pre >= 0.0 {\n                            // FQ-SPEED-Q1 (D-FQS-1)', ENGINE_T),
    ('S5', 'flaga strzału nie czyszczona w `complete`', LOOP,
     '        let ix = side_ix(unit.side);\n        self.shot_done_timer[ix][unit.idx] = false;\n        let Some(pend)',
     '        let ix = side_ix(unit.side);\n        let Some(pend)', ENGINE_T),
    ('S6', '`set_speed_idx` nie przelicza klatki ciała', SESS,
     '        self.clock.speed_mul = SPEED_STEPS[self.speed_idx];\n        // FRAME-QUANT-Q1 (D-FQ-1): klatka ciała = krok przewijania przy nowym `speedMul`.\n        self.lp.env.body.frame_ms = self.clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS);',
     '        self.clock.speed_mul = SPEED_STEPS[self.speed_idx];', ENGINE_T),
    ('S7', '`set_speed_idx` nie zmienia `speedMul` zegara (tylko klatkę ciała)', SESS,
     '        self.clock.speed_mul = SPEED_STEPS[self.speed_idx];\n        // FRAME-QUANT-Q1',
     '        let _ = SPEED_STEPS[self.speed_idx];\n        // FRAME-QUANT-Q1', ENGINE_T),
    ('S8', 'zawinięcie `_setSpeedIdx` bez `+ n` (ujemne idx)', CLOCK,
     '        idx.rem_euclid(n)', '        (idx % n).abs()', ENGINE_T),
    ('S9', 'panel ± zawija zamiast przycinać', CLOCK,
     '        idx.clamp(0, n - 1)', '        idx.rem_euclid(n)', ENGINE_T),
    ('S10', '`frame_ms()` sesji stałe 16 ms', SESS,
     '        self.clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS)\n    }\n\n    /// PIN3',
     '        BATTLE_FRAME_WALL_MS\n    }\n\n    /// PIN3', ENGINE_T),
    ('S11', 'SPEED_STEPS 128 → 100', CLOCK,
     '64.0, 128.0, 256.0', '64.0, 100.0, 256.0', ENGINE_T),
    ('R1', 'renderer: siatka zdarzeń ze stałej 16 ms zamiast `PlaybackOpts::frame_ms`', PB,
     '    at == t0 + nominal || at == t0 + pin_frame_time(frame, nominal)',
     '    at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS + 0.0 * frame, nominal)', RENDER_T),
    ('R2', 'renderer: `Move` tylko nominalny `t0 + MOVE_STEP_MS`', PB,
     '                if !is_pin_event_time(self.opts.frame_ms, a.t0, MOVE_STEP_MS, *arrive_at) {',
     '                if *arrive_at != a.t0 + MOVE_STEP_MS {', RENDER_T),
    ('R3', 'renderer: domyślna klatka 0 (tylko nominał)', PB,
     '            frame_ms: PIN_FRAME_MS,\n        }', '            frame_ms: 0.0,\n        }', RENDER_T),
    ('C1', 'klient: klatka playbacku stała 16 ms niezależnie od prędkości', CLI,
     '        frame_ms: siege_battle_frame_ms(speed_mul),', '        frame_ms: siege_battle_frame_ms(1.0 + 0.0 * speed_mul),', CLIENT_T),
]


def run(mid, desc, path, old, new, test):
    src = open(path, encoding='utf8').read()
    if src.count(old) != 1:
        return f'{mid}: BŁĄD szablonu ({src.count(old)} wystąpień)'
    open(path, 'w', encoding='utf8').write(src.replace(old, new))
    try:
        crate, cmd = test
        r = subprocess.run(cmd, cwd=crate, capture_output=True, text=True, timeout=3000)
        out = r.stdout + r.stderr
        if 'error[' in out or 'error:' in out and 'could not compile' in out:
            verdict = 'ZABITY (kompilacja)'
        elif r.returncode != 0:
            failed = [l for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
            verdict = 'ZABITY: ' + ', '.join(x.split()[1] for x in failed)
        else:
            verdict = 'PRZEŻYŁ'
    finally:
        open(path, 'w', encoding='utf8').write(src)
    return f'{mid} | {desc} | {verdict}'


if __name__ == '__main__':
    want = set(sys.argv[1:])
    for m in MUTANTS:
        if want and m[0] not in want:
            continue
        print(run(*m), flush=True)
