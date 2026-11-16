# R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW — Operator, runda 1

STATUS: BLOCK (INFRA: dysk 6,2 GB wolnego < 8 GB, kryterium końca 3; kod napisany, bramki cargo clippy/test i mutacje NIE uruchomione)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW
GOAL: producent `overlays.buildHighlight` (4 tryby `refreshBuildHighlight`) i `overlays.selection` z `UiState` oraz port `isHexInStartReveal` / `canFoundPlayerCityAt` w nowym module `start_reveal.rs`.
BAZA: `origin/rust-port/parity-v2` = `05b872fc5763256d1f607f3b73a47dd6f3244903` (gałąź robocza `wip/R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW`). Pin `07d2fbd72`.
ZMIANY/COMMIT: SHA w wyniku commitu (patrz `git log` gałęzi roboczej; ten raport jest w tym samym commicie). Pliki (wszystkie w allowliście):
- `rust-port/engine/src/domain/overlays_view.rs` (NOWY: na bazie pliku nie było; inne tematy 1F3/1F4/1F5 też go tworzą, konflikt rozstrzyga orkiestrator)
- `rust-port/engine/src/domain/start_reveal.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (tylko 2 wpisy `pub mod`)
- `rust-port/engine/tests/view_overlays_build.rs` (NOWY), `rust-port/engine/tests/start_reveal.rs` (NOWY)
- ten raport
`Cargo.lock` nie zmieniony i nie commitowany.

## Lokalizacja w pinie (`git grep` z dispatchu)
- `isHexInStartReveal` `gra/src/game/first-player-city.ts:23-33`; `isAwaitingFirstPlayerCity` `:14-20`; `validateFirstPlayerCityPlacement` `:36-48`; `FIRST_CITY_START_REVEAL_DENIED` `:7`.
- `isInStartReveal` `gra/src/main.ts:12886-12895`; `canFoundPlayerCityAt` `:12923-12943`.
- `refreshBuildHighlight` `gra/src/main.ts:16351-16395`; `filterBuildHighlightHexes` `gra/src/render/buildHighlight.ts:22-28`; `isMineImprovementKey` `gra/src/map/improvement-build.ts:719-728`.
- `hexDistance` `gra/src/units/setup.ts:361-366`.

## Realizacja ZAKRESU
1. `build_highlight(ui, src)` w `overlays_view.rs`: kolejność gałęzi 1:1 z pinem — założenie miasta (`FoundCity`, iteracja `map_hexes` w kolejności mapy, `isInStartReveal` przed `canFoundPlayerCityAt`, jak `continue` w `:16357`), cud (`Wonder`), brak trybu (puste `hexes` = brak warstwy; pusty klucz traktowany jak `!''`), kopalnia złoża (`Mine` przez istniejące `improvement_build::is_mine_improvement_key`), pozostałe ulepszenia (`Improvement`). Wszędzie `new Set(...)` = deduplikacja w kolejności pierwszego wystąpienia. Kształt DTO z P4-1F1 bez zmian. Brak warstwy kodowany jako `kind: Improvement, hexes: []` (kontrakt: puste `hexes` = brak warstwy).
2. **Decyzja techniczna — filtr cofania w PRODUCENCIE** (kontrakt §3.7 „silnik … odjęcie heksów z cofaniem w tej turze”; komentarz pola `BuildHighlightDto.hexes` „already filtered by the producer”). `overlays_view::filter_build_highlight_hexes` (klucz `"q,r:key"`, kolejność zachowana) stosowany do ulepszeń i kopalni (w pinie `hexes` liczone przed rozgałęzieniem `:16374-16390`). Funkcja rendererowa `renderer/src/models/misc/build_highlight.rs:60` nietknięta (poza allowlistą; adapter P4-1G Q6 nie powinien filtrować drugi raz).
3. `selection(&SelectionUi { selected_unit_id }, &units)`: stan UI przekazywany przez wołającego (nie czyta `PlayableState.selected_unit_id`, kontrakt §3.7, D-CMD-12); `hex` = `PositionDto(x,y)` → `HexCoord(q=x,r=y)` (§1.4), `ownerId` jednostki; brak id / brak jednostki → `None`. W Rust nie ma typu `UiState`, więc wejście to mała struktura w module producenta.
4. `start_reveal.rs`: `is_awaiting_first_player_city`, `hex_distance` (jak `units/setup.ts`, NaN propaguje przez `js_math::js_max`), `is_hex_in_start_reveal` (`<=`), `validate_first_player_city_placement`, `PlacementCheck {ok, reason}` (+ `From<CanFoundCityResult>`), `StartRevealContext::{is_in_start_reveal, can_found_player_city_at}`.
   **Granica portu:** `canFoundPlayerCityAt` w pinie woła `canFoundCity(q, r, cities, map, {...foundingTerritoryOpts(ME()), ownerId, ownerEra, gameConfig})`. `canFoundCity` jest już w Rust (`state::p6_6b::cities::can_found_city`); wynik bazowy przychodzi jako domknięcie `base` od wołającego. Składanie `foundingTerritoryOpts` (węzły miast + forty, `foundingNodesForOwner`, `isHexInForeignFortTerritory`) NIE jest w tym module — należy do wołającego (przyszły wiring producenta ze stanu gry). Uznałem to za zgodne z „port jako nowy moduł” (bez rozszerzania allowlisty); jeśli Evaluator uzna, że pełne `foundingTerritoryOpts` musi być w tym temacie — to wymaga osobnego tematu (terytorium/forty), nie BLOCK kodu tego modułu.

## Wektory (każdy z `plik:linia` pinu w komentarzu testu)
`tests/view_overlays_build.rs`: kopalnia złoża → `Mine` (4 klucze); zwykłe ulepszenie → `Improvement`; cud → `Wonder` przed gałęzią budowy (także z kluczem kopalni) + dedup; założenie miasta przed cudem; ulepszenie po cofnięciu w turze → heks odjęty (też dla kopalni; klucz innego ulepszenia nie odejmuje); format klucza z ujemnymi współrzędnymi; brak trybu → brak warstwy; założenie miasta poza `isInStartReveal` → pominięte i `canFoundPlayerCityAt` niewołane (licznik 4); `selection` z `UiState`.
`tests/start_reveal.rs`: granica promienia (dystans == `startRevealRadius` → `true`, +1 → `false`); brak oczekiwania / brak heksu startu → `true`; NaN → `false`; `isAwaitingFirstPlayerCity`; gałęzie `validateFirstPlayerCityPlacement`; złożenie `canFoundPlayerCityAt`.

## TESTY
- `df -h /` przed bramką: **6,2 GB wolnego** (wcześniej 6,5 GB; dysk dzielony z równoległymi workerami) → wg kryterium 3 dispatchu: BLOCK, bramki kompilujące nie uruchomione, żeby nie wypełnić dysku innym tematom.
- `cargo fmt --check` (rust-port/engine, nie wymaga katalogu target): **EXIT 0**.
- `git diff --check`: czysto.
- `cargo clippy --all-targets -- -D warnings`: NIE_URUCHOMIONO (dysk).
- `cargo test --all-targets --no-fail-fast`: NIE_URUCHOMIONO (dysk). Kod NIE był kompilowany — możliwe błędy kompilacji do wyłapania w r2.
- Mutacje (a) kopalnia → ulepszenie, (b) `<` zamiast `<=` w `is_hex_in_start_reveal`, (c) cofnięcie nie odejmuje heksu: NIE_URUCHOMIONO. Oczekiwane cele: (a) `deposit_mine_maps_to_mine_layer`, `undo_in_turn_removes_hex_from_highlight`; (b) `start_reveal_boundary_is_inclusive`; (c) `undo_in_turn_removes_hex_from_highlight`, `filter_matches_web_key_format`.
- Brak `#[ignore]`, brak osłabionych asercji.

BLOKADY:
- dysk 6,2 GB < 8 GB (kryterium 3) — potrzebne zwolnienie miejsca przed r2 (bramki + 3 mutacje, `CARGO_TARGET_DIR` poza repo, usunięcie po bramkach).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator zwalnia dysk do ≥ 8 GB → runda 2 Operatora na tej samej gałęzi: `cargo clippy`/`cargo test` w `rust-port/engine` (CARGO_INCREMENTAL=0, DEBUG=0), poprawki kompilacji, 3 mutacje z wynikami; potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO
