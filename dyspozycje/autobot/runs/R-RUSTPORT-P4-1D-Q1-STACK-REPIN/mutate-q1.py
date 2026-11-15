"""P4-1D-Q1: testy czulosci (mutacje) dla `cargo test --test p6_5a_display`.

Kazda mutacja MUSI dac FAIL; po kazdej plik jest przywracany bajt w bajt.
Uzycie (z katalogu rust-port/engine, z CARGO_TARGET_DIR poza repo):
    python3 -I <sciezka>/mutate-q1.py src/domain/recruitment.rs
"""
import subprocess
import sys

PATH = sys.argv[1]
MUTATIONS = [
    (
        'cywil jako reprezentant (brak filtra puli bojowej)',
        '            .filter(|u| !has_combat || is_combat(u));',
        '            .filter(|_| true);',
    ),
    (
        'cywil zawsze w puli (has_combat = false)',
        '        let has_combat = stack.iter().any(|u| is_combat(u.borrow()));',
        '        let has_combat = stack.iter().any(|u| is_combat(u.borrow())) && false;',
    ),
    (
        'hasCommander zawsze false',
        '            has_commander: stack.iter().any(|u| is_true(u.borrow().is_general)),',
        '            has_commander: false,',
    ),
    (
        'hasCommander = isGeneral.is_some() (false liczone jak true)',
        '            has_commander: stack.iter().any(|u| is_true(u.borrow().is_general)),',
        '            has_commander: stack.iter().any(|u| u.borrow().is_general.is_some()),',
    ),
]

original = open(PATH, encoding='utf-8').read()
failed = 0
try:
    for label, old, new in MUTATIONS:
        assert original.count(old) == 1, f'wzorzec mutacji nie wystepuje dokladnie raz: {label}'
        open(PATH, 'w', encoding='utf-8').write(original.replace(old, new))
        run = subprocess.run(
            ['cargo', 'test', '--test', 'p6_5a_display'],
            capture_output=True, text=True,
        )
        failing = [line for line in run.stdout.splitlines() if line.endswith('... FAILED')]
        verdict = 'FAIL (oczekiwany)' if run.returncode != 0 else 'PASS (MUTANT PRZEZYL)'
        print(f'MUTACJA: {label}\n  exit={run.returncode} -> {verdict}')
        for line in failing:
            print('   ', line)
        if run.returncode == 0:
            failed += 1
finally:
    open(PATH, 'w', encoding='utf-8').write(original)
print('PRZYWROCONO', PATH)
print('MUTANTY_PRZEZYLY', failed)
sys.exit(1 if failed else 0)
