# P6-REPIN-AUTOIMPROVE — repin auto-ulepszeń terenu (Rust) do weba

TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1
STATUS dokumentu: runda 1/5 — etap pomiarowy (hunki, tabela symboli, baseline bramek). Kodu portu jeszcze NIE zmieniono.

## 1. Piny i bazy

| Rola | Pin / SHA | Uwagi |
|---|---|---|
| Pin Rust (stary, deklarowany) | `4bbef081d` | wg dispatch; `docs(wersje): ROBOCZA d205f607` |
| Pin weba (nowy, start tematu) | `16c0509f633a0c437ddf4fbdf1f41a38e109befc` (`origin/main` w chwili startu) | ZAŁOŻENIE zgodne z dispatch: pin = `origin/main` w chwili startu |
| Baza Rust | `783c6b766` (`origin/rust-port/parity-v2`) | warunek `>= 783c6b766` spełniony |
| Baza weba | `origin/main` >= `bd5386c8b` | warunek spełniony (ancestor) |

Rozbieżność do rozstrzygnięcia w rundzie 2: nagłówek `rust-port/engine/src/domain/auto_improvements/relief_preserving.rs:1` deklaruje „wersję z PINA 91dc998a”, a dispatch deklaruje `4bbef081d`. ZAŁOŻENIE tej rundy: operatywny pin Rust to `4bbef081d` (dispatch), a nagłówek jest nieaktualny. Do weryfikacji przez `git log` na pliku Rust.

Worktree tematu: `/home/user/The-Game/.claude/worktrees/wf_f60b9ec2-194-1`, gałąź `op-repin-autoimpr-r1` (od `783c6b766`).

## 2. Hunki webu: pin `4bbef081d` → `origin/main` (zmierzone `git diff -U0`)

| Plik | Hunki | Linie nowe (zakres) | Symbole (nowa wersja) |
|---|---|---|---|
| `gra/src/game/auto-improvements.ts` | 109 | 6–1215 | patrz tabela 2a |
| `gra/src/game/terrain-improvements.ts` | 15 | 125–425 | NIE_ZMIERZONO (mapowanie symboli w rundzie 2) |
| `gra/src/game/relief-preserving-improvements.ts` | 2 | 9–27 | `relief-preserving` (zmiana wartości/relief) |
| `gra/src/game/road-network-plan.ts` | plik NOWY | 1–284 | `planRoadNetwork` (L109), `MinHeap`, `COST_*`, `NEAREST_K=5` |
| `gra/src/game/auto-build-gate.ts` | plik NOWY | 1–48 | `AUTO_BUILD_ENABLED_DEFAULT=false` (L17), `isAutoBuildAllowedForOwner`, `autoBuildFromSaveMeta`, `autoBuildFromNewGameParam` |

Suma: 126 hunków w 3 plikach zmienionych, 2 pliki nowe. Razem `+1022 / −210` (`git diff --stat`).

### 2a. Symbole `auto-improvements.ts` (nowa wersja; zakres linii → deklaracja)

- L6–L39: importy/stałe nagłówka (lokalne zmiany, 6 hunków).
- L188: `ZERO_YIELD_IMPROVEMENTS`.
- L200–L221: `WYRAB_MIN_FOREST_IN_RADIUS`, `RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=2`, `RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR=60`, `AI_RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=1`, `AI_RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR=60`, `AUTO_ULEPSZENIA_PRACA_RESERVE=30` (nowe stałe FALA 500).
- L261: `hasNonFoodResourceDeficit`.
- L271: `freshSurplusReport` (+23 linie).
- L325: `prioritiesForUlepszeniaFocus`.
- L540: `FOOD_LIVESTOCK_STAGE_KEYS`.
- L603: `IMPROVEMENT_FOR_DEFICIT` (+14).
- L671: `FORT_CLAIM_KEYS`; L724: `pickFortClaims`.
- L842: `pickAutoImprovements` (+55; wejście publiczne).
- L902: `pickAutoImprovementsStaged` (ścieżka etapowa; `ROAD_PLAN_CACHE` L894, `roadPlanHexes` L851).
- L1215: `pickAutoImprovementsSinglePass`.

### 2b. Pozostałe pliki

- `terrain-improvements.ts`: zakresy 125–425 (15 hunków); mapowanie na symbole NIE_ZMIERZONO w tej rundzie.
- `relief-preserving-improvements.ts`: 9–27 (2 hunki).

## 3. Tabela symboli: web ↔ Rust (pin 4bbef081d)

