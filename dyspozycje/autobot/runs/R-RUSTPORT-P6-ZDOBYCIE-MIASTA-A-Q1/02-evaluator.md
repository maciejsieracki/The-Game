# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A)
GOAL: zdobycie miasta po wygranym szturmie gracza z wyłomem zastosowane do `PlayableState` w kolejności pinu `07d2fbd72`.
OCENIANY KOD: `81662fd38` (gałąź `rust-port-wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1`), baza `01abcbf5e` = `origin/rust-port/parity-v2` (sprawdzone `merge-base --is-ancestor`: OK).
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone samodzielnie

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie (`zma-eval/target`, usunięty po bramkach), z `rust-port/engine`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib --test bridge_contract --test p6_k5loop_wiring_b --test p6_k5loop_wiring_b_pin --test p6_siege_transfer --test p6_siege_transfer_effects --test p6_siege_transfer_effects_q4 --test p6_siege_transfer_prod --test p6_siege_transfer_q5 --test p6_siege_capital_plunder --test p6_siege_capture_events --test p6_zdobycie_miasta_a --test p6_zdobycie_miasta_a_bridge` | EXIT 0 (lib 144, bridge_contract 10, wiring_b 15, wiring_b_pin 2, zdobycie_a 6, zdobycie_a_bridge 7, pozostałe zielone) |
| `cargo test --all-targets --no-fail-fast` (checkout z `dyspozycje/`) | EXIT 0: 551 binarek, 4188 passed, 0 failed, 1 ignored (istniejący przed tematem) — zgodne z raportem Operatora |
| Generator `node rust-port/engine/tests/p6_zdobycie_miasta_a_gen.mjs` | pinSha256 `a5810e8a…8979` (strażnik), MD5 `04c0ea29e185c7ae3e3dc634cc8fca7e` = plik w commicie; `git status` czysty po regeneracji |

## 2. Allowlista, zakazy

- Diff `01abcbf5e..81662fd38`: 9 plików, wszystkie w allowliście (`city_capture_apply.rs` nowy, `mod.rs` jedna linia `pub mod`, `playable.rs` jedno pole + 2 inicjalizatory, `siege_battle_apply.rs`, 2 testy, generator, wektory, raport). `bridge.rs`, `bridge_contract.rs` bez zmian (D-ZMA-2 — rozszerzenie `FinishSiegeBattle`, `CONTRACT_VERSION` bez zmian). Nie ruszono `siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `client`, `renderer`, `src-tauri`, `gra/`. Sekcja „Pliki spoza allowlisty”: brak takich plików — OK.
- Brak `#[ignore]`, brak usuniętych asercji (`git diff | grep '^-.*assert'` puste). Trailery: tylko `Claude-Session:`, brak `Co-Authored-By`.
- `apply_outcome` (T7b) zachowuje wektory bajt w bajt (`p6_k5loop_wiring_b_pin` zielony); refaktor `validate_storm_siege` wydzielony bez zmiany zachowania.

## 3. Zgodność z pinem (przeczytany tekst `git show 07d2fbd72`)

- `applyCityCaptureToMap` (`main.ts:36034-36264`): kolejność w porcie = pin: watch cudów → P9 → `settleWonderTransfer` → (`triggerRebelProtectionWarConsequence` no-op) → `maybeResolveRegularWarOnCityCapture` (gracz = no-op, `:35988`) → `recordWarCityLossForPair` → (kolejka/religia NOT_APPLIED) → `playerEverOwnedCityByOwner.add` → (`syncCityGarnizon`) → `endMapSiege` → `runCapitalCapturePlunder` → (`recordCityCaptureEvent` NOT_APPLIED). Zgodne.
- P9 `applyCityCaptureAfterBattle` (`post-battle-map.ts:493-596`): strata ludności (`applyCapturePopulationLoss`, `cities.ts:1235-1252`, zapis `capturedFromOwnerId = prevOwner`), splice jednostek starego właściciela, odczyt kotwicy PO splice, wejście kotwicy+stosu (bez cywilów), `ruchLeft = max(0, ruchLeft-1)`, `oblegane=false`. Zgodne.
- Bramka `main.ts:34661-34679` + `validateActiveSieges` `:34744` po zdobyciu: zgodne. D-ZMA-9 (podwójne `validate`) sprawdzone analitycznie: przed wejściem kończy oblężenie tylko gdy brak wojny albo brak sąsiada oblegającego — wtedy pin po wejściu także kończy (jednostki wchodzą na odległość 0); równoważne.
- D-ZMA-1 (przemienność `spendAttackMpOnLive` z `syncStackRuchLeft`) sprawdzone na tekście `post-battle-map.ts:357-402`: `max(0,min-1) = min(max(0,a-1))`, zbiory jednostek zgodne — OK.
- D-ZMA-7: osiągalność AI↔AI sprawdzona — `siege_battle_apply.rs:665` odrzuca kotwicę ≠ gracz (`NotHumanBesieger`), więc błąd AI↔AI jest nieosiągalny z mostu. OK.
- Generator: P9, `capital-capture.ts`, `barbarians.ts`, `wonder-transfer.ts`, `territory.ts`, `siegeMachines.ts`, `diplomacy-siege-war-gate.ts`, `battleScene._battleUnitsForMapExport` WYKONYWANE z tekstu pinu (strażnik SHA). Klej `main.ts` (P1, `runCapitalCapturePlunder`, `eliminateOwner`, `recordWarCityLossForPair`) przepisany ręcznie z cytatem linii — sprawdziłem go z tekstem pinu (`:11488-11493`, `:11543-11550`, `:36034-36264`): zgodny w zakresie pól stanu. Uwaga N5 niżej.

