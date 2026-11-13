# DISPATCH R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1 (runda 1)

TEMAT: K5I2B2-POKRYCIE-R2: asercja lucznik>=14 w teście pokrycia blow_full
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:<plik>` — znajdź właściwy plik grepem (NIE zakładaj gra/src/main.ts dla funkcji bitwy).

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine` potwierdź stan wyjściowy. Jeśli zmiana już jest w kodzie — zamknij PASS z dowodem bez zmian.

GOAL: Dodać asercję pokrycia łucznika (lucznik_ranged >= 14; regresja 14->2 musi failować) wzorem p6_siege_tactics_blow_env.rs:722-726 i liczników z :636-639.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/tests/p6_siege_tactics_blow_full.rs
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Zmiana zgodna z pinem; dowód numerami linii Rust i pinu.
2. Test z wektorami pinu (istniejący generator .mjs lub nowy, ze strażnikiem SHA-256 wyciętych fragmentów); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy/zmieniony test.
5. Jeśli wymagana zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, rebase na odłączonym HEAD. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
