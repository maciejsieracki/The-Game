# P6-ECON-TICK-EMPIREFOOD - blok EmpireFood / auto-racje / atrycja miedzy tickiem a bankowaniem

Temat `R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1`. Dlug -Q7 pkt 2 z `P6-ADVANCE-CITY-ECONOMY-Q6.md` sek. 8. Pin weba `4bbef081d`
(parity-v2 baza `40c358d6f`). Zasada wlasciciela: port 1:1; odstepstwo = ZALOZENIE do akceptacji.

## 1. Wynik w skrocie

* Rdzen bloku (`advanceEmpireFood`, auto-racje, `maxSafe`, `recompute...`, `cityPopulationCap`) JUZ ISTNIAL w `domain/city_growth.rs`
  (`p6_7a`, wektory `tests/p6_7a_empire.rs`). Brakowalo: kosztu armii ze Spichlerzem/Sola, sum zywnosci, atrycji HP, sprzatania po
  zniszczonych jednostkach, czystej czesci N3 (atrycja garnizonu oblezonych) i **wpiecia** w `run_economy_tick_for_game`.
* NOWE: `domain/turn_economy_empirefood.rs`, `domain/turn_economy_attrition.rs`; `turn_economy_wire.rs` addytywnie
  (`run_economy_tick_for_game_with_food`; `run_economy_tick_for_game` = wrapper z `food = None`, zachowanie bez zmian).
* Test e2e `tests/p6_empirefood_e2e.rs` (347 scenariuszy z URUCHOMIONEGO weba, 1314 tickow): tick -> EmpireFood/auto-racje/atrycja/N3
  -> bankowanie, bit w bit.

## 2. Falsyfikacja przesłanki dispatchu (dowod)

Dispatch/Q6 sek. 9 zakladaly, ze blok "zmienia `cities` (populacja, zapasy)". Pomiar na pinie:

* `advanceEmpireFood` NIE mutuje miast ani ticku (`empire-food.ts:186-300`: zapisuje tylko `st.zapasyPanstwa`, `st.turyUjemnychZapasow`).
* Auto-racje mutuja WYLACZNIE `city.poziomRacji` (+ domyslne pola `ensureCityRationDefaults`: `rationMigratedV114`, `wzrostUlamkowy`,
  `turyBezDoplaty`, `hungerLossUlamkowy`; `population-growth-v85.ts:391-412`) oraz pola zywnosci ticku
  (`kosztRacji`, `bilansLokalny`, `zywnoscNetto`, `poziomRacji`; `turn-economy.ts:1620-1651`) i `totalZywnosc`.
* Populacje zmienia `applyPostCentralPopulationGrowth` w `main.ts:36060`, czyli PO bankowaniu (`:35045-35131`), nie w bloku.
* Sumy `sumEconomyForPlayerCities` czytaja `pieniadz/nauka/doPuli/praca/kultura/pieniadzZTras` (`turn-economy.ts:1161-1216`), a odjecie
  utrzymania surowcowego dziala na `city.surowce` - zadne z tych pol nie zalezy od pol zywnosci. Wniosek: bankowanie jest
  niezalezne od bloku EmpireFood; e2e mierzy to liczbowo (bankowanie po bloku = web) i dodatkowo pola zywnosci ticku.
* PRAWDZIWA mutacja `cities` miedzy tickiem a bankowaniem to blok N3 "TURA OBLEZENIA" (`main.ts:34986-35040`): `resolveSiegeSurrender`
  (`:15870+`) zmienia `ownerId` miasta (przejecie przez oblegajacego). Ta czesc NIE jest zaportowana (dlug, sek. 8 pkt 1);
  zaportowano jej czysta czesc (atrycja garnizonu + `syncGarnizonForCity`).

## 3. Tabela bloku (web plik:linia -> funkcje/pola -> Rust)

Legenda: ISTNIAL = bylo w `p6_7a` przed tematem (wektory `p6_7a_empire.rs`); NOWE = ten temat; DLUG = sek. 8.

