# P6.M14 - Terytorium, zasieg, rozmieszczenie cudow (port `gra/src/map/` do Rust)

Temat: `R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1` - DOMAIN: GAME - RUNDA 1/5 (Operator).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `1570419b` (595 testow).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1/`.

## 1. Metoda (anty-halucynacja)

- Zrodla web przeczytane w CALOSCI (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo):
  `range-hexes.ts` 115 linii, `territory-work.ts` 166, `territory.ts` 145, `wonder-placement.ts` 119
  (razem 545; liczby potwierdzone `wc -l` i kotwica w `verify-m14-vectors.py`). Czytane tez zalezne:
  `game/okolica.ts` (`cityRangeForPopulation`, `citySightRadius`), `game/culture-religion.ts`
  (`cityBorderRadius`, `dominantReligion`, `finiteOr`), `units/setup.ts:678` (`isWaterTerrain`).
- Web URUCHOMIONY: `m14-loader-hooks.mjs` + `m14-loader-register.mjs` (wzorzec P6.1C, ZERO stubow:
  caly graf importow laduje sie pod Node 22.22.0 `--experimental-transform-types`).
  `gen-m14-vectors.mjs` wola prawdziwe funkcje weba i zapisuje wejscia+wyjscia do
  `rust-port/engine/tests/p6_m14_vectors/{territory,work,range,wonder}.json` (losowe wejscia z Mulberry32 o stalym
  ziarnie; NaN/Infinity/-0 jako stringi). Ostatni przebieg: `gen-m14-r1.log`.
- NIEZALEZNY weryfikator: `verify-m14-vectors.py` (Python `-I`, bez Node/TS/Rust) liczy semantyke od nowa z TEKSTU
  zrodel + `gra/data/*.json` i porownuje z wyjsciem weba: `checks=5436 rozbieznosci=0` (`verify-m14-r1.log`).
  Zawiera kotwice tekstowe zrodel (stale 10/5, `dist < bestDist`, `playerOwnerId = 0`, kolejnosc warunkow
  `isReczneKeyLegal`, sortowanie cudow itd.).
- Rust: porownanie BITOWE f64 (`to_bits`; NaN==NaN), liczby specjalne zakodowane w wektorach.

## 2. Tabela symboli (kazdy eksport + nieeksportowane helpery)

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci.
`DANE-JUZ-W-RUST` = istnieje z P6.3 (`terrain.rs`); M14 NIE kopiuje, tylko reuzywa i dodaje wektor.

| Plik:linia (web) | Symbol | Status | Rust | Test |
|---|---|---|---|---|
| territory.ts:23 | `CityNode` | DANE-JUZ-W-RUST (P6.3) | `terrain::CityNode` (re-export w `territory.rs`) | `city_territory_radius_matches_web` |
| territory.ts:37 | `TerritoryNode` | PORTOWANY | `territory::TerritoryNode{node,owner_id}` | wszystkie `owner_at/work` |
| territory.ts:47 | `axialDistance` | PORTOWANY (+ DANE-JUZ-W-RUST dla wersji i32) | `territory::axial_distance_f64`, `terrain::axial_distance` | `axial_distance_matches_web_and_integer_variant` (200 wektorow) |
| territory.ts:57 | `cityRangeForPopulation` | DANE-JUZ-W-RUST (P6.3) + wektor M14 | `terrain::city_range_for_population` | `city_range_for_population_matches_web` (31) |
| territory.ts:57 | `CITY_RANGE_MIN`, `CITY_RANGE_CAP` | DANE-JUZ-W-RUST (`miasto-params.json`) | czytane w `city_range_for_population` | stale z weba == granice funkcji Rust |
| territory.ts:57 | `citySightRadius` | PORTOWANY z parametrem | `territory::city_sight_radius(.., border_radius)` | `city_sight_radius_matches_web` (414) |
| territory.ts:74 | `cityTerritoryRadius` | DANE-JUZ-W-RUST (P6.3) + wektor M14 | `terrain::city_territory_radius` | `city_territory_radius_matches_web` (160) |
| territory.ts:92 | `isInTerritory` | PORTOWANY | `territory::is_in_territory` | `is_in_territory_matches_web` (400) |
| territory.ts:106 | `territoryOwnerAt` | PORTOWANY | `territory::territory_owner_at` | `territory_owner_at_matches_web` (460 w tym 60 remisow) |
| territory.ts:133 | `isPlayerTerritoryHex` | PORTOWANY | `territory::is_player_territory_hex` | `is_player_territory_hex_matches_web` (400, obie galezie) |
| territory-work.ts:8 | `TerritoryNode` (re-export typu) | NIE-DOTYCZY (alias typu) | - | - |
| territory-work.ts:10 | `buildTerritoryNodesFromCities` | PORTOWANY | `build_territory_nodes_from_cities` | `build_territory_nodes_matches_web` (60) |
| territory-work.ts:26 | `isTerritoryHexOwnedBy` | PORTOWANY | `is_territory_hex_owned_by` | `is_territory_hex_owned_by_matches_web` (400) |
| territory-work.ts:37 | `makeTerritoryWorkableFilter` | PORTOWANY | `make_territory_workable_filter` (Box<dyn Fn>) | `workable_filter_matches_web` (120 x 40 zapytan) |
| territory-work.ts:55 | `cityCenterKeys` | PORTOWANY | `city_center_keys` | `city_center_keys_match_web` (40) |
| territory-work.ts:77 | `isReczneKeyLegal` | PORTOWANY | `is_reczne_key_legal` | `reczne_key_legal_matches_web` (1680) |
| territory-work.ts:106 | `reconcileWorkedTilesForOwner` | PORTOWANY | `reconcile_worked_tiles_for_owner` | `reconcile_for_owner_matches_web` (120, w tym `changed` i stan po) |
| territory-work.ts:156 | `reconcileAllWorkedTiles` | PORTOWANY | `reconcile_all_worked_tiles` | `reconcile_all_matches_web` (100) |
| range-hexes.ts:13 | `RangeCityInput` | PORTOWANY (struct) | `territory::RangeCityInput` | uzywany w testach range |
| range-hexes.ts:28 | `collectTerritoryHexKeysByOwner` | PORTOWANY | `collect_territory_hex_keys_by_owner` | `territory_keys_by_owner_match_web` (40) |
| range-hexes.ts:53 | `collectCultureRangeHexKeys` | PORTOWANY (+ `border_radius` od wywolujacego) | `collect_culture_range_hex_keys` | `culture_range_matches_web` (60) |
| range-hexes.ts:75 | `collectReligionRangeHexKeys` | PORTOWANY (+ `dominant_religion` od wywolujacego) | `collect_religion_range_hex_keys` | `religion_range_matches_web` (144, w tym klucze ulamkowe) |
| wonder-placement.ts:11 | `WonderPlacementCity` | PORTOWANY (struct) | `wonder_placement::WonderPlacementCity` | testy wonder |
| wonder-placement.ts:19 | `PickWonderHexInput` | PORTOWANY (struct, mapa jako lista `WonderMapHex`) | `PickWonderHexInput<'a>` | j.w. |
| wonder-placement.ts:36 | `isLandBuildable` (nieeksp.) | PORTOWANY | prywatna `is_land_buildable` | przez `list_for_city` |
| wonder-placement.ts:41 | `isOccupied` (nieeksp.) | PORTOWANY | prywatna `is_occupied` | przez `list_for_city` |
| wonder-placement.ts:30 | `hexAt` (nieeksp.) | NIE-DOTYCZY (martwy kod: zero wywolan w pliku) | - | - |
| wonder-placement.ts:53 | `listQualifyingWonderHexesForCity` | PORTOWANY | `list_qualifying_wonder_hexes_for_city` | `list_for_city_matches_web` (80, kolejnosc 1:1) |
| wonder-placement.ts:83 | `WonderMapPlacementInput` | PORTOWANY (struct) | `WonderMapPlacementInput<'a>` | testy wonder |
| wonder-placement.ts:93 | `listQualifyingWonderHexesForOwner` | PORTOWANY (dedup, kolejnosc pierwszego wystapienia) | `list_qualifying_wonder_hexes_for_owner` | `list_for_owner_matches_web` (80) |
| wonder-placement.ts:116 | `pickWonderHexForCity` | PORTOWANY | `pick_wonder_hex_for_city` | `pick_matches_web` (80) |

Podsumowanie: 22 eksporty runtime (9 + 7 + 3 + 3) i 8 typow/interfejsow/aliasow - wszystkie z jawnym statusem; RUNDA-2: brak
elementow z zakresu M14. Zaleznosci spoza M14 (NIE portowane tutaj, dostarcza wywolujacy - ZALOZENIE Z5):
`cityBorderRadius`, `dominantReligion` (`culture-religion.ts`, P6.16), `computeLostToNearerSiblingByCity` (`okolica.ts`, P6.8).
Testy podaja im WYNIKI prawdziwych funkcji weba z tabel w wektorach (`border`, `dominant`), nie reimplementacje.

## 3. Swiadome decyzje i ograniczenia

1. Wspolrzedne zapytan (`q`,`r`) to `impl Into<f64>`: web operuje na `number`, a klucze `"q,r"` heksow sa parsowane
   przez JS `Number()` (obsluzone: trim JS, pusty ciag = 0, `Infinity`, `0x/0o/0b`, notacja wykladnicza, nie-liczby = pomijane,
   `parts[1]` brakujace = NaN). Wezly (`CityNode`) maja `i32` jak reszta silnika (ulamkowe wspolrzedne WEZLOW nie wystepuja w grze).
2. `Map<number,Set<string>>` z weba -> `BTreeMap<i64,BTreeSet<String>>` (porzadek posortowany; testy porownuja jako zbiory).
   Kolejnosc ma znaczenie tylko w `listQualifying*` i jest odtworzona 1:1.
3. Mapa dla cudow: lista `WonderMapHex{coords,terrain}` (web czyta `hex.coords`, nie klucz). Wynik nie zalezy od kolejnosci wejscia.
4. `stateReligion?.trim() || null` odtworzone z `js_trim` (zbior znakow JS: m.in. U+FEFF tak, U+0085 nie - mutacja wykryta).
5. Brak liczb balansowych w kodzie: promienie fort/posterunek/miasto czytane przez istniejace `terrain.rs` z JSON
   (`terrain-improvements.json`, `miasto-params.json`); nowe pliki zawieraja tylko liczby strukturalne
   (zestaw znakow bialych JS, podstawy 2/8/16, `/ 2.0` formuly kostki, `dist == 0.0`) - `grep-literals-r1.txt`.
   Nie dodano nic do `data/derived.rs` ani `data/derived/*.json` (nie bylo stalych balansowych do wydzielenia).
6. `trade.rs` (P6.15) ma wlasna prywatna kopie `territory_owner_at`/`TerritoryNode{radius}`: nie ruszana (poza allowlista);
   P6.15 powinien po M14 przejsc na `territory::territory_owner_at` (regula identyczna, potwierdzona wektorem).

## 4. Testy: bylo / jest

| | przed (`1570419b`) | po |
|---|---|---|
| liczba testow `cargo test` | 595 | 618 (617 zielonych, 1 czerwony - patrz §5) |
| nowe pliki testow | - | `p6_m14_territory.rs` (8), `p6_m14_work.rs` (8), `p6_m14_range.rs` (3), `p6_m14_wonder.rs` (4) = 23 |
| zmienione testy istniejace | - | 0 (zadnego nie edytowano ani nie osłabiono) |

Gate (surowe pelne logi z `EXIT=`): `gate-fmt-r1.log` (EXIT=0), `gate-clippy-r1.log` (`--all-targets -D warnings`, EXIT=0),
`gate-test-r1.log` (`cargo test --no-fail-fast`, EXIT=101 wylacznie przez §5).

Mutacje (`mutate-m14.py`, `mutation-evidence-r1.txt` + `mutation-evidence-r1b.txt`): 23 mutanty, 22 wykryte; 1 przezyl
i jest rownowazny (`owned_by: brak fail-closed` - dla pustej listy `territoryOwnerAt` zwraca `null`, a `null !== ownerId`
daje te sama odpowiedz `false`). Mutant `bez floor szerzenia` przezyl w pierwszym przebiegu (wektory mialy tylko
klucze calkowite), dodano wektory z kluczami ulamkowymi i mutant jest teraz wykrywany.

## 5. Blokada poza allowlista (do decyzji orkiestratora przy integracji)

`rust-port/engine/tests/p6_m00_skeleton.rs::files_exist_and_are_empty_doc_only` wymaga, by KAZDA linia `territory.rs` i
`wonder_placement.rs` byla komentarzem `//!` ("szkielet ma byc pusty"). To zalozenie z M00 jest sprzeczne z celem
kazdego tematu M* (wypelnienie plikow) i padnie przy KAZDYM temacie, ktory wypelnia plik szkieletu. Plik testu jest poza
allowlista M14 (`tests/p6_m14_*.rs`), wiec NIE zostal zmieniony. Pozostale testy M00 sa zielone (naglowek
`Temat wlasciciel:` zachowany w obu plikach). Zalecenie: orkiestrator przy integracji (albo osobny drobny temat)
zluzuje ten jeden test, np. pomijajac pliki z kodem po tym, jak ich wlasciciel dostarczy wynik.
