# DISPATCH R-RUSTPORT-P6-R7K7C-WIRING-Q2 (runda 1)

TEMAT: R7K7C-WIRING — wpięcie `apply_dipl_deltas_to_state` w `advance_turn` (zadanie #106). Zastępuje nieudany start Q1 (`topic-R-RUSTPORT-P6-R7K7C-WIRING-Q1`), nowy ID, bo poprzedni nie ma commitu w parity.
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-R7K7C-WIRING-Q2`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — funkcja pinu odpowiadająca `apply_dipl_deltas_to_state` i wołanie w pętli tury.

GOAL: `apply_dipl_deltas_to_state` (rust-port/engine/src/domain/turn_war_dipl_steps.rs) jest dziś bez produkcyjnego wołającego. Wepnij je w `advance_turn` w kolejności zgodnej z pinem. Zachowaj parytet „brak wpisu = 0” (brak klucza w mapie delta traktuj jak zero, jak pin).

ALLOWLISTA:
- rust-port/engine/src/domain/turn_war_dipl_steps.rs
- rust-port/engine/src/domain/<moduł advance_turn> (minimalne wołanie)
- rust-port/engine/tests/p6_r7k7c_apply*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING-Q2/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający `apply_dipl_deltas_to_state` w `advance_turn`, w pozycji zgodnej z pinem (podaj numer linii pinu i Rust).
2. Wektory ≥ 150 przypadków z pinu dla `apply` oraz osobno dla D3 (wektory generowane generatorem `.mjs` wykonującym tekst pinu w node, ze strażnikiem SHA-256 wyciętych fragmentów).
3. Test „brak wpisu = 0” z wektorem pinu.
4. Brak `#[ignore]`, brak osłabionych asercji.
5. Bramki EXIT 0: fmt --check, clippy --all-targets -D warnings, cargo test --lib, nowy test.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`, `git stash` bez tagu. Commit bez nazwy modelu; `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
