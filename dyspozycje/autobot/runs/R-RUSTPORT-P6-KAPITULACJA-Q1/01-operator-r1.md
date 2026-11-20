# R-RUSTPORT-P6-KAPITULACJA-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-KAPITULACJA-Q1 (kapitulacja głodowa oblężenia, W3/W4/W5)
GOAL: kapitulacja głodowa miasta pod oblężeniem działa w produkcyjnym ticku gry (`PlayableGame::advance_turn`, faza
Economy = blok N3 „TURA OBLEZENIA” pinu), 1:1 z pinem `07d2fbd72`: flaga kapitulacji, `resolveSiegeSurrender`, zapis
akumulatorów zdobyczy.
BAZA: `origin/rust-port/parity-v2` = `e1f61c503c7c48d9cb9183d462a2b698ee490ab4` (w chwili startu, zgodnie z dispatchem).
GAŁĄŹ: `rust-port-wip/kapitulacja-q1` (worktree workflow). Commity kodu: `003b295b0`, `643c1a5ec`, `44a242f1a`,
`9863a83c9`; raport w commicie następnym (SHA w wyniku Operatora).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web (pin `07d2fbd72`, przeczytany przed kodem)

- `main.ts:38808-38878` blok N3 (w `runWorldEndTurn`, po ticku ekonomii): dla `tick of econ.perCity` z `tick.oblegany`:
  `siegeDefenderUnits` → `siegeStarvationState` → `recordStart` / atrycja `applyArmyStarvationHpLoss`
  (`glodWojskaHpFrac` z `buildEmpireFoodParams(econParams, effectiveGameDifficultyForOwner(owner))`) → `setLegacyPending`
  ⇒ `handleSiegeCapitulationPhase`, inaczej `surrenderNow` ⇒ `resolveSiegeSurrender`; potem `siegeTurnByCity`,
  `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`.
- `main.ts:17634` `besiegerOwnerForCity`, `:17646` `handleSiegeCapitulationPhase`, `:17662-17878`
  `resolveSiegeSurrender`, `:17880-17899` `endMapSiege`, `:13129` `areEnemyOwners`.
- `cities.ts:1235` `applyCapturePopulationLoss` (zapis `capturedFromOwnerId`), `siege-enter-city.ts:89`
  `enterCityAfterSurrender`, `turn-economy.ts:1093` `getCityFood`.
- Różnice kapitulacji względem szturmu (P1/P9) zachowane z pinu: `applyPostCaptureLawOnCapture` BEZ strażnika
  barbarzyńcy; `noteCityCapture` PO zmianie właściciela i `settleWonderTransfer`; brak `onCityCapturedReligion`;
  `Math.max(1, population)`; wejście armii `enterCityAfterSurrender` (stos największy, limit `armyStackLimit()` = 500).
- Gameplay poza webem: brak (nic nie wymyślone). Kolejność faz: decyzja właściciela W8 r7 Q2 = jak pin (rejestr).

