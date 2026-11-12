# DISPATCH R-RUSTPORT-P6-K5LOOP-AUTO-Q1 (runda 1)

TEMAT: K5-LOOP-AUTO — ścieżki AUTO bez oblężenia i tryb ręczny w sterowniku pętli (zadanie #97).
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5LOOP-AUTO-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — gałąź AUTO bez oblężenia i przełącznik trybu ręcznego (fazy AUTO, `_activateUnit`, `autoBatchPhase`).

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine/src` na `autoBatchPhase`, `auto`, `manual`, `siege_tactics_autobatch`, `siege_tactics_activate`. Ustal, co już jest zintegrowane (K5G0, K5G, K5H) i co brakuje. Jeśli cała gałąź jest już w produkcji — zamknij PASS z dowodem bez zmian kodu.

GOAL: sterownik pętli obsługuje ścieżkę AUTO bez oblężenia i tryb ręczny, zgodnie z pinem, w produkcyjnej pętli.

ALLOWLISTA:
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/src/domain/siege_tactics_autobatch.rs, siege_tactics_activate.rs (tylko jeśli potrzebne)
- rust-port/engine/tests/p6_k5loop_auto*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-AUTO-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjne wołanie ścieżki AUTO i trybu ręcznego w sterowniku (numer linii Rust i pin).
2. Test z wektorami pinu (generator .mjs, strażnik SHA-256), liczniki niepustości > 0, porównanie kolejności faz.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
