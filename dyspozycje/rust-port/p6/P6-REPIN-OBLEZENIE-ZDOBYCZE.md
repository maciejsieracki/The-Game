# P6-REPIN-OBLEZENIE-ZDOBYCZE — pomiar i plan partii

Temat: `R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1` (pozycja 7 kolejki, `PLAN-PORT-RUST-TAURI-20261020.md` §0c).
Baza Rust: `c86c686bb` (`rust-port/parity-v2`). Pin web (do porównania): `a61337844` (`origin/main`).
Uwaga: w dispatchu jako pin podano `4bbef081d`; moduły `siege-*.ts`, `wonder-transfer.ts` i `city-siege-state.ts` istnieją w `a61337844`. Dla `4bbef081d` obecność NIE_ZMIERZONO.

## 1. Pomiar: symbol web → stan w Rust

Status: **ZGODNY** (port istnieje, ta sama logika wg nagłówka modułu), **CZĘŚCIOWY** (port jest, brak części),
**BRAK** (brak w `rust-port/engine/src`, grep `siege|starv|sortie|wonder.?transfer|annex|BATTLE_MAX_PER_SIDE|battleReserve`),
**NIE_ZMIERZONO** (nie sprawdzone w tej rundzie).

| Web (plik:linia, `a61337844`) | Rozmiar | Symbol | Rust (`c86c686bb`) | Status |
|---|---|---|---|---|
| `gra/src/game/siege-starvation.ts:99` | 133 LOC | `siegeStarvationState` | `domain/siege_starvation.rs` (dodane w r1) | PORT r1 (zgodny, 23 testy) |
| `siege-starvation.ts:76` | | `garrisonHpTotals` | `domain/siege_starvation.rs::garrison_hp_totals` (r1) | PORT r1 |
| `gra/src/game/army-starvation.ts:58` | 87 LOC | `applyArmyStarvationHpLoss` | `domain/turn_economy_attrition.rs:54` | ZGODNY (pin starszy; zgodność z `a61337844` NIE_ZMIERZONO) |
| `main.ts` N3 `:34986-35004` | | atrycja garnizonu miasta oblężonego | `turn_economy_attrition.rs:266` `siege_turn_garrison_attrition` | CZĘŚCIOWY |
| `main.ts` `handleSiegeCapitulationPhase` / `resolveSiegeSurrender` | | faza kapitulacji, przejęcie | brak (wymieniony jako dług w nagłówku `turn_economy_attrition.rs`) | BRAK |
| `gra/src/game/siege-enter-city.ts:51` | 106 LOC | `planSurrenderEntry` | brak | BRAK |
| `gra/src/game/siege-last-stand.ts:136` | 202 LOC | `planLastStandSortie`, `shouldLastStandSortie`, `isLastTurnBeforeCapitulation` | brak | BRAK |
| `gra/src/game/siege-surrender-forecast.ts:96` | 164 LOC | `turnsUntilSiegeSurrender`, `hungerTicksSimulated` | brak | BRAK (poza silnikiem: UI; wejście zasadniczo nie wpływa na stan) |
| `gra/src/game/city-siege-state.ts:30,46,55,68` | 80 LOC | `isCityUnderSiege`, `besiegedCityAtHex`, `isSiegeEntryBlocked` | brak jako moduł; blokada rekrutacji w `domain/recruitment.rs:2315` (`block_when_besieged`) i `is_unit_in_besieged_location` (`recruitment.rs:1924`) | CZĘŚCIOWY (rekrutacja TAK, wejście/posiłki NIE) |
| `gra/src/game/wonder-transfer.ts:57,81` | 93 LOC | `planWonderTransfers`, `applyWonderTransfers`, `snapshotWonderTerritoryOwners` | brak (`wonder_placement.rs` = inna funkcja) | BRAK |
| `gra/src/game/siegeMachines.ts` (zapis kolejki, `clearSiegeMachines`) | 83 LOC | kolejka machin | `SiegeCityState.has_siege_machines` (`turn_economy_attrition.rs:121`) — tylko flaga | CZĘŚCIOWY |
| wieża oblężnicza = wyłom | | `siege.ts` / `siegeMachines.ts` | NIE_ZMIERZONO | NIE_ZMIERZONO |
| `battleScene.ts:715` | | `BATTLE_MAX_PER_SIDE` (= `MAX_PER_SIDE`) | brak | BRAK |
| `post-battle-map.ts:64` | | `battleReserveNotice` (`mapFieldBattle.ts:519`) | brak | BRAK |
| `main.ts:4140` | | wywołanie `planWonderTransfers` (zmiana właściciela) | brak | BRAK |
| aneksja miasta-państwa | | `ANNEX-CITYSTATE-SPOILS` (web) | Rust `diplomacy.rs` ma `ProposalAction::Annexation` (wchłonięcie w dyplomacji, inny przypadek) | NIE_ZMIERZONO (czy to ten sam mechanizm: do ustalenia w partii 5) |
| `combat.rs:230,273` `structure_defense_multiplier(is_siege)` | | mnożnik struktur oblężniczych | `domain/combat.rs` | ZGODNY (zakres ograniczony do mnożnika; logika bitwy oblężniczej w web NIE_ZMIERZONO) |
| `siege-enter-city` + `siegeDefenders.ts` (411 LOC), `siegeAi.ts`, `diplomacy-siege-war-gate.ts` (111 LOC) | | obrona, AI, bramka wojny | brak / NIE_ZMIERZONO | poza zakresem partii 1–4; ujęte w partii 5–6 |

