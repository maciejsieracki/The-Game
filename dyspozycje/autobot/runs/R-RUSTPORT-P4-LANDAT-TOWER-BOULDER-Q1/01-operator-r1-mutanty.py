#!/usr/bin/env python3
"""R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 (Operator r1): mutanty silnika i renderera.

Kazdy mutant = jedna podmiana tekstu (musi wystapic dokladnie raz), uruchomienie wskazanych testow, przywrocenie pliku.
Mutant ZABITY = testy daja EXIT != 0. Uzycie (z korzenia repo):
  CARGO_TARGET_DIR=... python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/01-operator-r1-mutanty.py [ID...]
"""
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
LOOP = 'rust-port/engine/src/domain/siege_tactics_loop.rs'
PB = 'rust-port/renderer/src/battle/playback.rs'
ENGINE_TESTS = (
    'rust-port/engine',
    ['cargo', 'test', '--test', 'p6_k5loop_wiring_a_pin', '--test', 'p4_1i3_actions', '--',
     'kontrakt_land_at_wiezy_i_kamienia_rowny_chwili_trafienia', 'kontrakt_czasu_akcji_z_rendererem_klatka_16ms',
     'zgodnosc_akcji_strzalu_wiezy_z_pinem'],
)
RENDER_TESTS = (
    'rust-port/renderer',
    ['cargo', 'test', '--test', 'battle_playback', '--test', 'battle_playback_siege', '--', 'landat_tb',
     'invalid_steps_are_reported', 'siege_errors_are_reported'],
)
TOWER = 'let land_at = clock.v_now + frame_sched(ff_step_ms(clock), TOWER_FLY_MS);'
STONE = 'let land_at = self.now + frame_sched(self.frame_ms, WALL_HIT_FLY_MS);'
PB_TOWER = 'if !is_pin_event_time(a.t0, RANGED_FLY_MS, *land_at) {\n                    return Err(PlaybackError::LandAt {'
PB_STONE = 'if !is_pin_event_time(a.t0, BOULDER_MS, *land_at) {\n                    return Err(PlaybackError::BoulderLandAt {'

MUTANTS = {
    'E1': (LOOP, TOWER, 'let land_at = clock.v_now + TOWER_FLY_MS;', ENGINE_TESTS, 'wieza: stary nominal 380'),
    'E2': (LOOP, STONE, 'let land_at = self.now + WALL_HIT_FLY_MS;', ENGINE_TESTS, 'kamien: stary nominal 700'),
    'E3': (LOOP, TOWER, 'let land_at = clock.v_now + frame_sched(16.0, TOWER_FLY_MS);', ENGINE_TESTS,
           'wieza: stala klatka 16 zamiast FF_STEP_MS'),
    'E4': (LOOP, STONE, 'let land_at = self.now + frame_sched(16.0, WALL_HIT_FLY_MS);', ENGINE_TESTS,
           'kamien: stala klatka 16 zamiast klatki ciala'),
    'E5': (LOOP, TOWER, 'let land_at = clock.v_now + (TOWER_FLY_MS / ff_step_ms(clock)).floor() * ff_step_ms(clock);',
           ENGINE_TESTS, 'wieza: floor zamiast ceil (368)'),
    'E6': (LOOP, TOWER, 'let land_at = clock.v_now + frame_sched(ff_step_ms(clock), TOWER_FLY_MS) + ff_step_ms(clock);',
           ENGINE_TESTS, 'wieza: o klatke za pozno (400)'),
    'E7': (LOOP, STONE, 'let land_at = self.now + frame_sched(self.frame_ms, WALL_HIT_FLY_MS) + self.frame_ms;',
           ENGINE_TESTS, 'kamien: o klatke za pozno (720)'),
    'E8': (LOOP, STONE, 'let land_at = self.now + (WALL_HIT_FLY_MS / self.frame_ms).floor() * self.frame_ms;',
           ENGINE_TESTS, 'kamien: floor zamiast ceil (688)'),
    'R1': (PB, PB_TOWER, 'if *land_at != a.t0 + RANGED_FLY_MS {\n                    return Err(PlaybackError::LandAt {',
           RENDER_TESTS, 'renderer wieza: tylko nominal'),
    'R2': (PB, PB_STONE, 'if *land_at != a.t0 + BOULDER_MS {\n                    return Err(PlaybackError::BoulderLandAt {',
           RENDER_TESTS, 'renderer kamien: tylko nominal'),
    'R3': (PB, PB_TOWER, 'if false && *land_at > 0.0 {\n                    return Err(PlaybackError::LandAt {',
           RENDER_TESTS, 'renderer wieza: bez kontroli'),
    'R4': (PB, PB_STONE, 'if false && *land_at > 0.0 {\n                    return Err(PlaybackError::BoulderLandAt {',
           RENDER_TESTS, 'renderer kamien: bez kontroli'),
    'R5': (PB, PB_TOWER, 'if !is_pin_event_time(a.t0, BOULDER_MS, *land_at) {\n                    return Err(PlaybackError::LandAt {',
           RENDER_TESTS, 'renderer wieza: stala kamienia'),
    'R6': (PB, PB_STONE, 'if !is_pin_event_time(a.t0, RANGED_FLY_MS, *land_at) {\n                    return Err(PlaybackError::BoulderLandAt {',
           RENDER_TESTS, 'renderer kamien: stala wiezy'),
}


def run(mid):
    path, old, new, (crate, cmd), desc = MUTANTS[mid]
    full = os.path.join(ROOT, path)
    with open(full, encoding='utf-8') as f:
        src = f.read()
    if src.count(old) != 1:
        raise SystemExit(f'{mid}: kotwica wystepuje {src.count(old)} razy')
    try:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(src.replace(old, new))
        p = subprocess.run(cmd, cwd=os.path.join(ROOT, crate), capture_output=True, text=True)
        out = p.stdout + p.stderr
        compiled = 'error[E' not in out and 'could not compile' not in out
        verdict = 'ZABITY' if p.returncode != 0 else 'PRZEZYL'
        if not compiled:
            verdict = 'NIE_KOMPILUJE'
        print(f'{mid} {verdict} exit={p.returncode} :: {desc}', flush=True)
    finally:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(src)


if __name__ == '__main__':
    for m in (sys.argv[1:] or list(MUTANTS)):
        run(m)
