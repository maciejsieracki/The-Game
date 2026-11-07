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
