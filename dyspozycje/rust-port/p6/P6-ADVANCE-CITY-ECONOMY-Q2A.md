# P6-ADVANCE-CITY-ECONOMY-Q2A — wejscia terenowe ticku ekonomii

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1` (dlug `-Q2a` z `P6-ADVANCE-CITY-ECONOMY.md`). Pin weba `4bbef081d`
(`gra/src/game/turn-economy.ts`), baza Rust `28c21a299` (`rust-port/parity-v2`).

## 1. Cel i wynik

`advance_city_economy_resources` dostawalo `territoryResourceByCity` i `workedMagazynByCity` jako parametry testu.
Teraz `turn_economy_advance::advance_city_economy_resources_with_map(&mut [state::City], &TerrainContext, &input)`
liczy je samo z `&[state::City]` + mapy (`BuildMap`) + `terrain-yields.json`, razem z wiazaniem P1/P2
(wezly terytorium, spor sasiadow, reconcile `okolica_reczne`). Struktura `AdvanceCityEconomyInput` i funkcja bazowa
sa BEZ zmian (dwa pola terenowe w wariancie `_with_map` sa ignorowane). Zero zmian w `territory.rs`, `okolica/**`,
`gra/**`, `Cargo.toml`, `WERSJE.md`.

## 2. ETAP 1 — rozbieznosc typow (zmierzona)

| Typ | plik:linia | `q`/`r` | pola okolicy |
|---|---|---|---|
| `state::City` (`p6_6b::cities::City`) | `state.rs:1683` | `f64` | `okolica_focus`, `okolica_tryb`, `okolica_reczne: Option<Reczne>` (`:1708`, z kolejnoscia wstawiania) |
| `WorkCity` | `territory.rs:299` | `i32` | tylko `okolica_reczne: Option<BTreeMap<String,f64>>` (BEZ kolejnosci), brak focus/tryb |
| `OkolicaCity` | `okolica.rs:102` | `i32` | `focus`, `tryb`, `reczne: Option<Reczne>` |

Trzy rozbieznosci: (a) `f64` vs `i32` wspolrzedne; (b) `Reczne` (uporzadkowane) vs `BTreeMap` w `WorkCity`; (c) `WorkCity`
nie niesie focus/tryb (potrzebnych tylko `OkolicaCity`). `grep -rn "impl From<.*City" src` = 0 trafien (adapterow nie bylo).

Adaptery (widoki, kopia pol; istniejace typy bez zmian), `turn_economy_territory.rs`:
* `work_city_of(&City) -> WorkCity`, `okolica_city_of(&City) -> OkolicaCity`, `territory_nodes_of(&[City])`;
* rzutowanie `q/r as i32` (ZALOZENIE: wspolrzedne calkowite jak w webie `hexes["q,r"]`; ulamkowe: NIE_ZMIERZONO);
* `reconcile_city_worked_tiles`: `reconcile_all_worked_tiles` dziala na kopii `WorkCity`; wynik wraca do
  `City.okolica_reczne` przez USUNIECIE z `Reczne` kluczy nieobecnych w wyniku (reconcile tylko usuwa), co zachowuje
  kolejnosc wstawiania pozostalych kluczy (jak `delete` w JS). Korekta Q1 sek. 4a: reconcile w pinie mutuje
  `okolicaReczne` (`territory-work.ts:106-146`), a nie `workedTiles`; `state::City` MA `okolica_reczne`.

## 3. Tabela plastrow

| Web (pin) | Rust | Status |
|---|---|---|
| `computeTerritoryResourceYieldByCity` `:738-782` | `compute_territory_resource_yield_by_city` | zaportowane |
| `computeWorkedMagazynYieldsByCity` `:824-854` + `cityWorkedTilesForEconomy` `:624-681` | `compute_worked_magazyn_yields_by_city` (+ `city_worked_hexes`) | zaportowane |
| `buildTerritoryNodesFromCities` `:2296`, `computeLostToNearerSiblingByCity` + `reconcileAllWorkedTiles` `:2305-2306` | `compute_terrain_inputs` (kolejnosc jak w webie: wezly -> spor -> reconcile -> plony terytorium -> plony magazynowe) | wolane przez adaptery |
| `tileYield(hexToWorkedTile(hex))` | `hex_tile_yield` (`economy_yield::tile_yield_full`, istnialo) | reuzyte |

Reuzyte BEZ zmian: `territory_owner_at`, `okolica::{resolve_worked_tiles, compute_lost_to_nearer_sibling_by_city,
is_land_workable_hex}`, `improvements::{improvement_keys_for_hex, territory_resource_yield_for_improvement}`.

## 4. Wektory i dowody

* `tests/p6_adv_q2a_vectors/q2a.json` (1.3 MB; <= 6 MB) z URUCHOMIONEGO, prawdziwego `advanceCityEconomy`
  (esbuild 0.21.5 w `mktemp -d`, zrodla z czystego `git archive 4bbef081d gra/src gra/data`, ZERO buildu/dev w `gra/`).
  Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1/gen-p6-adv-q2a-vectors.mjs`;
  ponowne wygenerowanie = plik BAJT W BAJT identyczny (`cmp`). Dane `terrain-improvements.json`, `terrain-yields.json`,
  `econ-params.json` w `rust-port/engine/data` = pin (`cmp`).
* 526 scenariuszy `advanceCityEconomy`: 320 losowych (8 map: tereny, nakladki, rzeki, ulepszenia w tym aliasy/duplikaty/
  nieznane, zloza, dziury w mapie, tasowana kolejnosc heksow), 18 `edgepop` (populacja 0..17 na mapie pierscieni —
  brzegi promienia terytorium/okolicy N-1/N/N+1), 108 `pair` (dwa miasta w dystansie 1..6, pop {1,3,5}, ten sam/rozni
  wlasciciele: spor sasiadow, remis i przewaga), 24 `triple`, 56 `capedge` (zapas = cap + {-400..+1}, 0/1 Magazyn,
  epoka 1/2, 1-2 miasta). Plus 90 bezposrednich wolan (`direct`) z wezlami fort/posterunek (121 z `order`, kolejnosc
  wezlow fort-pierwszy/miasto-pierwszy).
* Test Rust `tests/p6_adv_q2a_pipeline.rs` (5 testow): `territoryResourceByCity`, `workedMagazynByCity`,
  `lostToSiblingByCity`, `okolicaReczne` PO reconcile (porownanie uporzadkowane), koncowe `City.surowce` per miasto
  (bitowo), pola `CityEconomyTick` Spichlerza/Garncarni; test przekazywania resolverow (`_with_map` vs reczne zlozenie
  z NIEPUSTYMI resolverami); mapowanie 9 kluczy surowcow; adaptery.
* Weryfikator `python3 -I` (`verify-p6-adv-q2a.py`, wynik `verify-output.txt`): 0 rozbieznosci, niezaleznie z TEKSTU weba:
  terytorium (526+90), spor sasiadow (526+90), reconcile (1518 miast, 752 z ucieciem), wybor pol auto/reczny
  i sumy magazynowe (526+90), ORAZ rozdzial puli po miastach (luka z -Q1): 537 miast w scenariuszach bez
  konwerterow/Spichlerza/Mennicy (kredyt Fazy 1 z capem i mnoznikami Stolarni/Kamieniarni, wybor miasta o najmniejszym
  zapasie, przepisanie puli, reconcile capow). NIE liczone niezaleznie: plony pola `tileYield` i potencjal zywnosci
  (dump z weba; zgodnosc Rust<->web pokrywa test Rust), scenariusze z konwerterami/Spichlerzem/Mennica.

## 5. Zalozenia

* `BuildMap::hexes()` ma kolejnosc wstawiania = `Object.keys(map.hexes)`; klucz == `coords` (Z9 `improvement_build.rs`).
* `TerritoryResourceKey` weba = 9 kluczy; `add_territory_amount` panikuje na innym (test `territory_resource_keys_all_mapped`).
* Era dla `resolveOwnerEra` z `owner_era_for` (default: owner 0 -> `playerEra`, reszta 1).
* Wektory nie zawieraja ujemnych wspolrzednych heksow: porownanie `localeCompare` kluczy `q,r` (remis score/dystans)
  zweryfikowane dla nieujemnych `q,r`; ujemne: NIE_ZMIERZONO.
* Klucze `okolica_reczne` o postaci calkowitej (np. `"5"`) pomijane w wektorach (JS porzadkuje je numerycznie przed
  innymi kluczami; `Reczne` trzyma kolejnosc wstawiania — odrebna, wczesniejsza rozbieznosc `Reczne`).
* Wiazanie z `ai_turn`/`turn_economy.rs`: NIE wykonane (poza allowlista); NIE_ZMIERZONO.

## 6. Mutacje

65 mutantow (`mutate.py`: 53 w `turn_economy_territory.rs`, 12 w wariancie `_with_map`): zabite 56, rownowazne 9,
przezyli nierownowazni 0. Pokrycie netto 56/56 = 100%, brutto 56/65 = 86.2%. (Pierwszy przebieg: 4 przezyli
nierownowazni — `owner_tech`, `owner_zloto_access`, `econ_params`, `difficulty` w `_with_map`; zamkniete rozszerzeniem
testu przekazywania resolverow o male, rozne per trudnosc capy i niepuste resolvery; po poprawce wszystkie zabite.)
Wyniki: `mutacje-wynik.txt`.

Rownowazne (dowod plik:linia):
* T13 `nakladka: None` w `hex_like_of`: `improvements.rs:946-961` (`improvement_keys_for_hex`) nie czyta `hex.nakladka`.
* T17 `ulepszenie_key: None`: `economy_yield.rs:795` (`imp_keys_of`) uzywa `ulepszenie_key` tylko gdy
  `ulepszenia_keys` jest `None`/puste, a wtedy `keys` jest puste i `keys.first()` = `None`.
* T18 `zloze: None`: `improvements.rs:866` (`ore_yield_from_improvements(_zloze)`) ignoruje `zloze` (jak web).
* T24 usuniety wczesny `return` dla pustych miast: przy braku miast `nearest_owner_city_id` zwraca `None`, `out` pozostaje puste.
* T27 usuniete `if keys.is_empty() { continue }`: petla `for key in &keys` jest pusta dla pustych `keys`.
* T31/T32/T33 normalizacja `pop` w `city_worked_hexes` (floor / `max(0)` / `<= 0`): `okolica/auto.rs:69,138`
  (`js_floor_nonneg(city.population)`), `:44` (`n = floor(pop).max(0)`), `:104` (`truncate` do `pop`) daja ten sam
  wynik (0 pol) dla `pop <= 0` — wczesny powrot jest tylko optymalizacja.
* T35 domyslny plon dla brakujacego heksa: `okolica.rs:224` + `improvement_build.rs:841` (`hex_keys_within_radius`
  filtruje do istniejacych heksow), wiec `yield_of` nigdy nie dostaje brakujacego heksa.

## 7. Bramki (logi `gate-*.txt` w katalogu runu, kazdy z jedna linia `EXIT=`)

* `cargo fmt --check`: EXIT=0; `cargo clippy -j 2 --all-targets -- -D warnings`: EXIT=0; `git diff --check` (po
  `git add -N` nowych plikow): EXIT=0.
* PELNY `cargo test -j 2 --no-fail-fast` PO ostatniej zmianie kodu: lib 22 + shardy s0-s4 (389/379/496/396/358) =
  2040 passed / 0 failed. PRZED (czysty `git archive HEAD` = `28c21a299`, ten sam podzial modulo 5 po liscie
  `tests/*.rs`): lib 22 + 367/411/474/403/358 = 2035 / 0. Roznica +5 = 5 nowych testow tego tematu; istniejace testy
  territory/okolica bez zmian (zero zmian w `territory.rs`, `okolica/**`).

## 8. Dlug

* Petla plonow miast (P17), zdrowie (P10/P16), Wealth, utrzymanie — jak w Q1 (`-Q2b`..`-Q5`).
* Wiazanie `advance_city_economy_resources_with_map` z `ai_turn`/`turn_economy.rs` (NIE_ZMIERZONO).
