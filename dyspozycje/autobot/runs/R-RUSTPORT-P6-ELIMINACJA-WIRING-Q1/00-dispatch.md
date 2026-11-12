# DISPATCH R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1 (runda 1)

TEMAT: ELIMINACJA-WIRING — produkcyjna ścieżka eliminacji właściciela (zadanie #114).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — `eliminateOwner` i miejsce jego wołania w turze.

GOAL: `eliminate_owner` (rust-port/engine/src/domain/eliminacja.rs) wywołuje `power_clear_eliminated_owner` i `clear_eliminated_owner_war_state`, ale NIE WIADOMO czy jest wołany z produkcyjnej pętli tury. Najpierw ustal to `git grep` w `src/` (bez testów). Jeśli brak wołającego — wepnij go w miejscu, w którym pin wykrywa eliminację właściciela. Jeśli jest — udokumentuj dowodem i zamknij PASS bez zmian kodu.

ALLOWLISTA:
- rust-port/engine/src/domain/eliminacja.rs
- rust-port/engine/src/domain/<moduł pętli tury> (minimalne wołanie)
- rust-port/engine/tests/p6_eliminacja_wiring*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjna ścieżka od tury do `eliminate_owner` (numer linii) — albo dowód, że już istnieje.
2. Test porównuje stan po eliminacji z wektorami pinu (generator .mjs + strażnik SHA-256), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: fmt --check, clippy --all-targets -D warnings, cargo test --lib, nowy test.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
