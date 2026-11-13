# DISPATCH R-RUSTPORT-P6-INTEG-R2-Q1 (runda integracyjna, runda 1)

TEMAT: Integracja dwóch zakończonych tematów (FC PASS-WITH-NOTES) na bazie parity-v2 z pełnym cargo test.
Baza: 23e33793e (origin/rust-port/parity-v2). Worktree na nowej gałęzi `wip/R-RUSTPORT-P6-INTEG-R2-Q1` z tego SHA.
Źródła do scalenia (tylko odczyt, przez git merge):
- `rust-port-wip/R-RUSTPORT-P6-JS-MAX-SIGN-R2-Q1` = 352122d26 (FC) — zmienia siege_tactics_blow.rs, siege_tactics_inputs_pos.rs, siege_tactics_blow_full.rs, unit_power.rs, tests/p6_ranged_damage_nan.rs
- `rust-port-wip/R-RUSTPORT-P6-COMBAT-HARNESS-R3-Q1` = bf74ab112 (FC) — zmienia tests/p6_combat_harness.rs

KROK 1: `git merge --no-ff` każdej gałęzi w tej kolejności. Konflikt — rozwiąż tylko w obrębie tych plików (zachowaj semantykę obu stron, nie usuwaj cudzych testów). Jeśli konflikt wymaga zmiany poza tymi plikami — BLOCK z dowodem.

KROK 2 (bramki, EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; PEŁNY `cargo test --no-fail-fast` (oczekiwane passed >= liczba z bazy, 0 failed). Zapisz liczby.

KROK 3: NIE pushuj do parity. Zostaw scalony commit na `wip/R-RUSTPORT-P6-INTEG-R2-Q1` (SHA w raporcie); orkiestrator wykona fast-forward po weryfikacji.

NIE WOLNO: git add -A, commitować Cargo.lock, dotykać gra/ i origin/main, git stash bez tagu, checkout na odłączonym HEAD w głównym repo. Commit scalenia BEZ nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (z liczbami)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
