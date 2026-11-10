STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1
GOAL: wynik "Pomin do wyniku" w oblezeniu bez wylomu ma byc taki sam jak wynik AUTO (exploit: slabsza armia bierze dobrze bronione miasto).
ZMIANY/COMMIT: kod b9d38ce30 (gra/src/battle/battleScene.ts, gra/tools/battle-skip-siege-parity-test.cjs). Ten raport w commicie nastepnym. Allowlista zachowana. Brak zmian w WERSJE.md, gra-robocza/, build/dev, push, deploy.
  Model wykonawczy: dispatch zalecal SONNET 5.5; ten przebieg uruchomiono na HAIKU 5.5 (do oceny przez orkiestratora).

DIAGNOZA (w kodzie i na zywej scenie):
  1. Oblezenie bez wylomu nie konczy sie silnikiem. _updateStallWatch() zwraca wczesnie dla siegeWallCol>=0, wiec _stalled nigdy nie jest true i regula "SZTURM ODPARTY" z _checkEnd nie odpala.
  2. AUTO na ?playtest=oblezenie-duze (1x, dt 16 ms, seed 1): po 150 s wall tura 23, vNow 640 s, bez wyniku (battle-skip-equals-auto-resolve-test.cjs, WSKIP_PT=oblezenie-duze). AUTO nie ma wiec wyniku do porownania.
  3. Pomin przewijal do FF_MAX_ROUNDS=400 i w _ffRoundCapResult rozstrzygal PAT samym stosunkiem morale (ratioA<=ratioD -> obronca). Bez wylomu atakujacy mogl wygrac po samym morale.
  4. _skipInstantFallback (computeInstantResult) to osobny rachunek, ale wywolywany tylko gdy !started (play() nieuruchomione). Z deploy phase skip() startuje bitwe i idzie przez FF. Zostawiono bez zmian.

POPRAWKA:
  - Nowa metoda _capRoundWinner(): oblezenie bez wylomu (siegeWallCol>=0 && !wallEverBreached) -> obronca; poza tym morale; remis -> obronca.
  - _ffRoundCapResult uzywa _capRoundWinner (usunieto surowe porownanie morale).
  - _checkEnd: gdy aliveA && aliveD && roundNo >= FF_MAX_ROUNDS, ten sam werdykt _capRoundWinner. AUTO i Pomin daja identyczny wynik na sufitcie tur.
  - ZALOZENIE (luka rozstrzygnieta bez pytania): oblezenie bez wylomu po sufitcie = obronca, zgodnie z istniejaca regula SZTURM ODPARTY. Jesli wlasciciel chce innej reguly, to decyzja balansowa -> pytanie ABC.

TESTY:
  - tsc --noEmit (gra/): exit 0.
  - node tools/battle-skip-siege-parity-test.cjs: PASS 7, FAIL 0, NIE_ZMIERZONO 1 (czesc B).
  - Regresja (exit 0): auto-battle-simultaneous-test, battle-standoff-two-warriors-test, r-bitwa-etykieta-tozsamosc-strony-zrodlo-test, r-bitwa-kolory-gracz-przeciwnik-q1-test; siege-surrender-forecast-test (57 PASS / 0 FAIL), siege-last-stand-sortie-test (71 OK / 0 FAIL).
  - bitwa-auto-atak-wielojednostkowy-evaluation-test: 5 FAIL takze na bazie 1d068199 (sprawdzone przez podmiane pliku na HEAD i powrot) -> niezwiazane, pre-existing.
  - Live (Chromium, AUTO vs Pomin na oblezeniu) NIE_ZMIERZONO: AUTO do sufitu 400 tur to ok. 45 min wall przy 1x. Nie uruchomiono.

BLOKADY:
  - Dowod parytetu na zywej scenie oblezenia nie zostal wykonany (czas). Przed READY_FOR_DEPLOY wymagany przebieg Chromium (WSKIP_PT=oblezenie-duze) lub skrocony sufit testowy.
  - Dispatch zakladal porownanie rozkladow na N ziarnach. Przy braku konca w AUTO parytet dowodzi sie wspolnym werdyktem sufitu (zrobione), nie porownaniem rozkladow.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet): zweryfikowac diff b9d38ce30 (kontrakt sufitu w _checkEnd i _ffRoundCapResult) oraz zalozenie o oblezeniu bez wylomu. Orkiestrator: pytanie ABC, czy taka regula po sufitcie jest zgodna z zamiarem wlasciciela.
DEPLOY/PUSH: NIE WYKONANO
