# P6-WIRE-WAR-TURN-PLAN — plan podpięcia funkcji czystych wojny/dyplomacji do tury Rust

Temat: `R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1`, runda 3/5 (rewizja r3 = errata po FC r2: sekcja 7 D7 „W4” zamiast „W6”; komentarz sumy LOC pod tabelą partii §6 poprawiony; zmiany r2 oznaczone „r2”, errata r3 oznaczona „r3”). Domena: PROCESS (dokumentacja, zero kodu Rust, zero `cargo`, zero zmian w `gra/**`).
Baza Rust: `origin/rust-port/parity-v2` = `730cd6f18`. Web (numery linii): `main` = `60a18c60d` (`gra/src/main.ts` = 45 671 linii).
Pomiar: `grep`/`wc -l`/`git show` po plikach z tych dwóch SHA. Nic nie kompilowano ani nie uruchamiano. Gdzie nie zmierzono: `NIE_ZMIERZONO`.

## 0. Wnioski główne

1. Wszystkie wymienione w GOAL moduły są **funkcjami czystymi bez wołającego w kodzie produkcyjnym**: poza własną grupą (`war_forced_*`, `war_all_in_capital*`, `diplomacy_*`) i `domain/mod.rs` żaden plik ich nie używa; jedynymi konsumentami są testy `rust-port/engine/tests/p6_*`.
2. W Rust **nie ma pętli tury dotykającej miast, jednostek i dyplomacji**: `playable.rs::advance_turn` (l. 559) i `session.rs::advance_turn` (l. 82) to szkielet kolejki faz (`TurnPhase`, 9 faz) bez wywołań ekonomii/AI/dyplomacji; `turn_economy_wire::run_economy_tick_for_game` jest wołane wyłącznie z testów (`tests/p6_adv_q6_wire.rs`, `p6_state_src.rs`, `p6_empirefood_e2e.rs`).
3. Brakuje więc nie tylko „kleju wojny”, ale **wspólnego nosiciela stanu świata** (miasta + jednostki + dyplomacja + właściciele + epoki) i **adapterów** do ~10 różnych mini-typów wejściowych (`WarTargetCity`, `HomeWarCity`, `WaveCity`, `SiegeCity`, `EnterCity`…). Partie zaczynają od stanu zapisu i widoku świata, dopiero potem wołają moduły.

Uwaga do numerów linii z dispatchu: na `60a18c60d` `ownerLoop` zaczyna się w `main.ts:39152` (nie ~38870–38975), „Krok A” (warunki `shouldSearch`) to `main.ts:38853–38990`, definicja `sweepStaleForcedWarEntries` to `main.ts:11245` (`:11206` to `cleanupStoneForcedWarOnPeace`). `prepareAiGeneralWarCampaign` = `main.ts:7480` (zgodnie).

Konwencja ścieżek (r2): `main.ts` = `gra/src/main.ts`; `ai.ts` = `gra/src/game/ai.ts`; pozostałe pliki web bez prefiksu (`ai-war-home-defense.ts`, `forced-war-waves.ts`, `diplomacy.ts`, `diplomacy-tick-war-brake.ts`) = `gra/src/game/<nazwa>`. Korekta r2: wywołanie `sweepStaleForcedWarEntries()` to `main.ts:38872` (nie 38873; `38873` to `computeLostToNearerSiblingByCity`); Krok A zaczyna się od `38874`. Pełna kolejność tury po korekcie r2 — sekcja 3.

## 1. Pomiar (1): moduły zportowane, bez wołającego w turze

LOC: Rust (`wc -l`) / web (`wc -l` na `60a18c60d`). „Wołający w webie” = miejsca użycia (nie definicje).

