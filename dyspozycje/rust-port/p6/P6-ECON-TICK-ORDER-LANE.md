# P6 — pętla porządku i `orderMultMap` (R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1)

Pin weba `4bbef081d`, baza Rust `40c358d6f`. Dług z `P6-ECON-TICK-STATE-SOURCES.md` sek. 3. Zasada właściciela: port 1:1;
odstępstwo = ZAŁOŻENIE do akceptacji. Pętla: `gra/src/main.ts:35358-35789`; jedyne zapisy map: `:35787-35789`
(`orderValueMap`, `growthMultMap`, `orderMultMap`); `.clear()` tylko przy nowej grze/wczytaniu (`:40887` itd.).

## 1. Tabela: funkcja -> web -> Rust

| Funkcja | Web (plik:linia) | Rust | Status |
|---|---|---|---|
| `loadOrderParams` / `orderEffectsToYieldMults` / `pickRevoltMigrationTarget` | `order.ts:280/464/495` | `types::porzadek::*` | ISTNIAŁO |
| `orderEffectsWithCivMatrix` | `order.ts:162` | `order_effects_lane::order_effects_with_civ_matrix` | ZAPORTOWANE |
| `makeRng` (culture-religion) | `culture-religion.ts:974` | `order_effects_culture::make_rng` | ZAPORTOWANE (Z-OL-3: ≠ `civ-roster` `Mulberry32::new`, ziarno 0 → stan 1) |
| `loadCultureParams`/`loadReligionParams`/`loadCulturePressureParams` | `:238/:534/:1414` | `order_effects_culture::load_*` | ZAPORTOWANE |
| `cultureAccrualWithModifier`/`accumulateCulture`/`cultureHappiness`/`convertCulture` | `:340/:354/:394/:447` | `order_effects_culture::*` | ZAPORTOWANE |
| `religionHappiness`/`religionOwnShare`/`resolveCityReligionState`/`civReligionForKey` | `:960/:925/:875/:607` | `order_effects_culture::*` | ZAPORTOWANE |
| `spreadReligion`/`convertViaTemple`/`religionParamsWithSpreadModifier` | `:1044/:1160/:503` | `order_effects_culture::*` | ZAPORTOWANE |
| `empireCultureTotal`/`empireReligionTotal`/`applyCultureReligionPressureToTarget` | `:1370/:1400/:1441` | `order_effects_culture::*` | ZAPORTOWANE |
| `tickCityCultureReligion`, `conquestRevoltRiskMultiplier`, `conquest*Penalty` (zawsze 0) | `conquest-stability.ts:95/183/156/172` | `terrain::conquest_stability` (8J) | ISTNIAŁO |
| `isForeignReligionDominant`, `resolveOwnCultureShare`, `cityCultureMixActive`, `stolicaEasyBonusActive` | `society-inputs.ts:11/23/35/111` | `resource_access::*` | ISTNIAŁO |
| `evaluateOrderFromBreakdown`, `applyCivMatrixHappinessModifier`, `updateRevoltGrace`, `loadRevoltParams`, `isOsiedleRevoltImmune` | `society-breakdown.ts:1063/1077/1120/475/465` | `society_breakdown::*` (8J) | ISTNIAŁO |
| `computeCitizenResourceDrain`, `ownerResourceStockAll`, `deductBuildingStockCostAcrossCities` | `citizen-resource-upkeep.ts:303`, `building-stock-cost.ts:200/254` | `resource_production`, `building_costs::p6_7b` | ISTNIAŁO (tabela STATE-SOURCES błędnie sugerowała brak `citizen_upkeep_drain`) |
| `resolvePopulationMatrixForCiv`, `sumBuildingHappinessFromBuiltIds`, `buildingLevelForEpoch`, `cityPalacTier`, `cityRangeForPopulation`, `civMatrixParam` | `population-growth-v85.ts:118`, `economy.ts:546`, … | `city_growth`, `economy_city_fns`, `production_units`, `terrain`, `civ_matrix` | ISTNIAŁO |
| `markCityRebellionStarted`, `tick{PostCaptureLaw,RebelProtection}EndOfTurn`, `applyPostCaptureLawOverride`, `shouldSuppressRevolt…` | `post-capture-law.ts:47/89/104/125/166` | `order_effects_lane::*` | ZAPORTOWANE |
| `countLawGarrisonOnCityHex` (`lawGarrisonCountForCity`) | `armyMerge.ts:991`, `main.ts:15745` | `order_effects_lane::count_law_garrison_on_city_hex` | ZAPORTOWANE |
| `isOwnerAtWarInRelations` (`isOwnerAtWar`) | `diplomacy.ts:82`, `main.ts:15730` | `order_effects_lane::is_owner_at_war_in_relations` | ZAPORTOWANE |
| `capitalCityIdForOwner` | `main.ts:31575` | lokalnie dla `OrderLaneCity` (wersja na `City` istnieje w `turn_economy_inputs_state`) | ZAPORTOWANE |
| Pętla per miasto `:35390-35789` | `main.ts` | `order_effects_lane::compute_order_lane` | ZAPORTOWANE |
| `orderMultMap` jako źródło stanu ticku | `main.ts:35789`, `:34542` | `StateSources::order_mult_map` (`turn_economy_inputs_native.rs`) | ZAPORTOWANE |
| `ownerReligionForOwnerId`/`ownerCivKeyForReligion` (stan `player.civType`, `_menuCivId`, `aiOwnerCivMap`) | `main.ts:4854-4864` | wejście wołającego (`owner_religion`), logika `civ_religion_for_key` zaportowana | WEJŚCIE (Z-OL-4) |
| `econ.perCity`, `wonderCityYieldBonusForOwner`, `effectivePodzialHandlu`, `units`, `diplomacyRelations`, `isHuman`, `empireEpochForOwner`, `unlockedTechSetForOwner` | `main.ts` zamknięcia | wejścia `OrderLaneCtx` | WEJŚCIE (Z-OL-4) |
| `seedCityOwnerDefaults` po buncie, `showHintMessage`, `console.log`, `cityOrderState` (UI) | `main.ts:35718-35781` | `OrderLaneOutput::rebelled_city_ids`, `OrderLaneCityReport` | ZAŁOŻENIE Z-OL-6/7 |

