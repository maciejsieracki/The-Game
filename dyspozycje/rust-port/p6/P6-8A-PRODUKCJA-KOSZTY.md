# P6.8A — produkcja i koszty (web `production.ts` 1–692, `building-upgrades.ts`, `pending-improvements.ts`)

Pin webu: `91dc998a5f1b51ad29e0f4785edfd45655445c53`. Temat: `R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1`.
Zakres: partie 8A-P1 (helpery bez zależności od danych + `buildingStatSummaryLines`) i 8A-P2 (koszty i
konstruktory pozycji produkcji). Hunki B2 (`epochNumber`, `buildingWorkCost`, `unitMoneyCost`, `civ*Discount`)
są w Rust od wcześniej (`building_costs::repin_b2`); tu są tylko używane i weryfikowane wektorami.

Wektory: `rust-port/engine/tests/p6_8a_vectors/` — generowane przez skrypty w
`dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/` (Node 22 wykonuje moduły TS weba z
`git archive 91dc998a gra/src gra/data`; bez builda `gra/`, bez przeglądarki).

## 1. Tabela statusu per symbol

| Symbol web | Rust (`rust-port/engine/src/domain/`) | Dowód | Status |
|---|---|---|---|
| `buildingStatSummaryLines` | `production_units::building_stat_summary_lines` | `building_upgrades.json` → `stats` (196) | DONE |
| `cumulativeMnoznikForBuildingId` | `combat::unit_building_bonuses::cumulative_mnoznik_for_building_id` (port B) | pośrednio: `stats` z listami mnożników | DONE (reuse) |
| `mnoznikRoleForBuildingId` | `combat::unit_building_bonuses::mnoznik_role_for_building_id` (port B) | pośrednio: `stats` | DONE (reuse) |
| `buildingLevelForEpoch` | `production_units::building_level_for_epoch` | `production_costs.json` → `buildingLevel` (1400) | DONE |
| `EPOCH_BY_NAME` / `epochNumber` | `production_units::EPOCH_BY_NAME`, `epoch_number` (tabela jedna) | `production_costs.json` → `constants` | DONE |
| `RECRUIT_UNITS_PER_TURN` | `production_units::RECRUIT_UNITS_PER_TURN` | `constants` | DONE |
| `ProductionKind`, `ProductionItem` | `production_units::{ProductionKind, ProductionItem}` | przez `buildingItems`/`unitItems` | DONE |
| `CityProduction` | `production_units::CityProduction` (`kolejka`, `postep`) | — | CZĘŚCIOWO: `wstrzymana`, `rekrutacja` należą do 8B |
| `ProductionData` | `production_units::ProductionData` (`buildings`, `units`) | wszystkie wektory P2 | DONE |
| `itemCost` | `production_units::item_cost` | `itemCost` (960) | DONE |
| `unitCostFromDef`, `DEFAULT_UNIT_COST`, `DEFAULT_COST_BY_ROLE` | `unit_cost_from_def(_in)`, `default_unit_cost(_in)`, `default_cost_by_role(_in)` | `defaults-{realny,brak-rol,inne-wartosci}.json` | DONE |
| `findBuilding`, `findUnit` | `find_building`, `find_unit` | pośrednio: wszystkie wektory P2 | DONE |
| `buildingProductionItem` | `production_units::building_production_item`, `AvailabilityContext::building_item` | `buildingItems` (313) | DONE |
| `unitProductionItem` | `production_units::unit_production_item`, `AvailabilityContext::unit_item` | `unitItems` (565) | DONE |
| `buildingLocationAllowed` | `production_units::building_location_allowed` | `location` (12) | DONE |
| `AvailabilityContext` | `production_units::AvailabilityContext` — PODZBIÓR pól P2 (`is_capital`, `empire_resource_stock`, markery, tempa, `owner_id`, `difficulty`) | przez konstruktory pozycji | CZĘŚCIOWO: pola dostępności (epoka, kolejka, budynki, bonusy mapy) należą do availableProduction (8B) |
| `applyCostDiscount` | `repin_b2::apply_cost_discount` (re-eksport) | pośrednio: `buildingItems`/`unitItems` | DONE |
| `empireStockHas` | `production_units::empire_stock_has` | `stock` (135) + asercje bezpośrednie | DONE |
| `stripDiacritics` | `production_units::strip_diacritics` + tablica `NFD_BASE` (1316 par BMP) | `strip` (265) | DONE z ograniczeniem (sekcja 4) |
| `UNIT_STOCK_GATE_LABEL`, `unitStockShortfallLabel` | `production_units::unit_stock_shortfall_label` | `stock` (135) | DONE |
| `buildingWorkCost`, `unitMoneyCost`, `civ*Discount`, `GLOBAL_BUILDING_PROD_MULT` | `building_costs::repin_b2` (B2, wcześniej) | pośrednio: `buildingItems`/`unitItems` z zestawami markerów | DONE (reuse) |
| `civProductionCostBonusyForCivKey` | `repin_b2::civ_production_cost_markers` (B2) | NIE zmierzone wektorami w R3 (zestawy markerów syntetyczne) | OTWARTE: do zmierzenia z wierszami macierzy cywilizacji |
| `upgradeChainSteps`, `upgradeProductionDisplayName`, `upgradeCompositionLines` | `production_units::{upgrade_chain_steps, ...}` (R2) | `building_upgrades.json` → `chain`, `display`, `composition` | DONE |
| `isBuildingSuppressedFromProduction`, `cityHas*Line`, `cityPalacTier` | `production_units::*` (R2) | `suppressed`, `presence` | DONE |
| `buildingStructuralDefenseBonusPercent/Line` | `production_units::building_structural_defense_bonus_*` | `structural-{realny,zero,ujemna,ulamek,napis,null,brak}.json` | DONE (sekcja 4) |
| `groupBuiltBuildingIds`, `BUILDING_GROUP_*` | `production_units::{group_built_building_ids, ...}` (R2) | `groups` (237), `groupOrder` | DONE |
| `pendingImprovementId`, `parsePendingImprovementId`, `PendingImprovementsTurn` | `improvements::{pending_improvement_id, parse_pending_improvement_id, PendingImprovementsTurn}` (R2) | `pending.json` (40 scenariuszy × 50 kroków) | DONE |