| Moduł Rust (`engine/src/domain/`) | LOC Rust | Odpowiednik web (LOC) | Wołający w webie | Wołający w Rust (prod.) |
|---|---|---|---|---|
| `war_home_defense.rs` + `war_home_defense_plan.rs` (`plan_home_war`, `HomeWarMemoryStore`) | 374 + 473 | `ai-war-home-defense.ts` (458) | `ai.ts:3498` (`planHomeWar` w `decideAITurn`) | brak (tylko `_plan` → `war_home_defense`) |
| `war_city_founder.rs` (`city_founder_id`, `is_city_lost_of`) | 41 | `cities.ts:1120` | `ai-war-home-defense.ts:283`, `cities.ts:1158` | tylko `war_home_defense` |
| `war_target_select.rs` | 166 | `ai-war-target-select.ts` (69) | `main.ts:7563` (kampania), `main.ts:33513` (all-in capital) | brak |
| `war_era_pool.rs` | 111 | `war-rules-multiwar.ts` (520) | `main.ts:39016` (`isPlayerEligibleForEraWarPool`), `39091` (`isPlayerEraWarSlotFree`) | brak |
| `war_forced_common.rs` | 115 | `forced-war-common.ts` (537) | `main.ts` imports `1312–1318`; parowanie `39117` | tylko `war_forced_{stone,bronze,iron,pairing}` |
| `war_forced_stone.rs` / `_bronze.rs` / `_iron.rs` | 51 / 75 / 80 | `forced-war-{stone,bronze,iron}.ts` (134/250/284) | `main.ts:38933` / `38898` / `38956` (`isEligibleFor*`), `pick*TargetId` w `decideAIDiplomacy` | tylko `war_forced_trigger` |
| `war_forced_pairing.rs` (`assign_forced_war_pairings`, `ForcedWarSaveState`, `restore_/serialize_forced_war_state`) | 417 | `forced-war-common.ts` (jw.) | `main.ts:39117`; zapis `35790–35880`, odczyt ok. `44908` | brak |
| `war_forced_waves.rs` (`plan_forced_war_wave`, `prune`, serializacja) | 561 | `forced-war-waves.ts` (293) | `ai.ts:3840` (plan), `main.ts:39335` (`pruneForcedWarWaves`), `11211/11257` (delete przy pokoju) | brak |
| `war_forced_trigger.rs` (`should_search_*`, `sweep_stale_forced_war_entries`, `ForcedWarRegistries`) | 239 | fragmenty `main.ts:38853–38990`, `11245–11260` | `main.ts:38872` (sweep, r2: było 38873), `38898/38933/38956` | brak |
| `ai_peace_city_offer.rs` | 346 | `ai.ts:6234–6300` | `ai.ts:6754/6757` (oddaj), `6783` (żądaj) w `decideAIDiplomacy`; wykonanie komend `main.ts:40413` | brak |
| `diplomacy_siege_war_gate.rs` | 185 | `diplomacy-siege-war-gate.ts` (111) + `mapSiegeDetect.ts` (95) | `main.ts:17245` (`isSiegeStillValid`), `17258` (`autoSiegeCandidateForScan`), import `477` | brak |
| `diplomacy_locks.rs` (`resolve_diplomacy_action_lock`) | 364 | `diplomacy-locks.ts` (382) | `main.ts:23955`, `diplomacy-audience-actions.ts:83` | brak (tylko test) |
| `diplomacy_rejection_cooldown.rs` | 115 | `diplomacy-rejection-cooldown.ts` (105) | `main.ts:19371` (`isOfferRejectedOnCooldown`), `19749` (`recordRejectedOffer`), `35743` (prune przy zapisie), `45417` (restore) | brak |
| `ai_zakup_jednostki.rs` (`should_ai_purchase_unit`) | 84 | `ai.ts:7207–7262` | `main.ts:41206` (egzekucja komendy `build` jednostki) | brak |
| `siege_starvation.rs` (`siege_starvation_state`, `siege_defender_units`) | 237 | `siege-starvation.ts` (149) | `main.ts:37234/37262` (tick oblężenia), `16767`, `37226` | brak |
| `siege_sortie.rs` / `siege_enter_city.rs` | 227 / 152 | `siege-last-stand.ts` (202) / `siege-enter-city.ts` (106) | `main.ts:17301` (`planLastStandSortie`); wejście do miasta po kapitulacji: linia `NIE_ZMIERZONO` | brak |
| `ai_general_war_campaign.rs` | 365 | `ai-general-war-campaign.ts` (203) | `main.ts:7552/7598` w `prepareAiGeneralWarCampaign` (`7480`) | brak |
| `war_all_in_capital{,_plan,_nav}.rs`, `war_rules_multiwar.rs` | 325+551+424+140 | `warAllInCapital.ts` (938) | `ai.ts:4570/4719`, `barbarians.ts:1860` | tylko wewnętrznie |
| `diplomacy_war_weariness_tick.rs`, `diplomacy_ai_forced_peace.rs`, `diplomacy_multiwar_peace.rs` | 439 + 531 + 263 | `war-weariness.ts` (302), `diplomacy-ai-forced-peace.ts` (331) | `main.ts:34305/34308` (`tickAiAiPeaceRequests`), `34357/34368` (`tickAiAiWarWeariness`); wołane `41380`/`41386` po `runAiPhase` | tylko wewnętrznie |
| `diplomacy_tick_war_brake.rs` | 387 | `diplomacy-tick-war-brake.ts` (239) | r2 (zarzut 2, korekta): `main.ts:10959–11069` (`diploBrakeCrisisStep`, `brakeWarOutcome`, `sortCrisisQueue`); `main.ts:11115` (`tickDiploAiAiPairsWithBrake`) wołane z `main.ts:23195` w `runDiplomacyTurnTick` (`23101`), które wołane jest z `main.ts:36618` (faza dyplomacji tury); `main.ts:11004` (`diploBrakeBonusFlags`) → `TickCtx` w `main.ts:39726` (tam `tickDiplomacy` gracz↔AI, nie brake); zapis flagowany `35747–35749` | brak |
| `diplomacy_nap_trust.rs`, `diplomacy_aggressor.rs`, `diplomacy_truce.rs`, `alliance_war_obligation.rs` | 233 + 365 + 222 + (nie liczono) | `NIE_ZMIERZONO` (poza GOAL; zależności `diplomacy_locks`) | m.in. `main.ts:22767` (`aiHonorsAllianceWarObligation`) | `nap_trust` → `locks`; `truce` → `alliance_war_obligation` |

