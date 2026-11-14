# DISPATCH R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (runda 1)

TEMAT: ZDOBYCIE-MIASTA-WIRING — podpięcie `run_capital_capture_plunder` i akumulatorów zdobyczy w produkcyjnej ścieżce zdobycia miasta (zadanie #115).
DOMENA: GAME. Baza: a381dd13f (czubek origin/rust-port/parity-v2, sprawdzone 14.11). Worktree na `wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/...` — `runCapitalCapturePlunder` i miejsce wołania przy zdobyciu stolicy.

GOAL: `run_capital_capture_plunder` (rust-port/engine/src/domain/siege_transfer.rs i moduł plądrowania) ma dziś niepodpiętego wołającego (komentarz w kodzie: „wolajacy niepodpiety - W8”). Wepnij go w produkcyjną ścieżkę zdobycia stolicy w kolejności zgodnej z pinem i dodaj akumulację zdobyczy do stanu zgodnie z pinem.

ALLOWLISTA:
- rust-port/engine/src/domain/siege_transfer.rs
- rust-port/engine/src/domain/siege_capital_plunder*.rs (jeśli istnieje)
- rust-port/engine/src/domain/playable.rs (wyłącznie akumulatory zdobyczy, jeśli pin je tam trzyma)
- rust-port/engine/tests/p6_zdobycie_wiring*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjny wołający `run_capital_capture_plunder` (numer linii) w ścieżce zdobycia stolicy.
2. Test behawioralny z wektorami pinu (generator .mjs, strażnik SHA-256), liczniki niepustości > 0; akumulatory zdobyczy porównane.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: fmt --check, clippy --all-targets -D warnings, cargo test --lib, nowy test.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).

REBASE 14.11: baza przepisana z 23e33793e na a381dd13f. Cele zweryfikowane na tej bazie (brak produkcyjnego wołającego potwierdzony przez git grep).
