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
| wieża oblężnicza = wyłom | | `battleScene.ts:4116,7234,7468,7662,8263` (logika w klasie sceny); `siegeMachines.ts` (kolejka, 83 LOC) | brak (grep `breach\|wylom\|wall_tile\|gate_hp\|siege_tower` = 0) | BRAK (pomiar domknięty, sekcja 5) |
| `battleScene.ts:711-715` | | `BATTLE_MAX_PER_SIDE` (= `MAX_PER_SIDE` = 500) | brak | BRAK (sekcja 5) |
| `post-battle-map.ts:64` | | `battleReserveNotice` (`mapFieldBattle.ts:519`) | brak | BRAK (sekcja 5) |
| `main.ts:4140` | | wywołanie `planWonderTransfers` (zmiana właściciela) | brak | BRAK (sekcja 5) |
| `capital-capture.ts:293` | | `applyAnnexCityStateSpoils` (wywołanie `main.ts:33671`) | brak (grep `spoils` = 0); `diplomacy.rs` ma tylko parametry `annexation_*` (254-281) i `ProposalAction::Annexation` (inna ścieżka) | BRAK dla spoils; zgodność mechanizmu dyplomatycznego NIE_ZMIERZONO (sekcja 5) |
| `combat.rs:230,273` `structure_defense_multiplier(is_siege)` | | mnożnik struktur oblężniczych | `domain/combat.rs` | ZGODNY (zakres ograniczony do mnożnika; logika bitwy oblężniczej w web NIE_ZMIERZONO) |
| `siegeDefenders.ts` (411 LOC): `collectCityDefRoster` :299, `canCaptureCityWithoutBattle` :120, `hasCityDefenders` :107 | | obrona miasta | `data/units_combat.rs:251-252` (`militia_pop_fraction`, `militia_strength_fraction` — tylko parametry); logika brak (grep `militia` w `domain/` = 0) | CZĘŚCIOWY (dane) / BRAK (logika) (sekcja 5) |
| `siegeAi.ts` (292 LOC): `estimateUnitCombatStrength` :81, `decideAISiegeStance` :209, `evaluateSiegeAiAction` :285 | | AI oblężenia | `data/units_combat.rs:296` `siege_ai: SiegeAi` (tylko parametry); logika brak (grep `estimate_unit_combat\|decide_ai_siege\|siege_stance` = 0) | CZĘŚCIOWY (dane) / BRAK (logika) (sekcja 5) |
| `diplomacy-siege-war-gate.ts` (111 LOC) | | bramka wojny | NIE_ZMIERZONO (nie mierzono w r4) | poza zakresem partii 1–4; ujęte w partii 5–6 |

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
- Pomiar per symbol (`siegeDefenders`, `siegeAi`, aneksja miasta-państwa, wieża oblężnicza, wonder-transfer): domknięty w rundzie 4, patrz sekcja 5.
- Następne partie: P3 (`siege_state`, `siege_forecast`), P4 (`wonder_transfer`), P5 (wyłom, `BATTLE_MAX_PER_SIDE`, `battleReserveNotice`).

## 5. Runda 4 — domknięcie pomiaru per symbol i odpowiedzi na zarzuty rundy 3

Pin web: `a61337844` (`origin/main`). Baza Rust: `6cdf580a1` (kod P2: `d56ccdc4f`). Wszystkie wpisy: plik:linia z `git show a61337844:<ścieżka>` / `git grep` w tym repo. Zero zmian w `gra/**`.

### 5.1 Status per symbol (BRAK = brak w `rust-port/engine/src`; grep `-rnE` po wzorcach podanych przy wierszu)