Pozostałe moduły AI bez wołającego w turze (poza zakresem, ale zależne): `ai_turn.rs` (1453 LOC, planer pojedynczej tury AI z własnym światem `HexCoord/MapTile/UnitKind`), `ai_era_unit_promotion.rs`, `ai_move_range.rs`.

## 2. Pomiar (2): gdzie w Rust jest pętla tury i jakie są punkty wejścia

| Element | Plik:linia | Stan |
|---|---|---|
| Kolejka faz (`StartTurn, PlayerActions, Diplomacy, Economy, Production, Ai, Barbarians, Victory, EndTurn`) | `domain/events.rs:44` (`TurnPhase`), `CANONICAL_PHASE_ORDER` | tylko typ i kolejka; **brak handlerów faz** |
| `PlayableState::advance_turn` | `domain/playable.rs:559` | zdejmuje 9 zdarzeń, `turn+1`, reset ruchu jednostek; demo (mapa 8×5, `HUMAN_PLAYER_ID`), brak miast gry/dyplomacji |
| `GameState::advance_turn` | `domain/session.rs:82` | `self.turn.advance()`; brak logiki |
| Tick ekonomii dla gry | `domain/turn_economy_wire.rs:234/246` (`run_economy_tick_for_game[_with_food]`), `turn_economy_loop.rs:480`, `turn_economy_advance.rs:264` | pełny, **wołany tylko z testów**; własne typy (`City` z `terrain::city_founding::p6_6b::cities`, `GameEconomyContext`) |
| Stan dyplomacji | `domain/diplomacy.rs:1611` (`DiplomacyState`: `relations`, `deals`; `tick_pair`, `apply_event`) | istnieje, serde; brak rejestru właścicieli |
| Zapis | `domain/save_load.rs` (`SaveSnapshot`, `SaveMeta`) | `meta` ma **tylko** `battleModeSettingVersion`, `newGameParams`, `warRulesEraWarCountByCiv` |
| Bridge | `bridge.rs` (`EngineBridge`, `CivEngineAdapter`) | adaptuje `PlayableState`; brak komend wojny/dyplomacji |
| Stan graczy | `domain/player.rs:273` (`PlayerState`) | istnieje; powiązanie z tym planem `NIE_ZMIERZONO` |

Punkty wejścia istniejące: `run_economy_tick_for_game_with_food`, `DiplomacyState::{tick_pair,apply_event}`, `plan_*` modułów wojny, `restore_/serialize_*` w `war_forced_pairing`, `war_forced_waves`, `ai_general_war_campaign`, `parse_crisis_counters`. **Nie ma:** `run_turn` łączącego fazy; rejestru `aiOwnerList` / `eliminatedOwners` / `ownerEraByOwner`; widoku „miasta+jednostki+relacje” dla planerów.

## 3. Pomiar (3): mapowanie web `main.ts` → brakujące miejsce w Rust

Kolejność jednej tury w webie (`60a18c60d`, r2: POPRAWIONA po zarzucie 1 — wcześniejsza wersja pomijała `runDiplomacyTurnTick` i błędnie ustawiała prune fal / kampanię po planie ruchu; sekwencję zweryfikowano odczytem `main.ts`):

