STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; kod gry w gra/src NIE zmieniany)
TEMAT: R-WEB-ENDTURN-T57-DIAGNOSIS-Q1
GOAL: ustalić przyczynę zatrzymania "Zakończ turę" przy zalegającej kolejce bitew na harnessie z AI (DODATEK 1: t51 seed 4242 / t89 seed 777; pierwotny timeout t57), albo kandydat R-WEB-*, albo "zachowanie zamierzone + obsługa w harnessie" z dowodem.
ZMIANY/COMMIT: kandydat e45c12470cae64d6af7b665914d982b3a317f501 (potomek bazy f6b09c76b, potwierdzone merge-base --is-ancestor; origin/main = 1afc302bc, też potomek f6b09c76b). Diff vs baza: tylko 10-operator, 30-obrona, 2 pliki evidence, gra/tools/endturn-t57-repro.cjs. gra/src, WERSJE.md, gra-robocza, rust-port NIEZMIENIONE. integration_sha = e45c12470cae64d6af7b665914d982b3a317f501 (kod/dowody Operatora); ten raport FC w osobnym commicie potomnym.

## Werdykt per zarzut
1. Brak 5 ziaren x 100 tur: ODDAL. DODATEK 1 (r1 "uściślone") zawęził zadanie do odtworzenia zatrzymania t51/t89 i ustalenia dokładnej blokady; to zmierzono (seed 4242, t51 odtworzone 2x, zamknięcie audiencji usuwa blokadę). Brak innych ziaren jest jawnie NIE ZMIERZONO; to ograniczenie zasięgu, nie błąd dowodu.
2. Brak narzędzia: ODDAL (naprawione w r2: gra/tools/endturn-t57-repro.cjs, node --check OK, w allowliście endturn-t57-*.cjs).
3. Trzy wyzwalacze isOtherEndTurnModalOpen: ODDAL (poprawione w r2). Zweryfikowałem main.ts:33403-33405 (audiencja || scalenie armii || karta odkrycia tech) oraz DOM z przebiegu D (tech=false, brak panelu scalenia, otwarta civ-diplo-aud).
4. Błędne twierdzenie o stuckQueueHeals: ODDAL (wycofane; uzasadnienie w r2 zgodne z ai-economy-measure-run.cjs:188/242).
5. Rozstrzygnięcie defekt/zamierzone: ODDAL / DO DECYZJI CZŁOWIEKA (ABC, nie blokuje). "Zamierzone wstrzymanie kolejki przez modal + dług harnessu" jest poparte kodem (main.ts:40796 heal wychodzi przy audiencji, zweryfikowane; main.ts:40728-40729 podpowiedź "Zakończ ekran bitwy..." przy hasPendingAutoPreBattle) i pomiarem DOM (przycisk widoczny, is-disabled). Tekst po realnym kliknięciu NIE ZMIERZONO (jawnie). Treść podpowiedzi i to, czy audiencja AI ma blokować koniec tury = decyzja produktowa właściciela.
6. Związek t51/t89 z t57: ODDAL. Oznaczone jako hipoteza klasy; t57 NIE odtworzone; Operator nie twierdzi inaczej.
Żaden zarzut nie wymaga NAPRAWY w ramach tej diagnozy.

## TESTY (surowe wyniki, po npm ci, kandydat e45c12470)
- npx tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST: 6/6 pass
- 5 bramek zielonych; porównanie z bazą zbędne (gra/src identyczne z bazą).
- git diff --check HEAD~2: czysto.
- Live Chromium nie powtarzany (temat diagnostyczny bez zmian UI); dowód live Operatora (evidence/r2-*.txt) przejrzany: sygnatura pendingAuto=true, canEnd=false w t51, oraz t51->t56 po zamknięciu audiencji, PODSUMOWANIE stop=null.

## BLOKADY
Brak blokad technicznych. Ograniczenia zasięgu: 1 ziarno live (4242); t57 i t89 (seed 777) nie zmierzone.

## RUNDY
FC po rundzie 2/5.

## NASTĘPNY KROK
Integracja orkiestratora e45c12470 (dokumentacja + narzędzie). Rekomendowane tematy: (a) harness ai-economy-measure-run.cjs: zamykanie audiencji w clearBattles + utrwalanie liczników w zawieszeniu; (b) ABC: treść podpowiedzi main.ts:40729 przy audiencji i czy audiencja AI ma blokować koniec tury; (c) dopiero potem pomiar wielu ziaren do t57.

## UWAGI-DLA-ORKIESTRATORA
- Nie tworzono sesji/zadań. Brak run_in_background.
- Pierwotny t57 pozostaje formalnie nierozstrzygnięty; zamknąć jako "klasa t51 ustalona", nie jako "wyjaśniony".

DEPLOY/PUSH: NIE WYKONANO
