STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-R7-AUDYT-Q1
GOAL: obrona Operatora po Evaluatorze r1 (FAIL, 02-evaluator.md): odpowiedź na zarzuty Z1-Z5, poprawka dokumentu P6-W8-R7-AUDYT.md
ZMIANY/COMMIT: dyspozycje/rust-port/p6/P6-W8-R7-AUDYT.md (przepisany, r2), dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-R7-AUDYT-Q1/02a-obrona.md (nowy). Baza zmian: 14e1b908f (Evaluator r1). Commit: SHA w sekcji SHA poniżej. Zero plików .rs, zero gra/, zero Cargo.*.
TESTY: git diff --check = czysto. git diff --stat 46c42deab..HEAD: tylko pliki dokumentacyjne (bez .rs). Cargo nie uruchamiane (temat dokumentacyjny).
BLOKADY: brak. Dane weryfikowane na pinie 07d2fbd72 (gra/src/main.ts, odczyt przez git show) i na 46c42deab / 9164ab7d7 (git grep, git show).
RUNDY: 2/5 (Operator, obrona r1)
NASTĘPNY KROK: Evaluator r2 (to samo ID) weryfikuje tabelę (1), (2), ROZNICE B i podział (5); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny w worktree, bez push, bez integracji).

## Odpowiedzi na zarzuty

### Z1 (kryt. 1): brak fazy barbarzyńców na pinie — PRZYJMUJĘ
Dowód: pin `main.ts:43062` (sweepFortCaptures po fazie AI), blok BARBARIANS `:43065-43434` (`setTurnTransition(94)` :43067, `barbariansActive` :43081, `spawnCamps` :43095, `tickCamps` :43137, `decideBarbarianMoves` :43266, `sweepFortCaptures` :43428), VICTORY `:43436`. Zarzut słuszny: r1 pominął ten blok i błędnie napisał NIE_ZMIERZONO w ROZNICA B6.
Poprawka: nowy krok E13b w tabeli (1); wiersze barbarzyńców w tabeli (2); ROZNICA B6 przepisana (pozycja zgodna, brak handlera i stanu obozów w Rust); wiersz w tabeli (4) „Barbarzyńcy”; klocek K-barbarzyńców nie został dodany (poza zakresem zarzutu, patrz Z5).

