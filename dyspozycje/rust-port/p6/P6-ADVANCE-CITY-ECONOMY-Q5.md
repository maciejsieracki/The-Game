# P6-ADVANCE-CITY-ECONOMY-Q5 - `advance_city_economy` (P23 utrzymanie per owner, koncowka ticku, wiazanie)

Temat: `R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1`. Web: `gra/src/game/turn-economy.ts` (pin `4bbef081d`), `advanceCityEconomy`
`:2250-2913`, `EconomyTickResult` `:1108-1148`. Rust: `rust-port/engine/src/domain/turn_economy_tick.rs` (NOWY, +1 linia `pub mod` w `domain/mod.rs`).
Baza: `origin/rust-port/parity-v2` @ `fb417eebd`. Zasada wlasciciela: port 1:1; odstepstwo = ZALOZENIE do akceptacji.

## 1. Wynik

`advance_city_economy(&mut [City], &mut extras, &TerrainContext, &AdvanceCityEconomyInput, &UpkeepHealthInput, &AdvanceLoopInput,
&[EconUnit], Option<HealRequest>) -> AdvanceTickOutcome { result: EconomyTickResult, city_loop, heal }` sklada plastry w kolejnosci weba:
faza zasobowa + drenaz Mennicy + reconcile (`advance_city_economy_resources_with_map`) -> zdrowie/P4/P5 (`..._upkeep_health`) -> petla miast
(`advance_city_economy_loop`) -> P23 (`compute_owner_upkeep`) -> P24 `manpowerHeal` (opcjonalny). `EconomyTickResult` ma WSZYSTKIE 16 pol weba
(`perCity`, `cities`, 7 sum `total*`, `growth`, `starved`, `upkeepByOwner`, 3x `resourceUpkeep*ByOwner`, `pracaUpkeepByOwner`).

## 2. Tabela plastrow (stan koncowy: 100%)

| # | Plaster | Web | Rust | Status |
|---|---|---|---|---|
| P0-P22 | parametry, teren, zasoby, zdrowie, petla miast, Wealth, wzrost, manpower | `:2293-2800` | `turn_economy_{advance,resources,upkeep,health,loop,territory,preview}.rs` | ZAPORTOWANE (-Q1..-Q4) |
| P4 | `pracaUpkeepByOwner` w wyniku | `:2320`, `:2469` | `UpkeepHealthOutcome.praca_upkeep_by_owner` -> `EconomyTickResult.praca_upkeep_by_owner` | ZAPORTOWANE (-Q3, zlozone -Q5) |
| P23 | utrzymanie per owner (`upkeepBalance`, 3 mapy utrzymania surowcowego) | `:2834-2884` | `turn_economy_tick.rs compute_owner_upkeep` | **ZAPORTOWANE (-Q5)** |
| P24 | `manpowerHeal` | `:2887-2909` | `advance_manpower_heal` (-Q4b), wolane z `advance_city_economy` | ZAPORTOWANE |
| - | `growth`/`starved` | `:2463-2464` (zawsze 0) | stale 0.0 | ZAPORTOWANE (Z-Q5-3) |
| - | wiazanie z petla gry | `main.ts:34540` | `turn_economy_wire::run_economy_tick_for_game` | **ZAPORTOWANE w -Q6** (`P6-ADVANCE-CITY-ECONOMY-Q6.md`; reszta = dlug -Q7) |

## 3. Z-Q4-3 (drenaz Mennicy przed vs po petli) - ZBADANE

Web: drenaz `:2822-2832` jest PO petli; Rust `advance_city_economy_loop` liczy faze zasobowa (z drenazem) PRZED petla. Resolvery
(`main.ts:5210-5253`: `makeOwnerZlotoAccessResolver`, `makeOwnerRuntimeActiveLabelsResolver`, `makeOwnerEmpireStockResolver`) sa MEMOIZOWANE
per owner przy PIERWSZYM wolaniu (`cache.get -> accessFn -> cache.set`), a pierwsze wolanie nastepuje w `turn-economy.ts:2373-2402` / `:1665-1678`,
czyli PRZED drenazem. Pomiar na uruchomionym webie (znaczniki fazy w pamieci, `q5.json`, klasa `live`, 90 scenariuszy): 328 pierwszych wolan,
**0 po drenazu**, 308 w fazie 0 (przed pipeline); kontrfaktyczna wartosc po drenazu rozni sie w 18 przypadkach, wiec snapshot jest NIEZBEDNY.
Wniosek: resolver wstrzykniety jako wartosc z pierwszego wolania (kontrakt `&dyn Fn`) daje wynik identyczny z webem (test
`zloto_resolver_is_snapshot_before_drain_z_q4_3`). Kolejnosc drenaz-przed-petla nie zmienia `City.surowce` czytanego przez petle, bo petla czyta
je wylacznie przez resolvery. Z-Q4-3 ZAMKNIETE jako zalozenie Z-Q5-1 (do akceptacji).

## 4. Wiazanie z petla gry - DLUG -Q6 (dowod)

