#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1, obrona r1: mutanty nowych galezi (Z2 wieza przez kompozytor, Z3 E2/E3, Z4a/Z4c,
M16/M23). Zabity = `cargo test --test p6_k5loop_wiring_a` FAIL. Wpis: (nazwa, plik, stary, nowy, ktore_wystapienie)."""
import os, subprocess, sys, time

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'rust-port', 'engine')
SES = 'src/domain/siege_battle_session.rs'
LOOP = 'src/domain/siege_tactics_loop.rs'
TARGET = os.environ.get('CARGO_TARGET_DIR', '/tmp/wiringa-obrona-target')

M = [
    ('O01 E2 wieza: bez ripple przy zabiciu', LOOP, '                    self.kill_ripples.push(tref);\n', '', 1),
    ('O02 E3 wieza: bez tagu Rout dla uciekajacego', LOOP, '_ if st.unit(tref).c.routed => ClashTag::Rout,', '_ if false => ClashTag::Rout,', 1),
    ('O03 Z2 wieza: kompozytor pominiety (szablon)', LOOP, 'match c.compose_tower(&site) {', 'match { let _ = (c, site); None::<FullBlowInput> } {', 1),
    ('O04 Z2 wieza: luk zawsze Front', LOOP, '                        inp.hit_arc = relative_hit(', '                        inp.hit_arc = HitArc::Front;\n                        let _ = relative_hit(', 1),
    ('O05 Z2 wieza: maxHp z szablonu (10)', SES, '                max_hp: d.max_hp,', '                max_hp: 10.0,', 2),
    ('O06 Z2 wieza: kontra 1', SES, 'counter_mult: *sh.counters.get(site.target.idx)?,', 'counter_mult: 1.0,', 1),
    ('O07 Z2 wieza: trudnosc strzelca 1', SES, 'atk_diff_mult: sh.diff_mult,', 'atk_diff_mult: 1.0,', 1),
    ('O08 Z2 wieza: bez bonusow cywilizacji strzelca', SES, '            &sh.civ_bonusy,', '            &[],', 1),
    ('O09 Z2 wieza: wlasciciel strzelca = atakujacy', SES, 'let def_owner = rosters.def.first().map_or(0, |u| u.owner_id);', 'let def_owner = rosters.atk.first().map_or(0, |u| u.owner_id);', 1),
    ('O10 Z2 wieza: trudnosc wlasciciela pominieta', SES, 'diff_mult: owner.difficulty_combat_mult,', 'diff_mult: 1.0,', 1),
    ('O11 Z2 wieza: obronca na murze bez flagi', SES, '            def_on_wall: site.target_on_wall,', '            def_on_wall: false,', 2),
    ('O12 Z4a checkRout: tdm z kafla startowego', LOOP, '        let tdm = self.current_tdm(unit);', '        let tdm = self.units[side_ix(unit.side)][unit.idx].activate.terrain_defence_mult;', 1),
    ('O13 Z4a aktywacja: tdm z kafla startowego', LOOP, '        au.terrain_defence_mult = self.current_tdm(unit);\n', '', 1),
    ('O14 Z4a kompozytor: teren zawsze plaski', SES, '        let tname = self.ctx.map.name(cell.0 as i32, cell.1 as i32);', '        let tname = "Plaskie (rownina/laka)";\n        let _ = cell;', 1),
    ('O15 Z4c step: play przed walidacja', SES, '        // K5LOOP-WIRING-A r2 (Z4c Evaluatora)', '        if self.phase == SessionPhase::Prepared {\n            self.play();\n        }\n        // K5LOOP-WIRING-A r2 (Z4c Evaluatora)', 1),
    ('O16 M16 kompozytor: obronca na murze bez flagi', SES, '            def_on_wall: site.target_on_wall,', '            def_on_wall: false,', 1),
    ('O17 M23 kompozytor: teren obroncy zawsze plaski', SES, '        let def_terrain = if site.target_on_wall {', '        let def_terrain = if true {', 1),
]


def replace_nth(src, old, new, nth):
    idx = -1
    for _ in range(nth):
        idx = src.find(old, idx + 1)
        if idx < 0:
            return None
    return src[:idx] + new + src[idx + len(old):]


def run(name, path, old, new, nth):
    p = os.path.join(ROOT, path)
    src = open(p, encoding='utf-8').read()
    mutated = replace_nth(src, old, new, nth)
    if mutated is None:
        return name, 'BRAK-WZORCA'
    open(p, 'w', encoding='utf-8').write(mutated)
    try:
        env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0',
                   CARGO_TARGET_DIR=TARGET)
        t = time.time()
        r = subprocess.run(['cargo', 'test', '--test', 'p6_k5loop_wiring_a'], cwd=ROOT, env=env,
                           capture_output=True, text=True, timeout=1500)
        out = r.stdout + r.stderr
        if 'could not compile' in out:
            verdict = 'NIEKOMPILOWALNY'
        elif r.returncode != 0:
            failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
            verdict = 'ZABITY ' + ','.join(failed)
        else:
            verdict = 'PRZEZYL'
        return name, '%s (%.0fs)' % (verdict, time.time() - t)
    except subprocess.TimeoutExpired:
        return name, 'ZABITY (timeout)'
    finally:
        open(p, 'w', encoding='utf-8').write(src)


if __name__ == '__main__':
    sel = sys.argv[1:]
    for m in M:
        if sel and not any(m[0].startswith(s) for s in sel):
            continue
        n, v = run(*m)
        print(n, '=>', v, flush=True)
    print('KONIEC', flush=True)
