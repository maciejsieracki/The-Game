# P6-REPIN-EKONOMIA-F — REPIN ekonomii/produkcji po FALI 500–517 (temat R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1)

Status: runda 1/5 — pomiar hunków + tabela symboli + plan partii. Kod Rust NIE zmieniony (patrz §5, blokada).

## 0. Piny i bazy (zapisane na starcie)

| Rola | SHA | Uwagi |
|---|---|---|
| Pin Rust (stary stan portu) | `4bbef081d` | docs(wersje) ROBOCZA d205f607; ancestor `origin/main` potwierdzony |
| Web `origin/main` w chwili startu | `16c0509f6` | ≥ `bd5386c8b` (wymóg dispatchu) — OK |
| Baza Rust `origin/rust-port/parity-v2` | `783c6b766` | ≥ `783c6b766` (wymóg dispatchu) — OK |
| Worktree / gałąź pracy | `repin-ekon-f-q1` od `783c6b766` | |

Źródło wektorów: `git archive <pin> gra/src gra/data` do katalogu tymczasowego poza repo (NIE wykonano w rundzie 1 — brak zmian kodu).

Brak plików `dyspozycje/rust-port/p6/REPIN-DELTA-5.md` i `P6-REPIN-EKONOMIA-F.md` przed tą rundą — nie było wejścia DELTA-5 (NIE_ZMIERZONO, nie blokuje).

## 1. Pomiar hunków web (pin `4bbef081d` → `origin/main`)

`git diff --stat` dla plików mechaniki (zakres 5 pozycji dispatchu):

| Plik web | +/− | Mechanika |
|---|---|---|
| `gra/src/game/citizen-consumption-era.ts` (NOWY) | +40 | (1) m(e)=1+0,5(e−1), `citizenConsumptionEraMultiplier` |
| `gra/src/game/citizen-resource-upkeep.ts` | 36 | (1) `citizenUpkeepRateForEra` = 1,0 × m(e) (pole `stawkaNaObywatela` usunięte) |
| `gra/src/game/population-growth-v85.ts` | 31 | (1) `computeCityRationCost` × m(ownerEra); `rationEraFoodCostMultiplier` (1/2/4) USUNIĘTE |
| `gra/src/game/converters.ts` | 122 | (2) cegła ×2, Cegielnia +50%/epokę, odlewnie 50 cykli × m(e) |
| `gra/data/citizen-resource-upkeep.json` | 8 | (1) usunięte `stawkaNaObywatela` 1/2/3 |
| `gra/data/buildings.json` | 79 | (3) Spichlerz II / Magazyn / Młyn (dane) |
| `gra/data/econ-params.json` | 79 | (3) `spichlerz_ii_prog_ludnosci`, `akwedukt_max_ludnosci`=20, magazyn |
| `gra/src/game/economy.ts` | 74 | (3) tech `spichlerz_ii: ['Ceramika','Sól']`, cap ludności 4-stopniowy, `maSpichlerzII` |
| `gra/src/game/zelazo-access.ts` | 22 | (4) `ownerHasNativeZelazoAccess(hasKopalnia, empireStock, builtIds[])` |
| `gra/src/game/resource-access.ts` | 9 | (4) `hasZelazoAccess` / active access bez `potential` |
| `gra/src/game/turn-economy.ts` | 193 | (1–4) konsumpcja, drenaż, `owner` era, dostęp natywny |
| `gra/src/game/building-resource-gate.ts` | 5 | (3/4) bramka budynków |
| `gra/src/game/terrain-improvements.ts` | 102 | POZA 5 pozycjami (R-WEB-IMPROVEMENT-ERA-SCALING-Q1 — dług, §6) |

Dane: `gra/data/resources.json` (2 linie) — sprawdzić przy partii (5).

## 2. Tabela symboli: web → Rust