## 2. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_surrender.rs` | Typ pola stanu `PlayableCitySiege` (web `oblegajacyOwnerId`, `siegeCapitulationPending`, `siegeStarveStartMaxHp`, `magazynZywnosci`; `end_siege` = część `endMapSiege`); `city_food_of` (`getCityFood`); `siege_unit_max_hp` (`unitHealth`), `glod_wojska_hp_frac` (`buildEmpireFoodParams`); `run_siege_turn` = blok N3 na `PlayableState` (obrońcy `siegeDefenderUnits`, decyzja `siege_city_turn`, atrycja `apply_army_starvation_hp_loss` z zapisem `hp`/`hpMax` i usunięciem zniszczonych, zapis startu głodu, `surrender_tick_action` → flaga albo `apply_siege_capitulation`); raport `SiegeTickReport`. Istniejące funkcje czyste bez zmian. |
| `engine/src/domain/city_capture_apply.rs` | `apply_siege_capitulation` = `resolveSiegeSurrender` na stanie w kolejności pinu (zwraca `SiegeCapitulation { path, besieger, capture, steps }`, `steps` = nazwy wywołań pinu); `end_map_siege_state` (`endMapSiege` + pola oblężenia + `oblegaCityId`) — użyte też w `apply_storm_capture` zamiast gołego `end_map_siege`; `apply_capture_law_always` (prawo po przejęciu bez strażnika barbarzyńcy, jak kapitulacja w pinie); `SURRENDER_NOT_APPLIED_ALWAYS`. Reużyte kroki B: `apply_capture_population_loss`, `settle_wonders`, `apply_note_city_capture`, `record_war_city_loss_for_pair`, `apply_capture_production`, `capital_plunder` (Q6), `build_city_capture_report_rows`, `apply_record_city_capture_event`. |
| `engine/src/domain/playable.rs` | 2 pola stanu (cytat pinu w doc): `siege_city: BTreeMap<CityId, PlayableCitySiege>`, `oblega_city_by_unit: BTreeMap<UnitId, CityId>` (web `RuntimeUnit.oblegaCityId`); puste ⇒ pomijane w JSON (stan sprzed zmiany bajt w bajt), 2 inicjalizatory. `advance_turn`: na fazie `Economy` `run_siege_turn` na kopii stanu; błąd ⇒ cofnięcie kolejki/wojny/ekonomii i `PlayableError::WarTurn("oblezenie: …")` (wzorzec fazy Diplomacy). `PlayableGame::last_siege_tick()` (raport poza stanem). |
| `engine/tests/p6_kapitulacja.rs` (nowy) | 7 testów: 18 scenariuszy wektorów tura po turze (dziennik kroków pinu + stan), E2E przez `advance_turn`, brak miasta, determinizm, gaszenie nieaktualnych pól, AI-AI `not_applied`, strażnik SHA i parametrów danych. |
| `engine/tests/p6_kapitulacja_gen.mjs` + `p6_kapitulacja_vectors/vectors.json` (nowe) | Generator wykonujący tekst pinu (opis w nagłówku pliku); SHA-256 tekstu pinu `376cbfc6e7a6ae510eb41af3be611278aaa11b848a07ab7cb1656cdb14d9162c`; MD5 `vectors.json` = `1b597a72b262661ae09128c93be55d6b` (dwa uruchomienia, ten sam MD5). |

Nie ruszano: `siege_transfer.rs`, `siege_capital_plunder.rs` (adaptery niepotrzebne — wystarczyły istniejące kroki B w
`city_capture_apply.rs`), `siege_tactics_loop.rs`, `siege_battle_session.rs`, `siege_battle_apply.rs`, `p6_k5loop_wiring_a*`,
`bridge.rs`, `bridge_contract.rs`, `save_load.rs`, `client`, `renderer`, `src-tauri`, `gra/`.

## 3. Wołający produkcyjny (wskazany w pinie i w Rust)

- Pin: `runWorldEndTurn` → blok N3 (`main.ts:38808`) po ticku ekonomii.
- Rust: `PlayableGame::advance_turn` (`playable.rs`) → faza `TurnPhase::Economy` → `siege_surrender::run_siege_turn` →
  `city_capture_apply::apply_siege_capitulation`. Most (`EndTurn`) woła `advance_turn` — kapitulacja działa w grze bez
  zmian w `bridge.rs`.

## 4. Decyzje techniczne (do `REJESTR-RUST.md` przez orkiestratora)

- **D-KAP-1** Pola web `City` dotyczące oblężenia w jednym typie `PlayableCitySiege` obok `PlayableCity` (wzorzec
  `oblegane`/`captured_from_owner_by_city`); `oblegaCityId` jednostek w `oblega_city_by_unit`. `Eq` ręczne (wartości
  skończone, jak `PlayablePostCaptureLaw`).
- **D-KAP-2** Zapas żywności = `getCityFood` z `magazynZywnosci` (brak pola = 0): Rust nie wykonuje ticka ekonomii
  (EKONOMIA-TURA), więc `tick.obleganyGlod = false`, `tick.magazynPoTurze = undefined` — gałąź pinu `?? getCityFood`.
- **D-KAP-3** Tick oblężenia na fazie `Economy` (`advance_turn`), na kopii stanu; błąd = tura odrzucona, stan bez zmian.
- **D-KAP-4** `effectiveGameDifficultyForOwner` = trudność gry ze stanu (`Łatwy`/`Normalny`/`Trudny`); miast-państw i
  `cityStateDifficulty` brak w `PlayableState`.
