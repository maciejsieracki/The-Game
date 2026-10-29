# P6-REPIN-EKONOMIA-B - odswiezenie portu ekonomii do webu 91dc998a (czesc B)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-B-Q1` · **Runda:** 1/5 (Operator-impl) · **Pin portu:** `edb8fb56` (bez zmiany pinu) · **Cel:** `91dc998a5f1b51ad29e0f4785edfd45655445c53`

## 1. Zakres - korekta premisy dispatchu (ZALOZENIE)

Dispatch podawal `production.ts` = 1 hunk i `turn-economy.ts` = 3 hunki. Pomiar diffu `edb8fb56..91dc998a` dla obu plikow daje **67 hunkow** (production.ts: 31; turn-economy.ts: 36). ZALOZENIE: zakres jest pelny, a temat nie jest zamkniety w tej rundzie. Zmiany spoza tych dwoch plikow, ktore wchodza w lancuch wywolan (`population-growth-v85.ts`: `rationEraFoodCostMultiplier`, `manpowerMaxMultByOwnerId`, `orderGrowthMultByCity`; `manpower.ts`; `wealth.ts`), sa ujete jako "moduly wskazane diffem" i przypisane do kolejnych partii.

Klasyfikacja hunkow: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B-Q1/classify-hunks.py` (uruchomiony na patchu `git diff edb8fb56 91dc998a -- gra/src/game/production.ts gra/src/game/turn-economy.ts`). Wynik: **PORTOWANE 3, NIE-DOTYCZY 4** (tylko import lub komentarz), **NASTEPNA-PARTIA 60**. Klasyfikator to heurystyka po tresci hunka; pozycje NASTEPNA-PARTIA wymagaja jeszcze recznego mapowania do modulu Rust.

Hunki NIE-DOTYCZY (niebehawioralne): production.ts -62/+62 (import); turn-economy.ts -53/+53 i -72/+71 (import); turn-economy.ts -1203/+1152 (komentarz `OwnerEconomySum`).

## 2. Partia 1 (zrealizowana) - era Racji (`ownerEra`)

| Zmiana webu (91dc998a) | Plik:linia weba | Rust | Test / wektor | Status |
|---|---|---|---|---|
| `rationEraFoodCostMultiplier`: Kamien 1x, Braz 2x, Zelazo+ 4x; nieskonczone lub <=1 = 1x | `gra/src/game/population-growth-v85.ts:46-50` | `rust-port/engine/src/domain/city_growth.rs` `growth_v85::ration_era_food_cost_multiplier` | `tests/p6_repin_b_ration_era.rs::era_thresholds_are_exact`, `era_multiplier_matches_web_grid`; wektor `tests/p6_repin_b_vectors/ration_era.json` (1296 przypadkow + 12 mnoznikow, z URUCHOMIONEGO weba 91dc998a) | PORTOWANE |
| `computeCityRationCost(..., ownerEra=1)` mnozy baze przez mnoznik ery | `population-growth-v85.ts:213-222` | `city_growth.rs` `growth_v85::compute_city_ration_cost(..., owner_era)` | `ration_cost_with_era_matches_web_bits` (porownanie bitowe f64) | PORTOWANE |
| `computeCityFoodBalanceV85(..., ownerEra=1)` | `turn-economy.ts:1643-1650` (hunki 44-45) | `city_growth.rs` `compute_city_food_balance_v85(..., owner_era)` | posrednio: `p6_7a_growth` (era 1 = neutralna) | PORTOWANE |
| `recomputeCityFoodBalancesInEcon`: `tick.ownerEra ?? 1` | `turn-economy.ts:1683-1684` (hunk 46) | `city_growth.rs` `recompute_city_food_balances_in_econ` + pole `CityEconomyTick.owner_era: Option<f64>` | `tests/p6_7a_vectors/common.rs` czyta i pisze `ownerEra` (tylko gdy obecne) | PORTOWANE; NIE_ZMIERZONO bezposrednio przez recompute z era>1 (wymagaloby `GrowthCity` z wektora) |

Mutacje (`mutate-repin-b-ration.py`, plik przywracany po kazdej mutacji, sprawdzone `cmp`):
- M1 (brak progu 2x, zawsze 4x): zabita, 3/3 testy FAILED.
- M2 (era 1 nie jest neutralna): zabita, 3/3 testy FAILED.
- M3 (mnoznik nie wchodzi do kosztu): zabita, `ration_cost_with_era_matches_web_bits` FAILED.

Gate'y partii 1: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` 1303 passed / 0 failed (baseline 1300 + 3 nowe).

## 3. Wektory - status regeneracji z URUCHOMIONEGO weba 91dc998a

