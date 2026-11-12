# P6-W8-R7-AUDYT — kolejność tury: pin web vs Rust (fazy Oblężenie / AI / głód / rebelia)

Temat: R-RUSTPORT-P6-WIRE-WAR-R7-AUDYT-Q1 (runda 1, Operator, temat dokumentacyjny).
Baza: `46c42deab` (= origin/rust-port/parity-v2 po INTEG-B12). Linia W8 NIE jest na bazie (jest w INTEG-B13);
czytana z `origin/rust-port-wip/WIRE-WAR-STORES-fc` = `9164ab7d7` przez `git show`.
Pin web (tylko odczyt): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, plik `gra/src/main.ts` (47448 linii).

Oznaczenia statusu: PORT = funkcja Rust istnieje; WPIETE = wołana z produkcyjnej ścieżki tury;
BRAK = nie wołana z produkcyjnej ścieżki (tylko testy lub brak funkcji); NIE_ZMIERZONO = nie sprawdzono.

Stan faktyczny (zweryfikowany grepem):
- `TurnPhase` (`events.rs:44`) ma 9 faz: StartTurn=0, PlayerActions=1, Diplomacy=2, Economy=3, Production=4, Ai=5, Barbarians=6, Victory=7, EndTurn=8.
- W linii W8 (`9164ab7d7`) jedyna produkcyjna obsługa fazy to `run_diplomacy_war_phase` (`playable.rs:636` wywołanie w pętli kolejki, `playable.rs:665` definicja), wołająca `run_war_turn` (`turn_war_pipeline.rs:233`). Żadna inna faza (Economy, Production, Ai, Barbarians, Victory, EndTurn) nie ma handlera w `playable.rs` (grep: brak `TurnPhase::Economy =>`, `TurnPhase::Ai =>` poza mapowaniem zdarzeń).
- Funkcje oblężenia, głodu, AI-AI pokoju i zmęczenia wojną istnieją w Rust, ale ich jedynymi wywołaniami są testy (`siege_surrender.rs` moduł testów, `siege_turn.rs` testy, `war_turn_ai_ai.rs`). `WarTurnState` trzyma stan oblężenia tylko jako surowy JSON (`siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey`, `war_turn_state.rs:82-84`); typowanego modelu nie ma.

## (1) Kolejność faz tury na pinie (`gra/src/main.ts`)

Funkcja końca tury na pinie to `runWorldEndTurn(humanOwnerId)` (`main.ts:38130`, koniec `:43587`). Nie ma w pinie funkcji o nazwie `advanceTurn`; `endActiveHumanTurn` (`:43587`) i `advanceSeat` (`:43815`) przekazują sterowanie. Kolejność kroków wewnątrz `runWorldEndTurn`:

