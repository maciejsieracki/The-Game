# P6-W8-R7-AUDYT — kolejność tury: pin web vs Rust (fazy Oblężenie / AI / głód / rebelia / barbarzyńcy)

Temat: R-RUSTPORT-P6-WIRE-WAR-R7-AUDYT-Q1 (runda 2, Operator — obrona po Evaluatorze r1 FAIL, `02-evaluator.md`).
Baza: `46c42deab` (= origin/rust-port/parity-v2 po INTEG-B12). Linia W8 NIE jest na bazie (jest w INTEG-B13);
czytana z `origin/rust-port-wip/WIRE-WAR-STORES-fc` = `9164ab7d7` przez `git show`.
Pin web (tylko odczyt): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, plik `gra/src/main.ts` (47448 linii).

Oznaczenia statusu: PORT = funkcja Rust istnieje; WPIETE = wołana z produkcyjnej ścieżki `run_war_turn`;
BRAK = nie wołana z produkcyjnej ścieżki (tylko testy lub brak funkcji); NIE_ZNALEZIONO = grep po nazwie
w bazie nie zwrócił funkcji (logika może istnieć pod inną nazwą); NIE_ZMIERZONO = nie sprawdzono.

Historia rewizji:
- r1 (48f2853b8): pierwsza wersja, Evaluator r1 FAIL (Z1-Z5).
- r2 (ta wersja): poprawki wg Z1-Z5 + dwie korekty własne (D7 jest częściowo wpięte przez `run_brake_phase`;
  `tickSiegeMachinesForCity` na pinie to tylko anulowanie legacy kolejki). Odpowiedź na zarzuty: `02a-obrona.md`.

Stan faktyczny (zweryfikowany grepem):
- `TurnPhase` (`events.rs:44`) ma 9 faz: StartTurn=0, PlayerActions=1, Diplomacy=2, Economy=3, Production=4, Ai=5, Barbarians=6, Victory=7, EndTurn=8.
- Na W8 (`9164ab7d7`) jedyna produkcyjna obsługa fazy to `run_diplomacy_war_phase` (`playable.rs:636` wywołanie w pętli kolejki, `playable.rs:665` definicja), wołająca `run_war_turn` (`turn_war_pipeline.rs:233`). Żadna inna faza (Economy, Production, Ai, Barbarians, Victory, EndTurn) nie ma handlera w `playable.rs`; `event_for_phase` (`playable.rs:687-695`) tylko mapuje zdarzenia.
- `run_war_turn` (nagłówek `turn_war_pipeline.rs:1-30`) wykonuje 6 kroków: klasyfikacja właścicieli, pary, wejścia (moc, epoki, blokady, granica), bramka R1/R2, `tick_pairs_relation_scores` (`turn_war_pipeline.rs:351`), `run_brake_phase` (`turn_war_pipeline.rs:372`). Efekty deklaracji NIE są stosowane (zwraca `declarations`).
- Funkcje oblężenia, głodu, AI-AI pokoju, zmęczenia wojną, barbarzyńców i ekonomii istnieją w Rust (`PORT`), ale na W8 ich wołającymi są testy (`tests/`, moduły `#[cfg(test)]`) albo wrappery bez wołającego produkcyjnego (np. `run_economy_tick_for_game_with_food` `turn_economy_wire.rs:246`: jedyne wywołania w `tests/p6_*`).
- `WarTurnState` trzyma stan oblężenia tylko jako surowy JSON (`siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey`, `war_turn_state.rs:82-84`); typowanego modelu nie ma.

## (1) Kolejność faz tury na pinie (`gra/src/main.ts`)

Funkcja końca tury na pinie to `runWorldEndTurn(humanOwnerId)` (`main.ts:38130`, koniec `:43587`). Nie ma w pinie funkcji o nazwie `advanceTurn`; `endActiveHumanTurn` (`:43587`) i `advanceSeat` (`:43815`) przekazują sterowanie.

Ważne: na pinie cała ekonomia, produkcja i rebelie jest JEDNYM blokiem `try` (`:38226-40297`) z pętlą miast (`:39257-39878`). Kroki E5-E12 nie są osobnymi fazami, lecz sekcjami tego bloku. Kolejność dla jednego miasta w pętli: kultura/religia → zadowolenie → rebelia → prawo po przejęciu → produkcja → rekrutacja.