1. `runWorldEndTurn` `36535` → `runDiplomacyTurnTick()` `36618` (definicja `23101`): dobra wola `23181`, `tickDiploAiAiPairsWithBrake()` `23195` (tick AI↔AI), licznik kryzysu wszystkich par.
2. Ekonomia miast `36757` (`advanceCityEconomy`).
3. Tick oblężenia (głód, poddanie, `siegeTurnByCity++` `37271–37272`) `37226–37262`.
4. `runAiPhase` (definicja `38752`, `await` `41394`):
   a. formowanie umów AI↔AI (na początku `runAiPhase`);
   b. `sweepStaleForcedWarEntries()` `38872`;
   c. Krok A `38874–38990`;
   d. pula gracza `39016–39100`;
   e. `assignForcedWarPairings` `39117`;
   f. `ownerLoop` `39152` — dla KAŻDEGO właściciela, w tej kolejności: prune fal `39335` (tylko gdy `attackerId === ownerId`) → `prepareAiGeneralWarCampaign` `39353` → `tickDiplomacy` gracz↔AI `39726` → `decideAIDiplomacy` `40130` → wykonanie komend (`wypowiedz_wojne`, `oferuj/zada_miasto_za_pokoj` `40413`, build/zakup jednostki `41206`) → `decideAITurn` `40470` (tam m.in. `planHomeWar` `ai.ts:3498`, `planForcedWarWave` `ai.ts:3840`, `planWarAllInCapital` `ai.ts:4570`);
   g. `tickAiAiPeaceRequests` `41380` → `tickAiAiWarWeariness` `41386` → `scanAutoSiegesAfterAiTurn` `41391`.
5. `checkVictory` `41805`.

| Blok weba | Linie `main.ts` | Brakujące miejsce w Rust (propozycja) | Moduły do wywołania |
|---|---|---|---|
| Krok A + sweep + wpis wejścia w epokę (`bronzeEraEnterTurnByOwner.set` `2401/2459`, iron `2419/2460`) | `2395–2460`, `38853–38990`, `11245–11260` | `war_turn_forced.rs` (nowy): `forced_war_step(world,&mut state,turn)` | `sweep_stale_forced_war_entries`, `should_search_*`, `is_eligible_for_*`, `is_iron_era_entry` |
| Pula gracza ERAPOOL | `39016–39100` | ten sam moduł | `is_player_eligible_for_era_war_pool`, `is_player_era_war_slot_free` |
| Parowanie | `39117–39145` | ten sam moduł | `assign_forced_war_pairings` (+ `can_civ_join_era_forced_war`) |
| Wykonanie `wypowiedz_wojne` wymuszonej + rejestr epoki | `40130–40330` | `war_turn_declare.rs` (nowy) | `pick_*_forced_war_target_id`, `record_era_forced_war_participation`, `DiplomacyState::apply_event` |
| Sprzątanie przy pokoju / koniec wg liczby miast | `11206–11360`, `39335` | `war_turn_declare.rs` | `should_end_forced_war_by_city_count`, `prune_forced_war_waves`, `is_forced_era_peace_locked` |
| Kampania generała + cele | `7480–7620`, `33513` | `ai_war_march_plan.rs` (nowy) | `choose_ai_general_war_target`, `reconcile_ai_general_war_campaign`, `build_war_city_targets`, `plan_war_all_in_capital` |
| Obrona domu / fale | `ai.ts:3498`, `ai.ts:3840` | ten sam moduł | `plan_home_war` (+`HomeWarMemoryStore`), `plan_forced_war_wave` |
| Dyplomacja AI (oferty miast, cooldown, blokady, zakup) | `19371`, `19749`, `23955`, `40130`, `40413`, `41206` | `ai_diplomacy_turn.rs` (nowy) | `ai_pick_miasto_do_oddania/zadania`, `is_offer_rejected_on_cooldown`, `record_rejected_offer`, `resolve_diplomacy_action_lock`, `should_ai_purchase_unit` |
| Brama „oblężenie tylko w wojnie” | `17245–17260` | `ai_diplomacy_turn.rs` / `siege_turn.rs` | `ai_auto_siege_allowed`, `is_siege_still_valid`, `auto_siege_candidate_for_scan` |
| Tick oblężenia / wypad / wejście | `37226–37262`, `17301` | `siege_turn.rs` (nowy) | `siege_starvation_state`, `siege_defender_units`, `plan_last_stand_sortie`, `plan_surrender_entry` |
| Pokój/zmęczenie AI↔AI | `34305–34380`, `41380–41386` | `war_turn_ai_ai.rs` (nowy) | `run_ai_ai_peace_tick`, `run_war_weariness_tick` |
| Dyplomacja tury r2 (brake AI↔AI, licznik kryzysu, dobra wola) | `23101–23205` (wołane `36618`), `10959–11069`, `11004`, `11115` | `ai_diplomacy_turn.rs` + wrapper `diplomacy_tick_war_brake` (W6) | `advance_crisis_counter`, `brake_war_outcome`, `sort_crisis_queue`, `pick_war_declarer`, `dobra_wola_turn_step`, `ai_ai_pairs` (wszystkie w `diplomacy_tick_war_brake.rs`), `diplomacy::tick_pair` |
| Kolejność fazy i integracja | `36535–41805` (r2: od `runWorldEndTurn`) | `turn_war_pipeline.rs` (nowy, ostatnia partia) | wszystkie powyższe |

