# DISPATCH R-RUSTPORT-P6-K5-LOOP-WYLOM-Q1 (runda 1)

TEMAT: K5-LOOP-WYLOM — wyłom w trakcie bitwy oraz ucieczka/rout w pętli taktycznej (zadanie #98).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5-LOOP-WYLOM-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — obsługa wyłomu (wallEverBreached) i rout jednostki w trakcie ciosów.

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine/src` na `wall_ever_breached`, `rout`, `siege_tactics_breach`, `siege_tactics_loop`. Ustal, co jest zintegrowane (K4 automat wyłomu) i czy wyłom/rout są podpięte do pętli. Jeśli brak zależności — BLOCK z dowodem, bez martwego wrappera.

GOAL: w produkcyjnej pętli taktycznej wyłom w trakcie bitwy i rout/ucieczka jednostki działają zgodnie z pinem.

ALLOWLISTA:
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/src/domain/siege_tactics_breach.rs (tylko jeśli potrzebne)
- rust-port/engine/tests/p6_k5loop_wylom*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-LOOP-WYLOM-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjne wołanie wyłomu i routu w pętli (numer linii Rust i pin).
2. Test z wektorami pinu (generator .mjs, strażnik SHA-256), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
