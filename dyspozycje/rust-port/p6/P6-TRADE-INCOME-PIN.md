# P6-TRADE-INCOME-PIN — `domain/trade.rs` 1:1 z pinem weba `4bbef081d`

Temat: `R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1` (runda 1/5). Spłaca dług -Q7 pkt 1 z `P6-ADVANCE-CITY-ECONOMY-Q6.md` sek. 8.
Baza: `b0057c1c9` (parity-v2). Pin weba: `4bbef081d` (`gra/src/game/trade-routes.ts`, `map/territory.ts`, `main.ts:34470-34524`).
Dowód: wektory z URUCHOMIONEGO weba (`tests/p6_trade_pin_vectors/trade.json`, generator w runie, esbuild w `mktemp -d`,
czyste `git archive 4bbef081d`, zero buildu w `gra/`), test `tests/p6_trade_pin.rs` (59 190 sprawdzeń bit w bit),
niezależny weryfikator Python `-I` (57 807 sprawdzeń + kontrola negatywna 2/2), mutacje 54/54 (brutto 100%).

## 1. Tabela funkcji (100%, plik:linia)

Zgodność PRZED = z lektury starego kodu `b0057c1c9` (stary Rust nie kompiluje się z nowymi wektorami; wynik PRZED nie jest
mierzony uruchomieniem). Zgodność PO = zmierzona wektorami.

| Funkcja webu | Web plik:linia (`trade-routes.ts`) | Rust (`trade.rs`) | PRZED | PO |
|---|---|---|---|---|
| `isLandPassable` | :198-200 (`!water && != Gory`) | `TerrainType::is_land_passable` :146 | rozbieżna (Tundra/Polarny wykluczona) | zgodna |
| `isWaterHex`, `cityHasPort` | :203, :211 | `is_water_passable`, `city_has_port` :671 | zgodna | zgodna |
| `territoryOwnerAt` | `territory.ts:122-160` | `territory_owner_at` :589 | rozbieżna (brak: miasto > fort, `order`) | zgodna |
| `ownersHaveSharedLandBorder`, `landBorderShared` | :264, :312 | `owners_have_shared_land_border` :615 (cache webu = optymalizacja, bez wpływu na wynik) | zgodna (zależna od `territoryOwnerAt`) | zgodna |
| `computeConnectivityComponents`, `get*Components` | :412, :448 | `connectivity_components` :757, `ConnectivityCache` | brak | zgodna |
| `landComponentsMayConnect`, `waterComponentsMayConnect` | :474, :503 | :811, :839 | brak (web przy `needPath=false` zwraca PO prefiltrze, bez BFS) | zgodna |
| `multiSourceBfs` + `maxSteps` | :532, :710 (`max(1, w+h)`) | `bfs_path` :680, `TradeMap::max_steps` | rozbieżna (wymiary 0 → `tiles.len()`) | zgodna |
| `coastalWaterNeighbors` | :595 | :746 | zgodna | zgodna |
| `findCityConnection` / `computeCityConnection` | :655, :695 (ten sam heks przed granicą :718-720) | `find_city_connection_internal` :860 + 3 wrappery pub | rozbieżna (ten sam heks, `needPath=false`, Tundra) | zgodna |
| `tradeRouteId`, `tradeRoutePairKey` | :792, :818 | :1093, :1097 | zgodna | zgodna |
| `createTradeRoute` | :827 | `create_trade_route_with_options` :1015 | zgodna | zgodna |
| `loadTradeRouteParams` | :878 | `load_trade_route_params` :2148 (teraz `&Value`, liczba skończona także ujemna/ułamkowa) | rozbieżna (z lektury: `RawParamRow` = tylko `Option<f64>`, `>= 0`, rzutowanie na `u32`) | zgodna |
| `TRADE_BUILDING_IDS`, `tradeRouteLimitForCity`, `...ExistenceLimit...` | :908, :913, :944 | :353, :364 + `BuildingLookup::building_count` | rozbieżna (liczył unikaty, web liczy WPISY listy) | zgodna |
| `TRADE_TECH` | :1132 | `TRADE_TECH` :348 | brak | zgodna |
| `detectBestConnection` | :981 | :1114 | zgodna | zgodna |
| `citiesHaveTradeConnection` | :1011 (domyślnie `needPath=true`) | :1468 | rozbieżna (`needPath=false`) | zgodna |
| `diagnoseMissingTradeRouteForPartner` | :1074 | :1517 | rozbieżna (inne teksty i kolejność) | zgodna |
| `refreshTradeRoutes` | :1302 (sort: dochód wg `tradeRouteIncomeForRoute`, `localeCompare`) | :1186 | rozbieżna (sort wg starego wzoru; `cmp` bajtowy) | zgodna |
| `tradeRouteIncomeByDistance` | :1547 (krzywa, `?? 0`) | `trade_route_income_by_distance` :1638 | rozbieżna (interpolacja `dochod_podloga..szczyt`) | zgodna |
| `tradeRouteIncomeForRoute` | :1568 (×2 między ownerami, `ceil(x/2)`) | :1657 | rozbieżna (brak ×2 i `ceil/2`) | zgodna |
| `loadTradeRouteIncomeParams` | :1584 | :2169 | rozbieżna (czytał `dochod_podloga` itd.) | zgodna |
| `computeTradeRouteIncomeByCityBreakdown`, `...ByCity` | :1628, :1661 | :1676, :1728 | rozbieżna (brak Targowiska i podzbioru morskiego, `u64`) | zgodna |
| `tradeRouteBuildingBonusForRoute`, `computeTradeRouteBuildingBonusByCity` | :1693, :1712 | :1755, :1766 | rozbieżna (stary wzór dystansu) | zgodna |
| `computeSeaTradeRouteCountByCity` | :1739 | :1783 | zgodna | zgodna |
| `computeSeaTradeBonusIncomeByCity` | :1773 (dowolna liczba) | :1833 (`f64`) | rozbieżna (`u64`) | zgodna |
| `diffTradeRoutes` | :1810 | :2108 | zgodna | zgodna |
| `computeTradeRouteResourceGrants`, `has...`, `first...` | :1890, :1927, :1939 (`localeCompare`) | :1909, :1947, :1957 | rozbieżna (`first`: porównanie bajtowe) | zgodna |
| `loadTradeRouteResourceFlowParams` | :2021 | :2196 | rozbieżna (`u64`, `>= 0`) | zgodna |
| `computeTradeRouteResourceFlow` | :2073 (zapasy `number`, `floor`, `localeCompare`) | :2035 | rozbieżna (zapasy `u64`, saturacja, sort bajtowy) | zgodna |
| sklejka przepływu surowców | `main.ts:34470-34498` | NOWE `trade_flow_apply.rs` (`apply_trade_route_resource_flows`) | brak | zgodna (wektory: stany miast po przepływie) |
| sklejka dochodu tras | `main.ts:34503-34524`, `:16711` | `turn_economy_inputs_trade.rs` (`build_trade_tick_inputs`, teraz deleguje do `trade.rs`) | zgodna (duplikat logiki) | zgodna (jedno źródło prawdy) |