| Krok | Pin (plik:linia) | Opis |
|---|---|---|
| E0 | main.ts:38132-38142 | WORLD_START, czyszczenie flag buntu, `evictForeignUnitsFromCityHexes`, `sweepFortCaptures` (:38139), `healInconsistentUnits` (:38142) |
| E1 | main.ts:38143-38156 | reset ruchu jednostek, `turn++` (:38156) |
| E2 | main.ts:38157-38192 | czyszczenie logów zdarzeń, `sweepLegacyFarmsOnForest`, `expireInformationalEventsBeforeTurn` |
| E3 | main.ts:38200-38205 | rotacyjny autozapis (nie zmienia stanu gry) |
| E4 | main.ts:38209-38217 | faza DYPLOMACJI: `runDiplomacyTurnTick()` (wywołanie :38214, definicja :24229) |
| E5 | main.ts:38219-38600 | faza EKONOMII: `advanceCityEconomy` (:38356), `advanceEmpireFood` (:38569), `applyArmyStarvationHpLoss` (:38603) i sprzątanie oblężeń po głodzie (:38624-38647, `endMapSiege`) |
| E6 | main.ts:38683-38956 | sumy ekonomii gracza i AI, utrzymanie z skarbca (:38902) |
| E7 | main.ts:38820-38878 | OBLĘŻENIA: atrycja garnizonu głodowego (`siegeDefenderUnits` :38825, `siegeStarvationState` :38833, `applyArmyStarvationHpLoss` wariant oblężniczy :38844), kapitulacja: `handleSiegeCapitulationPhase` (:38865, gdy brak garnizonu) albo `resolveSiegeSurrender` (:38867); licznik tur oblężenia (:38870-38871); `tickSiegeMachinesForCity` (:38872); `maybeAiAssaultAfterMachines` (:38873) |
| E8 | main.ts:39131-39175 | bramka złota: `applyGoldDeficitHpLoss` (:39131), sprzątanie oblężeń (:39166-39175) |
| E9 | main.ts:39276 | kultura i religia miast: `tickCityCultureReligion` |
| E10 | main.ts:39515 | REBELIE (pętla miast): `tickRebelProtectionEndOfTurn` (:39515); odliczanie buntu `updateRevoltGrace` (:39552); start buntu tylko dla miast człowieka: `markCityRebellionStarted` (:39564), komunikat (:39572) |
| E11 | main.ts:39637 | `tickPostCaptureLawEndOfTurn` (prawo po przejęciu) |
| E12 | main.ts:39800-40100 | produkcja i rekrutacja miast (poza zakresem audytu, nie analizowane szczegółowo) |
| E13 | main.ts:40352-43049 | FAZA AI: `runAiPhase` (:40367). Wewnątrz: decyzje ekonomii AI (:40858), dyplomacja per właściciel `tickDiplomacy` (:41361), rejestracja prośby pokoju AI-AI (:42088), pauza przy bitwie (:42644-42660), potem `tickAiAiPeaceRequests(aiTurnAwaitingBattle)` (:43035, definicja :35846, `runAiAiPeaceTick` :35849), `tickAiAiWarWeariness` (:43041, definicja :35908), `scanAutoSiegesAfterAiTurn` (:43046, definicja :18040) |
| E14 | main.ts:43441-43502 | zwycięstwo: `checkVictory` (:43481), ekran zwycięstwa |
| E15 | main.ts:43587+ | koniec tury człowieka: `endActiveHumanTurn`, `advanceSeat` (:43815) |

Krok `runDiplomacyTurnTick` (main.ts:24229-~24330), kolejność wewnętrzna:
D1 `expireTreaties` (:24231) → D2 wygasłe traktaty, finisz wiarygodności (:24233-24270) → D3 `tickCyclicResourceTradeDeals` (:24271) → D4 `updateWiarygodnoscStreamsThisTurn` (:24272), `tickWiarygodnoscBezWojnyMilestone` (:24273) → D5 `tickTruceExpiries` (:24274) → D6 `tickDiplomacyPayments` (:24277) i zerwania za daninę (:24278-24298) → D7 dobra wola (:24300-24320) → D8 hamulec wojny: `tickDiploAiAiPairsWithBrake` (:24323, definicja :11734), kryzys par gracz-AI `diploBrakeCrisisStep` (:24327).
Konsekwencje hamulca: `zarejestrujWypowiedzenie(declarer, turn, 'hamulec')` (:11713) i komunikat (:11715). Deklaracja wojny i rozrywanie traktatów: `ownerDeclareWarOn` (:13197), `breakTreatiesOnWar` (:23688), `cleanupRegularWarOnPeace` (:11884), `finalizePeaceTreatyBetween` (:11911).

Uwaga o rozdzieleniu: na pinie hamulec i jego konsekwencje (D8) są wykonywane na początku tury, przed ekonomią (E5) i oblężeniami (E7); dyplomacja AI per właściciel (E13, :41361) jest dopiero po zakończeniu ekonomii i oblężeń.

## (2) Tabela: krok pinu → funkcja Rust (plik:linia) → status wpięcia

Linia odniesienia: `run_war_turn` na W8 (`9164ab7d7`); funkcje spoza W8 wskazane na bazie (`46c42deab`), gdzie są identyczne.

