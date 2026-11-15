STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1
GOAL: Rozpoznanie (tylko odczyt) trybu ręcznego sterownika pętli oblężenia: co robi pin 07d2fbd72, co ma port Rust, jakie wejścia/wyjścia wymaga port, propozycja tematu wykonawczego.
ZMIANY/COMMIT: allowlista = dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1/ (tylko ten plik). Zero zmian kodu. Baza: origin/rust-port/parity-v2 = f7baa3848. Pin: 07d2fbd72 gra/src/battle/battleScene.ts (odczyt przez git show).
TESTY: NIE URUCHAMIANO (rozpoznanie tekstowe, bez cargo i bez npm). Weryfikacja: git show/grep pinu i git grep f7baa3848. Rewizja r2 (po zarzutach Evaluatora r1): ponownie git grep/show na tych samych SHA.
BLOKADY: patrz sekcja 5 (NIE_ZMIERZONO).
RUNDY: 2/5 (rewizja Operatora po zarzutach Evaluatora r1, 8c9f626d3)
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawek z 02a-obrona.md), potem FC.
DEPLOY/PUSH: NIE WYKONANO

# 1. Tabela: funkcja pinu trybu ręcznego -> zachowanie -> odpowiednik Rust

Pin: `gra/src/battle/battleScene.ts` @ 07d2fbd72. Rust: `rust-port/engine/src/domain/*` @ f7baa3848.