## 4. Mutanty Evaluatora (25 własnych, inne niż M01–M33 Operatora; bramka = oba testy tematu, kopia źródeł w scratchpadzie)

ZABITE (13): E03 `power_record` z flagą barbarzyńcy=true, E04 `power_record` pominięte, E06 `freshDiploPairMeta` bez `trustPnGainedThisTurn`, E07 `ostatniaTura` pominięta, E08 `num()` zawsze float, E13 odwrót obrońców bez fallbacku `defAlive[0]`, E14 sync stosu max zamiast min, E15 skarbiec gracza z mapy AI, E16 `add_researched_techs` no-op, E18 zapis puli Pracy bez wpisu przy 0, E19 `siege_ended` tylko z `apply_outcome`, E24 `population_after` = przed, E25 brak `eliminated_owner_id`.

PRZEŻYŁY — RÓWNOWAŻNE (6, uzasadnienie):
- E01 `web_owner` = tożsamość (bez 1→0): id 0 w `run_capital_capture_plunder` steruje wyłącznie wywołaniami UI (triumf, `recordCivElimEvent`, `siege_capital_plunder.rs:672-724`); stan identyczny.
- E09 `building_count = 0`: tylko wiersze raportu (UI).
- E12 `validate_storm_siege` po zdobyciu pominięte: miasto zdjęte z `oblegane` w `end_map_siege` → wczesny powrót.
- E17 `set_treasury` AI bez `js_max0`: plądrowanie nigdy nie zapisuje wartości ujemnej (stany osiągalne).
- E22 `record_war_city_loss_for_pair` bez sprawdzenia wojny: zdobycie zachodzi tylko w wojnie (bramka `NotEnemies`).
- E23 kotwica-cywil wchodzi na heks: kotwica szturmu = jednostka zdolna do ataku (nieosiągalne).

PRZEŻYŁY — LUKI TESTÓW (6): E02, E05, E10, E11, E20, E21 (zarzuty N1–N3).

Łącznie z mutantami Operatora: 58 mutantów, kryterium „≥ 20, każdy zabity lub jawnie równoważny” — spełnione dla gałęzi stanu; luki dotyczą sprawdzeń, nie zachowania.

## 5. Zarzuty / uwagi (bez FAIL)

- **N1 (test, stan)** E02: usunięcie `state.economy.units.remove(&uid)` w splice P9 (`city_capture_apply.rs:884`) przeżywa — test wektorów porównuje tylko `state.units`, nie wykrywa osieroconych wpisów `economy.units` usuniętych jednostek. Dodać asercję: zbiór kluczy `economy.units` = zbiór id `state.units` (lub jawny warunek) po każdym scenariuszu.
- **N2 (test, DTO)** E10/E11/E20/E21: pola wyniku mostu `treasuryTaken`, `techsCopied`, `enteredUnitIds` (deduplikacja), `removedUnitIds` (wpisy ze splice P9) nie są sprawdzane dokładną wartością; mutanty przeżywają. Dodać asercje wartości w teście wektorów (pin daje dane: różnica skarbca, technologie, id jednostek).
- **N3 (test, pokrycie)** E05: pominięcie węzłów fortów w `territory_nodes` przeżywa — scenariusz `cuda_terytorium` ma fort, ale nie zmienia on wyniku przekazania cudów. Brak wektora, w którym fort decyduje o właścicielu terytorium cudu.
- **N4 (zakres / kryteria końca — decyzja orkiestratora)** Kryteria końca wymieniają „kolejkę produkcji”; GOAL wymienia `applyPostCaptureLawOnCapture` oraz składanie z `apply_transfer_with_effects` i `record_city_capture_event`. Stan `PlayableState` nie ma `cityProd`, pól Prawa/rebelii, magazynu zdarzeń zdobycia ani kroniki, więc Operator wpisał je do `notApplied` (D-ZMA-4) i nie użył `apply_transfer_with_effects` (P9 złożone w module z tych samych klocków: `apply_capture_population_loss`). Jest to jawne, a nie ciche pominięcie, ale kryterium „kolejka produkcji” formalnie NIE jest spełnione — wymaga akceptacji orkiestratora i wpisu w `REJESTR-RUST.md` (oraz tematu następczego dla pól stanu).
- **N5 (wiarygodność wektorów)** Klej `main.ts` w generatorze jest przepisany, a nie wykonywany; zweryfikowany ręcznie (§3). `eliminateOwner` w generatorze odwzorowuje tylko jednostki/relacje/meta/stolice — pozostałe skutki eliminacji w Rust (`eliminate_owner`: umowy, `war.forced`, era) nie są objęte wektorem tego tematu (mają własne testy).
- **N6 (dług, potwierdzony)** `captured_from_owner_by_city` — pole stanu pisane tylko przez tę ścieżkę; zapis/odczyt w `save_load` NIE_ZMIERZONO (ZMA-DL-2); kapitulacja (W4) go nie ustawia, gdy zostanie wpięta — musi.
- **N7 (dług, potwierdzony)** D-ZMA-5 (mapowanie id 1↔0) nie ma testu z obserwowalnym skutkiem w stanie (E01 równoważny) — przy wpięciu skutków UI (zjednoczenie/triumf) potrzebny test.

## 6. Tabela W1–W14

Zweryfikowana z rozpoznaniem i pinem — zgodna z §4 raportu Operatora (W1, W2 zastosowane; W10 producent wspólny; reszta poza zakresem z odsyłaczem).

## 7. Następny krok

Obrona Operatora (02a) do N1–N4; Final Control. N1–N3 to poprawki testów (bez zmian zachowania), N4 — decyzja orkiestratora o kryterium „kolejka produkcji”.
