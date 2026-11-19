#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1: mutanty sesji (kazdy = jedna galaz/warunek). Zabity = test p6_k5loop_wiring_a FAIL."""
import os, subprocess, sys, time

ROOT = '/home/user/The-Game/.claude/worktrees/wf_06892f8f-ee4-1/rust-port/engine'
SES = 'src/domain/siege_battle_session.rs'
LOOP = 'src/domain/siege_tactics_loop.rs'
TARGET = '/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/wiringa/target'

M = [
    ('M01 rng: bez numeru bitwy', SES, 'let mixed = seed ^ battle_index.wrapping_mul(0x9E37_79B9) ^ 0x5349_4547;', 'let mixed = seed ^ 0u32.wrapping_mul(battle_index) ^ 0x5349_4547;'),
    ('M02 rng: stala 0.5', SES, '        self.rng.next_f64()\n', '        { let _ = self.rng.next_f64(); 0.5 }\n'),
    ('M03 tryb reczny: general jako Adapter', SES, '                SessionError::ManualModeNotPorted { general_id: id }\n', '                SessionError::Adapter(AdapterError::AttackerHasGeneral(id))\n'),
    ('M04 skip przed startem: przewijanie', SES, '            SessionPhase::Prepared => return Err(SessionError::SkipBeforeStartNotPorted),', '            SessionPhase::Prepared => self.play(),'),
    ('M05 step w Prepared: blad', SES, '            SessionPhase::Prepared => self.play(),\n            SessionPhase::Running => {}', '            SessionPhase::Prepared => return Err(SessionError::NotFinished),\n            SessionPhase::Running => {}'),
    ('M06 step: bez reszty klatki', SES, '            frames += 1;\n        }\n', '            frames += 1;\n        }\n        self.wall_acc = 0.0;\n'),
    ('M07 step: warunek klatki >', SES, 'while self.wall_acc >= BATTLE_FRAME_WALL_MS', 'while self.wall_acc > BATTLE_FRAME_WALL_MS'),
    ('M08 czas rzeczywisty: ff_active true', LOOP, '        self.env.body.set_ff_active(false);\n        clock.advance_v_clock(wall);', '        self.env.body.set_ff_active(true);\n        clock.advance_v_clock(wall);'),
    ('M09 czas rzeczywisty: bez advance_v_clock', LOOP, '        self.env.body.set_ff_active(false);\n        clock.advance_v_clock(wall);', '        self.env.body.set_ff_active(false);\n        clock.v_now += 16.0;\n        let _ = wall;'),
    ('M10 finish przed koncem', SES, '        let Some(winner) = self.lp.winner else {\n            return Err(SessionError::NotFinished);\n        };', '        let winner = self.lp.winner.unwrap_or(LoopWinner::Draw);'),
    ('M11 sufit tur: no_breach_cap 10', SES, '            no_breach_cap: data.no_breach_cap,', '            no_breach_cap: 10,'),
    ('M12 wieza bez skutkow', SES, '        body.tower_outcome_effects = true;\n', ''),
    ('M13 bez kompozytora ciosu', SES, '        body.blow_composer = Some(Box::new(SessionBlowComposer {', '        let _unused = Some(Box::new(SessionBlowComposer {'),
    ('M14 kompozytor: szarza zawsze', SES, 'let is_charge = !site.ranged && site.first_blow && !d.tmpl.braces_against_charge;', 'let is_charge = !site.ranged && !d.tmpl.braces_against_charge;'),
    ('M15 kompozytor: kontry odwrocone', SES, '            BattleSide::Attacker => self.counters[0][site.attacker.idx][site.target.idx],\n            BattleSide::Defender => self.counters[1][site.attacker.idx][site.target.idx],', '            BattleSide::Attacker => self.counters[0][site.attacker.idx][site.target.idx],\n            BattleSide::Defender => self.counters[0][site.target.idx][site.attacker.idx],'),
    ('M16 kompozytor: obronca na murze bez flagi', SES, '            def_on_wall: site.target_on_wall,', '            def_on_wall: false,'),
    ('M17 kompozytor: luk z szablonu (Front)', LOOP, '            input.hit_arc = hit_arc;\n', ''),
    ('M18 bez kary morale startowej', SES, '        let _penalty = apply_starting_morale_power_penalty(', '        let _penalty = (|_: &[AdapterBattleUnit], _: &[AdapterBattleUnit], _: &mut Vec<crate::domain::siege_battle_adapter_unit::SpawnFields>, _: &mut Vec<crate::domain::siege_battle_adapter_unit::SpawnFields>, _: &ToCombatUnitOpts, _: &StartingMoraleParams| ())('),
    ('M19 step: NaN przechodzi', SES, '        if !(wall_delta_ms.is_finite() && wall_delta_ms >= 0.0) {', '        if false {'),
    ('M20 wieza: bez obnizenia morale', LOOP, '                SceneEffect::ApplyMoraleDamage { dmg, extra_morale } => {\n                    self.apply_morale_damage(st, tref, max_hp, dmg, extra_morale);\n                }', '                SceneEffect::ApplyMoraleDamage { .. } => {}'),
    ('M21 bariera wall_now nie rosnie', SES, '            self.wall_now += BATTLE_FRAME_WALL_MS;\n', ''),
    ('M22 pierwszy cios: first_blow false', SES, '            first_blow_of_pair: site.first_blow,', '            first_blow_of_pair: false,'),
    ('M23 teren obroncy: zawsze plaski', SES, '        let def_terrain = if site.target_on_wall {', '        let def_terrain = if true {'),
    ('M24 skip: pozostaje Running', SES, '        self.phase = SessionPhase::Skipping;\n', ''),
]

def run(name, path, old, new):
    p = os.path.join(ROOT, path)
    src = open(p, encoding='utf-8').read()
    if src.count(old) != 1:
        return name, 'BRAK-WZORCA(%d)' % src.count(old)
    open(p, 'w', encoding='utf-8').write(src.replace(old, new))
    try:
        env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0', CARGO_TARGET_DIR=TARGET)
        t = time.time()
        r = subprocess.run(['cargo', 'test', '--test', 'p6_k5loop_wiring_a'], cwd=ROOT, env=env, capture_output=True, text=True, timeout=1500)
        out = r.stdout + r.stderr
        if 'error[' in out or 'error:' in out and 'could not compile' in out:
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
