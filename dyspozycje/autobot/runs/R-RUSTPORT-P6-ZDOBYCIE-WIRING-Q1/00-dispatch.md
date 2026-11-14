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

## DODATEK r2 (14.11, decyzja właściciela: „Tak, uruchom r2”)
- **Baza:** `a381dd13f` (czubek origin/rust-port/parity-v2). Operator r1 stał na `501f78c08` (błąd worktree), więc PRZED pracą: `git -C <worktree> checkout a381dd13f` i potwierdź `git merge-base --is-ancestor a381dd13f HEAD`. Bez tego BLOCK.
- **Wariant (decyzja techniczna orkiestratora):** B — wrapper po stronie wołającego wg pina `gra/src/main.ts:17814-17828` (zasada 9). Wołający `run_capital_capture_plunder` musi być w produkcyjnej ścieżce zdobycia stolicy (nie w teście). Wariant A (zmiana sygnatury `apply_transfer_with_effects`) odrzucony.
- **ALLOWLISTA r2 (poszerzona):**
  - rust-port/engine/src/domain/siege_transfer.rs (wrapper/wołający)
  - rust-port/engine/src/domain/siege_capital_plunder.rs (tylko jeśli potrzebna zmiana)
  - rust-port/engine/src/domain/playable.rs (akumulatory zdobyczy, jeśli pin je tam trzyma)
  - rust-port/engine/tests/p6_zdobycie_wiring*.rs (nowy test)
  - rust-port/engine/tests/p6_zdobycie_wiring_gen.mjs (generator wektorów z tekstu pina w node)
  - rust-port/engine/tests/p6_zdobycie_wiring_vectors/ (wygenerowane wektory)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1/ (raporty r2)
- **Test:** wektory z generatora `.mjs` wykonującego tekst pina w node; strażnik SHA-256 wyciętych fragmentów; liczniki niepustości > 0; porównanie akumulatorów zdobyczy. Bez `#[ignore]` i osłabionych asercji.
- **Bramki (EXIT 0):** `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test. Odtwórz je samodzielnie.
- **Dysk:** przed startem `df -h /`. Poniżej 4 GB — STATUS BLOCK z przyczyną DISK, bez kodu.
- **Kolejność w produkcji:** zgodnie z pinem, po przejęciu miasta i przed akumulacją zdobyczy. Nie zmieniaj kolejności względem pina.
- **RUNDA:** r2 (dopisz 01-operator-r2.md, 02-evaluator-r2.md itd.). Commit bez nazwy modelu, ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. NIE pushuj do parity, NIE integruj, NIE dotykaj gra/ ani origin/main.
