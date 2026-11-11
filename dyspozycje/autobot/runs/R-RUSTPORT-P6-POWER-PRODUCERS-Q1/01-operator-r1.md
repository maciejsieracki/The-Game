STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-PRODUCERS-Q1
GOAL: producenci składników computeObjectivePower z danych stanu Rust (czyste funkcje), po jednym na składnik, z wektorami z pinu 07d2fbd72 przez wycięcie i wykonanie funkcji weba; dla składników bez źródła w Rust jawny brak z tabelą web-składnik -> Rust.
ZMIANY/COMMIT: allowlista zachowana (git status: brak zmian poza allowlistą; Cargo.lock wygenerowany przez build, NIE commitowany).
  - rust-port/engine/src/domain/brake_power_producers.rs (nowy, 141 LOC): COMPONENT_SOURCES (12 składników, status RustProducer/NoProducer z uzasadnieniem), ludki_for_owner, rekruci_ekw_for_owner, miasta_for_owner, kultura_for_owner, produce_for_owner, apply_produced.
  - rust-port/engine/src/domain/mod.rs (tylko `pub mod brake_power_producers;`).
  - rust-port/engine/tests/p6_power_producers.rs (nowy, 7 testów).
  - rust-port/engine/tests/p6_power_producers_gen.mjs (nowy): wycina z pinu empireSumaLudkow, empirePoborTotals, rekrutUnitEquivalents, empireCultureTotal (+ zależności) i je wykonuje; bez atrap (brak zmiennej spoza wycinka = błąd).
  - rust-port/engine/tests/p6_power_producers_vectors/vectors.json (wygenerowany: ludki 40, pobor 60, kultura 40 przypadków).
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-PRODUCERS-Q1/01-operator-r1.md (ten raport).
  Zakres producentów: 4 z 12 składników (ludki, rekruci, miasta, kultura). Pozostałe 8 (armia, bitwy, terytorium, infra, tech, ulepszenia, religia, zdobycze) bez producenta w tej rundzie - patrz BLOKADY.
  Baza: dispatch wskazuje a91b3b766 (gałąź rust-port-wip/BRAKE-INPUTS-r2-fc); worktree na a91b3b766. origin/rust-port/parity-v2 (eba816b4e) NIE zawiera jeszcze brake_power.rs/brake_inputs.rs; a91b3b766 jest potomkiem f207ea6b1 (wymóg "f207ea6b1 lub nowszy" spełniony w linii historii).
TESTY:
  - cargo fmt --check: EXIT 0 (po rustfmt na 2 nowych plikach).
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --test p6_power_producers: EXIT 0, 7 passed, 0 failed.
  - cargo test --lib: EXIT 0, 48 passed, 0 failed.
  - Wektory: generator wykonuje funkcje z pinu (Node 22, stripTypeScriptTypes - ExperimentalWarning, nie błąd).
  - Miasta: brak wycięcia z pinu (w main.ts jako `ownerCities.length`); pokryte tylko testem jednostkowym.
  - CARGO_TARGET_DIR poza repo (scratchpad/target-p6pp) - do usunięcia po zapisie raportu.
BLOKADY:
  1. Brak producentów w Rust dla 8 składników (jawny NoProducer w COMPONENT_SOURCES, z uzasadnieniem):
     - armia (web sumArmyMForOwner / M_pole),
     - bitwy (web battlePowerPtsByOwner - akumulator z walk),
     - terytorium (countTerritoryHexes(statsTerritoryNodesForOwner)),
     - infra (countBuildingsForOwner / cityBuilt),
     - tech (countTechForOwner),
     - ulepszenia (countImprovementsForOwner),
     - religia (countCitiesWithDominantStateReligion - Rust ma dominant_religion, równoważność NIE_ZMIERZONO),
     - zdobycze (zdobyczePowerByOwner - trwały bonus po eliminacji).
     Wołający (W8 r3) musi podać te pola jawnie w ObjectivePowerRaw.
  2. Nie porównano semantycznie z pinem producentów dla armii i terytorium (dispatch wymagał weryfikacji nie tylko nazwy) - NIE_ZMIERZONO.
  3. Pole `kultura_imperium` w ObjectivePowerRaw jest Option; apply_produced ustawia Some(...). Mapowanie `kulturaSkumulowana` (web `c.kultura ?? 0`) po stronie wołającego.
  4. Rozbieżność z dispatchem: brak jawnego `ManpowerCity` z pól PlayableState w tym module (wejście = slice; budowa z PlayableState należy do W8 r3).
RUNDY: 1/5 (Operator)
NASTĘPNY KROK: Evaluator (Sonnet) - weryfikacja zgodności producentów z pinem, decyzja o zakresie 8 pozostałych składników (osobny temat lub wpis do W8 r3); BRAKE-VECTORS (#31) nadal otwarte.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; bez push, bez integracji, bez zmian w rust-port/parity-v2, gra/, origin/main).