| Krok | Pin (plik:linia) | Opis |
|---|---|---|
| E0 | main.ts:38132-38207 | `phaseMark('WORLD_START')` :38132, `sweepFortCaptures` :38139, `healInconsistentUnits` :38142, reset ruchu :38144-38155, `turn++` :38156, sprzątanie logów i zdarzeń :38171-38192, rotacyjny autozapis :38200-38205, `commitTurn` :38207 |
| E4 | main.ts:38209-38217 | FAZA DYPLOMACJI: `setTurnTransition(10)` :38209, `runDiplomacyTurnTick()` :38214 (try :38213-38217; definicja :24229) — szczegóły D1-D8 niżej |
| E5 | main.ts:38226-40297 (try), `advanceCityEconomy` :38356 | FAZA EKONOMII: tick ekonomii miast `advanceCityEconomy` :38356; pętla EmpireFood/auto-racje `try` :38409-38677 z `advanceEmpireFood` :38569, atrycja głodowa armii `applyArmyStarvationHpLoss` :38603, sprzątanie oblężeń po głodzie `endMapSiege` :38647 |
| E6 | main.ts:38683-38806 | sumy ekonomii gracza (`sumEconomyForPlayerCities` :38683), zapis rate HUD, `refreshPlayerCityEcon` :38756 |
| E7 | main.ts:38809-38881 | OBLĘŻENIA (`try` :38809, pętla `econ.perCity` z flagą `oblegany` :38814-38878): `siegeDefenderUnits` :38825, `siegeStarvationState` :38833, `applyArmyStarvationHpLoss` wariant oblężniczy :38844, flaga kapitulacji `surrenderNow` :38861; `handleSiegeCapitulationPhase` :38865 (gdy brak garnizonu); `resolveSiegeSurrender` :38867 (kapitulacja; wewnątrz jej ciała :17703 `triggerRebelProtectionWarConsequence`); licznik tury oblężenia `siegeT` :38870-38871 (Map `siegeTurnByCity`); `tickSiegeMachinesForCity` :38872 (ciało: tylko `cancelUnpaidLegacySiegeMachineQueue`, def :18328-18332); `maybeAiAssaultAfterMachines(oblCity, siegeT)` :38873 (def :18126, decyzja `decideAISiegeStance` :18135); `updateSiegeMapPanelTurn` :38876 |
| E6b | main.ts:38895-39098 | skarbiec i nauka gracza (`hState.skarbiec += hEcon.pieniadz` :38899), utrzymanie, `researchStep` :39013 |
| E8 | main.ts:39105-39206 | BRAMKA ZŁOTA (`try` :39105): `advanceGoldDeficit` :39118, `applyGoldDeficitHpLoss` :39131, sprzątanie oblężeń `endMapSiege` :39175 |
| E9-E12 | main.ts:39257-39878 | PĘTLA MIAST (`for (const city of cities)` :39257): kultura i religia `tickCityCultureReligion` :39276 (sekcja :39261-39307); zadowolenie i porządek :39410-39640; REBELIE: `tickRebelProtectionEndOfTurn` :39515, `updateRevoltGrace` :39552, `markCityRebellionStarted` :39564; `tickPostCaptureLawEndOfTurn` :39637; PRODUKCJA: `advanceProduction` :39765 (sekcja :39731-39800); REKRUTACJA :39801-39857 |
| E9b | main.ts:39880-40294 | po pętli miast: wzrost ludności, upkeep Pracy z `econ.pracaUpkeepByOwner` :39981, mapa cudów :39990-40014, alokacje AI :40050, auto-ulepszenia gracza :40066-40276, kultura gracza :40287 |
| E13 | main.ts:40301-43050 | FAZA AI: `setTurnTransition(38)` :40304, `phaseMark('AI_START')` :40305; `runAiPhase` (closure :40367-43048; `await runAiPhase()` :43049). Wewnątrz: decyzje AI, dyplomacja per właściciel `tickDiplomacy` :41361, wypowiedzenia AI `breakTreatiesOnWar` :40442 + `zarejestrujWypowiedzenie` :40449, AI-AI :41932 / :41940, pauza przy bitwie :42644-42660, potem `tickAiAiPeaceRequests(aiTurnAwaitingBattle)` :43035 (def :35846, `runAiAiPeaceTick` :35849), `tickAiAiWarWeariness` :43041 (def :35908), warunkowo `scanAutoSiegesAfterAiTurn` :43046 (def :18040, gdy `!aiTurnAwaitingBattle`) |
| E13b | main.ts:43051-43434 | po fazie AI: `sweepFortCaptures` :43062 (bezwarunkowo); FAZA BARBARZYŃCÓW: `setTurnTransition(94)` :43067; `barbariansActive` :43081; purge obozów naval (era 2) :43085-43090; `spawnCamps` :43095; `tickCamps` :43137; `decideBarbarianMoves` :43266; `evictForeignUnitsFromCityHexes` + `sweepFortCaptures` :43427-43428 |
| E14 | main.ts:43436-43500 | ZWYCIĘSTWO: `setTurnTransition(98)` :43438; `checkVictory(vInput)` :43481 (import `./game/victory` :1366; def `gra/src/game/victory.ts:228`) |
| E15 | main.ts:43572-43587+ | `phaseMark('PLAYER_TURN_BEGIN')` :43572, koniec tury człowieka `endActiveHumanTurn` :43587, `advanceSeat` :43815 |

Krok `runDiplomacyTurnTick` (main.ts:24229-~24331), kolejność wewnętrzna:
- D1 `expireTreaties` :24231 (import :1531)
- D2 wygasłe traktaty, finisz wiarygodności :24233-24270
- D3 `tickCyclicResourceTradeDeals` :24271 (def :24077)
- D4 `updateWiarygodnoscStreamsThisTurn` :24272 (def :24184), `tickWiarygodnoscBezWojnyMilestone` :24273 (def :12058)
- D5 `tickTruceExpiries` :24274 (def :12122)
- D6 `tickDiplomacyPayments` :24277 (import :1560) i zerwania za daninę :24278-24298
- D7 dobra wola :24300-24320 (gałąź `brakeOn`: `dobraWolaTurnStep`; gałąź bez hamulca: `tickDobraWolaOnRelation`)
- D8 hamulec wojny: `tickDiploAiAiPairsWithBrake` :24323 (def :11734); `diploBrakeCrisisStep` dla każdej pary gracz-AI :24327 (def :11578); `processDiploCrisisQueue` :24330 (def :11650). W kolejce: `breakTreatiesOnWar` :11705 i `zarejestrujWypowiedzenie(declarer, turn, 'hamulec')` :11713, komunikat :11715.

