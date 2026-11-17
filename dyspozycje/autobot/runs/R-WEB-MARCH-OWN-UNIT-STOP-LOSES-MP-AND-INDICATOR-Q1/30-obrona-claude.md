STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-OWN-UNIT-STOP-LOSES-MP-AND-INDICATOR-Q1
GOAL: obrona Operatora na 4 zarzuty Evaluatora (edbce391a). Baza kodu: f99501838 (R1). Zarzut 1 (S8 wskaźnik niezmierzony) i zarzut 2 (jedno powiadomienie) przyjęte z poprawką i dowodem; zarzut 3 przyjęty; zarzut 4 to notatka, bez zmian w kodzie.

ZMIANY/COMMIT: commit obrony (SHA w polu sha wyniku), pliki:
- gra/src/ui/hexContextTooltip.ts: pola marchPausedReason / marchQueuedEndTurn w UnitContextTooltipInput i mapowanie w unitCardStatusFromTooltip.
- gra/src/main.ts: (a) buildUnitContextTooltipForUnit (żywy panel jednostki) dostaje wskaźnik marszu; (b) executePlannedMarchesEndTurn bez !movedByPlayerThisTurn (zarzut 3); (c) komentarz przy movedByPlayerThisTurn zaktualizowany; (d) applyMarchSegmentInstant: dymek „Marsz przerwany" tylko przy zmianie powodu (zarzut 2).
- gra/tools/march-multiturn-live-vite.config.ts: hak window.__mr.expand(uid) (rozwija panel, bez zmiany stanu gry).
- gra/tools/march-multiturn-live-test.cjs: S8 w DOM po planie / po każdym końcu tury / po dojściu (asercje w runScenario).

PRZYJĘTE / ODRZUCONE ZARZUTY:
1. PRZYJĘTE (S8 nie był mierzony). Przyczyna: armyStackHud nie jest montowany (buildArmyStackHudState zwraca null, main.ts ~27041), więc wskaźnik dopisany tylko tam nigdy nie wychodził na ekran. Żywy panel to buildUnitContextTooltipForUnit (main.ts ~7093), który nie dostawał pól marszu. Poprawka: pola przekazane do żywego panelu. Dowód live (S6, Chromium, rozwinięty panel): after-plan indicator = {cls: queued, text: "Status: ➤ marsz ruszy na koniec tury"}; endturn#1 (pozycja 36,21) queued; endturn#2 (dojście 37,19) indicator = null. Wskaźnik „trasa wstrzymana" miał tę samą lukę przed zmianą; teraz też działa w żywym panelu (nie zmierzono przy realnym zatrzymaniu, patrz NIE ZMIERZONO).
2. PRZYJĘTE CZĘŚCIOWO (brak dowodu „jedno powiadomienie"). Dedup wpisu w „Ważne" to registerMarchStop (planned-march.ts:532-541), pokryty testem T6 w march-resume-next-turn-test.cjs (50 pass / 0 fail). W trakcie analizy znalazłem realną lukę: dymek „Marsz przerwany" w applyMarchSegmentInstant (EOT) był pokazywany przy każdym końcu tury, także przy tym samym powodzie. Poprawka: dymek tylko gdy marchStopNotified.get(unitId) !== stopReason. NIE ZMIERZONO: scenariusz na żywo z przerwaniem przy MP>0 na EOT (w harnessie S1–S7 stop=null wszędzie); brak live dowodu liczby powiadomień.
3. PRZYJĘTE. Martwa funkcja executePlannedMarchesEndTurn: usunięty warunek !movedByPlayerThisTurn.has(u.id). Komentarz przy deklaracji movedByPlayerThisTurn przepisany (zbiór nie steruje już marszem; zostaje licznik w diagnostyce). tsc = 0.
4. Notatka przyjęta bez zmian: zmiana asercji E6/G3 uznana za zmianę reguły zgodną z GOAL 1; reguła przechodzenia przez własne jednostki nietknięta; DECISION_REQUIRED niepotrzebne.

MUTACJA (przez kopię pliku, bez git checkout): przywrócenie pomijania movedByPlayerThisTurn w pętli EOT i w executePlannedMarchesEndTurn -> S6 FAIL ("S6: pozostaly ruch przepadl na koniec tury 1"). Źródło przywrócone z kopii (cmp OK).

TESTY:
- live S6 (po poprawce, także po ostatnim dymku): PASS, arrivedAtClick 2, ruch 6, po EOT#1 pozycja (36,21) (ruchLeft 1 -> 6 po odnowieniu, pozycja ruszona).
- live S1, S2, S3, S4, S7: PASS (arrivedAtClick 2 / 2 / 2 / 2 / 2), z asercjami S8.
- tsc --noEmit: exit 0, 0 linii wyjścia.
- logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test 33 / 0; unit-replace-test 21/21; combat-test PASS; rally-point-automarch-test PASS.
- march-end-of-turn-only-test: exit 0 (M1–M5 wykryte, M5 = S6 mutacja).
- march-resume-next-turn-test 50 / 0; planned-march-test 18 / 0.
- march-attack-queue-persist-test: 55 pass / 2 fail (g5, g8). Baza 862eaae4a: identycznie (liczba „clearPlayerUnitSelection(" w main.ts = 40 na bazie i 40 po zmianach). Dług bazowy, nie naprawiany.

BLOKADY: brak. Poza zakresem (do orkiestratora): w rozwiniętym panelu wskaźnik jest; w widoku kompaktowym (unitSideDetailExpanded = false) wskaźnik nie jest pokazany. To zgodne z istniejącym miejscem linii statusu; NIE ZMIERZONO, czy właściciel chce go też w kompakcie.

RUNDY: 2/5 (runda obrony r1 odpowiada na zarzuty edbce391a).
NASTĘPNY KROK: Evaluator r2 (sprawdzić S8 live w raporcie, mutację M-moved, dymek EOT jako zmianę zachowania); Final Control.
DEPLOY/PUSH: NIE WYKONANO
