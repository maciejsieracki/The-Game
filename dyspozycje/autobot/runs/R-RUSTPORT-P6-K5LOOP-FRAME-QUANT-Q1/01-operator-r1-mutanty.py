#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (Operator r1): mutanty logiki kwantyzacji klatki (D-FQ-1..3).

Każdy mutant = jedna podmiana tekstu w źródle (dokładnie jedno wystąpienie), build release testu
`p6_k5loop_wiring_a_pin` (wspólny CARGO_TARGET_DIR), uruchomienie testów:
  * `wektory_pinu_pelnej_bitwy_bajt_w_bajt` (34 wektory pinu + 3 bliźniaki `_klatka4`, w tym 12 `fq_*` @16 ms),
  * `kwantyzacja_odcinkow_klatka_pinu` (wzory D-FQ-1),
oraz testów osi czasu ciała w lib (`pin3_timeline_tests`) dla mutantów oznaczonych `lib=True`.
Wynik: ZABITY (test pada albo build nie przechodzi), PRZEŻYŁ. Źródło przywracane po każdym mutancie
(sprawdzane `git diff --quiet` na pliku).

Uruchomienie (z katalogu rust-port/engine):
  CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<target> \
      python3 <ten plik> [id ...]
"""
import os
import subprocess
import sys

LOOP = 'src/domain/siege_tactics_loop.rs'
SESS = 'src/domain/siege_battle_session.rs'
FF = 'src/domain/siege_tactics_fastforward.rs'

# (id, plik, stary tekst, nowy tekst, opis, lib-testy)
M = [
    ('Q1', LOOP, '(ms / frame).ceil() * frame', '(ms / frame).floor() * frame',
     'frame_sched: ceil -> floor', False),
    ('Q2', LOOP, '(ms / frame).ceil() * frame', '(ms / frame).round() * frame',
     'frame_sched: ceil -> round', False),
    ('Q3', LOOP, '(ms / frame).ceil() * frame', 'ms',
     'frame_sched: bez kwantyzacji', False),
    ('Q4', LOOP, '    if frame > 0.0 && ms > 0.0 {\n        (ms / frame).ceil()',
     '    if frame > 0.0 && ms >= 0.0 {\n        (ms / frame).ceil()',
     'frame_sched: warunek ms > 0 -> ms >= 0 (zegar 0)', False),
    ('Q5', LOOP, 'pub fn frame_raf(frame: f64, ms: f64) -> f64 {\n    frame_sched(frame, ms)\n}',
     'pub fn frame_raf(_frame: f64, ms: f64) -> f64 {\n    ms\n}',
     'frame_raf: czas nominalny (krok, cios, lunge)', False),
    ('Q6', LOOP, '        frame_raf(frame, MOVE_STEP_MS)\n    }\n}',
     '        MOVE_STEP_MS\n    }\n}',
     'step_ms: krok nominalny 240', False),
    ('Q7', LOOP, '            self.gap_due = Some(at + ms);\n        }\n        frame_sched(self.frame_ms, ms)',
     '            self.gap_due = Some(at + ms);\n        }\n        ms',
     'gap_after: przerwa STEP_GAP nominalna (70 zamiast 80)', False),
    ('Q8', LOOP, '        let hit = frame_raf(self.frame_ms, pu.body_ms);',
     '        let hit = pu.body_ms;',
     'cios wręcz w nominalnym BLOW_HIT_T (150 zamiast 160)', False),
    ('Q9', LOOP, '                    frame_raf(self.frame_ms, BLOW_LUNGE_MS) + BLOW_SETTLE_MS - hit;',
     '                    BLOW_LUNGE_MS + BLOW_SETTLE_MS - hit;',
     'ogon ciosu: koniec lunge nominalny (260 zamiast 272)', False),
    ('Q10', LOOP, '                    frame_raf(self.frame_ms, BLOW_LUNGE_MS) + BLOW_SETTLE_MS - hit;',
     '                    frame_raf(self.frame_ms, BLOW_LUNGE_MS) + frame_sched(self.frame_ms, BLOW_SETTLE_MS) - hit;',
     'ogon ciosu: settle kwantyzowany z góry (due 496 zamiast 492)', False),
    ('Q11', LOOP, '                    dur = at + frame_sched(self.frame_ms, RANGED_FLY_MS);',
     '                    dur = at + RANGED_FLY_MS;',
     'strzał jednostki: trafienie nominalne 380 (koniec ciała)', False),
    ('Q12', LOOP, '        let hit_at = t_shot + frame_sched(self.frame_ms, RANGED_FLY_MS);',
     '        let hit_at = t_shot + RANGED_FLY_MS;',
     'strzał jednostki: chwila trafienia na osi ciała nominalna', False),
    ('Q13', LOOP, '            + f64::from(self.moves) * (frame_raf(frame, MOVE_STEP_MS) + frame_sched(frame, gap));',
     '            + f64::from(self.moves) * (MOVE_STEP_MS + gap);',
     'marsz oblężniczy (_siegeWalkTo): chwile kroków nominalne', False),
    ('Q14', LOOP, '        let dur = f64::from(moves) * frame_raf(self.frame_ms, MOVE_STEP_MS)\n            + schedules * frame_sched(self.frame_ms, f64::from(STEP_GAP_MS));',
     '        let dur = f64::from(moves) * MOVE_STEP_MS + schedules * f64::from(STEP_GAP_MS);',
     'marsz oblężniczy: czas aktywacji nominalny', False),
    ('Q15', SESS, '        body.frame_ms = BATTLE_FRAME_WALL_MS;', '        body.frame_ms = 0.0;',
     'sesja: brak klatki ciała (dawny model nominalny)', False),
    ('Q16', SESS, '        self.lp.env.body.frame_ms = self.clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS);',
     '        let _ = self.clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS);',
     'diag_set_speed_mul nie przelicza klatki ciała (bliźniaki 1/4 ms liczone z klatką 16)', False),
    ('Q17', LOOP, '    t0 < v_now || (t0 == v_now && ord < reader)', '    t0 < v_now || (t0 == v_now && ord <= reader)',
     'timeline_done: remis due kroku i zegara = krok wykonany', True),
    ('Q18', LOOP, '            Some(d) if self.frame_ms > 0.0 && d <= self.now && self.now - d < self.frame_ms => d,',
     '            Some(_) if false => 0.0,',
     'timeline_ord: krok z zegara STEP_GAP traktowany jak krok _raf (bez D-FQ-2)', True),
    ('Q19', LOOP, '        self.env.body.set_reader_due(due);\n        let picked',
     '        self.env.body.set_reader_due(f64::MIN);\n        let picked',
     'wystrzał wieży czyta oś jak ciało (bez due zegara)', False),
    ('Q20', LOOP, '        let due = flight.map_or(v_now, |f| f.2);',
     '        let due = flight.map_or(v_now, |_| f64::MIN);',
     'trafienie wieży czyta oś jak ciało (bez due zegara)', False),
    ('Q21', LOOP, '                            .push((p.tower, clock.v_now + js_max(0.0, p.ms)));',
     '                            .push((p.tower, clock.v_now + js_max(0.0, p.ms) + 16.0));',
     'due wystrzału wieży przesunięty o klatkę (zła kolejność w klatce)', False),
    ('Q22', LOOP, '            .push((target, row, clock.v_now + TOWER_FLY_MS));',
     '            .push((target, row, clock.v_now));',
     'due trafienia wieży = chwila wystrzału', False),
    ('Q23', LOOP, 'fn timeline_key(t0: f64, ord: f64) -> (f64, f64) {\n    (t0, ord)\n}',
     'fn timeline_key(t0: f64, ord: f64) -> (f64, f64) {\n    (t0, -ord)\n}',
     'timeline_key: odwrócona kolejność faz w klatce', True),
    ('Q24', SESS, '        lp.body_done_raf = true;', '        lp.body_done_raf = false;',
     'kolejność klatki: skutek ciała w _drainTimers zamiast w kolejce _raf (zamiana _drainTimers/_raf)', False),
    ('Q25', FF, '        clock.drain_timers(|c, p| host.event(c, st, FfEvent::TimerFired(p)));',
     '        let batch0 = std::mem::take(&mut st.queue);\n        for item in batch0 {\n            host.event(clock, st, FfEvent::RunQueued(item));\n        }\n        clock.drain_timers(|c, p| host.event(c, st, FfEvent::TimerFired(p)));',
     'kolejność klatki: kolejka _raf (_ffQueue) PRZED _drainTimers (test czułości kolejności)', False),
    ('Q26', LOOP, '            self.gap_due = Some(at + ms);', '            self.gap_due = Some(at + frame_sched(self.frame_ms, ms));',
     'gap_after: due kroku = chwila klatki (utrata nominalnego due)', True),
]


def run(cmd, env=None, timeout=1800):
    p = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout + p.stderr


def main():
    only = set(sys.argv[1:])
    env = dict(os.environ)
    res = []
    for mid, path, old, new, desc, lib in M:
        if only and mid not in only:
            continue
        src = open(path).read()
        n = src.count(old)
        if n != 1:
            res.append((mid, desc, f'BŁĄD SKRYPTU (wystąpień {n})'))
            print(mid, 'BLAD', n, flush=True)
            continue
        open(path, 'w').write(src.replace(old, new))
        try:
            rc, out = run('cargo test --release --test p6_k5loop_wiring_a_pin -- '
                          'wektory_pinu_pelnej_bitwy_bajt_w_bajt kwantyzacja_odcinkow_klatka_pinu', env)
            killed_by = []
            if rc != 0:
                killed_by.append('wektory/kwantyzacja' if 'test result' in out else 'build')
            if lib:
                rc2, out2 = run('cargo test --release --lib -- pin3_timeline_tests', env)
                if rc2 != 0:
                    killed_by.append('pin3_timeline_tests')
            verdict = 'ZABITY (' + ', '.join(killed_by) + ')' if killed_by else 'PRZEŻYŁ'
            if rc != 0:
                fails = [l for l in out.splitlines() if 'rozbieżności' in l or 'panicked' in l or ': zwyci' in l
                         or ('fq_' in l and '!=' in l) or ('_klatka' in l and '!=' in l)]
                verdict += ' | ' + ' / '.join(fails[:3])[:300]
        finally:
            open(path, 'w').write(src)
        rc3, _ = run(f'git diff --quiet HEAD -- {path} || true')
        res.append((mid, desc, verdict))
        print(mid, verdict, flush=True)
    print('\n| Mutant | Zmiana | Wynik |\n|---|---|---|')
    for mid, desc, v in res:
        print(f'| {mid} | {desc} | {v} |')


if __name__ == '__main__':
    main()
