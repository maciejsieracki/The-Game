# DISPATCH R-RUSTPORT-P4-1H-PREVIEW-Q5 (runda 1) — zapytanie `preview_path` i `PathRouteDto` z `turn_stops` (P4-1H / #251)

DOMENA: GAME (podgląd trasy marszu, silnik + DTO). MODEL: OPUS we wszystkich rolach (seria P4-1, decyzja właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `b3c0b2209` (zawiera zintegrowane P4-1H Q4 `ee3207b5a`; zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` §4 wiersz `R-RUSTPORT-P4-1H-PREVIEW-Q5` (OBOWIĄZKOWO) oraz pkt 158 (`armyStackLimit`).
Zależności zintegrowane: Q3 (RJ-REPIN, `pathfinding.rs`: `*_occ`, `trim_path_to_stack_room`, `register_march_stop`) i Q4 (`playable_movement.rs`: adapter `PlayableState → RuchMapa/RuchJednostka/MoveOccupancy`). UŻYJ ich, nie duplikuj.
Kod wejściowy: `rust-port/engine/src/domain/playable_movement.rs`, `rust-port/engine/src/domain/bridge.rs`, `rust-port/view-model/src/overlays.rs` (`PathRouteDto`).
Erratum z P4-1H (wiążące): adapter przekazuje surowe `PlayerId` (gracz = 1), web ma gracza = 0 i barbarzyńców `< 0`. Dla preview nie ma logiki `ownerId === 0`/`< 0`; jeśli ją napotkasz, zatrzymaj się i zapisz NIE_ZMIERZONO w raporcie zamiast zgadywać.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. Zapytanie `preview_path` w `bridge.rs` (EngineCommand albo funkcja adaptera): odpowiada `refreshHoverPathPreview` i `refreshPlannedMarchPreview` z pinu (znajdź w `gra/src/main.ts` przez `git grep -n 'refreshHoverPathPreview\|refreshPlannedMarchPreview' 07d2fbd72 -- gra/src`; wpisz plik:linia przy każdej wartości).
2. Wynik: `PathRouteDto { hexes, turn_stops }` w `view-model/src/overlays.rs`. `budget = None` dla podglądu (zgodnie z pinem).
3. Wektory `planPathTurns` z pinu wykonane na adapterze (plik:linia każdej oczekiwanej wartości).
4. Zmiana pola `path_route` w view-model: uzgodnij z P4-1F5 (#242, jeszcze niezaczęte) — w tym temacie wystarcza, że typ `PathRouteDto` istnieje i ma `turn_stops`; NIE implementuj producenta `path_route` dla warstwy (to #237/#242).
5. Brak trasy → `None`. Brak eventu stanu (zapytanie jest czystą funkcją, nie zmienia `PlayableState`).

## WEKTORY / TESTY
- Jednostka z aktywnym planem ignoruje `destination` i zwraca trasę planu.
- Brak trasy → `None`.
- Trasa wieloturowa: `turn_stops` zgodne z `planPathTurns` z pinu (co najmniej jeden przypadek z dwoma przystankami).
- Zapytanie nie zmienia `PlayableState` (test: stan przed = stan po, porównanie serializacji).
- Mutacje (MUSZĄ dać FAIL): (a) `budget` ustawione zamiast `None`; (b) pominięcie `turn_stops`; (c) zapytanie zapisuje plan do stanu.
- Walidacja `turn_stops` w `view-model/src/validate.rs` jeśli dotyczy; klucze JSON w `tests/json_keys.rs`.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine` ORAZ `rust-port/view-model`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie. Pełny test silnika obowiązkowy.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Decyzje techniczne (typ zwracany, miejsce wywołania) zapisane w raporcie.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable_movement.rs`
- `rust-port/engine/src/domain/bridge.rs`
- `rust-port/engine/tests/p4_1h_preview_*.rs` (NOWE)
- `rust-port/view-model/src/overlays.rs` (TYLKO `PathRouteDto`)
- `rust-port/view-model/src/validate.rs` (TYLKO walidacja `turn_stops`, jeśli potrzebna)
- `rust-port/view-model/tests/**` (TYLKO testy `PathRouteDto`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-PREVIEW-Q5/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
