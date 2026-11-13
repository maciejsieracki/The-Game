# DISPATCH R-RUSTPORT-P6-K5I2B2-DLUG-R2-Q1 (runda 1)

TEMAT: K5I2B2-DLUG-R2: combatTerrainName z mapy kodów BTerrain
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5I2B2-DLUG-R2-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:<plik>` — znajdź właściwy plik grepem (NIE zakładaj gra/src/main.ts dla funkcji bitwy).

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine` potwierdź stan wyjściowy. Jeśli zmiana już jest w kodzie — zamknij PASS z dowodem bez zmian.

GOAL: Wyprowadzać combatTerrainName(col,row) z mapy kodów BTerrain zamiast nazw podawanych przez wywołującego (blow_env.rs:33,45,78-79); test z wektorami pinu dla kodów terenu.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/siege_tactics_blow_env.rs
- rust-port/engine/tests/p6_siege_tactics_blow_env.rs
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5I2B2-DLUG-R2-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Zmiana zgodna z pinem; dowód numerami linii Rust i pinu.
2. Test z wektorami pinu (istniejący generator .mjs lub nowy, ze strażnikiem SHA-256 wyciętych fragmentów); liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy/zmieniony test.
5. Jeśli wymagana zmiana poza allowlistą — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać gra/ i origin/main, commitować Cargo.lock, git add -A, git stash bez tagu, rebase na odłączonym HEAD. Commit BEZ nazwy modelu w treści; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
