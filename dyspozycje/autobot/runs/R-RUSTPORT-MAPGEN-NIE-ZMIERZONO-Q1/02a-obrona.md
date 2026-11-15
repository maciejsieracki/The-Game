STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1
GOAL: Dokument P6 z wpisami M08, M13, M18 (pin `07d2fbd72`, stan Rust `f7baa3848`, status POKRYTE/BRAK/NIE_ZMIERZONO), bez zmian kodu.
ZMIANY/COMMIT: `dyspozycje/rust-port/p6/MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md` (poprawka r2), `dyspozycje/autobot/runs/R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1/02a-obrona.md` (nowy). Baza obrony: operator `5f08ed7a5` (gałąź `r-rustport-mapgen-nz-q1`). SHA commitu obrony: patrz pole `sha` w wyniku Operatora. Bez push.
TESTY: `git grep`/`git show` na `f7baa3848` i `07d2fbd72` dla każdego zarzutu (wyniki poniżej). `git diff --check` do wykonania przed commitem (patrz wynik Operatora). Bramki cargo nie dotyczą (dokument).
BLOKADY: brak. Dwie świadome decyzje do orkiestratora: przypisanie funkcji lasu (M08 vs M13) i definicja `computeStartPositions` (NIE_ZMIERZONO).
RUNDY: 1/5 (obrona r1 po Evaluatorze r1).
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki i status NIE_ZMIERZONO dla `computeStartPositions`.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Błąd faktyczny M13 (`generator.ts:856`) — PRZYJMUJĘ
- Weryfikacja: `git show 07d2fbd72:gra/src/map/generator.ts` — linia 856 to `export { findBestPlayerStartHex, scoreCityStartHex, START_REVEAL_RADIUS } from './startScoring';`. Zarzut trafny.
- Wyznaczanie startów: `generator.ts:649` `computeStartPositions(hexes, effectiveSeed, { minCount: 5, minDist: 5, absMinDist: 2 })`, faza `starts` (`reportMapGenPhase(... MAP_GEN_PHASE_LABELS.starts ...)` przed nią).
- Poprawka: M13 rozdzielony na M13a (wioski), M13b (punktacja startu, `startScoring.ts`, re-eksport `:856`), M13c (`computeStartPositions` `:649`).
- Commit: wersja r2 pliku `MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md`, sekcja M13.

### 2. Pominięcie punktacji startu w Rust (M10) — PRZYJMUJĘ
- Weryfikacja na `f7baa3848`: `rust-port/engine/src/domain/mapgen/cluster_mass.rs:2729` `start_reveal_radius`, `:2734` `start_reveal_radius_for_difficulty`, `:2757` `score_city_start_hex`, `:2817` `find_best_player_start_hex`. Test `rust-port/engine/tests/p6_m10_start_scoring.rs` istnieje (`git ls-tree`).
- Poprawka: M13b = POKRYTE (wg M10; obecność symboli i testu; wynik testu nie re-uruchamiany w tym temacie). M13c `computeStartPositions` = NIE_ZMIERZONO (nie odczytano definicji po stronie pinu ani Rust; `git grep` po `start_positions` / `starting_pos` w `rust-port/engine/src` bez trafień; istnieje `domain/start_position.rs`, nie zmierzono jego roli). Wpis M13 w sumie: BRAK (wioski) / POKRYTE (M10) / NIE_ZMIERZONO (computeStartPositions).
- Uwaga: ponieważ status POKRYTE jest oparty na teście M10, a nie na mierzeniu parytetu w tym temacie, zaznaczono to w dokumencie.

### 3. Pominięcie helperów fair-play i lasu (M08) — PRZYJMUJĘ (częściowo; przypisanie lasu do orkiestratora)
- Weryfikacja na `f7baa3848`: `relief.rs:773` `fair_play_resource_cell_size` (wywołuje `iron_coverage_cell_size`, `:758`), `:778` `forest_coverage_cell_size`, `:783` `min_land_hexes_for_fair_play_cell` (wywołuje `min_land_hexes_for_relief_cell`). Pin: `gen-helpers.ts:1833` `fairPlayResourceCellSize`, `:1838` `forestCoverageCellSize`, `:1844` `minLandHexesForFairPlayCell` (sprawdzone `git show 07d2fbd72:...`).
- Funkcje lasu: pin `gen-helpers.ts:12538` `forestGridCoverageRatio`, `:12558` `ensureForestGridCoverage`. Rust: brak odpowiednika (`git grep` po `forest_grid` / `ensure_forest` bez trafień).
- Poprawka: M08 opisuje helpery rozmiaru komórki jako wrappery (nie algorytm rozmieszczania). Status `placeDeposits` i `ensureDepositGridCoverage` pozostaje BRAK. Funkcje lasu przypisane do M08 (tytuł tematu ZLOZA-LAS-FAIRPLAY) ze statusem BRAK, z zaznaczeniem, że zakres stuba M00 (`:12475-12561`) je zawiera.
- Nie przyjęto jako błędu: przypisanie do M08 vs M13 jest decyzją orkiestratora (w dokumencie opisane w Uwagach, pkt 2).

### 4. Niespójność w kolejności faz M18 (brak `computeStartPositions`) — PRZYJMUJĘ
- Weryfikacja: `generator.ts:629` `ensureForestGridCoverage`, `:642` `placeDeposits`, `:643` `ensureDepositGridCoverage`, `:649` `computeStartPositions`, `:680` `placeVillages`, `:709`, `:731`, `:732`. Brak `computeStartPositions` w poprzedniej wersji potwierdzony.
- Poprawka: lista faz M18 uzupełniona o `:649` (faza `starts`, przed `placeVillages`), wraz z pozostałymi wywołaniami w kolejności linii.
- Dodatkowo skorygowano zakres funkcji `generateMap`: ciało kończy się na `generator.ts:764` (poprzednio `:761`, co było błędem; `:762` `mapGenTimings`, `:763` `};`, `:764` `}`).

## Zarzuty bez zmian
Brak. Numery linii pinu wskazane w zarzutach zweryfikowano komendami `git show 07d2fbd72:...` / `git grep` (punkty 1–4). Pozostałe numery linii w dokumencie (gen-helpers, generator, villages) NIE zostały w tej obronie przeczytane ponownie w całości; zgodność z pinem dla nich opiera się na weryfikacji Evaluatora (`02-evaluator.md`) i na wybiórczych sprawdzeniach (`generator.ts:642, 643, 649, 680, 709, 731, 732, 856`; `gen-helpers.ts:1833, 1838, 1844, 12479, 12538, 12558`).
