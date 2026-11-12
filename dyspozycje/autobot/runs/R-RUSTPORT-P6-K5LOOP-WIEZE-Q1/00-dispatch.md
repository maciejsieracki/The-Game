# DISPATCH R-RUSTPORT-P6-K5LOOP-WIEZE-Q1 (runda 1)

TEMAT: K5-LOOP-WIEZE — port wież oblężniczych do pętli taktycznej (zadanie #96): `_fireSiegeTowers`, harmonogram 180 ms, wybór celu `pickTowerTarget`.
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5LOOP-WIEZE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `_fireSiegeTowers` i jego wołanie w pętli oblężenia.

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine/src` na `fire_siege_towers`, `pick_tower_target`, `siege_tactics_loop`. Potwierdź, że wybór celu wieży jest zintegrowany (TOWER-TARGET) i że `ProdBody`/`SiegeLoop` istnieją. Jeśli brak którejkolwiek zależności — BLOCK z dowodem.

GOAL: wepnij wystrzały wież (`fire_siege_towers`) w sterownik pętli `siege_tactics_loop.rs` w miejscu i harmonogramie zgodnym z pinem (180 ms wirtualnie).

ALLOWLISTA:
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/src/domain/siege_tactics_tower.rs (tylko jeśli potrzebne)
- rust-port/engine/tests/p6_k5loop_wieze*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIEZE-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający wież w pętli (numer linii Rust i pin).
2. Test z wektorami pinu (generator .mjs, strażnik SHA-256 wyciętych fragmentów), liczniki niepustości > 0, porównanie stanu po każdej turze wież.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera (zasada: martwy kod = FAIL).
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
