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

## 2a. Partia G2 (runda 2, dodatek 1) — parowanie, stan zapisu, Bronze, Iron

Baza: `f8c7007ef` (G1 zintegrowane). Wektory: `tests/p6_forced_war_g2_data/cases.json` (306 przypadków, generator `gen_cases_g2.mjs`, Node 22 + `--experimental-strip-types`, prawdziwy web z `git archive origin/main gra/src gra/data`; wejścia deterministyczne, PRNG ziarno 20261108).

| Symbol web | Rust | Plik | Wektory |
|---|---|---|---|
| `assignForcedWarPairings` (common:~330-537; krok 1-4, DP n<=24, galaz zachlanna n>24, gracz pierwszy) | `assign_forced_war_pairings` | `domain/war_forced_pairing.rs` | `p6_forced_war_g2_data/cases.json` (85) |
| `ForcedWarPairState`, `ForcedWarSaveState`, `restoreForcedWarState`, `serializeForcedWarState` (common:~17-35, ~520-537) | `ForcedWarPairState`, `ForcedWarSaveState`, `restore_forced_war_state`, `serialize_forced_war_state` | `domain/war_forced_pairing.rs` | j.w. (roundtrip, 42) |
| `isEligibleForBronzeForcedWar`, `pickBronzeForcedWarTargetId`, `isRestingFromBronzeForcedWar`, stale `WOJNA_WYMUSZONA_*` (bronze) | `is_eligible_for_bronze_forced_war`, `pick_bronze_forced_war_target_id`, `is_resting_from_bronze_forced_war`, stale `WOJNA_WYMUSZONA_*` | `domain/war_forced_bronze.rs` | j.w. |
| `serializeBronzeForcedWarState` / `restoreBronzeForcedWarState` (bronze) | `serialize_bronze_forced_war_state` / `restore_bronze_forced_war_state` | `domain/war_forced_bronze.rs` | j.w. |
| `isEligibleForIronForcedWar`, `isIronEraEntry` (`prev<3 && next>=3`), `pickIronForcedWarTargetId`, `isRestingFromIronForcedWar`, stale `WOJNA_ZELAZO_*`, `EPOKA_ZELAZO_NUMER` (iron) | `is_eligible_for_iron_forced_war`, `is_iron_era_entry`, `pick_iron_forced_war_target_id`, `is_resting_from_iron_forced_war`, stale `WOJNA_ZELAZO_*`, `EPOKA_ZELAZO_NUMER` | `domain/war_forced_iron.rs` | j.w. |
| `serializeIronForcedWarState` / `restoreIronForcedWarState` (iron) | `serialize_iron_forced_war_state` / `restore_iron_forced_war_state` | `domain/war_forced_iron.rs` | j.w. |

Progi (1:1 z `war-rules-params.json` / stałymi webu): `ERA_FORCED_WAR_START_TURNS_BRONZE = ERA_FORCED_WAR_START_TURNS_IRON = 20` (`diplomacy_multiwar_gate.rs`, R-WEB-ERA-DELAY-Q1); pozostałe stałe (miasta=2, odpoczynek=20, cooldown=20, MAX_CZAS=20 nieużywany) jako literały z dokumentacją źródła.

