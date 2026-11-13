STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-MOVES-BEFORE-AI-TURN-Q1
GOAL: po "Koniec tury" najpierw wszystkie mozliwe ruchy gracza, potem AI/PM, potem ekonomia i nowa tura gracza.
ZMIANY/COMMIT: gra/src/main.ts, NOWY gra/tools/player-moves-before-ai-turn-test.cjs, gate-*.txt. Start z WIP (web-wip/MOVES-wip) przeniesiony na origin/main f568e1ed3. SHA: jeden commit Operatora (patrz wiadomosc koncowa). Bez zmian w gra-robocza, WERSJE.md, rust-port.

DIAGNOZA (zmierzona; RED na dawnym kodzie, gate-player-moves-RED-przed.txt: 21 OK / 9 FAIL):
- runPlannedMarchesAtPlayerEndTurn wolal executePlannedMarchesEndTurn -> enqueueMarchSegments -> processMarchQueue -> executeMarchSegmentForUnit = ANIMOWANY ruch (startAnimatedMove) pierwszej jednostki. Koniec animacji (odjecie ruchu, mgla, hint) dopalal sie w renderLoop PO resecie ruchu i w trakcie fazy AI (ANIM_FINISH po WORLD_START).
- hot-seat: ruchy konczacego fotela nie byly dokanczane w advanceSeat (endActiveHumanTurn dostaje tylko ostatni fotel) -> marsz fotela 0 przepadal.

POPRAWKA (gra/src/main.ts):
1. faza ruchow gracza w pelni synchroniczna: kazdy segment przez applyMarchSegmentInstant (nowy parametr launchAttack); kolejka z jednostek gracza z planem i niewykorzystanym ruchem.
2. przed runWorldEndTurn: jesli marsz-z-atakiem otworzyl okno bitwy (isPreBattleOpen/hasPendingAutoPreBattle) - czekamy na jego zamkniecie W TEJ fazie (wyjscie przy resecie pipeline).
3. hot-seat advanceSeat: dokonczenie marszow konczacego fotela przed przelaczeniem (bez atakow, pomija jednostki w animacji).
4. znaczniki faz phaseMark (no-op bez window.__civPhaseLog) i hak __playerMovesTestDebug tylko przy ?civTest=1.
Reguly ruchu, koszty, AI, powiadomienia - bez zmian.
Kolejnosc po poprawce: PLAYER_MOVES_START -> PLAYER_MARCH_INSTANT -> PLAYER_MOVES_END -> WORLD_START -> ECONOMY -> AI_START -> AI_CIV_START(k) -> AI_END -> PLAYER_TURN_BEGIN; zero ANIM_FINISH i zero zmian pozycji gracza po PLAYER_MOVES_END.

TESTY (baza f568e1ed3):
- node tools/player-moves-before-ai-turn-test.cjs (strukturalne + mutacje + Chromium L1-L5: kolejnosc, zapis/wczytanie, wrog na trasie, hot-seat): 30 OK, 0 FAIL, EXIT=0 (przebieg powtorzony na tej bazie; gate-player-moves-GREEN.txt to log z WIP, tez 30 OK). RED 21 OK/9 FAIL z logu WIP, NIE powtorzony na nowej bazie.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresje PRZED(origin/main) vs PO, 38 plikow statycznych end-turn/march/queue/move/hotseat/turn-: PO 6 FAIL (border-march-wygasanie, egypt-movement-precedence, end-turn-modal-sequencing, hotseat-etap6d-podetap-e-source, march-attack-queue-persist, pr141-hotseat-diplomacy-owner); PRZED te same 6 FAIL (istniejace, nie regresja; przyczyny NIE_ZMIERZONO).
- Live Chromium PO == PRZED: end-turn-gameplay-runtime EXIT=1, end-turn-input-stability EXIT=1, hotseat-drugi-fotel-tura EXIT=2, R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live EXIT=2 (istniejace); events-defer-to-turn-start EXIT=0. Pozostale ~29 plikow live NIE_ZMIERZONO (limit czasu).
ZALOZENIA: okno bitwy z marszu czeka petla 100 ms do zamkniecia; w hot-seat atak z marszu nie jest odpalany przy zmianie fotela (bez przecieku okna na kolejny fotel).
BLOKADY: brak. Wspolny obszar main.ts z R-WEB-EVENTS-DEFER-TO-TURN-START-Q1 (sekwencyjnie).
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (potwierdzic przyczyny istniejacych FAIL, RED na nowej bazie, dowod wizualny w Chromium).
DEPLOY/PUSH: NIE WYKONANO