## 4. Pomiar (4): stan serializowany potrzebny do podpięcia

Web zapisuje w `main.ts:35790–35880` (odczyt ok. `44908`, `45417`; czyszczenie przy nowej grze `43428–43437`). „Rust” = czy istnieje typ/serializer; `SaveMeta` ma tylko `warRulesEraWarCountByCiv`.

| Pole zapisu (web) | Typ / serializer w Rust | W `SaveMeta` | Uwagi |
|---|---|---|---|
| `{stone,bronze,iron}ForceWar{PendingOwners,CycleOwners,RestUntilByOwner,ActiveByPairKey}` | `ForcedWarSaveState` + `restore_/serialize_forced_war_state` (`war_forced_pairing.rs:358–415`) | NIE | 3 × 4 pola; `pending_owners` = zbiór właścicieli z odroczoną wojną |
| `bronzeEraEnterTurnByOwner`, `ironEraEnterTurnByOwner` | brak typu (mapa owner→tura); `is_iron_era_entry` istnieje | NIE | stary zapis bez pola ⇒ próg czasu pomijany (komentarze `main.ts:2224`, `2318`) — zachować |
| `forcedEraPeaceUntilNextEraByPairKey` | logika `is_forced_era_peace_locked`; serializacja `NIE_ZMIERZONO` | NIE | |
| `forcedWarWavesByPairKey` | `serialize_/restore_forced_war_waves` (`war_forced_waves.rs:469/522`) | NIE | |
| `aiGeneralWarCampaignByOwner` | `ai_general_campaign_to_save` / `restore_ai_general_campaigns` | NIE | |
| `regularWarCapturedByPairKey` | `NIE_ZMIERZONO` | NIE | wejście do `should_end_forced_war_by_city_count` |
| `aiAiPeaceRequestByPairKey`, `warWearinessByPairKey` | `AiPeaceRequestStore`, `WarWearinessStore` | NIE | serializacja do JSON `NIE_ZMIERZONO` |
| `rejectedOfferCooldowns` | `RejectedOfferCooldown` + `prune_expired_rejected_offers` | NIE | |
| `diplomacyPairMeta`, `diplomacyCrisisCounters`, `diplomacyTradeStreak` | `DiploPairMeta`, `parse_crisis_counters` | NIE | crisis/trade tylko przy fladze war-brake ON |
| `aggressorFlagUntilByOwner`, `casusBelliUntilByPair` | typy w `diplomacy_aggressor.rs`; serializacja `NIE_ZMIERZONO` | NIE | |
| `warRulesEraWarCountByCiv` | `restore_era_war_counts` | TAK | jedyne pole już wpięte (P6-ZAPIS-ERAWAR) |
| `ownerEraByOwner`, `ownerStartEraByOwner`, `eliminatedOwners` | brak (świat) | NIE | wejścia Kroku A |
| histereza obrony domu (`HomeWarMemoryStore`) | typ istnieje | NIE | czy web ją zapisuje: nie ma jej na liście `35790–35880`; założenie: odtwarzana (D6) |
| `foundedBy` / `foundedByOwner` na mieście | `state.rs:1746–1749` | pole miasta | jest w `City` z `state.rs`, nie w `City` ekonomii (`p6_6b`) — adapter musi je przenieść |
| **r2 (zarzut 3):** `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey` | `main.ts:35705–35707` (zapis); odczyt `17265`, `37271`, `17111–17118` | NIE | tick oblężenia (W7) i brama (W6) je czytają; klucz `siegeAiKey(bId, cityId)`; brak typu w Rust; trafiają do W1 |
| **r2:** `diplomacyDeals`, `negotiationTable`, `pendingDiplomacyInbox`, `interHumanDiplomacyInbox` | `35708–35735` (`pendingDiplomacyInbox` `35708`, `interHumanDiplomacyInbox` `35710`, `diplomacyDeals` `35732`, `negotiationTable` `35735`) | NIE | umowy i skrzynki; W1 (store) |
| **r2:** `wiarygodnoscZdarzeniaByOwner`, `wiarygodnoscStrumienByOwner`, `wiarygodnoscOstatniaWojnaTuraByOwner`, `wiarygodnoscP4MilestonesByOwner`, `wiarygodnoscN7ActivePairs`, `diplomacyFactorLog` | `35751–35763` | NIE | wejście `tickDiplomacy` (W6); W1 |
| **r2:** `aiOneShotGiftLastTurn`, `aiTradeAgreementLastProposalTurn`, `aiMarchPassageRequestTurn`, `aiAiTradeAgreementLastTurn`, `aiResourceTradeLastProposalTurn`, `aiAudienceLastRequestTurn` | `35711–35716` | NIE | liczniki cooldownów AI; W1 (store) |
| **r2:** `diplomaticContactEstablished`, `diplomaticallyDiscoveredOwners`, `diplomaticDiscoveryPopupShown` | `35719–35727` | NIE | kontakt warunkuje blokady (`resolve_diplomacy_action_lock`, W6); W1 |
| **r2:** `playerEpochWarEnabled` (flaga, warunkowo), `capitalCityIdByOwner`, `aiTargetMemoryByOwner`, `battlePowerPtsByOwner`, `zdobyczePowerByOwner`, `aiOwnerCivMap`, `ownerDisplayName` | `35742–35793` | NIE | pomocnicze planerów wojny; W2 (widok) lub W1 |
| **r2, zakres przeglądu:** pełny przegląd bloku `buildSaveGameSnapshot` (`35587–35890`) wykonany. Pola niewymienione w tej tabeli i niedotyczące wojny, dyplomacji ani oblężenia (ekonomia, mapa, render, UI, `cityRelig`, `barbCamps`, `placedImprovements`, `hexClearingStates` itd.) są POZA ZAKRESEM P6 i nie są tu klasyfikowane. | — | — | — |