Uwaga o rozdzieleniu: na pinie hamulec i jego konsekwencje (D8) są wykonywane na początku tury, przed ekonomią (E5) i oblężeniami (E7); dyplomacja AI per właściciel (E13, :41361) jest dopiero po zakończeniu ekonomii i oblężeń.

## (2) Tabela: krok pinu → funkcja Rust (plik:linia) → status wpięcia

Linia odniesienia: `run_war_turn` na W8 (`9164ab7d7`); funkcje spoza W8 wskazane na bazie (`46c42deab`), gdzie są identyczne. Wszystkie wiersze z „BRAK” mają zweryfikowany brak wołającego w `turn_war_pipeline.rs` (grep po nazwie funkcji na `9164ab7d7`, poza modułem definiującym i testami).

| Krok pinu | Funkcja Rust (plik:linia) | Status wpięcia w `run_war_turn` (W8) |
|---|---|---|
| E0 / E1 (start, turn++) | `PlayableGame::advance_turn` `playable.rs:565` (base); licznik tury, reset ruchu | PORT częściowy: turn++ i reset ruchu tak; `sweepFortCaptures` (:38139), `healInconsistentUnits` (:38142), `evictForeignUnitsFromCityHexes` (:38137): BRAK |
| D1 `expireTreaties` (:24231) | NIE_ZNALEZIONO po nazwie `expire_treaties` w `engine/src`; logika traktatów w `diplomacy_truce_flow.rs`, `diplomacy_truce_end.rs` (base) | BRAK |
| D2 wygasłe traktaty, finisz wiarygodności (:24233-24270) | NIE_ZNALEZIONO po nazwie; pola wiarygodności w `diplomacy_locks.rs`, `war_turn_state.rs` (opaque) | BRAK |
| D3 `tickCyclicResourceTradeDeals` (:24077, wywołanie :24271) | `build_cyclic_resource_transfers` `diplomacy.rs:2620` (base; wołane z `diplomacy.rs:3600`, `:3686`, nie z `run_war_turn`) | BRAK |
| D4 `updateWiarygodnoscStreamsThisTurn` (:24184) / `tickWiarygodnoscBezWojnyMilestone` (:12058) | NIE_ZNALEZIONO po nazwie (wiarygodność w `trade.rs`, `diplomacy.rs` jako dane) | BRAK |
| D5 `tickTruceExpiries` (:12122, wywołanie :24274) | `truce_expiry_action` `diplomacy_truce.rs:199` (base; wołane z `diplomacy_truce_end.rs:228`) | BRAK |
| D6 `tickDiplomacyPayments` (:24277) | NIE_ZNALEZIONO po nazwie `tick_diplomacy_payments`; płatności w `diplomacy.rs` (`payload_has_currency_payment` :2745) | BRAK |
| D7 dobra wola (:24300-24320, gałąź `brakeOn`) | `dobra_wola_turn_step` `diplomacy_tick_war_brake.rs:350` (base), wołane z `run_brake_phase` `ai_diplomacy_turn.rs:178` | WPIETE częściowo (W8 r3): gałąź `brakeOn` przez `run_brake_phase` krok 1 (`turn_war_pipeline.rs:372`); gałąź bez hamulca (`tickDobraWolaOnRelation`) BRAK |
| D8 `tickDiploAiAiPairsWithBrake` (:11734, wywołanie :24323) | `run_brake_phase` `ai_diplomacy_turn.rs:154` krok 2 (AI-AI, potem gracz-AI); wołane `turn_war_pipeline.rs:372` | WPIETE (W8 r3) |
| D8 relacje par (`tickDiplomacy` dla par hamulca, :11738) | `tick_pairs_relation_scores` `ai_diplomacy_turn.rs:104`, wołane `turn_war_pipeline.rs:351` | WPIETE (W8 r3) |
| D8 bramka R1/R2 (warunek kolejki) | `gate_blocked_set` `turn_war_pipeline.rs:335`, licznik `turn_war_pipeline.rs:311-318` | WPIETE (W8 r3) |
| D8 `diploBrakeCrisisStep` (:11578, wywołanie :24327) | krok kryzysu w `run_brake_phase` krok 2 (`brake_crisis_step`, `ai_diplomacy_turn.rs`) | WPIETE (W8 r3) |
| D8 `processDiploCrisisQueue` (:11650, wywołanie :24330): kolejka wojen z progu | krok 3 w `run_brake_phase` (`ai_diplomacy_turn.rs:154`, sort + pominięcia) — zwraca `declarations` | CZĘŚCIOWO: obliczenie WPIĘTE, skutki BRAK (patrz niżej) |
| D8 skutek `zarejestrujWypowiedzenie(…,'hamulec')` (:11713) | `zarejestruj_wypowiedzenie` `diplomacy_aggressor.rs:309` (base, metoda) | BRAK (W8 nie stosuje `declarations`) |
| D8 skutek `breakTreatiesOnWar` (:11705) | `treaties_broken_by_war` `alliance_war_obligation.rs:251` (base; zwraca listę nazw, nie zrywa); traktaty ustawia `diplomacy_truce_flow.rs` | BRAK |
| Efekty deklaracji wojny: `ownerDeclareWarOn` (:13197) | `declare_war` `diplomacy_truce_flow.rs:239` (base); skutki sojuszy `applyAllianceObligationsOnWar` (:23867) → `joinAllyToWar` (:23797) | BRAK |
| Wszystkie wywołania `zarejestrujWypowiedzenie` na pinie (wypowiedzenie = `diplomacy_aggressor.rs:309`) | :11713 (`processDiploCrisisQueue` :11650, D8 przez :24330); :13177 (`playerDeclareWarOnOwner` :13152, akcja gracza, poza ogonem tury); :13221 (`ownerDeclareWarOn` :13197, wspólna ścieżka deklaracji); :23816 (`joinAllyToWar` :23797, z `applyAllianceObligationsOnWar` :23867); :40449 (E13, faza AI); :41940 (E13, faza AI) | BRAK we wszystkich (W8 nie stosuje `declarations`) |
| Wywołania `triggerRebelProtectionWarConsequence` (:13253) | :17703 (`resolveSiegeSurrender` :17662-17878, E7 — w ogonie tury); :36090 (ścieżka bitwy, poza ogonem tury) | BRAK |
| `cleanupRegularWarOnPeace` (:11884) | `cleanup_regular_war_on_peace` `war_turn_declare.rs:325` (base; wołane z `war_turn_declare.rs:375`) | BRAK |
| `finalizePeaceTreatyBetween` (:11911) | `finalize_peace_between` `war_turn_declare.rs:361` (wrapper: `cleanup` :375, `register` :385 pokrewne) oraz `diplomacy_truce_flow.rs:116` (metoda na stanie dyplomacji) | BRAK w `run_war_turn` (wołane tylko z `diplomacy_truce_flow.rs:179/183/228/347`, nie z pipeline) |
| Deklaracja wymuszona / koniec wojny wg miast | `declare_forced_wars` `war_turn_declare.rs:105` (wrapper :145); `register_regular_war_city_loss` `war_turn_declare.rs:385`; `forced_war_step` `war_turn_forced.rs:231` | BRAK (brak wołającego w pipeline; moduły `war_turn_declare.rs`, `war_turn_forced.rs` pokrywają pin :13262 `triggerRebelProtectionWarConsequence`, :17703) |
| E5 `advanceCityEconomy` (:38356) | `advance_city_economy` `turn_economy_tick.rs:270` (base); wrapper W8 `turn_economy_wire.rs:389` wewnątrz `run_economy_tick_for_game_with_food` (:246) | PORT (funkcja i wrapper), BRAK wpięcia: wrapper bez wołającego produkcyjnego (tylko `tests/p6_*`); brak handlera fazy Economy |
| E5 `advanceEmpireFood` (:38569) | `advance_empire_food` `city_growth.rs:2246` (base); wołane z `run_empire_food_block` `turn_economy_empirefood.rs:212` (W8) | PORT, BRAK wpięcia (jak wyżej) |
| E5 `applyArmyStarvationHpLoss` (:38603) | `apply_army_starvation_hp_loss` `turn_economy_attrition.rs:54` (W8; wołane `:291`, `:432`) | PORT, BRAK wpięcia |
| E5 sprzątanie oblężeń po głodzie (:38647) | `end_map_siege_fields` `siege_surrender.rs:206` (funkcja pola, nie pętla; wołane tylko w testach `siege_surrender.rs:395`) | BRAK |
| E6 sumy ekonomii (:38683-38806) | `sum_economy_for_player_cities` `turn_economy_wire.rs:94` (W8) | PORT, BRAK wpięcia |
| E6b bankowanie skarbca i nauki (:38895-39098) | `apply_treasury` / `apply_science` `turn_economy_wire.rs:135, :144` (W8) | PORT, BRAK wpięcia |
| E7 `siegeDefenderUnits` / `siegeStarvationState` (:38825, :38833) | `siege_city_turn` `siege_turn.rs:69` (decyzja N3 bloku, W7); `starvation_food` `siege_turn.rs:47` | PORT (funkcje), BRAK wpięcia: tylko testy (`siege_turn.rs:129-172`) |
| E7 `handleSiegeCapitulationPhase` (:17646, wywołanie :38865) | `handle_siege_capitulation_phase` `siege_surrender.rs:115` (wołane w testach :226-254 i w funkcji ticku kapitulacji :145, której wołający produkcyjny nie istnieje) | PORT, BRAK wpięcia |
| E7 `resolveSiegeSurrender` (:17662, wywołanie :38867) | `resolve_surrender_path` `siege_surrender.rs:167`; skutki przejęcia `apply_transfer_with_effects` `siege_transfer.rs:281` (wołane `siege_transfer.rs:264`) | PORT (funkcje), BRAK wpięcia |
| E7 `tickSiegeMachinesForCity` (:38872, ciało :18328-18332) | ciało na pinie to tylko `cancelUnpaidLegacySiegeMachineQueue(city)` (anulowanie legacy kolejki maszyn, bez ticku). Rust: NIE_ZNALEZIONO odpowiednika tego anulowania; kolejka i kwoty budowy w `siege_engine_build.rs:117-132` (`siege_engine_quota`, `siege_engine_build_option`) | BRAK (wołane z produkcji: nie; `siege_engine_build` bez wołającego w pipeline) |
| E7 `maybeAiAssaultAfterMachines` (:38873, def :18126, decyzja `decideAISiegeStance` :18135) | NIE_ZNALEZIONO po nazwie `decide_ai_siege_stance`. Najbliższe: `siege_turn.rs:69` (składa decyzję N3, ale szturm po maszynach wg `siege_turn.rs:9-12` zostawia wołającemu), `siege_sortie.rs` (wypad), `siege_enter_city.rs` (wejście) | BRAK |
| E7 licznik `siegeT` (:38870-38871) | Map `siegeTurnByCity` w `WarTurnState` (opaque, `war_turn_state.rs:82`); `siege_city_turn` przyjmuje turę jako wejście | BRAK wpięcia licznika (dane opaque) |
| E7 atrycja HP garnizonu | BRAK danych: `PlayableUnit` nie ma pola HP (`playable.rs`, struktura `PlayableUnit` na W8) | BRAK |
| E8 `applyGoldDeficitHpLoss` (:39131) | `apply_gold_deficit_hp_loss` `turn_economy.rs:676` (base); wołane z `run_gold_deficit_step` `turn_economy_post.rs:72` → `:135` (W8) | PORT, BRAK wpięcia (wrapper bez wołającego produkcyjnego) |
| E9 `tickCityCultureReligion` (:39276) | `tick_city_culture_religion` `state.rs:736` (base) | PORT, BRAK wpięcia |
| E10 `tickRebelProtectionEndOfTurn` (:39515) | `tick_rebel_protection_end_of_turn` `order_effects_lane.rs:171`; wołane z `compute_order_lane` `order_effects_lane.rs:766` | PORT, BRAK wpięcia; `PlayableCity` nie ma pól rebelii |
| E10 `updateRevoltGrace` (:39552) | `update_revolt_grace` `society_breakdown/order.rs:305`; wołane `order_effects_lane.rs:815` | PORT, BRAK wpięcia |
| E10 `markCityRebellionStarted` (:39564) | `mark_city_rebellion_started` `order_effects_lane.rs:141`; wołane `order_effects_lane.rs:826` | PORT, BRAK wpięcia |
| E11 `tickPostCaptureLawEndOfTurn` (:39637) | `tick_post_capture_law_end_of_turn` `order_effects_lane.rs:157`; wołane `order_effects_lane.rs:887` | PORT, BRAK wpięcia |
| E12 produkcja i rekrutacja miast (:39731-39857) | produkcja: `advance_production` (poza zakresem audytu, nie analizowane); wejście do pętli miast `compute_order_lane` `order_effects_lane.rs:475` (wołane z `turn_economy_inputs_native.rs:352`, bez wołającego w pipeline) | BRAK wpięcia |
| E13 `tickDiplomacy` per właściciel AI (:41361) | NIE_ZMIERZONO bezpośredniego odpowiednika; relacje par w `tick_pairs_relation_scores` (D8) | BRAK jako osobny krok |
| E13 wypowiedzenia AI (:40442-40449, :41932-41940) | te same funkcje co w tabeli efektów deklaracji (`applyAllianceObligationsOnWar`, `breakTreatiesOnWar`, `zarejestrujWypowiedzenie`) | BRAK |
| E13 `tickAiAiPeaceRequests` (:43035, `runAiAiPeaceTick` :35849) | `run_ai_ai_peace_turn` `war_turn_ai_ai.rs:84` (base) | PORT (funkcja), BRAK wpięcia (tylko testy) |
| E13 `tickAiAiWarWeariness` (:43041, def :35908) | `run_ai_ai_weariness_turn` `war_turn_ai_ai.rs:168` (base) | PORT (funkcja), BRAK wpięcia |
| E13 `scanAutoSiegesAfterAiTurn` (:43046, def :18040) | `auto_siege_candidate_for_scan` `diplomacy_siege_war_gate.rs:229` (kandydat, bez pętli skanu po miastach; pin skanuje `cities` :18043-18048) | CZĘŚCIOWO (kandydat), BRAK pętli |
| E13b `sweepFortCaptures` po fazie AI (:43062) i po barbarzyńcach (:43428) | NIE_ZNALEZIONO po nazwie `sweep_fort_captures` w `engine/src` | BRAK |
| E13b barbarzyńcy: `barbariansActive` (:43081) | `barbarians_active` `barbarians.rs:305` (base) | PORT, BRAK wpięcia: brak wołającego poza `barbarians.rs`; brak handlera fazy Barbarians |
| E13b barbarzyńcy: `spawnCamps` (:43095) / `tickCamps` (:43137) / `decideBarbarianMoves` (:43266) | `spawn_camps` `barbarians.rs:357`, `tick_camps` `barbarians.rs:467`, `decide_barbarian_moves` `barbarians.rs:695` (base); wrappery `decide_moves` :903, `spawn_barbarian_camps` :986, `tick_barbarian_camps` :996 | PORT (funkcje), BRAK wpięcia |
| E13b barbarzyńcy: stan obozów i jednostek | `PlayableState` ma `barbarians_level` (`playable.rs:57`, :76); brak pól obozów/jednostek barbarzyńców w PlayableState (grep `barb` w `playable.rs`: 3 trafienia, wszystkie `barbarians_level`) | BRAK danych obozów |
| E14 `checkVictory` (:43481; import :1366; def `gra/src/game/victory.ts:228`) | NIE_ZNALEZIONO portu: w `engine/src` brak funkcji `check_victory`/`victory`; jedyne ślady to pole `victory_mode` (`playable.rs:59`, :78), `data/economy_society_part2.rs:177-178` i etykieta fazy `VictoryCheck` (`events.rs:59`, :185) | BRAK (port nie istnieje) |
| Faza Economy/Production/Ai/Barbarians w Rust (`playable.rs`) | brak handlera fazy (grep: brak `TurnPhase::Economy =>`, `TurnPhase::Ai =>`, `TurnPhase::Barbarians =>` poza `event_for_phase` `playable.rs:687-695`) | BRAK (kolejka tylko zdarzenia) |

