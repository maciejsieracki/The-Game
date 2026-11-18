STATUS: PASS
DOMAIN: GAME (tylko hooki civTest i testy; logika gry bez zmian)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1
GOAL: pomiar na żywo D2 / S / A pokoju wymuszonego + testy strażniki z mutantami
BAZA: f2d3d48aa (runda 3/5, Operator SONNET po 2 nieudanych rundach Haiku)

ZMIANY/COMMIT (SHA w polu sha wyniku):
- gra/src/main.ts: dopisany hak `setPairWarAgeForTest(a,b,turns)` (setup wieku wojny pary AI↔AI, tylko ?civTest=1); komentarz haka `wearDiagForTest` (tylko odczyt) bez „tymczasowy”. Zero zmian logiki.
- gra/tools/diplo-forced-peace-d2-live-test.cjs: pełna gra `?civTest=1&civSeed=4242`, obejście bramki NNS (dosypka 200/200), zamknięcie ekranu powitalnego (z-index 9650 zasłaniał okno pokoju), scenariusz A przepisany na REALNY pokój wymuszony AI↔AI.
- gra/tools/diplo-forced-peace-d2-guard-test.cjs: +G5c, +G5d.

TESTY (surowe):
| Ścieżka | Wynik ZMIERZONO | Mutant (kopia pliku, build poza repo) |
|---|---|---|
| D2 (2 pokoje w jednej turze, drugie okno samo) | PASS | usunięcie `showNextPendingForcedPeace()` w acceptPendingForcedPeace -> CZERWONO (2 asercje D2) |
| S (zapis/wczytanie z pending) | PASS | pominięcie odtwarzania kolejki przy wczytaniu -> CZERWONO; usunięcie `setTimeout(showNext…)` -> ZIELONO (okno wraca inną ścieżką, redundantna) |
| A (AI↔AI poza kolejką gracza) | PASS; log silnika „pokój WYMUSZONY AI4↔AI1 przy zmęczeniu 1.00”, pending=0, okno nie otwarte | deferForcedPeace=true + zdjęcie warunku „gracz stroną” -> CZERWONO (pending zawiera 1_4, okno się otwiera) |
Pełny przebieg: EXIT 0, zero pageerror. Błędów gry NIE wykryto.
Bramki: tsc 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; pending-test 40/0; truce-impl 94/0; window-declutter 16/0; guard 9/9.

Wnioski: poprzedni „A PASS” z mapy testowej był fałszywy (pokój AI↔AI zapadał dobrowolnie przy 0,45, nie wymuszony); teraz wymuszany wiekiem wojny 40. Pierwsze zielone D2/S/A r3 padały na zasłonięciu okna przez ekran powitalny i na bramce NNS (to harness, nie gra).

BLOKADY: brak. NIE ZMIERZONO: pokrycie z mapy playtest=mapa (1 główny AI) — nieistotne po przejściu na pełną grę; mutant S2 przeżywa (nie jest zależnością).
RUNDY: 3/5
NASTĘPNY KROK: Evaluator -> Final Control
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: (1) gra pokazuje ekran powitalny cywilizacji nad oknem pokoju wymuszonego (z-index 9650 vs 500) — w realnej grze może być to zasłonięcie okna po pierwszej turze; nie mierzono poza harnessem, do osobnej decyzji. (2) Uruchamianie 4 Chromium naraz zamykało strony (INFRA); mutanty puszczać po 2.
Ścieżki /tmp do sprzątnięcia: /tmp/fpd2-r3, /tmp/fpd2-r3-build, /tmp/fpd2-r3-mutD2, -mutA, -mutS1, -mutS2.
