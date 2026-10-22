# P6.1 — Stan początkowy / seed / inicjalizacja (hot-seat: właściciele ludzcy)

Temat: `R-RUSTPORT-P6-1-STAN-STARTOWY-Q1` · DOMAIN: GAME · RUNDA 1/5
Baza: `origin/rust-port/parity-v2` (d405b0d7). Pin web: `edb8fb56` (`git archive`, katalog tymczasowy poza repo).
Wektory: `rust-port/engine/tests/p6_1_vectors/web-vectors.json` (wygenerowane przez `gen-p61-web-vectors.mjs`, uruchomienie kodu TS weba w Node 22).

## 0. Zakres i status tematu (uczciwie)

Dispatch wymaga statusu dla KAŻDEGO eksportowanego symbolu logiki z 16 plików P6.1 (~204 eksporty, 3 291 LOC). W tej rundzie:

- **PORTOWANE z wektorem z uruchomionego weba**: 4 pliki — `civ-entry-epoch.ts`, `owner-utils.ts`, `human-owners.ts` (częściowo: logika), oraz wiersze `getCivEpokaWejscia`/`isCivAvailableAtGameEpoch`/`civIdsAvailableAtGameEpoch`/`gameEpochIndex` z tego pliku.
- **RUNDA-2** (z listą, §4): pozostała logika `playerState.ts`, `owner-epoch.ts`, `first-player-city.ts`, `cluster-start.ts`, `inca-llama-seed.ts`, `city-names-pool.ts`, `braz-access.ts`, `civ-bonuses.ts`, `civ-roster.ts` (`makeRng`, `civIdsFromRoster`, `pickActiveCivPool`, `assignAiCivTypes`, ...), `civ-names.ts`, `civ-matrix.ts`, `civ-matrix-semantic.ts`, `civ-ai-data.ts`.
- **NIE-DOTYCZY**: wyłącznie etykiety/prezentacja (§3).
- Temat jest więc **NIEKOMPLETNY** wg binarnego kryterium sukcesu; kolejna runda obejmuje listę z §4 w kolejności dispatchu (2: `playerState` → 3: `first-player-city`, `cluster-start`, `inca-llama-seed`, `city-names-pool` → 4: `civ-bonuses`/`braz-access`).