`localeCompare` (`:1461`, `:1484`, `:1946`, `:2095`): port `locale_compare` (ICU root: interpunkcja < cyfry < litery, mała przed
wielką na poziomie trzecim); tabela kolejności ASCII wyprowadzona z uruchomionego silnika, 2 500 par losowych + pełna tabela ASCII w teście.

## 2. Odstępstwa celowe i założenia (do akceptacji)

* Z1. Zmiana ISTNIEJĄCEGO zachowania jest celowa (dispatch): dochód, sort kandydatów, `Tundra`, budżet BFS, `needPath=false`,
  limity budynków. Każda zmiana ma wektor z weba.
* Z2. `TerritoryNode.radius` nadal podaje wołający (= `cityTerritoryRadius(node)`); doszły pola `fort`, `outpost`, `order` (serde `default`,
  `TerritoryNode::new` bez zmian). Generator liczy promień webową funkcją.
* Z3. `localeCompare` modelowane dla ASCII; identyfikatory spoza ASCII porządkuje punkt kodowy (NIE_ZMIERZONO dla Unicode).
* Z4. `ownerResourceCap` (cap odbiorcy przepływu, `main.ts:34484`) wchodzi do `apply_trade_route_resource_flows` jako domknięcie
  (źródło: `turn_economy_advance::owner_resource_cap_for` + epoka odbiorcy po stronie wołającego). `try/catch` weba (tylko `console.error`) pominięty.
* Z5. Wartości `TRADE_ROUTE_INTERNATIONAL_MULTIPLIER`/`TRADE_ROUTE_INCOME_HALF_DIVISOR` są stałymi w `trade.rs` (jak w webie). Tabela
  `data/derived/trade-multipliers.json` ma w kolumnie `rust` nadal stary opis "BEZ MECHANIKI" dla tych dwóch wierszy — NIE zmieniano
  (test `derived_values` liczy wiersze ROZWINIĘTE = 2; poza zakresem): dług dokumentacyjny.
* Z6. `TradeRouteParams` (`ladMaxDist`/`morzeMaxDist`) to `f64` (web: dowolna liczba skończona); w obu implementacjach nie wpływa na łączność.
* Z7. `TradeRouteResourceFlow.amount`, zapasy, rezerwa i bonus Portu to `f64` (web `number`; zapasy ułamkowe/ujemne w wektorach).

## 3. Testy zależne od starego zachowania (regeneracja z uzasadnieniem, asercji nie osłabiono)

`git grep -l "trade::" rust-port/engine/tests` → 5 plików; zmienione:
* `tests/trade.rs` — `income_curve_is_clamped...` przepisany na krzywe `handel_szlaki` (dawne wartości 22/40/5 pochodziły z usuniętego wzoru,
  którego nie ma w pinie; ta sama liczba przypadków); `route_income_building_and_sea_bonuses...` zmiana API (`f64`, premia Targowiska); test przepływu
  na `f64`; `diagonal_path...` dostał wymiary mapy 6×6 (web: budżet BFS `max(1, w+h)`; mapa 0×0 dawałaby 1 krok); DTO `f64`.
* `tests/terrain_movement_fix.rs` — 3 testy twierdziły, że trasy handlowe NIE przechodzą przez Tundrę (z kosztu RUCHU "Polarny: 99");
  pin `trade-routes.ts:198-200` wyklucza tylko Góry i wodę, co potwierdza uruchomiony web (`polarny` w mapach wektorów). Asercje odwrócone 1:1
  (+ kontrola, że Góry nadal blokują); fixture `trade_disc` dostał wymiary 7×7 (budżet BFS).
* Bez zmian i zielone: `tests/derived_values.rs`, `tests/parity_suite.rs`, `tests/p6_adv_q6_wire.rs` (wejścia ticku Q6 nadal bit w bit).

## 4. Dług po tym temacie

* Dokumentacja: wiersze `TRADE_ROUTE_INTERNATIONAL_MULTIPLIER`/`..._HALF_DIVISOR` w `trade-multipliers.json` (Z5) i wiersz długu -Q7 pkt 1 w `P6-ADVANCE-CITY-ECONOMY-Q6.md` (poza allowlistą).
* Wiązanie `refresh_trade_routes` do pętli tury (skąd `existing_routes`, `isAtWar`, `hasTradeTreaty`, `hasTradeTech`, węzły terytorium) — wejścia stanu (dług -Q7 pkt 2+).