Web wola `advanceCityEconomy` raz na ture: `main.ts:34540` z ~26 argumentami. Rust (`rust-port/engine/src`):
* `settle_turn`/`resolve_turn` (`domain/turn_economy.rs:250`, `:299`, `:310`) nie maja zadnego wolajacego poza reeksportem `lib.rs:46`
  (grep `settle_turn|resolve_turn` po `engine/src` i `src-tauri`); rozliczacz dziala na `EconomyBalances` `u64` (Skarb/Nauka/Kultura/Zywnosc/Praca-pula),
  inny kontrakt niz web (`f64`, per owner, `EconomyTickResult`).
* `ai_turn.rs` nie czyta ani nie zapisuje ekonomii (grep `economy|treasury|surowce` - tylko wagi `archetype.economy`).
* Brakujace wejscia na stronie wolajacej (nie istnieja w Rust jako stan gry): `tradeIncomeByCity` + `maritimeTradeIncomeByCity` (trasy handlowe),
  `manualWorkTaxByCity`, `tradeRouteBuildingBonusByCity`, `cityRelig`, `buildWonderCityYieldsByOwnerMap`, `ownerCivMap`/`orderMultMap`/`growthMultMap`,
  `ownerDefaultPodzialHandlu/Pracy`, zywe `units` + `getMaxHp` (`main.ts:34569-34585`), stan lask Mennicy (`prepareMennicaZlotoGraceForTick`).
* Brak mapowania `EconomyTickResult` -> `EconomyBalances u64` (zaokraglenia, per owner vs jeden skarb, ujemne wartosci).
Wpiecie dalo by czesciowy tick lub nowy kontrakt; nie zgaduje. **-Q6**: (a) adapter stanu gry -> `AdvanceCityEconomyInput`/`CityLoopMaps`,
(b) kontrakt `EconomyTickResult` -> `settle_turn`, (c) trasy handlowe/religia/cuda jako wejscia. Status: JAWNY DLUG.

## 5. Zalozenia (do akceptacji wlasciciela)

* Z-Q5-1 domkniecie Z-Q4-3 (sek. 3). * Z-Q5-2 `EconUnit` bez `category` (web: `as unknown as UnitUpkeepLike[]`, `:2867`) -> pusty napis.
* Z-Q5-3 `growth=starved=0`. * Z-Q5-4 mapy per owner jako `BTreeMap` (kolejnosc kluczy JS `Map` niezachowana; porownanie po kluczach).
* Z-Q5-5 komorki `units.json` "Utrzymanie surowiec" inne niz tekst/null nie wystepuja (74 napisy, 1 null).
* Z-Q5-6 fixture `q5.json` 4,86 MB + 6 tabel utrzymania jednostek (~4,5 KB); kazdy plik < 6 MB.

## 6. Dowody

* Generator `gen-p6-adv-q5-vectors.mjs`: prawdziwy `advanceCityEconomy` z `git archive 4bbef081d gra/src gra/data` (esbuild w katalogu poza repo, zero
  buildu w `gra/`); 680 scenariuszy. Test `tests/p6_adv_q5_tick.rs` (2 testy): porownanie wszystkich pol `EconomyTickResult`, stanu miast, leczenia
  i snapshotu resolvera.
* Weryfikator `verify-p6-adv-q5.py` (`python3 -I`, bez Rust): 20 843 sprawdzen, 0 rozbieznosci; kontrola negatywna 2/2 (`verify-output.txt`).
  Niezalezne: poziom budynku, utrzymanie zlota (budynki/jednostki), saldo/deficyt, utrzymanie surowcowe, scalenie, zbior ownerow, sumy, niezmienniki Z-Q4-3.
  NIE liczone niezaleznie: `pracaUpkeepByOwner`, `incomeByOwner`, petla miast, leczenie P24, wartosci zywych resolverow.
* Mutacje `mutate-q5.py` (`mutacje-wynik.txt`): 50 mutantow, 49 zabitych (98 %), 1 rownowazny. T12 (`turn_economy_tick.rs:180`, pominiecie miasta bez
  budynkow): rownowazny - pusta lista vs brak wpisu daje to samo, bo `buildingsByOwner.get(oid) ?? []` (web `:2872`) / `unwrap_or(&no_buildings)` (Rust `:225`).
* Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`-D warnings`), `gate-test-full.txt` (pelny `cargo test -j 2`: 2055 passed / 0 failed; baza `fb417eebd`
  2053/0 + 2 nowe), wszystkie `EXIT=0`.
* Naprawa z wznowienia: WIP `401af127e` mial polowiczna edycje (`total_unit_resource_upkeep(&[], ..)`, zmienna `refs` nieuzywana) - oba testy padaly;
  poprawione na `&refs` (mutant T23 to potwierdza: KILLED).

## 7. Zmiany w istniejacych plikach

`domain/mod.rs`: +`pub mod turn_economy_tick;`. Brak innych zmian istniejacego kodu. Dokumenty -Q1/-Q4: tabela P23 zaktualizowana.
