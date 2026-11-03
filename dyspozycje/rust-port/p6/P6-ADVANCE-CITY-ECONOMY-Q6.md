# P6-ADVANCE-CITY-ECONOMY-Q6 - wiazanie `advance_city_economy` z petla tury (dlug -Q6 z Q5 sek. 4)

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1`. Pin weba `4bbef081d`; baza `origin/rust-port/parity-v2` @ `13b98d75a`.
Zasada wlasciciela: port 1:1; odstepstwo = ZALOZENIE do akceptacji. Decyzja orkiestratora: wiazanie odtwarza to, co web robi w miejscu
wywolania `gra/src/main.ts:34540` (wejscia `:34417-34535`, wyjscia `:34578-35131`).

## 1. Wynik

Nowe moduly (`rust-port/engine/src/domain/`): `turn_economy_inputs_trade.rs` (dochod z tras, pin), `turn_economy_inputs_wonders.rs`
(cuda), `turn_economy_inputs_state.rs` (lask Mennicy, stolica, reczny podatek), `turn_economy_wire.rs` (`run_economy_tick_for_game`,
bankowanie per owner, sumy per owner). `run_economy_tick_for_game(&mut [City], &mut extras, &mut MennicaZlotoGraceState,
&GameEconomyContext, Option<HealRequest>) -> GameEconomyTickOutcome { tick, banks, map_owner_ids }` sklada w kolejnosci weba: dochod z tras
-> reczny podatek -> mapa plonow cudow -> `prepare` laski Mennicy -> resolvery memoizowane (migawka sprzed drenazu, Z-Q5-1) ->
`advance_city_economy` -> `finalize` laski (stan PO ticku) -> bankowanie (fotele czlowieka, potem AI) z odjeciem utrzymania surowcowego od
zapasow miast. Test `tests/p6_adv_q6_wire.rs` na 295 scenariuszach z URUCHOMIONEGO weba: bit w bit wszystkie pola `EconomyTickResult`,
mapy wejsc, lask, skarbiec/nauka po bankowaniu, zapasy miast po odjeciu utrzymania.

## 2. Tabela wejsc wywolania `main.ts:34540` (26 argumentow) i wyjsc

| # | Wejscie (web) | Gdzie liczone w webie | Rust | Status |
|---|---|---|---|---|
| 1 | `cities` | stan gry | `City` (`&mut [City]`) | jest |
| 2 | `map` | stan gry | `TerrainContext`/`BuildMap` (-Q2) | jest |
| 3 | `data` | `loadGameData` | `econ_params`, `buildings`, `matrix`, `unit_rows`, `society_params` | jest |
| 4 | `_menuDifficulty` | skalar | `&str` | jest |
| 5 | `econUnits` | `main.ts:34413-34430` | `EconUnit{owner_id,type_id}`; `camping/onOwnTerritory/inGarnizon` czyta wylacznie `advanceEmpireFood`, nie `advanceCityEconomy` | jest (-Q5); mapowanie jednostek w wolajacym |
| 6 | `growthMultMap` | `main.ts:4886` | brak uzyc w ciele `turn-economy.ts:2250-2913` (tylko sygnatura `:2256`) | MARTWY (Z-Q6-2) |
| 7 | `cityBuilt` | stan gry | `built_by_city` | jest |
| 8-9 | `player.era`, `player.zbadane` | stan gry | `player_era`, `player_zbadane` | jest |
| 10 | `ownerCivMap` | `main.ts:34431-34436` z `_menuCivIdByOwner` + `aiOwnerCivMap` | `owner_civ_by_owner_id` (wejscie); zrodla nie istnieja w Rust | wejscie; zrodlo -> dlug -Q7 |
| 11 | `orderMultMap` | wypelniane `main.ts:35789` (`orderEffectsToYieldMults`) PO ticku, czyszczone `:40887` | `order_mult_by_city`; obliczenie istnieje (`types.rs:580`, `:793`, inny typ) | wejscie; wiazanie lane Porzadku -> dlug -Q7 |
| 12 | `empireEpochForOwner` | resolver | `owner_era` (`&dyn Fn`) | wejscie (stan) |
| 13 | `unlockedTechSetForOwner` | resolver | `owner_tech` | wejscie (stan) |
| 14 | `wzrostLudnosciPace` | - | brak uzyc w ciele (sygnatura `:2264`) | MARTWY (Z-Q6-2) |
| 15 | `tradeRouteBuildingBonusByCity` | `trade-routes.ts:1712`, `main.ts:16711` | `compute_pin_trade_route_building_bonus_by_city` | ZAPORTOWANE (-Q6) |
| 16 | `tradeIncomeByCity` | `trade-routes.ts:1631`, `main.ts:34503-34524` | `compute_pin_trade_income_breakdown` + `build_trade_tick_inputs` | ZAPORTOWANE (-Q6) |
| 17 | `cityRelig` | `main.ts:3202` | brak uzyc w ciele (sygnatura `:2269`) | MARTWY (Z-Q6-2) |
| 18 | `buildWonderCityYieldsByOwnerMap` | `main.ts:3962`, `wonders-data.ts:216` | `build_wonder_city_yields_by_owner_map` | ZAPORTOWANE (-Q6) |
| 19 | resolver zlota Mennicy | `main.ts:5210`, `mennica-zloto-grace.ts` | `MennicaZlotoGraceState`, `prepare/finalize`, resolver z pamiecia | ZAPORTOWANE (-Q6) |
| 20 | resolver etykiet aktywnych | `main.ts:5236` (`empireActiveResourceLabelsForOwner` `:3234` + `Zloto`) | `empire_active_labels` (wejscie) + dopisek `Zloto` + memo; `resource_access/active_access.rs` istnieje | CZESCIOWO: wiazanie z mapa -> dlug -Q7 |
| 21 | resolver zapasu imperium | `main.ts:5247` | migawka `owner_resource_stock_all` sprzed ticku | ZAPORTOWANE (-Q6) |
| 22 | `ownerDefaultPodzialHandlu` | `main.ts:5520-5540` (ustawienia) | `owner_default_podzial_handlu_by_owner` | wejscie (stan); zrodlo -> dlug -Q7 |
| 23 | `manpowerHeal` | `main.ts:34554-34571` | `HealRequest`; `getMaxHp` = `effectiveMaxHp(unitHealth, unitParametryBonusFrac, veteranCombatBonusFrac)` NIE istnieje w Rust | wejscie (closure); dlug -Q7 |
| 24 | `ownerDefaultPodzialPracy` | `main.ts:5552-5590` | `owner_default_podzial_pracy_by_owner` | wejscie (stan); zrodlo -> dlug -Q7 |
| 25 | `maritimeTradeIncomeByCity` | `main.ts:34503-34524` | w `build_trade_tick_inputs` | ZAPORTOWANE (-Q6) |
| 26 | `manualWorkTaxByCity` | `main.ts:34525-34535`, `:31575` | `build_manual_work_tax_by_city`, `capital_city_id_for_owner` | ZAPORTOWANE (-Q6) |

Wyjscia (co web robi z `econ`):

| Wyjscie | Web | Rust | Status |
|---|---|---|---|
| `perCity` -> `lastCityKulturaTick`, `aiWonderPracaTickByCity` | `main.ts:34580-34583` | odczyt z `tick.result.per_city` (`kultura`, `do_budynkow`) | jest |
| `finalizeMennicaZlotoGraceAfterTick` | `main.ts:34584-34588` | `finalize_mennica_zloto_grace_after_tick` w wiazaniu | ZAPORTOWANE |
| sumy HUD gracza `sumEconomyForPlayerCities` | `main.ts:34857-34861` | `sum_economy_for_player_cities` | ZAPORTOWANE |
| bankowanie skarbca/nauki (ludzie i AI) + utrzymanie | `main.ts:35045-35131` | `OwnerBank` (+ `apply_treasury`, `apply_science`) | ZAPORTOWANE |
| odjecie utrzymania surowcowego od zapasow | `main.ts:35077-35094`, `:35124-35128` | `deduct_building_stock_cost_across_cities` w wiazaniu | ZAPORTOWANE |
| `buildPowerSnapshotsForTurn(econ)`, `refreshObjectivePowerCache` | `main.ts:34578-34579` | brak | dlug -Q7 |
| blok EmpireFood (auto-racje, `advanceEmpireFood`, atrycja glodowa) | `main.ts:34594-34850` | brak | dlug -Q7 |
| research AI/gracza po bankowaniu, deficyt Zlota, `pracaUpkeepByOwner` w puli Pracy | `main.ts:35149+`, `:36098-36111` | brak (`praca_upkeep_by_owner` jest w wyniku) | dlug -Q7 |

## 3. Relacja `turn_economy.rs` (`settle_turn`/`resolve_turn`, `u64`) do `EconomyTickResult`

Dowod: grep `settleTurn|resolveTurn|settle_turn` po `gra/src` (pin) = 0 trafien; web nie ma odpowiednika. W Rust `settle_turn`
(`turn_economy.rs:250`, `:310`) i `resolve_turn` (`:299`) maja jedynego "wolajacego" w reeksporcie `lib.rs:46`. Rozliczacz pracuje na
`EconomyBalances` `u64` z pula Pracy resetowana w tej samej funkcji, a web liczy `f64` per miasto (`advanceCityEconomy`) i bankuje
inline per owner w `main.ts:35045-35131` (skarbiec moze byc ujemny, `:35131`). To INNY, wlasny kontrakt Rust, nie ten sam etap tury.
Z-Q6-1: wiazanie NIE mapuje wyniku na `EconomyBalances` (zaokraglenia, ujemne salda i per-owner nie sa wyrazalne w `u64`); zwraca skladniki
`OwnerBank`, a wolajacy stosuje `apply_treasury`/`apply_science`. Los `settle_turn` (usuniecie albo adapter) = decyzja wlasciciela, dlug -Q7.

## 4. Rozbieznosc znaleziona: `domain/trade.rs` != pin

`trade.rs:1344-1450` liczy dochod trasy interpolacja `dochod_podloga/dochod_szczyt` (skala morza x2, zaokraglenie /5) i czyta klucze
`dochod_podloga` (`:1903-1930`), a pin (`trade-routes.ts:1548-1604`) czyta krzywe `handel_szlaki.dochody_ladowe/dochody_morskie`,
mnozy x2 trase miedzy roznymi ownerami i dzieli `ceil(x/2)`; w `econ-params.json` istnieja WYLACZNIE krzywe. Wejscia ticku liczy
wiec nowy modul 1:1 z pinem, a `trade.rs` NIE zostal zmieniony (poza allowlista zmian zachowania). Dlug -Q7: wyrownanie
`trade.rs` (w tym priorytetu kandydatow w `refresh_trade_routes`, ktory w webie wg dochodu `tradeIncomeParams`).
Premia budynkowa tras jest liczona z DOMYSLNYCH krzywych (`main.ts:16711` nie podaje `params`), nie z krzywych trudnosci - odtworzone.

## 5. Zalozenia (do akceptacji wlasciciela)

* Z-Q6-1 brak mapowania na `EconomyBalances u64` (sek. 3).
* Z-Q6-2 `growthMultByCity`, `wzrostLudnosciPace`, `cityReligionByCityId` to martwe parametry `advanceCityEconomy` - wiazanie ich nie przyjmuje.
* Z-Q6-3 `ownerHasZlotoAccessNow` = zapas Zlota w skarbcu (liczone) OR `native_zloto_access` (natywny dostep/grant trasy - wejscie wolajacego).
* Z-Q6-4 `prepare` i resolvery liczone na stanie PRZED ticku, `finalize` na stanie PO ticku (jak web; roznica potwierdzona w Q5 sek. 3).
* Z-Q6-5 mapy `Map` weba jako `BTreeMap` (Z-Q5-4). ZAWEZONE (Obrona R1): dodawanie `f64` nie jest laczne, wiec zmiana kolejnosci iteracji
  moze w ogolnosci zmienic sume. Zgodnosc jest ZMIERZONA na wektorach (295 scenariuszy, 1049 tickow, bit w bit; dochody tras sa calkowite po `ceil`),
  NIE udowodniona ogolnie. Wejscia nieskonczone/ulamkowe poza wektorami = NIE_ZMIERZONO.
* Z-Q6-6 ID miast spoza wzorca `city\d+` nie sa "najstarsze" (`cityFoundOrder` = `+Infinity`, scisle `<`), stolica moze byc `None`.
* Z-Q6-7 `dystans` trasy to `u32` (web `number`); ujemny/NaN dystans nieosiagalny.

## 6. Dowody

* Generator `gen-p6-adv-q6-vectors.mjs` (prawdziwy `advanceCityEconomy` i funkcje wejsc z `git archive 4bbef081d gra/src gra/data`, esbuild w
  katalogu poza repo, zero buildu w `gra/`); sklejka `main.ts` przepisana i oznaczona numerami linii (main.ts nieimportowalny). 295 scenariuszy
  (wire 90, route 50, heal 30, barb/rebel 25, mennica 60, econ-params 40), 1049 tickow; fixture `q6.json` 3,7 MB. Generator deterministyczny (`cmp`).
* Test `p6_adv_q6_wire.rs` (2 testy): pelne porownanie bitowe + kontrola negatywna (zmiana dystansu tras rozjezdza >= 80% scenariuszy).
* Weryfikator `verify-p6-adv-q6.py` (`python3 -I`, bez Rust i bez kodu weba): 13 901 sprawdzen, 0 rozbieznosci; kontrola negatywna 2/2
  (`verify-output.txt`). Niezaleznie: dochod z tras, premia budynkowa, bonus Portu, cuda, reczny podatek+stolica, sumy per owner, skarbiec/nauka.
  NIE liczone niezaleznie: tick petli miast, lask po `finalize`, zapasy po odjeciu.
* Mutacje `mutate-q6.py` (`mutacje-wynik.txt`): 70 mutantow, 65 zabitych, 4 rownowazne (M01 `u32`; W07 id cudow unikalne; R12 Mennica omija
  etykiete `Zloto` gdy podano resolver zlota, `building-resource-gate.ts:263-264`, `:277-278`; R21 etykiety traktowane jako zbior), 1 COMPILE.
  Brutto 65/69 = 94,2%. Uwaga: mutacje W01/W02 uruchomiono na rownowaznym tekscie sprzed refaktoru `wonder_bonus_active` (clippy `neg_cmp_op_on_partial_ord`).
* Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`-D warnings`), `gate-test-full.txt` (pelny `cargo test -j 2`: 2057 passed / 0 failed = baza 2055/0 z Q5
  na tym samym commicie bazowym + 2 nowe; PRZED nie mierzono ponownie).

## 7. Zmiany w istniejacych plikach

`domain/mod.rs`: +4 linie `pub mod` (`turn_economy_inputs_{state,trade,wonders}`, `turn_economy_wire`). Brak innych zmian istniejacego kodu.

## 8. Dlug -Q7 (podzial na tematy)

1. `R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1`: wyrownanie `trade.rs` do pinu (krzywe, x2, `ceil/2`) + `refresh_trade_routes` + przeplyw surowcow tras (`main.ts:34470-34498`).
2. `R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1`: blok EmpireFood/auto-racje/atrycja (`main.ts:34594-34850`).
3. `R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1`: zrodla stanu: `ownerCivMap`, `orderMultMap` (lane Porzadku), `ownerDefaultPodzial*`, etykiety aktywne z mapy, natywny dostep do zlota.
4. `R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1`: `effectiveMaxHp`/`unitHealth`/bonusy weterana dla `getMaxHp`.
5. `R-RUSTPORT-P6-ECON-TICK-POST-Q1`: power snapshots, research po bankowaniu, deficyt Zlota, pula Pracy; decyzja o `settle_turn`.

## 9. Ograniczenia zakresu (Obrona R1)

* Zakres dowodu e2e: ciag "tick -> bankowanie" BEZ posrednich mutacji `cities`. Web miedzy tickiem a bankowaniem wykonuje blok EmpireFood
  (`main.ts:34594-34850`) i atrycje oblezenia, ktore zmieniaja populacje/zapasy miast; sumy `sumEconomyForPlayerCities` i odjecie utrzymania
  surowcowego dzialaja tam na stanie zmienionym. Zgodnosc z webem w obecności tych mutacji = NIE_ZMIERZONO, dlug -Q7 pkt 2 i 5.
* `run_economy_tick_for_game` nie ma jeszcze wolajacego w petli tury Rust (wiazanie = funkcja + test, nie podpiecie do `ai_turn`/petli); podpiecie w -Q7.
* Natywny dostep do zlota (`ownerHasNativeResourceAccess(.,'zloto')`, `main.ts:5088-5117`) i etykiety aktywne pozostaja wejsciami wolajacego:
  grant z trasy wymaga `computeTradeRouteResourceGrants(tradeRoutes, ownerHasNativeResourceAccess)` (`main.ts:5125`) dla WSZYSTKICH kluczy
  (braz, zelazo, cegla, zloto, kon), a te zalezą od `placedImprovementsForOwner`, mapy hexow i `computeEmpireLivestockUnlocks` — brak w Rust
  (`grep ownerHasNativeResourceAccess|empireActiveResourceLabelsForOwner` = 0). Port czesciowy bez wektorow z weba lamalby kryterium "plaster z wektorami"; -Q7 pkt 3.
* Mutacje W01/W02 (`wonder_bonus_active`) uruchomiono przed refaktorem; dowod = rownowaznosc tekstu, brutto 94,2% > 90% takze bez tych dwoch.