| Krok pinu | Funkcja Rust (plik:linia) | Status wpięcia w `run_war_turn` (W8) |
|---|---|---|
| E0 / E1 (start, turn++) | `PlayableGame::advance_turn` `playable.rs:565` (base); licznik tury, reset ruchu | PORT częściowy: turn++ i reset ruchu tak; `sweepFortCaptures`, `healInconsistentUnits`, `evictForeignUnitsFromCityHexes`: BRAK |
| D1-D2 `expireTreaties`, finisz wiarygodności | NIE_ZMIERZONO odpowiednika w pipeline (moduły `diplomacy_truce_flow.rs`, `diplomacy_truce_end.rs` istnieją na bazie) | BRAK w `run_war_turn` |
| D3 `tickCyclicResourceTradeDeals` | NIE_ZMIERZONO (brak funkcji o tej nazwie w grepie; handel w `diplomacy_*`) | BRAK |
| D4 wiarygodność | NIE_ZMIERZONO | BRAK |
| D5 `tickTruceExpiries` | `diplomacy_truce_flow.rs` (moduł istnieje; funkcja NIE_ZMIERZONO) | BRAK |
| D6 `tickDiplomacyPayments` | NIE_ZMIERZONO | BRAK |
| D7 dobra wola | NIE_ZMIERZONO (flagi `dobraWolaAktywna`/`wspolnyWrog` tylko jako wejście, `turn_war_inputs`) | BRAK w pipeline |
| D8 hamulec: `tickDiploAiAiPairsWithBrake` (:11734) | `run_brake_phase` `ai_diplomacy_turn.rs:154`, wołane z `run_war_turn` krok 5 `turn_war_pipeline.rs:358-372` | WPIETE (W8 r3) |
| D8 relacja par (web `tickDiplomacy`/relacje) | `tick_pairs_relation_scores` `ai_diplomacy_turn.rs:104`, wołane `turn_war_pipeline.rs:351` | WPIETE (W8 r3) |
| D8 bramka R1/R2 | `gate_blocked_set` `turn_war_pipeline.rs:335`, licznik `turn_war_pipeline.rs:311-318` | WPIETE (W8 r3) |
| D8 konsekwencje: `zarejestrujWypowiedzenie` (:11713), `ownerDeclareWarOn` (:13197) | `diplomacy_truce_flow.rs:239` `declare_war` (base); W8 zwraca tylko `declarations` (`turn_war_pipeline.rs` nagłówek: efekty NIE są stosowane) | BRAK (efekty deklaracji nie wpięte) |
| D8 `breakTreatiesOnWar` (:23688), `cleanupRegularWarOnPeace` (:11884), `finalizePeaceTreatyBetween` (:11911) | NIE_ZMIERZONO (`declare_war_after_truce` `diplomacy_truce_flow.rs:320` to inny przypadek) | BRAK |
| E5 `advanceCityEconomy` (:38356) | `advance_city_economy` `turn_economy_tick.rs:270` (base) | PORT (funkcja), BRAK wpięcia: brak handlera fazy Economy; `PlayableCity` nie ma zapasu żywności |
| E5 `advanceEmpireFood` (:38569) | `advance_empire_food` `city_growth.rs:2246` (base) | PORT (funkcja), BRAK wpięcia |
| E5 `applyArmyStarvationHpLoss` (:38603) | `apply_army_starvation_hp_loss` `turn_economy_attrition.rs:54` (base) | PORT (funkcja), BRAK wpięcia |
| E5 sprzątanie oblężeń po głodzie (:38624-38647) | `end_map_siege_fields` `siege_surrender.rs:206` (funkcja pola, nie pętla) | BRAK |
| E7 `siegeDefenderUnits` / `siegeStarvationState` (:38825, :38833) | `siege_turn::siege_city_turn` `siege_turn.rs:69` (decyzja), `starvation_food` `siege_turn.rs:47` | PORT (funkcje), BRAK wpięcia: tylko testy |
| E7 `handleSiegeCapitulationPhase` (:17646, wywołanie :38865) | `handle_siege_capitulation_phase` `siege_surrender.rs:117` | PORT, BRAK wpięcia (tylko testy modułu) |
| E7 `resolveSiegeSurrender` (:17662, wywołanie :38867) | `resolve_surrender_path` `siege_surrender.rs:169`; skutki przejęcia `apply_transfer_with_effects` `siege_transfer.rs:328` | PORT (funkcje), BRAK wpięcia |
| E7 licznik `siegeT` i `tickSiegeMachinesForCity` (:38870-38872, def :18328) | NIE_ZMIERZONO (brak funkcji o tej nazwie w grepie bazy) | BRAK |
| E7 `maybeAiAssaultAfterMachines` (:38873, def :18126) | NIE_ZMIERZONO (`diplomacy_siege_war_gate.rs:229` `auto_siege_candidate_for_scan` to inny element) | BRAK |
| E7 atrycja HP garnizonu | BRAK danych: `PlayableUnit` nie ma pola HP (`playable.rs`, struktura `PlayableUnit` na W8) | BRAK |
| E8 `applyGoldDeficitHpLoss` (:39131) | `apply_gold_deficit_hp_loss` `turn_economy.rs:676` (base) | PORT (funkcja), BRAK wpięcia |
| E9 `tickCityCultureReligion` (:39276) | `tick_city_culture_religion` `state.rs:736` (base) | PORT (funkcja), BRAK wpięcia |
| E10 `tickRebelProtectionEndOfTurn` (:39515) | `tick_rebel_protection_end_of_turn` `order_effects_lane.rs:171` | PORT (funkcja), BRAK wpięcia; `PlayableCity` nie ma pól rebelii |
| E10 `updateRevoltGrace` (:39552) | `update_revolt_grace` `society_breakdown/order.rs:305` | PORT (funkcja), BRAK wpięcia |
| E10 `markCityRebellionStarted` (:39564) | `mark_city_rebellion_started` `order_effects_lane.rs:141` | PORT (funkcja), BRAK wpięcia |
| E11 `tickPostCaptureLawEndOfTurn` (:39637) | `tick_post_capture_law_end_of_turn` `order_effects_lane.rs:157` | PORT (funkcja), BRAK wpięcia |
| E13 `tickDiplomacy` per AI (:41361) | NIE_ZMIERZONO bezpośredniego odpowiednika; relacje par są w `tick_pairs_relation_scores` (D8) | BRAK jako osobny krok |
| E13 `tickAiAiPeaceRequests` (:43035, `runAiAiPeaceTick` :35849) | `run_ai_ai_peace_turn` `war_turn_ai_ai.rs:84` | PORT (funkcja), BRAK wpięcia (tylko testy) |
| E13 `tickAiAiWarWeariness` (:43041, def :35908) | `run_ai_ai_weariness_turn` `war_turn_ai_ai.rs:168` | PORT (funkcja), BRAK wpięcia |
| E13 `scanAutoSiegesAfterAiTurn` (:43046, def :18040) | `auto_siege_candidate_for_scan` `diplomacy_siege_war_gate.rs:229` (kandydat, bez pętli skanu) | CZĘŚCIOWO (kandydat), BRAK pętli |
| E14 `checkVictory` (:43441-43481) | NIE_ZMIERZONO (brak funkcji o nazwie `check_victory` w bazie) | BRAK / NIE_ZMIERZONO |
| Faza Economy/Production/Ai/Barbarians w Rust (`playable.rs`) | brak handlera fazy | BRAK (kolejka tylko zdarzenia, `event_for_phase` `playable.rs:687-695`) |