- **D-KAP-5** Pola oblężenia miasta, które nie jest już oblegane (oblężenie zakończone ścieżką bez `end_map_siege_state`,
  np. `validate_storm_siege` w `siege_battle_apply.rs` poza allowlistą), gaszone na starcie ticka — skutek identyczny
  z `endMapSiege` pinu (który zawsze je gasi).
- **D-KAP-6** Zdobywca barbarzyńca w kapitulacji = jawny błąd producenta (barbarzyńców nie ma w stanie, D-ADP-L-BARB).
- **D-KAP-7** `siegeBesiegerByCity` (surowe `war.opaque`) nieczytane: `besiegerOwnerForCity` dostaje `stored = None`;
  kolejność: `oblegajacyOwnerId` → sąsiad obcy (jak pin).
- **D-KAP-8** `maybeResolveRegularWarOnCityCapture` dla pary AI↔AI (licznik zdobyczy i auto-pokój `main.ts:35986-36060`)
  NIE wykonywany — jawnie w `capture.not_applied` jako `maybeResolveRegularWarOnCityCapture(AI-AI)`; para z graczem =
  no-op jak w pinie (Q3).
- **D-KAP-9** Id właścicieli: gracz w stanie 1, w pinie 0 (D-ZMA-5); wektory mapowane w teście.

## 5. Tabela W3–W5

| # | Element pinu | Status |
|---|---|---|
| W3 | `handleSiegeCapitulationPhase`: pierwsze wyczerpanie zapasów bez garnizonu → `siegeCapitulationPending`; następny tick → przejęcie | ZASTOSOWANO (produkcyjny tick; wektory `legacy_gracz`, `pokoj`, `brak_oblegajacego`, …) |
| W3 | N3: start głodu (`siegeStarveStartMaxHp`), atrycja HP (`applyArmyStarvationHpLoss`), kapitulacja < 50% / pusty garnizon | ZASTOSOWANO (`garnizon_glod` 12 tur, `garnizon_ginie`, `garnizon_jeden_ginie`, `obronca_hp_0`) |
| W3 | flaga z zapisu przy zapasach > 0 → przejęcie | ZASTOSOWANO (`flaga_z_zapisu`) |
| W4 | `besiegerOwnerForCity`, `areEnemyOwners` (pokój ⇒ koniec oblężenia bez przejęcia), brak oblegającego, brak miasta | ZASTOSOWANO (`pokoj`, `brak_oblegajacego`, `sasiad_fallback`, `oblegajacy_bez_sasiada`, `noCity`) |
| W4 | `applyCapturePopulationLoss` (−1, odbicie bez straty, ludność 0/1) + `Math.max(1)` | ZASTOSOWANO (`odbicie`, `ludnosc_1`, `ludnosc_0`) |
| W4 | `applyPostCaptureLawOnCapture`, zmiana właściciela, `settleWonderTransfer`, `noteCityCapture`, `recordWarCityLossForPair` | ZASTOSOWANO |
| W4 | kolejka produkcji (`sanitizeBuildQueue`…`filterQueue`) | ZASTOSOWANO (krok B `apply_capture_production`; scenariusze z pustym `cityProd`, wektory kolejki: temat B) |
| W4 | usunięcie obrońców, `enterCityAfterSurrender` (limit stosu, blokada obcej jednostki) | ZASTOSOWANO (`wejscie_zablokowane`, `cywil_obroncy`, `dwa_miasta`) |
| W4 | `runCapitalCapturePlunder`, `recordCityCaptureEvent` | ZASTOSOWANO (reużyte Q6/B; scenariusze bez stolicy — łup stolicy pokryty wektorami Q6/A) |
| W4 | `endMapSiege` (pola, `oblegaCityId`) | ZASTOSOWANO (`end_map_siege_state`) |
| W4 | `applyLiveSafeRationForCity` PO `endMapSiege` (NOTA B) | POZA STANEM (racje brak w `PlayableState`; krok w `steps` i `not_applied` na właściwej pozycji) |
| W4 | `wasIndependentCityStateBeforeCapture`, `foundedByOwner`, `clearCityStateFlagOnCapture`, `rebelState`, `triggerRebelProtectionWarConsequence`, `seedCityOwnerDefaults`, `syncCityGarnizon` | POZA STANEM (brak pól; `not_applied`) |
| W4 | `maybeResolveRegularWarOnCityCapture` AI↔AI | NIE ZASTOSOWANO (D-KAP-8, dług KAP-DL-1) |
| W5 | `capturedFromOwnerId` (`captured_from_owner_by_city`), `playerEverOwnedCityByOwner.add`, kronika | ZASTOSOWANO |
| W5 | zdobycze mocy przy eliminacji (`power_record_city_capture`) | ZASTOSOWANO przez `capital_plunder` (gałąź eliminacji, jak szturm) |
| — | `captureCityWithoutBattle` (W6–W8), cesja (W11), przegrana po utracie miasta (W12/W13), `spectacle`, SAVE-LOAD nowych pól | POZA ZAKRESEM (dispatch) |

