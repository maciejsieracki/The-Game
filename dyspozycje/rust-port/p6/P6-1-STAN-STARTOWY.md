# P6.1 — Stan początkowy / seed / inicjalizacja (hot-seat: właściciele ludzcy)

Temat: `R-RUSTPORT-P6-1-STAN-STARTOWY-Q1` · DOMAIN: GAME · RUNDA 2/5 (r1: 619181a0)
Baza: `origin/rust-port/parity-v2` (d405b0d7). Pin web: `edb8fb56` (`git archive gra/src gra/data` do katalogu tymczasowego poza repo).
Wektory: `rust-port/engine/tests/p6_1_vectors/web-vectors.json` (generator `gen-p61-web-vectors.mjs`, kod TS weba uruchomiony w Node v22.22.0).
Niezależny weryfikator: `verify-p61-web-vectors.py` (Python, bez TS i bez generatora).

## 0. Status tematu (uczciwie)

- **Temat pozostaje NIEKOMPLETNY** wg binarnego kryterium dispatchu: z 16 plików P6.1 zportowano 3 pliki (civ-entry-epoch, owner-utils, human-owners) oraz `makeRng` z civ-roster.ts. Pozostałe symbole są RUNDA-2 z listą w §4 (kolejność r3…).
- Liczba eksportów: parser (§3, `gen-p61-symbol-status.py`) znajduje **198** unikalnych eksportów w 16 plikach (r1 podawał „~204” jako szacunek; liczba wiarygodna to 198).
- Stan po r2: PORTOWANY **17**, NIE-DOTYCZY **2**, RUNDA-2 **179** (§3).
- r2 nie dokłada portów logiki gry poza etykietami UI i RNG; cel r2 to zamknięcie zarzutów r1 (§8).

## 1. Metoda wektorów (ANTY-HALUCYNACJA)

- Generator: `gen-p61-web-vectors.mjs`, uruchomienie:
  `node --experimental-strip-types --import ./p61-loader-register.mjs ./gen-p61-web-vectors.mjs <WEB_ROOT> <OUT_JSON>` → `OK civEntry=16 hud=19 rng=7 seats=8`.
- Importowane z weba bez zmian kodu: `civ-entry-epoch.ts`, `owner-utils.ts`, `human-owners.ts`, `civ-roster.ts`.
- **Stuby (r2, zarzut 4)**: `stubs/barbarians.ts` i `stubs/society-breakdown.ts` NIE są pisane ręcznie. Generator wycina je z plików weba: `barbarians.ts:49-54` i `society-breakdown.ts:205-206`, sprawdza kotwice linii (`anchors` w JSON: wszystkie `true`, inaczej błąd) i zapisuje werbatim. Loader podstawia je TYLKO w grafie importów `owner-utils`/`human-owners` (ciężki graf `barbarians.ts` — `city-hex-movement`, `siegeDefenders`, `units/setup` — nie jest potrzebny do tych funkcji). Odstępstwo pozostaje: wykonywane są wycięte linie, nie cały moduł.
- **Niezależny weryfikator (r2, zarzut 3)**: `verify-p61-web-vectors.py <WEB_ROOT> <JSON> stubs/` reimplementuje semantykę w Pythonie z zrodla TS (bez wykonywania TS i bez generatora), porównuje z JSON i sprawdza stuby bajt-w-bajt z liniami weba. Log: `verify-p61-r2.log` → `RAZEM: 408 sprawdzen, rozbieznosci: 0`, `EXIT=0`.
- **Pułapka wykryta w r2**: serde_json bez feature `float_roundtrip` parsuje liczby z 1-ulp błędem (test rng padł na `makeRng(1)` krok 3). Generator dodał `valuesText` (`String(x)` z JS); test Rust czyta tekst przez `str::parse::<f64>`.

## 2. Tabela było / jest (wiersze P6.1 z gap-analizy P6-0)

