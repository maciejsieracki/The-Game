#!/usr/bin/env python3
"""Mutacje mnoznika ery Racji (REPIN-EKONOMIA-B batch 1). Przywraca plik zrodlowy po kazdej mutacji."""
import shutil
import subprocess

ENGINE = '/home/user/The-Game/.claude/worktrees/wf_7519e610-85f-1/rust-port/engine'
F = ENGINE + '/src/domain/city_growth.rs'
BACKUP = '/tmp/claude-0/cg-good.rs'
shutil.copy(F, BACKUP)
good = open(BACKUP, encoding='utf-8').read()
muts = {
    'M1_no_bronze_2x': ('            if owner_era == 2.0 {\n                2.0\n            } else {\n                4.0\n            }', '            4.0'),
    'M2_era1_not_neutral': ('owner_era <= 1.0 {', 'owner_era < 1.0 {'),
    'M3_no_era_in_cost': ('                * ration_era_food_cost_multiplier(owner_era);', '                ;'),
}
env = {'CARGO_INCREMENTAL': '0', 'CARGO_TARGET_DIR': '/home/user/cargo-target-shared/wf_7519e610-85f-1',
       'CARGO_PROFILE_DEV_DEBUG': '0', 'PATH': '/root/.cargo/bin:/usr/local/bin:/usr/bin:/bin', 'HOME': '/root'}
try:
    for name, (a, b) in muts.items():
        assert good.count(a) == 1, name
        open(F, 'w', encoding='utf-8').write(good.replace(a, b))
        r = subprocess.run(['cargo', 'test', '--test', 'p6_repin_b_ration_era'], cwd=ENGINE,
                           capture_output=True, text=True, env=env)
        out = r.stdout + r.stderr
        fails = [l.strip() for l in out.splitlines() if l.strip().startswith('test ') and 'FAILED' in l]
        print(name, 'exit', r.returncode, 'failed:', fails)
finally:
    shutil.copy(BACKUP, F)
    print('restored', open(F, encoding='utf-8').read() == good)