## 6. Testy (dokładne wyniki)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`…/scratchpad/kap_target`, poza repo).

- `cargo fmt --all -- --check`: EXIT 0. `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- Testy dotknięte (jedno wywołanie, `--no-fail-fast`, EXIT 0): lib 149/149, `bridge_contract` 10/10,
  `p6_k5loop_wiring_b` 15/15, `_pin` 2/2, `p6_kapitulacja` 7/7, `p6_siege_capital_plunder` 3/3,
  `p6_siege_capture_events` 3/3, `p6_siege_surrender` 10/10, `p6_siege_transfer` 2/2, `_effects` 4/4, `_effects_q4` 12/12,
  `_prod` 5/5, `_q5` 6/6, `p6_zdobycie_miasta_a` 6/6, `_a_bridge` 7/7, `p6_zdobycie_miasta_b` 16/16, `_b_bridge` 6/6.
- Generator: `node rust-port/engine/tests/p6_kapitulacja_gen.mjs` → SHA-256 `376cbfc6…162c`, MD5
  `1b597a72b262661ae09128c93be55d6b`, dwa uruchomienia = ten sam MD5. `dataSame.econParams = false` (znany dryf
  `econ-params.json` Rust vs pin, PIN-MOVE-PLAN); test pilnuje, że WARTOŚCI czytane przez tick są równe pinowi
  (`glodWojskaHpFrac` 0,06/0,08/0,10, `unitHealth(Wojownik)` = 22, `CAPTURE_POP_LOSS` = 1, `armyStackLimit` = 500).

### 6a. Pełna bramka

Na kodzie `9863a83c9` (checkout z `dyspozycje/`, w tle `setsid nohup`, strażnik dysku < 1,5 GB — nie zadziałał):
`cargo fmt --all -- --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
`cargo test --all-targets --no-fail-fast` EXIT 0 — 554 binarki testowe, 4222 passed, 0 failed, 1 ignored (istniejący
przed tematem; temat nie dodaje `#[ignore]`). Target tematu (`scratchpad/kap_target`, 4,1 GB) usunięty po bramce.
Uwaga dysk: start tematu przy 7,6 GB wolnego (poniżej progu 8 GB orkiestratora), w trakcie spadek do 1,7 GB przez
równoległe workery; po usunięciu targetu 8,1 GB.

### 6b. Mutanty (`scratchpad/mut.py`, `scratchpad/kapq1/mut2.py`; bramka = `p6_kapitulacja`; źródła przywracane, `git status` czysty po serii)

28 mutantów: 25 ZABITYCH, 3 RÓWNOWAŻNE.
- ZABITE: M01 start głodu nie zapisany, M02 flaga false, M03 `getCityFood` = 0, M04 odwrócone gaszenie pól, M05 frac 0,
  M06 hp nie zapisane, M07 zniszczone nie usunięte (po dopisaniu `garnizon_jeden_ginie`), M08 cywil w garnizonie,
  M09 filtr `hp <= 0` → `< 0` (po dopisaniu `obronca_hp_0`), M10 brak straty ludności, M11 brak `capturedFromOwnerId`,
  M12 brak prawa po przejęciu, M13 brak kroniki, M14 kolejność `settleWonderTransfer`/`noteCityCapture`, M15 brak
  `endMapSiege`, M16 brak `playerEverOwnedCityByOwner`, M17 limit stosu 0, M18 wejście bez ruchu, M20 `areEnemyOwners`
  zawsze prawda, M21 `oblegajacyOwnerId` ignorowane (po dopisaniu `oblegajacy_bez_sasiada`), M22 brak `Math.max(1)`,
  M23 kapitulacja garnizonu pominięta, M24 tick nie zatwierdzony w `advance_turn`, M25 brak wpisu AI-AI, M27 wejście bez
  `oblegaCityId`.
