#!/usr/bin/env python3
"""Mutacje runda 4 (P6.8H2 partia B) - gałęzie sterujące `active_access.rs` i `society_inputs.rs`.

Cel: zamknąć zarzut FC r3 pkt 3 (przeżyły mutanty: era_ui_name, pl_primary_key dla ł/ć/ę/ń/ź,
tiebreak remisu) oraz pokryć nowe gałęzie r4 (Z1 default path, Z5 prototyp, Z6 dominacja).

Każdy mutant: dokładnie jedno wystąpienie `old` -> `new` w pliku źródłowym, uruchomienie
testu docelowego (`cargo test --test ...`), przywrócenie pliku w `finally`.
Mutanty M02-M29 są z runu r3 (ten sam skrypt-źródło, import przez importlib); M01 i M03 mają
zaktualizowane kotwice (kod r4 zmienił linię guardu). Ścieżki względne do korzenia repo.

Użycie: mutacje-p6-8h2-b-r4.py --target active|society [--from N] [--to M]  (numeracja od 1)
Wynik: wiersz na mutanta na stdout i dopisanie do `mutacje-wyniki-r4.txt` (obok skryptu).
"""
import importlib.util
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]  # runs/<ID> -> autobot -> dyspozycje -> korzen repo
ENGINE = ROOT / "rust-port/engine"
ACTIVE = ENGINE / "src/domain/resource_access/active_access.rs"
SOCIETY = ENGINE / "src/domain/resource_access/society_inputs.rs"
RESULTS = HERE / "mutacje-wyniki-r4.txt"

_spec = importlib.util.spec_from_file_location("r3_active", HERE / "mutacje-p6-8h2-b-active.py")
_r3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_r3)

# Mutanty r3, których kotwice zmienił kod r4 (M01/M03) - zastąpione poniżej.
ACTIVE_R3 = [m for m in _r3.MUTANTS if m[0] not in ("M01", "M03")]

ACTIVE_R4 = [
    ("M01", "label_for_hex: guard widoczności (r4: + gałąź prototypu) -> bez prototypu",
     "if is_js_prototype_key(&z) || !deposit_visible(hex, era) {",
     "if !deposit_visible(hex, era) {"),
    ("M03", "hex_hidden_deposit_hint: guard widoczności (r4) -> bez `deposit_visible`",
     "if is_js_prototype_key(&z) || deposit_visible(hex, era) {",
     "if is_js_prototype_key(&z) {"),
    ("M30", "label_for_hex: prototyp `constructor`/`__proto__` -> bez wyjątku (zawsze widoczny)",
     "if is_js_prototype_key(&z) || !deposit_visible(hex, era) {",
     "if false || !deposit_visible(hex, era) {"),
    ("M31", "hex_hidden_deposit_hint: prototyp -> bez wyjątku",
     "if is_js_prototype_key(&z) || deposit_visible(hex, era) {",
     "if false || deposit_visible(hex, era) {"),
    ("M32", "is_js_prototype_key: `__proto__` pominięty",
     "matches!(z, \"constructor\" | \"__proto__\")",
     "matches!(z, \"constructor\")"),
    ("M33", "compute_empire_livestock_unlocks: filtr właściciela -> wyłączony",
     "if let Some(owner) = owner_id {",
     "if let Some(owner) = owner_id.filter(|_| false) {"),
    ("M34", "compute_empire_livestock_unlocks: warunek nakładki konia -> pominięty",
     "if key == \"stadnina\" && hex.overlay == Overlay::ZlozeKonia {",
     "if key == \"stadnina\" {"),
    ("M35", "collect_active_access: domyślna gałąź `computeEmpireLivestockUnlocks` -> wyłączona",
     "(None, Some(placed)) => Some(compute_empire_livestock_unlocks(",
     "(None, Some(_placed)) if false => Some(compute_empire_livestock_unlocks("),
    ("M36", "compute_empire_livestock_unlocks: porównanie właściciela odwrócone",
     "if hex_owner != Some(owner) {",
     "if hex_owner == Some(owner) {"),
    ("M37", "pl_primary_key: ł -> bez ogonka (litera bazowa)",
     "'ł' => letter('l', 1),",
     "'ł' => letter('l', 0),"),
    ("M38", "pl_primary_key: ć -> bez ogonka (litera bazowa)",
     "'ć' => letter('c', 1),",
     "'ć' => letter('c', 0),"),
    ("M39", "pl_primary_key: ę -> bez ogonka (litera bazowa)",
     "'ę' => letter('e', 1),",
     "'ę' => letter('e', 0),"),
    ("M40", "pl_primary_key: ń -> bez ogonka (litera bazowa)",
     "'ń' => letter('n', 1),",
     "'ń' => letter('n', 0),"),
    ("M41", "pl_primary_key: ź -> bez ogonka (litera bazowa)",
     "'ź' => letter('z', 1),",
     "'ź' => letter('z', 0),"),
    ("M42", "pl_collation_cmp: remis wielkości liter -> tiebreak bajtowy (wersja r3)",
     "        Ordering::Equal => Ordering::Equal,",
     "        Ordering::Equal => a.cmp(b),"),
    ("M43", "pl_collation_cmp: pominięcie ignorowanych znaków (ZWSP/miękki myślnik)",
     "        .filter(|c| !is_collation_ignorable(*c))\n        .flat_map(char::to_lowercase)",
     "        .flat_map(char::to_lowercase)"),
    ("M44", "era_ui_name: wpis 1 (Kamień) -> None",
     "1 => Some(\"Kamień\"),",
     "1 => None,"),
]

