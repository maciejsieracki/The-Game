STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-WONDER-TRANSFER-FOLLOWUP-Q1
GOAL: (1) rebelianci/barbarzyńcy nie posiadają cudów, (2) założenie miasta przenosi cud, (3) bonusy ekskluzywne u zdobywcy w pełni.
ZMIANY/COMMIT: BAZA origin/main 7bb0695aa. Pliki: gra/src/game/wonder-transfer.ts, gra/src/main.ts (beginWonderTransferWatch(excludeNewCity?), finalizeCityFounding owinięte migawkami; dawne ciało -> finalizeCityFoundingCore), gra/tools/wonder-transfer-on-conquest-test.cjs, ten raport. SHA commitu: w odpowiedzi końcowej (git log -1 brancha worktree).

IMPLEMENTACJA
- planWonderTransfers: nowy `isCivilizationOwnerId` (ownerId >= 0). PO nie-cywilizacyjne (-99, -1) => brak przeniesienia (cud zostaje przy ostatniej cywilizacji, bonusy działają dalej, bo kod bonusów wymaga tylko ownerId). Odbicie: warunek spójności rozszerzony — cud u cywilizacji X, PRZED = frakcja nie-cywilizacyjna, PO = cywilizacja Y != X => X->Y (do odbijającego). Legacy zapis z cudem u -99 leczy się przy pierwszym odbiciu (PRZED == ownerId).
- Założenie miasta: migawka PRZED liczona bez nowego miasta (jest już w `cities` przy wywołaniu), settle po całym finalize (łącznie z przejęciem fortów). Pokrywa wszystkie wywołania finalizeCityFounding.
- (3) Bonusy ekskluzywne: potwierdzone testem (zakładający/zdobywca dostaje sumę bonusów, poprzedni 0).
ZAŁOŻENIA: miasta-państwa mają ownerId >= 0 i zachowują się jak dotąd; kod bonusów liczy po ownerId (bez wymogu kontroli terytorium), więc nic nie opisywano/zmieniano.
ZMIENIONA ASERCJA (uzasadnienie): dawne „rewolta: cud idzie z miastem do -99" i „odbicie od rebeliantów: cud wraca" (zakładały cud u -99) zastąpione: rewolta -> cud zostaje u 2 (bonusy 3), odbicie przez 0 -> cud u 0. Pozostałe asercje bez zmian.

TESTY
- wonder-transfer-on-conquest-test.cjs: 43/43 (nowe: 4 rewolta, 4b barbarzyńcy/łańcuch frakcji/niespójny/legacy, 4c założenie miasta + daleko, bramka strukturalna finalizeCityFounding).
- Mutacje: usunięcie guardu cywilizacji -> 5 FAIL; usunięcie gałęzi odbicia -> 4 FAIL; beginWonderTransferWatch() bez wykluczenia nowego miasta -> 1 FAIL.
- logic-test 213/213; ai-test 274 passed / 20 failed (jak baza); tsc --noEmit 0 błędów.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5)
DEPLOY/PUSH: NIE WYKONANO