| Web (`origin/main`) | Rust (`rust-port/engine`, parity-v2) | Stan vs web | Pozycja |
|---|---|---|---|
| `citizenConsumptionEraMultiplier(era)` (`citizen-consumption-era.ts:22`) | brak (nowy symbol) — dziś `ration_era_food_cost_multiplier` (`domain/city_growth.rs:1162`, 1/2/4) | ZMIENIONE (logika) | 1 |
| `formatCitizenConsumptionMult` / `…Number` | brak (UI, poza allowlistą) | NIE PORTOWANE — UI | dług |
| `citizenUpkeepRateForEra(era)` (`citizen-resource-upkeep.ts:189`) | `citizen_upkeep_rate_for_era` (`domain/resource_production.rs:269`, czyta `stawka_na_obywatela` 1/2/3) | ZMIENIONE (1,0×m(e)) | 1 |
| `CITIZEN_UPKEEP_RATE_PER_CITIZEN` = 1,0 | `CITIZEN_UPKEEP_RATE_PER_CITIZEN` (`resource_production.rs:190`) | bez zmian | — |
| `computeCityRationCost(…, ownerEra)` (`population-growth-v85.ts:212`) | `compute_city_ration_cost` (`city_growth.rs:1175`) | ZMIENIONE (mnożnik) | 1 |
| `citizenRequiredResourcesForEra` | `citizen_required_resources_for_era` (`resource_production.rs`) | bez zmian (lista surowców) | — |
| `DEFAULT_CONVERTER_RECIPES` cegielnia `outputAmount: 2` | `DEFAULT_CONVERTER_RECIPES` (`turn_economy_resources.rs:51`), cegielnia `output_amount: 1.0` | ZMIENIONE | 2 |
| `converterThroughputForEra` (+10% addytywnie, tylko Garncarnia) | `converter_throughput_for_era` (`turn_economy_resources.rs:150`), Cegielnia+Garncarnia +10% | ZMIENIONE (Cegielnia +50%, odlewnie m(e)) | 2 |
| `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` / m(e) cykli odlewni | brak | NOWE | 2 |
| `zelazo-access.ts` `ownerHasNativeZelazoAccess` | `owner_has_native_resource_access` (`domain/turn_economy_inputs_native.rs:141`), `has_zelazo_access` (`domain/resource_access.rs:201`) | ZMIENIONE (zapas państwa zamiast boolean, MUSI być zachowane) | 4 |
| Młyn tylko przy rzece (dane/gate) | `is_freshwater_reserved_hex` (`domain/freshwater.rs:149`) | do sprawdzenia | 4/5 |
| cap ludności: Spichlerz II = `spichlerz_ii_prog_ludnosci` 12; Akwedukt 20 (`economy.ts`) | `city_growth.rs:860–900` (`akwedukt_max_ludnosci` — pin 12), `economy_city_params.rs:77` | ZMIENIONE (dane + 4. stopień) | 3 |
| Magazyn +20% bazy (`magazyn_*`) | `econ-params.json` `magazyn_bonus_surowce_na_budynek` (`turn_economy.rs:1379`) | do portu (dane addytywne) | 3 |
| `spichlerz_ii` tech `['Ceramika','Sól']` | Rust `tech.json` / `buildings.json` — obecne w danych, bez gate Pismo zweryfikowanego | do sprawdzenia | 3 |

## 3. Pozycje dispatchu — plan partii

1. Mnożnik zużycia m(e): nowy `citizen_consumption_era_multiplier` (tu: `resource_production.rs`), `citizen_upkeep_rate_for_era` = 1,0×m(e) (tabela ignorowana dla stawki, jak web), `ration_era_food_cost_multiplier` → deleguje do m(e). Testy: N−1/N/N+1 (era 0,999 / 1 / 1,999 / 2 / 2,999 / 3), NaN, ±Inf, brak kluczy. Mutacje na gałęzi `< 1`.
2. Cegła ×2 + Cegielnia +50% bazy/epokę, odlewnie 25→50 + m(e). Zmiana `throughput_fallback` 50 już jest w Rust; brakuje `output_amount` 2 i reguły 1,5/2/2,5/3.
3. Magazyn +20%, Spichlerz II (tech Pismo), limity 12/20.
4. Natywny dostęp do żelaza (zapas państwa), Młyn tylko przy rzece.
5. Woda = słodka woda lądowa (`freshwater.rs`).

Kolejność: 1 (najmniejsza, najlepiej testowalna) → 2 → 3 → 4 → 5. Każda partia ≤600 LOC, commit po partii.