Wniosek jawny: z pinu do `run_war_turn` wpięte są krok D8 (hamulec, relacje, bramka R1/R2, kryzys par, obliczenie kolejki wojen) i część D7 (dobra wola w gałęzi hamulca). Wszystkie kroki oblężenia, głodu, rebelii, AI-AI, barbarzyńców, produkcji i skutków deklaracji mają port funkcji (większość), ale nie są wołane z produkcyjnej ścieżki tury.

## (3) Kolejność Rust (wariant B) i ROZNICE B

Kolejność Rust (`events.rs:44`, `TurnPhase`): StartTurn(0) → PlayerActions(1) → Diplomacy(2) → Economy(3) → Production(4) → Ai(5) → Barbarians(6) → Victory(7) → EndTurn(8).

Pin: E0-E1 → E4 Dyplomacja (D1-D8) → E5-E8 Ekonomia i oblężenia (wraz z E6b, E8) → E9-E12 pętla miast (kultura, zadowolenie, rebelie, prawo po przejęciu, produkcja, rekrutacja) → E13 AI (dyplomacja AI, AI-AI pokój, zmęczenie, auto-oblężenia) → E13b barbarzyńcy (po AI, przed zwycięstwem) → E14 zwycięstwo → E15.

| ID | Różnica | Konsekwencja |
|---|---|---|
| ROZNICA B1 | Pin: atrycja i kapitulacja oblężeń (E7) następują po ekonomii (E5) w tej samej turze. Rust: oblężenia nie mają fazy; ich naturalne miejsce wg kolejności Rust to Economy(3), po Diplomacy(2) | Kapitulacja z głodu na zapasach po ekonomii wymaga wpięcia w Economy(3), nie w Diplomacy(2) |
| ROZNICA B2 | Pin: konsekwencje hamulca (zerwanie, wojna) w D8 przed ekonomią i AI. Rust: W8 zwraca `declarations` bez skutków w Diplomacy(2) | Wojna z hamulca nie działa w tej turze dla Economy/Ai; wpięcie efektów zmienia kolejność względem pinu |
| ROZNICA B3 | Pin: dyplomacja AI per właściciel (E13, :41361) po ekonomii i oblężeniach. Rust: wszystkie relacje w Diplomacy(2) | AI widzi stan dyplomacji sprzed ekonomii; pin widzi po ekonomii i po kapitulacjach |
| ROZNICA B4 | Pin: AI-AI pokój i zmęczenie (E13, :43035-43041) po ruchach AI. Rust: `Ai(5)` bez handlera | Pokój AI-AI zawarty w tej turze wpływa na ruchy AI w pinie; w Rust (po wpięciu w Ai(5)) byłby zgodny z kolejnością Rust, nie pinu |
| ROZNICA B5 | Pin: w pętli miast rebelie (E10) są PRZED produkcją (E12) TEGO SAMEGO miasta (:39515-39640 przed :39731-39800), a prawo po przejęciu (:39637) też przed produkcją. Rust: Production(4) przed Ai(5), rebelie bez fazy | Miasto, które zbuntowało się w turze, w pinie produkuje już pod nowym właścicielem; w Rust (bez fazy rebelii) produkuje pod starym |
| ROZNICA B6 | Pin: barbarzyńcy (E13b, :43065-43434) po fazie AI i po `sweepFortCaptures` :43062, przed zwycięstwem (E14 :43481). Rust: Barbarians(6) po Ai(5), przed Victory(7) | Pozycja względna zgodna (po AI, przed zwycięstwem). Różnica: brak handlera fazy Barbarians w Rust i brak stanu obozów/jednostek barbarzyńców w PlayableState |
| ROZNICA B7 | Pin: `turn++` (E1, :38156) przed dyplomacją. Rust: `turn` zwiększany w `advance_turn` przed kolejką faz | Zgodne |
| ROZNICA B8 | Pin: zwycięstwo (E14) sprawdzane po barbarzyńcach (E13b) i po wszystkich AI. Rust: Victory(7) po Barbarians(6) | Zgodne co do pozycji; brak portu `checkVictory` w Rust (patrz tabela (2)) |

