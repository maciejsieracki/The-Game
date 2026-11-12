# DISPATCH R-RUSTPORT-P6-TOWER-TARGET-Q1 (runda 1)

TEMAT: TOWER-TARGET — podpięcie `pick_tower_target` (rust-port/engine/src/domain/siege_tactics_tower.rs:486) do produkcyjnej pętli oblężenia (zadanie #116). Pierwszy krok łańcucha wież przed #96 (WIEZE, BLOCK w rundzie 1).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-TOWER-TARGET-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — `pickTowerTarget` (definicja ok. :4208) i jego wołanie w `_beginTurn` (ok. :5643). UWAGA: `gra/src/main.ts` NIE zawiera tej funkcji.

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine/src` na `pick_tower_target`, `fire_siege_towers`, `siege_tactics_loop`. Potwierdź, że `pick_tower_target` nie ma produkcyjnego wołającego (tylko testy p6_tower_target*). Jeśli wołający już istnieje — zamknij PASS z dowodem.

GOAL: wołaj `pick_tower_target` z produkcyjnej ścieżki pętli oblężenia w miejscu i kolejności zgodnej z pinem (wybór celu wieży na początku tury). Nie implementuj strzału wież (to #96).

ALLOWLISTA:
- rust-port/engine/src/domain/siege_tactics_loop.rs (wołanie)
- rust-port/engine/src/domain/siege_tactics_tower.rs (tylko jeśli potrzebna zmiana sygnatury)
- rust-port/engine/tests/p6_tower_target_wiring*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-TOWER-TARGET-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający `pick_tower_target` (numer linii Rust i pin battleScene.ts).
2. Test z wektorami pinu (generator .mjs, strażnik SHA-256 wyciętych fragmentów), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