| plik web | było (P6-0, §3) | jest (P6.1 r2) |
|---|---|---|
| `civ-entry-epoch.ts` | BRAK (heur.) | **PORTOWANY** (`domain/unit_epoch.rs`: `civ_entry_epoch`, `is_civ_available_at_game_epoch`, `civ_ids_available_at_game_epoch`, `game_epoch_index`, `parse_game_epoch_id`, `format_civ_entry_epoch_label`, `game_epoch_hud_label`, `CivEntryRow`, `GAME_EPOCH_ORDER`) |
| `owner-utils.ts` | CZĘŚCIOWO (heur.) | **PORTOWANY** (`domain/player.rs`: `is_major_ai_owner`) |
| `human-owners.ts` | CZĘŚCIOWO (heur.) | **PORTOWANY** (`domain/player.rs`: `HumanSeats`, `HUMAN_OWNER_PRIMARY`) |
| `civ-roster.ts` (tylko `makeRng`) | CZĘŚCIOWO (heur.) | **PORTOWANY** `makeRng` → `domain/rng.rs` `Mulberry32` (mulberry32, NIE LCG `Rng`) |
| `civ-roster.ts` (pozostałe) | CZĘŚCIOWO (heur.) | RUNDA-2 (`civIdsFromRoster`, `pickActiveCivPool`, `rotatePreferredForRepairSeed`, `assignAiCivTypes`) |
| `owner-epoch.ts` | CZĘŚCIOWO (heur.) | RUNDA-2 |
| `playerState.ts` | CZĘŚCIOWO (heur.) | RUNDA-2 (blokada rozwiązana, §8 zarzut 2) |
| pozostałe 12 plików P6.1 | BRAK / CZĘŚCIOWO (heur.) | RUNDA-2 (§4) |

Uwaga: statusy CZĘŚCIOWO z P6-0 nie były dowodem parytetu. Teraz PORTOWANE mają wektor z uruchomionego weba i test Rust.

## 3. Symbole — status per eksport (198 wierszy)

Tabela generowana przez `gen-p61-symbol-status.py` (ta sama zawartość w `symbols-p61-r2.tsv` w katalogu runu). Każdy eksport z 16 plików ma status; RUNDA-2 oznacza „nieportowane w r2, lista r3–r5 w §4”.