## 2. Założenia (do akceptacji)

* Z-OL-1 `ReligionState.counts` = `BTreeMap` (web: kolejność wstawiania); sumy dokładne dla liczb całkowitych (wektory).
* Z-OL-2 porządek kluczy `sort()` UTF-16 = bajtowy UTF-8 dla BMP.
* Z-OL-3 `makeRng(0)` → stan 1 (`(seed>>>0)||1`); `Mulberry32::new(0)` NIE jest równoważny (znalezisko 1:1).
* Z-OL-4 wejścia wołającego jak w tabeli. Z-OL-5 `populationMatrixByOwnerId` pominięty: zawsze `resolvePopulationMatrixForCiv(ownerCivMap)`.
* Z-OL-6 `seedCityOwnerDefaults` po buncie: wołający używa `rebelled_city_ids`. Z-OL-7 efekty UI pominięte.
* Z-OL-8 w danych pinu WSZYSTKIE parametry macierzy `porzadek_*_proc`, `kultura_naplyw_proc`, `eko_zadowolenie_proc`,
  `religia_spread_proc`, `lud_zadowolenie_bazowe` = 0; wektory uruchamiają web na macierzy z deterministyczną ŁATKĄ (`matrixPatch`
  w fixture), Rust nakłada tę samą łatkę. Zachowanie na prawdziwych danych = szczególny przypadek (czynnik 1).
* Z-OL-9 e2e: econ z ticku 1 Rust trafia do weba jako wejście (dwie fazy generatora), potem tick 2 z `orderMultMap` Rust == z `orderMultMap` weba.
  Sam tick jest zgodny z webem z Q6 (`p6_adv_q6_wire`); brak jednego przebiegu weba przez cały `main.ts` (DOM).

## 3. Dowody

* Wektory: `tests/p6_order_lane_vectors/order_lane.json` (5,6 MB; 750 scenariuszy pętli, w tym 300 „podbój”; 80 światów e2e; ~2000 przypadków funkcji
  czystych), generator `runs/.../gen-p6-order-lane-vectors.mjs` (czysty `git archive 4bbef081d`, esbuild w `/dev/shm`, zero buildu w `gra/`).
  Parser JSON w teście jest dokładny (`serde_json` bez `float_roundtrip` myli 1 ULP w ~24% floatów; `Cargo.toml` poza allowlistą).
* Test `tests/p6_order_lane.rs` 10 + 1 `#[ignore]` (zrzut econ fazy 1): `full_order_lane_matches_running_web` porównuje bit-w-bit raporty,
  `orderMultMap`/`orderValueMap`/`growthMultMap`/`cityRelig`, stan miast (kultura, mix, presja, łaska buntu, rebelia, magazyn), drenaż obywateli,
  liczbę losowań RNG buntu i listę rebelii. Bunt z seeded RNG: 58 buntów w 750 scenariuszach.
* Weryfikator `verify-p6-order-lane.py` (`python3 -I`): 16 501 sprawdzeń, 0 rozbieżności; kontrola negatywna 2/2 wykryta.
* Mutacje: 69; zabite 62 (brutto 89,9%); przetrwałe: 6 równoważnych z dowodem + 1 luka. Równoważne: [24] fallback tempa presji — wiersz
  `kultura_presja_proc_tura` istnieje dla easy/normal/hard (`society-params.json`), gałąź nieosiągalna; [31] `max(0,1+m)` w czynniku —
  wynik i tak `max(0, base*factor)` z `base>=0`; [40] materializacja `ownCultureShare<1` przy nieaktywnym mixie — udział = 1 i `tick…` zmienia go tylko gdy `<1`;
  [44] `pop>=1` — pop = 1 jest odporny (`isOsiedleRevoltImmune`), gałąź nieosiągalna; [47] seed spread — jitter nie rozstrzyga kolejności (id unikalne);
  [62] `ownCultureShare` zawsze podany — przy nieaktywnym mixie = 1 = domyślne `None` (`breakdown.rs:55`). LUKA: [68] ponowne liczenie
  `foreignReligionDominant` po konwersji (wpływa tylko na mnożnik ryzyka podboju) — wektory nie trafiają w wąskie okno losowania → dług Q2 (wektor ukierunkowany).
  Mutacje 0-69 uruchomione na wektorach rev.1, 5 przetrwałych (27, 43, 50, 61, 67) powtórzone na rev.2 i zabite.
* Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`-D warnings`), `gate-test-full.txt` 2082/0 w 8 shardach (baza 2072/0 + 10).

## 4. Dług

* Q2: wektor ukierunkowany dla mutanta [68]; wiązanie wejść Z-OL-4 z docelowym stanem gry (`owner_religion` z `player.civType`/`aiOwnerCivMap`, `wonder_zadowolenie` z `turn_economy_inputs_wonders`,
  `podzial_procent_luksus` z `resolve_city_podzial_handlu`); zużycie `growth_mult_map` w ścieżce wzrostu (`main.ts:36071`).
* Ogon pętli po `:35789` (AUTO-MANAGE, produkcja) nie zapisuje do map porządku (grep: jedyne zapisy `:35787-35789`) — poza zakresem tego tematu.