| Symbol web (plik:linia, LOC) | Rust | Status | Dowód |
|---|---|---|---|
| `siegeDefenders.ts` (411 LOC): `hasCityDefenders` :107, `canCaptureCityWithoutBattle` :120, `collectCityDefRoster` :299, `fallenMilitiaIds` :359 | `data/units_combat.rs:251-252` (`militia_pop_fraction`, `militia_strength_fraction`) | CZĘŚCIOWY (dane) / BRAK (logika) | grep `militia\|milicj` w `domain/` = 0; wartości parametrów NIE porównane z web (NIE_ZMIERZONO) |
| `siegeAi.ts` (292 LOC): `estimateUnitCombatStrength` :81, `estimateDefenderStrength` :103, `siegeStrengthRatio` :118, `decideAISiegeStance` :209, `evaluateSiegeAiAction` :285 | `data/units_combat.rs:296` `siege_ai: SiegeAi` | CZĘŚCIOWY (dane) / BRAK (logika) | grep `estimate_unit_combat\|decide_ai_siege\|siege_stance` = 0; progi `t1_assault_ratio` itd. (web :37-52) NIE porównane z JSON (NIE_ZMIERZONO) |
| Wieża oblężnicza = wyłom: `battleScene.ts:4116` (push `siegeTowers`), `:7234` (`_breachGate` gdy HP≤0), `:7468` (`_breachWallTile`), `:7662` (`_breachGate`), `:8263-8269` (blokada po wyłomie) | brak | BRAK | grep `breach\|wylom\|wall_tile\|gate_hp\|siege_tower` w `rust-port/engine/src` = 0 (jedyny trafienie: `diplomacy_truce.rs:189` `is_truce_breach`, nie ten sam temat). Logika siedzi w klasie sceny (DOM/THREE), nie w module czystym; `siegeMachines.ts` (83 LOC) to tylko kolejka budowy (`ensureSiegeMachines` :20 … `formatMachinesLabel` :78) |
| `BATTLE_MAX_PER_SIDE` = `MAX_PER_SIDE` = 500: `battleScene.ts:711-715` | brak | BRAK | grep `battle_max\|BATTLE_MAX\|max_per_side` w Rust = 0 |
| `battleReserveNotice(atk, def, maxPerSide, playerSide)`: `post-battle-map.ts:64`, wywołanie `mapFieldBattle.ts:519` | brak | BRAK | grep `reserve_notice\|battle_reserve` = 0 |
| Aneksja miasta-państwa: `applyAnnexCityStateSpoils` `capital-capture.ts:293`, wywołanie `main.ts:33671` (zwrot `annexSpoils` :33690) | brak `spoils`; `diplomacy.rs:254-281` tylko parametry `annexation_*`; `ProposalAction::Annexation` to inna ścieżka (dyplomacja) | BRAK (spoils); mechanizm dyplomatyczny: zgodność NIE_ZMIERZONO | grep `spoils\|annex_city` w Rust = 0 |
| Wonder-transfer: `snapshotWonderTerritoryOwners` :47, `planWonderTransfers` :57, `applyWonderTransfers` :81 (`wonder-transfer.ts`, 93 LOC), wywołanie `main.ts:4140` | brak (`wonder_placement.rs` = wybór hexa, `turn_economy_inputs_wonders.rs` = sumy wyjść, bez zmiany właściciela) | BRAK | grep `plan_wonder\|snapshot_wonder\|apply_wonder_transfer\|wonder_transfer` = 0 |

### 5.2 Co z tego wynika dla partii

- Partie P3–P5 w dyspozycji mają wejścia: wonder-transfer (BRAK, mały, czysty — kandydat na P3), `siege_state`/`siege_forecast` (P3), `battleReserveNotice` i `BATTLE_MAX_PER_SIDE` (czyste funkcje, P5). Wyłom (`siegeTowers`, `_breachWallTile`) jest w klasie sceny: port wymaga najpierw wydzielenia logiki czystej — to zakres P5 albo nowego ID.
- `siegeDefenders` i `siegeAi` (ok. 700 LOC razem) przekraczają limit partii 600 LOC: wymagają podziału na dwie partie (ustalenie w partii 5/6).