| Funkcja / miejsce pinu | Zachowanie | Odpowiednik Rust | Status |
|---|---|---|---|
| Pole `_manualMode`: konstruktor 2286 (`= true`); start bitwy `_startBattle` (3558) linia 3572: `= !gate \|\| (gate && hasCommander)`, gdzie `hasCommander = roster.some(isArmyCommander && !dead && !routed)` (bez `!fadingOut`); reset `_resetBattleRuntimeState` (10533) linia 10539: `= true` | Wybór trybu przy starcie i resecie. Wartość z konstruktora jest nadpisywana w 3572, więc realny start zawsze idzie przez 3572 | Brak przypisania startowego i resetu. Pole `manual_mode` istnieje (`siege_tactics_turnseq.rs:89`, `siege_tactics_autobatch.rs:161`, `siege_tactics_activate.rs:90`), domyślnie false (`siege_tactics_autobatch.rs:183`). Grep `manual_mode =` w `rust-port`: jedyne przypisania to testy (`tests/p6_siege_tactics_autobatch.rs:322, 587`). Produkcja nigdy nie ustawia flagi | BRAK (brak przypisania startowego i resetu; sama wartość domyślna false nie jest rozbieżnością) |
| Gate `_manualCommanderGate = opts.manualControlAllowed !== undefined` (2718; typ opcji 585) | Tryb ręczny dostępny tylko przy zdefiniowanym gate | Brak (grep `manualControlAllowed`/`manual_control` w `rust-port/engine/src`: 0 trafień) | BRAK |
| Producenci gate: `gra/src/main.ts` 33581, 33635, 34312, 34399, 36988, 37043: `manualControlAllowed: <roster>.some(u => u.isGeneral === true)` (atk lub def). Podgląd `gra/src/ui/preBattle.ts` 905: domyślnie `!== false`, sterowanie na polu dopiero w BattleScene (853) | Źródłem gate jest `isGeneral` na rosterze, a nie `isArmyCommander` używany w pinie do `hasCommander` | Brak | BRAK |
| `_toggleManualMode` (17348–17395). Blokada AUTO→RĘCZNY bez dowódcy: 17351–17352 (`gate && !manual && !roster.some(isArmyCommander && !dead && !fadingOut && !routed)` → return). OFF (17358–17378): reset `attackMoveMode`, selekcji, `playerOrder=none` wszystkich jednostek gracza, `_queuedOrderUnitIds.clear()`, grupy `manual` → `steady + autoPlay`; potem `_kickoffBattleTurn()` gdy `_battleAwaitingOrders`, inaczej `_activateNext()` (gdy `siegeWallCol>=0`) lub `_beginAutoBatchTurnFromCurrentState()`. ON (17379–17394): `_haltAutoBattleTurn()`, `playerOrder=none` i `acted=false` dla żywych, synchronizacja grup, feedback | Przełącznik trybu, dwukierunkowy | Brak funkcji przełączającej. Odpowiedniki częściowe: `halt_auto_battle_turn` (`siege_tactics_autobatch.rs:765`); blokady batcha po `st.manual_mode` (`siege_tactics_autobatch.rs:351, 403, 654, 733`) | BRAK (część logiki ma odpowiedniki) |
| Wyzwalacze przełącznika: klawisz R `_onKeyManual` (17406–17419; warunek `deployPhase \|\| !started \|\| finished` → brak reakcji); przycisk tempa AUTO (11813); `_disableManualIfCommanderLost(side)` (10007–10016: `gate && side == deployPlayerSide && !_autoBatchPlanning`, zdarzenie `_schedule(0)`, przełącz gdy `manual` i brak żywego dowódcy z `!fadingOut && !routed`), wołane z 9805 (rozbicie: `ru.routed = true`) i 9931 (druga ścieżka utraty dowódcy po wyjściu z gałęzi `fadingOut/dead/removed`); FF: 3703–3704 (`_ffPendingAuto = manual && busy`, inaczej `_ffEnterAuto`), 3709–3710 (`_ffEnterAuto`: `if manual → _toggleManualMode()`, potem kickoff), 9425 (`_ffPendingAuto && !busy` → `_ffEnterAuto`) | Przełączenie trybu przez gracza, przez utratę dowódcy lub przez przewijanie | Brak. Logika utraty dowódcy: predykat jest w Rust (`army_leadership.rs:156`), brak wołającego i brak zdarzenia `_schedule(0)` | BRAK (predykat ma odpowiednik: `army_leadership.rs:26, 128, 156`; wyzwalacz i FF nie mają) |
| Gałąź aktywacji `_activateUnit` (6048): `if (_manualMode && _isPlayerSide(ru.side)) { if (_performPlayerOrder(ru, done)) return; }` (6067–6068) | Jednostki gracza w trybie ręcznym wykonują rozkaz zamiast AUTO | `siege_tactics_activate.rs:238–241` (gałąź `U7.0-manual`, wywołuje `ops.perform_player_order()`); `siege_tactics_loop.rs:753–754` `ProdOps::perform_player_order` = `false` (stub) | ROZBIEŻNE (gałąź istnieje, wykonanie = stub) |
| Gałąź AUTO z gatingiem `!_manualMode` (6092, 5684/5697/5708, 5930, 5962, 6021) | AUTO nie działa w trybie ręcznym | `siege_tactics_activate.rs:248–255` (`!scene.manual_mode` + reset `playerOrder`); `siege_tactics_autobatch.rs:351/403/654/733` (`st.manual_mode` blokuje batch) | OK (zgodne z pinem), zależne od ustawienia flagi (patrz wiersz `_manualMode` wyżej) |
| `player_unit_idle` (`siege_tactics_loop.rs:444–447` = `false`, komentarz: w AUTO warunek `_manualMode &&` jest fałszywy). Użycie: `siege_tactics_turnseq.rs:350` (`st.manual_mode && ... player_unit_idle`) | Bezczynność jednostki gracza w trybie ręcznym | Stub zwraca `false` zamiast stanu jednostki | ROZBIEŻNE (stub) |
| Gałąź `ProdBody` przy `scene.manual_mode`: `siege_tactics_loop.rs:995–996`; jednostka trafia do `unported` (`:1000–1001`) | W Rust tryb ręczny jest celowo wykluczony z produkcyjnej pętli | — | BRAK (świadome wykluczenie, nie port) |
| `_performPlayerOrder` (18280–~18440). Kolejność: `hold` → done (18282–18284); `_performSiegeManualOrder` (18286, patrz niżej); `none` → gdy `_isUnitDoctrineAuto` i doktryna grupy != manual → `_executeGroupDoctrineStep` (18288–18296), inaczej done; `move` (18297–~18352): cel = pozycja → `none`; sąsiedni wróg → `_doAttack` (18311); krok greedy z obejściem (`_firstStepTowardMoveDestination`), `_destAllowedByBlockade` (18321), `_doMove` (18326); `attackMove` (18355–18434): `_attackMovePath` (route), cel = najwyższy `_priorityScore` i manhattan spośród wrogów na trasie lub mogących razić z trasy, atak gdy `_canStrikeTargetFrom`, inaczej krok na trasie; `attack` (`targetId`) — gałąź w ciele funkcji NIE_ZMIERZONO (używana m.in. przez 18641, zob. sekcja 5) | Rozkaz gracza, jednostka wykonuje jeden krok lub akcję i woła `done` | Brak typu `PlayerOrder` z wariantami `hold/move/attackMove/attack`; `ProdOps::perform_player_order` = `false` (`siege_tactics_loop.rs:753`) | BRAK |
| `_performSiegeManualOrder` (18435–): warunek wejścia `siegeWallCol >= 0 && side == atk && type != move`; jednostki oblężnicze: taran (`_isRam && !gateOpen`) lub wieża → `_siegeRamTowerStep`; strzelec przy `none` bez doktryny strzela do celu w zasięgu (`_rangedTargetInRange`); `onWallWalkway` → atak z `_targetInRange`; wspinaczka wieży (`_trySiegeTowerClimb`), `_siegeInfantryToTowerStep`; `attack`/`attackMove` przy `_siegeApproachRestricted` → atak lub krok podejścia, `none` gdy cel zniknął | Rozkaz oblężniczy (mur, wieże, taran) | Brak. `siege_tactics_loop.rs:756–758` `doctrine_step` = `false`; `siege_tactics_activate.rs:117–119` to tylko sygnatury traitu; `siege_tactics_tower` ma `pick_tower_target` (#116), ale nie jest podpięte pod rozkaz gracza | BRAK |
| `_isUnitDoctrineAuto` (17621–), `_executeGroupDoctrineStep` (17966–; wołane z 18082 i 18122 oraz z 18288–18296) | Doktryna grupy, gdy rozkaz `none` | `siege_tactics_loop.rs:756` `doctrine_step` = false | BRAK (zależy od #112) |
| `_executeUnitsImmediate` (18578–): filtr `!acted && !dead && !removed && !routed`, pętla `runNext` z `busy → _schedule(40)`, wołanie `_performPlayerOrder(u, () => { u.acted = true; runNext(idx+1) })` (18608) | Wykonanie kolejki rozkazów (wejście: SPACJA) | Brak; `siege_tactics_turnseq.rs:310, 342` `st.queued_order_ids.remove` (struktura istnieje, brak producenta kolejki) | BRAK (producent kolejki nieobecny) |
| `_queuedOrderUnitIds` (5994, 6013, 17370 czyszczenie przy OFF) | Kolejka rozkazów w tyle tury | `siege_tactics_turnseq.rs:310, 342` | OK (struktura), BRAK producenta |
| Pozostałe wołające `_performPlayerOrder`: 6068 (`_activateUnit`), 18082 i 18122 (w `_executeGroupDoctrineStep`, 17966: ustawia `playerOrder = move` i woła rekurencyjnie, callback po ruchu zmienia na `move` albo `none`), 18608 (`_executeUnitsImmediate`) | Trzy wejścia producentów (aktywacja, doktryna, kolejka SPACJA) | Brak | BRAK |

# 2. Wejścia / wyjścia portu trybu ręcznego

Wejścia (stan i typy, wg pinu):
- `manual: bool` (przełącznik; start z 3572; zmiana przez R 17419, tempo 11813, utratę dowódcy 10007–10016/9805/9931, FF 3703–3710/9425).
- Gate: `manualCommanderGate: bool` (= `manualControlAllowed !== undefined`, 2718), wartość `manualControlAllowed` z `roster.some(isGeneral === true)` (main.ts, sekcja 1).
- Żywy dowódca strony gracza: predykat `isArmyCommander && !dead && !routed` (start, 3570–3571) lub `isArmyCommander && !dead && !fadingOut && !routed` (przełącznik 17352, utrata 10010). Predykat w Rust: `army_leadership.rs:156` (`is_army_commander && !dead && !fading_out && !routed`); pole `is_army_commander` nie jest przekazywane z ProdUnit (sekcja 1, wiersz `siege_tactics_loop.rs:350`).
- `deployPlayerSide` (strona gracza: atk/def).
- Na jednostce: `playerOrder` ∈ { `none`, `hold`, `move{col,row}`, `attackMove{col,row}`, `attack{targetId}` } (typ deklarowany w `battleScene.ts:2029`); `acted`; `lastAutoMoveFrom`.
- Grupy: `meta.doctrine` (`manual` → `steady` przy wyjściu z trybu), `autoPlay`.
- Mur/brama: `siegeWallCol`, `gateOpen`; stan `battleAwaitingOrders`, `started/finished/deployPhase`, `busy`, `autoBattleSuspended`, `_autoBatchPlanning`.
- Kolejka: `_queuedOrderUnitIds`, źródło: SPACJA (17424–17433 → `_executeQueuedOrders` 3603–3610 → `_executeUnitsImmediate` 18578).

Wyjścia / zdarzenia:
- Zdarzenia sekwencji: `PerformPlayerOrder` (Rust: `siege_tactics_activate.rs:238–241`), `ResetPlayerOrder`, `DoctrineStep` (`siege_tactics_activate.rs:142–144`), gałąź `U7.0-manual`.
- Mutacje stanu: reset `playerOrder` i `acted`, czyszczenie kolejki, zmiana doktryny grup, `autoBattleSuspended`, `battleAwaitingOrders`, kickoff/halt batcha AUTO, `_ffPendingAuto`.
- Ruch/atak jako continuation (`done`) przez `_doMove` / `_doAttack` (wspólne z AUTO; wynik ciosu zależy od #109).
- Ustawianie `playerOrder = move` przez doktrynę (18082, 18122) i `attack` przez kolejkę (18641) — to producenci wejść, które port musi odtworzyć, zanim gałąź `none` i `move` będą wierne.
- UI (nie część portu domeny, do renderera): feedback, roster bar, highlight, rail, komunikaty (`_showBattleRosterFeedback`).

# 3. Zależności

- #97 K5-LOOP-AUTO: gałąź ręczna jest w `out_of_scope` pętli (`siege_tactics_loop.rs:995`). Decyzja właściciela, czy tryb ręczny wchodzi w #97, czy w osobny temat.
- #112 K5LOOP-DOCTRINA-STRZELEC: TWARDA zależność dla gałęzi `none` przy doktrynie auto (`_performPlayerOrder` 18288–18296 → `_executeGroupDoctrineStep`), wywoływanej też z 18082/18122 (rekurencja `playerOrder=move`). Bez #112 port `move` i `none` nie jest wierny nawet w prostym przypadku.
- #109 K5LOOP-OUTCOME: wynik ciosu przy `_doAttack` z rozkazu ręcznego (`_resolveBlowOutcome`).
- #113 K5LOOP-WIRING: podpięcie produkcyjne; bez tego tryb ręczny nie jest wykonywany nigdzie.
- Brak producenta kolejki SPACJA (18608, 17424–17433): wymaga portu `_executeQueuedOrders`/`_executeUnitsImmediate` w tym samym temacie co pętla rozkazów.
- Dowódca armii: predykat jest (`army_leadership.rs:26, 128, 156`), ale `siege_tactics_loop.rs:350` hardkoduje `is_army_commander: false` w `ratio()`. Pin przekazuje realne jednostki z flagami (`_armyMoraleRatio`, battleScene.ts 9988–9990: `armyMoraleRatioWithoutCommander(arr)`), więc w Rust dowódca liczy się jako zwykła jednostka w stosunku morale. To rozbieżność wyniku, nie tylko brak wejścia. Gate i start wymagają wejścia `isArmyCommander` do `ProdUnit`.
- Gate źródłowy: `isGeneral` w main.ts (sekcja 1); port musi przyjąć ten sam wybór źródła, nie `isArmyCommander`.

# 4. Propozycja tematu wykonawczego (nie wykonuj)

Uwaga: poprzednia propozycja (jeden temat, 3–4 rundy) była zaniżona. Rewizja: podział na trzy tematy wykonawcze, każdy w budżecie 5 rund.

- T1 `R-RUSTPORT-P6-K5-LOOP-RECZNY-STAN-Q1`: stan i przełącznik. Pole `manual` z 3572 (gate, start, `hasCommander` z `!fadingOut` tylko w przełączniku), `_toggleManualMode` ON/OFF (17348–17395), `_disableManualIfCommanderLost` (10007–10016, 9805, 9931), `_ffEnterAuto`/`_ffPendingAuto` (3703–3710, 9425), wejście dowódcy do `ProdUnit` (`siege_tactics_loop.rs:350`). Allowlista: `rust-port/engine/src/domain/siege_tactics_loop.rs`, `siege_tactics_autobatch.rs` (halt 765, blokady 351/403/654/733), `army_leadership.rs`, `rust-port/engine/tests/`, `dyspozycje/`. Zależność: #97 (decyzja właściciela o zakresie).
- T2 `R-RUSTPORT-P6-K5-LOOP-RECZNY-ROZKAZY-Q1`: model `playerOrder` (5 wariantów, 2029), `_performPlayerOrder` gałęzie `hold/move/attackMove/attack/none`, producent kolejki SPACJA (17424–17433, 3603–3610, 18578–18608), gałąź `U7.0-manual` (`siege_tactics_activate.rs:238–241`), `player_unit_idle` (`siege_tactics_loop.rs:444`). Allowlista: `siege_tactics_loop.rs`, `siege_tactics_activate.rs`, `siege_tactics_turnseq.rs`, nowy moduł `rust-port/engine/src/domain/siege_tactics_manual.rs`, `rust-port/engine/tests/`, `dyspozycje/`. Zależności: #109, #112 (twarda dla `none`/doktryny), T1.
- T3 `R-RUSTPORT-P6-K5-LOOP-RECZNY-OBLEZENIE-Q1`: `_performSiegeManualOrder` (18435–) i `_siegeRamTowerStep`/wspinaczka wieży. Zależności: #112, #116 (wieże), T2. Może być zamknięte w T2, jeśli szacunek po rozpoznaniu kodu (sekcja 5) będzie mały.
- Szacunek rund: T1 3–5, T2 4–5, T3 3–5. Operator: Haiku (zasada 2). Sonnet na Operatorze tylko z uzasadnieniem w dispatchu.
- Wektory: z pinu, sekwencje `_toggleManualMode` (ON/OFF), start 3572, `_performPlayerOrder` (hold/none/move/attackMove/attack), `_executeUnitsImmediate` (18578–18608), `_disableManualIfCommanderLost`. Generator wektorów: NIE_ZMIERZONO (nie ustalono, który skrypt generuje wektory dla tego obszaru; wymagane przed startem T1).
- UI (klawisz R, roster bar, feedback) poza zakresem domeny: osobny temat renderera.

# 5. NIE_ZMIERZONO

- Gałąź `attack{targetId}` w ciele `_performPlayerOrder` (poza `_performSiegeManualOrder`): nie czytałem.
- Wołający `_executeUnitsImmediate` poza SPACJĄ: 18649, 18677, 18699 (nie czytałem kontekstu).
- Ciało `_attackMovePath` i `_canStrikeTargetFrom` (wywołania w 18355–18434 czytane tylko wywołaniami, nie implementacją).
- Pełne gałęzie `_siegeRamTowerStep`, `_siegeInfantryToTowerStep`, `_trySiegeTowerClimb`, `_siegeApproachRestricted` (18435–): tylko warunki wejścia, nie ciała.
- `_kickoffBattleTurn` (3615): nie czytałem ciała.
- Kto ustawia `manualControlAllowed` poza tym, co wymienia main.ts (sekcja 1): nie sprawdzałem drugiego poziomu (preBattle.ts tylko jako podgląd).
- Generator wektorów dla obszaru (sekcja 4): nie ustalono.
- Nie uruchamiano testów ani bramek; brak dowodu zachowania runtime.