## 2. Wektory i testy

| Plik wektorów | Generator | Test (zielone) |
|---|---|---|
| `building_upgrades.json` (chain 240, display 238, presence 315, groups 237, stats 196, suppressed, structural, composition) | `gen-p6-8a-upgrades-pending-vectors.mjs` | `p6_8a_vectors` 12/12 |
| `pending.json` (2000 kroków) | `gen-p6-8a-upgrades-pending-vectors.mjs` | `p6_8a_vectors` |
| `structural-*.json` (7 wariantów `miasto-params.json`, nadpisanie przez `P6_8A_JSON_OVERRIDE`) | `gen-p6-8a-structural-variants.mjs` | `p6_8a_vectors` |
| `production_costs.json` (itemCost 960, buildingLevel 1400, buildingItems 313, unitItems 565, location 12, stock 135, strip 265) | `gen-p6-8a-production-vectors.mjs` | `p6_8a_production_costs` 9/9 |
| `defaults-{realny,brak-rol,inne-wartosci}.json` (89 przypadków × 3) | `gen-p6-8a-unit-defaults-vectors.mjs` | `p6_8a_production_costs` |

Testy 8A (łącznie): `p6_8a_building_upgrades` 14/14, `p6_8a_pending_improvements` 7/7, `p6_8a_production_costs` 9/9, `p6_8a_vectors` 12/12.

Regresja (targety dotykające `production_units` / `building_costs`): `building_costs` 10/10, `derived_values` 25/25,
`p6_1b_playerstate` 19/19, `p6_7b_cost` 11/11, `p6_7b_gate` 12/12, `p6_7b_nfd` 2/2, `p6_7b_pool` 7/7,
`p6_7b_spichlerz` 7/7, `p6_7b_tables` 10/10, `p6_repin_b2_production` 17/17. Wszystkie zielone.

Bramki: `cargo fmt --all -- --check` EXIT 0; `cargo clippy --lib` + 4 targety 8A `-D warnings` EXIT 0.

