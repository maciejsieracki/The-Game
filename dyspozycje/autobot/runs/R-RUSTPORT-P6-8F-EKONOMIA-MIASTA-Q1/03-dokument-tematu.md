# R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1 - dokument tematu (tabela symboli i statusu)

STATUS: OTWARTY (runda 3/5, Operator-impl). Zakres: `gra/src/game/economy.ts` @ pin `91dc998a` (1243 LOC).
Zrodlo listy: `grep -nE '^\s*(export )?function '` w pinie = 23 deklaracje (19 eksportowanych + 4 prywatne).
Zgodne z liczba 23 z dispatchu. Temat NIE jest zamkniety: 2 symbole OTWARTE (#15, #17).

Plik `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (§9/§11) NIE istnieje w zadnej galezi zdalnej.
ZAŁOŻENIE operatora: lista = 23 deklaracje z pinu; podzial partii jak w kolumnie "Partia".
Kopia tej tabeli: `dyspozycje/rust-port/p6/P6-8F-EKONOMIA-MIASTA.md`.

Legenda statusu:
- PORT-DOWOD: port w silniku (modul z nazwa w kolumnie "Odpowiednik Rust"), zweryfikowany wektorami z pinu.
- REUSE-DOWOD: istniejacy port w silniku, zweryfikowany wektorami z pinu w tym temacie.
- DOWOD-POSREDNI: istniejacy port, wykonany wektorami innych funkcji (ten sam kod w sciezce), bez wlasnego wektora.
- WYLACZONA (ZAŁOŻENIE): nie portowana; powod i dowod w kolumnie "Uwagi".
- OTWARTE: istniejacy kandydat w silniku moze byc, ale NIE ma dowodu rownowaznosci. Nie liczyc jako zamkniete.

Dowod wektorowy (dwa pliki fixture, oba z bundle esbuild z plikow pinu uruchomionego w node):
- runda 2: `rust-port/engine/tests/economy_city_vectors.rs` + `tests/fixtures/economy_city_vectors_91dc998a.json`
  (2500 wektorow; generator `04-gen-economy-city-vectors.mjs`).
- runda 3: `rust-port/engine/tests/economy_city_vectors_r3.rs` + `tests/fixtures/economy_city_vectors_r3_91dc998a.json`
  (2708 wektorow; generator `07-gen-economy-city-vectors-r3.mjs`; bundle z kopii pinu, w ktorej trzy funkcje
  nieeksportowane (`terrainRowToTileYield`, `buildTerrainYields`, `terrainModifier`) i `civMatrixMnoznikHandelPieniadzRaw`
  dostaly slowo `export`; kopia tymczasowa poza repo, plik w repo nietkniety).

| # | Symbol TS (pin 91dc998a) | Linie pin | Eksport | Partia | Status | Odpowiednik Rust | Dowod / uwagi |
|---|---|---|---|---|---|---|---|
| 1 | `loadEconParams` | L198-244 | tak | P2 | PORT-DOWOD (r3) | `economy_city_params::load_econ_params` | 400 wektorow (losowe `raw` JSON: grupy brak/null/nie-obiekt, wiersze brak/null/liczba/tekst/tablica, 4 trudnosci w tym nieznana). Pole `spichlerzZachowaniePoPrzroscie` (nazwa web) = `spichlerz_zachowanie_po_wzroscie`. Mutacja M1 (bez `isFinite`) = equivalent mutant w domenie JSON (serde_json nie niesie NaN/Inf). |
| 2 | `terrainRowToTileYield` | L386-398 | nie | P3 | PORT-DOWOD (r3) | `economy_city_terrain::terrain_row_to_tile_yield` | 400 wektorow syntetycznych wierszy (liczby, -0, teksty JS-owe: `''`, `' 4 '`, `'0x1A'`, `'-0'`, `'Infinity'`, bool, null, brak). Fallback `Podatek ?? Handel` (mutacja M3 zabita). Zakres: skalary JSON; obiekty/tablice poza domena (NaN). |
| 3 | `buildTerrainYields` | L399-407 | nie | P3 | PORT-DOWOD (r3) | `economy_city_terrain::build_terrain_yields` | 1 wektor na realnych danych `terrain-yields.json` (8 kluczy). Unit: nieznana etykieta pomijana, duplikat = ostatni wygrywa (ZALOZENIE z kodu L399-406; duplikatu nie da sie wstrzyknac do danych modulu). |
| 4 | `terrainModifier` | L408-412 | nie | P3 | PORT-DOWOD (r3) | `economy_city_terrain::terrain_modifier` | 7 wektorow realnych (`Rzeka`, `Las (nakładka)`, nieznane, pusta, bialy znak). |
| 5 | `tileYield` | L421-492 | tak | P3 | REUSE-DOWOD (r3) | `economy_yield::tile_yield_full` | 500 wektorow: teren x las x rzeka x `ulepszeniaKeys` (brak/null/[]/lista z nieznanymi i pustym) x `ulepszenieKey` (brak/null/''/klucz) x `zloze`. `tile_yield_base` (bez ulepszen) NIE jest tym symbolem. |
| 6 | `buildingValue` | L493-506 | tak | P1 | REUSE-DOWOD (r3) | `economy_yield::building_value` | 500 wektorow, WSZYSTKIE klucze (`praca`, `pieniadz`, `zywnosc`, `nauka`, `kultura`, `zadowolenie`, nieznany; brak = NaN). Poziomy: 0, -0, ujemne, NaN, Inf, 1e300. (Runda 2: dowod tylko dla `zadowolenie`.) |
| 7 | `buildingGivesHappiness` | L514-516 | tak | P1 | DOWOD-POSREDNI | adapter `daje_szczescie: bool` (`=== true`) | Wektory z surowymi `dajeSzczescie`: true/false/brak/null/"true"/"tak"/1/0. |
| 8 | `buildingHappinessAtLevel` | L523-533 | tak | P1 | DOWOD-POSREDNI | `economy_yield::building_happiness_at_level` | Wektory `sumBuildingHappiness*` (700). |
| 9 | `sumBuildingHappinessFromBuiltIds` | L546-558 | tak | P1 | PORT-DOWOD | `economy_city_fns::sum_building_happiness_from_built_ids` | 400 wektorow (r2); unit: brak id, pierwszy wpis przy duplikatach, levelFor 1x na znaleziony wpis. |
| 10 | `sumBuildingHappiness` | L561-567 | tak | P1 | PORT-DOWOD | `economy_city_fns::sum_building_happiness` | 300 wektorow (r2). |
| 11 | `cityBuildingEntriesFromBuiltIds` | L589-609 | tak | P1 | PORT-DOWOD | `economy_city_fns::city_building_entries_from_built_ids` | 400 wektorow (r2); uzywa `production_units::building_level_for_epoch`; unit: duplikaty id (pierwszy). Adapter `unlockedTechs` = `new Set(arr)` nieprzetestowany wektorem. |
| 12 | `mnoznikHandelPieniadzForCiv` | L704-716 | tak | P4 | REUSE-DOWOD (r3) | `economy_yield::mnoznik_handel_pieniadz_for_civ` | 200 wektorow na wbudowanej macierzy `civ-matrix.json` (klucze: ikona/typ/nazwa w roznych wielkosciach liter, pusty, null, brak, nieznany; fallback 1, 0.7, 0, -0, 2.5, NaN). |
| 13 | `civMatrixMnoznikHandelPieniadzRaw` | L717-737 | nie | P4 | REUSE-DOWOD (r3) | `economy_yield::civ_matrix_mnoznik_handel_pieniadz_raw` | 200 wektorow (eksport tylko w kopii bundla). Zwraca `undefined` dla pustego/nieznanego klucza i dla niekonczonej wartosci. |
| 14 | `mnoznikHandelPieniadzForCivByDifficulty` | L753-764 | tak | P4 | REUSE-DOWOD (r3) | `economy_yield::mnoznik_handel_pieniadz_for_civ_by_difficulty` | 200 wektorow: easy +0.5, normal 0, hard -0.5; brak wiersza = `fallbackScaled` bez drugiej delty. |
| 15 | `civBonusyForCivKey` | L765-781 | tak | P4 | OTWARTE | `civ_bonuses::civ_matrix_bonusy_for_civ_key` (kandydat, INNE wejscie) | TS czyta `row.bonusy` z PRZEKAZANEGO argumentu `civs` (wiersze civs.json); Rust czyta macierz `civ-matrix.json` i buduje wpisy ze specyfikacji. Brak odpowiednika 1:1 wejscia - wymaga portu funkcji przyjmujacej `civs`, a potem wektorow. Nie zamykac. |
| 16 | `civEconomyYieldMultipliers` | L782-818 | tak | P4 | PORT-DOWOD (r3) | `economy_yield::civ_economy_yield_multipliers` | 100 wektorow; wynik zawsze `{handel: 1, nauka: 1}`, argument ignorowany (web tez). |
| 17 | `cityYieldPerTurn` | L819-1047 | tak | P4 | OTWARTE | `economy_yield::city_yield_per_turn` / `_from_worked` / `_from_worked_imp` (kandydaci) | Najwiekszy symbol (~230 LOC); wymaga osobnej partii (runda 4). Brak wektorow. |
| 18 | `cityPopulationCap` | L1048-1065 | tak | P2 | REUSE-DOWOD | `city_growth::p6_7a::city_population_cap` | 400 wektorow w tym temacie (r2). |
| 19 | `resolvePopulationCapMatrixDelta` | L1066-1069 | tak | P2 | REUSE-DOWOD (r3) | `city_growth::p6_7a::resolve_population_cap_matrix_delta` (wersja z wbudowana macierza) | 200 wektorow realnych (wszystkie klucze cywilizacji, nieznany, pusty, null, brak). Wersja `_in` (syntetyczna macierz) NIE jest dowodzona - web nie ma parametru macierzy. |
| 20 | `populationGrowth` | L1084-1150 | tak | P2 | WYLACZONA (ZAŁOŻENIE) | nie portowano (zywa sciezka: `population-growth-v85.ts` -> `city_growth::p6_7a::growth_v85`) | Dowod: `git grep populationGrowth` w `gra/src` pinu = tylko definicja i komentarze w `economy-upkeep.ts`; wywolania tylko w narzedziach dev `gra/tools/*.cjs` i w kopiach bundli. Model Rust (V85) jest INNY - nie wolno go nazywac rownowaznoscia. Zatwierdzone przez FC r2 jako ZAŁOŻENIE. |
| 21 | `productionProgress` | L1151-1171 | tak | P1 | PORT-DOWOD | `economy_city_fns::production_progress` | 400 wektorow (r2). |
| 22 | `corruptionRate` | L1190-1199 | tak | P1 | PORT-DOWOD | `economy_city_fns::corruption_rate` | 400 wektorow (r2). |
| 23 | `corruptionBuildingReduction` | L1223-1229 (deklaracja; stale `CORRUPTION_*` L1202-1211) | tak | P1 | PORT-DOWOD | `economy_city_fns::corruption_building_reduction` | 200 wektorow (r2). Naglowek modulu poprawiony w r3 (zakres deklaracji, 2500 wektorow). |

Podsumowanie (23 symbole, stan po rundzie 3):
- PORT-DOWOD 11: #1, #2, #3, #4, #9, #10, #11, #16, #21, #22, #23.
- REUSE-DOWOD 7: #5, #6, #12, #13, #14, #18, #19.
- DOWOD-POSREDNI 2: #7, #8.
- WYLACZONA 1: #20 (ZAŁOŻENIE).
- OTWARTE 2: #15 (inne wejscie `civs`), #17 (`cityYieldPerTurn`).

Wektory (razem 5208): r2 2500 = happiness-from-built 400 + sumBuildingHappiness 300 + cityBuildingEntries 400 +
productionProgress 400 + corruptionRate 400 + corruptionBuildingReduction 200 + cityPopulationCap 400;
r3 2708 = loadEconParams 400 + terrainRowToTileYield 400 + buildTerrainYields 1 + terrainModifier 7 + tileYield 500 +
buildingValue 500 + resolvePopulationCapMatrixDelta 200 + civMatrixMnoznikRaw 200 + mnoznikForCiv 200 +
mnoznikByDifficulty 200 + civEconomyYieldMultipliers 100.

Otwarte dla rundy 4: #17 `cityYieldPerTurn` (osobna partia, <=600 LOC) oraz #15 `civBonusyForCivKey` (port z parametrem `civs`).

Weryfikacja niezalezna r3 (Operator-pomiary, `09-operator-pomiary-r3.md`): regeneracja 07-gen z bundla pinu 91dc998a
daje plik BAJT-W-BAJT zgodny z `tests/fixtures/economy_city_vectors_r3_91dc998a.json` (2708). Mutacje: M2, M3, M5 zabite
przez wektory r3; M6 (`cap_pct.min` zamiast `js_min`) przeszla wektory r3, zabita przez testy jednostkowe lib
`corruption_rate_*` (luka: wektory r3 nie zawieraja `corruptionRate`).
