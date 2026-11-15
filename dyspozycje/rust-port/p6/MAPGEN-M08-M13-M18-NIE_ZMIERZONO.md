# P6 MAPGEN — wpisy rejestru M08, M13, M18 (NIE_ZMIERZONO → uzupełnione)

Temat: `R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1` (dispatch: `dyspozycje/autobot/runs/R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1/00-dispatch.md`, gałąź `claude/rust-sivvrn`).
Domena: PROCESS (dokument, bez kodu). Baza: `f7baa3848`. Pin web: `07d2fbd72` (`gra/src/map/**`).
Wzorzec: `dyspozycje/rust-port/p6/P6-M00-MAPGEN-SZKIELET.md`.

Słownik statusów (tylko te trzy): **POKRYTE** / **BRAK** / **NIE_ZMIERZONO**.
Stan Rust sprawdzony `git grep` / odczytem plików na `f7baa3848`. Stan pinu sprawdzony `git show 07d2fbd72:gra/src/map/...` (numery linii absolutne, w pliku pina).

## Korekta po obronie Operatora (runda r2)

Zarzuty Evaluatora r1 (`02-evaluator.md`, commit `f6bb17c8a`) zweryfikowane po treści pinu i Rust na `f7baa3848`:

1. PRZYJĘTE — start miast: wyznaczanie startów w pinie to `computeStartPositions` (`generator.ts:649`), a `generator.ts:856` jest tylko re-eksportem z `./startScoring`. Wpis M13 poprawiony.
2. PRZYJĘTE — punktacja startu jest w Rust (M10): `cluster_mass.rs:2729`, `:2757`, `:2817`, testy `tests/p6_m10_start_scoring.rs`. Wpis M13 rozdzielony na trzy podwiersze (wioski / punktacja startu / computeStartPositions).
3. PRZYJĘTE — `relief.rs:773` i `:783` (oraz `:778`) to funkcje rozmiaru komórki (wrappery), dopisane w M08. Status `placeDeposits` i `ensureDepositGridCoverage` pozostaje BRAK. Funkcje lasu przypisane do M08 (tytuł tematu ZLOZA-LAS-FAIRPLAY), ze statusem BRAK.
4. PRZYJĘTE — `computeStartPositions` (`generator.ts:649`, faza `starts`) dopisane do kolejności faz w M18.

## Stan Rust wspólny dla trzech wpisów (na `f7baa3848`)

- `rust-port/engine/src/domain/mapgen/deposits.rs`, `starts.rs`, `villages.rs`, `generate.rs`: każdy plik to 3 linie komentarza `//!` (szkielet M00), zero logiki.
- Jedyne istniejące symbole o złożach w Rust to typy danych (`rust-port/engine/src/data/terrain_map.rs:382` `DepositRule`, `:389` `DepositRules`, `:244-245`): wczytanie konfiguracji, NIE algorytm rozmieszczania.
- Brak w Rust odpowiedników `placeVillages`, `ensureDepositGridCoverage`, `placeDeposits`, `generateMap` (wg `git grep` na bazie: brak wyników poza szkieletem i danymi).
- Punktacja startu (M10) jest w Rust: `rust-port/engine/src/domain/mapgen/cluster_mass.rs:2729` `start_reveal_radius`, `:2757` `score_city_start_hex`, `:2817` `find_best_player_start_hex`; testy `rust-port/engine/tests/p6_m10_start_scoring.rs`. Wynik testów nie był re-uruchamiany w tym temacie (dokument; bez kodu).
- Istnieje osobny rdzeń `rust-port/engine/src/domain/map_generator.rs:326` `pub fn generate_map(...)` (deterministyczny rdzeń: Mulberry32, permutacje, szum, klasyfikacja terenu). NIE jest on podpięty do `mapgen/generate.rs` i nie realizuje orkiestracji pinu `generateMap`. Jego zgodności z pinem NIE zmierzono.

## M08 — złoża i funkcje lasu (`mapgen/deposits.rs`)

