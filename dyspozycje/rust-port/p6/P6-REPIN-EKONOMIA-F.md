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