Web: `git archive 91dc998a gra/src gra/data` do katalogu tymczasowego poza repo. Generator P6.7A (`dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/gen-p67a-vectors.mjs`) uruchomiony na 91dc998a, wynik porownany z `rust-port/engine/tests/p6_7a_vectors/`:

| Plik wektorow | Wynik | Rozbieznosc |
|---|---|---|
| `growth.json` (sekcja `cost` = Racja) | IDENTYCZNY | 0 |
| `empire.json`, `manpower.json`, `tempo_stawki.json` | IDENTYCZNY | 0 |
| `edge.json` | ROZNY | `postCentral` 17/40 wpisow, `postCentralSiege` 7/40 - wylacznie pola `cities[].manpower` i `manpowerCheck[]` (przyczyna: `manpowerMaxMultByOwnerId`, partia 4) |
| `post_central.json` | ROZNY | `scenarios` 26/100 - wylacznie `cities[].manpower` i `manpowerCheck[]` (ta sama przyczyna) |
| `params.json` | ROZNY | `econParamsRawForBuild` (surowe parametry; NIE_ZMIERZONO, czy dotyczy partii 1 - prawdopodobnie temat DANE/kopii `data/`) |

Decyzja: `edge`/`post_central`/`params` NIE zostaly nadpisane w partii 1. Ich regeneracja bez portu pola manpower dalaby czerwone testy, a asercji nie wolno oslabiac. Testy na wektorach `edb8fb56` nadal przechodza.

## 4. Pozostale hunki (NASTEPNA-PARTIA) - plan kolejnych partii (ZALOZENIE)

- **Partia 2 (koszt budynku):** `buildingWorkCost` (`production.ts` hunk 7: -518/+559) zastepuje `buildingCostAfterCivDiscount` przez `civMatrixCostDiscount(..., 'prod_koszt_budynku_proc')` i `applyCostDiscount`. ZALOZENIE: `rust-port/engine/src/domain/building_costs.rs:222` (`building_work_cost`) NIE MA dzis rabatu cywilizacyjnego - zwraca surowy koszt. Partia 2 musi najpierw dodac odpowiednik oparty o `civ_matrix.rs`, a nie tylko zmienic formule. Dlatego to nie jest "jeden hunk do przepisania".
- **Partia 3 (rekrutacja i dostepnosc):** `unitMoneyCost`, `civRecruitmentDiscount` (Impi-only, F-04 `civProductionCostBonusyForCivKey`), `newestAvailableSameTypeUnit`, `availableProduction` (zamiana bonusowych nazw na `W zamian za`/Nacja), `unitStockShortfallLabel`, widoki `showStockGatedUnits` i `showResourceGatedBuildings` (hunki 5-6, 8-17, 18-22, 23, 28-31).
- **Partia 4 (post-central):** `manpowerMaxMultByOwnerId`, `orderGrowthMultByCity` w `population-growth-v85.ts`. Usuwa drift `manpower` w `edge.json` i `post_central.json`. Po niej regeneracja tych wektorow i mutacje na nowych galeziach.
- **Partia 5 (ekonomia miasta):** `previewCityEconomy` i `advanceCityEconomy` (hunki 47-67: `routeCashForCity`, `additionalTax`/`manualWorkTaxByCity`, Mennica/Waluta bez religii, `wealthParamsForOwner`, usuniecie `targowiskoPracaMnoznik`, `maritimeTradeIncomeByCity`). ZALOZENIE: Rust nie ma pelnego `previewCityEconomy`/`advanceCityEconomy` (brak `fn preview_city_economy` i `fn advance_city_economy` w `rust-port/engine/src`, sprawdzone grepem). Te hunki wymagaja decyzji "brak odpowiednika w porcie" po weryfikacji, a nie przepisywania na sile.
- **Partia 6 (wealth i produkcja):** `wealth.ts` (`wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier`) oraz hunki `advanceProduction`, `advanceRecruitment`, `unitPurchaseCost` (production.ts hunki 24-31) i `buildEconParams`/`getCityFood`/`applyWonderCityYields` (turn-economy hunki 34-42).

Krok 6 pinu (`meta.pin`, manifesty) NIE wykonany. Zgodnie z REPIN-DELTA §6 pin przesuwa sie dopiero po krokach 1-5.

## 5. Lista hunkow

Pelna tabela 67 wierszy generuje `classify-hunks.py` (uruchomienie: `python3 dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B-Q1/classify-hunks.py <patch>`). Wyjatki od NASTEPNA-PARTIA: hunki 1, 32, 33, 43 (NIE-DOTYCZY) oraz 44, 45, 46 (PORTOWANE).
