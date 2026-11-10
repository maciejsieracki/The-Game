#!/usr/bin/env python3
"""Mutacje tabel i gałęzi `if let Some` w `rust-port/engine/src/domain/resource_access/capital_labels.rs`
(P6.8H2 partia B, runda 3, zarzut FC nr 5). Test: `cargo test --test p6_8h2_capital_labels`.

Każdy mutant: dokładnie jedno wystąpienie `old` -> `new`; plik przywracany w `finally`.
Uzycie: mutacje-p6-8h2-b-capital.py. Wynik: `mutacje-wyniki-r3-capital.txt` (obok skryptu).
"""
import os
import pathlib
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
ENGINE = ROOT / "rust-port/engine"
SRC = ENGINE / "src/domain/resource_access/capital_labels.rs"
RESULTS = HERE / "mutacje-wyniki-r3-capital.txt"

MUTANTS = [
    ("C01", "surowiec_label_or_capitalized: gałąź `if let Some(label)` -> nigdy",
     "if let Some(label) = surowiec_key_label(key) {",
     "if let Some(label) = None::<&'static str> {"),
    ("C02", "tabela SUROWIEC: `zloto` -> `ZLOTO`",
     "\"zloto\" => \"Złoto\",\n        _ => return None,",
     "\"zloto\" => \"ZŁOTO\",\n        _ => return None,"),
    ("C03", "tabela SUROWIEC: `kon` -> spacja na końcu",
     "\"kon\" => \"Koń\",",
     "\"kon\" => \"Koń \","),
    ("C04", "tabela SUROWIEC: `braz` -> `Braz`",
     "\"braz\" => \"Brąz\",",
     "\"braz\" => \"Braz\","),
    ("C05", "tabela ZLOZE: `miedz` -> `Miedź`",
     "\"miedz\" => \"Ruda miedzi\",",
     "\"miedz\" => \"Miedź\","),
    ("C06", "tabela ZLOZE: `sol` -> `Sol`",
     "\"sol\" => \"Sól\",\n        \"miedz\" => \"Ruda miedzi\",",
     "\"sol\" => \"Sol\",\n        \"miedz\" => \"Ruda miedzi\","),
    ("C07", "tabela ZLOZE: `wegiel` -> `Węgiel!`",
     "\"wegiel\" => \"Węgiel\",",
     "\"wegiel\" => \"Węgiel!\","),
]


def run_test() -> int:
    env = dict(os.environ)
    env.setdefault("CARGO_TARGET_DIR", "/dev/shm/p6-8h2-b")
    env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_PROFILE_TEST_DEBUG": "0"})
    proc = subprocess.run(
        ["cargo", "test", "--test", "p6_8h2_capital_labels", "-q"],
        cwd=ENGINE, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    return proc.returncode


def main() -> int:
    original = SRC.read_text(encoding="utf-8")
    lines = []
    try:
        base = run_test()
        lines.append(f"BASE rc={base} ({'OK' if base == 0 else 'FAIL'})")
        for mid, desc, old, new in MUTANTS:
            count = original.count(old)
            if count != 1:
                lines.append(f"{mid} NIE_ZASTOSOWANO (wystapien={count}) {desc}")
                continue
            SRC.write_text(original.replace(old, new, 1), encoding="utf-8")
            rc = run_test()
            verdict = "KILLED" if rc != 0 else "SURVIVED"
            lines.append(f"{mid} {verdict} rc={rc} {desc}")
    finally:
        SRC.write_text(original, encoding="utf-8")
    RESULTS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
