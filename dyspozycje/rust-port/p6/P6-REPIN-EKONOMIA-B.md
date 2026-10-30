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

## 6. Runda 2 - Operator-pomiary (niezalezna weryfikacja partii 1)

Commit bazowy: `60a90a1d` (kod partii 1: `9a0f97cd`). Weryfikacja w tym samym worktree, bez zmian kodu produkcyjnego.

**Wektor z weba.** Regeneracja `tests/p6_repin_b_vectors/ration_era.json` z `git archive 91dc998a gra/src gra/data` (Node v22.22.0, loader `repin-b-loader-*.mjs`, generator `gen-repin-b-ration-era.mjs`): `cmp` = IDENTYCZNY (1296 przypadkow + 12 mnoznikow).

**Zgodnosc logiki z webem.** `population-growth-v85.ts:46-50` (`rationEraFoodCostMultiplier`: `!isFinite || <=1` -> 1; `===2` -> 2; inaczej 4) oraz `:213-222` (`computeCityRationCost` z mnoznikiem ery przed `spichlerz`) - zgodne z `city_growth.rs` (`ration_era_food_cost_multiplier`, `compute_city_ration_cost`).

**Gate'y (runda 2, surowe logi w katalogu runu):**

| Bramka | Wynik | Log |
|---|---|---|
| `cargo fmt --all -- --check` | EXIT=0 | `gate-fmt-r2.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 | `gate-clippy-r2.log` |
| `cargo test --no-fail-fast` | 1303 passed / 0 failed, EXIT=0 | `gate-test-r2.log` |
| `git diff --check 9a0f97cd 60a90a1d` oraz worktree | EXIT=0 | `gate-diffcheck-r2.log` |

**Mutacje (niezalezne, jedna naraz, plik przywracany `git checkout --`):**

| Mutant | Miejsce | Wynik |
|---|---|---|
| M1 brak progu Braz 2x (zawsze 4x) | `city_growth.rs` `ration_era_food_cost_multiplier` | ZABITA: 3/3 FAILED (`p6_repin_b_ration_era`) |
| M2 era 1 nieneutralna (`< 1.0` zamiast `<= 1.0`) | j.w. | ZABITA: 3/3 FAILED |
| M3 mnoznik ery usuniety z kosztu | `compute_city_ration_cost` | ZABITA: `ration_cost_with_era_matches_web_bits` FAILED |
| M4 recompute ignoruje ownerEra (`tick.owner_era.unwrap_or(1.0)` -> `1.0`) | `recompute_city_food_balances_in_econ` | **PRZEZYLA**: 0 FAILED w `p6_7a_empire`, `p6_7a_growth`, `p6_7a_post_central`, `p6_7a_tempo`, `p6_7a_tables`, `p6_repin_b_ration_era` |

**M4 - luka testowa (NIE-ZABITA, nie jest mutantem równoważnym).** Zmiana zachowania przy `ownerEra > 1` nie jest pokryta: żaden wektor w `tests/` nie niesie `ownerEra` różnego od domyślnego, a `p6_repin_b_ration_era` testuje tylko funkcje czyste, nie `recompute_city_food_balances_in_econ`. Wymagany test w kolejnej partii: tick z `ownerEra = 4` (lub 2) i weryfikacja `koszt_racji` względem wartości z webu dla tego samego `GrowthCity`. Do czasu domknięcia partia 1 jest oceniana jako PASS-WITH-NOTES, nie jako w pełni zabezpieczona.

**Wektory P6.7A (kontrola ustaleń rundy 1).** Regeneracja `gen-p67a-vectors.mjs` z `git archive 91dc998a` (loader `p67a-loader-*.mjs`), porównanie przez `cmp-p67a-vectors.py` (porównanie ścieżka-po-ścieżce, liczba różnic = liczba ścieżek liści/kluczy):
- `growth`, `empire`, `manpower`, `tempo_stawki`: 0 różnic.
- `edge`: 78 różnic, wszystkie w `postCentral[].out.cities[].manpower`, `postCentral[].out.manpowerCheck[]`, `postCentralSiege[]...` (ta sama struktura).
- `post_central`: 72 różnice, wszystkie w `scenarios[].out.cities[].manpower` i `manpowerCheck[]`.
- `params`: 8 różnic w `econParamsRawForBuild` (`budynki.budynek_targowisko_bonus_handlu.opis`, `budynki.targowisko_praca_na_pieniadz_mnoznik` i `targowisko_praca_na_podatek_kurs` brakujące, `budynki.waluta_mnoznik.opis`, `globalne.mennica_mnoznik_po_walucie.{easy,hard}` typ, `.opis`).

Ustalenie rundy 1 (`edge`/`post_central` różnią się tylko w `manpower`) jest potwierdzone. Ustalenie dla `params` jest potwierdzone co do lokalizacji (dotyczy `econParamsRawForBuild`, nie partii 1). Regeneracja `edge`/`post_central` pozostaje po partii 4 (manpower).

Pin nie zmieniony (`meta.pin` i manifesty bez zmian). DEPLOY/PUSH: NIE WYKONANO.

## 7. Runda 3 - obrona Operatora (odpowiedzi na zarzuty Final Control z rundy 2)

Korekta §6: **kolejnosc commitow** to `497b6461` (baza kodu, potomek `dcd3eadb`) -> `9a0f97cd` (kod partii 1) -> `60a90a1d` (dokumenty rundy 1) -> `639bdb74` (dokumenty rundy 2). Zapis "Baza: 60a90a1d, kod partii 1: 9a0f97cd" byl myląco ułożony i jest uznany za błąd.

| # | Zarzut | Decyzja | Dowod / zmiana |
|---|---|---|---|
| 1 | GOAL niespelniony: 60 z 67 hunkow `production.ts`/`turn-economy.ts` niezaportowanych; partia 2 (`building_costs.rs`) nie ruszona | **PRZYJETY** (temat OTWARTY, nie zamykam) | Zakres partii 2-6 wg §4. Ta runda nie portuje kolejnych hunkow: wykonano domkniecie luki z zarzutu 2. Status hunkow bez zmian: NASTEPNA-PARTIA. |
| 2 | M4 przezyla: `tick.owner_era.unwrap_or(1.0)` -> `1.0` w `recompute_city_food_balances_in_econ` nie jest mutantem rownowaznym | **PRZYJETY** | Nowy test `rust-port/engine/tests/p6_repin_b_recompute_era.rs` (`recompute_with_owner_era_matches_web`) na wektorze `tests/p6_repin_b_vectors/recompute_era.json` (1248 przypadkow; `ownerEra` = brak / 0.5 / 1 / 1.0000001 / 2 / 3 / 4 / 5 x populacja x poziom racji x spichlerz). Wektor z URUCHOMIONEGO weba 91dc998a: `gen-repin-b-recompute-era.mjs` (Node v22.22.0, kodowanie jak `gen-p67a-vectors.mjs`). Przed mutacja: PASS. Mutant M4 (`unwrap_or(1.0)` -> `1.0`): **FAILED** (`recompute_era[0]` i kolejne). Po przywroceniu pliku (`git checkout --`): PASS. Test `vector_covers_era_2_and_4_with_nonzero_cost` pilnuje, ze wektor nie jest pusty dla ery 2 i 4. Asercje P6.7A nie oslabione. |
| 3 | Wektory `edge` (78), `post_central` (72), `params` (8) nie zregenerowane z weba do 0 rozbieznosci | **PRZYJETY jako otwarte** | `edge`/`post_central`: roznice tylko w `manpower`/`manpowerCheck` (`manpowerMaxMultByOwnerId`, partia 4). Nie wolno nadpisac wektorow bez portu, bo testy P6.7A zrobilyby sie czerwone. Regeneracja po partii 4. `params`: `econParamsRawForBuild` (dane `econ-params`), poza zakresem partii 1, przypisane do partii danych (NASTEPNA-PARTIA). |
| 4 | Mutacje "min. 1 na hunk" niespelnione dla hunkow `production.ts`/`turn-economy.ts` niezaportowanych | **CZESCIOWO PRZYJETY** | Zaportowane hunki maja mutanty: hunk 44-45 (`computeCityFoodBalanceV85`, ownerEra) -> M3 (koszt bez mnoznika) ZABITY; hunk 46 (`recompute`) -> M4 ZABITY (zarzut 2). Hunki niezaportowane nie maja kodu do mutowania; mutacje dla nich sa wymagane w partiach 2-6, nie w tej rundzie. |
| 5 | Niedokladnosc SHA w raporcie (kolejnosc baza -> kod) | **PRZYJETY** | Poprawione w §6 i w tym §7. Baza `497b6461` jest potomkiem `dcd3eadb` (zgodnie z dispatchem), co sprawdzono poleceniem `git merge-base --is-ancestor` dla `639bdb74` (EXIT=0). |
| 6 | Test `p6_7a_growth` przekazuje stale `owner_era=1.0`; sciezka era>1 pokryta tylko czystymi funkcjami | **PRZYJETY w czesci recompute** | Wektory P6.7A (pin `edb8fb56`) nie maja `ownerEra` (`grep -c ownerEra` = 0), wiec stale 1.0 jest zgodne z wektorem. Sciezka era>1 przez `recompute` pokryta przez `p6_repin_b_recompute_era`; `computeCityRationCost` przez `p6_repin_b_ration_era`. Zarzut "tylko czyste funkcje" przestaje byc aktualny. |

Gate'y rundy 3 (`cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --no-fail-fast`, `git diff --check`): wyniki w logach `gate-*-r3.log` w katalogu runu (EXIT= na koncu kazdego logu).

Status tematu: **OTWARTY** (GOAL nie zrealizowany: 60 hunkow i partie 2-6 do wykonania, regeneracja `edge`/`post_central` po partii 4, zmiana pinu dopiero po krokach 1-5 REPIN-DELTA §6). Ta runda domyka luke M4 i korekte SHA, nie zamyka tematu.

NASTEPNA-PARTIA: partia 2 (`buildingWorkCost` -> `building_costs.rs`, z najpierw dodanym odpowiednikiem rabatu cywilizacyjnego), nastepnie partie 3-6 wg §4. DEPLOY/PUSH: NIE WYKONANO.