Wniosek jawny: z pinu do `run_war_turn` wpięte są wyłącznie krok D8 (hamulec, relacje, bramka R1/R2). Wszystkie kroki oblężenia, głodu, rebelii i AI-AI mają port funkcji (większość), ale nie są wołane z produkcyjnej ścieżki.

## (3) Kolejność Rust (wariant B) i ROZNICE B

Kolejność Rust (`events.rs:44`, `TurnPhase`): StartTurn(0) → PlayerActions(1) → Diplomacy(2) → Economy(3) → Production(4) → Ai(5) → Barbarians(6) → Victory(7) → EndTurn(8).

Pin: E0-E1 → E4 Dyplomacja (D1-D8) → E5-E8 Ekonomia i oblężenia → E9-E11 kultura, rebelie, prawo po przejęciu → E12 produkcja → E13 AI (dyplomacja AI, AI-AI pokój, zmęczenie, auto-oblężenia) → E14 zwycięstwo → E15.

| ID | Różnica | Konsekwencja |
|---|---|---|
| ROZNICA B1 | Pin: atrycja i kapitulacja oblężeń (E7) następują po ekonomii (E5) w tej samej turze. Rust: oblężenia nie mają fazy; ich naturalne miejsce wg kolejności Rust to Economy(3), po Diplomacy(2), więc porządek względny z ekonomią jest zachowany tylko jeśli wpięcie będzie w Economy(3) | Kapitulacja z głodu na zapasach po ekonomii wymaga wpięcia w Economy(3), nie w Diplomacy(2) |
| ROZNICA B2 | Pin: konsekwencje hamulca (zerwanie, wojna) w D8 przed ekonomią i AI. Rust: W8 zwraca `declarations`, bez skutków w Diplomacy(2) | Wojna z hamulca nie działa w tej turze dla Economy/Ai; wpięcie efektów zmienia kolejność względem pinu |
| ROZNICA B3 | Pin: dyplomacja AI per właściciel (E13, :41361) po ekonomii i oblężeniach. Rust: wszystkie relacje w Diplomacy(2) | AI widzi stan dyplomacji sprzed ekonomii; pin widzi po ekonomii i po kapitulacjach |
| ROZNICA B4 | Pin: AI-AI pokój i zmęczenie (E13, :43035-43041) po ruchach AI. Rust: `Ai(5)` bez handlera | Pokój AI-AI zawarty w tej turze wpływa na ruchy AI w pinie; w Rust (po wpięciu w Ai(5)) byłby zgodny z kolejnością Rust, nie pinu |
| ROZNICA B5 | Pin: rebelie i prawo po przejęciu (E10-E11) przed produkcją i AI. Rust: Production(4) przed Ai(5), rebelie bez fazy | Miasto, które zbuntowało się w turze, w pinie nie produkuje w tej turze w tym samym stanie; kolejność Rust różni się |
| ROZNICA B6 | Pin: zwycięstwo (E14) po AI. Rust: Victory(7) po Barbarians(6) | Zgodne co do pozycji po AI; różni się brakiem fazy Barbarians na pinie (NIE_ZMIERZONO, czy pin ma barbarzyńców w tej pętli) |
| ROZNICA B7 | Pin: `turn++` (E1) przed dyplomacją. Rust: `turn` zwiększany w `advance_turn` przed kolejką faz | Zgodne |

