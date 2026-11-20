#!/usr/bin/env python3
# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 (Operator r1): mutanty logiki marszu krok po kroku (D-MI-1/2).
# Kazdy mutant: podmiana tekstu w zrodle (dokladnie jedno wystapienie), build binarki `p6_k5loop_wiring_a_pin` (release),
# wektory pinu (`wektory_pinu_pelnej_bitwy_bajt_w_bajt`) + 128 kandydatow c1 @1 i @16 (pliki pinu w scratchpadzie),
# potem przywrocenie zrodla (`git checkout`). Wynik: ZABITY (wektor albo kandydat rozbiezny) / PRZEZYL.
# Uzycie: python3 01-operator-r1-mutanty.py [ID ...]   (pliki tymczasowe: scratchpad/march-inc/)
#        python3 01-operator-r1-mutanty.py --lib [ID ...]: zamiast wektorow testy lib `march_incremental_tests`
#        (mutanty, ktore przezyly wektory i 256 kandydatow; ZABITY = co najmniej jeden test FAILED).
import os
import subprocess
import sys

WT = '/home/user/The-Game/.claude/worktrees/wf_be2f551a-b12-1'
ENG = WT + '/rust-port/engine'
LOOP = 'rust-port/engine/src/domain/siege_tactics_loop.rs'
SES = 'rust-port/engine/src/domain/siege_battle_session.rs'
M = '/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/march-inc'
ENV = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0',
           CARGO_TARGET_DIR=M + '/tgt')

