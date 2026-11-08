# P6-FORCED-WAR-MODULES-Q1 — tabela pomiaru (grupa G) i plan partii

Baza: `origin/rust-port/parity-v2` = `d3e4d4df2`. Web: `origin/main` (`gra/src/game/forced-war-*.ts`, `war-rules-multiwar.ts`).
Pomiar: `grep` po `rust-port/engine/src` i eksportach TS (wykonany w rundzie 1).

## 1. Już zportowane przed tym tematem (ODPOWIEDNIK W RUST)

| Symbol web (`war-rules-multiwar.ts`) | Rust | Plik | Status |
|---|---|---|---|
| `isInterCivWarOpenAtTurn`, `concurrentWarLimitForEra`, `evaluateInterCivWarGate` (z `eraTag`) | `is_inter_civ_war_open_at_turn`, `concurrent_war_limit_for_era`, `evaluate_inter_civ_war_gate` | `domain/diplomacy_multiwar_gate.rs` | zportowane (MULTIWAR r5 / ERADELAY) |
| `isEraForcedWarIgnoringR1`, `isWarMarchOpenForPair`, `isWarTreatyBlocked` | `is_era_forced_war_ignoring_r1`, `is_war_march_open_for_pair`, `is_war_treaty_blocked` | `domain/diplomacy_multiwar_gate.rs` | zportowane (ERAIGN) |
| `forcedEraTagFromPowod`, `forcedEraTagEpoch`, `forcedEraTagForEpoch`, `eraWarCounterEpoch` | `forced_era_tag_from_powod`, `forced_era_tag_epoch`, `forced_era_tag_for_epoch`, `era_war_counter_epoch` | `domain/diplomacy_multiwar.rs`, `domain/war_era_pool.rs` | zportowane |
| `isForcedEraWarEnabled`, `canDeclareEraForcedWar`, `eraWarCivKey`, `eraWarCountFor`, `canCivJoinEraForcedWar`, `recordEraForcedWarParticipation` | `is_forced_era_war_enabled`, `can_declare_era_forced_war`, `era_war_civ_key`, `era_war_count_for`, `can_civ_join_era_forced_war`, `record_era_forced_war_participation` | `domain/diplomacy_multiwar.rs` | zportowane |
| `evaluateEraForcedWarGate`, `rebuildEraWarCountsFromActivePairs`, `restoreEraWarCounts` | `evaluate_era_forced_war_gate`, `rebuild_era_war_counts_from_active_pairs`, `restore_era_war_counts` | `domain/diplomacy_multiwar.rs` | zportowane |
| `isPlayerEligibleForEraWarPool`, `isPlayerEraWarSlotFree` | `is_player_eligible_for_era_war_pool`, `is_player_era_war_slot_free` | `domain/war_era_pool.rs` | zportowane (ERAPOOL, FALA 558) |
| `pickPlayerReferenceCity` | `pick_player_reference_city` | `domain/diplomacy_multiwar_gate.rs` | zportowane |
| `pickEngagementArmy`, `allocateGroupsToEnemies` | `pick_engagement_army`, `allocate_groups_to_enemies` | `domain/war_rules_multiwar.rs` | zportowane (REPIN-WOJNA-NOWE-D) |
| `playerEpochWarEnabled` (flaga) | `player_epoch_war_enabled` | `domain/diplomacy_multiwar.rs` | zportowane |

Pozostałe eksporty `war-rules-multiwar.ts` (setter/override flag `setWarRulesMultiwarOverride`, `isWarRulesMultiwarEnabled`, `setWarEpochPlayerFirstOverride`, `isWarEpochPlayerFirstEnabled`) — NIE PORTOWANE jako API; stała `WAR_RULES_MULTIWAR_ENABLED = true` i `WAR_EPOCH_PLAYER_FIRST_ENABLED = true` odpowiadają wartościom domyślnym. ODSTĘPSTWO / ZAŁOŻENIE: brak mechanizmu nadpisań w Rust (testy wektorowe nie używają override).

## 2. Partia G1 (ta runda) — `forced-war-common.ts` (części czyste) + `forced-war-stone.ts`

