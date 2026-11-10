STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1
GOAL: P6.8A (pin web 91dc998a). Temat NIE jest zakonczony. Ta runda (2/5, Operator-pomiary) wykonala: niezalezna weryfikacje kodu 8A-P1 wzgledem TS, mutacje galezi sterujacych, gate'y fmt/clippy/test z logami i EXIT, dwa testy domykajace mutanty. Nie domknieto 8A-P1 ani 8A-P2 (patrz BLOKADY).
ZMIANY/COMMIT:
- Baza kodu: `fceaf036` (raport R1), kod R1: `1b8247dc`. Worktree detached.
- Zmienione w tej rundzie (allowlista: `rust-port/engine/tests/p6_8a_*.rs`): `rust-port/engine/tests/p6_8a_building_upgrades.rs` (+1 test: `chain_duplicate_ids_last_entry_wins_like_js_map`), `rust-port/engine/tests/p6_8a_pending_improvements.rs` (+1 test: `undo_key_set_drops_removed_id_and_keeps_rest_in_order`), ten plik raportu `dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/02-operator-r2.md`.
- Kod produkcyjny (`production_units.rs`, `improvements.rs`) NIE zmieniony w tej rundzie.
- Brak zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Nie dodano `Cargo.lock` ani `rust-port/engine/target/` (untracked artefakty builda).
- SHA commitu rundy: patrz sekcja "COMMIT" na koncu raportu (uzupelniona po commicie).
TESTY (surowe logi w scratchpadzie `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/`):
- `cargo fmt --all -- --check` (w `rust-port/engine`): EXIT=0 (przed dodaniem testow i po: EXIT=0). Log: `fmt.log`, `fmt2.log`.
- `cargo clippy --lib --test p6_8a_building_upgrades --test p6_8a_pending_improvements -- -D warnings`: EXIT=0 (przed i po dodaniu testow). Log: `clippy.log`, `clippy2.log`.
- `cargo test --test p6_8a_building_upgrades --test p6_8a_pending_improvements` (stan R1): EXIT=0, 13/13 i 6/6. Log: `test8a.log`.
- Ta sama komenda po dodaniu 2 testow: EXIT=0, 14/14 i 7/7. Log: `test8a_r2.log`.
- Regresja `p6_repin_b2_production` 10/10, `p6_23_improvements` 6/6, `p6_8d_wealth` 17/17, EXIT=0. Log: `testreg.log`.
- `git diff --check`: EXIT=0 (czysty).
- Pelny `cargo test --no-fail-fast` i baseline NIE uruchomiono (poza zakresem tej rundy).
MUTACJE (skrypt `mut.py`, kazda mutacja: jedna zmiana w `src/domain/*.rs`, `cargo test` obu targetow, przywrocenie pliku i asercja identycznosci):
| ID | Miejsce | Mutacja | Wynik |
|---|---|---|---|
| M01 | `is_building_suppressed_from_production` | `== Some(true)` -> `.is_some()` | ZABITA (`suppressed_only_when_strictly_true`) |
| M02 | `upgrade_chain_steps` | `insert(0,..)` -> `push` | ZABITA (3 testy) |
| M03 | `building_structural_defense_bonus_percent` | `v > 0.0` -> `v >= 0.0` | ZABITA (2 testy) |
| M04 | `city_palac_tier` | tier III zwraca 2 | ZABITA (`palac_tier_takes_highest...`) |
| M05 | `city_has_mur_line` | usuniety `palisada` | ZABITA (`city_building_line_predicates`) |
| M06 | `group_built_building_ids` | `trimmed.is_empty()` -> `raw.is_none()` | ZABITA (`group_assigns_in_builtin_order...`) |
| M07 | `upgrade_production_display_name` | fallback `from` -> `""` | ZABITA (`display_name_for_upgrade_and_plain`) |
| M08 | `upgrade_chain_steps` by_id | `rev().find` -> `find` (duplikaty) | PRZETRWALA w R1 -> ZABITA po dodaniu `chain_duplicate_ids_last_entry_wins_like_js_map` (13/1 FAIL) |
| M09 | `PendingImprovementsTurn::add` | brak deduplikacji `order` | ZABITA (2 testy) |
| M10 | `PendingImprovementsTurn::remove` | brak `order.retain` | PRZETRWALA w R1 -> ZABITA po dodaniu `undo_key_set_drops_removed_id_and_keeps_rest_in_order` |
| M11 | `commit_turn` | brak `order.clear()` | ZABITA (`commit_turn_clears_everything`) |
| M12 | `parse_pending_improvement_id` | `idx == 0` -> `usize::MAX` | ZABITA (`parse_rejects_missing_colon_and_leading_colon`) |
| M13 | `parse_pending_improvement_id` | `rfind` -> `find` | ZABITA (`id_format_and_parse_split_on_last_colon`) |
| M14 | `remove` | `if removed.is_some()` -> `if true` | PRZETRWALA; RÓWNOWAŻNY MUTANT (retain nieobecnego id to no-op) |
| M15 | `from_save` | odwrocona kolejnosc wierszy | ZABITA (`save_load_preserves_order_and_dedups`) |
Wynik: 15 mutacji, 14 zabitych (w tym 2 po domknieciu luk testowych), 1 rownowazny (M14). Zadnej nieuzasadnionej ocalalej.
Galezie NIE objete mutacja w tej rundzie: `cumulativeMnoznik`/`buildingStatSummaryLines` (nieportowane); guard cyklu w `upgrade_chain_steps` (test `chain_cycle_guard_terminates` istnieje, mutacja usuwajaca guard zawieszalaby test - nie wykonano, zeby nie wieszac procesu).
WERYFIKATOR (niezalezny przeglad kodu R1 vs TS @91dc998a `gra/src/game/building-upgrades.ts`, `pending-improvements.ts`):
- Zgodne z TS: `isBuildingSuppressedFromProduction`, `upgradeChainSteps` (Map: ostatni duplikat), `upgradeProductionDisplayName` (`find`: pierwszy), `upgradeCompositionLines` (teksty i separator), `cityHas*Line`, `cityPalacTier`, `structuralDefenseParamKey`, `buildingStructuralDefenseBonusPercent` (`typeof number && > 0`; NaN odrzucony tak samo), `buildingStructuralDefenseBonusLine` (palisada/mury/fort+baszta/inne), `BUILDING_GROUP_ORDER`, `groupBuiltBuildingIds` (trim, fallback 'Inne' na koncu w kolejnosci pierwszego wystapienia), `PendingImprovementsTurn` (add/remove/has/get/commitTurn/toSave/fromSave, kolejnosc jak JS Map; ponowny add nie zmienia pozycji; delete+set trafia na koniec), `pendingImprovementId`, `parsePendingImprovementId` (lastIndexOf, idx<=0 -> null).
- `js_trim` = `civ_matrix::js_compat::js_trim` (zgodny z JS `trim`, wlaczajac ﻿ i terminatory) - poprawnie.
- Roznice ZAMIERZONE (zapisane w kodzie): (a) cykl `upgradeFrom` - TS zapetlilby sie bez konca, Rust przerywa; (b) `grupa` nie-string w TS trafia do 'Inne', w Rust typ `Option<String>` - rownowazne dla danych wejsciowych.
- Brak bledow funkcjonalnych znalezionych. Uwaga: wektory z weba NIE sa porownane - weryfikacja jest przegladem kodu, nie porownaniem z uruchomionym webem.
BLOKADY:
1. 8A-P1 niekompletne (bez zmian wzgledem R1): brak `buildingStatSummaryLines` i `cumulativeMnoznikForBuildingId` (zaleza od `unit-building-bonuses`, nieportowany), brak `buildingLevelForEpoch` (production.ts:243), brak typow `ProductionItem`/`ProductionKind`/`CityProduction`/`ProductionData`, `EPOCH_BY_NAME`, `RECRUIT_UNITS_PER_TURN` (production.ts:95-267).
2. 8A-P2 w calosci NIE wykonana (production.ts:269-692: `itemCost`, `buildingProductionItem`, `unitProductionItem`, `buildingLocationAllowed`, `applyCostDiscount`, `empireStockHas`, `stripDiacritics`, `UNIT_STOCK_GATE_LABEL`, itd.).
3. Brak wektorow z uruchomionego weba 91dc998a (wymog KRYTERIOW KOŃCA; plan §5 8A: `itemcost.json`, `building_upgrades.json`, `pending.json`). Nie wykonano w tej rundzie (poza zakresem dispatchu R2: zadanie wskazalo weryfikator, mutacje, gate'y).
4. Dokument tematu `dyspozycje/rust-port/p6/P6-8A-*.md` (allowlista: NOWY) nie zostal utworzony w tej rundzie. Wymagany przed zamknieciem tematu; tabela statusow symboli z §11 (`8A-P1`/`8A-P2`) do wypelnienia w tym dokumencie.
5. Pelny `cargo test` i baseline nie wykonane.
DECYZJA_WYMAGANA: brak. Luki rozstrzygniete zalozeniami (Z) z R1; nie zadawano pytan ABC (zgodnie z dispatchem).
RUNDY: 2/5 (zuzyte 2; ostatni werdykt R1: PASS-WITH-NOTES; decyzja wymagana: brak)
NASTĘPNY KROK: Runda 3 (ten sam ID): (1) portowanie `unit-building-bonuses` zakres minimalny dla `cumulativeMnoznikForBuildingId` i `buildingStatSummaryLines` albo jawna NASTĘPNA-PARTIA; (2) `buildingLevelForEpoch` i typy ProductionItem/CityProduction (8A-P1 dokonczenie); (3) 8A-P2 w partiach <=600 LOC z commitem po kazdej; (4) wektory z generatora uruchomionego na `91dc998a`; (5) dokument `P6-8A-*.md` z tabela symboli; (6) niezalezny weryfikator i Evaluator/Final Control dopiero po kompletnosci kryteriow.
DEPLOY/PUSH: NIE WYKONANO