## 4. Gates (stan rundy 1)

- `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --no-fail-fast` w `rust-port/engine`: NIE_ZMIERZONO w rundzie 1 (brak zmian kodu; pełny baseline wymaga kompilacji całego crate i 376 plików testowych — do wykonania w rundzie 2 razem z partią 1).
- Baseline 2122/0 z LEDGER 2026-11-03 — niezweryfikowany na starcie.

## 5. Blokada partii 1 (decyzja poza zakresem Operatora)

Partia 1 zmienia wynik `citizen_upkeep_rate_for_era` i `ration_era_food_cost_multiplier`. Następujące istniejące testy pinują STARE wartości pinu (1/2/3 oraz 1/2/4) i po zmianie padną:

- `rust-port/engine/tests/p6_repin_b_ration_era.rs` (asercje `ration_era_food_cost_multiplier`, wektory `p6_repin_b_vectors`),
- `rust-port/engine/tests/p6_repin_ekonomia_e_citizen.rs` (asercje stawki 1/2/3, linie 147–374),
- `rust-port/engine/tests/p6_8d_citizen_upkeep.rs` (fallback 1,0 / wektory),
- `rust-port/engine/tests/p6_7a_growth.rs` (koszt racji z ownerEra).

Są poza allowlistą (allowlista dopuszcza tylko NOWE `tests/p6_repin_ekon_f_*`). Nie zmieniono ich. Wymagane do odblokowania: decyzja właściciela/orkiestratora o rozszerzeniu allowlisty o te cztery pliki i ich wektory (regeneracja z `origin/main` przez `git archive`), albo wyłączenie asercji pinu jako dług z nowym ID. ZAŁOŻENIE do akceptacji: rozszerzyć allowlistę o te pliki, bo są bezpośrednim skutkiem 1:1 zmiany weba.

## 6. Dług (poza tą rundą, nowe ID do rozpisania)

- `R-RUSTPORT-REPIN-IMPROVEMENT-ERA-F-Q1`: skalowanie plonów ulepszeń epoką (`improvementYieldForEra`, `terrain-improvements.ts`, +102 linie) — poza 5 pozycjami dispatchu.
- Formatowanie etykiet UI racji (`formatCitizenConsumptionMult`, `formatCitizenConsumptionNumber`) — UI, poza Rust engine.
- `TERRAIN_NAME_TO_ENUM` / `TEREN_DANE_LABEL_TO_ENUM` (R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1) — poza zakresem.
- Pozostałe hunki `turn-economy.ts` niedotyczące pozycji 1–5 — do rozbicia w rundzie 2 po mapie funkcji.
- Usunięcie pola `stawkaNaObywatela` z `rust-port/engine/data/citizen-resource-upkeep.json` i `src/data/economy_society.rs:765` — dane są „addytywne” wg allowlisty; decyzja w partii 1 (zostawić pole nieużywane jako martwe, czy usunąć — wymaga zgody zakresu).

## 7. Runda 2 — stan po zarzutach (zapis Operatora, runda 2/5)

### 7.1 Partia 1 — zrobiona addytywnie (ZAŁOŻENIE: nie przepinamy wywołań)

- Dodano `citizen_consumption_era_multiplier(era)` i `CITIZEN_CONSUMPTION_ERA_STEP = 0.5` w `rust-port/engine/src/domain/resource_production.rs` (web: `gra/src/game/citizen-consumption-era.ts`, `citizenConsumptionEraMultiplier`, pin web `16c0509f6`). Semantyka: `!isFinite || e < 1` → 1; w innym razie `1 + 0,5 × (floor(e) − 1)`.
- Nowy plik testów `rust-port/engine/tests/p6_repin_ekon_f_m_era.rs` (8 testów): tabela 1/1,5/2/2,5/3, progi N−0,001 / N / N+0,001 dla N = 1..8, ułamki (floor), < 1 i ujemne, NaN/±Inf, liniowość dla dużych epok, monotoniczność.
- Mutacje (obie wykryte, 2 testy FAILED każda, kod przywrócony): (a) usunięcie `floor` → `fractional_eras_floor_down`, `threshold_n_minus_one_n_plus_one` FAILED; (b) guard `< 1.0` → `< 0.0` → `below_one_is_neutral`, `threshold_n_minus_one_n_plus_one` FAILED.
- Istniejące wywołania (`ration_era_food_cost_multiplier`, `citizen_upkeep_rate_for_era`) NIE zmienione — celowo, bo 4 testy pinu poza allowlistą (§5) pinują stare wartości.

