# P6.M14 - Terytorium, zasieg, rozmieszczenie cudow (port `gra/src/map/` do Rust)

Temat: `R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1` - DOMAIN: GAME - RUNDA 2/5 (Operator, obrona zarzutow Evaluatora r1).
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
| range-hexes.ts:13 | `RangeCityInput` | PORTOWANY (struct) | `territory::RangeCityInput` | `range_cities` buduje `RangeCityInput` z pol wektora (`tests/p6_m14_range.rs:22-26`); wyniki `culture_range_matches_web`/`religion_range_matches_web` zalezą od wszystkich pol struct |
| range-hexes.ts:28 | `collectTerritoryHexKeysByOwner` | PORTOWANY | `collect_territory_hex_keys_by_owner` | `territory_keys_by_owner_match_web` (40) |
| range-hexes.ts:53 | `collectCultureRangeHexKeys` | PORTOWANY (+ `border_radius` od wywolujacego) | `collect_culture_range_hex_keys` | `culture_range_matches_web` (60) |
| range-hexes.ts:75 | `collectReligionRangeHexKeys` | PORTOWANY (+ `dominant_religion` od wywolujacego) | `collect_religion_range_hex_keys` | `religion_range_matches_web` (144, w tym klucze ulamkowe) |
| wonder-placement.ts:11 | `WonderPlacementCity` | PORTOWANY (struct) | `wonder_placement::WonderPlacementCity` | testy wonder |
| wonder-placement.ts:19 | `PickWonderHexInput` | PORTOWANY (struct, mapa jako lista `WonderMapHex`) | `PickWonderHexInput<'a>` | j.w. |
| wonder-placement.ts:32 | `isLandBuildable` (nieeksp.) | PORTOWANY | prywatna `is_land_buildable` | przez `list_for_city` |
| wonder-placement.ts:37 | `isOccupied` (nieeksp.) | PORTOWANY | prywatna `is_occupied` | przez `list_for_city` |
| wonder-placement.ts:28 | `hexAt` (nieeksp.) | NIE-DOTYCZY (martwy kod: zero wywolan w pliku) | - | - |
| wonder-placement.ts:53 | `listQualifyingWonderHexesForCity` | PORTOWANY | `list_qualifying_wonder_hexes_for_city` | `list_for_city_matches_web` (80, kolejnosc 1:1) |
| wonder-placement.ts:83 | `WonderMapPlacementInput` | PORTOWANY (struct) | `WonderMapPlacementInput<'a>` | testy wonder |
| wonder-placement.ts:93 | `listQualifyingWonderHexesForOwner` | PORTOWANY (dedup, kolejnosc pierwszego wystapienia) | `list_qualifying_wonder_hexes_for_owner` | `list_for_owner_matches_web` (80) |
| wonder-placement.ts:116 | `pickWonderHexForCity` | PORTOWANY | `pick_wonder_hex_for_city` | `pick_matches_web` (80) |

Podsumowanie: 22 eksporty runtime (9 + 7 + 3 + 3) i 7 typow/interfejsow/aliasow weba z zakresu M14 (CityNode, TerritoryNode,
re-eksport TerritoryNode, RangeCityInput, WonderPlacementCity, PickWonderHexInput, WonderMapPlacementInput - tyle wierszy ma tabela)
- wszystkie z jawnym statusem; RUNDA-2: brak elementow z zakresu M14.

### 2a. Typy dodane po stronie Rust bez odpowiednika-eksportu w zakresie M14 (jawny status)

| Typ Rust | Pochodzenie | Status |
|---|---|---|
| `WorkCity` (`territory.rs`) | projekcja `City` (`gra/src/types`, poza M14, Z2) do pol uzywanych w `territory-work.ts` | NIE-DOTYCZY jako port typu (adapter wejscia); pola uzywane przez funkcje sa testowane wektorami `work.json` |
| `WonderMapHex` (`wonder_placement.rs`) | projekcja `Hex` z `GameMap.hexes` do `coords`+`terenBazowy` (Z2: `Hex` poza M14) | NIE-DOTYCZY jako port typu (adapter wejscia); zachowanie funkcji potwierdzone `wonder.json` |
| `HexOwnerFilter` (alias) | typ parametru `filterHex?` z `range-hexes.ts:31` | NIE-DOTYCZY (alias typu domkniecia); uzyty w `territory_keys_by_owner_match_web` |
| `DominantStatus` | `DominantReligionResult.status` (`culture-religion.ts:622`, P6.16) | ZALOZENIE Z7 (nizej): minimalne odwzorowanie na potrzeby `collect_religion_range_hex_keys`; pelny port P6.16 |
| `ReligionState` (Rust) / `DominantReligion` (Rust) | `ReligionState` (`culture-religion.ts:616`) i `DominantReligionResult` (`:622`) - OBA POZA M14 | ZALOZENIE Z7: tylko pola czytane przez `range-hexes.ts` (`counts`, `religion`, `status`); `share` pominiety; pelny typ i funkcja `dominantReligion` naleza do P6.16 |