## (4) Wejścia brakujące dla każdej fazy

| Faza | Wejście | Źródło w PlayableState | Status |
|---|---|---|---|
| Diplomacy (D8) | epoki wszystkich właścicieli | `turn_war_epoch` (W8 r6); AI bez wpisu = `gameStartEra()` | PRODUKOWANE (W8) |
| Diplomacy (D8) | moc obiektywna (`objectivePowerForOwner`) | `power_raw_for_owner` `turn_war_inputs.rs:208` (W8) | PRODUKOWANE, z wyjątkiem składników infra/tech/religia (błąd STRICT, `PowerComponentsMissing`) |
| Diplomacy (D8) | blokady pokoju (`forcedEraPeaceUntilNextEraByPairKey`, `diplomacyPairMeta`) | `peace_locks_from_war` `turn_war_inputs.rs:438` (surowe z `WarTurnState.opaque`) | PRODUKOWANE |
| Diplomacy (D8) | wspólna granica | `PlayableCity`/mapa | PRODUKOWANE (W8 r6 klocek 2) |
| Diplomacy (D8) | kontakty `diplomaticContactEstablished` / `diplomaticallyDiscoveredOwners` | `WarTurnState` opaque | PRODUKOWANE |
| Diplomacy (D1-D7) | traktaty, handel cykliczny, płatności, wygaśnięcia, wiarygodność | `activeDeals`, `diplomacyDeals`, `diplomacyPairMeta` | BRAK w pipeline (dane w `DiplomacyState`/opaque, bez wpięcia; dobra wola D7 w gałęzi hamulca: PRODUKOWANE przez `run_brake_phase`) |
| Economy (E5) | zapasy żywności miast, głód państwa | `PlayableCity`: brak pola zapasu żywności | BRAK |
| Economy (E5) | budynki, tech, religia do ekonomii | `buildings_by_city`, `researched_techs_by_owner` istnieją; wrapper `run_economy_tick_for_game_with_food` nie jest wołany produkcyjnie | CZĘŚCIOWO (dane są, brak wywołania) |
| Oblężenie (E7) | stan oblężenia per miasto (tura oblężenia, oblegający, stan AI) | `WarTurnState` opaque: `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey` | OPAQUE, brak typowanego modelu |
| Oblężenie (E7) | HP jednostek garnizonu i oblegających | `PlayableUnit` bez pola HP | BRAK |
| Oblężenie (E7) | magazyn po turze (`magazyn_po_turze`) | `PlayableStores` (magazyny, W8 STORES) | CZĘŚCIOWO (magazyny są; pole zapasu oblężenia: NIE_ZMIERZONO w `playable.rs`) |
| Oblężenie (E7) | garnizon (`siegeDefenderUnits`) | `PlayableUnit` ma `owner_id`, `position`, brak `inGarnizon`/`oblegaCityId` | BRAK pól |
| Oblężenie (E7) | maszyny oblężnicze (gotowe, w kolejce, kwoty) | `siege_engine_build.rs` (funkcje), brak stanu w `PlayableCity` | BRAK stanu |
| Głód armii (E5, E7) | licznik karencji głodu wojska, `isArmyStarving` | brak w PlayableState | BRAK |
| Złoto/deficyt (E8) | skarbiec, deficyt, licznik | `PlayableState` ma `skarbiec`/`nauka` przez `apply_treasury`/`apply_science` (W8 wrapper `turn_economy_wire.rs:135-144`), licznik deficytu: NIE_ZMIERZONO w `playable.rs` | CZĘŚCIOWO |
| Efekty deklaracji wojny | stan traktatów, sojuszy, `casusBelliUntilByPair`, `aggressorFlagUntilByOwner` | `WarTurnState` opaque | OPAQUE; efekty BRAK |
| Rebelia (E10) | `rebelState`, `rebelPreviousOwnerId`, `rebelProtectionTurnsRemaining`, `revoltGraceRemaining` | `PlayableCity` bez tych pól; pola `PostCaptureLawFields` w `order_effects_lane.rs` | BRAK w PlayableCity |
| Kultura/religia (E9) | kultura, religia miast | `PlayableCity.culture` (W8 r6) istnieje; religia BRAK | CZĘŚCIOWO |
| Barbarzyńcy (E13b) | obozy (`barbCamps`), jednostki barbarzyńców, poziom (`barbariansLevel`) | `PlayableState.barbarians_level` (`playable.rs:57`); obozy i jednostki BRAK | CZĘŚCIOWO (poziom tak, stan obozów nie) |
| AI-AI pokój (E13) | `aiAiPeaceRequestByPairKey` | `WarTurnState` opaque | OPAQUE; producent BRAK w tej partii |
| AI-AI zmęczenie (E13) | `warWearinessByPairKey` | `WarTurnState` opaque | OPAQUE |
| Auto-oblężenia (E13) | stan wojny, kandydaci | `diplomacy_siege_war_gate.rs:229` (kandydat); wejście `cities`/jednostek z PlayableState | CZĘŚCIOWO (kandydat, bez pętli skanu) |

