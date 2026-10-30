STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1
GOAL: P6.8A — port `gra/src/game/production.ts` 1–681 (epoka, itemCost, buildingProductionItem, unitProductionItem, buildingLocationAllowed, dostępność cywilizacji), `building-upgrades.ts`, `pending-improvements.ts` (pin webu 91dc998a). Hunki B2 (3, 7, 8–14) nie powtarzane.
ZMIANY/COMMIT: Operator R1 = partia 8A-P1 (częściowa). Baza: `origin/rust-port/parity-v2` (1dd3f4d6), pin webu 91dc998a.
  - `rust-port/engine/src/domain/building_costs.rs` — nowy zagnieżdżony moduł `building_upgrades` (port `building-upgrades.ts`, 14 fn + stałe/typy; 12 symboli z §11 w P1 tego pliku).
  - `rust-port/engine/src/domain/improvements.rs` — nowy zagnieżdżony moduł `pending_improvements` (port `pending-improvements.ts`: 2 fn + klasa `PendingImprovementsTurn`).
  - `rust-port/engine/tests/p6_8a_building_upgrades.rs` (NOWY, 13 testów).
  - `rust-port/engine/tests/p6_8a_pending_improvements.rs` (NOWY, 8 testów).
  - `dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/01-operator-r1.md` (ten raport).
  Nowe moduły są ZAGNIEZDZONE w allowlistowanych plikach, bo `domain/mod.rs` nie jest na allowliście tematu.
  SHA commitu: patrz sekcja DEPLOY/PUSH i wynik `git log -1` w gałęzi roboczej (SHA podane w odpowiedzi orkiestratorowi).
TESTY:
  - `cargo test --test p6_8a_building_upgrades --test p6_8a_pending_improvements` → 13 passed, 8 passed (EXIT 0).
  - `cargo clippy --lib --tests` → brak ostrzeżeń w nowym kodzie (jedno ostrzeżenie `cloned_ref_to_slice_refs` w teście naprawione).
  - `rustfmt --check` na nowych plikach testowych: czysto; `rustfmt` na `building_costs.rs` i `improvements.rs`: zmiany tylko w dopisanych modułach (`git diff --numstat`: +332 / -0 oraz +111 / -0).
  - `git diff --check`: czysto.
  - NIE_ZMIERZONO: pełne `cargo test --no-fail-fast` i `cargo fmt --all -- --check` całego crate (koszt czasu; baseline nie mierzony w tej rundzie).
  - NIE_ZMIERZONO: wektory JSON z generatora na webie @91dc998a (`p6_8a_vectors/building_upgrades.json`, `pending.json`) — generator `gen-p6-8a-vectors.mjs` nie został napisany w tej rundzie; testy są jawnymi przypadkami wyprowadzonymi z kodu TS.
PORTOWANE / STATUS SYMBOLI 8A-P1 (wg §11):
  - building-upgrades.ts: wszystkie 14 fn + STAT_KEYS/BUILDING_GROUP_* → PORTOWANE (Rust, testy).
  - pending-improvements.ts: wszystkie 2 fn + klasa → PORTOWANE (Rust, testy).
  - production.ts 1–681 już częściowo w Rust (poza tym tematem): `epochNumber`, `newestAvailableSameTypeUnit` (production_units.rs), `buildingWorkCost`, `unitMoneyCost`, `civRecruitmentDiscount`, `civMatrixCostDiscount`, `civProductionCostBonusyForCivKey`, `applyCostDiscount` (building_costs.rs) → weryfikowane regresją istniejących testów p6_repin_b2_*; NIE przepisywane.
  - production.ts NIEPORTOWANE w tej rundzie → NASTĘPNA-PARTIA (8A-P1 reszta + 8A-P2): `EPOCH_BY_NAME`/typy `ProductionItem`/`CityProduction`/`ProductionData` (wiersze 95–200), `buildingLevelForEpoch` (243), `buildingEffectAtLevel` (269), `DEFAULT_UNIT_COST`/`DEFAULT_COST_BY_ROLE`/`unitCostFromDef` (280–316), `findBuilding`/`findUnit` (317–343), `itemCost` (344), `buildingProductionItem` (371), `unitProductionItem` (400), `AvailabilityContext` (440–535), `buildingLocationAllowed` (536), `stripDiacritics`/`empireStockHas`/`UNIT_STOCK_GATE_LABEL` (660–681), `newestAvailableSameTypeUnit` już w Rust.
BLOKADY:
  - Zależności produkcyjne `itemCost`/`buildingProductionItem`/`unitProductionItem` ciągną moduły web (`building-cost-tempo`, `unit-cost-tempo`, `difficulty-cost`, `manpower`, `building-resource-gate`, `building-stock-cost`, `civ-matrix`); ich odpowiedniki w Rust trzeba zmapować przed portem (następna runda).
  - Brak generatora wektorów 8A na webie (plan §5).
  - Pełne bramki crate (fmt/clippy/test całości) nie uruchomione w tej rundzie.
ZAŁOŻENIA (rozstrzygnięte w kodzie, bez pytań):
  - Z-8A-1: `upgradeChainSteps` przerywa cykl (web by się zapętlił); dane gry nie mają cykli.
  - Z-8A-2: klucze ulepszeń i `action` w `PendingImprovementEntry` są `String` (web: unie napisów).
  - Z-8A-3: `String(liczba)` JS odwzorowane dla liczb całkowitych; formy wykładnicze nie występują w danych.
  - Z-8A-4: nowe moduły zagnieżdżone w allowlistowanych plikach (brak zmian w `domain/mod.rs`).
RUNDY: 1/5
NASTĘPNY KROK: Runda 2 (ten sam ID) — port `production.ts` 243–681 (8A-P1 reszta + 8A-P2) z testami i generatorem wektorów @91dc998a; następnie Evaluator/Final Control.
DEPLOY/PUSH: NIE WYKONANO