### 2b. Zalozenia dodatkowe M14 (numerowane; Z1-Z6 pochodza z P6-25 §9)

- **Z5 (tresc z P6-25 §9)**: wyłącznie promien z `okolica.ts` (P6.8) - M14 przyjmuje go od wywolujacego. Poprawka r2: w r1 blednie
  podciagnalem pod Z5 takze `cityBorderRadius` i `dominantReligion`.
- **Z7 (NOWE, M14)**: `cityBorderRadius` (`culture-religion.ts:313`, P6.16) i `dominantReligion` (`culture-religion.ts:675`, P6.16) NIE sa
  portowane w M14; wywolujacy dostarcza je jako domkniecia (`&dyn Fn`). Powod: ich port jest w P6.16, a rownoleglosc nie pozwala
  edytowac cudzych plikow. Po P6.16 wywolujacy podstawia Rust `city_border_radius`/`dominant_religion`.
- **Z8 (NOWE, M14)**: zakres weryfikacji tych domkniec - patrz §3.7.
- **Z9 (NOWE, M14)**: spojnosc kluczy z `coords` - patrz §3.8.

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

6. **Odstepstwa sygnatur od weba (kompletna lista, r2)** - zmiany sa tylko po stronie wejscia; logika 1:1:
   | Web | Rust | Powod |
   |---|---|---|
   | `citySightRadius(pop, kultura=0)` | `city_sight_radius(pop, kultura, &dyn Fn(f64)->f64)` | `cityBorderRadius` poza M14 (Z7); web-domyslne `kultura=0` testowane osobnym wierszem wektora (`kultura: null`) |
   | `collectTerritoryHexKeysByOwner(map, nodes, filterHex?)` | `(hex_keys: &[String], nodes, Option<&HexOwnerFilter>)` | web uzywa tylko `Object.keys(map.hexes)`; `GameMap` poza M14 (Z2) |
   | `collectCultureRangeHexKeys(map, cities, ownerId=0)` | `(hex_keys, cities, owner_id, &dyn Fn(f64)->f64)` | j.w. + `cityBorderRadius` (Z7); `owner_id` jawny (domyslne 0 po stronie wywolujacego) |
   | `collectReligionRangeHexKeys(map, cities, cityRelig, stateReligion, params, ownerId=0)` | `(hex_keys, cities, city_relig, Option<&str>, szerzenie_max_dystans: Option<f64>, &dyn Fn(&ReligionState)->DominantReligion, owner_id)` | `params` redukowany do jedynego czytanego pola `szerzenieMaxDystans`; `dominantReligion(rel, params)` jako domkniecie (Z7) |
   | `listQualifyingWonderHexesForCity/ForOwner/pick`: `map: GameMap` | `map: &[WonderMapHex]` | `GameMap`/`Hex` poza M14 (Z2); patrz §3.3 |
   | `Map<number, Set<string>>` | `BTreeMap<i64, BTreeSet<String>>` | §3.2 |
7. **Zakres weryfikacji domkniec `cityBorderRadius`/`dominantReligion` (Z8)**: Rust `city_sight_radius`, `collect_culture_range_hex_keys`
   i `collect_religion_range_hex_keys` sa zweryfikowane WYLACZNIE na wejsciach pokrytych tabelami wektorow: `border` = 17 wartosci kultury
   w `territory.json` i 18 w `range.json` (0, 50, 99, 100, 101, 249-251, 499-501, 1000000, -5, NaN, +-Infinity, 100.5; w `range.json` dodatkowo 900), `dominant` = 195 par (`counts`, `progDominacjiPct`) w `range.json`.
   Dla innych wejsc domkniecie w tescie panikuje (`brak wektora ...`, `p6_m14_range.rs:107,146`), wiec test nie moze po cichu przejsc
   na niepokrytym wejsciu. Poprawnosc tych dwoch funkcji dla pozostalych wartosci jest zadaniem P6.16, nie M14.
8. **Klucz vs `coords` (Z9)**: web czyta w dwoch wariantach. `range-hexes.ts:34-37,63-66,106-109` (3 funkcje) PARSUJE KLUCZ `"q,r"` z `Object.keys(map.hexes)`
   - Rust przyjmuje te same klucze. `wonder-placement.ts:68-71` iteruje klucze, ale CZYTA `hex.coords` (klucz uzywa tylko martwy `hexAt`:28-30) - Rust
   przyjmuje liste `WonderMapHex{coords,terrain}`, czyli tez dokladnie to pole. Zatem obie strony czytaja ten sam skladnik, wiec rozjazd klucza i `coords` nie
   zmienia zgodnosci. Generator wektorow buduje klucze z `coords` (klucz == coords) i NIE zawiera przypadku z rozjazdem: to NIE_ZMIERZONO wektorem; wniosek
   wynika z lektury kodu (linie wyzej). Hex bez wartosci (`!hex`, `wonder-placement.ts:70`) nie wystepuje w grze.

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