| Web (TS) | Rust (`rust-port/engine/src/domain/`) | Status |
|---|---|---|
| `ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE` | `auto_improvements.rs:72` (`[&str; 8]`), użycie `auto_improvements/city_phases.rs:242` | do przeglądu względem nowej listy weba |
| `ULEPSZENIA_ZYWNOSCIOWE` | `auto_improvements.rs:84` | alias na powyższe |
| `hasNonFoodResourceDeficit` | `auto_improvements.rs:229` `has_non_food_resource_deficit` | do porównania |
| `freshSurplusReport` | `auto_improvements.rs:237` `fresh_surplus_report` | do porównania |
| `prioritiesForUlepszeniaFocus` | `auto_improvements.rs:242` `priorities_for_ulepszenia_focus` | do porównania |
| `IMPROVEMENT_FOR_DEFICIT` / `deficitImprovementKeys` | `auto_improvements.rs:255` `improvements_for_deficit`, `:263` `deficit_improvement_keys` | do porównania |
| `actionableDeficitKeys` | `auto_improvements.rs:276` `actionable_deficit_keys` | do porównania |
| `isCityLimitExhausted` | `auto_improvements.rs:287` `is_city_limit_exhausted` | do porównania |
| `pickFortClaims` / `FORT_CLAIM_KEYS` | `auto_improvements/fort_claim.rs:37` `fort_node`, `:49` `radius_of` | do porównania |
| `pickAutoImprovements` | `auto_improvements/pick.rs:111` `pick_auto_improvements` | wejście; PRODUKCYJNY WYWOŁUJĄCY poza zakresem (dług P7) |
| `pickAutoImprovementsStaged` | `auto_improvements/city_phases.rs`, `hex_phases.rs:319` `step0_applies` | do porównania |
| `pickAutoImprovementsSinglePass` | `auto_improvements/single_pass.rs:152` `pick_auto_improvements_single_pass` | do porównania |
| `relief-preserving` (predykat) | `auto_improvements/relief_preserving.rs:17` `preserves_hill_relief_key`, `:25` `preserves_hill_relief` | do porównania; nagłówek pliku wskazuje pin 91dc998a |
| flaga `irrigation` (irygacja nie po farmach) | `auto_improvements/opts.rs:114` `irrigation_needs_farm`, `city_phases.rs:189` | jest w Rust; zgodność z hunkami do zmierzenia |
| `planRoadNetwork` (`road-network-plan.ts`, NOWY) | BRAK w `roads.rs` (brak `plan_road_network`) | DO PORTU (brak odpowiednika) |
| `auto-build-gate.ts` (NOWY) | BRAK (brak `auto_build`/`AUTO_BUILD` w `src/`) | DO PORTU (brak odpowiednika) |
| `terrain-improvements.ts` (15 hunków) | NIE_ZMIERZONO | mapowanie w rundzie 2 |

## 4. Baseline bramek na `783c6b766` (przed zmianami)

Uruchomione w `rust-port/engine` z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`:

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`Finished dev profile`).
- `cargo test --no-fail-fast`: pierwsze uruchomienie przerwane limitem 580 s (EXIT=124) na `p6_m07a_cap`; reszta uruchomiona per binarka: 97 binarek `rest.log` (681 passed, 0 failed) plus `p6_m07a_cap` osobno (1 passed). Łącznie 1440 + 681 + 1 = **2122 passed, 0 failed**, zgodnie z LEDGER 2026-11-03 (2122/0).

Surowe logi: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (`fmt.log`, `clippy.log`, `test.log`, `rest.log`, `m07a.log`).

## 5. Zakres i zobowiązania (pozostałe rundy)

Wykonane w rundzie 1: pin, hunki, tabela symboli, baseline bramek.

Nie wykonane w rundzie 1 (NIE_ZMIERZONO / do zrobienia):
- port hunków `auto-improvements.ts` do `auto_improvements*` (rundy 2–3);
- port `road-network-plan.ts` (`planRoadNetwork`) i `auto-build-gate.ts` — nowe moduły Rust (ALLOWLISTA: `auto_improvements/**`, `roads.rs` tylko jeśli hunk tego wymaga);
- mapowanie `terrain-improvements.ts` (15 hunków) na symbole Rust;
- regeneracja wektorów: generator scenariuszy jak w 8I (2227 scenariuszy na `4bbef081d`) odtworzony na pinie `16c0509f6` przez `git archive` do `mktemp -d` poza repo;
- mutacje (cel ≥85% zabitych, reszta z dowodem równoważności) i testy NaN/progów;
- nowe testy `rust-port/engine/tests/p6_repin_autoimpr_*`.

Jawnie poza zakresem (wg dispatch): produkcyjny wywołujący `pick_auto_improvements` (dług P7).

## 6. Założenia rundy 1

- Z1: operatywny pin Rust = `4bbef081d` (dispatch); nagłówek `relief_preserving.rs` (`91dc998a`) traktowany jako nieaktualny; do potwierdzenia.
- Z2: pin weba = `origin/main` `16c0509f6` (start tematu).
- Z3: `terrain-improvements.ts` mapowanie przeniesione do rundy 2 (koszt pomiaru); zakres linii podany.
- Z4: pliki NOWE (`road-network-plan.ts`, `auto-build-gate.ts`) traktowane jako wymagające nowych modułów Rust; allowlista pozwala na `auto_improvements/**` i `rust-port/engine/data/**` (addytywnie).