## (4) Wejścia brakujące dla każdej fazy

| Faza | Wejście | Źródło w PlayableState | Status |
|---|---|---|---|
| Diplomacy (D8) | epoki wszystkich właścicieli | `turn_war_epoch` (W8 r6); AI bez wpisu = `gameStartEra()` | PRODUKOWANE (W8) |
| Diplomacy (D8) | moc obiektywna (`objectivePowerForOwner`) | `power_raw_for_owner` `turn_war_inputs.rs:208` (W8) | PRODUKOWANE, z wyjątkiem składników infra/tech/religia (błąd STRICT, `PowerComponentsMissing`) |
| Diplomacy (D8) | blokady pokoju (`forcedEraPeaceUntilNextEraByPairKey`, `diplomacyPairMeta`) | `peace_locks_from_war` `turn_war_inputs.rs:438` (surowe z `WarTurnState.opaque`) | PRODUKOWANE |
| Diplomacy (D8) | wspólna granica | `PlayableCity`/mapa | PRODUKOWANE (W8 r6 klocek 2) |
| Diplomacy (D8) | kontakty `diplomaticContactEstablished` / `diplomaticallyDiscoveredOwners` | `WarTurnState` opaque | PRODUKOWANE |
| Diplomacy (D1-D7) | traktaty, handel, płatności, dobra wola, wiarygodność | `activeDeals`, `diplomacyDeals`, `diplomacyPairMeta` | BRAK w pipeline (dane w `DiplomacyState`/opaque, bez wpięcia) |
| Economy (E5) | zapasy żywności miast, głód państwa | `PlayableCity`: brak pola zapasu żywności | BRAK |
| Economy (E5) | budynki, tech, religia do ekonomii | `buildings_by_city`, `researched_techs_by_owner` istnieją; ekonomia nie jest wołana | CZĘŚCIOWO (dane są, brak wywołania) |
| Oblężenie (E7) | stan oblężenia per miasto (tura oblężenia, oblegający, stan AI) | `WarTurnState` opaque: `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey` | OPAQUE, brak typowanego modelu |
| Oblężenie (E7) | HP jednostek garnizonu i oblegających | `PlayableUnit` bez pola HP | BRAK |
| Oblężenie (E7) | magazyn po turze (`magazyn_po_turze`) | `PlayableStores` (magazyny, W8 STORES) | CZĘŚCIOWO (magazyny są, pole zapasu oblężenia NIE_ZMIERZONO) |
| Oblężenie (E7) | garnizon (`siegeDefenderUnits`) | `PlayableUnit` ma `owner_id`, `position`, brak `inGarnizon`/`oblegaCityId` | BRAK pól |
| Głód armii (E5, E7) | licznik karencji głodu wojska, `isArmyStarving` | brak w PlayableState | BRAK |
| Złoto/deficyt (E8) | skarbiec, deficyt, licznik | `PlayableState` nie ma skarbca w tej partii (NIE_ZMIERZONO) | BRAK / NIE_ZMIERZONO |
| Efekty deklaracji wojny | stan traktatów, sojuszy, `casusBelliUntilByPair`, `aggressorFlagUntilByOwner` | `WarTurnState` opaque | OPAQUE; efekty BRAK |
| Rebelia (E10) | `rebelState`, `rebelPreviousOwnerId`, `rebelProtectionTurnsRemaining`, `revoltGraceRemaining` | `PlayableCity` bez tych pól | BRAK |
| Kultura/religia (E9) | kultura, religia miast | `PlayableCity.culture` (W8 r6) istnieje; religia BRAK | CZĘŚCIOWO |
| AI-AI pokój (E13) | `aiAiPeaceRequestByPairKey` | `WarTurnState` opaque | OPAQUE; producent BRAK w tej partii |
| AI-AI zmęczenie (E13) | `warWearinessByPairKey` | `WarTurnState` opaque | OPAQUE |
| Auto-oblężenia (E13) | stan wojny, kandydaci | `diplomacy_siege_war_gate.rs:229` | NIE_ZMIERZONO pełnego wejścia |

