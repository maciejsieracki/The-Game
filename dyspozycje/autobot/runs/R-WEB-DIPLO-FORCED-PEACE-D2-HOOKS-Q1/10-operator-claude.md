STATUS: BLOCK
DOMAIN: GAME (testy i hooki civTest; zachowanie gry bez zmian)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1 (runda 2/5)
GOAL: pomiar na żywo trzech ścieżek pokoju wymuszonego: D2 (drugi pokój w tej samej turze), S (zapis/wczytanie z oczekującym pokojem), A (pokój AI↔AI bez okna gracza).
ZMIANY/COMMIT: baza fb81a23bb (WIP r1: hooki saveForTest/loadForTest w gra/src/main.ts, gra/tools/diplo-forced-peace-d2-guard-test.cjs, gra/tools/diplo-forced-peace-d2-live-test.cjs). Runda 2 nie zmieniła kodu ani testów; commit = ten raport.
TESTY:
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- diplo-forced-peace-pending-test PASS=40 FAIL=0; diplo-truce-impl-test 94 PASS/0 FAIL; diplo-forced-peace-window-declutter-test PASS=16 FAIL=0.
- guard (statyczny): GUARD OK 7/7, mutant G1 wykryty.
- Live (Chromium, build vite poza repo, log /tmp/fpd2-live-r2.log):
  D2: FAIL (surowo). W 12 turach powstał tylko 1 pokój (pairKey 0_1); druga para nie spełniła warunku, okno blokuje endTurn, więc kolejne tury nie idą. Asercje „pending=2" i dalsze asercje D2 nieobsadzone. Klasyfikacja: harness/scenariusz (brak hooka wymuszającego zmęczenie drugiej pary), NIE dowód błędu gry.
  S: PASS (surowo). Pending 0_1 wraca po wczytaniu (ten sam pairKey, tura 5 przed i po), okno otwiera się samo i jest na wierzchu, akceptacja zamyka pending, tura kończy się.
  A: NIE ZMIERZONO. Po declareWar(AI,AI) stan „wojna”, wearinessStateForTest zwraca null, pokój nie zapadł w 60 turach. Nie wiadomo, czy zmęczenie dla pary AI↔AI nie jest naliczane po hooku declareWar, czy to kwestia czasu. Wymaga diagnozy.
  Zero pageerror/console.error w całym przebiegu.
- Mutacja S (usunięcie setTimeout(showNextPendingForcedPeace) w gra/src/main.ts ~linia 50637, build /tmp/fpd2-mutS): S dalej PASS. Okno wraca po wczytaniu inną ścieżką, więc asercja S nie jest strażnikiem tego wywołania. Źródło przywrócone (cmp zgodny, git diff pusty).
- Mutacja D2 nie wykonana: test D2 nie przeszedł warunku wstępnego.
BLOKADY: (1) D2 wymaga hooka wymuszającego zmęczenie/wojnę drugiej pary (np. setWearinessForTest), czyli nowego haku w main.ts poza tą rundą; (2) A wymaga zbadania wearinessStateForTest dla par AI↔AI. Nie stwierdzono realnego błędu gry; kodu gry nie naprawiano.
RUNDY: 2/5. Poprzedni werdykt r1: INFRA/BLOCK (dysk). Ta runda: D2 FAIL (harness), S PASS, A NIE ZMIERZONO.
NASTĘPNY KROK: runda 3 — dodać hak civTest wymuszający zmęczenie pary (bez zmiany logiki), uruchomić D2 ponownie, zdiagnozować A (weariness null), dodać mutanta dla D2 (usunięcie showNextPendingForcedPeace z acceptPendingForcedPeace, main.ts ~linia 26195) i A (deferForcedPeace -> true, main.ts ~linia 39387). Osobno ustalić, która ścieżka otwiera okno po wczytaniu (mutant S).
UWAGI-DLA-ORKIESTRATORA: pliki pomocnicze poza repo: /tmp/fpd2-dist (build bazowy), /tmp/fpd2-mutS (build mutanta S), /tmp/fpd2-evidence, /tmp/fpd2-live-r2.log, /tmp/fpd2-main.orig.ts (kopia źródła, identyczna z HEAD). Nie usunięto (zakaz rm). gra/node_modules zainstalowane (npm ci --ignore-scripts); dysk po instalacji 9,2 GB wolne.
DEPLOY/PUSH: NIE WYKONANO