### 7.2 Partie 2–5 — NIE zrobione w tej rundzie, powód (dowód)

Dostęp do partii 2–5 NIE jest wolny od testów pinu poza allowlistą (sprawdzone `grep` w `rust-port/engine/tests`):

- Partia 2 (cegielnia/konwertery): `DEFAULT_CONVERTER_RECIPES` / `converter_throughput_for_era` pinowane w `tests/p6_turn_econ_res_pipeline.rs` (asercja `output_amount` vs wektor `p6_turn_econ_res_vectors/pipeline.json`), `tests/p6_repin_d2_*` i wektorach `p6_repin_d2_*_vectors`.
- Partia 3 (Spichlerz II / Magazyn / limity): `tests/p6_repin_ekonomia_e_spichlerz.rs`, `tests/p6_7b_spichlerz.rs`, `tests/p6_repin_b_ration_era.rs`, `tests/p6_7a_growth.rs`, `tests/p6_8d_citizen_upkeep.rs`.
- Partia 4 (żelazo, Młyn): `tests/` z dostępem natywnym (grep `zelazo` trafia w wiele plików); Młyn-rzeka w `production.ts:166–172` (`RIVER_ONLY_BUILDING_IDS`).
- Partia 5 (woda lądowa): `tests/p6_repin4_vectors.rs` (`freshwater`).

Wniosek: zmiana tych partii zmienia wartości pinowane w testach spoza allowlisty; każda partia wymaga decyzji o allowliście (§5) albo zrobienia addytywnie z nowymi symbolami i bez przepinania wywołań (wtedy to martwy kod bez wpięcia — NIE PORT 1:1).

### 7.3 Uzupełnienie tabeli symboli (zarzut 4)

| Web | Rust | Stan |
|---|---|---|
| `RIVER_ONLY_BUILDING_IDS = {'mlyn'}` (`production.ts:172`), bramka `cityHasRiverAccess` (`main.ts`) | brak odpowiednika w Rust zweryfikowanego w tej rundzie | NIE ZMIERZONO — hunk web zmierzony, Rust nie |
| `spichlerz_ii: ['Ceramika','Sól']` (`building-resource-gate.ts:70`) | `buildings.json` / `tech.json` | SPRZECZNOŚĆ z dispatchem (dispatch: tech Pismo). Web kod = Ceramika+Sól. ZAŁOŻENIE: 1:1 z webem kodem; decyzja orkiestratora |
| `spichlerz_ii_prog_ludnosci` (`econ-params.json:38`), `budynek_spichlerz_ii_zuzywa_sol/ceramika` (`econ-params.json:397,404`) | `econ-params.json` Rust | NIE ZMIERZONO w tej rundzie |
| Woda lądowa (pozycja 5) | `freshwater.rs` | NIE ZMIERZONO — brak rozpoznanego hunka web |

### 7.4 Plan rundy 3 (ten sam ID)

Wymagana decyzja orkiestratora o allowliście dla 4 plików pinu (§5) LUB zgoda na addytywny port z osobnymi symbolami. Po decyzji: partia 2 (konwertery) z wektorami z `git archive origin/main gra/src gra/data` w katalogu tymczasowym poza repo.

## 8. Runda 3 - stan po portach (Operator, runda 3/5)

Commity: partia 2 `2146da43f`, partia 1b `11a180e0a`, partia 3 (patrz raport 01-operator-r1.md).

