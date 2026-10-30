# R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1 - dokument tematu (tabela symboli i statusu)

STATUS: OTWARTY (runda 2/5). Zakres: `gra/src/game/economy.ts` @ pin `91dc998a` (1243 LOC).
Zrodlo listy: `grep -nE '^\s*(export )?function '` w pinie = 23 deklaracje (19 eksportowanych + 4 prywatne).
Zgodne z liczba 23 z dispatchu.

Plik `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (§9/§11) NIE istnieje w zadnej galezi zdalnej.
ZAŁOŻENIE operatora: lista = 23 deklaracje z pinu; podzial partii jak w kolumnie "Partia".

Legenda statusu:
- PORT-DOWOD: port w `rust-port/engine/src/domain/economy_city_fns.rs`, zweryfikowany wektorami z pinu.
- REUSE-DOWOD: istniejacy port w silniku, zweryfikowany wektorami z pinu w tym temacie.
- DOWOD-POSREDNI: istniejacy port, wykonany wektorami innych funkcji (ten sam kod w sciezce), bez wlasnego wektora.
- WYLACZONA (ZAŁOŻENIE): nie portowana; powod i dowod w kolumnie "Uwagi".
- OTWARTE: istniejacy kandydat w silniku moze byc, ale NIE ma dowodu rownowaznosci. Nie liczyc jako zamkniete.

Dowod wektorowy: `rust-port/engine/tests/economy_city_vectors.rs` na pliku
`rust-port/engine/tests/fixtures/economy_city_vectors_91dc998a.json` (2500 wektorow; generator
`04-gen-economy-city-vectors.mjs`, uruchomiony na bundle esbuild z plikow pinu w node).

| # | Symbol TS (pin 91dc998a) | Linie pin | Eksport | Partia | Status | Odpowiednik Rust | Dowod / uwagi |
|---|---|---|---|---|---|---|---|
| 1 | `loadEconParams` | L198-244 | tak | P2 | OTWARTE | (dane: `data/economy_society.rs`, nieprzeanalizowane) | Uzywane w `main.ts` (zywa sciezka). Brak wektorow. |
| 2 | `terrainRowToTileYield` | L386-398 | nie | P3 | OTWARTE | `economy_yield::tile_yield_base` (kandydat) | Czesc lancucha `tileYield`. Brak wektorow. |
| 3 | `buildTerrainYields` | L399-407 | nie | P3 | OTWARTE | `economy_yield` (kandydat) | Stala `TERRAIN_YIELDS` z `terrain-yields.json`. Brak wektorow. |
| 4 | `terrainModifier` | L408-412 | nie | P3 | OTWARTE | `economy_yield` (kandydat) | `RIVER_MODIFIER`, `FOREST_MODIFIER`. Brak wektorow. |
| 5 | `tileYield` | L421-492 | tak | P3 | OTWARTE | `economy_yield::tile_yield_base` / `tile_yield_full` (kandydaty) | Zywa sciezka (okolica, cityPanel, hexContextTooltip). Brak wektorow. |
| 6 | `buildingValue` | L493-506 | tak | P1 | DOWOD-POSREDNI (formula zadowolenia) | `economy_yield::building_value` | Wywolywane przez `buildingHappinessAtLevel`; wektory `sumBuildingHappiness*` (700) z NaN/-0/Infinity poziomu i przyrostu. Inne klucze `baza` (nie `zadowolenie`) nie sprawdzone. |
| 7 | `buildingGivesHappiness` | L514-516 | tak | P1 | DOWOD-POSREDNI | adapter `daje_szczescie: bool` (`=== true`) | Wektory z surowymi `dajeSzczescie`: true/false/brak/null/"true"/"tak"/1/0. |
| 8 | `buildingHappinessAtLevel` | L523-533 | tak | P1 | DOWOD-POSREDNI | `economy_yield::building_happiness_at_level` | Wektory `sumBuildingHappiness*` (700). |
| 9 | `sumBuildingHappinessFromBuiltIds` | L546-558 | tak | P1 | PORT-DOWOD | `economy_city_fns::sum_building_happiness_from_built_ids` | 400 wektorow; unit: brak id, pierwszy wpis przy duplikatach, levelFor 1x na znaleziony wpis. |
| 10 | `sumBuildingHappiness` | L561-567 | tak | P1 | PORT-DOWOD | `economy_city_fns::sum_building_happiness` | 300 wektorow. |
| 11 | `cityBuildingEntriesFromBuiltIds` | L589-609 | tak | P1 | PORT-DOWOD | `economy_city_fns::city_building_entries_from_built_ids` | 400 wektorow; uzywa `production_units::building_level_for_epoch` (wektory pokrywaja tez jego galezie gate/cap/NaN); unit: duplikaty id (pierwszy). Adapter: tablica `unlockedTechs` = `new Set(arr)` (rownowazne w `buildingLevelForEpoch`), nieprzetestowane wektorem. |
| 12 | `mnoznikHandelPieniadzForCiv` | L704-716 | tak | P4 (nieustalone) | OTWARTE | `economy_yield::mnoznik_handel_pieniadz_for_civ` (kandydat) | Brak wektorow (wymaga macierzy cywilizacji). |
| 13 | `civMatrixMnoznikHandelPieniadzRaw` | L717-737 | nie | P4 (nieustalone) | OTWARTE | `economy_yield::civ_matrix_mnoznik_handel_pieniadz_raw` (kandydat) | Brak wektorow. |
| 14 | `mnoznikHandelPieniadzForCivByDifficulty` | L753-764 | tak | P4 (nieustalone) | OTWARTE | `economy_yield::mnoznik_handel_pieniadz_for_civ_by_difficulty` (kandydat) | Brak wektorow. |
| 15 | `civBonusyForCivKey` | L765-781 | tak | P4 (nieustalone) | OTWARTE | `civ_bonuses::civ_matrix_bonusy_for_civ_key` (kandydat) | Brak wektorow. |
| 16 | `civEconomyYieldMultipliers` | L782-818 | tak | P4 (nieustalone) | OTWARTE | `economy_yield::civ_economy_yield_multipliers` (kandydat) | Brak wektorow. |
| 17 | `cityYieldPerTurn` | L819-1047 | tak | P4 (nieustalone) | OTWARTE | `economy_yield::city_yield_per_turn` / `_from_worked` / `_from_worked_imp` (kandydaci) | Najwiekszy symbol (~230 LOC); wymaga osobnej partii. Brak wektorow. |
| 18 | `cityPopulationCap` | L1048-1065 | tak | P2 | REUSE-DOWOD | `city_growth::p6_7a::city_population_cap` (istniejacy port) | 400 wektorow w tym temacie (`PopCapParams` + delta z -1..3, NaN, -0, Infinity). |
| 19 | `resolvePopulationCapMatrixDelta` | L1066-1083 | tak | P2 | OTWARTE (kandydat istnieje) | `city_growth::p6_7a::resolve_population_cap_matrix_delta(_in)` | Wymaga syntetycznej `CivMatrixFile` po obu stronach (fixture macierzy). Nie dowiedzione. |
| 20 | `populationGrowth` | L1084-1150 | tak | P2 | WYLACZONA (ZAŁOŻENIE) | nie portowano (zywa sciezka: `population-growth-v85.ts` -> `city_growth::p6_7a::growth_v85`) | Dowod: `git grep populationGrowth` w `gra/src` pinu = tylko definicja i komentarze w `economy-upkeep.ts`; wywolania tylko w narzedziach dev `gra/tools/*.cjs` (`akwedukt-popcap-test.cjs`) i w kopiach bundli `.krok2-typecheck-bundle.cjs`, `.test-diag-bundle.cjs`. Model Rust (V85) jest INNY - nie wolno go nazywac rownowaznoscia. Do potwierdzenia przez Final Control. |
| 21 | `productionProgress` | L1151-1171 | tak | P1 | PORT-DOWOD | `economy_city_fns::production_progress` | 400 wektorow; unit: granica `>=`, Math.floor, NaN. |
| 22 | `corruptionRate` | L1190-1199 | tak | P1 | PORT-DOWOD | `economy_city_fns::corruption_rate` | 400 wektorow; unit: NaN w dystansie i w capie (nowy test), cap. |
| 23 | `corruptionBuildingReduction` | L1202-1229 (stale L1202-1211) | tak | P1 | PORT-DOWOD | `economy_city_fns::corruption_building_reduction` | 200 wektorow; unit: sufit 0.60, duplikaty, brak budynku. |

Podsumowanie (23 symbole): PORT-DOWOD 6 (#9, #10, #11, #21, #22, #23); REUSE-DOWOD 1 (#18);
DOWOD-POSREDNI 3 (#6 czesciowo, #7, #8); WYLACZONA 1 (#20, ZAŁOŻENIE); OTWARTE 12 (#1-#5, #12-#17, #19).

Wektory: 2500 = happiness-from-built 400 + sumBuildingHappiness 300 + cityBuildingEntries 400 +
productionProgress 400 + corruptionRate 400 + corruptionBuildingReduction 200 + cityPopulationCap 400.

Otwarte dla rundy 3+: #1-#5 (loadEconParams, tileYield i teren), #12-#17 (mnoznik/civ/cityYieldPerTurn),
#19 (matrix delta - wymaga fixture macierzy).