MUTANTS = [
    ('A1', 'marsz atomowy (sesja bez march_incremental)', SES,
     'body.march_incremental = true;', 'body.march_incremental = false;'),
    ('A2', 'koniec kroku w fazie zegarow (timer_raf zawsze false)', LOOP,
     '            .is_some_and(|c| c.id == id && c.stage == MarchStage::StepEnd)',
     '            .is_some_and(|c| c.id == id && c.stage == MarchStage::StepEnd && false)'),
    ('A3', 'przerwa tez w fazie krokow (timer_raf bez etapu)', LOOP,
     '            .is_some_and(|c| c.id == id && c.stage == MarchStage::StepEnd)',
     '            .is_some_and(|c| c.id == id)'),
    ('A4', 'advance_enter bez preludium dead/fadingOut', LOOP,
     '        // Preludium `:8199-8202` (`moveLeft <= 0` sprawdzają niżej C-FLANK i decyzja, jak w pętli atomowej).\n'
     '        if st.finished || seq.dead || seq.fading_out {',
     '        // Preludium `:8199-8202` (`moveLeft <= 0` sprawdzają niżej C-FLANK i decyzja, jak w pętli atomowej).\n'
     '        if st.finished {'),
    ('A5', 'advance_step_end bez zapisu lastAutoMoveFrom', LOOP,
     '            self.doctrine[side_ix(unit.side)][unit.idx].last_auto_move_from = Some(p);',
     '            let _ = p;'),
    ('A6', 'advance_step_end bez finished', LOOP,
     '        if st.finished {\n            return MarchNext::Done;\n        }\n        let au = self.advance_unit(unit, c.move_left);',
     '        let au = self.advance_unit(unit, c.move_left);'),
    ('A7', 'odmowa bramki muru czeka na koniec kroku', LOOP,
     '        if res.outcome.done {\n            MarchNext::Done\n        } else {\n            MarchNext::StepEnd\n        }',
     '        let _ = res.outcome.done;\n        MarchNext::StepEnd'),
    ('A8', 'advance_enter: mover_routed ze startu (bez odswiezenia)', LOOP,
     '        // `_siegeApproachRestricted` (`:7953`) czyta `ru.routed` w chwili kroku.\n        self.mover_routed = seq.routed;',
     '        // `_siegeApproachRestricted` (`:7953`) czyta `ru.routed` w chwili kroku.'),
    ('A9', 'advance_enter: moveLeft ze startu aktywacji', LOOP,
     '        let au = self.advance_unit(unit, c.move_left);\n        let bst = BatchState::new(BatchBoard {\n            atk: Vec::new(),\n            def: Vec::new(),\n            occ: self.occ_by_key.clone(),\n        });\n        let (decision, missing) = {',
     '        let au = self.advance_unit(unit, st.unit(unit).c.move_left);\n        let bst = BatchState::new(BatchBoard {\n            atk: Vec::new(),\n            def: Vec::new(),\n            occ: self.occ_by_key.clone(),\n        });\n        let (decision, missing) = {'),
    ('A10', 'ranged_forward_enter bez moveLeft <= 0', LOOP,
     '        if c.move_left <= 0.0 {\n            return MarchNext::Done;\n        }\n        let mounted',
     '        let mounted'),
    ('A11', 'ranged_step_end: wejscie w zasieg = koniec (bez _rangedAction)', LOOP,
     '                    return self.ranged_action_enter(st, c);',
     '                    return MarchNext::Done;'),
    ('A12', 'ranged_step_end: NaN moveLeft kontynuuje', LOOP,
     '                if c.move_left <= 0.0 || c.move_left.is_nan() {\n                    MarchNext::Done\n                } else {\n                    MarchNext::Gap',
     '                if c.move_left <= 0.0 {\n                    MarchNext::Done\n                } else {\n                    MarchNext::Gap'),
    ('A13', 'przerwa STEP_GAP_MS + 1 ms', LOOP,
     '            MarchNext::Gap => Some((MarchStage::Gap, f64::from(STEP_GAP_MS))),',
     '            MarchNext::Gap => Some((MarchStage::Gap, f64::from(STEP_GAP_MS) + 1.0)),'),
    ('A14', 'koniec kroku 1 ms wczesniej', LOOP,
     '                Some((MarchStage::StepEnd, frame_raf(self.frame_ms, MOVE_STEP_MS)))',
     '                Some((MarchStage::StepEnd, frame_raf(self.frame_ms, MOVE_STEP_MS) - 1.0))'),
    ('A15', 'done() z fazy krokow przez zegar (nie od razu)', LOOP,
     '                    if self.in_raf && ms <= 0.0 {',
     '                    if self.in_raf && ms <= 0.0 && false {'),
    ('A16', 'march_pending zawsze false (BodyDone po start)', LOOP,
     '    fn march_pending(&self, unit: UnitRef) -> bool {\n        self.march.is_some_and(|c| c.unit == unit)',
     '    fn march_pending(&self, unit: UnitRef) -> bool {\n        let _ = unit;\n        false'),
    ('A17', 'KITE: bez strzalu w zagrozenie po kroku', LOOP,
     '                let tgt = self.ranged_target_now(unit, st).or_else(|| {\n                    threat_ix.filter(|&i| {',
     '                let tgt = self.ranged_target_now(unit, st).or_else(|| {\n                    threat_ix.filter(|&i| false && {'),
    ('A18', 'strzal z marszu: done() bez ogona (fly + gap)', LOOP,
     '                let dur = if self.pin_blow_timing && shot.is_some() {\n                    self.tail[ix][unit.idx] = RANGED_GAP_MS;\n                    fly',
     '                let dur = if self.pin_blow_timing && shot.is_some() {\n                    self.tail[ix][unit.idx] = RANGED_GAP_MS;\n                    fly + frame_sched(self.frame_ms, RANGED_GAP_MS)'),
    ('A19', 'cios po marszu przesuniety o klatke', LOOP,
     '                    let dur = self.attack_tail(unit, &pu, &mut pend, 0.0);',
     '                    let dur = self.attack_tail(unit, &pu, &mut pend, 16.0);'),
    ('A20', 'moveLeft marszu nie trafia do complete', LOOP,
     '        if c.moved {\n            if let Some(p) = self.pending[ix][unit.idx].as_mut() {\n                p.move_left = Some(c.move_left);\n            }\n        }',
     '        let _ = c.moved;'),
    ('A21', 'ranged_forward_enter bez preludium dead', LOOP,
     '        if st.finished || seq.dead || seq.fading_out {\n            return MarchNext::Done;\n        }\n        self.mover_routed = seq.routed;\n        if c.move_left <= 0.0 {',
     '        if st.finished {\n            return MarchNext::Done;\n        }\n        self.mover_routed = seq.routed;\n        if c.move_left <= 0.0 {'),
    ('A22', 'ranged_step_end bez finished', LOOP,
     '            MarchKind::RangedForward | MarchKind::Advance => {\n                if st.finished {\n                    return MarchNext::Done;\n                }',
     '            MarchKind::RangedForward | MarchKind::Advance => {'),
    ('A23', 'KITE: bez finished w callbacku', LOOP,
     '            MarchKind::Kite { threat_ix, .. } => {\n                if st.finished {\n                    return MarchNext::Done;\n                }',
     '            MarchKind::Kite { threat_ix, .. } => {'),
    ('A24', 'zegary marszu bez odroczenia BodyTimer do fazy krokow (defer tylko BodyDone)', LOOP,
     '            LoopTimer::BodyTimer(id) => self.body_done_raf && self.env.body.timer_raf(id),',
     '            LoopTimer::BodyTimer(id) => self.body_done_raf && self.env.body.timer_raf(id) && false,'),
]