SOCIETY_MUTANTS = [
    ("S01", "js_clamp: NaN przechodzi jako dolna granica (`!(x >= lo)`)",
     "if x < lo {", "if !(x >= lo) {"),
    ("S02", "js_clamp: granica górna `>=` (równoważne: zwraca hi w obu wariantach)",
     "} else if x > hi {", "} else if x >= hi {"),
    ("S03", "leading_religion: remis -> ostatnia nazwa (`<` zamiast `<=`)",
     "Some((_, best_count)) if count <= best_count => {}",
     "Some((_, best_count)) if count < best_count => {}"),
    ("S04", "total_adherents: filtr `> 0` -> tylko skończone",
     ".filter(|v| v.is_finite() && **v > 0.0)", ".filter(|v| v.is_finite())"),
    ("S05", "leading_religion: filtr skończoności wyłączony (Inf jako lider)",
     "let count = if value.is_finite() && *value > 0.0 {",
     "let count = if *value > 0.0 {"),
    ("S06", "dominant_religion: próg `>` -> `>=`",
     "if share > threshold {", "if share >= threshold {"),
    ("S07", "dominant_religion: warunek `total > 0` -> `>= 0`",
     "let (Some((name, count)), true) = (leader, total > 0.0) else {",
     "let (Some((name, count)), true) = (leader, total >= 0.0) else {"),
    ("S08", "is_foreign: status `!= Dominant` -> `== Mixed`",
     "if dom.status != DominantStatus::Dominant {",
     "if dom.status == DominantStatus::Mixed {"),
    ("S09", "is_foreign: pusta nazwa religii nie jest odfiltrowana (web `!dom.religion`)",
     "dom.religion.filter(|r| !r.is_empty())", "dom.religion"),
    ("S10", "is_foreign: brak religii właściciela `\"\"` -> nie traktowane jak brak (równoważne)",
     "None | Some(\"\") => true,", "None => true,"),
    ("S11", "total_adherents: `> 0` -> `>= 0` (równoważne: dodanie 0 nie zmienia sumy)",
     ".filter(|v| v.is_finite() && **v > 0.0)", ".filter(|v| v.is_finite() && **v >= 0.0)"),
]


def run_test(test: str) -> int:
    env = dict(os.environ)
    env.setdefault("CARGO_TARGET_DIR", "/dev/shm/p6-8h2-b")
    env.update({"CARGO_INCREMENTAL": "0", "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_PROFILE_TEST_DEBUG": "0"})
    proc = subprocess.run(
        ["cargo", "test", "--test", test, "-q"],
        cwd=ENGINE, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    return proc.returncode


def main() -> int:
    args = sys.argv[1:]
    target = args[args.index("--target") + 1] if "--target" in args else "active"
    lo = int(args[args.index("--from") + 1]) if "--from" in args else 1
    if target == "active":
        src, test, mutants = ACTIVE, "p6_8h2_active_access", ACTIVE_R3 + ACTIVE_R4
    else:
        src, test, mutants = SOCIETY, "p6_8h2_society_inputs", SOCIETY_MUTANTS
    hi = int(args[args.index("--to") + 1]) if "--to" in args else len(mutants)
    original = src.read_text(encoding="utf-8")
    base_rc = run_test(test)
    line = f"BASE target={target} rc={base_rc} ({'OK' if base_rc == 0 else 'FAIL'})"
    print(line)
    with RESULTS.open("a", encoding="utf-8") as log:
        log.write(line + "\n")
        if base_rc != 0:
            return 2
        try:
            for idx, (mid, desc, old, new) in enumerate(mutants, start=1):
                if not (lo <= idx <= hi):
                    continue
                count = original.count(old)
                if count != 1:
                    result = f"{mid} NIE_ZASTOSOWANO (wystapien={count}) {desc}"
                else:
                    src.write_text(original.replace(old, new, 1), encoding="utf-8")
                    rc = run_test(test)
                    result = f"{mid} {'KILLED' if rc != 0 else 'SURVIVED'} rc={rc} {desc}"
                print(result)
                log.write(result + "\n")
                log.flush()
        finally:
            src.write_text(original, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