## (5) PODZIAL r7 — klocki z kolejnością, zależnościami i ryzykiem

Zasada: każdy klocek to osobny temat R-RUSTPORT-P6-WIRE-WAR-R7-<ID>, z allowlistą i bramkami. Rekomendacja ryzyka: N (niskie), S (średnie), W (wysokie).

| Klocek | Zakres | Zależy od | Ryzyko | Uwagi |
|---|---|---|---|---|
| R7-K1 | Wpięcie fazy Economy w `playable.rs` (handler `TurnPhase::Economy`): `advance_city_economy`, `advance_empire_food`, `apply_army_starvation_hp_loss`; wymaga pola zapasu żywności w `PlayableCity` | W8-INTEG (B13) | W | Bez decyzji ABC-2 (kolejność głodu) nie startować |
| R7-K2 | Oblężenie: `handle_siege_capitulation_phase` + `resolve_surrender_path` + `apply_transfer_with_effects` w fazie Economy po K1; typowany model oblężenia z `WarTurnState` opaque | R7-K1, pole HP w `PlayableUnit` | W | Pole HP w `PlayableUnit` to zmiana zapisu (wymaga migracji `serde(default)`) |
| R7-K3 | Tick maszyn oblężniczych, `maybeAiAssaultAfterMachines`, pętla `scanAutoSiegesAfterAiTurn` (kandydaci `auto_siege_candidate_for_scan`) | R7-K2 | W | Powiązane z tematem Siege #217 (pętla taktyczna) |
| R7-K4 | Efekty deklaracji wojny z hamulca: `declare_war` (`diplomacy_truce_flow.rs:239`), `breakTreatiesOnWar`, `zarejestrujWypowiedzenie`; zmiana kontraktu `run_war_turn` (`declarations` → efekty) | W8-INTEG (B13) | S | Niezależne od K1; zmienia zachowanie Diplomacy(2) |
| R7-K5 | Wpięcie AI-AI: `run_ai_ai_peace_turn` i `run_ai_ai_weariness_turn` w fazie Ai(5) (zgodnie z kolejnością Rust, B4) | R7-K1 (kolejność), producent `aiAiPeaceRequestByPairKey` | S | Bez producenta stanu pokoju AI-AI będzie błąd |
| R7-K6 | Rebelia i prawo po przejęciu: `tick_rebel_protection_end_of_turn`, `update_revolt_grace`, `mark_city_rebellion_started`, `tick_post_capture_law_end_of_turn`; pola rebelii w `PlayableCity` | R7-K2 (przejęcie) | S/W | Wymaga pól w `PlayableCity` |
| R7-K7 | Pozostałe kroki D1-D7 (wygaśnięcia traktatów, płatności, handel, dobra wola, wiarygodność) w `run_war_turn` | W8-INTEG (B13) | S | Niezależne od K1-K6 |
| R7-K8 | Kultura i religia miast (`tick_city_culture_religion`), wejścia religii | R7-K1 | S | Niezależne od oblężeń |