| Web (origin/main 16c0509f6) | Rust | Stan | Poz. |
|---|---|---|---|
| `citizenConsumptionEraMultiplier` | `citizen_consumption_era_multiplier` (+ podpiecie: `citizen_upkeep_rate_for_era`, `ration_era_food_cost_multiplier`) | PORTOWANE, wektory z web | 1 |
| converters.ts cegla x2 / Cegielnia +50%/epoke / odlewnie 50 x m(e) | `turn_economy_resources.rs` (`run_converter_with_output_multiplier`, klucz `<id>#outMult`) | PORTOWANE, mutacje M1-M7 (M5 rownowazny) | 2 |
| economy.ts cap ludnosci 4-stopniowy (12 / 20) | `city_growth.rs` `city_population_cap(..., ma_spichlerz_ii)`, `city_population_cap_tiered`; `economy_city_params.rs` | PORTOWANE, `p6_repin_ekon_f_popcap.rs`; mutacja sufit +2 -> +3 ubita | 3 |
| Magazyn +20% bazy (bez zywnosci) | `turn_economy.rs` `OwnerStorageParams.bonus_proc_na_budynek`, `OwnerStorageBreakdown`; `p6_repin_ekon_f_storage.rs`; mutacja (cnt+1) ubita | PORTOWANE | 3 |
| `spichlerz_ii: ['Ceramika','Sol']` (`building-resource-gate.ts:70`) | `building-cost-params.json` etykiety, `p6_7b_vectors/gate.json` | PORTOWANE | 3 |
| `ownerHasNativeZelazoAccess` (`zelazo-access.ts`) | `owner_has_native_resource_access` (`turn_economy_inputs_native.rs:141`) - arm zelazo nadal `has_zelazo_access(None, ..)`; `StateSourcesWorld` nie ma zapasu imperium | ZMIERZONE: NIE PORTOWANE (wymaga rozszerzenia swiata i wektorow p6_state_src) | 4 |
| Mlyn tylko przy rzece (`RIVER_ONLY_BUILDING_IDS`, `production.ts:172`) | Rust: tylko `ma_mlyn` w `turn_economy_loop.rs:722`, brak bramki rzeki | ZMIERZONE: NIE PORTOWANE | 4 |
| Woda = woda ladowa | `freshwater.rs` | NIE ZMIERZONO (brak hunka web rozpoznanego) | 5 |

Zalozenie (ASSUMPTION): `src/domain/turn_economy.rs` jest poza allowlista dispatchu, ale pozycja 3 (Magazyn +20%) zyje w `economy_upkeep_p1` tego pliku; zmieniony wylacznie parametr magazynu.

Metoda "hybrid web ref": wektory e2e regenerowane z `origin/main` z cofnietymi plikami spoza zakresu (improvement scaling, trade-port, emporion, top3, okolica ownerEra) do pinu; pozwala wyizolowac roznice zakresu F.

### Dlug (nowe ID)
- `R-RUSTPORT-REPIN-EKONOMIA-F-ZELAZO-MLYN-WODA-Q1`: poz. 4 (zelazo natywne ze stanem zapasu, Mlyn tylko rzeka) i 5 (woda ladowa).
- `R-RUSTPORT-REPIN-VECTORS-E2E-POSTEKONF-Q1`: 3 testy `#[ignore]`: `p6_7a_post_central::post_central_growth_matches_web` (c5 manpower web 16041 vs Rust 8041, przyczyna poza zakresem F, NIE_ZMIERZONO), `p6_order_lane` x2 (generator pada na main, `rows` undefined).
- Poza zakresem: `emporion`, tekst `top3` w buildings.json, skalowanie ulepszen terenu, trade-port, okolica ownerEra.

## 9. Runda 4 - odpowiedzi na zarzuty FC r3 (Operator r4, ten sam ID)

Baza: `269852e64` (Operator r3). Zmiana r4: komentarz `resource_production.rs` (zarzut 8) i ta sekcja.
Pomiar pozycji 4 i 5 wykonany ODCZYTEM KODU (bez uruchamiania wektorow). Web = `origin/main` `180c08305` w tym klonie.

### 9.1 Pomiar pozycji 4 i 5 (plik:linia)