## (5) PODZIAŁ r7 — klocki z kolejnością, zależnościami i ryzykiem

Zasada: każdy klocek to osobny temat R-RUSTPORT-P6-WIRE-WAR-R7-<ID>, z allowlistą i bramkami. Ryzyko: N (niskie), S (średnie), W (wysokie). Zasada „nie pisać od zera”: klocek najpierw WPINA istniejącą funkcję (wskazaną w tabeli (2)); nowa logika tylko tam, gdzie tabela (2) podaje BRAK funkcji.

| Klocek | Zakres (wpięcie, nie nowa logika, chyba że wskazano) | Zależy od | Pytanie Q | Ryzyko | Uwagi |
|---|---|---|---|---|---|
| R7-K1 | Wpięcie fazy Economy w `playable.rs` (handler `TurnPhase::Economy`): wpięcie `run_economy_tick_for_game_with_food` (`turn_economy_wire.rs:246`) z `advance_city_economy`, `run_empire_food_block`, `apply_army_starvation_hp_loss`; pole zapasu żywności w `PlayableCity` | W8-INTEG (B13) | Q2 | W | Bez decyzji Q2 (kolejność głodu i kapitulacji, B1) nie startować |
| R7-K2 | Oblężenie: wpięcie `handle_siege_capitulation_phase` (`siege_surrender.rs:115`) + `resolve_surrender_path` (`:167`) + `apply_transfer_with_effects` (`siege_transfer.rs:281`) w fazie Economy po K1; typowany model oblężenia z `WarTurnState` opaque; pole HP w `PlayableUnit` (zmiana zapisu: `serde(default)`) | R7-K1 | Q2 | W | Atrycja HP wymaga pola HP w `PlayableUnit` |
| R7-K3 | Tick oblężenia po maszynach: wpięcie `maybeAiAssaultAfterMachines` (pin :18126 → Rust: NOWA funkcja `decide_ai_siege_stance`, bo brak portu po nazwie), `tickSiegeMachinesForCity` (port anulowania legacy kolejki: NOWA funkcja, mała), pętla `scanAutoSiegesAfterAiTurn` (wpięcie `auto_siege_candidate_for_scan`, `diplomacy_siege_war_gate.rs:229`) | R7-K2 | Q2 (kolejność w turze oblężenia) | W | Powiązane z tematem Siege #217 (pętla taktyczna) |
| R7-K4 | Efekty deklaracji wojny z hamulca i z pętli AI: wpięcie skutków `declarations` z `run_brake_phase` (`turn_war_pipeline.rs:372`) przez `declare_war` (`diplomacy_truce_flow.rs:239`), `zarejestruj_wypowiedzenie` (`diplomacy_aggressor.rs:309`), `treaties_broken_by_war` (`alliance_war_obligation.rs:251`) oraz `finalize_peace_between` / `cleanup_regular_war_on_peace` (`war_turn_declare.rs:361`, `:325`); zmiana kontraktu `run_war_turn` (`declarations` → efekty) | W8-INTEG (B13) | Q3 | S | Zmienia zachowanie Diplomacy(2); nie pisać od zera |
| R7-K5 | Wpięcie AI-AI w fazie Ai(5): `run_ai_ai_peace_turn` (`war_turn_ai_ai.rs:84`) i `run_ai_ai_weariness_turn` (`war_turn_ai_ai.rs:168`) | R7-K1 (kolejność), producent `aiAiPeaceRequestByPairKey` | Q1 | S | Bez producenta stanu pokoju AI-AI będzie błąd |
| R7-K6 | Rebelia i prawo po przejęciu: wpięcie `tick_rebel_protection_end_of_turn` (`order_effects_lane.rs:171`), `update_revolt_grace` (`society_breakdown/order.rs:305`), `mark_city_rebellion_started` (`order_effects_lane.rs:141`), `tick_post_capture_law_end_of_turn` (`order_effects_lane.rs:157`); pola rebelii w `PlayableCity`; kolejność przed produkcją tego samego miasta (B5) | R7-K2 (przejęcie) | Q4 | S/W | Wymaga pól w `PlayableCity` |
| R7-K7 | Pozostałe kroki D1-D6 w `run_war_turn`: wpięcie `build_cyclic_resource_transfers` (`diplomacy.rs:2620`, D3), `truce_expiry_action` (`diplomacy_truce.rs:199`, D5), `dobra_wola` gałęzi bez hamulca (`tickDobraWolaOnRelation`, D7); NOWA logika tylko dla D1, D2, D4, D6 (brak funkcji po nazwie) | W8-INTEG (B13) | brak (decyzje techniczne) | S | Niezależne od K1-K6; D7 gałąź hamulca już WPIĘTA |
| R7-K8 | Kultura i religia miast: wpięcie `tick_city_culture_religion` (`state.rs:736`), wejścia religii | R7-K1 | brak (decyzje techniczne) | S | Niezależne od oblężeń |

