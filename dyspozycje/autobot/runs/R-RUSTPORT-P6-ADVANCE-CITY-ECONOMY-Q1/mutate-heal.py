#!/usr/bin/env python3
"""Mutacje plastra S9 (advance_manpower_heal) w turn_economy_advance.rs; test p6_adv_city_econ_heal.
Uzycie: python3 -I mutate-heal.py <ENGINE_DIR> <CARGO_TARGET_DIR> <LOG_DIR>"""
import subprocess, sys, os
engine, target, logs = sys.argv[1:4]
path = os.path.join(engine, 'src/domain/turn_economy_advance.rs')
orig = open(path).read()
MUT = [
    ('M1 max<-regen', 'mp_max_proc: Some(civ_matrix_param(matrix, key, "mp_max_proc"))', 'mp_max_proc: Some(civ_matrix_param(matrix, key, "mp_regen_proc"))'),
    ('M2 koszt<-max', 'mp_koszt_jednostki_proc: Some(civ_matrix_param(matrix, key, "mp_koszt_jednostki_proc"))', 'mp_koszt_jednostki_proc: Some(civ_matrix_param(matrix, key, "mp_max_proc"))'),
    ('M3 max<-koszt', 'mp_max_proc: Some(civ_matrix_param(matrix, key, "mp_max_proc"))', 'mp_max_proc: Some(civ_matrix_param(matrix, key, "mp_koszt_jednostki_proc"))'),
    ('M4 owner0->playerEra zamiana', 'None if oid == 0 => player_era,\n            None => 1.0,\n        }\n    };\n    let matrix', 'None if oid == 0 => 1.0,\n            None => 1.0,\n        }\n    };\n    let matrix'),
    ('M5 era default 1->2', 'None if oid == 0 => player_era,\n            None => 1.0,\n        }\n    };\n    let matrix', 'None if oid == 0 => player_era,\n            None => 2.0,\n        }\n    };\n    let matrix'),
    ('M6 callback odciety', 'input.on_unit_hp_changed,\n    )', 'None,\n    )'),
    ('M7 getMaxHp stale', '&|type_id, _unit| get_max_hp(type_id),', '&|type_id, _unit| { let _ = get_max_hp(type_id); 100.0 },'),
    ('M8 difficulty Normal', 'input.difficulty,\n        &resolve_era', 'ManpowerDifficulty::Normal,\n        &resolve_era'),
    ('M9 brak resolvera macierzy', 'Some(&resolve_matrix),', 'None,'),
    ('M10 klucz po owner 0', 'civ_by_owner.get(&oid)', 'civ_by_owner.get(&0)'),
    ('M11 pusty klucz akceptowany', '.filter(|k| !k.is_empty())?', '?'),
    ('M12 civ key lowercase pominiety -> zawsze brak', 'let key = civ_by_owner.get(&oid).filter(|k| !k.is_empty())?;', 'let key = civ_by_owner.get(&oid).filter(|k| !k.is_empty() && k.as_str() != "Rzymianie")?;'),
    ('M13 era resolver ignorowany', 'Some(f) => f(oid),\n            None if oid == 0 => player_era,', 'Some(_f) => player_era,\n            None if oid == 0 => player_era,'),
]
env = dict(os.environ, CARGO_TARGET_DIR=target, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
killed = 0
try:
    for name, a, b in MUT:
        assert orig.count(a) == 1, (name, orig.count(a))
        open(path, 'w').write(orig.replace(a, b))
        r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_adv_city_econ_heal'], cwd=engine, env=env, capture_output=True, text=True)
        open(os.path.join(logs, 'mut-heal-' + name.split()[0] + '.log'), 'w').write(r.stdout + r.stderr)
        compile_err = 'error[' in r.stderr or 'could not compile' in r.stderr
        status = 'COMPILE-ERR' if compile_err else ('KILLED' if r.returncode != 0 else 'SURVIVED')
        if status == 'KILLED': killed += 1
        print(name, status, flush=True)
finally:
    open(path, 'w').write(orig)
print('killed', killed, 'of', len(MUT))