## 5. Ryzyka i zależności

- **R1 nosiciel stanu**: planery mają 10+ własnych typów wejściowych; potrzebny jeden `WarWorldView<'a>` (referencje do miast, jednostek, `DiplomacyState`, `eliminated`, `owner_era`, `capital_of`, `is_human`, `is_barbarian`, `is_city_state`).
- **R2 trzy światy**: `ai_turn.rs` (`HexCoord/MapTile`), ekonomia (`City` p6_6b), `state.rs` (`City`). Plan zakłada adaptery jednokierunkowe (świat → widok), bez migracji typów.
- **R3 asynchroniczność weba**: `ownerLoop` ma wznowienie po animacji bitwy (`aiOwnerListResumed`, `startOi`, `break ownerLoop` `41010`). W Rust zakładamy pętlę synchroniczną (D5).
- **R4 flagi runtime**: `isWarRulesMultiwarEnabled`, `isWarEpochPlayerFirstEnabled`, `isDiploTickWarBrakeEnabled` (D6).
- **R5 dryf numerów linii**: każda partia zaczyna od repinu symboli (`grep`), nie od numerów z tego dokumentu.

## 6. Propozycja partii (8 partii ≤ 600 LOC, w kolejności zależności)

LOC to **szacunek planistyczny** (`NIE_ZMIERZONO`), nie liczy testów ani wektorów. Każda partia: nowy plik w `engine/src/domain/`, wpis w `domain/mod.rs`, test `engine/tests/p6_wire_war_<x>.rs` z wektorami z webu (generator `.mjs` jak `p6_repin_ai_home_gen.mjs`), `cargo test` tylko nowego testu. Operator: Haiku; W5 i W8 (synteza wielu ścieżek) — SONNET z uzasadnieniem w dispatchu.