### Z2 (kryt. 2): NIE_ZMIERZONO/BRAK tam, gdzie odpowiednik jest w repo — PRZYJMUJĘ (z korektami)
Zweryfikowane `git grep` na 46c42deab (definicje) i 9164ab7d7 (wołający w `turn_war_pipeline.rs`):
- `cleanupRegularWarOnPeace` (:11884) → `cleanup_regular_war_on_peace` `war_turn_declare.rs:325`. Wołane z `finalize_peace_between` `war_turn_declare.rs:375`.
- `finalizePeaceTreatyBetween` (:11911) → `finalize_peace_between` `war_turn_declare.rs:361` oraz `diplomacy_truce_flow.rs:116`.
- `breakTreatiesOnWar` (:23688) → `treaties_broken_by_war` `alliance_war_obligation.rs:251` (zwraca listę, nie zrywa; BRAK w pipeline).
- `tickTruceExpiries` (:12122) → `truce_expiry_action` `diplomacy_truce.rs:199` (wołane z `diplomacy_truce_end.rs:228`).
- `tickCyclicResourceTradeDeals` (:24077) → `build_cyclic_resource_transfers` `diplomacy.rs:2620` (wołane z `diplomacy.rs:3600`, `:3686`).
- dobra wola (D7) → `dobra_wola_turn_step` `diplomacy_tick_war_brake.rs:350`. KOREKTA WŁASNA: ten krok JEST wołany z W8 przez `run_brake_phase` krok 1 (`ai_diplomacy_turn.rs:178`, wołane `turn_war_pipeline.rs:372`). Status D7 w tabeli: WPIETE częściowo (gałąź `brakeOn`); gałąź bez hamulca BRAK.
- `zarejestrujWypowiedzenie` (:11713) → `zarejestruj_wypowiedzenie` `diplomacy_aggressor.rs:309` (r1 cytował tylko `declare_war`; poprawione).
- `ownerDeclareWarOn` (:13197) → `declare_war` `diplomacy_truce_flow.rs:239` (już w r1).
- `declare_forced_wars` `war_turn_declare.rs:105`, `register_regular_war_city_loss` `war_turn_declare.rs:385`, `forced_war_step` `war_turn_forced.rs:231`. Moduły W4 `war_turn_declare.rs` i `war_turn_forced.rs` są teraz w tabeli (2) i w (5).
- `checkVictory` (:43481, import :1366) → def `gra/src/game/victory.ts:228` (potwierdzone na pinie). Rust: NIE MA funkcji `check_victory`/`victory` w `engine/src` (grep); są tylko `victory_mode` (`playable.rs:59`, :78), `victory_power_and_dominance_default` (`data/economy_society_part2.rs:177-178`) i etykieta `VictoryCheck` (`events.rs:59`, :185). Status: BRAK portu (nie NIE_ZMIERZONO).
- `tickSiegeMachinesForCity` (:38872): przeczytano ciało `main.ts:18328-18332`. KOREKTA: ciało to wyłącznie `cancelUnpaidLegacySiegeMachineQueue(city)` (anulowanie legacy kolejki bez pokrycia), nie tick. Rust: brak odpowiednika po nazwie; kolejka i kwoty w `siege_engine_build.rs:117-132`; status BRAK.
- `maybeAiAssaultAfterMachines` (:38873, def :18126): przeczytano ciało `:18126-18140`; woła `decideAISiegeStance` (:18135). Rust: brak funkcji `decide_ai_siege_stance` (grep). Najbliższe: `siege_turn.rs:69` (składa decyzję N3 bloku i wprost zostawia szturm wołającemu, `siege_turn.rs:9-12`), `siege_sortie.rs`, `siege_enter_city.rs`. Status: BRAK.
- `scanAutoSiegesAfterAiTurn` (:43046, def :18040) → kandydat `auto_siege_candidate_for_scan` `diplomacy_siege_war_gate.rs:229` (CZĘŚCIOWO, bez pętli skanu, status już w r1).
- Nie zarzucone, ale dopisane dla kompletności: `sweepFortCaptures` (:16114) — brak funkcji `sweep_fort_captures` w Rust (BRAK); `barbariansActive`/`spawnCamps`/`tickCamps`/`decideBarbarianMoves` → `barbarians.rs:305/357/467/695` (PORT, BRAK wpięcia; wrappery :903/:986/:996).

### Z3 (kryt. 1): nieprecyzyjne zakresy linii pinu — PRZYJMUJĘ
Poprawione zakresy (sprawdzone grepem struktury `runWorldEndTurn`):
- E5 ekonomia: `try` `:38226-40297`; `advanceCityEconomy` :38356; blok EmpireFood `:38409-38677` (`advanceEmpireFood` :38569, `applyArmyStarvationHpLoss` :38603, `endMapSiege` :38647).
- E6 sumy: `:38683-38806` (nie do :38956). Bankowanie skarbca i nauki (E6b): `:38895-39098`. Rozłączone z E7.
- E7 oblężenia: `try` `:38809-38881`, pętla `econ.perCity` z flagą `oblegany` `:38814-38878`. Nie zawiera się w E6 — r1 błędnie zapisał zakres E6 do :38956.
- E8 bramka złota: `:39105-39206`.
- E9-E12 pętla miast: `for (const city of cities)` `:39257-39878`: kultura/religia :39276, rebelie :39515/:39552/:39564, prawo po przejęciu :39637, produkcja :39731-39800 (`advanceProduction` :39765), rekrutacja :39801-39857. E12 jest więc przeanalizowany (r1 pozostawił go jako „nieanalizowane”).
- E13 AI: `:40301-43050` (`runAiPhase` closure `:40367-43048`).
- E13b barbarzyńcy: `:43051-43434`, z `sweepFortCaptures` :43062 (przed) i :43428 (po).
- E14 zwycięstwo: `:43436-43500`.

