# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A)
GOAL: zdobycie miasta po wygranym szturmie gracza z wyłomem (hak T7b `capture_requested`) zastosowane do `PlayableState` w kolejności pinu `07d2fbd72` (P1 `applyCityCaptureToMap` + P9 `applyCityCaptureAfterBattle` + `runCapitalCapturePlunder`), wpięte w `FinishSiegeBattle`.
OCENIANY KOD: `ae4e84904` (gałąź `rust-port-wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1-obrona`; kod Operatora `81662fd38` + obrona `92fe96869`, `193377dbd`, `ce2d60c00`). Baza `01abcbf5e` = `origin/rust-port/parity-v2` w chwili kontroli (`git merge-base --is-ancestor 01abcbf5e ae4e84904`: OK).
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone samodzielnie

Z `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`zma-fc/target`, poza repo, USUNIĘTY po bramkach), uruchomione w tle (`setsid nohup`), checkout pełny (z `dyspozycje/`).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib --test bridge_contract --test p6_k5loop_wiring_b --test p6_k5loop_wiring_b_pin --test p6_siege_transfer --test p6_siege_transfer_effects --test p6_siege_transfer_effects_q4 --test p6_siege_transfer_prod --test p6_siege_transfer_q5 --test p6_siege_capital_plunder --test p6_siege_capture_events --test p6_zdobycie_miasta_a --test p6_zdobycie_miasta_a_bridge` | EXIT 0: lib 144, bridge_contract 10, wiring_b 15, wiring_b_pin 2, transfer 3/3/2/4/12, capital_plunder 5, capture_events 6, zdobycie_a 6, zdobycie_a_bridge 7 — 0 failed |
| `cargo test --all-targets --no-fail-fast` | EXIT 0: 551 binarek, 4188 passed, 0 failed, 1 ignored (istniejący przed tematem) |
| Generator `node rust-port/engine/tests/p6_zdobycie_miasta_a_gen.mjs` | pinSha256 `a5810e8a71a92c5422914e24de5e00170a7b000250ad6b242e7c4e3411878979` (strażnik), MD5 `vectors.json` przed = po = `8bac5a9332f5ad8707a4b0f6137368af`; `git status` czysty po regeneracji |
| `git diff --check 01abcbf5e..ae4e84904` | czysto |

## 2. Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --stat 01abcbf5e...ae4e84904`: 11 plików — `city_capture_apply.rs` (nowy), `domain/mod.rs` (jedna linia `pub mod`), `playable.rs` (pole `captured_from_owner_by_city` + 2 inicjalizatory; uzasadnione pinem `cities.ts:1235-1252` — pole pisane i czytane przez `applyCapturePopulationLoss`), `siege_battle_apply.rs`, testy `p6_zdobycie_miasta_a{,_bridge}.rs`, generator, `vectors.json`, raporty 01/02/02a. Wszystko w allowliście. `bridge.rs`, `bridge_contract.rs` bez zmian (`CONTRACT_VERSION` bez zmian). Nie ruszono `siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `client`, `renderer`, `src-tauri`, `gra/`.
Brak `#[ignore]` w dodanych liniach, brak usuniętych asercji (`^-.*assert` = 0). Trailery wszystkich 10 commitów: wyłącznie `Claude-Session:` (brak `Co-Authored-By`). Brak push na `parity-v2`.

## 3. Weryfikacja z pinem (tekst `git show 07d2fbd72`)

- `applyCityCaptureToMap` (`main.ts:36034-36264`) przeczytany: kolejność portu = pin (watch cudów → P9 → `settleWonderTransfer` → `triggerRebelProtectionWarConsequence` [bez `rebelState` no-op] → `maybeResolveRegularWarOnCityCapture` [gracz = no-op] → `recordWarCityLossForPair` → [kolejka/religia: brak pól] → `playerEverOwnedCityByOwner.add` → `endMapSiege` → `runCapitalCapturePlunder`).
- P9 (`post-battle-map.ts:493-596`) przeczytany: strata ludności przed zmianą właściciela, splice od końca, kotwica czytana PO splice, warunek `!isCivilian && (isAnchor || coStacked)` na wejście, `ruchLeft = max(0, ruchLeft-1)` z pominięciem cywilów poza kotwicą, `oblegane=false` — port zgodny 1:1 (`city_capture_apply.rs:866-930`).
- `applyCapturePopulationLoss` (`cities.ts:1235-1252`): `capturedFromOwnerId = prevOwner` zawsze, odbicie = 0 straty; `CAPTURE_POP_LOSS_PIN = 1` = `gra/data/miasto-params.json:149` (potwierdzone testem pinu `city-capture-pop-loss-test.cjs:56`).
- Bramka `main.ts:34661-34679`: `isCityCaptureBlockedByDefenders` (`barbarians.ts:499-507`) zwraca `true` wyłącznie dla atakującego-barbarzyńcy; dla gracza (jedyny atakujący osiągalny z mostu, `NotHumanBesieger`) zawsze `false` — pokryte 8 przypadkami z wykonania pinu na poziomie funkcji; brak scenariusza mostu z blokadą jest konsekwencją pinu, nie luką.
- Transakcyjność: `PlayableGame::finish_siege_battle` (`playable.rs:1422-1446`) działa na klonie stanu; każdy błąd konsumenta (AI↔AI D-ZMA-7, właściciel 0) = `Aborted`, stan bez zmian — brak częściowego zastosowania.
- Generator: strażnik SHA-256 tekstu pinu, `Math.random` zablokowany; regeneracja deterministyczna (MD5 identyczny).

## 4. Orzeczenia zarzutów (02-evaluator + 02a-obrona)