| # | ID | Zakres | Zależy od | Allowlista | LOC | Kryteria końca |
|---|---|---|---|---|---|---|
| W1 | `R-RUSTPORT-P6-WIRE-WAR-STATE-Q1` | `WarTurnState`: agregat stanu wojny (3× `ForcedWarSaveState`, `*_era_enter_turn`, `ForcedWarRegistries`, fale, kampanie, `regular_war_captured`, stores pokoju/zmęczenia/cooldownów; r2: stan oblężenia `siegeTurnByCity`/`siegeBesiegerByCity`/`siegeAiStateByKey` i pola dyplomacji z tabeli 4 r2) + `to_meta_json`/`from_meta_json` z kluczami weba; addytywne pola `SaveMeta` | brak | `domain/war_turn_state.rs`, `save_load.rs` (tylko meta), `tests/p6_wire_war_state.rs` | 520 | round-trip zapis→odczyt = JSON weba na wektorach; brak pola ⇒ zachowanie starego zapisu |
| W2 | `R-RUSTPORT-P6-WIRE-WAR-WORLDVIEW-Q1` | `WarWorldView` + adaptery do `WarTargetCity`, `HomeWarCity/Unit`, `WaveCity/Unit`, `SiegeCity/Unit`, `EnterCity`, `ForcedWarNeighborCandidate`; `founded_by` z `state.rs` | brak | `domain/war_world_view.rs`, `tests/p6_wire_war_view.rs` | 550 | adaptery deterministyczne; to samo miasto widziane przez 4 moduły na wspólnym fixture |
| W3 | `R-RUSTPORT-P6-WIRE-WAR-FORCED-STEP-Q1` | `forced_war_step`: sweep → Krok A (`should_search_*`, wpisy `*_era_enter_turn`) → pula gracza → `assign_forced_war_pairings` → przydziały per owner | W1, W2 | `domain/war_turn_forced.rs`, `tests/p6_wire_war_forced_step.rs` | 500 | wektory `38853–39145` na ≥ 3 scenariuszach (kamień/brąz/żelazo + gracz pierwszy); kolejność = `ownerLoopList` |
| W4 | `R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1` | deklaracja wojny wymuszonej, sprzątanie przy pokoju, koniec wg liczby miast, blokada pokoju epoki; r2: wykonanie zakupu jednostki AI (`ai_zakup_jednostki`, `main.ts:41206`, rezerwa 10/3/0, bramka skarbca wspólna z graczem wg D7) jako krok wykonania komend ownerLoop | W3 | `domain/war_turn_declare.rs`, `tests/p6_wire_war_declare.rs` | 534 | wektory `11206–11360`, `40130–40330`, `41206`; po pokoju: wpis i fale usunięte, `rest_until = turn+20`; zakup: wynik = `should_ai_purchase_unit` na wektorach |
| W5 | `R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1` | kampania generała, cele, `plan_home_war`, `plan_forced_war_wave`, `plan_war_all_in_capital` jako planer marszu per owner (zwraca komendy, nie wykonuje) | W2, W4 | `domain/ai_war_march_plan.rs`, `tests/p6_wire_war_march.rs` | 580 | wektory `7480–7620`, `ai.ts:3498/3840/4570`; priorytety S1→P1→S3→atak zgodne |
| W6 | `R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1` | r2: faza dyplomacji tury (`runDiplomacyTurnTick` `23101`: brake AI↔AI, licznik kryzysu, dobra wola, wrapper `diplomacy_tick_war_brake`) + dyplomacja AI w turze: blokady akcji, brama oblężenia, cooldown odrzuceń, oferty miasta za pokój (zakup jednostki przeniesiony do W4) | W1, W2 | `domain/ai_diplomacy_turn.rs`, `tests/p6_wire_war_diplo.rs` | 586 | wektory `23101–23205`, `11115`, `19371/19749/40413`; brake: `advance_crisis_counter` na ≥3 parach; cooldown 3 tury, osobny klucz `miasto_za_pokoj` |
| W7 | `R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1` | tick oblężenia (głód, poddanie, wypad, wejście do miasta) + tiki AI↔AI (prośba o pokój, zmęczenie) | W2, W6 | `domain/siege_turn.rs`, `domain/war_turn_ai_ai.rs`, `tests/p6_wire_war_siege_aiai.rs` | 560 | wektory `37226–37262`, `17301`, `34305–34380` |
| W8 | `R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1` | `run_war_turn(world,&mut state,turn)` (r2, kolejność wg sekcji 3): dyplomacja tury (brake AI↔AI) → ekonomia → oblężenie → AI (umowy AI↔AI → sweep → Krok A → parowanie → pętla właścicieli: prune fal → kampania → tickDiplomacy gracz↔AI → decideAIDiplomacy → komendy → decideAITurn) → tiki AI↔AI → scan oblężeń → zapis; jedno miejsce wywołania w fazach `Diplomacy`/`Ai`; test 2–3 tur | W1–W7 | `domain/turn_war_pipeline.rs`, `playable.rs` lub `session.rs` (jedno wywołanie), `tests/p6_wire_war_pipeline.rs` | 400 | 3 tury deterministyczne = ten sam hash zapisu; sekwencja zdarzeń zgodna z webem na wektorze |

