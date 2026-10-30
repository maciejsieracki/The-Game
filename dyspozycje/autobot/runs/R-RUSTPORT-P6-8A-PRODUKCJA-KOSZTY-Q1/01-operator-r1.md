STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1
GOAL: P6.8A — port `production.ts` 1–681, `building-upgrades.ts`, `pending-improvements.ts` (pin web 91dc998a), wg dispatchu i §9/§11 `P6-8-MIASTA-PODZIAL.md` (docs-branch claude/sprawdzenie-funkcjonalnosci-ek4ra0). Temat NIE jest zakonczony: KRYTERIA KOŃCA niespelnione (patrz BLOKADY). Ta runda wykonuje wylacznie czesc 8A-P1 bez zaleznosci od danych.
ZMIANY/COMMIT:
- Baza: `origin/rust-port/parity-v2` = `865e0567` (worktree detached).
- Kod: `1b8247dc` (`1b8247dce8ea7112e3e3fce742f5287e74c99dbe`) — feat(p6-8a): P1 helpers.
- Allowlista (wykonana): `rust-port/engine/src/domain/production_units.rs` (dopisane helpery `building-upgrades.ts`), `rust-port/engine/src/domain/improvements.rs` (dopisany `pending-improvements.ts`), NOWE `rust-port/engine/tests/p6_8a_building_upgrades.rs`, `rust-port/engine/tests/p6_8a_pending_improvements.rs`, ten plik raportu.
- Brak zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Nie dodano `Cargo.lock` do commitu (untracked, artefakt builda).
- Zaimplementowane (odpowiedniki TS): `isBuildingSuppressedFromProduction`, `upgradeChainSteps`, `upgradeProductionDisplayName`, `upgradeCompositionLines`, `cityHasBibliotekaLine/AmfiteatrLine/MurLine/PalacLine`, `cityPalacTier`, `STRUCTURAL_DEFENSE_PARAM_KEY` (jako `structural_defense_param_key`), `buildingStructuralDefenseBonusPercent` / `...Line` (wartosc parametru jako argument), `BUILDING_GROUP_ORDER`, `BUILDING_GROUP_FALLBACK`, `groupBuiltBuildingIds`, `PendingImprovementEntry`, `pendingImprovementId`, `parsePendingImprovementId`, `PendingImprovementsTurn` (add/get/has/remove/getUndoKeySet/commitTurn/toSave/fromSave; kolejnosc wstawienia jak JS Map).
- Już w Rust przed tym tematem (nie powtarzane): `epochNumber` i `newestAvailableSameTypeUnit` (`production_units.rs`, B2), `buildingWorkCost`, `unitMoneyCost`, `civRecruitmentDiscount`, `civMatrixCostDiscount`, `civProductionCostBonusyForCivKey` (`building_costs.rs`/`production_units.rs`, B2) — weryfikowane regresja: `p6_repin_b2_production` 10/10 ok.
- Zalozenia (ZALOZENIE, rozstrzygniete w kodzie i komentarzach): (a) wartosc `miasto-params.wartosc` podawana jako argument; (b) `ImprovementKey` = `String`, `kosztPraca` = f64; (c) cykl w `upgradeFrom` przerywany guardem (web zapetlilby sie); (d) `Map` z duplikatami: ostatni wygrywa, `Array.find`: pierwszy wygrywa.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (po rustfmt na zmienionych plikach).
- `cargo clippy --lib --test p6_8a_building_upgrades --test p6_8a_pending_improvements -- -D warnings`: EXIT=0.
- `cargo test --test p6_8a_building_upgrades --test p6_8a_pending_improvements`: 13/13 + 6/6 ok, EXIT=0.
- Regresja: `cargo test --test p6_repin_b2_production --test p6_23_improvements --test p6_8d_wealth`: 10/10, 6/6, 17/17 ok, EXIT=0.
- `git diff --check`: czysty (EXIT=0 przed commitem kodu).
- NIE uruchomiono pelnego `cargo test --no-fail-fast` ani pelnej baseline'y (252 pliki testow; poza zakresem tej rundy — jawnie NIE_ZMIERZONO). Brak pomiaru baseline wg dispatchu.
- Wektory: NIE wygenerowano z uruchomionego weba @91dc998a. Testy maja wartosci wyprowadzone recznie z kodu TS (jawnie w naglowku plikow testow). Wymagane przez dispatch wektory z weba = NASTEPNA-PARTIA.
- Mutacje na galeziach sterujacych: NIE wykonano.
BLOKADY:
1. 8A-P1 niekompletne: brak `buildingStatSummaryLines` i `cumulativeMnoznikForBuildingId` (zaleza od `unit-building-bonuses`; ten modul nie byl portowany w tej rundzie). Brak odczytu `miasto-params.json` po stronie Rust (wartosci podawane jako argument).
2. 8A-P1 obejmuje tez `ProductionItem`, `ProductionKind`, `CityProduction`, `ProductionData`, `EPOCH_BY_NAME`, `newestAvailableSameTypeUnit`/`buildingLevelForEpoch`, `RECRUIT_UNITS_PER_TURN` (production.ts:95–267) — nie zbadane w tej rundzie poza potwierdzeniem, ze `epochNumber`/`newestAvailableSameTypeUnit` sa juz w Rust. `buildingLevelForEpoch` (production.ts:243) — NASTEPNA-PARTIA.
3. 8A-P2 w calosci NIE wykonana: `DEFAULT_UNIT_COST`, `DEFAULT_COST_BY_ROLE`, `unitCostFromDef`, `findBuilding`, `findUnit`, `itemCost`, `buildingProductionItem`, `unitProductionItem`, `AvailabilityContext`, `buildingLocationAllowed`, `applyCostDiscount`, `empireStockHas`, `stripDiacritics`, `UNIT_STOCK_GATE_LABEL` (production.ts:269–692).
4. Brak wektorow z uruchomionego weba i brak mutacji (wymog KRYTERIOW KOŃCA).
5. Limit: runda 1/5 wykorzystana; pozostaje 4.
DECYZJA_WYMAGANA: brak (wg zasady procesowej nie zadawano pytan ABC; luki rozstrzygniete zalozeniami powyzej).
RUNDY: 1/5
NASTĘPNY KROK: Runda 2 (ten sam ID): (1) dokonczyc 8A-P1 (`buildingLevelForEpoch`, `buildingStatSummaryLines` po zaportowaniu `unit-building-bonuses` lub jako NASTEPNA-PARTIA z uzasadnieniem); (2) 8A-P2 w partiach ≤600 LOC z commitem po kazdej; (3) wektory z generatora uruchomionego na `91dc998a` (`git archive`, node 22 — wzorzec `gen-repin-b2-vectors.mjs`); (4) tabela status per symbol z §11 (`8A-P1`, `8A-P2`); (5) niezalezny weryfikator. Potem Evaluator / Final Control.
DEPLOY/PUSH: NIE WYKONANO