### 5.3 Zarzuty rundy 3 — odpowiedzi (ten sam ID)

1. **Pomiar per symbol NIE_ZMIERZONO** — PRZYJMUJĘ. Pomiar wykonany w tej rundzie (sekcja 5.1), wszystkie wpisy mają plik:linia i wynik grep. Pozostałe NIE_ZMIERZONO: wartości parametrów (`units_combat.rs:251-252, 296` vs web) i mechanizm `ProposalAction::Annexation` vs `applyAnnexCityStateSpoils`.
2. **Brak pełnego baseline `cargo test --no-fail-fast` (2155/0) i `cargo-mutants` ≥85%** — PRZYJMUJĘ jako dług, NIE uruchomiono w tej rundzie. Powód: dysk 2,9 GB wolnego (`df -h /`) przy progu 1,5 GB z dispatchu i progu 8 GB dla nowych startów z kodem Rust w `CLAUDE.md` §5; pełna kompilacja binarek testowych nie mieści się bezpiecznie. Dług: **R4-BASE-1** (baseline przy ≥ 8 GB wolnego, osobne binarki) i **R4-MUT-1** (cargo-mutants na `siege_enter_city.rs`, `siege_sortie.rs`, `siege_starvation.rs`). Do czasu ich wykonania mutation score pozostaje NIE_ZMIERZONO.
3. **Wektory z Node 22.22 nie są odtwarzalne z repo** — PRZYJMUJĘ jako dług **R4-VEC-1**. Stan: wartości są zahardkodowane w testach `p6_oblezenie_*`; skryptu generującego i surowego wyjścia nie ma w repo. Node v22.22.0 jest dostępny, ale web używa importów bez rozszerzeń `.ts`, więc `--experimental-strip-types` nie uruchomi modułów wprost (wymaga loadera). Zgodność kodu zweryfikowana porównaniem linia po linii (raport r3, notatka orkiestratora), nie wektorami. Naprawa: generator w `dyspozycje/rust-port/p6/` z loaderem, w partii P3.
4. **Sortowanie ID: Rust bajtowo vs JS UTF-16** — ODRZUCAM jako nieosiągalne w grze (dowód). Web sortuje domyślnym `.sort()` i `<` na stringach (`siege-enter-city.ts:75,85,105`; Rust `siege_enter_city.rs:110,124,150`, `siege_sortie.rs:126,157,162`). Różnica UTF-16 vs punkty kodowe występuje wyłącznie dla znaków ≥U+E000 mieszanych z poza-BMP. Wszystkie generatory ID w `gra/src` są ASCII: `main.ts:4387` (`'prod_' + turn + '_' + cityId + '_' + Math.random().toString(36)`), `main.ts:10539` (`'diffbonus_' + …`). Założenie Z-EC-4 pozostaje udokumentowane. Zastrzeżenie: sprawdzono dwa generatory znalezione grepem, nie wszystkie ścieżki wczytywania zapisów.
5. **Moduły P2 nie są podpięte do tiku silnika** — ODRZUCAM jako zarzut tej partii. Zadanie rundy 3 brzmiało „port 1:1 modułów + testy N−1/N/N+1/NaN + mutacje”; podpięcie do tiku i `handleSiegeCapitulationPhase` jest w dispatchu wymienione jako dług (sekcja 1, wiersz `main.ts`, oraz sekcja 4 BLOKADY 5–6). Dowód: `git grep -n 'siege_enter_city\|siege_sortie' rust-port/engine/src` poza `domain/mod.rs` i testami — brak wywołań, zgodnie z zakresem. Integracja: osobny temat z nowym ID.

### 5.4 Następny krok (runda 4 → partia P3)

Partia P3 (`siege_state`/`siege_forecast` lub wonder-transfer, ≤600 LOC) z testami N−1/N/N+1/NaN i mutacjami; dług R4-VEC-1 domykany w tej samej partii, jeśli zmieści się w limicie.
