#!/usr/bin/env python3
"""HITAT-FQ-REGRESJA-Q1: mutanty logiki walidacji (renderer) i emisji (silnik) czasu ciosu/strzalu.
Uzycie: hitat-mut.py <rust-port dir> <target dir> <log>"""
import os, subprocess, sys

RP, TGT, LOG = sys.argv[1], sys.argv[2], sys.argv[3]
PB = 'renderer/src/battle/playback.rs'
LOOP = 'engine/src/domain/siege_tactics_loop.rs'
REN = ['cargo', 'test', '--test', 'battle_playback', '--test', 'battle_playback_move_shot']
ENG = ['cargo', 'test', '--test', 'p6_k5loop_wiring_a_pin', 'kontrakt_czasu_akcji']

MUTS = [
    ('R1 ceil->floor', PB, '(nominal / frame).ceil() * frame', '(nominal / frame).floor() * frame', 'renderer'),
    ('R2 ceil->round', PB, '(nominal / frame).ceil() * frame', '(nominal / frame).round() * frame', 'renderer'),
    ('R3 frame>0 -> frame>=0', PB, 'if frame > 0.0 && nominal > 0.0 {', 'if frame >= 0.0 && nominal > 0.0 {', 'renderer'),
    ('R4 bez warunku nominal>0', PB, 'if frame > 0.0 && nominal > 0.0 {', 'if frame > 0.0 {', 'renderer'),
    ('R5 || -> &&', PB, 'at == t0 + nominal || at == t0 + pin_frame_time', 'at == t0 + nominal && at == t0 + pin_frame_time', 'renderer'),
    ('R6 tylko siatka', PB, 'at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)', 'at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)', 'renderer'),
    ('R7 tylko nominal', PB, 'at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)', 'at == t0 + nominal', 'renderer'),
    ('R8 okno zamiast siatki', PB, 'at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)', 'at >= t0 + nominal && at <= t0 + pin_frame_time(PIN_FRAME_MS, nominal)', 'renderer'),
    ('R9 klatka 32', PB, 'pub const PIN_FRAME_MS: f64 = 16.0;', 'pub const PIN_FRAME_MS: f64 = 32.0;', 'renderer'),
    ('R10 melee: stary warunek', PB, 'if !is_pin_event_time(a.t0, BLOW_HIT_T, *hit_at) {', 'if *hit_at != a.t0 + BLOW_HIT_T {', 'renderer'),
    ('R11 shot: stary warunek', PB, 'if !is_pin_event_time(a.t0, RANGED_FLY_MS, *land_at) {', 'if *land_at != a.t0 + RANGED_FLY_MS {', 'renderer'),
    ('R12 melee: stala strzalu', PB, 'if !is_pin_event_time(a.t0, BLOW_HIT_T, *hit_at) {', 'if !is_pin_event_time(a.t0, RANGED_FLY_MS, *hit_at) {', 'renderer'),
    ('R13 shot: stala ciosu', PB, 'if !is_pin_event_time(a.t0, RANGED_FLY_MS, *land_at) {', 'if !is_pin_event_time(a.t0, BLOW_HIT_T, *land_at) {', 'renderer'),
    ('R14 melee bez walidacji', PB, 'if !is_pin_event_time(a.t0, BLOW_HIT_T, *hit_at) {', 'if false && !is_pin_event_time(a.t0, BLOW_HIT_T, *hit_at) {', 'renderer'),
    ('E1 silnik: cios nominalny', LOOP, 'let hit = frame_raf(self.frame_ms, pu.body_ms);', 'let hit = pu.body_ms;', 'engine'),
    ('E2 silnik: strzal nominalny', LOOP, 'let hit_at = t_shot + frame_sched(self.frame_ms, RANGED_FLY_MS);', 'let hit_at = t_shot + RANGED_FLY_MS;', 'engine'),
    ('E3 silnik: hit_at bez attack_pre', LOOP, 'let hit_at = saved + dur;', 'let hit_at = saved + hit;', 'engine'),
    ('E4 silnik: Move arrive nominal+klatka', LOOP, 'arrive_at: self.now + frame_raf(self.frame_ms, MOVE_STEP_MS),', 'arrive_at: self.now + frame_raf(self.frame_ms, MOVE_STEP_MS) + 16.0,', 'engine'),
]

env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0',
           CARGO_TARGET_DIR=TGT)
out = open(LOG, 'a')
killed = 0
for name, path, old, new, crate in MUTS:
    p = os.path.join(RP, path)
    src = open(p).read()
    assert src.count(old) == 1, (name, src.count(old))
    open(p, 'w').write(src.replace(old, new))
    try:
        cmd = REN if crate == 'renderer' else ENG
        r = subprocess.run(cmd, cwd=os.path.join(RP, crate), env=env, capture_output=True, text=True, timeout=3000)
        status = 'ZABITY' if r.returncode != 0 else 'PRZEZYL'
        tail = [l for l in (r.stdout + r.stderr).splitlines() if 'panicked' in l or 'test result' in l or 'error[' in l][:3]
    finally:
        open(p, 'w').write(src)
    killed += status == 'ZABITY'
    out.write(f'{name}: {status} | {" / ".join(tail)}\n')
    out.flush()
out.write(f'WYNIK {killed}/{len(MUTS)} zabitych\nEXIT=0\n')
