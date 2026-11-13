# DISPATCH R-RUSTPORT-P6-INTEG-R3-Q1 (runda integracyjna, runda 1)

TEMAT: Integracja DLUG-R2 (#145) na nowym czubku parity-v2 z pełnym cargo test.
Baza: efc77e0cf (origin/rust-port/parity-v2, po FF INTEG-R2). Worktree na nowej gałęzi `wip/R-RUSTPORT-P6-INTEG-R3-Q1` z tego SHA.
Źródło do scalenia: `rust-port-wip/R-RUSTPORT-P6-K5I2B2-DLUG-R2-Q1` = a435838be (FC PASS-WITH-NOTES). Zmienia tylko rust-port/engine/src/domain/siege_tactics_blow_env.rs i tests/p6_siege_tactics_blow_env.rs. merge-tree na efc77e0cf: czysto.

KROK 1: `git merge --no-ff a435838be`. Konflikt — tylko w obrębie tych dwóch plików; zachowaj semantykę obu stron.
KROK 2 (bramki, EXIT 0): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; PEŁNY `cargo test --no-fail-fast` (oczekiwane passed >= 3256, 0 failed, 1 ignored). Zapisz liczby.
KROK 3: NIE pushuj do parity. Scalony commit zostaw na `wip/R-RUSTPORT-P6-INTEG-R3-Q1`; orkiestrator zrobi FF po weryfikacji.

NIE WOLNO: git add -A, commitować Cargo.lock, dotykać gra/ i origin/main, git stash bez tagu, checkout na odłączonym HEAD w głównym repo. Commit scalenia BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (z liczbami)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