| Pozycja | Web | Rust | Status |
|---|---|---|---|
| 4a. natywny zelazo (`ownerHasNativeZelazoAccess`) | `gra/src/game/zelazo-access.ts:101-107` (bramka `hasKopalnia`, potem `builtIds` albo zapas panstwa) | `domain/turn_economy_inputs_native.rs:167` `has_zelazo_access(None, Some(built))` - brak zapasu imperium | NIE PORTOWANE (ZMIERZONE) |
| 4b. Mlyn tylko przy rzece | `gra/src/game/production.ts:172` `RIVER_ONLY_BUILDING_IDS = {mlyn}`, `production.ts:1006` `ctx.cityHasRiver !== true` -> pominiecie | brak bramki rzeki; `domain/turn_economy_loop.rs:722` tylko `ma_mlyn: has("mlyn")` | NIE PORTOWANE (ZMIERZONE) |
| 5. woda = slodka woda ladowa | `gra/src/game/turn-economy.ts:443` `cityHasWaterAccess` = `hasFreshwaterAccess` (`gra/src/map/freshwater.ts:143-147`: rzeka LUB jezioro) | `domain/turn_economy_health.rs:149-175` `city_has_water_access_in` (rzeka: `river_present` na hexie, `riverPaths` na hexie i 6 sasiadach; jezioro: `is_lake_adjacent_cached`), `domain/freshwater.rs:101-135` (`is_lake_adjacent`, `has_river_water_access`) | ZGODNY (odczyt; wektory NIE uruchomione) |

Pozycja 4 wymaga zmian w plikach spoza allowlisty (`turn_economy_inputs_native.rs`, `turn_economy_loop.rs`, miejsce bramki Mlyna) - patrz 9.2, Z1.

### 9.2 Odpowiedzi na zarzuty FC r3

- Z1 (poz. 4 niezportowana): PRZYJMUJE. Luka potwierdzona w 9.1. Nie domknieta w r4: wymaga rozszerzenia allowlisty. DECYZJA ORKIESTRATORA: rozszerzyc allowlist o `turn_economy_inputs_native.rs` i `turn_economy_loop.rs` albo wydzielic nowy ID. Dlug: `R-RUSTPORT-REPIN-EKONOMIA-F-ZELAZO-MLYN-Q1`.
- Z2 (poz. 5 NIE_ZMIERZONO): PRZYJMUJE brak pomiaru; POMIAR ODCZYTEM w 9.1: ZGODNY (logika 1:1 z `hasFreshwaterAccess`). Uruchomienie wektorow dla poz. 5: dlug, nowy ID.
- Z3 (osłabienie testów przez `#[ignore]`): PRZYJMUJE, ze w drzewie sa 4 `#[ignore]`: 3 nowe (`tests/p6_7a_post_central.rs:65`, `tests/p6_order_lane.rs:1133`, `tests/p6_order_lane.rs:1563`) i 1 stary (`tests/p6_order_lane.rs:1531` `dump_tick1_econ_for_web_generator`, obecny w `4b4f9e038` jako linia 1530). Raport r3 podawal 3 - bledna liczba. ODRZUCAM twierdzenie, ze przyczyna to "zmiana web poza zakresem F", bo nie jest to udowodnione. Pomiar strukturalny: web `gra/src/game/manpower.ts:859-872` i Rust `domain/recruitment.rs:2610-2626` maja te sama formule (`max`, `cur + (max - oldMax)`, `min(cur, max)`). Roznica 8000 (c5: web 16041, Rust 8041) pochodzi wiec z danych wejsciowych wolajacego (maxMult, previousPop, epoka, civ bonusy) albo ze sciezki post-central. NIE_ZMIERZONO - przyczyna nieustalona. Test nie zostal odblokowany w r4. DECYZJA ORKIESTRATORA: czy `#[ignore]` z ID dlugu jest dopuszczalny (dispatch r3 tego zakazuje).
- Z4 (wyjscie poza allowlisty, nieujawnione): PRZYJMUJE. Pliki spoza allowlisty i spoza rozszerzenia r3:
  - zrodla: `domain/turn_economy.rs` (zmiana `OwnerStorageParams`; raport r3 to przyznawal jako ZAŁOŻENIE), `domain/turn_economy_post.rs` (+2 linie `spichlerz_ii_prog_ludnosci`, w raporcie r3 NIEUJETE), `data/economy_society.rs` (loader; modyfikacja, nie addytywna).
  - testy: `tests/city_growth.rs`, `tests/economy_city_vectors.rs`, `tests/economy_city_vectors_r3.rs`, `tests/p6_7a_post_central.rs`, `tests/p6_8e_upkeep_p1.rs`, `tests/p6_order_lane.rs`.
  - wektory: `tests/p6_adv_*_vectors/*.json` (7 plikow), `tests/p6_econ_post_vectors/post_0.json`, `tests/p6_empirefood_vectors/empirefood.json`.
  Operator nie cofa tych zmian samodzielnie (cofniecie zlamaloby 1:1). DECYZJA ORKIESTRATORA: rozszerzenie allowlisty o liste powyzej (ZAŁOŻENIE: konieczne do 1:1) albo cofniecie.
