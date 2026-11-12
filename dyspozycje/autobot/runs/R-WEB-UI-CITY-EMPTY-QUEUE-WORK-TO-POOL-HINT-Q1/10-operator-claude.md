STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-EMPTY-QUEUE-WORK-TO-POOL-HINT-Q1
GOAL: komunikat "Kolejka pusta — Praca idzie do puli imperium" w panelu miasta; test realnego renderu bez blednej asercji 0%.
ZMIANY/COMMIT: tylko gra/tools/city-empty-queue-work-to-pool-hint-real-render-test.cjs (asercja 0% Budynki zastapiona: setSplit(0) przycina do minimum 50% (cities.ts:433), wiec komunikat jest WIDOCZNY, r0.visible===1). Baza 288b5a798. cityPanel.ts i silnik NIETKNIETE. Plus ten raport.
TESTY (surowe wyjscia, worktree z npm ci):
- city-empty-queue-work-to-pool-hint-real-render-test.cjs: pass=17 fail=0 (realny Chromium)
- mutacja (cityPanel.ts:5275 `if (false && ...)`, cofnieta): pass=12 fail=5 -> test czerwienieje, w tym nowa asercja 50%
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
BLOKADY: brak. (Uwaga: w repo 17 asercji zamiast 15/16 z dispatchu - dodatkowe wywolania "panel miasta otwarty".)
RUNDY: 2/5
NASTEPNY KROK: Evaluator -> Final Control
DEPLOY/PUSH: NIE WYKONANO
