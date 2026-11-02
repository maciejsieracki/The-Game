# P6-ADVANCE-CITY-ECONOMY-Q4 - petla miast `advanceCityEconomy` (plony, Wealth, oblezenie, wzrost, manpower)

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1`. Web: `gra/src/game/turn-economy.ts` (pin `4bbef081d`),
petla `for (const city of cities)` `:2277-2913` (konkretnie `:2444-2454` pre-pass, `:2506-2800` ciało pętli).
Rust: `rust-port/engine/src/domain/turn_economy_loop.rs` (NOWY). Baza: `origin/rust-port/parity-v2` @ `9a6bf6eee`.
Zasada właściciela (2026-11-02): port 1:1 z webem; odstępstwo = ZAŁOŻENIE do akceptacji właściciela (sek. 5).

## 1. Cel i wynik

`advance_city_economy_loop(&mut [state::City], &mut BTreeMap<String, CityLoopExtra>, &TerrainContext, &AdvanceCityEconomyInput,
&UpkeepHealthInput, &AdvanceLoopInput) -> AdvanceLoopOutcome` jest PRODUKCYJNYM wołającym nad `state::City`: woła istniejące
`advance_city_economy_resources_with_map` (faza zasobowa + drenaż Mennicy + reconcile capów) i `advance_city_economy_upkeep_health`
(zdrowie), a następnie wykonuje ciało pętli miast w kolejności weba. Wynik niesie `CityEconomyTick` (`CityLoopTick`) per miasto,
sumy `EconomyTickResult` (`cities`, `totalPraca`, `totalPieniadz`, `totalNauka`, `totalLuksus`, `totalKultura`, `totalZywnosc`,
`totalPracaPula`), `incomeByOwner` (`:2468`, wejście przyszłego P23) i wartości pośrednie (`CityLoopDiag`: stolica, dystans,
korupcja, plony przed/po mnożnikach i cudach).

## 2. Tabela plastrów (web plik:linia -> Rust; stan zweryfikowany na parity-v2 `9a6bf6eee`: `git ls-tree` + grep)

| # | Plaster | Web (`turn-economy.ts`) | Rust | Status Q4-Q1 |
|---|---|---|---|---|
| P0 | parametry ekonomii `buildEconParams` | `:270-318`, wołane `:2293` | `economy_city_params.rs:67 load_econ_params` (istniał; tabela -Q1 "brak" była nieaktualna) | WOŁANE w pętli (15 z 25 pól czytane przez pętlę) |
| P12 | stolica / liczba miast per owner (korupcja) | `:2444-2454` | `turn_economy_loop.rs capital_and_city_count_by_owner` | **ZAPORTOWANE** |
| P17a | `toEconomyCity` (podziały Handlu / Pracy) | `:956-991`; `resolveCityPodzialHandlu` `empire-handel-split.ts:21` | `resolve_city_podzial_handlu` (NOWE; wersja Pracy `empire_city_defaults::resolve_city_podzial_pracy` istniała) | **ZAPORTOWANE** |
| P17b | `cityWorkedTilesForEconomy` | `:624-681` | kopia `city_worked_hexes` (prywatna w `turn_economy_territory.rs`, plik poza allowlistą) | **ZAPORTOWANE** (kopia, Z-Q4-2) |
| P17c | korupcja `corruptionRate` + `corruptionBuildingReduction` | `economy.ts` (porty 8F) | `economy_city_fns.rs` (istniały) | **WOŁANE** |
| P17d | `cityBuildingEntriesFromBuiltIds`, `builtIdsForSpichlerzYields`, `cityYieldPerTurn` | `economy.ts:589`, `building-resource-gate.ts:506`, `economy.ts:819` | `economy_city_fns.rs`, `building_costs.rs:1497`, `economy_yield.rs city_yield_per_turn_from_worked_imp` (istniały) | **WOŁANE** (katalog `buildings.json` przez `parse_buildings`) |
| P17e | `applyOrderYieldMults`, `applyWonderCityYields` | `:176`, `:212` | `apply_order_yield_mults`, `apply_wonder_city_yields` (NOWE) | **ZAPORTOWANE** |
| P18 | Wealth (`wealthParamsForOwner`, `advanceWealth`), `splitPraca`, `routeCashForCity`, `manualWorkTax`, handel | `:2625-2662` | `repin_b3::wealth_params_for_owner`, `wealth::advance_wealth`, `production_units::split_praca`, `repin_b3::route_cash_for_city` (istniały), adapter `raw_wealth_from_value` (NOWE) | **WOŁANE + adapter** |
| P19 | oblężenie, bilans żywności, wzrost V8.5 | `:2664-2755` | galaza oblezenia + `compute_city_food_balance_v85` + `compute_growth_percent_v85` (istniały) | **ZAPORTOWANE** |
| P20 | manpower per miasto | `:2750-2773` | `manpower::city_manpower_max`, `tick_manpower_regen`, `civ_manpower_matrix_mults` (istniały) | **WOŁANE** |
| -Q1 dług | `simulateResourcePipelineForPreview` | `:1389-1560` (hunki `:1406`, `:1547`) | `turn_economy_preview.rs simulate_resource_pipeline_for_preview` (NOWE) | **ZAPORTOWANE w rundzie obrony (-Q4b spłacony)**, sek. 3b |
| P23 | utrzymanie per owner (`upkeepBalance`) | `:2840-2884` | `upkeep_balance`, `total_*_resource_upkeep` istnieją | DŁUG -Q5 (bez zmian) |

## 3. Wektory i dowody

* Generator `gen-p6-adv-q4-vectors.mjs`: PRAWDZIWY `advanceCityEconomy` z czystego `git archive 4bbef081d gra/src gra/data`
  (esbuild w katalogu tymczasowym poza repo, zero buildu/dev w `gra/`). Instrumentacja w pamięci (anchory sprawdzane na
  "dokładnie 1 wystąpienie"): zrzut korupcji (`:2602`), plonów po `cityYieldPerTurn` (`:2615`) i po cudach (`:2621`), `incomeByOwner`
  (`:2822`). `civ-matrix.json` nadpisany w pamięci (`matrixPatch`: `wealth_cap_proc`, `wealth_mnoznik_proc`, `mp_max_proc`,
  `mp_regen_proc`, `eko_korupcja_proc`, `eko_handel_brutto_proc` - w prawdziwych danych większość = 0); ta sama podmiana w teście Rust.
* Fixture `tests/p6_adv_q4_vectors/q4.json` 5,94 MB (md5 `a7e17b6dad680f040ed7a5fab2f95cc4`, deterministyczny: 2 przebiegi, ten sam md5):
  642 scenariusze, 1482 ticki (309 oblężonych, 1173 normalnych). Klasy: `plain` 100, `rich` 120 (cuda, mnożniki Porządku, trasy, podatek
  ręczny, podziały Handlu/Pracy z override i domyślnymi, Wealth z immunitetem, manpower, cywilizacje z macierzy), `gate` 70 (resolvery
  etykiet i zapasu - bramka runtime budynków złożowych), `corr` 66 (dystans 0..30 x trudność), `capedge` 27 (brzeg capu korupcji
  N-1/N/N+1 dla cap 0/10/38), `corrmat` 18 (strata po mnożniku macierzy powyżej capu ogona), `siege` 48 (magazyn = zużycie-1/0/+1),
  `wealth` 45 (immunitet 0/1/2/-1/ułamkowy, pula, poziom), `mp` 108 (pula wokół max, epoka, oblężenie), `econ` 40 (grupy/wiersze
  `econ-params` usunięte lub nie-liczbowe).
* Test `tests/p6_adv_q4_pipeline.rs` (1/1): porównanie BITOWE (`assert_bits`) 36 pól `CityEconomyTick` na tick, sum, `incomeByOwner`,
  wartości pośrednich (`y0`, `y1`, korupcja, `nWorked`) i stanu miast po ticku (`wealthState`, `wealthImmunityRemaining`,
  `magazynZywnosci`, `manpower`). Wołający na produkcyjnym `state::City`.
* Weryfikator `verify-p6-adv-q4.py` (`python3 -I`, bez Rust i bez kodu generatora): 61 556 sprawdzeń, 0 rozbieżności (wynik:
  `verify-output.txt`). Liczy niezależnie: stolica/liczba miast/dystans, korupcja, mnożniki Porządku i cuda na plonach (od `y0` weba),
  `cityPracaInteger`, Wealth (z modyfikatorami macierzy), rozwiązanie podziału Pracy, `splitPraca`, pieniądz po Wealth + dochód z tras,
  gałąź oblężenia, tożsamość bilansu żywności, poziom racji i `procentRozwoj`, manpower (max/cur/regen), sumy ticku, dochód per owner.
  Kontrola negatywna: zepsucie 2 wartości w kopii wektora (`wealthMnoznik`, `strataFraction`) -> 2 rozbieżności wykryte.
* NIE liczone niezależnie (web<->Rust tylko w teście Rust): `y0` (teren, budynki, Mennica, kolejność handel->nauka), zdrowie,
  stan Spichlerza/Garncarni, `kosztRacji` (tabela racji), `wzrostProcent`, `normalizePodzialHandlu`, wybór pól roboczych (`nWorked` tylko
  porównany z webem). `okolicaReczne` w pętli: ZMIERZONE w rundzie obrony (fixture `q4c.json`, sek. 3b); NIE_ZMIERZONO: `bagno` zdrowia (założenie Q3).
* Mutacje `mutate.py` (`mutacje-wynik.txt`): 135 mutantów `turn_economy_loop.rs`, 126 zabitych, 9 przeżyło (wszystkie równoważne,
  sek. 6): brutto 93,3 %, netto 100 %.

## 3b. Runda obrony R1 (zarzuty Evaluatora): -Q4b spłacony, tryb ręczny, mutanty

* Port `simulate_resource_pipeline_for_preview(&[City], &TerrainContext, Option<&[TerritoryNode]>, &AdvanceCityEconomyInput) ->
  PreviewPipelineOutcome { spichlerz_by_city, ceramika_by_owner }` (`turn_economy_preview.rs`, NOWY). Przepisuje 1:1 `:1389-1560`:
  liczniki Magazynów (surowe `builtIds`), wejścia terenowe NIEMUTUJĄCO (bez `reconcile_city_worked_tiles`), liczniki Stolarni/Kamieniarni
  (runtime, zapas z resolvera), potem per owner: pula = `ownerResourceStockAll`, faza 1 `credit` (`min(cap, cur + floor(raw * mult))`),
  faza 2 konwertery (bramka runtime widzi bieżącą pulę), faza 3 drenaż Spichlerza po kolei miast. Miasta nie są mutowane (test:
  `assert_eq!(cities, before)`).
* Instrumentacja weba W PAMIĘCI (esbuild plugin dokleja `export { simulateResourcePipelineForPreview as __simPreview }`; plik na dysku
  nietknięty). Generator `gen-p6-adv-q4b-preview-vectors.mjs` jest rozszerzeniem generatora Q4: regeneruje `q4.json` BAJT W BAJT
  (`cmp` = identyczny, md5 `a7e17b6dad680f040ed7a5fab2f95cc4`) i dodatkowo zapisuje `q4b.json` (md5 `67d65fd8b09d365b8feeb1be3e9e5509`,
  1,50 MB) oraz `q4c.json` (md5 `2710675100f8677eee09f94b859ea79e`, 0,48 MB). Każdy plik < 6 MB; SUMA fixture w katalogu 7,92 MB (ZAŁOŻENIE
  Z-Q4b-3: limit 6 MB rozumiany per plik).
* `q4b.json`: 642 scenariusze bazowe (wyniki podglądu dla wejść z `q4.json`) + 1348 scenariuszy własnych (4073 miasta sprawdzone łącznie).
  Klasy własne: `prev` 270 (Spichlerz I/II, Sól, Ceramika N-1/N/N+1 x trudność, Garncarnia/Cegielnia), `prevres` 432 (mapa z
  ulepszeniami, cap magazynu 4/40/150 + 1 za Magazyn, Huta/Odlewnie w mieście A zjadają drewno przed Garncarnią w B), `prevz` 160
  (rzadkie drewno, `ruda_zelaza` konsumuje drewno przed Garncarnią), `prevempty` 12 (zero plonów, pula początkowa PONAD capem),
  `prevmag` 6 (cap = baza + 1 x Magazyny, produkcja Garncarni co do sztuki), `prevgate` 48 (bramka runtime: etykiety + zapas z resolvera
  -> licznik Stolarni), `prevsol` 36 (Sól Spichlerza II pobierana kolejno I/II/II), `prevt` 384 (jedno `tartak`, jedna `kopalnia_zelaza`,
  `econPatch` per trudność: Stolarnia +50 %, drenaż 25/25/30 i 25/25/33, Sól 25/25/21, trudność `hard`, bramka z resolvera).
* Test `tests/p6_adv_q4_preview.rs` (1/1): `ceramika_by_owner` bitowo + 4 flagi `SpichlerzCityBonusState` per miasto.
* Weryfikator `verify-p6-adv-q4b-preview.py` (`python3 -I`, z samych wejść i `econ-params.json`, bez Rust): klasy `prevsol`, `prevempty`,
  `prevmag` (54 scenariusze, 192 sprawdzenia, 0 rozbieżności; kontrola negatywna: 2 zepsute wartości wykryte). Wzory: receptury i
  przepustowość `converters.ts` (+10 % bazy/epokę dla cegielni i garncarni), cap `economy-upkeep.ts` (`(baza + bonus*n) * 2^(epoka-1)`),
  drenaż `building-resource-gate.ts`. NIE liczone niezależnie: wejścia terenowe (`territoryResourceByCity`, `workedMagazynByCity`) w
  klasach z mapami bogatymi (`prev`, `prevres`, `prevz`, `prevgate`, `prevt`) - tylko web<->Rust; w `prevmag` ZAŁOŻENIE "wpływ drewna i
  gliny >= cap".
* Pętla: tryb RĘCZNY (`okolicaReczne`) ZMIERZONY: `q4c.json` = 80 scenariuszy klasy `recz` (139 miast w trybie ręcznym, pop 0/0,4/1/2/3/5/8,
  klucze poza terytorium i poza mapą, wartości 0/1/2/-1/0,5), test `city_loop_manual_mode_matches_running_web` porównuje także
  `okolicaReczne` po reconcile (klucze i wartości).
* Mutacje `mutate-q4b.py` (`mutacje-q4b-wynik.txt`): 50 mutantów (49 w `turn_economy_preview.rs` + L122 w pętli, ponowny pomiar na
  `q4c.json`), 39 zabitych, 11 przeżyło (wszystkie równoważne, sek. 6b): brutto 78,0 %, netto 100 % (39 / 39). Brutto < 90 %, więc próg
  dispatchu spełniony przez "ekwiwalenty z dowodem plik:linia". Mutacje mierzone na finalnej wersji fixture (P01 powtórzony po zmianie
  zapisu warunku na `raw.is_nan() || raw <= 0.0`, wymaganej przez clippy; semantyka bez zmian).

## 4. Dług i podział

* `-Q4b` `simulateResourcePipelineForPreview` (`:1389-1560`, hunki `:1406`, `:1547`): SPŁACONY w rundzie obrony R1 (sek. 3b). Pierwotne
  uzasadnienie długu ("prywatna, wymaga instrumentacji") było słabe - to praca, o którą prosił dispatch. Brak konsumenta w pętli Q4
  zostaje (funkcja zasila podgląd HUD, a wiązanie z grą to -Q5).
* `-Q5` (bez zmian): P23 utrzymanie per owner (`upkeepBalance`, `incomeByOwner` jest już liczone w pętli) + wiązanie z `ai_turn`.
* P24 `manpowerHeal` (S9, zaportowane w -Q1) pozostaje osobnym wołaniem po pętli (web `:2887`); nie wpięte w `advance_city_economy_loop`
  (potrzebuje jednostek `ManpowerHealUnit`, których pętla miast nie ma).
* Nie wpięte w pętlę gry (`ai_turn`/`turn_economy.rs`): NIE_ZMIERZONO, jak w -Q1.

## 5. Założenia (odstępstwa od 1:1 do akceptacji właściciela)

* Z-Q4-1: `state::City` nie ma pól `oblegane`, `garnizon`, `manpower` (`state.rs` poza allowlistą) -> `CityLoopExtra` per `city.id`.
* Z-Q4-2: `city_worked_hexes`, `terrain_web_key`, `hex_like_of` skopiowane do `turn_economy_loop.rs` (oryginały prywatne w
  `turn_economy_territory.rs`; `domain/territory*` poza allowlistą).
* Z-Q4-3: kolejność faz: drenaż Mennicy i reconcile capów PRZED pętlą (web: po). Równoważne: pętla nie czyta ani nie zapisuje
  `City.surowce` (jedyne mutowane pola: `wealth_state`, `wealth_immunity_remaining`, `magazyn_zywnosci` w oblężeniu, manpower w `CityLoopExtra`).
* Z-Q4-4: `civEconomyYieldMultipliers` i `civManpowerMults` zwracają w pinie stałe `{1,1}`; `civBonusyForCivKey` nie jest wołane.
* Z-Q4-5: `WonderYieldBonus` pola nieobecne = 0 (w webie `if (bonus.x)` pomija `undefined`, 0 i NaN - jednakowo).
* Z-Q4-6: `Cargo.lock` generowany lokalnie, NIEcommitowany.
* Uwaga do -Q5 (Z-Q4-3): `resolveOwnerZlotoAccess` jest wejściem wstrzykiwanym (nie odczytem magazynu), więc przesunięcie drenażu Mennicy
  przed pętlę jest równoważne. Przy wiązaniu z `ai_turn` trzeba sprawdzić, czy resolver właściciela nie zależy od stanu PO drenażu
  (web `:2822-2832` woła go po pętli, Rust przed).
* Z-Q4b-1: wejścia terenowe podglądu liczone NIEMUTUJĄCO z publicznych funkcji `turn_economy_territory.rs` i `okolica`
  (`compute_lost_to_nearer_sibling_by_city`, `compute_territory_resource_yield_by_city`, `compute_worked_magazyn_yields_by_city`); brak
  `reconcile_city_worked_tiles`, bo podgląd w webie jest tylko do odczytu.
* Z-Q4b-2: `territory_nodes = None` odpowiada `territoryNodes ?? buildTerritoryNodesFromCities(cities)` (`:1901`).
* Z-Q4b-3: limit fixture 6 MB rozumiany per plik (7,92 MB łącznie w `tests/p6_adv_q4_vectors/`).
* Z-Q4b-4: weryfikator Python liczy niezależnie tylko klasy bez bogatego terenu (sek. 3b); reszta web<->Rust.
* Z-Q4-7: tabela -Q1 (P0 "brak") skorygowana: `load_econ_params` istnieje od 8F-P2.

## 6. Mutanty równoważne (9 z 135) - dowody plik:linia

* L19 `unwrap_or(1.0)` -> `0.0` dla liczby miast: `capital_and_city_count_by_owner` (`turn_economy_loop.rs`, pętla `for c in cities`)
  wstawia licznik dla właściciela KAŻDEGO miasta, więc `get(&owner_id)` zawsze trafia; gałąź `unwrap_or` nieosiągalna.
* L21 redukcja korupcji z `runtime` zamiast surowych `builtIds`: Sad/Pretorium/Pałac nie mają bramki runtime
  (`building_costs.rs:1189` `!has_deposit_runtime_gate`; web `building-resource-gate.ts:64-76` lista DEPOSIT_LINKED bez tych id),
  więc `runtime` zawiera je zawsze, gdy są w `builtIds`.
* L50 `unlocked` -> `None`: jedyny budynek z `poziomTechGate` to `biblioteka` (`{"6": "Astronomia"}`, `data/buildings.json`), a
  `maksPoziom` wszystkich budynków ∈ {1,2,3}; `building_level_for_epoch` (`production_units.rs:526-528`) wymaga `level >= 6`.
* L53 `baza_zadowolenie` -> `Some(0.0)`: wpływa tylko na `CityYieldOutput.zadowolenie`, którego pętla nie czyta (web
  `turn-economy.ts:222-225`: zadowolenie nie jest propagowane do ticku).
* L97 `wealth_poziom` w `GrowthPercentInput` -> `0.0`: `compute_growth_percent_v85` (`city_growth.rs:1218-1244`) nie czyta tego pola.
* L98 klucz cywilizacji `''` bez filtra: `''` nie rozwiązuje wiersza macierzy, `defaults.mp_regen_proc = mp_max_proc = 0`
  (`data/civ-matrix.json`), mnożnik `1 + 0 = 1` jak dla `None` (web `manpower.ts`: `if (!civKey) return undefined` -> 1).
* L122 `pop <= 0` -> `pop < 0` w `city_worked_hexes`: dla `pop = 0` `resolve_worked_tiles` obcina wynik do `pop` pól
  (`okolica/auto.rs:104-105`), czyli do 0 przypisanych pól. Tryb ręczny z niepustym `okolicaReczne` ZMIERZONY w rundzie obrony
  (`q4c.json`, 139 miast ręcznych, pop 0 i 0,4): mutant nadal przeżywa, czyli równoważność potwierdzona także tam.
* L126 `zloze` -> `None` w kafelku: wpływa wyłącznie na `ruda_terenu` / `ruda_zelaza_terenu` (`economy_yield.rs`
  `ore_yield_from_improvements`), których pętla nie czyta.
* L135 `.filter(|_| true)` to mutant no-op (tożsamość); wliczony w 135 dla jawności.

## 6b. Mutanty równoważne -Q4b (11 z 50) - dowody plik:linia

Zakres obserwowalny funkcji: wynik to wyłącznie `spichlerz_by_city` i `ceramika_by_owner`. Wejścia receptur
(`turn_economy_resources.rs:48-131`) to wyłącznie `glina`, `drewno`, `ruda`, `ruda_zelaza`, `ruda_cyny`, `zelazo`; wyjścia `cegla`,
`ceramika`, `braz`, `zelazo`, `stal`. Bramka runtime dotyczy tylko budynków z `data/derived/building-cost-params.json` `bramka.zloza_budynkow`
(`garncarnia`, `cegielnia` - Glina; `stolarnia` - Drewno; `kamieniarski` - Kamień; `kuznia`, `odlewnia_brazu` - Ruda; `mennica` - Złoto;
`spichlerz_ii` wykluczony, `building_costs.rs:1115-1130`). Pule `kamien`, `zloto`, `kon` nie są wejściem żadnej receptury ani etykietą
bramki budynku-konwertera, więc nie wpływają na wynik.

* P03 `floor` -> brak, P04 `floor` -> `ceil`, P07 mnożnik Kamieniarni (`turn_economy_preview.rs:161`), P08 znak `worked.kamien`: dotyczą
  wyłącznie puli `kamien` (nieobserwowalna, patrz wyżej).
* P14 pominięcie `credit(... "kon" ...)` (`:191`), P16 pominięcie `credit(... "zloto" ...)` (`:190`): pule `kon`/`zloto` nieobserwowalne.
* P20 licznik Kamieniarni (`:132`): zasila wyłącznie `kamien_mult` (`:161`), czyli pulę `kamien`.
* P06 `drewno_credit > 0.0` -> `>= 0.0` (`:168`): `credit` (`:51`) pomija `raw <= 0`, więc wywołanie z 0 jest no-opem.
* P28 pominięcie `continue` przy `recipes.is_empty()` (`:213`): `run_converters` (`turn_economy_resources.rs:260`) dla pustej listy zwraca
  kopię puli bez zmian.
* P47 `owner_zloto_access` -> `None` (`:114`): resolver czytany wyłącznie przez bramkę Mennicy (`building_costs.rs:1140`
  `mennica_runtime_gate_met`), a Mennica nie jest konwerterem ani Stolarnią/Kamieniarnią.
* L122: patrz sek. 6 (zmierzone także w trybie ręcznym).
