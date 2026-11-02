# P6-ADVANCE-CITY-ECONOMY - port `advanceCityEconomy` (Q1: plastry zasobowe)

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1`. Web: `gra/src/game/turn-economy.ts` (pin `4bbef081d`),
funkcja `advanceCityEconomy` `:2250-2913`. Rust: `rust-port/engine/src/domain/turn_economy_advance.rs`
(NOWY). Baza: `origin/rust-port/parity-v2` @ `e0c0a9ac5`.

## 1. Cel i wynik

`run_city_economy_resource_phase` (`turn_economy_resources.rs`) ma teraz PRODUKCYJNEGO wolajacego:
`advance_city_economy_resources(&mut [state::City], &AdvanceCityEconomyInput)`. Funkcja odtwarza w kolejnosci
weba wszystkie efekty `advanceCityEconomy` na `City.surowce` (przygotowanie wejsc -> faza zasobow -> drenaz
Mennicy -> reconcile capow). Petla plonow miast NIE dotyka `City.surowce` (zapis `surowce` wystepuje tylko w
fazie zasobow `:2482`, drenazu `:2823` i reconcile `:2832`), wiec nieportowana petla nie zmienia wyniku
na `surowce` - to jest uzasadnienie zakresu, nie zalozenie o parytecie reszty ticku.

Wiazanie z petla gry (`ai_turn`/`turn_economy.rs`): NIE wykonane - ZALOZENIE + dlug (sek. 4): petla gry nie ma
jeszcze wejsc terenowych ani reszty `advanceCityEconomy`, wiec wpiecie samej fazy zasobowej dalo by czesciowy tick.

## 2. Tabela plastrow (web plik:linia -> Rust)

| # | Plaster | Web (`turn-economy.ts`) | Rust | Status Q1 |
|---|---|---|---|---|
| P0 | parametry ekonomii `buildEconParams` | `:2293` | brak | DLUG Q2 |
| P1 | wezly terytorium `buildTerritoryNodesFromCities` | `:2296` | `territory.rs: build_territory_nodes_from_cities` | istnieje, NIE wolane (brak wejscia dla petli) - DLUG Q2 |
| P2 | spor sasiadow `computeLostToNearerSiblingByCity` + `reconcileAllWorkedTiles` | `:2305-2306` | `okolica/sasiedztwo.rs`, `territory.rs` | istnieja, poza allowlista wolajacego - DLUG Q2 |
| P3 | `computeTerritoryResourceYieldByCity` | `:2310` (def. `:738`) | BRAK | DLUG Q2a (parametr `territory_resource_by_city`) |
| P4 | `computePracaUpkeepByOwner` | `:2320` | BRAK | DLUG Q3 |
| P5 | `loadUpkeepParams`/`loadStorageParams`/`buildRationParams`/`buildUnitUpkeepTable` | `:2323-2329` | istnieja (`turn_economy.rs`, `city_growth.rs`) | wolane przez petle -> Q3 |
| P6 | przepustowosci konwerterow per owner `converterThroughputsForOwner` | `:2338-2360` | `converter_throughputs_for_era` | **ZAPORTOWANE (S2)** |
| P7 | bonusy Stolarni/Kamieniarni (`loadThroughput`) | `:2364-2371` | `load_throughput` | **ZAPORTOWANE (S2)** |
| P8 | liczniki Stolarni/Kamieniarni/Magazynow per owner | `:2373-2402` | `advance_city_economy_resources` | **ZAPORTOWANE (S3)** |
| P9 | `ownerResourceCapFor` | `:2404-2418` | `owner_resource_cap_for` | **ZAPORTOWANE (S4)** |
| P10 | `loadHealthParams`, `loadWealthParams` | `:2421-2431` | `load_wealth_params` istnieje; `load_health_params` BRAK | DLUG Q3 |
| P11 | `ownersWithMennica` (`:240`) | `:2437` | `owners_with_mennica` | **ZAPORTOWANE (S1)** |
| P12 | stolica/liczba miast per owner (korupcja) | `:2444-2454` | BRAK (wymaga petli) | DLUG Q4 |
| P13 | `computeWorkedMagazynYieldsByCity` | `:2476` (def. `:824`) | BRAK | DLUG Q2a (parametr `worked_magazyn_by_city`) |
| P14 | faza zasobow (`loadSpichlerzDrainParams` -> tick -> Garncarnia) | `:2482-2500` | `run_city_economy_resource_phase` (e0c0a9ac5) | **WOLANE produkcyjnie (S5)** |
| P15 | pola `CityEconomyTick` ze stanu Spichlerza/Garncarni | `:2514-2523`, `:2535-2538`, `:2592-2597`, krotka `tick` | `CityResourceView` | **ZAPORTOWANE (S6)** |
| P16 | zdrowie `computeCityHealth`, dostep do wody | `:2524-2531` | BRAK (`compute_city_health`, `city_has_water_access`) | DLUG Q3 |
| P17 | plony miasta `toEconomyCity`/`cityYieldPerTurn`/mnozniki/cuda | `:2536-2621` | `economy_yield.rs` czesciowo; `to_economy_city`, `apply_wonder_city_yields`, `apply_order_yield_mults` BRAK | DLUG Q4 |
| P18 | Wealth, `splitPraca`, handel/podatek (`manualWorkTaxByCity`, `maritimeTradeIncomeByCity`, `routeCashForCity`) | `:2625-2662` | `advance_wealth`, `split_praca`, `route_cash_for_city` istnieja | DLUG Q4 (wymaga P17) |
| P19 | oblezenie / wzrost V8.5 (`computeGrowthPercentV85`, bilans zywnosci) | `:2664-2755` | `city_growth.rs` istnieje | DLUG Q4 |
| P20 | manpower per miasto (`tickManpowerRegen`) | `:2750-2773` | `recruitment.rs` istnieje | DLUG Q4 |
| P21 | drenaz Mennicy `applyMennicaZlotoDrainForOwners` | `:1814-1830`, wolane `:2823-2829` | `apply_mennica_zloto_drain_for_owners` | **ZAPORTOWANE (S7)** |
| P22 | `reconcileOwnerResourceCaps` | `:2832` | `reconcile_city_resource_caps` (nad `economy_upkeep_p1::reconcile_owner_resource_caps`) | **ZAPORTOWANE (S8)** |
| P23 | utrzymanie per owner (`upkeepBalance`, utrzymanie surowcowe) | `:2840-2884` | `upkeep_balance`, `total_*_resource_upkeep` istnieja | DLUG Q5 |
| P24 | `manpowerHeal` (`tickManpowerUnitReplenishment`) | `:2887-2909` | `recruitment.rs` istnieje | DLUG Q5 |

Numeracja linii P6-P9: `:2347` (closure `converterThroughputsForOwner`), `:2364` (`stolarniaBonusDrewnaCiv`), `:2377`
(`magazynCountByOwner`), `:2409` (`ownerResourceCapFor`) - sprawdzone `grep -n` na pinie.

## 3. Wektory i dowody

* Generator `gen-p6-adv-city-econ-vectors.mjs` uruchamia PRAWDZIWY `advanceCityEconomy` z czystego
  `git archive 4bbef081d gra/src gra/data` (w `mktemp`/`/tmp`, zero buildu/dev w `gra/`) na minimalnej mapie i
  prawdziwym `loadGameData()`. Instrumentacja tylko w pamieci (plugin esbuild; plik na dysku nietkniety):
  przed wywolaniem `tickEmpireResourcePipeline` (`:2482`) zrzut wartosci posrednich (liczniki, cap,
  przepustowosci, zbior Mennic, bonusy) i opcjonalna podmiana wejsc terenowych na wstrzykniete (te same mapy
  dostaje Rust). Fixture: `tests/p6_adv_city_econ_vectors/advance.json` (~1.8 MB, <= 6 MB).
* 519 scenariuszy: 230 klasy `plain` (bez konwerterow/Spichlerza/Stolarni/wejsc terenowych) + 250 `full`
  (konwertery, Spichlerz I/II, Stolarnia, Kamieniarski, gated budynki, resolvery etykiet/zloto/zapasu, wejscia
  terenowe) + 39 brzegowych N-1/N/N+1 (prog drenazu Mennicy `< 1`: zloto 0/0.5/0.999/1/1.5/2; cap panstwa
  cap-1/cap/cap+1 dla 0/1/2 Magazynow i epok 1/2; bramki Waluta/waluta/dostep do zlota). Econ-params: kazdy z 12
  kluczy moze byc pominiety lub nie-liczbowy (sciezka `fallback`). Dodatkowo 360 przypadkow `thrCases`
  (`converter_throughputs_for_era` = kompozycja weba `loadThroughput` + `converterThroughputForEra`, domkniecie
  luki FC poprzedniego tematu) i 18 `happyCases` (`ceramikaHappinessBonus`, w tym 0/-0/-1/NaN/Infinity).
* Test Rust `tests/p6_adv_city_econ_pipeline.rs`: porownanie BITOWE `City.surowce` (rozdzial puli po miastach),
  pol `CityEconomyTick` (Spichlerz/Garncarnia), wartosci posrednich weba, przepustowosci, cap, liczniki, Mennice.
* Niezalezny weryfikator `verify-p6-adv-city-econ.py` (`python3 -I`, bez Rust i bez kodu generatora): liczniki
  Magazynow, zbior Mennic, cap, bonusy, przepustowosci (wszystkie scenariusze), liczniki Stolarni/Kamieniarni (bez
  resolvera etykiet), SUMY per owner po calym ticku w klasie `plain` (drenaz -> reconcile), niezmienniki, `thrCases`,
  `happyCases`. NIE liczone niezaleznie (web<->Rust tylko w tescie Rust): rozdzial puli po miastach, konwertery i
  Spichlerz w klasie `full`, liczniki z resolverem etykiet (tabele bramki runtime) - NIE_ZMIERZONO niezaleznie.

## 4. Dlug i propozycja podzialu (kolejne tematy)

* `-Q2a` wejscia terenowe: `computeTerritoryResourceYieldByCity` (`:738`) + `computeWorkedMagazynYieldsByCity`
  (`:824`) + wpiecie `build_territory_nodes_from_cities`/spor sasiadow/`reconcile_all_worked_tiles`. Zaleznosci
  P1/P2 istnieja; brakuje samych dwoch funkcji mapowych. Po nim `AdvanceCityEconomyInput` traci dwa parametry.
* `-Q2b` zdrowie i woda: `loadHealthParams`, `computeCityHealth`, `cityHasWaterAccess` (P10, P16).
* `-Q3` plony miasta: `toEconomyCity`, `cityYieldPerTurn` (czesciowo istnieje), `applyOrderYieldMults`,
  `applyWonderCityYields`, korupcja (P12, P17) + Wealth/`splitPraca`/handel/podatek (P18).
* `-Q4` oblezenie, wzrost V8.5, bilans zywnosci, manpower per miasto (P19, P20) - funkcje istnieja
  (`city_growth.rs`, `recruitment.rs`), potrzebna petla.
* `-Q5` utrzymanie per owner i `manpowerHeal` (P23, P24) + wiazanie z `ai_turn`/`turn_economy.rs`.
* `NIE_ZMIERZONO`: wiazanie z petla gry nie sprawdzane (brak testu integracyjnego `ai_turn` w tym temacie).

## 5. Zalozenia

1. `ownerResourceCapFor` w webie memoizuje per owner; Rust liczy bez cache (czysta funkcja, deterministyczny
   resolver epoki) - rezultat identyczny w 519 scenariuszach.
2. `Set<number>` Mennic = `BTreeSet<i64>`: drenaz jest per owner na rozlacznych miastach, kolejnosc nie wplywa.
3. `data.econParams` = surowy JSON; Rust czyta tylko `globalne.magazyn_*` i `budynki.*` (wiersze po trudnosci),
   adapter `raw_econ_for_storage` (liczba JSON -> `RawCell::Num`, reszta -> `Other` = `typeof v !== 'number'`).
4. `runtime_active_built_ids_for_city` (`turn_economy_resources.rs`) zmienione z `fn` na `pub(crate) fn` (jedyna
   zmiana w tym pliku, w allowliscie) - reuzycie bez duplikatu.
5. `domain/mod.rs`: 1 linia `pub mod turn_economy_advance;` (w allowliscie jako linia `pub mod`).
6. `Cargo.lock` generowany lokalnie, NIEcommitowany (integracja pomija).

## 6. Luki FC poprzedniego tematu - zamkniete

* wektor dla `converter_throughputs_for_era`: `thrCases` (360, z weba) + posrednie `thr` per owner w 519 scenariuszach;
* test `ceramika_happiness_bonus(0)`: `happyCases` z weba (`v` = 0 i -0, oba z `g=true` -> 0).

## 7. Mutacje

`mutate.py` (40 mutantow `turn_economy_advance.rs`, test `p6_adv_city_econ_pipeline`, logi `mut-M*.log`):
zabite 37, przezyly 3 - wszystkie rownowazne (100% nierownowaznych zabitych; 92.5% brutto).

* M21 (`Magazyn` liczony z `runtime` zamiast surowych `builtIds`): rownowazny - `magazyn` nie ma wpisu w
  `DEPOSIT_LINKED_BUILDING_LABELS` (`building-resource-gate.ts:64-76`), a `filterRuntimeActiveBuiltIds` dla
  budynku bez bramki zawsze go zostawia (`building-resource-gate.ts:302-306`), wiec `runtime` zawsze zawiera `magazyn`.
* M26 (`unwrap_or(0.0)` -> `unwrap_or(1.0)` przy `garncarniaSurplusZadowolenie`): martwa galaz -
  `compute_garncarnia_surplus_zadowolenie_by_owner` wstawia wpis dla KAZDEGO ownera miast
  (`turn_economy_resources.rs:573-612`), wiec `get(&owner)` jest zawsze `Some`; web `?? 0` (`:2520-2522`) tak samo nieosiagalne.
* M38 (`owner_zloto_access: Some(zloto)` -> `None` w rozwiazywaniu aktywnych budynkow): rownowazny w zakresie Q1 -
  resolver dostepu do zlota jest czytany wylacznie dla budynku `mennica` (`building-resource-gate.ts:276`, `:263-265`),
  a zaden konsument `runtimeBuiltIds` w portowanych plastrach nie sprawdza elementu `mennica` (liczniki `:2380-2392`
  tylko `stolarnia`/`kamieniarski`, widok `:2520` tylko `garncarnia`, receptury konwerterow wg innych id), i zaden
  budynek nie ma `mennica` w prerekwizytach bramki. Stanie sie nierownowazny przy porcie petli plonow (`maMennica`, Q3).

## 8. Bramki (logi `gate-*.txt`, kazdy z jedna linia `EXIT=`)

* `cargo fmt --check`, `cargo clippy -j 2 --all-targets -- -D warnings`: EXIT=0.
* Pelny `cargo test -j 2` PO ostatniej zmianie kodu: lib 22 + shardy s0-s4 (338/400/389/481/403) = 2033 passed / 0 failed.
  Baza z dispatchu: 2027/0 na `e0c0a9ac5`; roznica +6 = 4 nowe testy tego tematu + 2 testy dodane w obronie
  `8510b112a` (`converter_throughputs_for_era`, `ceramika_happiness_bonus`) - bezposredni przebieg PRZED:
  NIE_ZMIERZONO (pozostale binaria testowe sa zrodlowo identyczne).
