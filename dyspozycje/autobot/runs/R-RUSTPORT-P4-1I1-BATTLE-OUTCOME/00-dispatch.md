# DISPATCH R-RUSTPORT-P4-1I1-BATTLE-OUTCOME (runda 1) — `BattleOutcomeDto` i producent wyniku bitwy dla ścieżek E1–E3 (P4-1I / #244)

DOMENA: DTO bitwy (view-model) + producent w silniku. MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `84ec520a5` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2a (`BattleOutcomeDto`), §2a.1 (ścieżki końca E1–E4), §63 (wiersz 27: `BattleResult` budowany w `onFinish`, `main.ts:10720-10729`), §7/wiersz `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME` (OBOWIĄZKOWO).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `BattleOutcomeDto` w `rust-port/view-model/src/battle.rs` (§2a): `winner`, `survivors: Vec<{id, hp}>`, `wall_breached`, `end_stats`, `log: Vec<String>` (puste + jawne NIE_ZMIERZONO do I3).
2. Producent w NOWYM `rust-port/engine/src/domain/siege_tactics_outcome.rs` dla ścieżek E1–E3 (§2a.1):
   - `winner` = `this._endWinner ?? winner` (`main.ts:10721`);
   - `survivors` wg ścieżki: E1/E3 strona zwycięzcy, E2 obie strony w kolejności atk→def (`main.ts:10722`);
   - ID rosterów = `buildBattleEventLog`; `wall_breached`; `end_stats` (`_sideEndStats`).
3. Wejście producenta = jawny enum ścieżki końca (E1/E2/E3/E4). E4 (Pomiń) jako wariant z danymi podanymi z zewnątrz do czasu P4-1I1B (#245). NIE porto­waj `computeInstantResult` w tym temacie.
4. `log` jako `Vec<String>` pusty + jawne NIE_ZMIERZONO do I3 (#247).

## WEKTORY / TESTY
- Wektory z pinu (cytat plik:linia): `buildBattleEventLog` (duplikaty, kolejność, ID liczbowe → `String`), `_battleUnitsForMapExport` (rout z hp>0, dead z hp 0), `_sideEndStats`, `wallBreached` (obecne tylko przy ścieżkach z murem).
- Test kluczy JSON w `view-model/tests/json_keys.rs`, round-trip, walidacja `validate.rs` dla nowych pól.
- Mutacje (MUSZĄ dać FAIL): zamiana kolejności survivors E2 (atk→def); `winner` bez `_endWinner ??`; `wall_breached` zawsze false; `hp 0` włączony do survivors.

## KRYTERIA KOŃCA
1. Wektory E1–E3 zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/view-model` I `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie. Pełny test silnika obowiązkowy (dotyka `domain/mod.rs`).
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/view-model/src/battle.rs`
- `rust-port/view-model/tests/**` (w tym nowe pliki testów)
- `rust-port/engine/src/domain/siege_tactics_outcome.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (TYLKO deklaracja modułu)
- `rust-port/engine/tests/p4_1i1_*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny per proces; usuń po bramkach.