| Symbol web | Rust | Plik | Wektory |
|---|---|---|---|
| `pickForcedWarTargetId` (common:40) | `pick_forced_war_target_id` | `domain/war_forced_common.rs` | `p6_forced_war_g1_data/cases.json` |
| `shouldEndForcedWarByCityCount` (:65) | `should_end_forced_war_by_city_count` | `domain/war_forced_common.rs` | j.w. |
| `countActiveWarsExcluding` (:84) | `count_active_wars_excluding` | `domain/war_forced_common.rs` | j.w. |
| `isRestingFromForcedWar` (:99) | `is_resting_from_forced_war` | `domain/war_forced_common.rs` | j.w. |
| `countActiveForcedWarsForOwner` (:134) | `count_active_forced_wars_for_owner` | `domain/war_forced_common.rs` | j.w. |
| `isForcedEraPeaceLocked` (:176) | `is_forced_era_peace_locked` | `domain/war_forced_common.rs` | j.w. |
| `FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD`, `isForcedWarRelationBlocked` (:206-210) | `FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD`, `is_forced_war_relation_blocked` | `domain/war_forced_common.rs` | j.w. |
| `WOJNA_KAMIEN_WYMUSZONA_*` (stone:18-21) | stałe `WOJNA_KAMIEN_WYMUSZONA_*` | `domain/war_forced_stone.rs` | j.w. |
| `isEligibleForStoneForcedWar` (stone:44) | `is_eligible_for_stone_forced_war` | `domain/war_forced_stone.rs` | j.w. |
| `pickStoneForcedWarTargetId` (stone:61) | `pick_stone_forced_war_target_id` | `domain/war_forced_stone.rs` | j.w. |
| `isRestingFromStoneForcedWar` (stone:75) | `is_resting_from_stone_forced_war` | `domain/war_forced_stone.rs` | (deleguje do G1) |

Pominięte w G1 świadomie: `WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` (web: „NIEUŻYWANA w runtime”, stała zostaje tylko dla testów webowych); serialize/restore (zależą od struktur Map main.ts — G2/G3).

## 3. Partie kolejne (NIE w tej rundzie; szacunek z dossier MULTIWAR-2)

- **G2** — `forced-war-common.ts` 186–537 (`assignForcedWarPairings`, `ForcedWarPairingOpts`, `restoreForcedWarState`, serialize/restore lock i stanu) + `forced-war-bronze.ts` (eligibility, pick, rest, serialize) + `forced-war-iron.ts` (eligibility, `isIronEraEntry`, pick, rest). Szacunek 500–600 LOC Rust. Bronze/iron importują `WAR_RULES_PARAMS` (JSON) — w Rust progi są stałymi (`ERA_FORCED_WAR_START_TURNS_*`).
- **G3** — `forced-war-waves.ts` (293 linii: `planForcedWarWave`, `pruneForcedWarWaves`, `approachSectorForHex`, `hexDistanceForForcedWar`) oraz timer/podpięcie wypowiedzenia (`main.ts`: trigger wejścia AI w epokę, ERADELAY). Timer żyje w `main.ts` — poza allowlistą war_*.rs; wymaga osobnego tematu lub zgody na przeniesienie logiki do `domain/war_*.rs`.

## 4. Pomiar NIE_ZMIERZONO

- Pełna zgodność semantyki `evaluateInterCivWarGate` z pinem dc8a3adc (hunk l.156) — zmierzona tylko istnienie hunku w Rust, nie cała semantyka (jak w MULTIWAR-2).
- Trigger wejścia AI w epokę (`main.ts`, FALA 558 „ERAPOOL”) — NIE_ZMIERZONO w Rust (brak odpowiednika poza `war_era_pool.rs`).

## 5. Obrona rundy 1 (ODPOWIEDZI NA ZARZUTY)

- Generator wektorów jest w repo: `rust-port/engine/tests/p6_forced_war_g1_data/gen_cases.mjs` (tryb weryfikacji: `node gen_cases.mjs <gra/src> <cases.json>`, z `--write` przelicza `out` i dopisuje 53 wektory `hexDistance`). Przeliczenie 208 wektorów bazowych przez prawdziwe funkcje weba: 0 różnic.
- Jedyny patch weba: w kopii `forced-war-stone.ts` import `./forced-war-common` dostaje `.ts` (gen_cases.mjs robi to programowo w katalogu tymczasowym; logika bez zmian).
- Odległość heksowa: web `hexDistance` (units/setup.ts) = max(|dq|,|dr|,|ds|) z s=-q-r; test Rust używa (|dq|+|dr|+|dq+dr|)/2, co jest tożsame przy dq+dr+ds=0. Sprawdzone wektorami `hexDistance` (siatka 7x7 + 4 pary). Porównanie z hexDistance w ścieżkach main.ts pozostaje na G3.
- Pełne 318 binarek tests/ NIE_ZMIERZONO (dysk < 8 GB, stan repo: zmiana src addytywna).