| # | Web (pin) | Funkcja / pole | Rust | Status |
|---|---|---|---|---|
| 1 | `main.ts:34591-34592` | `loadUpkeepParams`, `buildEmpireFoodParams` | `economy_upkeep_p2::load_upkeep_params` (`turn_economy.rs:1604`), `empire_food::build_empire_food_params` (`city_growth.rs:1866`) | ISTNIAL; wpiete NOWE |
| 2 | `empire-food.ts:136` | `freshEmpireFoodState` | `fresh_empire_food_state` (`city_growth.rs:1901`) | ISTNIAL |
| 3 | `main.ts:34594-34608` | mapa Spichlerza per miasto z ticku | `spichlerz_state_of` (`turn_economy_empirefood.rs`) | NOWE |
| 4 | `main.ts:34625-34636` | `cityPopulationCap`, `resolvePopulationCapMatrixDelta`, `cityHasSpichlerzBuilding` | `p6_7a::city_population_cap` (`:893`), `resolve_population_cap_matrix_delta_in` (`:924`), `city_has_spichlerz_building` (`:815`) | ISTNIAL; `PopCapParams` z `econ_params` wejscia - NOWE |
| 5 | `main.ts:34637-34643` | `ownerIdsForAutoRation` (miasta, potem klucze stanow; `>= 0`) | `run_empire_food_block` | NOWE |
| 6 | `turn-economy.ts:1325-1349` | `militaryFoodConsumptionWithSpichlerz` (+ `unitFoodPerTurn`, `spichlerzArmyFoodCostMultiplier`) | `military_food_consumption_with_spichlerz`; `unit_food_per_turn` (`turn_economy.rs:2049`), `spichlerz_army_food_cost_multiplier` (`building_costs.rs:1525`) | NOWE (skladniki ISTNIALY) |
| 7 | `empire-food.ts:805` | `autoBalanceRationsToSolvency` | `auto_balance_rations_to_solvency` (`city_growth.rs:2616`) | ISTNIAL |
| 8 | `empire-food.ts:873` | `autoRaiseRationsForGrowth` | `auto_raise_rations_for_growth` (`:2683`) | ISTNIAL |
| 9 | `main.ts:34706-34708`, `turn-economy.ts:1654` | `refreshEconomyFoodTotals` | `refresh_economy_food_totals` | NOWE |
| 10 | `main.ts:34710-34747`, `empire-food.ts:948` | clamp foteli czlowieka, `maxSafePoziomRacjiForCity` | `max_safe_poziom_racji_for_city` (`:2756`) + petla w `run_empire_food_block` | ISTNIAL + NOWE (petla) |
| 11 | `turn-economy.ts:1620` | `recomputeCityFoodBalancesInEcon` | `recompute_city_food_balances_in_econ` (`:1742`) | ISTNIAL |
| 12 | `main.ts:34749`, `empire-food.ts:186` | `advanceEmpireFood` | `advance_empire_food` (`:2125`) | ISTNIAL |
| 13 | `main.ts:34777`, `:29894-29906` | `syncAllRuntimeUnitHpState` | `sync_runtime_unit_hp_state` (attrition) | NOWE (`maxHp` = closure wolajacego) |
| 14 | `army-starvation.ts:58-87` | `applyArmyStarvationHpLoss` (+ `isCivilianUnit`) | `apply_army_starvation_hp_loss` (attrition); `recruitment::is_civilian_unit` | NOWE |
| 15 | `main.ts:34796-34830` | usuniecie zniszczonych, `endMapSiege` (czesc silnikowa), `syncGarnizonForCity` | `cleanup_after_starvation_destroy` | NOWE |
| 16 | `main.ts:34986-35004` | N3: atrycja garnizonu miast oblezonych + `syncGarnizonForCity` | `siege_turn_garrison_attrition` | NOWE |
| 17 | `main.ts:34832-34851`, `:34766` | komunikaty HUD, `_maxSafeRationCache.clear()`, `refreshFog` | liczniki w `EmpireFoodBlockOutcome` | DLUG (UI), dane zwracane |
| 18 | `main.ts:35005-35030` | N3: `handleSiegeCapitulationPhase`, `resolveSiegeSurrender` (zmiana wlasciciela), `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines` | brak | DLUG (sek. 8 pkt 1) |
| 19 | `main.ts:34861` | `sumEconomyForPlayerCities` | `sum_economy_for_player_cities` (`turn_economy_wire.rs`) | ISTNIAL (-Q6) |
| 20 | `main.ts:35045-35131` | bankowanie | `OwnerBank` (-Q6), teraz PO bloku | ISTNIAL; kolejnosc NOWE |