## 1. Metoda wektorów (ANTY-HALUCYNACJA)

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-1-STAN-STARTOWY-Q1/gen-p61-web-vectors.mjs`, uruchomiony:
  `node --experimental-strip-types --import ./p61-loader-register.mjs ./gen-p61-web-vectors.mjs <WEB_ROOT> <OUT_JSON>` (Node v22.22.0). Wynik: `OK civEntry=16 seats=8`.
- `civ-entry-epoch.ts`, `owner-utils.ts`, `human-owners.ts` są importowane i wykonywane z weba bez zmian kodu.
- **Jedyne odstępstwo**: `human-owners.ts` i `owner-utils.ts` importują `barbarians.ts` i `society-breakdown.ts`, których graf importów (units/setup, siegeDefenders, city-hex-movement, ...) nie jest potrzebny do tych funkcji. Loader (`p61-loader-hooks.mjs`) podstawia **stuby** zawierające WYŁĄCZNIE stałe `BARBARIAN_OWNER_ID = -1` (barbarians.ts:49), `isBarbarian` (barbarians.ts:52-54) i `REBEL_FACTION_OWNER_ID = -99` (society-breakdown.ts:206). Generator sprawdza regexem, że te linie są w pliku weba (`stubChecks`: wszystkie `true`). Stub nie przenosi żadnej innej logiki.
- Wynik `stubChecks` i pełne wektory: `web-vectors.json`.

## 2. Tabela było / jest (wiersze P6.1 z gap-analizy P6-0)

| plik web | było (P6-0, §3) | jest (P6.1 r1) |
|---|---|---|
| `civ-entry-epoch.ts` | BRAK (heur.) | **PORTOWANY**: `domain/unit_epoch.rs` (`civ_entry_epoch`, `is_civ_available_at_game_epoch`, `civ_ids_available_at_game_epoch`, `game_epoch_index`, `parse_game_epoch_id`, `CivEntryRow`, `GAME_EPOCH_ORDER`) |
| `human-owners.ts` | CZĘŚCIOWO (heur., domena) — brak dowodu | **PORTOWANY**: `domain/player.rs` (`HumanSeats`, `HUMAN_OWNER_PRIMARY`) |
| `owner-utils.ts` | CZĘŚCIOWO (heur., domena) — brak dowodu | **PORTOWANY**: `domain/player.rs` (`is_major_ai_owner`) |
| `owner-epoch.ts` | CZĘŚCIOWO (heur., domena) | RUNDA-2 (zależy od `TechDef`, `epochNumber`, `isEraAdvanceTech` z `playerState.ts`, oraz `getWondersForCiv`) |
| `playerState.ts` | CZĘŚCIOWO (heur., domena) | RUNDA-2 |
| pozostałe 10 plików P6.1 | BRAK / CZĘŚCIOWO (heur.) | RUNDA-2 (§4) |

Uwaga: statusy CZĘŚCIOWO z P6-0 dla `human-owners.ts` i `owner-utils.ts` NIE były dowodem parytetu (P6-0 §0: tier „domena" = uznanie domenowe). Teraz mają wektor z weba.

## 3. Symbole — status per eksport

### 3a. PORTOWANY (kod + test + wektor z uruchomionego weba, 0 rozbieżności)

- `civ-entry-epoch.ts`: `gameEpochIndex` → `game_epoch_index`; `getCivEpokaWejscia` → `civ_entry_epoch`; `isCivAvailableAtGameEpoch` → `is_civ_available_at_game_epoch`; `civIdsAvailableAtGameEpoch` → `civ_ids_available_at_game_epoch`; `GAME_EPOCH_ORDER` → `GAME_EPOCH_ORDER` (kolejność, wektor `constants.GAME_EPOCH_ORDER`).
- `human-owners.ts`: `HUMAN_OWNER_PRIMARY` → `HUMAN_OWNER_PRIMARY`; `HumanSeats` → `HumanSeats`; `isHumanOwner`, `isActiveHuman`, `isAiOwner`, `nextHumanSeat`, `isHotSeat` → metody `HumanSeats`.
- `owner-utils.ts`: `isMajorAiOwner` → `is_major_ai_owner`.
- Wektory: 16 przypadków wejścia cywilizacji × 7 epok gry; 6 przypadków roster; 7 właścicieli × 2 miasta-państwa; 8 konfiguracji foteli × 8 właścicieli (isHuman/isActive/isAi) + `nextHumanSeat` + `isHotSeat`.

### 3b. NIE-DOTYCZY (uzasadnienie)

- `GameEpochId` (typ TS) → typ `Epoch` (enum) — brak osobnego symbolu.
- `CivEntryEpochRow` (interfejs) → `CivEntryRow` (struktura danych wejściowych, bez logiki).
- `formatCivEntryEpochLabel`, `gameEpochHudLabel` → etykiety UI (tekst „Wejście: ...", „Epoka kamienia"). Brak logiki gry.
- `HumanSeats.new` (Rust) — brak odpowiednika webowego (konstruktor; web: literał obiektu).
- Out-of-domain: web `isAiOwner(seats, -5)` itd. — id właścicieli spoza {-99, -1, ≥0} nie są reprezentowalne w `OwnerRef` (ids.rs) — NIE-DOTYCZY w Rust (założenie: P2-3 OwnerRef).

### 3c. RUNDA-2 (z listą: plik → symbol)

- `playerState.ts` (27 eksportów): `EmpireResearchGate`, `PIENIADZ_MNOZNIK`, `RESEARCH_QUEUE_MAX`, `PlayerState`, `createPlayerState`, `techCost`, `parsePrereqs`, `prereqsMet`, `epochNumber`, `epochGateMet`, `epochTierGateMet`, `availableTechs`, `cheapestAvailable`, `eraAdvanceTarget`, `isEraAdvanceTech`, `isMoneyTech`, `ResearchCompletion`, `ResearchStepResult`, `researchStep`, `ResearchStateInfo`, `setPlayerResearchTarget`, `getResearchState`, `researchPlanLength`, `enqueueResearchTarget`, `dequeueResearchTarget`, `clearResearchQueue`, `getResearchPlanSnapshot`. (Stałe `PIENIADZ_MNOZNIK`, `RESEARCH_QUEUE_MAX` = dane/mnożniki → do `data/derived/*.json` przy portowaniu.)
- `owner-epoch.ts` (6): `computeOwnerEraFromResearch`, `allEraTechsResearched`, `eraOwnWonderIds`, `eraOwnWonderSatisfied`, `maxDefinedEra`, `computeMainCivEraFromResearch`.
- `first-player-city.ts` (5): `FIRST_CITY_START_REVEAL_DENIED` (tekst), `CityOwnerRef` (typ), `isAwaitingFirstPlayerCity`, `isHexInStartReveal`, `validateFirstPlayerCityPlacement`.
- `cluster-start.ts` (5): `ClusterSpawnSlot`/`ClusterSpawnPlan`/`ForeignTypeClusterGroup`/`HumanDistanceMode` (typy), `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes` (re-eksport z `map/cluster-spawn`), `ClusterStartPlan`, `BuildClusterStartInput`, `buildClusterStartPlan`. Zależy od `diplomacy-layers.ts` (`startRelationForPair`).
- `inca-llama-seed.ts` (3): `LLAMA_START_RADIUS`, `LLAMA_PER_START` (dane), `seedIncaLlamaDeposits`.
- `city-names-pool.ts` (23): `CivsForCityNames`, `CITY_NAMES_POOL_*_LEN`, `NAZWY_KLASTRA_LEN`, `nazwaKlastraAt`, `CityNamesPoolEntry`, `CityNamesPoolsData`, `rivalPoolIndex`, `stateCityNameAt`, `playerCapitalFromPool`, `clusterRivalFromPool`, `foreignCapitalFromPool`, `collectUsedCityNames`, `collectUsedCityNamesFromCities`, `cityNameWithSuffix`, `pickNextCityNameFromNames`, `pickNextCityName`, `pickNextRegularCityName`, `suggestPlayerFoundCityName`, `pickAiFoundCityName`, `validateCityNamesPools`, `resolveStateCityName`.
- `braz-access.ts` (5): `PIEC_HUTNICZY_BUILDING_ID`, `KOPALNIA_MIEDZI_KEY` (stałe), `empireHasKopalniaMiedzi`, `cityHasPiecHutniczy`, `hasBrazAccess`.
- `civ-bonuses.ts` (17): `CivBonusEntry`, `CivBonusUnitShape`, `CivCombatContext`, `CivStatMultipliers` (typy), `unitCombatCategory`, `unitMatchesCel`, `bonusApplies`, `civCombatStatMultipliers`, `applyMultiplier`, `civMatrixBonusyForCivKey`, `civMovementMultiplier`, `civAttackRangeMultiplier`, `civSiegeAttackMultiplier`, `civWallDefenseMultiplier`, `civBuildingCostDiscount`, `buildingCostAfterCivDiscount`, `isCombatModifierBonus`.
- `civ-roster.ts` (7, bez re-eksportu): `makeRng` (RNG — zgodność z `domain/rng.rs` do sprawdzenia wektorem), `civIdsFromRoster`, `AssignAiCivInput`, `pickActiveCivPool`, `rotatePreferredForRepairSeed`, `assignAiCivTypes`. (`civIdsAvailableAtGameEpoch` — re-eksport; PORTOWANY w 3a.)
- `civ-names.ts` (26): nazwy cywilizacji i pul miast (`CityNamesPoolEntry` re-eksport, `findCivByIkonaId`, `getNazwyKlastra`, `playerStartCityName`, `clusterRivalCityName`, `foreignCapitalCityName`, `stateCityName`, `civDisplayName`, `validateNazwyKlastra`, `getMiastaCywilizacji`, `getMiastaPanstwa`, `pickAiFoundedCityName`, `validateCityNamesPools`, typy/stałe).
- `civ-matrix.ts` (13): `loadCivMatrix`, `civMatrixParam`, `civMatrixParamAtDifficulty`, `civMatrixParamsAtDifficulty`, `civMatrixParamDef`, `applyCivMatrixParam`, `civMatrixProcSum`, `civMatrixApplyProc`; typy `CivMatrixFormula`, `CivMatrixDifficulty`, `CivMatrixParamDef`, `CivMatrixRow`, `CivMatrixData`.
- `civ-matrix-semantic.ts` (25): `classifyCivMatrixCell`, `buildCivMatrixSemanticProfile`, `buildCivMatrixSemanticSnapshot`, `median`, `civMatrixNeutralBand`, `civMatrixSemanticPolarity`, `civMatrixConsumerStatus`, `civMatrixConsumerEvidence`, `civMatrixSemanticParameterIds`, `civMatrixSemanticCivilizations`, `civMatrixSemanticBaseline`, `statusAllowsDefaultVisibility`, `civMatrixParameterLabelPl` (tekst), `civMatrixFormattedValue`, `civMatrixIntensityLabel`; stałe `CIV_MATRIX_SEMANTIC_VERSION`, `CIV_MATRIX_SEMANTIC_DIFFICULTY`; typy.
- `civ-ai-data.ts` (15): `civAiAggressionNorm`, `civAiProfilMapy`, `civAiProfileFor`, `civAiProfileForTyp`, `civParamsFor`, `isKopiaTypuObronna`, `civExcelNameFromTyp`, `diplomacyPerNacjaRow`, `diplomacyPerNacjaForTyp`, `resolveArchetypeAggression`, `resolveArchetypeTrade`, `nastawienieBazoweZaufanieDelta`; typy `CivAiProfile`, `CivParamsProfile`, `DiplomacyPerNacjaRow`.

Dane (JSON) dla `civ-matrix`, `civ-names`, `civ-ai-data`, `civ-bonuses`, `city-names-pool`: już w `data/*` (`data/civilizations.rs`, `data/loader.rs`, `data/data_civilizations.rs`) — dowód dla każdego z tych plików wymaga osobnego wiersza wektorowego w rundzie 2; w tej rundzie NIE przyjęto tego jako DANE-JUŻ-W-RUST.

## 4. Lista RUNDA-2 (kolejność)

1. `playerState.ts` → `domain/playable.rs`/`state.rs` (+ `owner-epoch.ts` po zależnościach `epochNumber`, `isEraAdvanceTech`, `TechDef`).
2. `first-player-city.ts`, `cluster-start.ts` (wymaga `diplomacy-layers.ts:startRelationForPair`), `inca-llama-seed.ts`, `city-names-pool.ts`.
3. `civ-bonuses.ts`, `braz-access.ts` (logika), `civ-roster.ts` (`makeRng` + wektory RNG).
4. `civ-names.ts`, `civ-matrix.ts`, `civ-matrix-semantic.ts`, `civ-ai-data.ts` — dowody wektorowe danych.

## 5. Zmiany w kodzie (allowlista)

- `rust-port/engine/src/domain/mod.rs`: `mod player;` → `pub mod player;`; dodano `pub mod unit_epoch;` (tylko deklaracje modułów).
- `rust-port/engine/src/domain/unit_epoch.rs`: nowa sekcja P6.1 (civ-entry). Atrybuty `#[allow(dead_code)]` na nowych elementach: plik jest też włączany przez `tests/unit_epoch.rs` (`#[path]`), który tego API nie używa; bez atrybutu `clippy -D warnings` zgłasza dead_code.
- `rust-port/engine/src/domain/player.rs`: `HUMAN_OWNER_PRIMARY`, `is_major_ai_owner`, `HumanSeats`.
- `rust-port/engine/tests/p6_1_civ_entry_epoch.rs` (NOWY, 6 testów), `rust-port/engine/tests/p6_1_owner_seats.rs` (NOWY, 5 testów), `rust-port/engine/tests/p6_1_vectors/web-vectors.json` (NOWY, wektory).
- `dyspozycje/rust-port/p6/P6-1-STAN-STARTOWY.md` (NOWY, ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-1-STAN-STARTOWY-Q1/**` (generator, loader, stuby, logi bramek).
- NIE zmieniono: `bridge.rs`, `playable.rs` (brak podpięcia — P7), `Cargo.toml`, `Cargo.lock` (nie commitowany, usunięty z worktree), `gra/**`, `renderer/**`, `src-tauri/**`, `data/derived/*`.

## 6. Bramki (surowe logi w runie)

- `gate-fmt-r1.log`: `cargo fmt --all -- --check` → `EXIT=0`.
- `gate-clippy-r1.log`: `cargo clippy --all-targets -- -D warnings` → `EXIT=0`.
- `gate-test-r1.log`: `cargo test` → `EXIT=0`; suma `passed` = **395** (wszystkie `test result: ok`, 0 FAILED). Nowe: 6 + 5 = 11. Implikowany baseline: 384 (zgodnie z dispatchem; nie mierzony osobno przed zmianą).
- `git diff --check`: czysty.
- Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_022130ad-1b3-1 CARGO_PROFILE_DEV_DEBUG=0`.

## 7. Założenia (rozstrzygnięte w dokumencie, nie pytania)

- Ścisłe identyfikatory epok (`kamien`/`braz`/`zelazo`) jak w webie: `Kamien`, `stone`, `""` są nieznane (indeks poza zakresem → wszystkie cywilizacje dostępne), zgodnie z `GAME_EPOCH_ORDER.includes`.
- `HumanSeats::next_human_seat` zwraca `None` dla aktywnego fotela spoza listy (web `null`).
- Brak `ikonaId` (lub pusty) → pomijany przy liście dostępnych (web `c.ikonaId &&`).