def sh(cmd, **kw):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, **kw)


def build():
    r = subprocess.run(['cargo', 'test', '--release', '--test', 'p6_k5loop_wiring_a_pin', '--no-run'], cwd=ENG, env=ENV,
                       capture_output=True, text=True)
    for line in (r.stdout + r.stderr).splitlines():
        if 'Executable' in line and 'p6_k5loop_wiring_a_pin' in line:
            return line.split('(')[-1].rstrip(')')
    print(r.stderr[-3000:])
    return None


def run(binp):
    v = sh(f'{binp} wektory_pinu_pelnej_bitwy_bajt_w_bajt 2>&1', cwd=ENG)
    vec_ok = 'test result: ok' in v.stdout
    out = {}
    for f, extra in (('1', 'WIRING_A_RUST_FF_STEP=1 '), ('16', '')):
        c = sh(f'{extra}WIRING_A_VECTORS_FILE={M}/c128_{f}_pin.json {binp} kandydaci_z_pliku_na_zadanie --nocapture 2>&1'
               ' | grep KANDYDAT', cwd=ENG)
        lines = c.stdout.splitlines()
        out[f] = (sum('ZGODNY' in x for x in lines), len(lines))
    return vec_ok, v.stdout, out


def run_lib():
    r = subprocess.run(['cargo', 'test', '--release', '--lib', 'march_incremental_tests'], cwd=ENG, env=ENV,
                       capture_output=True, text=True)
    out = r.stdout + r.stderr
    if 'error[' in out or 'could not compile' in out:
        return None, out
    failed = [x.split()[1] for x in out.splitlines() if x.startswith('test ') and x.endswith('FAILED')]
    return failed, out


def main():
    lib = '--lib' in sys.argv
    only = set(a for a in sys.argv[1:] if a != '--lib')
    for mid, desc, path, old, new in MUTANTS:
        if only and mid not in only:
            continue
        full = WT + '/' + path
        src = open(full).read()
        assert src.count(old) == 1, (mid, src.count(old))
        open(full, 'w').write(src.replace(old, new))
        try:
            if lib:
                failed, out = run_lib()
                if failed is None:
                    print(f'{mid}\tBLAD-BUILDU\t{desc}', flush=True)
                    print(out[-2000:], flush=True)
                else:
                    names = ','.join(f.split('::')[-1] for f in failed)
                    print(f"{mid}\t{'ZABITY' if failed else 'PRZEZYL'}\tlib\t{names}\t{desc}", flush=True)
                continue
            binp = build()
            if binp is None:
                print(f'{mid}\tBLAD-BUILDU\t{desc}', flush=True)
                continue
            vec_ok, vout, cand = run(binp)
            failed = [x for x in vout.splitlines() if x.startswith(('a3_', 'mi_', 'p3_', 'fq_', 'mur_')) or ': ' in x][:3]
            killed = (not vec_ok) or cand['1'][0] < 128 or cand['16'][0] < 128
            print(f"{mid}\t{'ZABITY' if killed else 'PRZEZYL'}\twektory={'ok' if vec_ok else 'FAIL'}\t"
                  f"@1={cand['1'][0]}/{cand['1'][1]}\t@16={cand['16'][0]}/{cand['16'][1]}\t{desc}", flush=True)
            if not vec_ok:
                for x in vout.splitlines():
                    if 'rozbieżności' in x or x.startswith(('a3_', 'mi_', 'p3_', 'fq_', 'mur_', 'zz_')):
                        print('   ', x[:200], flush=True)
            del failed
        finally:
            open(full, 'w').write(src)
    print('KONIEC', flush=True)


if __name__ == '__main__':
    main()
