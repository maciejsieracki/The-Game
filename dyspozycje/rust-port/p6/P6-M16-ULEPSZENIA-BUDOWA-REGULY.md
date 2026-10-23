# P6.M16 - Budowa ulepszen na mapie: reguly (port `gra/src/map/improvement-build.ts` do Rust)

Temat: `R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1` - DOMAIN: GAME - RUNDA 2/5 (Operator, obrona; zmiany wzgledem R1 oznaczone "R2").
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `faca762c` (674 testy).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1/`.
Kod: `rust-port/engine/src/domain/improvement_build.rs`, tabela `rust-port/engine/data/derived/ulepszenia-budowa.json`
(parser dopisany na koncu `src/data/derived.rs`), testy `rust-port/engine/tests/p6_m16_*.rs`, wektory
`rust-port/engine/tests/p6_m16_vectors/`.

## 1. Metoda (anty-halucynacja)

- Zrodlo glowne przeczytane w CALOSCI: `gra/src/map/improvement-build.ts` = **1569 linii** (`wc -l`; zakres tematu 50-1558,
  linie 1559-1569 `collectRoadKeys` i re-eksport `isRoadImprovementKey` naleza do M15 wg P6-25 §6). Czytane w calosci takze
  zaleznosci wprost wolane przez `createQualifier`: `map/road-movement.ts` (84), `game/livestock-unlock.ts` (175),
  `game/improvement-tech.ts` (181), `types/hex.ts` (140), `map/territory.ts` (145). Fragmentami: `game/terrain-improvements.ts`
  (484; linie 1-140 i 285-335), `game/okolica.ts` (815; `cityRangeForPopulation`, `hexKeysWithinRadius`),
  `map/territory-work.ts` (166; `isTerritoryHexOwnedBy`), `render/improvements.ts` (602; linie 1-47: typ `ImprovementKey` i tablica
  `IMPROVEMENTS`), `game/r-stawki-strojenie.ts` (`scaleImprovementWorkCost`). Kod web wypakowany `git archive edb8fb56 gra/src gra/data`
  do katalogu POZA repo (scratch sesji).
- Web URUCHOMIONY (Node 22.22.0, `--experimental-transform-types`): loader `m16-loader-hooks.mjs` + `m16-loader-register.mjs`
  (wzorzec M14). **Jedyny wyjatek od "zero stubow" (jawnie)**: `render/improvements.ts` importuje `three` (render 3D, brak w repo bez
  `npm install`); `improvement-build.ts` bierze z niego wylacznie typ `ImprovementKey` i tablice danych `IMPROVEMENTS`. Loader podaje
  w jego miejsce WERBATIM wycinek tego samego pliku (linie 20-47), bez zmiany znaku. Pozostaly graf (okolica, territory, livestock,
  improvement-tech, terrain-improvements, r-stawki-strojenie, types) laduje sie prawdziwy.
  Dzieki temu `improvement-build.ts` dziala w Node (P6-25 §8 zapisywal go jako "nie da sie zaladowac": 32 eksporty runtime).
- `gen-m16-vectors.mjs` wola prawdziwe funkcje weba na wejsciach z Mulberry32 o stalym ziarnie i zapisuje wejscia+wyjscia do
  `tests/p6_m16_vectors/{rules,qualifier,gallery}.json` (ostatni przebieg: `gen-m16-r1.log`).
- NIEZALEZNY weryfikator: `verify-m16-vectors.py` (Python `-I`, bez Node/TS/Rust) liczy semantyke OD NOWA z TEKSTU zrodel i
  `gra/data/*.json`; zbiory i tabele (sety kluczy, `SEKTOR_OF`, `TERRAIN_ALLOW`, `INCA_CIV_TYPES`, `TECH_CANONICAL`...) WYCIAGA regexem
  z tekstu zrodla, a nie z tabeli Rust. Dodatkowo sprawdza zgodnosc `ulepszenia-budowa.json` z tekstem zrodla. Wynik w
  `verify-m16-r1.log`: **R1: checks=132505 rozbieznosci=0; R2: checks=138335 rozbieznosci=0** (`verify-m16-r2.log`; +4 sprawdzenia tabeli `teksty` z TEKSTEM zrodla, +5826 sprawdzen `getQualifyingHexes` dla wszystkich kluczy; kontrola czulosci: celowo zepsuta kopia weryfikatora - `any` zamiast `all`
  w regule kombinacji, `owce` zamiast `bydlo` w `canAddFoodLayer`, `or` zamiast `and` - daje 3850 rozbieznosci z 132501 sprawdzen).
  Kotwice tekstowe zrodla (1569 linii; `hasBlockingDepositForFarm`: `verify-m16-vectors.py:55` asertuje sygnature, a `:56` regexem asertuje, ze CIALO to `{ return false;` - `re.search(r"hasBlockingDepositForFarm\(_hex: HexWithZloze\): boolean \{\s*return false;", S)`, wiec stala `False` w sprawdzeniu `deposit.blocking` jest zakotwiczona w tekscie zrodla; `STADNINA_HORSE_COST = 50`, `era < 3`,
  `?? 20`, `+ 1` pierscienia kandydatow, promienie fort 10 / posterunek 5).
- Rust: wektory porownywane wynikowo; liczby `f64` (koszt Pracy) BITOWO (`to_bits`); listy porownywane z zachowaniem KOLEJNOSCI
  tam, gdzie web zwraca tablice (`getQualifyingHexes`: kolejnosc zbioru kandydatow = kolejnosc wstawiania `Set`).

## 2. Tabela symboli (kazdy eksport i kazdy nieeksportowany symbol zakresu 50-1558)

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci. Wyjatek jawny: `PORTOWANY (cz.)` = port 1:1 calosci, ale wektor pokrywa tylko czesc galezi; niepokryte galezie sa wymienione w wierszu i w §7 NIE_ZMIERZONO (jedyny taki wiersz: `getForestBuildBlockReason`). DANE = stala/zbior przeniesiony do
`data/derived/ulepszenia-budowa.json` i zweryfikowany z TEKSTEM zrodla (`verify-m16-vectors.py`, sekcja `tab.*`) oraz zachowaniem
(wektory). NIE-DOTYCZY = uzasadnienie. RUNDA-2 = lista w §7.

### 2a. Eksporty runtime (32; 30 w zakresie M16, 2 nalezy do M15)

| Plik:linia (web) | Symbol | Status | Rust | Test (liczba wektorow) |
|---|---|---|---|---|
| improvement-build.ts:212 | `stripImprovementsWhenForestRemoved` | PORTOWANY | `strip_improvements_when_forest_removed` | `strip_improvements_when_forest_removed_matches_web` (200) |
| :255 | `isLegacyFarmOnForestLayer` | PORTOWANY | `is_legacy_farm_on_forest_layer` | `legacy_farm_layer_and_strip_match_web` (272 = 34 klucze x 8 nakladek) |
| :261 | `stripLegacyFarmOnForest` | PORTOWANY | `strip_legacy_farm_on_forest` | j.w. (1500) |
| :312 | `planLegacyFarmOnForestRemoval` | PORTOWANY | `plan_legacy_farm_on_forest_removal` | `plan_and_remove_legacy_farms_match_web` (380, w tym 80 ukierunkowanych na wpisy `placed` ze samymi farmami) |
| :347 | `removeLegacyFarmsOnForest` | PORTOWANY (rejestr `placed`, callbacki w kolejnosci, wariant bez callbacka) | `remove_legacy_farms_on_forest` | j.w. (380 x 2) |
| :387 | `isFarmBaseTerrain` | PORTOWANY | `is_farm_base_terrain` | `farm_and_owce_base_terrain_match_web` (64) |
| :414 | `isStadninaBlockedOnForest` | PORTOWANY (stale `false`) | `is_stadnina_blocked_on_forest` | `forest_blocking_and_hints_match_web` (264) |
| :474 | `isImprovementBlockedOnForest` | PORTOWANY | `is_improvement_blocked_on_forest` | j.w. (264) |
| :494 | `getImprovementForestBlockHint` | PORTOWANY (teksty UI w tabeli `teksty`) | `get_improvement_forest_block_hint` | j.w. (33) |
| :513 | `isOwceBaseTerrain` | PORTOWANY | `is_owce_base_terrain` | `farm_and_owce_base_terrain_match_web` (64) |
| :519 | `FOOD_LAYER_KEYS` | DANE (`zywnosc.warstwy`) | `is_food_layer_key` | `mine_keys_tarasy_civ_and_food_keys_match_web` + `can_add_food_layer_matches_web` |
| :575 | `improvementsReplacedByBuild` | PORTOWANY | `improvements_replaced_by_build` | `replaced_by_build_and_impact_match_web` (3825) |
| :617 | `computeImprovementBuildImpact` | PORTOWANY (sygnatura: teren+nakladka zamiast obiektu `hex`) | `compute_improvement_build_impact` | j.w. (7950, w tym > 500 `null` i > 500 niepustych) |
| :662 | `formatImprovementBuildImpactList` | PORTOWANY (tekst UI `teksty`) | `format_improvement_build_impact_list` | `format_impact_list_matches_web` (200) |
| :709 | `MINE_IMPROVEMENT_KEYS` | DANE (`kopalnie`) | `is_mine_improvement_key` | `mine_keys_tarasy_civ_and_food_keys_match_web` |
| :717 | `isMineImprovementKey` | PORTOWANY | `is_mine_improvement_key` | j.w. (35) |
| :725 | `isImprovementVisibleInBuildPanel` | PORTOWANY (logika widocznosci; panel UI = NIE-DOTYCZY) | `is_improvement_visible_in_build_panel` | `livestock_dependency_matches_web` (4752) |
| :735 | `isTarasyCiv` | PORTOWANY | `is_tarasy_civ` | `mine_keys_tarasy_civ_and_food_keys_match_web` (23, w tym spacje NBSP / BOM) |
| :743 | `hasBlockingDepositForFarm` | PORTOWANY (stale `false`; patrz §5) | `has_blocking_deposit_for_farm` | `deposit_rules_match_web` (600), `p6_m16_divergence` |
| :757 | `hexHasClayDeposit` | PORTOWANY | `hex_has_clay_deposit` | `deposit_rules_match_web` (600) |
| :763 | `hexHasDepositReserve` | PORTOWANY | `hex_has_deposit_reserve` | j.w. (600) |
| :770 | `depositAllowsPlayerImprovement` | PORTOWANY | `deposit_allows_player_improvement` | j.w. (2640) |
| :808 | `canAddFoodLayer` | PORTOWANY | `can_add_food_layer` | `can_add_food_layer_matches_web` (4576, w tym wszystkie 64 podzbiory 6 warstw x 9 kluczy) |
| :912 | `hasAnimalDeposit` | PORTOWANY (zbior w `nakladki_zwierzece`) | `has_animal_deposit` | `deposit_rules_match_web` (8) |
| :1169 | `buildImprovementQualifier` | PORTOWANY | `build_improvement_qualifier` -> `Qualifier::qualifies` | `qualifier_bits_match_web_for_every_key_and_hex` (320 stanow x 33 klucze x heksy = 869286 bitow, 177743 prawdziwych) |
| :1181 | `galleryTerrainEligible` | PORTOWANY (czysta regula terenu; galeria 3D jako UI = brak) | `gallery_terrain_eligible` | `gallery_terrain_eligible_matches_web` (264) |
| :1252 | `galleryComboEligible` | PORTOWANY | `gallery_combo_eligible` | `gallery_combo_eligible_and_show_model_match_web` (3000) |
| :1276 | `galleryComboShowModel` | PORTOWANY | `gallery_combo_show_model` | j.w. (6000) |
| :1367 | `getForestBuildBlockReason` | PORTOWANY (cz.): port 1:1 wszystkich 8 galezi, wektor pokrywa 6 z 8 (brak `TartakWrongTerrainSome` `:1389` i `Generic` `:1404` - w webie nieosiagalne, §3 pkt 6, §7 NIE_ZMIERZONO); zwraca wariant `ForestBlockReason` zamiast tekstu PL; mapowanie tekst->wariant w generatorze z TEKSTU zrodla | `get_forest_build_block_reason` | `forest_build_block_reason_matches_web` (640; 6 z 8 wariantow w wektorach, patrz §3 pkt 6) |
| :1415 | `createImprovementBuildApi` | PORTOWANY (`getWorkCost`, `canBuild`, `getQualifyingHexes`, `createBuildRequest`, `handleHexClick`; `listTypes` = RUNDA-2) | `create_improvement_build_api` -> `ImprovementBuildApi` | `api_qualifying_hexes_and_work_cost_match_web` (R2: 10560 list kandydatow = 320 stanow x 33 klucze - KAZDY klucz w KAZDYM stanie, w R1 losowy podzbior 4734; 12800 zapytan `createBuildRequest`/`canBuild`), `api_hex_click_and_on_select_match_web` (16724 klikow) |
| :1560 | `collectRoadKeys` | NIE-DOTYCZY M16 (zakres M15: `improvement-build.ts`:1559-1569) | - | - |
| :1569 | `isRoadImprovementKey` (re-eksport z `road-movement.ts`) | NIE-DOTYCZY M16 (M15); lokalnie uzywane przez `hex_has_road` przez dane P6.3 `improvements::road_improvement_keys` | - | `hex_has_road_matches_web` (400) |

### 2b. Typy / interfejsy (9 eksportowanych + 4 lokalne)

| Plik:linia | Symbol | Status | Rust |
|---|---|---|---|
| :48 | `HexWithZloze` | PORTOWANY (projekcja pol czytanych) | `BuildHex` |
| :50 | `ImprovementBuildState` | PORTOWANY; pole `playerOwnerId` (`string\|null`) NIE jest czytane w pliku (zero odwolan, `grep -n playerOwnerId\b` = tylko deklaracja) - pominiete | `ImprovementBuildState` |
| :110 | `ImprovementTypeInfo` | RUNDA-2 (wynik `listTypes`) | - |
| :122 | `ImprovementBuildRequest` | PORTOWANY (`type: 'buildImprovement'` jest stala - pominieta) | `ImprovementBuildRequest` |
| :133 | `ImprovementBuildCallbacks` | PORTOWANY jako metody struktury | `ImprovementBuildApi` |
| :148 | `ImprovementBuildModeOptions` | PORTOWANY jako argumenty `active_key` i `on_select` | `create_improvement_build_api(.., active_key)`, `handle_hex_click(.., on_select)` |
| :276 | `LegacyFarmHexView` | PORTOWANY | `LegacyFarmHexView` |
| :283 | `LegacyFarmOnForestChange` | PORTOWANY | `LegacyFarmOnForestChange` |
| :297 | `LegacyFarmOnForestReport` | PORTOWANY | `LegacyFarmOnForestReport` |
| :567 | `ImprovementBuildImpact` | PORTOWANY | `ImprovementBuildImpact` |
| :673 | `TerenSet` | NIE-DOTYCZY (alias typu) | `Vec<TerrainType>` |
| :898 | `JsonImprovement` | NIE-DOTYCZY (alias typu wiersza JSON; Rust uzywa `CatalogRow`) | - |
| :1298 | `ForestBuildKey` | PORTOWANY | `ForestBuildKey` |
| :1300 | `ForestPlacementScan` | PORTOWANY | `ForestPlacementScan` |

### 2c. Symbole nieeksportowane (stale, helpery, wnetrze `createQualifier` i `createImprovementBuildApi`)

| Plik:linia | Symbol | Status | Rust / dowod |
|---|---|---|---|
| :163 | `TERENY_LADU` | DANE (`teren.ladu`) | `Tables.teren_ladu`; tab.teren.ladu vs tekst zrodla |
| :169 | `TARTAK_TERENY` | DANE (`teren.tartak`) | j.w. |
| :206 | `FOREST_DEPENDENT_IMPROVEMENT_KEYS` | DANE (`las.zaleznosc`) | j.w. |
| :363, :364 | `FLAT_FARM`, `FLAT_IRR` | DANE (`teren.farma_plaski`, `teren.irygacja`) | j.w. |
| :441 | `FOREST_COEXIST_IMPROVEMENT_KEYS` | DANE (`las.wspolistnieje`) | j.w. |
| :450 | `FOREST_BLOCKED_IMPROVEMENT_KEYS` | DANE (`las.zablokowane`) | j.w. |
| :523 | `SOLO_FOOD_KEYS` | DANE (`zywnosc.solo`) | j.w. |
| :530 | `SEKTOR_OF` | DANE (`sektory.przypisanie`) | j.w. |
| :565 | `EXCLUSIVE_SEKTORY` | DANE (`sektory.wykluczajace`) | j.w. |
| :675 | `TERRAIN_ALLOW` | DANE (`teren_dozwolony`; `null` = bez ograniczenia) | j.w. |
| :905 | `NAKLADKI_ZWIERZECZE` | DANE (`nakladki_zwierzece`) | j.w. |
| :604 | `existingAfterSimulatedRemoval` | PORTOWANY | `existing_after_simulated_removal` (przez `impact`) |
| :750 | `hexHasRudaDeposit` | NIE-DOTYCZY (martwy kod: `grep -rn hexHasRudaDeposit gra/src` = tylko definicja) | - |
| :840 | `keysOnPlacedHex` | PORTOWANY | `keys_on_placed_hex` (przez qualifier: `placedImprovements` jako string i tablica) |
| :845 | `getHexLayers` | PORTOWANY | `Qualifier::hex_layers` |
| :861 | `isFoodKey` | PORTOWANY | `is_food_layer_key` |
| :865 | `buildPlacedImprovementsMap` | PORTOWANY (ograniczony do zapytanego klucza - wynik mapy zalezy tylko od wpisu tego klucza; galaz zapasowa `ulepszenie` gdy `ulepszenia` nie normalizuje sie do niczego zachowana) | `Qualifier::hex_layers` |
| :882 | `hexNeighbors` | PORTOWANY (kolejnosc 1:1) | `hex_neighbors` |
| :890 | `buildRiverHexSet` | PORTOWANY | `Qualifier::new` |
| :900 | `readWorkCost` | PORTOWANY | `read_work_cost` (przez `getWorkCost` dla kluczy bez wiersza: `xyz`, `pastwisko`, `pole_irygowane`, `''`) |
| :916 | `hexZloze` | NIE-DOTYCZY (trywialny accessor `hex?.zloze`) | pole `BuildHex.zloze` |
| :920-1166 | `createQualifier` + `inPlayerTerritory`, `isRoadQualified`, `isRiverAdjacent`, `qualifies` | PORTOWANY | `Qualifier` (`in_player_territory`, `is_road_qualified`, `is_river_adjacent`, `qualifies`) |
| :1315 | `scanForestPlacement` | PORTOWANY | `scan_forest_placement` (przez powody blokady) |
| :1435 | `candidateHexKeys` (D13 perf) | PORTOWANY | `create_improvement_build_api` -> `candidate_hex_keys()` (kolejnosc wstawiania; pierscien +1 z tabeli) |
| :1453-1471 | `getWorkCost`, `canBuild`, `getQualifyingHexes` | PORTOWANY | metody `ImprovementBuildApi` |
| :1473-1501 | `listTypes` | RUNDA-2 (§7) | - |
| :1503-1544 | `createBuildRequest`, `handleHexClick` | PORTOWANY | metody `ImprovementBuildApi` (bramka tech wg `improvement-tech.ts`) |

### 2d. Zaleznosci spoza zakresu M16 portowane LOKALNIE (najmniejszy zakres wymagany przez `createQualifier`; wlasciciel docelowy)

Kazda ma wektory z uruchomionego weba i zostaje w `improvement_build.rs` do czasu przejecia przez wlasciciela (re-export).

| Web | Rust | Wlasciciel docelowy | Test |
|---|---|---|---|
| `livestock-unlock.ts`: `isIncaCiv`, `isNewWorldCiv`, `livestockKeyFromImprovement`, `isLivestockAllowed`, `isLivestockUnlockedForPlacement` (+ `STADNINA_HORSE_COST` w tabeli) | `is_inca_civ`, `is_new_world_civ`, `livestock_key_from_improvement`, `is_livestock_allowed`, `is_livestock_unlocked_for_placement` | P6.17 | `livestock_dependency_matches_web` (16 civ x 9 era x 33 klucze) |
| `improvement-tech.ts`: `getImprovementMeta` (bez `epoka`/`clearing`), `isImprovementTechUnlocked`, `normalizeTech`, `requiredTechIds`, `TECH_CANONICAL`, `IMPROVEMENT_MULTI_TECH_REQ` | `get_improvement_meta`, `is_improvement_tech_unlocked` | P6.17 | `improvement_meta_and_tech_gate_match_web` (34 + 1428) |
| `okolica.ts`: `hexKeysWithinRadius` | `hex_keys_within_radius` | P6.8 | `hex_keys_within_radius_matches_web` (300) |
| `road-movement.ts`: `hexHasRoad` | `hex_has_road` (dane P6.3 `road_improvement_keys`) | M15 | `hex_has_road_matches_web` (400) |
| `territory.ts` (M14): `isInTerritory`, `territoryOwnerAt`, `isPlayerTerritoryHex`, `cityTerritoryRadius`, `axialDistance`; `territory-work.ts`: `isTerritoryHexOwnedBy` | reuzywane z `territory.rs` / `terrain.rs` (DANE-JUZ-W-RUST, M14/P6.3) | M14 | przez `qualifier_bits_match_web_for_every_key_and_hex` |
| `terrain-improvements.ts`: `normalizeImprovementKey`, `improvementKeysForHex`, `improvementDisplayName`, `scaleTerrainImprovementWorkCost` | reuzywane z `improvements.rs` (DANE-JUZ-W-RUST, P6.3) | P6.3 | `work_cost_scale_matches_web` (8 x 5 epok) + przez qualifier |

## 3. Swiadome decyzje i ograniczenia

1. **Klucze ulepszen to tekst**, nie enum `improvements::ImprovementKey`: web ma w unii `pastwisko` i `pole_irygowane`, ktorych
   enum Rust nie zawiera, a `SEKTOR_OF` je wymienia. Kody terenu to wartosci webowe (`TerenBazowy`), mapowane na
   `improvements::TerrainType` przez `terrain_from_web_value` (jak `Overlay::from_web_value`).
2. **Brak literalow danych/mnozników w kodzie.** Zbiory terenow, bramki lasu, warstwy zywnosci, sektory, `TERRAIN_ALLOW`, kopalnie,
   nakladki zwierzece, cywilizacje (Inkowie / tarasy), `STADNINA_HORSE_COST` (50), `era < 3`, domyslne (`?? 20`, `playerEra 1`,
   `playerOwnerIdNum 0`, pierscien kandydatow `+ 1`), teksty UI: `data/derived/ulepszenia-budowa.json`. W kodzie zostaja identyfikatory
   domeny (klucze ulepszen, kody zloz, kody terenu - jak warianty enumow) i liczby strukturalne 0/1 (`grep-literals-r1.txt`;
   test `improvement_build_has_no_balance_number_literals` pilnuje, ze w kodzie nie ma innych liczb niz 0 i 1).
   Nie edytowano `bridge.rs`, `Cargo.toml`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`, `gra/**`.
3. **Zbiory JS z kolejnoscia**: `placedKeys`, `roadKeys`, `pendingUndoKeys`, `ownUnitHexKeys` (iterowane przy budowie zbioru
   kandydatow `candidateHexKeys`) to `Vec` o unikalnych elementach w kolejnosci wstawiania; `getQualifyingHexes` zwraca liste w tej
   kolejnosci i test porownuje ja 1:1.
4. **Klucz heksa vs `coords` (Z9 z M14)**: `BuildMap` indeksuje po `"q,r"` zbudowanym z `coords`; web w `getQualifyingHexes`
   czyta `hex.coords`, a w `qualifies` klucz `"q,r"` - rozjazd klucza i `coords` nie jest modelowany (NIE_ZMIERZONO wektorem;
   wniosek z lektury kodu).
5. **Wejscie poza domena**: nazwy wlasciwosci `Object.prototype` (`constructor`, `toString`, ...) jako klucz ulepszenia. Web
   rzuca `TypeError` w `IMPROVEMENT_MULTI_TECH_REQ[key].every` albo zwraca funkcje z `livestockKeyFromImprovement`
   (`k in IMPROVEMENT_UNLOCKS_LIVESTOCK`). Typ `ImprovementKey` to unia stringow, wiec to nie jest wejscie gry; nieobslugiwane,
   NIE_ZMIERZONO.
6. **Martwe galezie weba (dowod logiczny, nie wektorem)**: w `getForestBuildBlockReason` powody `TartakWrongTerrainSome`
   (`:1389`) i `Generic` (`:1404`) sa nieosiagalne: gdy `qualifyingInPlayerTerritory == 0`, kazdy las w terytorium gracza jest
   albo "zly teren" (tartak: wiec `wrong >= lasIn`), albo "w trakcie wycinki" (wyrab: wiec `cleared >= lasIn`). Port zachowuje
   obie galezie 1:1, ale wektory ich nie pokrywaja (6 z 8 wariantow w wektorach: `NoCity`, `AllBeingCleared`,
   `TartakWrongTerrainAll`, `EnemyTerritory`, `OutsideReach`, `NoForestInTerritory`, plus `null`).
7. **Hodowla i era**: `playerEra` jest `f64` (web `number`); `era < 3` na wartosciach ulamkowych (2.5) i `0` pokryte wektorami.
   NaN/Infinity w stanie nie wystepuja w grze i nie sa w wektorach.
8. **`handleHexClick`**: istnieje tylko gdy `activeKey` ustawiony (`has_hex_click_handler`); `onSelect` to `Option<&mut dyn FnMut>`
   przekazywany do `handle_hex_click`. Wektory licza wywolania `onSelect` per klik (0/1).
9. **`getImprovementForestBlockHint` / `formatImprovementBuildImpactList`**: teksty UI sa w tabeli `teksty` (edytowalne);
   test porownuje je z tekstami weba.

## 4. Odstepstwa sygnatur od weba (kompletna lista; zmiany tylko po stronie wejscia, logika 1:1)

| Web | Rust | Powod |
|---|---|---|
| `computeImprovementBuildImpact(key, hex: {terenBazowy, nakladka}, existing)` | `(key, teren, nakladka, existing)` | web czyta tylko dwa pola `hex` |
| `buildImprovementQualifier(state)` zwraca funkcje `(key,q,r)=>boolean` | zwraca `Qualifier` z metoda `qualifies(key,q,r)` | domkniecie -> struktura |
| `createImprovementBuildApi(state, mode)` zwraca obiekt callbackow | zwraca `ImprovementBuildApi` (metody); `mode.activeKey` -> argument `active_key`, `mode.onSelect` -> argument `handle_hex_click` | brak domkniec w Rust |
| `getForestBuildBlockReason` zwraca `string \| null` | `Option<ForestBlockReason>` | tekst PL = UI; wariant odpowiada kolejnosci `return` w zrodle |
| `removeLegacyFarmsOnForest(hexes: Record, placed: Map, onHexChanged?)` | `(&[(String, Option<LegacyFarmHexView>)], &mut BTreeMap, Option<&mut dyn FnMut>)` | `Record` iterowany w kolejnosci wstawiania (klucze `"q,r"` nie sa indeksami calkowitymi) |
| `hexKeysWithinRadius(cq, cr, rad, map: GameMap)` | `(cq, cr, rad, &BuildMap)` | `GameMap` poza zakresem (Z2 z P6-25) |
| `isImprovementVisibleInBuildPanel(key, civ, era = 1)` | `(key, Option<&str>, Option<f64>)`, domyslna era z tabeli | brak domyslnych argumentow |
| `ImprovementBuildState.map: GameMap` | `BuildMap` (heksy + `riverPaths`) | projekcja pol czytanych |
| `Map<string,...>` / `Set<string>` | `BTreeMap` / `BTreeSet` albo `Vec` o unikalnych elementach (gdy kolejnosc ma znaczenie) | patrz §3 pkt 3 |

## 5. Rozbieznosc regul web <-> `improvements.rs` (P6-25 §2 pkt 9) - WYNIK M16

P6-25 zapisal: `hasBlockingDepositForFarm` zwraca w webie zawsze `false`, a Rust `deposit_gate` blokuje `Farm` gdy
`tile.deposit.is_some()`. Co M16 **zmierzyl** (wektor z uruchomionego weba, `p6_m16_divergence`): web kwalifikuje farme /
irygacje / tarasy na heksie ze zlozem (heksy ze `zloze` lub nakladka zlozowa, na ktorych web zwraca `true` dla kazdego z trzech
kluczy, a `has_blocking_deposit_for_farm == false`). Wektor dowodzi WYLACZNIE zachowania weba, nie tego, ze to kanon.
Co M16 **odczytal ze zrodla**: web deklaruje to jako zamierzone - komentarz `improvement-build.ts:744-746` "WOLNE WSPOLISTNIENIE
(Maciej 2026-07-09): zloza (ruda/kon/sol/glina) NIE blokuja farmy/irygacji/tarasow - wspolistnieja (surowiec = bok 1, pole = bok 2)";
funkcja zostala jako stale `false` (nie usunieta). Ktora implementacja jest KANONEM dla portu (web czy `improvements.rs:281`
`Farm | Irrigation | Terraces => tile.deposit.is_none()`) - **decyzja orkiestratora** (P6-25 §2 pkt 9 zostawia ja jemu); M16 jej NIE
rozstrzyga. M16 NIE edytuje `improvements.rs` (poza allowlista; P6.8/P6.17 maja ten plik), a reguly weba sa dostepne jako
`improvement_build::Qualifier`. Zmierzony fakt: `improvements.rs:281` jest NIEZGODNE z webem.

Inne rozbieznosci znalezione przy czytaniu `improvements.rs` (NIE pinowane testem strony Rust - to bylyby piny cudzego kodu;
do decyzji orkiestratora, ktora z dwoch implementacji jest kanonem przy zasilaniu komend):

1. `improvements.rs:247-249` (`LumberMill | HuntingCamp`: tylko Laka/Rownina/Wzgorza/Pustynia) vs web `oboz_lowiecki`: brak osobnego
   warunku terenu, tylko `Las` + wlasne terytorium + istniejacy tartak (`:1121-1124`).
2. `improvements.rs:251-254` (`Clearing`: tylko Laka/Rownina/Wzgorza) vs web `wyrab`: brak warunku terenu, tylko `Las` + terytorium
   + brak trwajacej wycinki (`:1097-1102`).
3. `improvements.rs:264-274` (`forest_gate`: `Farm | Irrigation | Cattle | Terraces`) vs web `FOREST_BLOCKED` (`:450`): dodatkowo `owce`
   (w webie `owce` na Wzgorzu z lasem jest zablokowana; Rust dopuszcza `Sheep` na lesie).
4. Rust `qualifies` jest czysta funkcja kafla (bez terytorium, wlasnosci, jednostki budowniczego, bramek tech/cywilizacji/epoki,
   zbiorow sektorow `computeImprovementBuildImpact`); web `qualifies` je zawiera. Roznica projektowa, nie blad.

## 6. Testy: bylo / jest

| | przed (`faca762c`) | po |
|---|---|---|
| liczba testow `cargo test` | 674 | 702 (0 czerwonych) |
| nowe pliki testow | - | `p6_m16_rules.rs` (15), `p6_m16_qualifier.rs` (4), `p6_m16_gallery.rs` (2), `p6_m16_tables.rs` (5), `p6_m16_divergence.rs` (1), `p6_m16_doc.rs` (1) = 28 |
| zmienione testy istniejace | - | 0 (zadnego nie edytowano ani nie oslabiono; `tests/p6_m00_skeleton.rs` nietkniety, przechodzi) |

Gate (surowe, PELNE logi z `EXIT=`; R2 = pliki `gate-*-r2.log`, wyniki w `02-operator-obrona-r2.md`): `gate-fmt-r1.log` (`cargo fmt --check`, EXIT=0), `gate-clippy-r1.log`
(`cargo clippy --all-targets -- -D warnings`, EXIT=0), `gate-test-r1.log` (`cargo test --no-fail-fast`, EXIT=0, 702 passed / 0 failed).
`git diff --check`: czysty (komenda i wynik w `gate-diff-check-r1.log`).

Mutacje (`mutate-m16.py`, uruchamiane na kopii silnika poza repo; wynik w `mutation-evidence-r1.txt`): 50 mutacji zdefiniowanych, z czego **2 odrzucone PO FAKCIE jako rownowazne i usuniete z listy** (`api: candidate undo idx` oraz `case 'lama' teren`; `mutation-evidence-r1.txt`, "Uwaga 2"): liczba 48 to lista PO usunieciu, nie wszystkie zdefiniowane. Z 48 (40 w kodzie `improvement_build.rs`, 8 w tabeli JSON) **47 wykrytych testem czerwonym, 1 rownowazna** (`gallery: combo bydlo+owce` - regula bydlo+owce bez farmy w `galleryComboEligible` jest nadmiarowa, bo tereny bydla i owiec sa rozlaczne). Usuniete: (a) `idx > 0 -> idx >= 0` - kompozyt zaczynajacy sie od `:` daje pusty klucz kandydata, ktory nie jest kluczem zadnego heksa; (b) `teren !== Pustynia` w `case 'lama'` - warunek nadmiarowy, bo Pustynia nie nalezy do `TERRAIN_ALLOW.lama`. Ocena rownowaznosci to decyzja Operatora, nie wynik automatu - Evaluator moze ja podwazyc. R2: zmiana `qualifier.json` jest WYLACZNIE addytywna (stare `qualifying` jest podzbiorem nowych, reszta pliku identyczna - sprawdzone skryptem; `rules.json` i `gallery.json` bajt-w-bajt jak w R1), wiec wykrywalnosc mutacji z R1 nie maleje; pelnego przebiegu mutacji w R2 nie powtarzano. W przebiegu wstepnym przezyla `remove: placed.remove` (luka w wektorach: brak wpisow `placed` ze samymi farmami) - dodano 80 ukierunkowanych przypadkow do generatora i powtorzono caly przebieg na wektorach koncowych.

Wektory z kontrolami istotnosci (liczniki "niepustych" wynikow w kazdym tescie, np. > 100 000 prawdziwych bitow kwalifikacji, `getQualifyingHexes` porownane dla KAZDEGO klucza w KAZDYM stanie (`checked == stany x klucze`),
kazdy klucz z unii `ImprovementKey` bywa prawdziwy, > 500 `null` i > 500 niepustych skutkow budowy).

## 7. RUNDA-2 i NIE_ZMIERZONO (jawna lista)

RUNDA-2 (z uzasadnieniem):
- `listTypes` (`:1473-1501`) i `ImprovementTypeInfo` (`:110`): wynik zawiera `lockHint` zalezny od `getImprovementLockHint`
  (`improvement-tech.ts`: teksty PL, etykiety epok, `clearing`) - to P6.17 + UI. Skladniki logiczne `listTypes` (filtr
  widocznosci panelu, `techUnlocked && canPlaceAny`, koszt Pracy, powod blokady lasu) sa juz portowane osobno i pokryte
  (`is_improvement_visible_in_build_panel`, `is_improvement_tech_unlocked`, `get_qualifying_hexes`, `get_work_cost`,
  `get_forest_build_block_reason`); brakuje tylko skladania w jedna liste z tekstem `lockHint`.
- Literaly UI spoza tabeli `teksty` (swiadomie - naleza do niezportowanego `listTypes`): `'Brak heksów w twoim terytorium'` (`:1486`) i fallback `?? 'Brak lasu w twoim terytorium'` (`:1485`; wartosc rowna tekstowi galezi `Generic`, `:1404`) - przejmie je port `listTypes` razem z P6.17. Kryterium podzialu lokalnych portow z `improvement-tech.ts`: czy funkcja jest wolana przez cos innego niz `listTypes`. `getImprovementMeta` (`:1454`, `:1511`, `:1528`) i `isImprovementTechUnlocked` (`:1509`) sa wolane przez `getWorkCost`/`createBuildRequest`/`handleHexClick` - portowane lokalnie; `getImprovementLockHint` jest wolane WYLACZNIE z `listTypes` (`:1498`) - zostaje RUNDA-2 razem z `listTypes`.
- `improvement-tech.ts`: `getImprovementLockHint`, `clearing`/`freshClearingState`/`tickHexClearing`, `terrainUnlockLabelsForTech` (P6.17).
- `livestock-unlock.ts`: `computeEmpireLivestockUnlocks`, `hexHasLivestockDeposit`, `improvementMatchesLivestockDeposit`,
  `isLamaDepositVisibleForCiv` (P6.17; nie sa wolane przez `improvement-build.ts`).

Tabela `teksty` (zarzut 6): R2 dodaje do weryfikatora 4 sprawdzenia, ze kazdy tekst z tabeli wystepuje doslownie w kodzie weba (`tab.teksty.*`, `verify-m16-r2.log`), niezaleznie od wektorow.

NIE_ZMIERZONO: rozjazd klucza heksa i `coords` (§3 pkt 4); klucze z `Object.prototype` (§3 pkt 5); NaN/Infinity w stanie (§3 pkt 7);
dwa nieosiagalne powody blokady lasu `TartakWrongTerrainSome`/`Generic` (§3 pkt 6; wiersz `getForestBuildBlockReason` w §2a = `PORTOWANY (cz.)`); zachowanie `improvements.rs` po stronie Rust w §5 (odczyt kodu, bez testu).

## 8. Artefakty runu

`gen-m16-vectors.mjs` (R2: `qualifying` dla wszystkich kluczy), `gen-m16-r2.log`, `verify-m16-r2.log`, gate `*-r2.log`, `02-operator-obrona-r2.md`, `m16-loader-hooks.mjs`, `m16-loader-register.mjs`, `verify-m16-vectors.py`, `verify-m16-r1.log`,
`gen-m16-r1.log`, `mutate-m16.py`, `mutation-evidence-r1.txt`, `grep-literals-r1.txt`, `gate-fmt-r1.log`, `gate-clippy-r1.log`,
`gate-test-r1.log`, `gate-diff-check-r1.log`, `01-operator-r1.md`.
