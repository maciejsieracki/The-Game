#!/usr/bin/env python3
"""R-RUSTPORT-P4-1H-RJ-REPIN-Q3 obrona r1: mutacja M6 (zarzut 4 Evaluatora).

M6: predykat oblezenia wolany z INNA jednostka (owner_id + 1) zamiast ruszajacej sie -
wynik predykatu przestaje zalezec od wlasciciela jednostki. Stare wektory (siegeOwner=3,
mover owner=0) tego NIE wykrywaja (owner 1 != 3 nadal blokuje); nowe wektory
siege_predicate_false_for_mover (siegeOwner=0) musza dac FAIL.
Uzycie: z katalogu rust-port/engine, CARGO_TARGET_DIR poza repo.
"""
import os
import subprocess

ROOT = os.getcwd()
PF = os.path.join(ROOT, 'src/domain/pathfinding.rs')
OLD = """                if siege.is_some_and(|blocks| blocks(unit, nq, nr)) {
                    continue;
                }
                if n_key == dest {"""
NEW = """                let other = RuchJednostka {
                    owner_id: unit.owner_id + 1,
                    ..unit.clone()
                };
                if siege.is_some_and(|blocks| blocks(&other, nq, nr)) {
                    continue;
                }
                if n_key == dest {"""
env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
src = open(PF, encoding='utf8').read()
assert src.count(OLD) == 1
open(PF, 'w', encoding='utf8').write(src.replace(OLD, NEW))
try:
    p = subprocess.run(['cargo', 'test', '--test', 'p4_1h_rj_repin'], cwd=ROOT, env=env,
                       capture_output=True, text=True)
    out = p.stdout + p.stderr
    failed = [l for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
    summary = [l for l in out.splitlines() if l.startswith('test result')]
    errs = [l for l in out.splitlines() if l.startswith('error')]
    verdict = 'FAIL(oczekiwany)' if p.returncode != 0 and failed else 'NIE-WYKRYTA'
    print(f'M6-predykat-oblezenia-z-inna-jednostka: EXIT {p.returncode} {verdict} {summary} {failed} {errs[:3]}', flush=True)
finally:
    open(PF, 'w', encoding='utf8').write(src)