NIE WYKONANO: pełny `cargo test` (254 targety) — wolumen dysku współdzielonego z innymi worktree spadł do 0 MB;
kompilacja wszystkich targetów nie mieści się w miejscu. Zamiast tego: 8A + regresja (sekcja wyżej).

## 3. Mutacje (`mut-p6-8a.py`, log `logs/mut-r3-b.log`)

Zakres: `production_units.rs` (kody R2 i R3), `improvements.rs` (R2). Każdy mutant = jeden wzorzec, `cargo test`
czterech targetów 8A, przywrócenie pliku z asercją.

* R3 po poprawce: 21 mutantów → 20 KILLED, 1 SURVIVED (R3-16, równoważny: patrz niżej).
* R2 (wynik pierwszego przebiegu R3, przed refaktorem wartości domyślnych; log tego przebiegu nie został zachowany,
  wyniki wklejone z konsoli): R2-01…R2-13 KILLED, R2-15 KILLED, R2-14 SURVIVED (równoważny: `retain` przy
  nieobecnym id to no-op). Kody R2 nie zmieniły się poza refaktorem `default_*`; ponowny przebieg R2 — do wykonania
  po zwolnieniu dysku.
* R3-03 (alias `Wręcz`) i R3-04 (literał fallback `Konnica` 16) przeżywały przed dodaniem wariantów `brak-rol`
  i testu aliasu; po poprawce KILLED.

Równoważne:
* R2-14 — `if removed.is_some()` zmienione na `if true`: `retain` na nieobecnym id nie zmienia wektora.
* R3-16 — usunięcie `sort_by_key` dla kluczy-indeksów `poziomTechGate`: dla kluczy całkowitych wynik progu nie
  zależy od kolejności (sprawdzenie: 3000 losowych map, wszystkie permutacje kluczy, 0 rozbieżności).

## 4. Ograniczenia i założenia (ZALOZENIE)

* `stripDiacritics`: tablica NFD obejmuje 1316 znaków BMP (poza Hangul) o rozkładzie „baza + znaki U+0300–U+036F”.
  Pominięto 177 znaków z wieloma bazami lub zaczynających się od znaku łączącego (np. część pism indyjskich) — poza
  danymi gry. Dane gry (`Surowiec`, `nazwa`) są w pełni objęte wektorami.
* Klucze prototypu JS (np. `constructor` w `UNIT_STOCK_GATE_LABEL`) nie występują w danych; web zwróciłby wadliwy napis,
  Rust zwraca `None`.
* `miasto-params.json` nie może zawierać NaN w JSON. Wartości nie-liczbowe są pokryte przez napis `'12'` i `null`
  (`typeof !== 'number'`), wartość NaN przez ścieżkę `v > 0` — weryfikacja tylko rozumowaniem.
* `buildingStructuralDefenseBonusPercent` w Rust przyjmuje wartość jako argument (`raw`); mapowanie klucz → wartość jest
  mierzone przez warianty `structural-*` (ta sama wartość `miastoRaw` co w webie dla każdego klucza).
* `upgrade_chain_steps`: guard cyklu (web zapętliłby się). Wektory zawierają tylko listy bez cykli.
* Pola liczbowe brakujące w JSON (web `undefined`) = NaN w `BuildingCostRow`/`UnitCostRow`; napisy niebędące
  napisem (`'12'` dla `Pieniądz (koszt)`) = `None` — zgodnie z `typeof`.
* Niezależny weryfikator: w tej sesji nie ma narzędzia do uruchomienia osobnego agenta; dowodem są wektory z weba
  (pomiar, nie przegląd). Niezależny Evaluator należy do orkiestratora.

## 5. Historia commitów (gałąź lokalna tematu)

* `1b8247dc` — P1 helpery (R1); `52344c41` — mutanty R2 (wejście tej rundy).
* `a2d9c0ea` — wektory building-upgrades/pending z weba + testy.
* `887a0f1f` — dokończenie P1 (`buildingLevelForEpoch`, `EPOCH_BY_NAME`, typy, `RECRUIT_UNITS_PER_TURN`) i partia P2.
* `9c066cb7` — `buildingStatSummaryLines` + wektory `stats`.
* `b50175ab` — wartości domyślne kosztu jednostek (`*_in`), wektory `defaults-*`, `mut-p6-8a.py`, logi bramek.
