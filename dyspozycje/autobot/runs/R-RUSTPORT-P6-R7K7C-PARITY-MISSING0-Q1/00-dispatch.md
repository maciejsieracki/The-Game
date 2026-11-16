# DISPATCH R-RUSTPORT-P6-R7K7C-PARITY-MISSING0-Q1 (runda 1) — brak wpisu = 0 w `Ledger` i `apply` (wariant B) (#106, pierwszy temat)

DOMENA: GAME (skarbce i pule Pracy, dyplomacja, tura). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, FC) — reguła projektu dla silnika.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `1bacc7621` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md` §3 (dowód `?? 0` w pinie), §5 (odchylenie „brak wpisu → błąd” vs 0), §6 pkt 2–4, §7 wiersz `R7K7C-PARITY-MISSING0`.
Decyzja techniczna (zasada 9, parytet 1:1): wariant B — brak wpisu = 0. Zapisana w rejestrze przez orkiestratora przed startem.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `rust-port/engine/src/domain/turn_war_dipl_steps.rs:350-357` (`Ledger::balance`) i `:344-349` (`praca_of`): brak wpisu → 0 zamiast błędu (wariant B).
2. `rust-port/engine/src/domain/turn_war_dipl_steps.rs:1066-1072` i `:1089-1093` (`apply_dipl_deltas_to_state`): brak wpisu → 0; zapis tworzy wpis.
3. NIE wpinaj `apply_dipl_deltas_to_state` do `run_diplomacy_war_phase` (to R7K7C-WIRING-IMPL, osobny temat, #106 dalej).
4. Uwaga do puli Pracy (§6 pkt 5 rozpoznania): podłogowanie Pracy zostaje jak w Ledger (na końcu tury); NIE zmieniaj go; zapisz różnicę w raporcie jako NIE_ZMIERZONO.

## WEKTORY / TESTY
- `rust-port/engine/tests/p6_r7k7c_owner_pools.rs:291` i `:305`: asercje `is_err` dla brakującego wpisu zamień na asercje parytetu (wynik = 0, zapis tworzy wpis). Wartości z pinu (plik:linia przy każdej).
- Wektory ≥150 z pinu dla semantyki „brak wpisu = 0” (generator w katalogu testu; strażnik SHA-256 wyciętych fragmentów pinu).
- Mutacje (MUSZĄ dać FAIL): przywrócenie błędu dla brakującego wpisu; `apply` nie tworzy wpisu.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie. Pełny test silnika obowiązkowy.
3. Brak `#[ignore]`, brak osłabionych asercji (asercje zmieniane tylko na parytet, nie na luźniejsze).
4. Zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs`
- `rust-port/engine/tests/p6_r7k7c_owner_pools.rs`
- `rust-port/engine/tests/p6_r7k7c_owner_pools_vectors/**` (NOWE: generator i wektory, jeśli potrzebne)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-PARITY-MISSING0-Q1/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
