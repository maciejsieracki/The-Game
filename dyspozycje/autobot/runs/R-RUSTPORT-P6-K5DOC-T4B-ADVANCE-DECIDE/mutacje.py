# Mutacje K5DOC-T4b (dispatch R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE): kazda mutacja MUSI dac FAIL testu
# p6_k5doc_t4b. Zrodlo jest przywracane po kazdej mutacji (sprawdzane bajt-w-bajt przez sha256).
# Uruchomienie z korzenia worktree: python3 dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE/mutacje.py
# Wymaga CARGO_TARGET_DIR (poza repo) i flag CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.
import hashlib
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
SRC = os.path.join(ROOT, 'rust-port', 'engine', 'src', 'domain', 'siege_tactics_advance.rs')
ENGINE = os.path.join(ROOT, 'rust-port', 'engine')

ATTACK_BLOCK = (
    "    // Web :8241-8246: atak z obecnej pozycji, bez sasiada -> done.\n"
    "    if world.can_attack_from(&unit.id, unit.q, unit.r) {\n"
    "        return match world.pick_adjacent_target(&unit.id) {\n"
    "            Some(target_id) => AdvanceDecision::Attack { target_id },\n"
    "            None => AdvanceDecision::Done,\n"
    "        };\n"
    "    }\n"
)
COMPACT_GATE = (
    "    if !world.compact_attack_allows_step(&unit.id, col) {\n"
    "        return AdvanceDecision::Done;\n"
    "    }\n"
)
ANCHOR_THEN = "    // Web :8272:"


def mut_a(t):
    # (a) kolejnosc krokow: atak z pozycji (krok 3) przeniesiony ZA marsz (krok 10) -> Move wygrywa z Attack.
    assert t.count(ATTACK_BLOCK) == 1, 'kotwica bloku ataku'
    t = t.replace(ATTACK_BLOCK, '')
    assert t.count(ANCHOR_THEN) == 1, 'kotwica then'
    return t.replace(ANCHOR_THEN, ATTACK_BLOCK + ANCHOR_THEN)


def mut_b(t):
    # (b) bramka 8270 (kompakt na kroku zachlannym) pominieta.
    assert t.count(COMPACT_GATE) == 1, 'kotwica bramki'
    return t.replace(COMPACT_GATE, '')


def mut_c(t):
    # (c) Attack zwracane zamiast Move, gdy cel poza zasiegiem (jednostka nie moze uderzyc z pozycji).
    assert t.count("let Some((_target_id, target_pos))") == 1, 'kotwica wroga'
    t = t.replace("let Some((_target_id, target_pos))", "let Some((target_id, target_pos))")
    guard = (
        "    if !world.can_attack_from(&unit.id, unit.q, unit.r) {\n"
        "        return AdvanceDecision::Attack { target_id };\n"
        "    }\n"
    )
    assert t.count(ANCHOR_THEN) == 1, 'kotwica then'
    return t.replace(ANCHOR_THEN, guard + ANCHOR_THEN)


MUTANTS = [('a', mut_a), ('b', mut_b), ('c', mut_c)]


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def run_tests():
    p = subprocess.run(
        ['cargo', 'test', '--test', 'p6_k5doc_t4b', '--no-fail-fast'],
        cwd=ENGINE, capture_output=True, text=True,
    )
    out = p.stdout + p.stderr
    failed = sorted(set(re.findall(r'^test (\S+) \.\.\. FAILED', out, re.M)))
    return p.returncode, failed


def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        original = f.read()
    base_sha = sha(SRC)
    results = []
    try:
        for name, fn in MUTANTS:
            mutated = fn(original)
            assert mutated != original, f'mutacja {name} nic nie zmienila'
            with open(SRC, 'w', encoding='utf-8') as f:
                f.write(mutated)
            code, failed = run_tests()
            results.append((name, code, failed))
            with open(SRC, 'w', encoding='utf-8') as f:
                f.write(original)
            assert sha(SRC) == base_sha, 'przywrocenie zrodla nie zgadza sie bajt-w-bajt'
    finally:
        with open(SRC, 'w', encoding='utf-8') as f:
            f.write(original)
    ok = True
    for name, code, failed in results:
        verdict = 'FAIL (oczekiwany)' if code != 0 else 'PASS (BLAD: mutacja przeszla)'
        ok = ok and code != 0
        print(f'mutacja ({name}): exit={code} -> {verdict}; testy FAILED: {", ".join(failed) or "brak"}')
    print('ZRODLO PRZYWROCONE: ' + ('tak' if sha(SRC) == base_sha else 'NIE'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