- RÓWNOWAŻNE: **M19** brak usunięcia `oblegaCityId` usuwanych obrońców — obrońcy starego właściciela nigdy nie oblegają
  własnego miasta (wpis nie istnieje), pin usuwa cały obiekt jednostki; **M26** kolejność `removed_unit_ids` — pole
  raportu Rust (pin nie ma listy, `splice`), stan identyczny; **M28** `food_now` zamiast `food` w
  `handleSiegeCapitulationPhase` — zapas nie zmienia się między decyzją a fazą kapitulacji (brak ticka ekonomii w tej
  turze), wartości równe.

### 6c. Determinizm

`tick_is_deterministic`: każdy z 18 scenariuszy dwukrotnie, stany po każdej turze równe.

## 7. Długi i uwagi

- **KAP-DL-1** `maybeResolveRegularWarOnCityCapture` AI↔AI (licznik `regularWarCapturedByPairKey` + auto-pokój z bramką
  bilansu PW) — `war_turn_declare::register_regular_war_city_loss` istnieje, ale skutek `EndByPeace` (zawarcie pokoju)
  nie ma portu; dziś jawnie `not_applied`. Pin podkreśla, że dla AI↔AI to jedyna droga końca wojny zwykłej poza tym
  licznikiem → temat następczy.
- **KAP-DL-2** SAVE-LOAD: `siege_city`, `oblega_city_by_unit` (oraz wcześniejsze pola B) nie są w `save_load.rs` (poza
  allowlistą; pin zapisuje `City` w całości). Dispatch: osobny temat SAVE-LOAD.
- **KAP-DL-3** `siegeTurnByCity`/`siegeBesiegerByCity`/`siegeAiStateByKey` (surowe `war.opaque`) nie są czytane ani
  czyszczone przez tick; `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines` (reszta N3) — poza zakresem W3–W5.
- **KAP-DL-4** Brak ticka ekonomii (EKONOMIA-TURA): `magazynZywnosci` nie maleje w Rust; po wpięciu ekonomii trzeba
  podać `obleganyGlod`/`magazynPoTurze` z ticku do `run_siege_turn` (dziś D-KAP-2).
- **KAP-DL-5** Żaden produkcyjny wołający w Rust nie ustawia jeszcze `oblegane`/`oblegajacyOwnerId`/`oblegaCityId`
  (rozpoczęcie oblężenia na mapie nie jest portowane; dziś tylko zapis i testy) — tick działa, gdy stan je ma.
- **KAP-DL-6** `validate_storm_siege` (`siege_battle_apply.rs`, poza allowlistą) kończy oblężenie bez gaszenia nowych pól;
  zabezpieczone D-KAP-5, naprawa u źródła w temacie z `siege_battle_apply.rs` w allowliście.
- **KAP-DL-7** Wiersze karty zdarzenia kapitulacji (`buildCityCaptureReportRows`, `capturePopLossReportRow`) i treść
  komunikatów nie są porównywane w wektorach tego tematu (generator je zaślepia); logika pokryta wektorami B.
- Uwaga proces: wspólny scratchpad — inny agent nadpisał `scratchpad/mut.py` w trakcie (ROOT innego worktree); drugi
  przebieg mutantów z unikalną ścieżką `scratchpad/kapq1/`. Źródła tego worktree nie były ruszane przez obcy skrypt
  (`git status` czysty przed i po).

## 8. Następny krok

Evaluator (runda 1): regeneracja generatora (SHA/MD5), przegląd kolejności kroków wobec `main.ts:17662-17878` i bloku
N3, ocena D-KAP-2/5/8 i długów KAP-DL-1…7.
