#!/usr/bin/env python3
"""M13 (stolica: `designated_capital_id` -> `None`) uruchomiony PRZED dodaniem testu
`stolica_bonus_honours_designated_capital` (FC r2, zarzut 6).

Test wejsciowy = wersja `tests/p6_8h2_capital_labels.rs` z commita 598da6429 (runda 1, bez
testu designated). Pliki z biezacego drzewa sa kopiowane i przywracane w `finally`.
Wynik: wiersze na stdout i w `mutacja-m13-bez-testu-wynik.txt` (obok skryptu).
"""
import pathlib
import subprocess
import os

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]  # runs/<ID> -> autobot -> dyspozycje -> korzen repo
ENGINE = ROOT / "rust-port/engine"
CAP_SRC = ENGINE / "src/domain/resource_access/capital_labels.rs"
TEST = ENGINE / "tests/p6_8h2_capital_labels.rs"
OLD_TEST = HERE / "mutacja-m13-stary-test-598da6429.rs"
OUT = HERE / "mutacja-m13-bez-testu-wynik.txt"

OLD = "is_player_capital_city(city, all_cities, designated_capital_id, &[0], found_order)"
NEW = "is_player_capital_city(city, all_cities, None, &[0], found_order)"


def run_test() -> int:
    env = dict(os.environ)
    env.setdefault("CARGO_TARGET_DIR", "/dev/shm/p6-8h2-b")
    env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_PROFILE_TEST_DEBUG": "0"})
    proc = subprocess.run(
        ["cargo", "test", "--test", "p6_8h2_capital_labels", "-q"],
        cwd=ENGINE, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    return proc.returncode, proc.stdout


def main() -> int:
    cap_orig = CAP_SRC.read_text(encoding="utf-8")
    test_orig = TEST.read_text(encoding="utf-8")
    assert cap_orig.count(OLD) == 1, "M13: fragment nie wystepuje dokladnie raz"
    old_test = OLD_TEST.read_text(encoding="utf-8")
    lines = []
    try:
        TEST.write_text(old_test, encoding="utf-8")
        base_rc, _ = run_test()
        lines.append(f"BASE (stary test, bez mutanta) rc={base_rc}")
        CAP_SRC.write_text(cap_orig.replace(OLD, NEW, 1), encoding="utf-8")
        rc, out = run_test()
        verdict = "SURVIVED" if rc == 0 else "KILLED"
        lines.append(f"M13 {verdict} rc={rc} (stary test 598da6429, designated -> None)")
        lines.append(out.rstrip())
    finally:
        CAP_SRC.write_text(cap_orig, encoding="utf-8")
        TEST.write_text(test_orig, encoding="utf-8")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