Pokrycie: 20/20 pozycji sklasyfikowanych (zaportowane lub istniejace: 17; dlug z dowodem: 3 = #17, #18, czesc UI #13/`effectiveRuntimeUnitMaxHp`).

## 4. Zalozenia (do akceptacji wlasciciela)

* Z-EF-1 Rust `City` (`state.rs`) nie ma pol `oblegane`, `oblegajacyOwnerId`, `garnizon`, `siegeMachines` (grep `oblegane|garnizon|siege` po `state.rs`:
  tylko `garnizon_count` w innej funkcji). Stan oblezenia = `SiegeCityState` dostarczany przez wolajacego; modul nie dotyka `City`.
* Z-EF-2 `endMapSiege` (`main.ts:16076-16091`) ma tez efekty UI/AI (`siegeAiStateByKey`, `refreshSiegeMarkers`, `hideSiegeMapPanel`) - nie portowane;
  zwracana lista `ended_sieges`. Czesc silnikowa zaportowana.
* Z-EF-3 `cityAtUnit` (`main.ts:11672`) = pierwsze miasto tego samego `ownerId` na heksie jednostki.
* Z-EF-4 Blok zmienia `cities` tylko w `poziomRacji` i polach domyslnych racji (sek. 2). `hungerLossUlamkowy` nie ma pola w `City`
  (wlasnosc `GrowthCity`), zwracane w `hunger_loss_by_city`.
* Z-EF-5 HUD/UI (`showHintMessage`, `refreshFog`, `_maxSafeRationCache`, `pendingAutoRationForNextTurn`) poza silnikiem; `pending_auto_ration` i liczniki
  gracza (`ownerId === 0`) zwracane jako dane.
* Z-EF-6 Clamp (`main.ts:34710-34747`) wola `maxSafePoziomRacjiForCity` BEZ `humanOwnerIds` i BEZ `kosztArmii` (domyslne `[0]`, `0`) mimo petli po
  `humanSeats.humanOwnerIds` - odtworzone doslownie (potencjalny blad weba dla foteli != 0; NIE poprawiany: 1:1).
* Z-EF-7 `ownerCitiesForAutoAdjust` uzywa `isCityAutoWyzywienieEnabled(c)` z domyslnym `humanOwnerIds=[0]` (jak web i port `p6_7a`).
* Z-EF-8 `syncRuntimeUnitHpState`: `u.hp === undefined` modelowane jako `Option::None`; `null` w webie dalby `Number.isFinite(null) = false` -> `maxHp`
  (port: brak zmiany). NIE_ZMIERZONO dla `hp = null` (generator nie produkuje).
* Z-EF-9 `econUnits.garrisonCityId` ustawiane wylacznie gdy `inGarnizon` (`main.ts:34433`), co czyni warunek `u.in_garnizon` w
  `militaryFoodConsumptionWithSpichlerz` nieobserwowalnym (mutant F02).

## 5. Dowody zgodnosci

* Wektory: `tests/p6_empirefood_vectors/empirefood.json` (5,95 MB < 6 MB), generator `runs/.../gen-p6-empirefood-vectors.mjs` z czystego
  `git archive 4bbef081d` (esbuild w `/tmp/.../work`, zero buildu w `gra/`). Uruchamiane PRAWDZIWE `advanceCityEconomy`, `advanceEmpireFood`,
  `autoBalanceRationsToSolvency`, `autoRaiseRationsForGrowth`, `maxSafePoziomRacjiForCity`, `recomputeCityFoodBalancesInEcon`,
  `refreshEconomyFoodTotals`, `militaryFoodConsumptionWithSpichlerz`, `applyArmyStarvationHpLoss`, `cityPopulationCap`,
  `effectiveMaxHp`, `veteranCombatBonusFrac`. Sklejka `main.ts:34594-34830`, `:34986-35004` i `endMapSiege` PRZEPISANA w generatorze
  (`main.ts` nieimportowalny), oznaczona numerami linii. Scenariusze: 347 (klasy: ef 70, army 55, siege 40, human 55, ai 20, barb 15, econ 30,
  edge 62), 1314 tickow miast, 829 tickow panstwa; pokrycie: korekta racji 318, pending 161, clamp 49, atrycja 136, zniszczone 119, oblezenie
  zakonczone 15, garnizon 82, N3 133 (w tym 33 ze zniszczeniami).
* Test `empire_food_block_matches_running_web`: bit w bit (`f64::to_bits`) - tick petli po bloku (36 pol), sumy, bankowanie, tiki panstwa (20 pol + wiersze),
  stany, korekty racji, `popCap`, koszt armii, jednostki (hp, hpMax, oblegaCityId), oblezenia, besieger, garnizony, N3.
* Kontrola negatywna: zmiana zapasow panstwa +7 rozjezdza 331/331 scenariuszy ze stanami.
* Weryfikator `verify-p6-empirefood.py` (`python3 -I`, bez Rust i bez kodu weba): 22 505 sprawdzen, 0 rozbieznosci; kontrole negatywne 2/2.
  Liczy niezaleznie: pule centralna, cap (baza + Magazyny + Spichlerze x 2^(era-1)), glod, licznik tur, flage atrycji, strate HP, sprzatanie oblezen,
  garnizony, N3. NIE liczy: kosztu armii z tabeli jednostek, wyboru poziomow przez auto-korekte (tylko niezmienniki).

## 6. Mutacje

104 mutanty (`mutate-empirefood.py`, wynik `mutacje-wynik.txt`): w R1 zabite 93, zywe 11 (brutto 89,4%). Obrona R1: A05 zabity
testem jednostkowym `tests/p6_empirefood_unit.rs` (`hpMax = 0`, sprawdzone recznie: mutant `< 0` -> 2 z 3 testow FAILED) =>
**zabite 94/104 = 90,4% brutto (>= 90%); pozostale 10 rownowaznych z dowodem** (dispatch dopuszcza "ekwiwalenty z dowodem").
Wszystkie ekwiwalenty opieraja sie na niezmienniku WYWOLUJACEGO (nie logicznej rownowaznosci funkcji). Dowody rownowaznosci zywych:

| Mutant | Dowod |
|---|---|
| A08 brak `max(0, ..)` w `hp` | `hp <= 0` => jednostka niszczona i USUWANA z listy (`army-starvation.ts:83`, `main.ts:34813`); ujemne hp nieobserwowalne |
| A11, N04 brak backfillu `hpMax` | `syncAllRuntimeUnitHpState` (`main.ts:34777`) ustawia `hpMax` wszystkim przed atrycja; N3 dziala na tych samych jednostkach |
| A12 brak backfillu `hp` | `u.hp` ustawiane i natychmiast uzywane w tej samej funkcji (`unwrap_or(max_hp)`) - identyczny wynik |
| C14 brak `delete u.oblegaCityId` | `endMapSiege` wolane tylko gdy `stillMarked == false` (`main.ts:34817`), wiec zadna jednostka nie ma tego id |
| F02 brak warunku `in_garnizon` | Z-EF-9: `garrisonCityId` tylko dla `inGarnizon` (`main.ts:34433`) |
| F07 `zywnosc_netto` zamiast `bilans_lokalny` | w momencie `refresh` kazdy tick przeszedl `recompute...` (`netto = bilans`, `turn-economy.ts:1648`) |
| F17, F18 `sol_active`/`ceramika_active` | mnoznik kosztu racji czyta tylko `maSpichlerzPop`/`maSpichlerzIIPop` (`building-resource-gate.ts:484`, `city_growth.rs:833`) |
| F27 pominiecie kluczy stanow | wlasciciele bez miast: `autoBalance`/`autoRaise` zwracaja `adjusted:false` przy 0 miast (`empire-food.ts:811-813`, `:879-881`) |

Mutanty uzupelniajace wektory: A15 (nieskonczone hp), C02/C05 (brzegowe oblezenia), N02 (garnizon obcego wlasciciela w N3) zabite po dopisaniu scenariuszy
(dopisywane NA KONCU generatora - wczesniejsze scenariusze bez zmian, sprawdzone rownoscia JSON).

## 7. Bramki (po ostatniej zmianie kodu)

`gate-fmt.txt`, `gate-clippy.txt` (`--all-targets -D warnings`), `gate-test-lib.txt` + `gate-test-s0..s7.txt` (pelny `cargo test -j 2`, 279 plikow
testowych w 8 shardach), `git diff --check` po `git add -N`. Baza dispatchu 2072/0; PO = baza + 2 nowe testy (zob. raport).

## 8. Dlug z podzialem (-Q8)

1. `R-RUSTPORT-P6-ECON-TICK-SIEGE-PHASE-Q1`: reszta N3 (`main.ts:35005-35030`): `handleSiegeCapitulationPhase`, `resolveSiegeSurrender` (**zmienia
   `ownerId` miasta przed bankowaniem** - jedyna realna mutacja `cities` miedzy tickiem a bankiem), `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`;
   wymaga pol oblezenia w `City`/modelu oblezenia i modulow siege/AI/capture.
2. `R-RUSTPORT-P6-ECON-TICK-POST-Q1` (jak w Q6 pkt 5): `applyPostCentralPopulationGrowth` (`main.ts:36060`, istnieje w `p6_7a`) po bankowaniu, research, deficyt zlota,
   pula Pracy, power snapshots; wpiecie `run_economy_tick_for_game_with_food` w petle tury (brak wolajacego).
3. Zrodla stanu wejsc bloku (wolajacy): `econUnits` z `isCampingForFoodDiscount` (`main.ts:19481`) i `territoryOwnerAt` (`:34423-34428`), `typCityCopyOwners`,
   `humanSeats`, `effectiveRuntimeUnitMaxHp` z `unitDefFor` (`militiaDefOverrides`), `unitHealth` z `data.units`.
4. UI: `showHintMessage`, `refreshFog`, `_maxSafeRationCache`, `pendingAutoRationForNextTurn` (dane zwracane, efekty u wolajacego).
5. Inne wywolania `maxSafePoziomRacjiForCity`/`applyLiveSafeRationForCity` poza blokiem (po przyroscie ludnosci) - zakres wzrostu ludnosci.