Równoległość: W1 ∥ W2; potem W3; W4 ∥ W6; W5 po W4; W7 po W6; W8 ostatni. Maks. 4 naraz. Suma ≈ 4 230 LOC (szacunek r2/r3; r1 = 4 040; różnica +190 = W1 +70 (stan oblężenia i dyplomacja), W4 +84 (zakup jednostki AI przeniesiony z W6), W6 +36 (wiring brake tury); suma z tabeli: 520+550+500+534+580+586+560+400 = 4 230 — wszystko `NIE_ZMIERZONO`, szacunek planistyczny). Podział 8 partii zachowany (limit 5–8); żadna partia > 600.

## 7. Pytania ABC dla właściciela (zadaje orkiestrator; w tej rundzie nie zadawane)

(R) = rekomendacja Operatora.

- **D1 Nosiciel stanu świata.** A (R) osobny `WarWorldView` (referencje) + `WarTurnState`, bez zmian w `PlayableState`; B rozszerzenie `PlayableState`/`GameStateDto` o miasta, relacje i stan wojny; C czekać na ogólny `GameWorld` (`NIE_ZMIERZONO`, czy taki temat istnieje).
- **D2 Kolejność kroków w turze.** A (R) wiernie jak web (r2, sekcja 3): dyplomacja tury (`runDiplomacyTurnTick`) → ekonomia → oblężenie → `runAiPhase` (umowy AI↔AI → sweep → Krok A → parowanie → pętla właścicieli: prune fal → kampania → tickDiplomacy gracz↔AI → decideAIDiplomacy → komendy → decideAITurn) → tiki AI↔AI → scan oblężeń → zwycięstwo; B wg `TurnPhase` Rust (Diplomacy przed Economy — w tym przypadku zgodne z webem na poziomie dyplomacji, ale reszta kolejności wymaga decyzji) — zmiana semantyki, nowe wektory; C hybryda.
- **D3 Progi wojen wymuszonych.** A (R) 1:1 z webem (Kamień start tura 25; Brąz/Żelazo 20 tur od wejścia w epokę; odpoczynek 20; cooldown tej samej cywilizacji 20; max czas 20; max 2 miasta zdobyte/utracone); B inne wartości; C parametryzacja w pliku danych. Progi są już stałymi w Rust; pytanie dotyczy zatwierdzenia przy podpięciu.
- **D4 Format zapisu.** A (R) addytywne pola w `meta` o kluczach identycznych z webem; B własny format Rust + migracja (P6-ZAPIS-MIGRACJE); C dual-write.
- **D5 Wznowienie pętli AI po bitwie.** A (R) pominąć (pętla synchroniczna); B odtworzyć `aiOwnerListResumed/startOi` w zapisie.
- **D6 Flagi runtime i histereza obrony domu.** A (R) struktura `WarFlags` z domyślnymi jak web, histereza nie zapisywana; B flagi zahardkodowane ON; C histereza w zapisie.
- **D7 Zakup jednostki AI.** A (R) w W4 (wykonanie zakupu jako krok wykonania komend ownerLoop; wspólna bramka skarbca/manpower jak gracz); B osobny temat po stronie ekonomii/rekrutacji.
- **D8 Determinizm.** A (R) pętla właścicieli w kolejności `ownerLoopList` (partner pary gracza pierwszy), bez RNG; B z `Rng` silnika dla remisów (czy web gdziekolwiek losuje w tej ścieżce: `NIE_ZMIERZONO`).

## 8. Założenia

1. Numery linii webu = `60a18c60d`; baza Rust = `730cd6f18`.
2. „Brak wołającego” ocenione po wystąpieniach nazwy modułu w `rust-port/engine/src/**` poza własnym plikiem i w `tests/`; `#[path]` w testach liczone jako test.
3. LOC partii to szacunki, bez testów i wektorów.
4. `diplomacy_nap_trust`, `diplomacy_aggressor`, `diplomacy_truce`, `alliance_war_obligation` wchodzą przez `resolve_diplomacy_action_lock` (W6) i pola zapisu (W1); bez osobnej partii.
5. Zero kodu Rust, zero zmian `gra/**`, zero `cargo`.
6. (r2) Numery linii webu zweryfikowane ponownie odczytem `git show 60a18c60d:gra/src/main.ts` (grep wskazań) — poprawki: `38872`, `runDiplomacyTurnTick` `36618`, `scanAutoSiegesAfterAiTurn` `41391`, brake `23195/11115`. Nie zweryfikowano linii poza wymienionymi w tym dokumencie.
7. (r2) „Brak wołającego” w Rust: bez zmian względem r1 (nie przemierzano ponownie `engine/src/**`; wniosek z r1 przyjęty jako założenie).
