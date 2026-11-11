STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-REST-Q1
GOAL: dla każdego z 6 składników (bitwy, infrastruktura, tech, ulepszenia, religia, zdobycze) ustalić w pinie 07d2fbd72 źródło w computeObjectivePower i albo (a) zportować producenta jako czystą funkcję z wektorami z wycięcia i wykonania kodu weba, albo (b) zapisać jawny BRAK z dowodem (plik:linia pinu + czego brakuje w Rust).
ZMIANY/COMMIT: feb5101f9 (gałąź lokalna rust-port-wip/P6-POWER-REST-Q1, baza 94cba6667; bez push, bez integracji, bez zmian w rust-port/parity-v2, gra/, origin/main). Cargo.lock wygenerowany przez build, NIE commitowany (usunięty z worktree po bramkach).
  - rust-port/engine/src/domain/brake_power_rest.rs (nowy, ~130 LOC): REST_COMPONENT_SOURCES (6 składników, RustProducer/NoProducer z uzasadnieniem), rest_no_producer_keys, count_cities_with_dominant_state_religion, dominant_status_web.
  - rust-port/engine/src/domain/mod.rs (tylko `pub mod brake_power_rest;`).
  - rust-port/engine/tests/p6_power_rest.rs (nowy, 4 testy).
  - rust-port/engine/tests/p6_power_rest_gen.mjs (nowy): wycina z pinu clamp, totalAdherents, leadingReligion, dominantReligion, countCitiesWithDominantStateReligion i je wykonuje; brak atrap (brak zmiennej spoza wycinka = błąd; progDominacjiPct podawany jawnie).
  - rust-port/engine/tests/p6_power_rest_vectors/vectors.json (wygenerowany: dominant 60, religia 60; w religia ~22 przypadki niezerowe).
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-REST-Q1/01-operator-r1.md (ten raport).
BASE/ZGODNOŚĆ Z DISPATCHEM: dispatch wskazuje bazę 94cba6667 (BATCH5-tip); zadanie wskazuje origin/rust-port/parity-v2 (f207ea6b1 lub nowszy). Sprawdzono: f207ea6b1 jest przodkiem 94cba6667; origin/rust-port/parity-v2 = e98099f5c jest przodkiem 94cba6667. Użyto 94cba6667 (zgodnie z dispatchem, spełnia wymóg "f207ea6b1 lub nowszy").
PIN: git archive 07d2fbd72 rozpakowany do scratchpad (/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/pin-rest), nie do /tmp/claude-0/pin-rest (ścieżka uzgodniona w scratchpad sesji).

TABELA WEB-SKŁADNIK -> RUST (pin 07d2fbd72):
| składnik | źródło web (pin) | status Rust | dowód / uzasadnienie |
|---|---|---|---|
| religia | countCitiesWithDominantStateReligion, culture-religion.ts:1383 (wywołanie main.ts:2773) | PRODUCENT: count_cities_with_dominant_state_religion (na society_inputs::dominant_religion, port dominantReligion culture-religion.ts:698) | wektory z wykonania weba: 60 dominant + 60 religia, zielone |
| bitwy | battlePowerPtsByOwner, main.ts:2254; zapis main.ts:34490 = floor(sumRosterFieldM(przegrany)) (auto-battle-power.ts:50) | BRAK | akumulator stanu walk nie istnieje w PlayableState/WarTurnState; sumRosterFieldM wymaga armyFieldPower (unit-power.ts:182), którego port nie jest w bazie |
| infra | countBuildingsForOwner, main.ts:2629 | BRAK | funkcja domknięta nad cityBuilt i cities (nie wycinalna bez atrap); Rust city_buildings tylko w ai_turn.rs, PlayableCity nie ma budynków |
| tech | countTechForOwner, main.ts:2638 | BRAK | domknięcie: isHuman, ownerResearchedTechs (main.ts:34979), aiResearchDone; Rust player_zbadane tylko w turn_economy_wire, nie w PlayableState |
| ulepszenia | countImprovementsForOwner, main.ts:2643 | BRAK | domknięcie: statsTerritoryNodesForOwner (main.ts:5657), hudPureScope, improvementKeysForHex, hexKeysWithinRadius; brak portu tej sumy |
| zdobycze | zdobyczePowerByOwner: zapis main.ts:35675 = barbarianCapturedPowerGain(buildObjectivePowerForOwner(ofiara).power) (capital-capture.ts:438) | BRAK | zależy od PEŁNEJ mocy ofiary (w tym 4 składniki BRAK powyżej) i od akumulatora zdarzeń eliminacji; brak w Rust |

TESTY:
  - cargo fmt --check: EXIT 0 (rustfmt na 2 nowych plikach; `cargo fmt --check` na całym crate czysto).
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --lib: EXIT 0, 48 passed, 0 failed.
  - cargo test --test p6_power_rest: EXIT 0, 4 passed, 0 failed (dominant_religion_matches_web_vectors, religia_count_matches_web_vectors, religia_without_state_religion_is_zero, rest_table_covers_six_components_with_explicit_sources).
  - git diff --check: czysto.
  - Generator: node rust-port/engine/tests/p6_power_rest_gen.mjs <WEB_ROOT> 07d2fbd72f758705f8e1d59cc4968027ffbafe75 - EXIT 0 (Node 22, stripTypeScriptTypes; ExperimentalWarning, nie błąd).
  - CARGO_TARGET_DIR poza repo (scratchpad/target-p6pr), usunięty po bramkach. df -h / po sprzątaniu: 10G wolne.
  - Pominięto: testy integracyjne innych modułów (poza p6_power_rest i --lib) - nie były wymagane dispatchem.

BLOKADY:
  1. Pięć składników bez producenta w Rust (bitwy, infra, tech, ulepszenia, zdobycze) - wołający (W8 r4) musi podać je jawnie w ObjectivePowerRaw. Brak cichych zer nie jest jeszcze egzekwowany typami (to zakres POWER-NOZEROS, #34).
  2. Zależność do W8 r4: pola religia (stateRel = ownerReligionForOwnerId, religionState = resolvedCityReligion) i progDominacjiPct (loadReligionParams) wchodzą od wołającego; brak zbudowania tych wejść z PlayableState w tej rundzie.
  3. Bitwy/zdobycze: wymagają portu armyFieldPower/sumRosterFieldM oraz akumulatorów zdarzeń (zwycięstwa, eliminacje) - osobny temat, nie w tym zakresie.
  4. Brak NIE_ZMIERZONO: nie zmierzono runtime semantyki wywołań w grze (tylko funkcje czyste i ich wektory).
  5. Operator nie dotykał brake_power.rs ani brake_power_producers.rs (zgodnie z zakazem).

RUNDY: 1/5 (Operator)
NASTĘPNY KROK: Evaluator (Sonnet) - weryfikacja wektorów religia względem pinu (wycięcie i wykonanie), weryfikacja uzasadnień NoProducer z numerami linii pinu; decyzja, czy 5 BRAK zostaje w tym temacie czy trafia do osobnych tematów portu (armyFieldPower, budynki, tech, ulepszenia, akumulatory zdarzeń).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny feb5101f9 na gałęzi rust-port-wip/P6-POWER-REST-Q1; bez push, bez integracji).