Rust ma w `domain/` **zero** plików `siege*.rs` i `wonder_transfer*.rs` przed tym tematem (`git ls-tree c86c686bb -- rust-port/engine/src/domain | grep siege` = pusto).

## 2. Partie (kolejność według zależności)

Limit ok. 600 LOC Rust na partię; osobny commit; testy N-1/N/N+1/NaN; wektory z Node na `a61337844` (`--experimental-strip-types`, bez `npm install`).

- **P1 (zrobione, r1)** — `domain/siege_starvation.rs`: `siegeStarvationState`, `garrisonHpTotals`, próg 0,5. Testy: `rust-port/engine/tests/p6_oblezenie_glod.rs` (23).
- **P2 (następna runda)** — `domain/siege_enter_city.rs` (`planSurrenderEntry`, Z1–Z5, stackLimit) + `domain/siege_sortie.rs` (`planLastStandSortie`, próg siły 80%, `LAST_STAND_*_PARTS`=10/8, dowolna tura po R-WEB-SIEGE-SORTIE-ANY-TURN-Q1).
- **P3** — `domain/siege_state.rs` (`isSiegeEntryBlocked`, `besiegedCityAtHex`, komunikaty PL) + `siege_forecast.rs` (`turnsUntilSiegeSurrender`, `hungerTicksFractional`). Forecast = UI, można pominąć na rzecz testów wektorowych.
- **P4** — `domain/wonder_transfer.rs` (`planWonderTransfers`, `applyWonderTransfers`, `snapshotWonderTerritoryOwners`, `isCivilizationOwnerId`). Zasady (wariant wlasciciela) do potwierdzenia na podstawie `wonder-transfer.ts` w partii 4.
- **P5** — wyłom (wieża oblężnicza), `BATTLE_MAX_PER_SIDE`=500 i `battleReserveNotice` (`post-battle-map.ts:64`); plus aneksja miasta-państwa po ustaleniu NIE_ZMIERZONO.
- **P6 (dług)** — orkiestracja `handleSiegeCapitulationPhase` / `resolveSiegeSurrender` (`main.ts`) i `siegeDefenders.ts`, `diplomacy-siege-war-gate.ts`: nowe ID przy kolejnej rundzie, jeśli zakres przekroczy 4–6 rund.

## 3. Bramki i dysk (runda 1)

- `rustfmt --edition 2021 --check` na nowych plikach: OK.
- `cargo clippy --lib --test p6_oblezenie_glod -- -D warnings`: OK (exit 0).
- `cargo test --test p6_oblezenie_glod`: 23 passed / 0 failed.
- Mutanty ręczne (2, na gałęziach sterujących): `<` → `<=` przy progu 0,5 (wykryty przez `stored_start_exactly_half_does_not_surrender`); `food > 0` → `food >= 0` (wykryty przez 4 testy). Obie mutacje zabite; plik przywrócony i ponownie przetestowany (23/23).
- Mutation score ≥ 85% (cargo-mutants): NIE_ZMIERZONO (narzędzie nie uruchomione; 2 ręczne mutanty to dowód częściowy).
- Pełny baseline `cargo test --no-fail-fast` (2155/0): NIE_ZMIERZONO. Powód: wolne miejsce na dysku 2,8–3,8 GB (wspólny dysk, 4 operatorów Rust), pełna kompilacja wszystkich binarek testowych nie była bezpieczna w tej rundzie. Katalog `target-oblezenie` usunięty po bramkach.
- `git diff --check`: wykonać przed commitem (patrz run record).

## 4. Runda 3 (partia P2) — status

- **P2 zrobione** (commit `d56ccdc4f`, baza `8f9923d73`): `domain/siege_enter_city.rs` (`planSurrenderEntry`, `enterCityAfterSurrender`, Z1–Z5, limit stosu) i `domain/siege_sortie.rs` (`planLastStandSortie`, `shouldLastStandSortie`, `canUnitSortie`, `isLastTurnBeforeCapitulation`). Testy: `tests/p6_oblezenie_wejscie.rs` (15), `tests/p6_oblezenie_wypad.rs` (27); wektory z Node 22.22 na web `a61337844` (driver poza repo).
- Mutanty ręczne 7/7 zabite (prog 8→7; `room >=`; flip generała; `cover >=`; `ruch < 0`; limit bez własnych jednostek; usunięty filtr zaokrętowanych).
- Bramki: `rustfmt --check` OK, `clippy -D warnings` (lib + testy p6_oblezenie_*) EXIT=0, testy p6_oblezenie_glod 29/29, `cargo test --lib` 22/0.
- NIE_ZMIERZONO: pełny baseline `cargo test --no-fail-fast` (2155/0), `cargo-mutants` ≥85%.
- Nadal NIE_ZMIERZONO per symbol: `siegeDefenders`, `siegeAi`, aneksja miasta-państwa, wieża oblężnicza (wyłom).
- Następne partie: P3 (`siege_state`, `siege_forecast`), P4 (`wonder_transfer`), P5 (wyłom, `BATTLE_MAX_PER_SIDE`, `battleReserveNotice`).
