# R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1 - dokument tematu (tabela symboli i statusu)

STATUS: Operator r4 (runda 4/5): wszystkie 23 symbole maja status ZAMKNIETY (PORT-DOWOD / REUSE-DOWOD / DOWOD-POSREDNI usuniete; #20 WYLACZONA jako ZALOZENIE). Zakres: `gra/src/game/economy.ts` @ pin `91dc998a` (1243 LOC).
Zrodlo listy: `grep -nE '^\s*(export )?function '` w pinie = 23 deklaracje (19 eksportowanych + 4 prywatne).
Zgodne z liczba 23 z dispatchu. Temat zamykany dopiero po Evaluatorze, Obronie i Final Control (r4).

Plik `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (§9/§11) NIE istnieje w zadnej galezi zdalnej.
ZALOZENIE operatora: lista = 23 deklaracje z pinu; podzial partii jak w kolumnie "Partia".
Kopia tej tabeli: `dyspozycje/rust-port/p6/P6-8F-EKONOMIA-MIASTA.md`.

Legenda statusu:
- PORT-DOWOD: nowy lub adapterowy port w silniku (modul z nazwa w kolumnie "Odpowiednik Rust"), zweryfikowany wektorami z pinu.
- REUSE-DOWOD: istniejacy port w silniku, zweryfikowany wektorami z pinu (w tym temacie).
- WYLACZONA (ZALOZENIE): nie portowana; powod i dowod w kolumnie "Uwagi".
- DOWOD-POSREDNI / OTWARTE: nie wystepuja w stanie po r4.

Dowod wektorowy (trzy fixture, wszystkie z bundle esbuild z plikow pinu uruchomionego w node):
- runda 2: `tests/economy_city_vectors.rs` + `tests/fixtures/economy_city_vectors_91dc998a.json` (2500 wektorow; generator `04-gen-economy-city-vectors.mjs`).
- runda 3: `tests/economy_city_vectors_r3.rs` + `tests/fixtures/economy_city_vectors_r3_91dc998a.json` (2708 wektorow; generator `07-gen-economy-city-vectors-r3.mjs`).
- runda 4: `tests/economy_city_vectors_r4.rs` + `tests/fixtures/economy_city_vectors_r4_91dc998a.json` (1520 wektorow; generator `10-gen-economy-city-vectors-r4.mjs`; kopia pinu patchowana skryptem `10b-patch-kopii-pin.mjs`: eksport 4 funkcji prywatnych + shim danych wejsciowych `buildTerrainYields`, cialo petli bez zmian).
- Liczby w fixture r3 i r4: tekst `String(x)` / `NaN` / `Infinity` / `-0` (parser serde_json bez `float_roundtrip` nie zaokragla wiernie liczb JSON; r4 pierwotnie uzywal liczb JSON i wykryl to przy `corruptionRate`).

| # | Symbol TS (pin 91dc998a) | Linie pin | Eksport | Partia | Status | Odpowiednik Rust | Dowod / uwagi |
|---|---|---|---|---|---|---|---|
| 1 | `loadEconParams` | L198-244 | tak | P2 | PORT-DOWOD (r3) | `economy_city_params::load_econ_params` | 400 wektorow (r3). Mutacja M1 (bez `isFinite`) = equivalent mutant w domenie JSON (serde_json nie niesie NaN/Inf). Trudnosci (`read`, `economy_city_params.rs` L50-58): mutacja L1 (wiersz trudnosci zawsze `normal`) ZABITA, mutacja L2 (fallback `0` zamiast `fallback`) ZABITA; filtr `is_finite` = equivalent mutant (JSON nie niesie NaN/Inf). |
| 2 | `terrainRowToTileYield` | L386-398 | nie | P3 | PORT-DOWOD (r3) | `economy_city_terrain::terrain_row_to_tile_yield` | 400 wektorow syntetycznych (r3). Fallback `Podatek ?? Handel` (M3 zabita). Zakres: skalary JSON; obiekty/tablice poza domena. |
| 3 | `buildTerrainYields` | L399-407 | nie | P3 | PORT-DOWOD (r3+r4) | `economy_city_terrain::build_terrain_yields` | r3: 1 wektor na realnych danych. r4: 60 wektorow syntetycznych przez shim kopii (`__TERRAIN_ROWS__`): duplikaty etykiet z innymi wartosciami (ostatni wygrywa, petla L401-403: `out[key] = ...`), nieznane etykiety (pominiete), wiersze bez `Teren`, odwrocona kolejnosc. Mutacja M3a (pierwszy wpis zamiast ostatniego) ZABITA. Domena: etykiety z `terrain-yields.json` (uwaga: `TERRAIN_NAME_TO_ENUM` jest zwykłym obiektem JS; etykiety typu `constructor` sa poza domena danych). |
| 4 | `terrainModifier` | L408-412 | nie | P3 | PORT-DOWOD (r3) | `economy_city_terrain::terrain_modifier` | 7 wektorow realnych (r3). |
| 5 | `tileYield` | L421-492 | tak | P3 | REUSE-DOWOD (r3) | `economy_yield::tile_yield_full` | 500 wektorow (r3). `tile_yield_base` (bez ulepszen) NIE jest tym symbolem. |
| 6 | `buildingValue` | L493-498 | tak | P1 | REUSE-DOWOD (r3) | `economy_yield::building_value` | 500 wektorow (r3), wszystkie klucze, poziomy 0, -0, ujemne, NaN, Inf, 1e300. Wektory r4 (`cityYieldPerTurn`, 300) potwierdzaja ten sam wzor w pelnej sciezce. |
| 7 | `buildingGivesHappiness` | L514-516 | tak | P1 | PORT-DOWOD (r4) | `economy_city_fns::building_gives_happiness(Option<&Value>)` | 60 wektorow r4 z surowymi typami JS: `true`, `false`, brak, `null`, `"true"`, `"tak"`, `1`, `0`, `""`, `[]`, `{}`. Tylko `Bool(true)` daje `true`. Mutacja M7a (`Bool(_)`) ZABITA. Poprzedni adapter `daje_szczescie: bool` (`=== true` po stronie wolajacego) zastapiony portem na wartosci JSON. |
| 8 | `buildingHappinessAtLevel` | L523-533 | tak | P1 | REUSE-DOWOD (r4) | `economy_yield::building_happiness_at_level` | 300 wektorow r4 (wejscie: `dajeSzczescie` wszystkie typy, `baza.zadowolenie` absent/null/`"4"`/0/liczba, `przyrost.zadowolenie` absent/0/liczba, poziomy 0, -0, NaN, 2.7, 5). Galezie: `!buildingGivesHappiness` -> 0 (M8a ZABITA), `typeof === number && !== 0` (M8b ZABITA). Domena przyrost: liczba lub brak (tekst poza domena danych). |
| 9 | `sumBuildingHappinessFromBuiltIds` | L546-558 | tak | P1 | PORT-DOWOD (r2) | `economy_city_fns::sum_building_happiness_from_built_ids` | 400 wektorow (r2). |
| 10 | `sumBuildingHappiness` | L561-567 | tak | P1 | PORT-DOWOD (r2) | `economy_city_fns::sum_building_happiness` | 300 wektorow (r2). |
| 11 | `cityBuildingEntriesFromBuiltIds` | L589-609 | tak | P1 | PORT-DOWOD (r2+r4) | `economy_city_fns::city_building_entries_from_built_ids` | r2: 400 wektorow. r4: 300 wektorow z duplikatami id w katalogu (web `catalog.find` = pierwszy wpis, mutacja M11a ZABITA), bramkami technologii o kluczach liczbowych (`production.ts` L255-258), nieznanymi id. Adapter `unlockedTechs`: web `instanceof Set ? x : new Set(x ?? [])` (`production.ts` L254) = w Rust `Option<&HashSet<String>>` (lista -> HashSet, null/brak -> None = pusty zbior). Wektory podaja tablice i Set (ten sam zbior), null i brak. Mutacja M11b (`unlocked.contains` odwrocone w `production_units.rs` L527) ZABITA. |
| 12 | `mnoznikHandelPieniadzForCiv` | L704-716 | tak | P4 | REUSE-DOWOD (r3) | `economy_yield::mnoznik_handel_pieniadz_for_civ` | 200 wektorow (r3). |
| 13 | `civMatrixMnoznikHandelPieniadzRaw` | L717-737 | nie | P4 | REUSE-DOWOD (r3) | `economy_yield::civ_matrix_mnoznik_handel_pieniadz_raw` | 200 wektorow (r3; eksport tylko w kopii bundla). |
| 14 | `mnoznikHandelPieniadzForCivByDifficulty` | L753-764 | tak | P4 | REUSE-DOWOD (r3) | `economy_yield::mnoznik_handel_pieniadz_for_civ_by_difficulty` | 200 wektorow (r3). |
| 15 | `civBonusyForCivKey` | L765-781 | tak | P4 | PORT-DOWOD (r4) | `economy_city_fns::civ_bonusy_for_civ_key(Option<&str>, Option<&Value>)` | 200 wektorow r4: `civs` = null/brak/`{cywilizacje}` (brak, null, pusta, lista z wierszami null/0/"abc"/obiekt), tozsamosci `ikonaId`/`typCywilizacji`/`Cywilizacja` (brak, `""`, `" "`, liczba, wielkosc liter), `bonusy` brak/null/[]/lista. Klucz czesto z tozsamosci wierszy; duplikaty tozsamosci z innym `bonusy` (pierwszy wygrywa). Mutacje M15a (ostatni wygrywa) i M15b (bez `toLowerCase`) ZABITE. `civs` wejscie = realny obiekt `civs.json`-owy (NIE `civ-matrix.json`); `CivMatrixFile` (`civ_bonuses::civ_matrix_bonusy_for_civ_key`) nie jest tym symbolem. |
| 16 | `civEconomyYieldMultipliers` | L782-818 | tak | P4 | PORT-DOWOD (r3) | `economy_yield::civ_economy_yield_multipliers` | 100 wektorow (r3); wynik zawsze `{handel: 1, nauka: 1}`. |
| 17 | `cityYieldPerTurn` | L819-1047 | tak | P4 | REUSE-DOWOD (r4) | `economy_yield::city_yield_per_turn_from_worked_imp` (skladanie: `city_yield_head` + `city_yield_tail`, `tile_yield_full`, `building_value`, `building_happiness_at_level`) | 300 wektorow r4: 0-5 kafelkow (teren, nakladka, rzeka, `ulepszeniaKeys` brak/null/[]/lista z nieznanymi i pustym, `ulepszenieKey` brak/null/pusty/klucz, `zloze`), 0-4 budynkow (pelne `baza`/`przyrost`, `dajeSzczescie`, `zadowolenie`, poziomy, `id` = port/port_wielki/...), 9 parametrow `EconParams`, pelny `ctx` (Mlyn, Cegielnia, Mennica/Waluta, Biblioteka, Akademia, civHandelMult, civNaukaMult, premia tras (0, 0.05, 0.5, 0.95, 3.5, -1), additionalTax, Garncarnia, wojsko, strata), 0-3 specjalistow (Poborca), klucze cywilizacji realne, puste, null, brak, nieznane. Wszystkie 18 pol wyniku. Mutacje galezi sterujacych: Y01 Mlyn, Y02 Cegielnia, Y03 port (`eko_pieniadz_port_proc`), Y04 civHandelMult, Y05 premia (`> 0` vs `> 1`), Y06 additionalTax (`max(0)`), Y07 cap korupcji, Y08 Waluta AND Mennica, Y09 Akademia, Y10 Garncarnia (`?? 0`), Y11 Poborca +2, Y12 Biblioteka: WSZYSTKIE ZABITE. Zadnego zmieniania kodu portu nie bylo (test przeszedl na istniejacym porcie). |
| 18 | `cityPopulationCap` | L1048-1065 | tak | P2 | REUSE-DOWOD | `city_growth::p6_7a::city_population_cap` | 400 wektorow w tym temacie (r2). |
| 19 | `resolvePopulationCapMatrixDelta` | L1066-1069 | tak | P2 | REUSE-DOWOD (r3) | `city_growth::p6_7a::resolve_population_cap_matrix_delta` | 200 wektorow realnych (r3). Wersja `_in` (`city_growth.rs` L924, parametr macierzy) NIE jest symbolem web: TS nie ma parametru macierzy. Dowod rownowaznosci wrappera (`city_growth.rs` L918-919: `resolve_population_cap_matrix_delta(civ_key)` = `resolve_population_cap_matrix_delta_in(&load_civ_matrix().file, civ_key)`) - wrapper jest tym, co dowodza wektory. `_in` jest uzywane przez `resolve_population_matrix_for_civ_in` (`city_growth.rs` L1041). |
| 20 | `populationGrowth` | L1084-1150 | tak | P2 | WYLACZONA (ZALOZENIE) | nie portowano (zywa sciezka: `population-growth-v85.ts` -> `city_growth::p6_7a::growth_v85`) | Dowod: `git grep populationGrowth` w `gra/src` pinu = tylko definicja i komentarze w `economy-upkeep.ts`; wywolania tylko w narzedziach dev `gra/tools/*.cjs` i w kopiach bundli. Model Rust (V85) jest INNY - nie wolno go nazywac rownowaznoscia. Zatwierdzone przez FC r2 jako ZALOZENIE. |
| 21 | `productionProgress` | L1151-1171 | tak | P1 | PORT-DOWOD (r2) | `economy_city_fns::production_progress` | 400 wektorow (r2). |
| 22 | `corruptionRate` | L1190-1199 | tak | P1 | PORT-DOWOD (r2+r4) | `economy_city_fns::corruption_rate` | r2: 400 wektorow. r4: 300 wektorow (dystans, liczba miast, wspolczynniki, cap 0/0.25/0.3333/0.5/0.9/1/NaN). M6 (`cap_pct.min(strata_pct)` zamiast `js_min`, utrata NaN) ZABITA przez fixture r2 (`economy_city_vectors`, test `vectors_match_pinned_web_economy`) ORAZ przez fixture r4. M2 (cap `*10` zamiast `*100`) ZABITA przez r4. Test lib `corruption_rate_*` nie jest jedynym zabijaczem. |
| 23 | `corruptionBuildingReduction` | L1223-1229 (deklaracja; stale `CORRUPTION_*` L1202-1211) | tak | P1 | PORT-DOWOD (r2) | `economy_city_fns::corruption_building_reduction` | 200 wektorow (r2). |

Podsumowanie (23 symbole, stan po rundzie 4):
- PORT-DOWOD 13: #1, #2, #3, #4, #7, #9, #10, #11, #15, #16, #21, #22, #23 (r2/r3/r4; #3, #11, #22 z dowodem r2+r4).
- REUSE-DOWOD 9: #5, #6, #8, #12, #13, #14, #17, #18, #19 (r2/r3/r4).
- WYLACZONA 1: #20 (ZALOZENIE).
- OTWARTE 0 (#15 i #17 zamkniete w r4).

Wektory (razem 6728 w trzech fixture): r2 2500 = happiness-from-built 400 + sumBuildingHappiness 300 + cityBuildingEntries 400 +
productionProgress 400 + corruptionRate 400 + corruptionBuildingReduction 200 + cityPopulationCap 400;
r3 2708 = loadEconParams 400 + terrainRowToTileYield 400 + buildTerrainYields 1 + terrainModifier 7 + tileYield 500 +
buildingValue 500 + resolvePopulationCapMatrixDelta 200 + civMatrixMnoznikRaw 200 + mnoznikForCiv 200 +
mnoznikByDifficulty 200 + civEconomyYieldMultipliers 100;
r4 1520 = buildingGivesHappiness 60 + buildingHappinessAtLevel 300 + cityBuildingEntriesFromBuiltIds 300 + civBonusyForCivKey 200 +
cityYieldPerTurn 300 + corruptionRate 300 + buildTerrainYieldsSynthetic 60.

Mutacje r4 (driver `10c-mutacje-r4.mjs`, jeden tekst zamieniany, `cargo test --test <cel>`, plik przywracany i weryfikowany):
M7a, M8a, M8b, M11a, M11b, M3a, M15a, M15b, Y01-Y12, M6-r4, M6-r2, M2-r4 (23 mutacje na fixture r2/r4) oraz L1, L2 na fixture r3 (`loadEconParams`) - razem 25, wszystkie ZABITE (po dodaniu wektorow: bramki technologii, duplikaty id, duplikaty tozsamosci civ, premia w (0,1], corruptionRate).

Weryfikacja niezalezna r3 (`09-operator-pomiary-r3.md`): regeneracja 07-gen z bundla pinu 91dc998a daje plik BAJT-W-BAJT zgodny z `tests/fixtures/economy_city_vectors_r3_91dc998a.json` (2708).