### Z4 (kryt. 1): efekty deklaracji wojny poza hamulcem — PRZYJMUJĘ
Pełna lista wywołań na pinie (`grep` po `zarejestrujWypowiedzenie(` i `breakTreatiesOnWar(`, przypisanie do funkcji nadrzędnej):
- `zarejestrujWypowiedzenie`: :11713 (`processDiploCrisisQueue` :11650, D8 przez :24330), :13177 (`playerDeclareWarOnOwner` :13152, akcja gracza), :13221 (`ownerDeclareWarOn` :13197), :23816 (`joinAllyToWar` :23797), :40449 i :41940 (E13, faza AI). Wszystkie wpisane w tabeli (2).
- `breakTreatiesOnWar`: :11705 (D8), :13169 (`playerDeclareWarOnOwner`), :13206 (`ownerDeclareWarOn`), :23809 (`joinAllyToWar`), :40442 i :41932 (E13).
- `applyAllianceObligationsOnWar` (:23867): wołane :11706, :13170, :13207, :40443, :41933.
- `triggerRebelProtectionWarConsequence` (:13253): :17703 (E7, w `resolveSiegeSurrender`), :36090 (bitwa, poza ogonem tury).
Dokument r1 wymieniał tylko :11713, co było niedomiarem. Teraz E13 ma wiersze dla :40442-40449 i :41932-41940; (2) ma wiersz z listą pełną.

### Z5 (kryt. 3): podział r7 — PRZYJMUJĘ
- K4 i K7 przeformułowane jako „wpięcie istniejącej funkcji” z podaniem plik:linia. Nowa logika tylko tam, gdzie tabela (2) mówi BRAK funkcji (D1, D2, D4, D6 — brak funkcji po nazwie). Dodana zasada „nie pisać od zera”.
- K1 odwołanie do „ABC-2” usunięte; zastąpione przez Q2.
- Dodane przypisanie klocek→pytanie w tabeli (5), kolumna „Pytanie Q”: K1 ↔ Q2, K2 ↔ Q2, K3 ↔ Q2, K4 ↔ Q3, K5 ↔ Q1, K6 ↔ Q4, K7 i K8 bez pytania gameplay (decyzje techniczne).
- Uwaga o duplikacji: K4 i K7 nie zakładają już pisania logiki, która jest portowana (Z2), więc W4 (`war_turn_declare.rs`, `war_turn_forced.rs`) jest wskazany jako źródło wpięcia.

## Korekty własne (poza zarzutami, wykryte przy obronie)
- D7 dobra wola: WPIETE częściowo przez `run_brake_phase` (r1 napisał BRAK).
- D8 `processDiploCrisisQueue` (:11650, wywołanie :24330) nie był w r1: dopisany; obliczenie kolejki WPIĘTE w `run_brake_phase` krok 3, skutki BRAK.
- E5 wrapper `run_economy_tick_for_game_with_food` (`turn_economy_wire.rs:246`): jedyne wywołania w `tests/p6_*`, brak wołającego produkcyjnego. Dopisane w tabeli (2).
- E10 rebelie: wołane tylko z `compute_order_lane` (`order_effects_lane.rs:475`), którego jedynym wołającym w W8 jest `turn_economy_inputs_native.rs:352`; produkcyjny wołający poza `run_war_turn` nie został prześledzony (NIE_ZMIERZONO poza zakresem pipeline).
- Dyspozycja nakazuje „ROZNICA B” z konsekwencjami: B5 przeformułowane (rebelia i produkcja tego samego miasta w jednej iteracji pętli).

## SHA
Commit: podany w odpowiedzi orkiestratora (`git rev-parse HEAD` po commicie na gałęzi detached w worktree wf_93e04b30-039-3).
