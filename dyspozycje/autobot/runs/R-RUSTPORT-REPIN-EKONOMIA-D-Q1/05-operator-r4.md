STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-D-Q1
GOAL: REPIN krok 4b, część D. Ta runda: odpowiedź na zarzuty Evaluatora R3/R2 (verdict PASS-WITH-NOTES): generator work-tax, zakres, mutant `is_finite`. Cel końcowy tematu NIEOSIĄGNIĘTY (D2.2+ otwarte).
ZMIANY/COMMIT: baza `6989b37c5` (detach). Zmiany: `rust-port/engine/tests/p6_repin_d_economy_mnoznik.rs` (+1 test `structural_non_finite_matrix_value_is_unknown`, import `Num`), `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-D.md` (sekcja odpowiedzi na zarzuty R4 i Z-WT-7), `logs/rerun-work-tax-frozen.mts` + `.log` (nowy weryfikator wyjść work-tax), logi `fmt-r4.log`, `clippy-r4.log`, `test-r4-full.log`, `mut-R4-is-finite.log`. Kod produkcyjny `economy_yield.rs` NIEZMIENIONY (mutant przywrócony, `git diff` pusty). SHA commitu: patrz sekcja git poniżej.
TESTY:
- Zarzut 1 (generator work-tax): `logs/rerun-work-tax-frozen.mts` uruchamia `gra/src/game/work-tax.ts@91dc998a` (kopia `git archive` poza repo) na zamrożonych wejściach `web-vectors.json`: tax 529/529, convert 1600/1600, canConvert 90/90, serialize 9/9, restore 20/20, exec 96/96; TOTAL 2344/2344, rozbieżności=0, EXIT=0.
- Zarzut 3 (mutant `is_finite`): mutant `value.is_finite().then_some(value)` -> `Some(value)` ZABITY przez nowy test (1 failed, `logs/mut-R4-is-finite.log`, EXIT=101). Po przywróceniu `p6_repin_d_economy_mnoznik`: 13/13 ok.
- `cargo fmt --all -- --check`: EXIT=0 (`logs/fmt-r4.log`, po `cargo fmt --all` na zmienionym pliku testu).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`logs/clippy-r4.log`).
- `cargo test --no-fail-fast` (rust-port/engine): EXIT=0, 215 binarek, 1567 passed / 0 failed (1566 + 1 nowy) (`logs/test-r4-full.log`).
- `git diff --check`: czysty.
BLOKADY: brak technicznych. Luka rezydualna: oryginalny generator wejść work-tax nieodzyskany (ZAŁOŻENIE Z-WT-7).
RUNDY: 4/5 (wg dispatchu; numeracja w dossier jednolita R1-R4).
ZAŁOŻENIA:
- Z-WT-7: zamrożone wejścia `web-vectors.json` traktowane jako dane; dowodem zgodności wyjść jest ponowne uruchomienie weba 91dc998a (2344/2344), nie regeneracja wejść.
- Z-V-2 (z R2): pełny `cityYieldPerTurn` nadal nieuruchomiony; brak odpowiednika w Rust.
- Mutant `is_finite` uznany za NIE-równoważny: kontrakt web L717-728 (`Number.isFinite`) i `Num::Float` pozwalają na nieskończoną wartość w wierszu bez JSON.
NASTĘPNY KROK: partia D2.2 (ten sam ID): `cityYieldPerTurn` w Rust, wektory `economy` z weba 91dc998a (L871-1018), Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`.
DEPLOY/PUSH: NIE WYKONANO
