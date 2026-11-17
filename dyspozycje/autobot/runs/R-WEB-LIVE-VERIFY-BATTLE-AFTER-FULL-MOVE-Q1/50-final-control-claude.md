STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiary i narzędzia; gra/src, gra/data, WERSJE.md bez zmian)
TEMAT: R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1
GOAL: trzy pomiary na żywej grze po FALI 745/747: (1) ucieczka i pościg, (2) mieszana armia, (3) straty zwycięzcy w trybie ręcznym; narzędzia z asercjami i kodem wyjścia 1; lista kandydatów R-WEB-*.
ZMIANY/COMMIT: oceniany kandydat 90b8dd00695d43f28a1afeafd4c7f45a48f1efc9 (detached). Ten raport: jedyny plik dodany przez FC.

## Dowody stanu (zmierzone przez FC)
- `git merge-base --is-ancestor 7ac79dafb 90b8dd006` -> TAK; `--is-ancestor 4918d210e 90b8dd006` -> TAK.
- `git diff --name-only 7ac79dafb 90b8dd006` poza `runs/R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/**`: wyłącznie `gra/tools/battle-rout-pursuit-browser-entry.ts`, `gra/tools/live-verify-battle-after-full-move-live.cjs`, `...-manual-driver.cjs`, `...-rout-check.cjs`. Zgodne z allowlistą. gra/src, gra/data, WERSJE.md, battleScene.ts, wikiBundle: bez zmian.
- `git diff --check 4918d210e 90b8dd006`: puste (0).
- `git status` w worktree po moich przebiegach: czysty (brak nadpisanych dowody/*.png ani 01-matrix.json).
- UWAGA: origin/main poszedł dalej (71ca0e588, FALA 750: arbitraż kolizji, zmiana battleScene.ts). Kandydat mierzy kod z FALI 747 (7ac79dafb). Po integracji z main próg A1 (rozrzut = 2 dokładnie na limicie) może czerwienieć bez regresji reguły (zob. zarzut 5).

## TESTY (surowe wyjście, po `npm ci` w gra/ na 90b8dd006)
- `npx tsc --noEmit`: exit 0.
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `20 pass, 0 fail`, exit 0.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test: `COMBAT TEST: 6/6 pass`, exit 0.
- Bramek czerwonych brak, więc porównanie baza vs kandydat nie dotyczy.
- Mutacje: `MUT_OUT=<scratchpad> node evidence/mutations-r3-script.cjs` -> `MUTACJE: 28 sprawdzen, 0 niezgodnych` (skrypt uruchamialny bez edycji ścieżek; zarzut 3 zamknięty).
- Niezależny przebieg LIVE (Chromium/Playwright, vite dev server na drzewie kandydata, ziarno 4 spoza zestawu operatora, `--part all --seeds 4`, wyjście do scratchpadu): `=== 9 bitew, 0 z naruszeniem, progi: rozrzut<=2, ciosy<=1, niewykorzystany ruch<=10% ===`, exit 0. SHA builda: NIE ZAPISANO (dev server na drzewie 90b8dd006, kod gry = 7ac79dafb; nie `vite build` poza repo).
- Przebieg --check na zapisanych danych (obrona/evaluator) odtwarza tabele; dane operatora w evidence/ zgodne z moim przebiegiem co do rzędu wielkości (rozrzut 2, ciosy 1, niewykorzystany ruch 0-1,8%).

## Werdykt per zarzut
1. N1 (12/12 par rozbieżne = słaby dowód): ODDAL. Obrona poprawiła liczbę (9/12 par z innym zwycięzcą) i obniżyła wniosek do kierunku bez mechanizmu; hipoteza `_doMove` zostaje jawnie niezweryfikowana. Kandydat R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1 wymaga reprodukcji na poziomie sceny przed zleceniem naprawy; to decyzja orkiestratora/właściciela, nie defekt tego tematu (kryterium: opisać, czy rozbieżność > 25%, i oznaczyć kandydata, bez naprawy).
2. N3 B1 (słabe okno po 1. rozbiciu): ODDAL. firstRoutRound=1, więc liczby 5/9/6 nie są oknem po rozbiciu; obrona to przyznała w errata. Dowód właściwy: 0 zdarzeń rout z neverRout=true, neverRout zadają ciosy w rundach 2-5 i giną walcząc. Gałąź "ocalały neverRout" jawnie NIE_ZMIERZONO. Zalecenie niekrytyczne: przy następnej okazji zmienić etykietę kolumny "ciosy neverRout po 1. rozbiciu" na "ciosy neverRout (od rundy 1)".
3. Mutacje tylko na kopii danych i zaszyte ścieżki: ODDAL / naprawione. Skrypt działa bez edycji (28/28 u mnie). Ograniczenie (mutacje sprawdzają checker, nie instrumentację) zostaje zapisane.
4. Zrzuty PNG nie dowodzą zachowań: ODDAL. Obrona zdegradowała je do ilustracji i oznaczyła opisy w 10-operator jako errata; dowodem zachowań są wiersze jsonl. Zrzutów nie oglądałem ponownie (nie są nośnikiem dowodu).
5. Rozrzut frontu = 2 na limicie, próg A3 = założenie, Hastati jako strzelec: ODDAL jako ryzyko. Limit 2 pochodzi z dispatchu. Mój niezależny przebieg (s4) przechodzi. Ryzyko po FALI 750/RESIDUAL jest opisane powyżej.
6. Wiersze mode:instant: ODDAL. `_skipInstantFallback` (round 0, killed/fled 0) wyjaśnia zera; różny zwycięzca s1/s2 vs AUTO to znana sprawa #257/#281 (decyzja właściciela: bez zmian). Flaga neverRout=false w R2 odróżnia anomalię od regresji NEVERROUT-HOLD-FIGHT.
Żaden zarzut nie wymaga NAPRAW; żaden nie wymaga decyzji produktowej w tym temacie.

## Zgodność z GOAL i kryteriami
(a) trzy tabele z dowodami: tak (live-n2-n3-table.txt, manual-vs-auto-table.txt, rout-check). (b) kandydaci: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1 (hipoteza, do reprodukcji sceny). K6 zdjęte zgodnie z DODATKIEM 2. (c) narzędzia jednopoleceniowe z asercjami i exit 1: tak (mutacje 28/28). (d) tsc 0, 5 bramek zmierzone, diff --check czysty: tak.

## BLOKADY
Brak. NIE_ZMIERZONO: gałąź B1 ocalałego neverRout; limit odwrotu armii po bitwie (kampania, INFO); SHA builda (dev server); pomiary po FALI 750 (arbitraż kolizji).

## UWAGI-DLA-ORKIESTRATORA
- Po FALI 750 powtórzyć `live-verify-battle-after-full-move-live.cjs --part n2` po integracji; A1 (rozrzut = 2) jest na granicy.
- Kandydat R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1 zlecać dopiero po reprodukcji sceny bez klików; ręczne przebiegi nie są bit-powtarzalne.
- Rejestry #309/#335/#426: pomiary wykonane, brak defektu potwierdzonego w kodzie gry.

RUNDY: FC po rundzie 4/5 (obrona Operatora r4; kandydat 90b8dd006).
NASTĘPNY KROK: integracja orkiestratora (FF/merge z main; ancestry i diff --stat), potem rejestry; deploy nie dotyczy (zmiany tylko w narzędziach i dowodach).
DEPLOY/PUSH: NIE WYKONANO