Kolejność zalecana: W8-INTEG (B13) → równolegle R7-K4, R7-K7 i R7-K8 → R7-K1 → R7-K2 → R7-K3 oraz R7-K5 po K1 → R7-K6 po K2. Decyzje ABC przed startem K1/K2/K3 (Q2, kolejność głodu i kapitulacji, B1) i przed K4 (Q3, efekty wojny, B2). Pytanie Q1 przed K5, Q4 przed K6.

## (6) Pytania o GAMEPLAY do właściciela (wynikające z różnic kolejności)

Tylko gameplay; decyzje techniczne są rekomendacjami w (5).

- Q1 (B3, B4): Czy dyplomacja AI i pokój AI-AI mają być rozstrzygane po ekonomii i oblężeniach, jak na pinie (E13), czy na początku tury, zgodnie z kolejnością Rust? Rekomendacja: zgodnie z pinem (parytet z web jako punkt odniesienia). Dotyczy R7-K5.
- Q2 (B1, B6): Czy kapitulacja głodowa oblężenia ma następować w tej samej turze, po zerowaniu zapasów ekonomii, jak na pinie (E5 → E7), i czy szturm po maszynach (E7 :38873) ma być w tej samej turze? Rekomendacja: tak, jak na pinie. Dotyczy R7-K1, R7-K2, R7-K3.
- Q3 (B2): Czy wojna wypowiedziana przez hamulec ma działać już w tej turze, przed ekonomią i ruchami AI (jak pin D8)? Rekomendacja: tak, jak na pinie. Dotyczy R7-K4.
- Q4 (B5): Czy rebelia miasta w tej turze ma wpływać na produkcję tej samej tury (pin: rebelia przed produkcją tego samego miasta, :39515 przed :39731), czy dopiero od następnej tury (kolejność Rust: Production(4) bez fazy rebelii)? Rekomendacja: zgodnie z pinem. Dotyczy R7-K6.

## Bramki

- `git diff --check` (przed commitem): czysto.
- `git diff --stat 46c42deab..HEAD`: tylko pliki dokumentacyjne, bez `.rs`.
- Brak `gra/`, brak `Cargo.lock`, brak zmian `origin/main`, brak zmian `WERSJE.md`.
- Cargo nie uruchamiane (temat dokumentacyjny, brak zmian `.rs`).