| Zarzut | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|
| N1 osierocone `economy.units` | ODDAL (zamknięty) | Obrona dodała asercję kluczy `economy.units` = id `state.units` i adapter po `eliminate_owner`; mutanty E02, MN1 zabite wg 02a; testy zielone u mnie. Dług u źródła (`eliminacja.rs`, poza allowlistą) = ZMA-DL-4. |
| N2 pola wyniku mostu bez dokładnej wartości | ODDAL (zamknięty) | `diffs()` porównuje `removedUnitIds`, `enteredUnitIds`, `treasuryTaken`, `techsCopied` z wektorami z obserwacji wykonania pinu; test pokrycia wymaga niepustych wartości. |
| N3 fort nie rozstrzyga cudu | ODDAL (zamknięty) | Naprawiony kształt wejścia (`type: 'fort'`, `fort-territory.ts:124-133`), nowy scenariusz `cuda_fort_decyduje`; stare `expected` niezmienione. |
| N4 „kolejka produkcji”, Prawo, zdarzenia, kronika | ODDAL jako wada kodu; wpis orkiestratora wymagany | Sprawdziłem: `PlayableState` nie ma kolejki produkcji (`CityProduction` występuje tylko w `production_queue.rs`, `siege_transfer*.rs`, `city_view.rs`, `production_units.rs`; zero w `playable.rs`/`turn_economy.rs`/`bridge.rs`), więc w grze Rust nie istnieje stan, który pin sanitizuje. Pominięcie jawne (`not_applied`, `NOT_APPLIED_ALWAYS`, test). Decyzja techniczna zakresu — orkiestrator (zasada 8/9), nie właściciel: wpis do `REJESTR-RUST.md` + temat następczy ZDOBYCIE-MIASTA-STAN. |
| N5 klej `main.ts` przepisany w generatorze | ODDAL | Domknięcia `main.ts` nieładowalne; wszystkie moduły ładowalne wykonywane z tekstu pinu; klej zweryfikowany przez Evaluatora i przeze mnie (P1 kolejność, §3). |
| N6 `captured_from_owner_by_city` poza `save_load` | ODDAL (dług) | `save_load.rs` poza allowlistą; pole puste = serializacja bajt w bajt jak przed tematem. Dług ZMA-DL-2. |
| N7 mapowanie id 1↔0 bez obserwowalnego testu | ODDAL (dług) | Skutek wyłącznie w wywołaniach UI nieprzenoszonych przez wynik mostu (E01 równoważny). Dług ZMA-DL-5. |

Brak NAPRAW. Brak sprawy do decyzji właściciela (gameplay poza webem: brak).

## 5. Kryteria końca

- E2E przez most (`StartSiegeStorm`/`Step`/`Skip`/`FinishSiegeBattle`): zdobycie stolicy z sukcesją, eliminacja — zielone.
- Właściciel, jednostki/garnizon, populacja (`applyCapturePopulationLoss`), cuda (w tym fort), plądrowanie stolicy, meta wojny pary — zgodne z wektorami z generatora (14 scenariuszy).
- Kolejka produkcji — NIE_ZASTOSOWANO (brak stanu; N4, jawne).
- Brak zdobycia: bez wyłomu, wygrana obrońcy, pokój (`NotEnemies`, oblężenie kończy się), ten sam właściciel — jawne wyniki, bez paniki; AI↔AI = jawny błąd → `Aborted`.
- Determinizm i niezależność od podziału `StepSiegeBattle` — test zielony.
- Mutanty: 33 Operatora (30 zabitych, 3 równoważne z uzasadnieniem) + 25 Evaluatora (13 zabitych, 6 równoważnych, 6 luk zamkniętych w obronie) + 7 obrony (wszystkie zabite) — kryterium ≥ 20 spełnione. Mutantów nie powtarzałem (bramki i regeneracja wektorów odtworzone niezależnie).
- Tabela W1–W14: §4 raportu 01 — zgodna z dispatchem (W1, W2 zastosowane; W10 producent wspólny; reszta poza zakresem z odsyłaczem).

## 6. Długi (do rejestru przez orkiestratora)

- N4 / ZMA-DL-4 (01): kolejka produkcji, `applyPostCaptureLawOnCapture`, `noteCityCapture`, `recordCityCaptureEvent`, `foundedBy*`, `syncCityGarnizon`, kultura — temat następczy ZDOBYCIE-MIASTA-STAN.
- ZMA-DL-1: `onCityCapturedReligion` — `stores.religion_by_city` ISTNIEJE w stanie, a zdobycie go nie miesza (brak portu funkcji w Rust). Osobny temat (wymaga portu religii cywilizacji).
- ZMA-DL-2: `captured_from_owner_by_city` w `save_load` + ustawianie przez kapitulację W4.
- ZMA-DL-3: `clear_eliminated_owner_war_state` dzieli klucz po `_`, stan używa `min-max` (obejście adapterem D-ZMA-8).
- ZMA-DL-4 (02a): `eliminacja::eliminate_owner` nie czyści `economy.units` u źródła.
- ZMA-DL-5: test mapowania id 1↔0 przy wpięciu UI triumfu/zjednoczenia; AI↔AI auto-pokój przy szturmie AI (W8).
- Decyzje D-ZMA-1…D-ZMA-10 do wpisania w `REJESTR-RUST.md`.

## 7. Następny krok

Integracja orkiestratora: kod do integracji = `ae4e84904` (+ commit tego raportu), FF/merge na `rust-port/parity-v2` po `merge-base --is-ancestor` i `git diff --stat`; `refs/keep/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1-fc`; wpisy w `REJESTR-RUST.md` (D-ZMA-*, N4, długi). Target FC usunięty; wolne po bramkach 13 GB.