- **Pin (web), złoża:** `gra/src/map/gen-helpers.ts` — `placeDeposits` `:12224`; `FAIR_PLAY_DEPOSIT_IDS` `:12286`; `DEPOSIT_RULES` / `BASE_DEPOSIT_RULES` `:12130`, `:12204`; helpery `hexCanAcceptDeposit` `:12320`, `applyDepositToHex` `:12329`, `forceDepositInCell` `:12408`, `pickDepositForceHex` `:12423`, `depositGridCoverageRatio` `:12457`; `ensureDepositGridCoverage` `:12479`. Wywołania w `generator.ts:642` (`placeDeposits`) i `:643` (`ensureDepositGridCoverage`).
- **Pin (web), rozmiary komórek fair-play i lasu:** `fairPlayResourceCellSize` `gen-helpers.ts:1833`, `forestCoverageCellSize` `:1838`, `minLandHexesForFairPlayCell` `:1844`.
- **Pin (web), funkcje lasu:** `forestGridCoverageRatio` `gen-helpers.ts:12538`, `ensureForestGridCoverage` `:12558`. Wywołania w `generator.ts:629` i `:731`.
- **Zakres wg M00 (stub):** `gen-helpers.ts:11929-12474`. Uwaga: ten zakres zawiera też `topUpRiverGridCoverage` (`:11935`), funkcję rzeczną — do rozstrzygnięcia przy M08/M07E2 (patrz „Uwagi do wyjaśnienia").
- **Rust na `f7baa3848`:**
  - `placeDeposits`, `ensureDepositGridCoverage`: brak algorytmu; tylko `data/terrain_map.rs:382-392` (typy danych).
  - Funkcje rozmiaru komórki istnieją jako wrappery: `domain/mapgen/relief.rs:773` `fair_play_resource_cell_size` (wywołuje `iron_coverage_cell_size`, `:758`), `:778` `forest_coverage_cell_size`, `:783` `min_land_hexes_for_fair_play_cell` (wywołuje `min_land_hexes_for_relief_cell`). Nie są algorytmem rozmieszczania złóż.
  - `forestGridCoverageRatio` i `ensureForestGridCoverage`: brak odpowiednika w `rust-port/engine/src` (grep po `forest_grid`/`ensure_forest` bez trafień; w `mapgen/` tylko pola `forest_scale` w `masks.rs:806,822` i tier `forest` w `params.rs:635,650`).
- **Status: BRAK** (`placeDeposits`, `ensureDepositGridCoverage`, `forestGridCoverageRatio`, `ensureForestGridCoverage`). Funkcje rozmiaru komórki: stan opisany powyżej, nie zmieniają statusu wpisu.

## M13 — startowe miasta i wioski (`mapgen/starts.rs`, `mapgen/villages.rs`)

Wpis rozdzielony na trzy podwiersze, każdy z własnym statusem:

- **M13a — wioski (neutralne huty):** `gra/src/map/villages.ts` (214 linii): `VILLAGE_HUTS_PER_CITY` `:30`, `VILLAGE_LAND_HEX_PER_VILLAGE` `:37`, `expectedStartCityCount` `:40`, `villageHutsPerCityMultiplier` `:46`, `targetVillageHutCount` `:51`, `VILLAGE_MIN_DIST_FROM_CITY` `:63`, `VILLAGE_MIN_SPACING` `:69`, `VillageSite` `:76`, `lcgNext` `:92`, `isVillageExcludedTerrain` `:108`, `placeVillages` `:143`. Wywołanie w `generator.ts:680`.
  Rust na `f7baa3848`: `villages.rs` puste (szkielet). Brak `placeVillages`, `targetVillageHutCount`. Wioski w `domain/ai_turn.rs:167`, `:1343` to tylko pole `village` na kafelku i wyszukiwanie wiosek dla AI — NIE generator.
  **Status: BRAK.**
- **M13b — punktacja startu miasta:** pin: `gra/src/map/startScoring.ts` (`findBestPlayerStartHex`, `scoreCityStartHex`, `START_REVEAL_RADIUS`), re-eksport `generator.ts:856` (`export { ... } from './startScoring'`). Rust: `cluster_mass.rs:2729`, `:2757`, `:2817` (patrz „Stan Rust wspólny").
  **Status: POKRYTE** (wg M10: symbole i test `p6_m10_start_scoring.rs` obecne na `f7baa3848`; wynik testu nie re-mierzony w tym wpisie).
- **M13c — wyznaczenie pozycji startowych:** pin: `computeStartPositions` wywołane w `generator.ts:649` (faza `starts`, parametry `minCount: 5`, `minDist: 5`, `absMinDist: 2`). Definicja funkcji poza zakresem stuba M00 — nie odczytana w tym temacie. Rust: `starts.rs` puste; `git grep` po `start_positions` / `starting_pos` w `rust-port/engine/src` bez trafień; istnieje `domain/start_position.rs` (inny moduł, nie zmierzono, czy pełni tę rolę).
  **Status: NIE_ZMIERZONO.**

Zakres M00 dla M13 (`gen-helpers.ts:12475-12561`) zawiera `ensureDepositGridCoverage` (`:12479`) oraz funkcje lasu (`:12538`, `:12558`). Żadna z nich nie jest funkcją startów ani wiosek; ich przypisanie opisano w M08 i w „Uwagach".

**Status wpisu M13 łącznie:** BRAK (wioski) · POKRYTE (punktacja startu, M10) · NIE_ZMIERZONO (`computeStartPositions`).

## M18 — orkiestracja generatora (`mapgen/generate.rs`)

- **Pin (web):** `gra/src/map/generator.ts` — `generateMap` `:150` (ciało do `:764`), `ROZMIAR_DIMS` `:786`, `rozmiarFromMenuLabel` `:806`, `rozmiarToDims` `:817`, `menuLabelToDims` `:823`, `generujSwiat` `:837` (wywołanie `generateMap` w `:848`), re-eksporty `:854-856`. Stałe `DEFAULT_WIDTH` `:127`, `DEFAULT_HEIGHT` `:128`, typ `GameMapWithStarts` `:135`.
- **Kolejność faz w pinie (fakty z wywołań, rosnąco po linii):**
  1. `ensureForestGridCoverage` `:629`
  2. `placeDeposits` `:642`, potem `ensureDepositGridCoverage` `:643`
  3. `computeStartPositions` `:649` (faza `starts`, przed wioskami)
  4. `placeVillages` `:680`
  5. `ensureDepositGridCoverage` `:709`; `ensureForestGridCoverage` `:731`; `ensureDepositGridCoverage` `:732`
  Wcześniej, poza powyższym blokiem: `topUpRiverGridCoverage` `:530`.
- **Zakres wg M00 (stub):** `generator.ts:100-761, 819-843, 845-848`.
- **Rust na `f7baa3848`:** `generate.rs` puste (szkielet). Brak orkiestracji faz pinu i brak `generujSwiat`/`menuLabelToDims`. Istniejący `domain/map_generator.rs:326` (patrz wyżej) to inny rdzeń, nie odpowiednik `generateMap`.
- **Status: BRAK** (orkiestracja pinu). Zgodność `map_generator::generate_map` z pinem: NIE_ZMIERZONO.

## Uwagi do wyjaśnienia (zapis faktów, bez zmiany przydziału w M00)

1. Zakres M08 (`gen-helpers.ts:11929-12474`) obejmuje `topUpRiverGridCoverage` (`:11935`). To funkcja rzeczna, nie złoże.
2. Zakres M13 (`gen-helpers.ts:12475-12561`) zawiera `ensureDepositGridCoverage` (`:12479`) oraz funkcje lasu (`:12538`, `:12558`). Wg tabeli M00 ten zakres należy do M13, ale żadna z tych funkcji nie jest funkcją startów/wiosek. W tym dokumencie złoża i las są opisane w M08 (tytuł tematu ZLOZA-LAS-FAIRPLAY). Ostateczne przypisanie do M08 lub M13 wymaga decyzji orkiestratora przed implementacją.
3. Stub `starts.rs` w M00 wskazuje `gen-helpers.ts`, lecz zakres startów wg pinu jest w `generator.ts` (`:649`) i `startScoring.ts`. Granice M13 wymagają doprecyzowania (w tym definicji `computeStartPositions`, nieodczytanej tutaj).
4. Zakres M18 w `generator.ts:819-843` i `:845-848` odpowiada wyłącznie `rozmiarToDims`/`menuLabelToDims` i fragmentom `generujSwiat`; nie zmierzono, czy pozostałe linie `generator.ts` (`:762-818`, `:849-856`) należą do M18 czy innego tematu.

## Granice tego dokumentu

- Zmieniono wyłącznie ten plik i raport w `dyspozycje/autobot/runs/R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1/`.
- Nie zmieniono kodu Rust, `gra/`, `rust-port/**`, rejestru P6.
- Nie zmierzono parytetu żadnej funkcji (tylko obecność/brak); statusy BRAK oznaczają brak implementacji w Rust, nie wynik testu. Status POKRYTE (M13b) opiera się na obecności kodu i testu wg M10, bez ponownego uruchomienia testu.