<!-- SYMBOLS:BEGIN -->
| plik web | symbol | rodzaj | status | dowód / powód |
|---|---|---|---|---|
| `playerState.ts` | `EmpireResearchGate` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `PIENIADZ_MNOZNIK` | const | RUNDA-2 | stala = 10 (playerState.ts:75); r3: data/derived/*.json (dane, nie literal) |
| `playerState.ts` | `RESEARCH_QUEUE_MAX` | const | RUNDA-2 | stala = 4 (playerState.ts:82); r3: data/derived/*.json (dane, nie literal) |
| `playerState.ts` | `PlayerState` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `createPlayerState` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `techCost` | function | RUNDA-2 | r3: TechDef = data::buildings_tech::Technologia (koszt_nauki, buildings_tech.rs:398) |
| `playerState.ts` | `parsePrereqs` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `prereqsMet` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `epochNumber` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `epochGateMet` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `epochTierGateMet` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `availableTechs` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `cheapestAvailable` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `eraAdvanceTarget` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `isEraAdvanceTech` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `isMoneyTech` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `ResearchCompletion` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `ResearchStepResult` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `researchStep` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `ResearchStateInfo` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `setPlayerResearchTarget` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `getResearchState` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `researchPlanLength` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `enqueueResearchTarget` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `dequeueResearchTarget` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `clearResearchQueue` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `playerState.ts` | `getResearchPlanSnapshot` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `human-owners.ts` | `HUMAN_OWNER_PRIMARY` | const | PORTOWANY | player::HUMAN_OWNER_PRIMARY; wektor constants.HUMAN_OWNER_PRIMARY |
| `human-owners.ts` | `HumanSeats` | interface | PORTOWANY | player::HumanSeats (struct) |
| `human-owners.ts` | `isHumanOwner` | function | PORTOWANY | HumanSeats::is_human_owner; wektor seats.owners.isHuman |
| `human-owners.ts` | `isActiveHuman` | function | PORTOWANY | HumanSeats::is_active_human; wektor seats.owners.isActive |
| `human-owners.ts` | `isAiOwner` | function | PORTOWANY | HumanSeats::is_ai_owner; wektor seats.owners.isAi (bez -5, patrz outOfDomain) |
| `human-owners.ts` | `nextHumanSeat` | function | PORTOWANY | HumanSeats::next_human_seat; wektor seats.nextHumanSeat |
| `human-owners.ts` | `isHotSeat` | function | PORTOWANY | HumanSeats::is_hot_seat; wektor seats.isHotSeat |
| `owner-utils.ts` | `isMajorAiOwner` | function | PORTOWANY | player::is_major_ai_owner; wektor majorAi |
| `owner-epoch.ts` | `computeOwnerEraFromResearch` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `owner-epoch.ts` | `allEraTechsResearched` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `owner-epoch.ts` | `eraOwnWonderIds` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `owner-epoch.ts` | `eraOwnWonderSatisfied` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `owner-epoch.ts` | `maxDefinedEra` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `owner-epoch.ts` | `computeMainCivEraFromResearch` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `first-player-city.ts` | `FIRST_CITY_START_REVEAL_DENIED` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `first-player-city.ts` | `CityOwnerRef` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `first-player-city.ts` | `isAwaitingFirstPlayerCity` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `first-player-city.ts` | `isHexInStartReveal` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `first-player-city.ts` | `validateFirstPlayerCityPlacement` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-entry-epoch.ts` | `GAME_EPOCH_ORDER` | const | PORTOWANY | unit_epoch::GAME_EPOCH_ORDER; wektor constants.GAME_EPOCH_ORDER |
| `civ-entry-epoch.ts` | `GameEpochId` | type | NIE-DOTYCZY | typ TS (union literalow) = parse_game_epoch_id -> Option<Epoch>; brak osobnego symbolu w Rust |
| `civ-entry-epoch.ts` | `CivEntryEpochRow` | interface | NIE-DOTYCZY | typ danych wejsciowych = unit_epoch::CivEntryRow (bez logiki) |
| `civ-entry-epoch.ts` | `gameEpochIndex` | function | PORTOWANY | unit_epoch::game_epoch_index; wektor gameEpochIndex |
| `civ-entry-epoch.ts` | `getCivEpokaWejscia` | function | PORTOWANY | unit_epoch::civ_entry_epoch; wektor civEntry.entry |
| `civ-entry-epoch.ts` | `isCivAvailableAtGameEpoch` | function | PORTOWANY | unit_epoch::is_civ_available_at_game_epoch; wektor civEntry.available |
| `civ-entry-epoch.ts` | `civIdsAvailableAtGameEpoch` | function | PORTOWANY | unit_epoch::civ_ids_available_at_game_epoch; wektor rosterAvail |
| `civ-entry-epoch.ts` | `formatCivEntryEpochLabel` | function | PORTOWANY | unit_epoch::format_civ_entry_epoch_label (r2); wektor civEntry.label |
| `civ-entry-epoch.ts` | `gameEpochHudLabel` | function | PORTOWANY | unit_epoch::game_epoch_hud_label (r2); wektor hudLabels |
| `cluster-start.ts` | `ClusterStartPlan` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `BuildClusterStartInput` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `buildClusterStartPlan` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `ClusterSpawnSlot` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `ClusterSpawnPlan` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `ForeignTypeClusterGroup` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `HumanDistanceMode` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `buildSameTypeRivalSlots` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `cluster-start.ts` | `buildSameTypeRivalCandidateHexes` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `inca-llama-seed.ts` | `LLAMA_START_RADIUS` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `inca-llama-seed.ts` | `LLAMA_PER_START` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `inca-llama-seed.ts` | `seedIncaLlamaDeposits` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `braz-access.ts` | `PIEC_HUTNICZY_BUILDING_ID` | const | RUNDA-2 | stala danych (id budynku) r3: z data/* |
| `braz-access.ts` | `KOPALNIA_MIEDZI_KEY` | const | RUNDA-2 | stala danych (klucz surowca) r3: z data/* |
| `braz-access.ts` | `empireHasKopalniaMiedzi` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `braz-access.ts` | `cityHasPiecHutniczy` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `braz-access.ts` | `hasBrazAccess` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CivsForCityNames` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CITY_NAMES_POOL_REGULAR_LEN` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CITY_NAMES_POOL_STATE_LEN` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CITY_NAMES_POOL_COMMON_LEN` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `NAZWY_KLASTRA_LEN` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `nazwaKlastraAt` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CityNamesPoolEntry` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `CityNamesPoolsData` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `rivalPoolIndex` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `stateCityNameAt` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `playerCapitalFromPool` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `clusterRivalFromPool` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `foreignCapitalFromPool` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `collectUsedCityNames` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `collectUsedCityNamesFromCities` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `cityNameWithSuffix` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `pickNextCityNameFromNames` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `pickNextCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `pickNextRegularCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `suggestPlayerFoundCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `pickAiFoundCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `validateCityNamesPools` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `city-names-pool.ts` | `resolveStateCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `CivBonusEntry` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `CivBonusUnitShape` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `CivCombatContext` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `CivStatMultipliers` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `unitCombatCategory` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `unitMatchesCel` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `bonusApplies` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civCombatStatMultipliers` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `applyMultiplier` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civMatrixBonusyForCivKey` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civMovementMultiplier` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civAttackRangeMultiplier` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civSiegeAttackMultiplier` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civWallDefenseMultiplier` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `civBuildingCostDiscount` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `buildingCostAfterCivDiscount` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-bonuses.ts` | `isCombatModifierBonus` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-roster.ts` | `makeRng` | function | PORTOWANY | domain::rng::Mulberry32 (r2, bit-w-bit); wektor rng (7 ziaren x 8 krokow) |
| `civ-roster.ts` | `civIdsFromRoster` | function | RUNDA-2 | brak portu Rust; wektor rosterIds zweryfikowany Pythonem (verify-p61-web-vectors.py), nie Rust |
| `civ-roster.ts` | `AssignAiCivInput` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-roster.ts` | `pickActiveCivPool` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-roster.ts` | `rotatePreferredForRepairSeed` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-roster.ts` | `assignAiCivTypes` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-roster.ts` | `civIdsAvailableAtGameEpoch` | re-export | PORTOWANY | re-eksport z civ-entry-epoch; PORTOWANY jak wyzej |
| `civ-names.ts` | `MIASTA_CYWILIZACJI_LEN` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `CityNamesPoolEntry` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `CityNamesPools` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `findCivByIkonaId` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `getNazwyKlastra` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `playerStartCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `clusterRivalCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `foreignCapitalCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `stateCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `civDisplayName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `validateNazwyKlastra` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `getMiastaCywilizacji` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `getMiastaPanstwa` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `pickAiFoundedCityName` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `validateCityNamesPools` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `NAZWY_KLASTRA_LEN` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `CITY_NAMES_POOL_COMMON_LEN` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `CITY_NAMES_POOL_REGULAR_LEN` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `nazwaKlastraAt` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `pickNextCityName` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `pickNextCityNameFromNames` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `pickNextRegularCityName` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `suggestPlayerFoundCityName` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `pickAiFoundCityName` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `collectUsedCityNamesFromCities` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-names.ts` | `cityNameWithSuffix` | re-export | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `CivMatrixFormula` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `CivMatrixDifficulty` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `CivMatrixParamDef` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `CivMatrixRow` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `CivMatrixData` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `loadCivMatrix` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixParam` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixParamAtDifficulty` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixParamsAtDifficulty` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixParamDef` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `applyCivMatrixParam` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixProcSum` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix.ts` | `civMatrixApplyProc` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CIV_MATRIX_SEMANTIC_VERSION` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CIV_MATRIX_SEMANTIC_DIFFICULTY` | const | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticPolarity` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixConsumerStatus` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticLabel` | type | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixNeutralBand` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticCell` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticProfile` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticSnapshot` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixSemanticParameterIds` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixSemanticCivilizations` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixConsumerStatus` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixConsumerEvidence` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixSemanticPolarity` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixNeutralBand` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `median` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `CivMatrixSemanticCellInput` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `classifyCivMatrixCell` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixSemanticBaseline` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `buildCivMatrixSemanticProfile` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `buildCivMatrixSemanticSnapshot` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `statusAllowsDefaultVisibility` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixParameterLabelPl` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixFormattedValue` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-matrix-semantic.ts` | `civMatrixIntensityLabel` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `CivAiProfile` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `CivParamsProfile` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civAiAggressionNorm` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civAiProfilMapy` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civAiProfileFor` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civAiProfileForTyp` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civParamsFor` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `isKopiaTypuObronna` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `DiplomacyPerNacjaRow` | interface | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `civExcelNameFromTyp` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `diplomacyPerNacjaRow` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `diplomacyPerNacjaForTyp` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `resolveArchetypeAggression` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `resolveArchetypeTrade` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
| `civ-ai-data.ts` | `nastawienieBazoweZaufanieDelta` | function | RUNDA-2 | nieportowane w r2 (lista r3, patrz sekcja 4) |
<!-- SYMBOLS:END -->

Podsumowanie: PORTOWANY 17 (civ-entry-epoch 7, owner-utils 1, human-owners 7, civ-roster 2 — `makeRng` i re-eksport `civIdsAvailableAtGameEpoch`); NIE-DOTYCZY 2 (typy `GameEpochId`, `CivEntryEpochRow` = nazwy typów TS bez logiki, zastąpione przez `parse_game_epoch_id` i `CivEntryRow`); RUNDA-2 179.

Uwagi do wierszy NIE-DOTYCZY/RUNDA-2 o statusach zbiorczych (zarzut 6): symbole `CITY_NAMES_POOL_COMMON_LEN`, `CITY_NAMES_POOL_REGULAR_LEN`, `CITY_NAMES_POOL_STATE_LEN`, `NAZWY_KLASTRA_LEN`, `MIASTA_CYWILIZACJI_LEN` są stałymi-danymi (długości pul) i mają osobne wiersze; `CityNamesPools`/`CityNamesPoolsData` to typy danych; osiem typów `CivMatrix*` (`CivMatrixFormula`, `CivMatrixDifficulty`, `CivMatrixParamDef`, `CivMatrixRow`, `CivMatrixData`, `CivMatrixSemanticPolarity`, `CivMatrixConsumerStatus`, `CivMatrixSemanticLabel`, `CivMatrixNeutralBand`, `CivMatrixSemanticCell`, `CivMatrixSemanticProfile`, `CivMatrixSemanticSnapshot`, `CivMatrixSemanticCellInput`) ma własne wiersze z kolumną statusu.

## 4. Lista RUNDA-2 (kolejność dispatchu; zależności rozstrzygnięte)

1. **r3 — `playerState.ts` (27) + `owner-epoch.ts` (6)**. Zależności: `TechDef` = `data::buildings_tech::Technologia` (`rust-port/engine/src/data/buildings_tech.rs:381`, pole `koszt_nauki` = „Koszt nauki”, `epoka`, `wymaga_prereq`, `parse_tech()` w linii 35); dane `data/derived/research-costs.json` (meta/osie/wiersze) do weryfikacji kosztów. Stałe `PIENIADZ_MNOZNIK = 10` (playerState.ts:75) i `RESEARCH_QUEUE_MAX = 4` (playerState.ts:82) → nowa tabela `data/derived/*.json` (dane, bez literałów w kodzie).
2. **r4 — `first-player-city.ts` (5), `cluster-start.ts` (9, wymaga `diplomacy-layers.ts:startRelationForPair` i `map/cluster-spawn`), `inca-llama-seed.ts` (3), `city-names-pool.ts` (23).**
3. **r5 — `civ-bonuses.ts` (17), `braz-access.ts` (5), `civ-roster.ts` (pozostałe 5: `civIdsFromRoster`, `AssignAiCivInput`, `pickActiveCivPool`, `rotatePreferredForRepairSeed`, `assignAiCivTypes`).**
4. **r6 — `civ-names.ts` (26), `civ-matrix.ts` (13), `civ-matrix-semantic.ts` (25), `civ-ai-data.ts` (15)** — dowody wektorowe danych; NIE przyjmuje się DANE-JUŻ-W-RUST bez wiersza wektorowego.

Brak r5/r6 w tej rundzie to decyzja zakresu (zarzut 1 — przyjęty, §8).

## 5. Zmiany w kodzie (allowlista r2)

- `rust-port/engine/src/domain/unit_epoch.rs`: usunięte WSZYSTKIE `#[allow(dead_code)]` (zarzut 9). Dodano `format_civ_entry_epoch_label` i `game_epoch_hud_label` (zarzut 5). Wywołanie całego API wejścia cywilizacji z harnessu `tests/unit_epoch.rs` (`p6_1_civ_entry_api_is_exercised`) — brak potrzeby wyciszania.
- `rust-port/engine/src/domain/rng.rs`: `Mulberry32` (`new`, `next_f64`) — zgodny z web `makeRng` (zarzut 10).
- `rust-port/engine/src/domain/mod.rs`: `mod rng;` → `pub mod rng;` (tylko deklaracja modułu; potrzebne do testu wektorów).
- `rust-port/engine/src/domain/player.rs`: bez zmian w r2 (port z r1).
- Testy: `tests/p6_1_civ_entry_epoch.rs` (+2: etykiety i HUD z wektorów), `tests/p6_1_owner_seats.rs` (kotwice stubów zamiast `stubChecks`; +1: `-5` poza domeną), `tests/p6_1_rng_mulberry.rs` (NOWY, +2), `tests/unit_epoch.rs` (+1 `p6_1_civ_entry_api_is_exercised`; istniejące testy nietknięte), `tests/p6_1_vectors/web-vectors.json` (przegenerowany).
- `dyspozycje/rust-port/p6/P6-1-STAN-STARTOWY.md` (ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-1-STAN-STARTOWY-Q1/**`: generator (przepisany), `stubs/*.ts` (generowane), `verify-p61-web-vectors.py` (NOWY), `gen-p61-symbol-status.py` (NOWY), `symbols-p61-r2.tsv`, logi `gate-{fmt,clippy,test}-r2.log`, `verify-p61-r2.log`.
- NIE zmieniono: `bridge.rs`, `playable.rs`, `Cargo.toml`, `Cargo.lock` (nietrackowany, usunięty z worktree po buildzie), `lib.rs`, `gra/**`, `renderer/**`, `src-tauri/**`, `data/derived/*`.

## 6. Bramki (surowe logi w runie, EXIT z echo)

- `gate-fmt-r2.log`: `cargo fmt --all -- --check` → `EXIT=0`.
- `gate-clippy-r2.log`: `cargo clippy --all-targets -- -D warnings` → `EXIT=0`, 0 ostrzeżeń.
- `gate-test-r2.log`: `cargo test` → `EXIT=0`; suma `passed` = **401**, `failed` = 0. Nowe testy P6.1 (r1+r2): 11 + 6 = 17; implikowany baseline 384 (zgodnie z dispatchem, niemierzony osobno).
- `verify-p61-r2.log`: `RAZEM: 408 sprawdzen, rozbieznosci: 0`, `EXIT=0`.
- Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_022130ad-1b3-3 CARGO_PROFILE_DEV_DEBUG=0`.

## 7. Założenia (rozstrzygnięte w dokumencie, nie pytania)

- Ścisłe identyfikatory epok (`kamien`/`braz`/`zelazo`) jak w webie: `Kamien`, `stone`, `""` są nieznane (indeks poza zakresem → wszystkie cywilizacje dostępne), zgodnie z `GAME_EPOCH_ORDER.includes`.
- `HumanSeats::next_human_seat` zwraca `None` dla aktywnego fotela spoza listy (web `null`).
- Brak `ikonaId` (lub pusty) → pomijany przy liście dostępnych (web `c.ikonaId &&`).
- `formatCivEntryEpochLabel` i `gameEpochHudLabel` są PORTOWANE (nie etykietami „bez logiki”): zawierają filtr epok `>= wejście` i zacisk indeksu; wektory: 16 przypadków wejścia, 19 wejść HUD (w tym `NaN`, `±Infinity`).
- `gameEpochHudLabel` używa `floor(x + 0.5)` (semantyka `Math.round` JS), nie `f64::round` (różnica dla ujemnych połówek, bez wpływu po zacisku).
- Id właściciela `-5` (poza `{-99, -1, >=0}`) jest NIE-DOTYCZY w Rust: web `isAiOwner(seats, -5) = true`, `isMajorAiOwner(-5) = false`; `OwnerRef::from_legacy_i64(-5) = None` (`ids.rs:78`). Założenie z P2-3: id spoza tej dziedziny nie występują w stanie gry. Test `web_owner_minus_five_is_out_of_domain_and_not_representable` dokumentuje rozbieżność zamiast ją maskować.

## 8. Odpowiedzi na zarzuty r1 (STATUS: NIEKOMPLETNY, 10 zarzutów)

1. **Zakres — PRZYJĘTE.** Temat pozostaje NIEKOMPLETNY; r2 domyka zarzuty 2–10 i portuje `makeRng`/etykiety; reszta w §4 (r3–r6).
2. **Blokada `playerState` — PRZYJĘTE (blokada była błędnie opisana).** `TechDef` ma odpowiednik w Rust: `data::buildings_tech::Technologia` (`buildings_tech.rs:381`, `koszt_nauki`, `epoka`, `wymaga_prereq`) oraz `parse_tech()` (`buildings_tech.rs:35`). Stałe `PIENIADZ_MNOZNIK`/`RESEARCH_QUEUE_MAX` to dane (10, 4) → `data/derived/*.json`. Port `playerState` przesunięty na r3 jako zwykła praca, nie blokada.
3. **Niezależny weryfikator — PRZYJĘTE.** `verify-p61-web-vectors.py` (Python, bez TS), log `verify-p61-r2.log` z `EXIT=0` i `0 rozbieżności` jako artefakt runu.
4. **Stuby — PRZYJĘTE (poprawka częściowa).** Stuby są generowane werbatim z plików weba z kotwicami linii; odstępstwo (wykonywane są wycięte linie, nie moduł) jest zadeklarowane w §1.
5. **NIE-DOTYCZY `formatCivEntryEpochLabel`/`gameEpochHudLabel` — PRZYJĘTE.** Obie funkcje są PORTOWANE z wektorami (§5, §7).
6. **Pokrycie symboli — PRZYJĘTE.** Pełna tabela per eksport (§3, 198 wierszy); osobne wiersze dla stałych długości pul, typów `CityNamesPools*` i ośmiu typów `CivMatrix*`.
7. **Niespójności dokumentu — PRZYJĘTE.** `civ-roster.ts` nie jest „7, bez re-eksportu”: ma 7 eksportów, w tym re-eksport `civIdsAvailableAtGameEpoch` (PORTOWANY) i `makeRng` (PORTOWANY). Po 3 portowanych plikach zostaje **13** plików (nie 10).
8. **Wektor -5 — ODRZUCONE jako wada wektora, PRZYJĘTE jako dokumentacja.** Rozbieżność jest poza dziedziną (NIE-DOTYCZY, §7); dowód: JSON `outOfDomain` (web) + test `web_owner_minus_five_is_out_of_domain_and_not_representable`.
9. **`allow(dead_code)` — PRZYJĘTE.** Usunięte; harness `tests/unit_epoch.rs` wywołuje API (`p6_1_civ_entry_api_is_exercised`). `clippy -D warnings` EXIT=0.
10. **RNG/seed — PRZYJĘTE i ZMIENIONE.** Okazało się, że `domain/rng.rs` (`Rng`, LCG Numerical Recipes) NIE jest zgodny z web `makeRng` (mulberry32). Nie podmieniam `Rng`; dodano `Mulberry32` zgodny bit-w-bit z wektorem `rng` (7 ziaren × 8 kroków, test `mulberry32_matches_web_make_rng_vectors_bit_for_bit`). `pickActiveCivPool` i `assignAiCivTypes` (użycie `makeRng` w `civ-roster.ts`) — RUNDA-2 (r5), z wektorami na ich wyjściach; `seedIncaLlamaDeposits` (`inca-llama-seed.ts`) — RUNDA-2 (r4).