ODSTĘPSTWA / ZAŁOŻENIA G2:
- Typ `ForcedWarEraTag` (bronze/stone/iron) zdefiniowany w `war_forced_pairing.rs` (web: union string); nie współdzielony z `ForcedEraTag` z `diplomacy_multiwar.rs` (różne moduły, ta sama semantyka).
- `serialize_*` w Rust = klon wektorów (web `Array.from` zachowuje kolejność wstawiania; Set/Map w Rust są wektorami z semantyką JS: duplikaty Set odrzucane, Map nadpisuje pod pierwszym kluczem). Porównanie wektorowe obejmuje ten kształt.
- `startTurn` (pair state) = `Option<f64>`; brak klucza w zapisie = `None` (zgodnie z `undefined` w JSON).
- Wszystkie pary AI↔AI; pary z `targetId = 0` nie występują w `existingActivePairs` (kontrakt webu, `main.ts` filtruje).
- `WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR` = 20 pozostaje ROBOCZYM ZAŁOŻENIEM webu (web: „zmień tę jedną liczbę, gdy Maciej poda właściwą”); Rust odzwierciedla wartość webu.
- Galaz zachłanna (n > 24) pokryta 2 wektorami (26 podmiotów); w praktyce nieosiągalna (≤16 cywilizacji + gracz).
- Rozmiar: `war_forced_pairing.rs` 417 LOC + `tests/p6_forced_war_g2.rs` 290 LOC w commicie G2a (przekroczenie budżetu 600 LOC na partię — ZAŁOŻENIE: pairing+state to jedna nierozdzielna całość 1:1 z `assignForcedWarPairings`); commit G2b: bronze 75 + iron 80 + test +181 LOC.

NIE_ZMIERZONO w G2: pełne `cargo test` 318 binarek (dysk < 5 GB w trakcie; uruchomiono `--lib` (22/22) i 14 binarek war/multiwar/zapis-erawar: 0 failed). `clippy --all-targets -D warnings`: czysto. `rustfmt --check` na nowych plikach: czysto.

## 3. Partie kolejne (NIE w tej rundzie; szacunek z dossier MULTIWAR-2)

- **G3** — `forced-war-waves.ts` (293 linii: `planForcedWarWave`, `pruneForcedWarWaves`, `approachSectorForHex`, `hexDistanceForForcedWar`) oraz timer/podpięcie wypowiedzenia (`main.ts`: trigger wejścia AI w epokę, ERADELAY). Dispatch rundy 2 stanowi: G3 (waves/timer/trigger main.ts) zostaje na rundę 3.
- **G3** — `forced-war-waves.ts` (293 linii: `planForcedWarWave`, `pruneForcedWarWaves`, `approachSectorForHex`, `hexDistanceForForcedWar`) oraz timer/podpięcie wypowiedzenia (`main.ts`: trigger wejścia AI w epokę, ERADELAY). Timer żyje w `main.ts` — poza allowlistą war_*.rs; wymaga osobnego tematu lub zgody na przeniesienie logiki do `domain/war_*.rs`.

## 4. Pomiar NIE_ZMIERZONO

- Pełna zgodność semantyki `evaluateInterCivWarGate` z pinem dc8a3adc (hunk l.156) — zmierzona tylko istnienie hunku w Rust, nie cała semantyka (jak w MULTIWAR-2).
- Trigger wejścia AI w epokę (`main.ts`, FALA 558 „ERAPOOL”) — NIE_ZMIERZONO w Rust (brak odpowiednika poza `war_era_pool.rs`).

## 5. Obrona rundy 1 (ODPOWIEDZI NA ZARZUTY)

- Generator wektorów jest w repo: `rust-port/engine/tests/p6_forced_war_g1_data/gen_cases.mjs` (tryb weryfikacji: `node gen_cases.mjs <gra/src> <cases.json>`, z `--write` przelicza `out` i dopisuje 53 wektory `hexDistance`). Przeliczenie 208 wektorów bazowych przez prawdziwe funkcje weba: 0 różnic.
- Jedyny patch weba: w kopii `forced-war-stone.ts` import `./forced-war-common` dostaje `.ts` (gen_cases.mjs robi to programowo w katalogu tymczasowym; logika bez zmian).
- Odległość heksowa: web `hexDistance` (units/setup.ts) = max(|dq|,|dr|,|ds|) z s=-q-r; test Rust używa (|dq|+|dr|+|dq+dr|)/2, co jest tożsame przy dq+dr+ds=0. Sprawdzone wektorami `hexDistance` (siatka 7x7 + 4 pary). Porównanie z hexDistance w ścieżkach main.ts pozostaje na G3.
- Pełne 318 binarek tests/ NIE_ZMIERZONO (dysk < 8 GB, stan repo: zmiana src addytywna).