Kolejność zalecana: W8-INTEG (B13) → równolegle R7-K4, R7-K7 i R7-K8 → R7-K1 → R7-K2 → R7-K3 oraz R7-K5 po K1 → R7-K6 po K2. Decyzje ABC przed startem K1 (kolejność głodu, B1) i przed K4 (efekty wojny, B2).

## (6) Pytania o GAMEPLAY do właściciela (wynikające z różnic kolejności)

Tylko gameplay; decyzje techniczne są rekomendacjami w (5).

- Q1 (B3, B4): Czy dyplomacja AI i pokój AI-AI mają być rozstrzygane po ekonomii i oblężeniach, jak na pinie (E13), czy na początku tury, zgodnie z kolejnością Rust? Rekomendacja: zgodnie z pinem (parytet z web jako punkt odniesienia).
- Q2 (B1): Czy kapitulacja głodowa oblężenia ma następować w tej samej turze, po zerowaniu zapasów ekonomii, jak na pinie (E5 → E7)? Rekomendacja: tak, jak na pinie.
- Q3 (B2): Czy wojna wypowiedziana przez hamulec ma działać już w tej turze, przed ekonomią i ruchami AI (jak pin D8)? Rekomendacja: tak, jak na pinie.
- Q4 (B5): Czy rebelia miasta w tej turze ma wpływać na produkcję tej samej tury (kolejność Rust) czy dopiero od następnej tury (pin E10 przed produkcją E12)? Rekomendacja: zgodnie z pinem.

## Bramki

- `git diff --check`: sprawdzane w 01-operator-r1.md.
- `git diff --stat`: tylko pliki dokumentacyjne, bez `.rs`.
- Brak `gra/`, brak `Cargo.lock`, brak zmian `origin/main`.