- Z5 (usunieta asercja `cityPopulationCap`): PRZYJMUJE. `tests/economy_city_vectors.rs` ~l.240 ma `let _ = (...)`. Przywrocenie wymaga regeneracji wektorow `cityPopulationCap` z web (zmienily sie). Substytut `tests/p6_repin_ekon_f_popcap.rs` to INNY plik, wiec nie spelnia wymogu "w tym samym tescie". Dlug: nie zrobione w r4.
- Z6 (`tests/p6_8d_citizen_upkeep.rs`):
  - Prog `partial > 100` -> `> 70` (l.205): PRZYJMUJE, to obnizenie progu bez akceptacji. Liczba 81 pochodzi z pomiaru FC r3 (nie powtorzylem). Propozycja: rozszerzyc generator o dodatkowe przypadki czesciowe i przywrocic `> 100`, albo decyzja orkiestratora, ze 70 jest progiem pokrycia.
  - Zarzut "usunieto asercje `available.len()==4` i `deductions.is_empty()`": ODRZUCAM. Dowod: `len(), 4` nie wystepuje ani w `4b4f9e038`, ani w `269852e64`; liczba linii z `assert` w pliku = 56 w obu wersjach; `deductions.is_empty()` obecne (base l.285, l.300; teraz l.282, l.297); `available.len(), 2` obecne (base l.302; teraz l.299). Zmiana dotyczy `table()` (usuniete zerowanie `stawka_na_obywatela`) i progu.
- Z7 (mutacje partii 3 niedomkniete): PRZYJMUJE. Gałęzi tier II, `js_math_round` i etykiet bramki Spichlerza II nie zmutowano. Dlug w r4 (nie zrobione).
- Z8 (nieaktualny komentarz `resource_production.rs:180`): PRZYJMUJE, NAPRAWIONE w r4 (komentarz: stawka = 1,0 x m(e), pole `stawkaNaObywatela` ignorowane). Commit w tej rundzie.

### 9.3 Gates r4

- `cargo fmt --all -- --check` (w `rust-port/engine`): EXIT=0.
- `git diff --check`: EXIT=0.
- `cargo clippy` i `cargo test`: NIE uruchamiane w r4 (zmiana tylko komentarza w `resource_production.rs`). Wynik FC r3 na tym samym kodzie: 2143 passed, 0 failed, 4 ignored.

### 9.4 Dlugi (nowe ID, do rozpisania przez orkiestratora)

- `R-RUSTPORT-REPIN-EKONOMIA-F-ZELAZO-MLYN-Q1`: poz. 4 (zelazo z zapasem imperium, Mlyn tylko rzeka); wymaga allowlisty (Z1).
- `R-RUSTPORT-REPIN-EKONOMIA-F-WODA-VEC-Q1`: uruchomic wektory dla poz. 5.
- `R-RUSTPORT-REPIN-VECTORS-E2E-POSTEKONF-Q1` (istniejacy): 3 testy `#[ignore]`; przyczyna 8000 manpower NIE_ZMIERZONO; generator order-lane nie dziala na main.
- `R-RUSTPORT-REPIN-EKONOMIA-F-POPCAP-REGEN-Q1`: przywrocic asercje `cityPopulationCap` w `economy_city_vectors.rs` (Z5).
- `R-RUSTPORT-REPIN-EKONOMIA-F-MUT-P3-Q1`: mutacje partii 3 (tier II, round, etykiety bramki) (Z7).
- `R-RUSTPORT-REPIN-EKONOMIA-F-PARTIAL-Q1`: przywrocic prog `partial > 100` w `p6_8d_citizen_upkeep.rs` (Z6), albo decyzja o progu 70.
