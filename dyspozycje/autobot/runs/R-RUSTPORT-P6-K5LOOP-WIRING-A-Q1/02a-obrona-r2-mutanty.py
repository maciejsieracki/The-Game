#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 obrona r2: mutanty gałęzi sterownika pełnej bitwy (siege_battle_session.rs, W01-W14
jak w 01-operator-r2-mutanty.py) i poprawek ciała z obrony r2 (siege_tactics_loop.rs, B01-B08), sprawdzane testem
wektorów pinu `cargo test --release --test p6_k5loop_wiring_a_pin`.
ZABITY = test FAIL (albo błąd kompilacji); plik przywracany po każdym mutancie.
Uruchomienie (z rust-port/engine, CARGO_TARGET_DIR ustawione): python3 <ten plik>
"""
import subprocess
import sys

S = 'src/domain/siege_battle_session.rs'
L = 'src/domain/siege_tactics_loop.rs'
MUTANTS = [
    (S, 'W01 RNG: inne mieszanie ziarna', '^ 0x5349_4547; // "SIEG"', '^ 0x5349_4548; // "SIEG"'),
    (S, 'W02 RNG: bez numeru bitwy', 'seed ^ battle_index.wrapping_mul(0x9E37_79B9)', 'seed ^ 0u32.wrapping_mul(battle_index)'),
    (S, 'W03 krok czasu: klatka 15 ms', 'self.wall_now += BATTLE_FRAME_WALL_MS;', 'self.wall_now += BATTLE_FRAME_WALL_MS - 1.0;'),
    (S, 'W04 skip przed startem przewija', 'SessionPhase::Prepared => return Err(SessionError::SkipBeforeStartNotPorted),', 'SessionPhase::Prepared => self.play(),'),
    (S, 'W05 finish: tura +1', 'round_no: self.lp.st.round_no,', 'round_no: self.lp.st.round_no + 1,'),
    (S, 'W06 finish: hp = max_hp', 'hp: u.c.hp,', 'hp: self.max_hp[s][i],'),
    (S, 'W07 finish: routed = false', 'routed: u.c.routed,', 'routed: false,'),
    (S, 'W08 finish: removed = dead', 'removed: u.c.removed,', 'removed: u.c.dead,'),
    (S, 'W09 finish: wyłom zawsze', 'wall_ever_breached: self.lp.env.wall_ever_breached,', 'wall_ever_breached: true,'),
    (S, 'W10 wieża bez skutków _resolveBlowOutcome', 'body.tower_outcome_effects = true;', 'body.tower_outcome_effects = false;'),
    (S, 'W11 strzelec wieży bez kontekstu obrońcy', '.zip(sc.defender_side.as_ref())', '.zip(None::<&(Vec<CivBonusEntry>, f64)>)'),
    (S, 'W12 bonus muru 0', 'wall_defense_total_proc: wall_totals.total_proc,', 'wall_defense_total_proc: 0.0,'),
    (S, 'W13 finish: rzuty 0', 'rolls_drawn: body.rolls.drawn,', 'rolls_drawn: 0,'),
    (S, 'W14 bez siatki zasięgu terenu (dawne D-B7)', 'body.terrain_range_delta = Some(range_grid);', 'body.terrain_range_delta = None;\n        let _ = range_grid;'),
    (S, 'W15 dawny czas ciosu/strzału', 'body.pin_blow_timing = true;', 'body.pin_blow_timing = false;'),
    (S, 'W16 delta zasięgu: znak minus ignorowany', "raw.replace('\\u{2212}', \"-\")", "raw.replace('\\u{2212}', \"+\")"),
    (L, 'B01 _applyTerrainRange nie na początku aktywacji', '        self.refresh_terrain_range(unit.side, unit.idx);\n', ''),
    (L, 'B02 ogon ciosu 0', 'self.tail[ix][unit.idx] = BLOW_LUNGE_MS + BLOW_SETTLE_MS - pu.body_ms;', 'self.tail[ix][unit.idx] = 0.0;'),
    (L, 'B03 trafienie strzału na końcu (FLY+GAP)', 'dur = at + RANGED_FLY_MS;', 'dur = at + RANGED_FLY_MS + RANGED_GAP_MS;'),
    (L, 'B04 wieża widzi pozycję końcową marszu', '*u == unit && *t0 > self.now)', '*u == unit && *t0 > f64::INFINITY)'),
    (L, 'B05 wieża bez czasu wystrzału', "        self.env.body.set_now(clock.v_now);\n        let Some(target) = self.env.pick_tower_for_row", "        let Some(target) = self.env.pick_tower_for_row"),
    (L, 'B06 zagrożenia strzelców bez _applyTerrainRange', '                self.refresh_terrain_range(opposite(unit.side), i);\n', ''),
    (L, 'B07 zejście z korony bez _applyTerrainRange', '            self.refresh_terrain_range(BattleSide::Defender, idx);\n', ''),
]


def main():
    srcs = {f: open(f, encoding='utf8').read() for f in (S, L)}
    results = []
    try:
        for f, name, old, new in MUTANTS:
            src = srcs[f]
            if src.count(old) != 1:
                results.append((name, f'BRAK WZORCA ({src.count(old)})'))
                print(name, results[-1][1], flush=True)
                continue
            open(f, 'w', encoding='utf8').write(src.replace(old, new))
            r = subprocess.run(['cargo', 'test', '--release', '--test', 'p6_k5loop_wiring_a_pin'],
                               capture_output=True, text=True)
            open(f, 'w', encoding='utf8').write(src)
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
        for f, src in srcs.items():
            open(f, 'w', encoding='utf8').write(src)
    for n, v in results:
        print(f'| {n} | {v} |')
    return 0


if __name__ == '__main__':
    sys.exit(main())
