STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1
GOAL: ustawienie nowej gry „Dyplomacja i wojna” (Łatwa/Normalna/Trudna), Łatwa = dziś bit-w-bit.
ZMIANY/COMMIT: kandydat 379cf050d4d5f94f0f78b6aad4e7285c23f37ee7; `git merge-base --is-ancestor 29a3920b9 379cf050d` = TAK; diff 21 plików, +844/-47 (helper diplomacy-war-level.ts, diplomacy*.ts, ai-ai-treaty-*, penalty-preview, newGameFlow.ts, main.ts, test diplomacy-war-level-test.cjs, 6 kotwic testów, raporty). Zero zmian w JSON, gra-robocza/kanon, WERSJE.md.
TESTY (własne, surowe wyjście): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; diplomacy-war-level-test exit 0 ("wszystkie asercje zielone, wszystkie mutanty wykryte": helper bez ×k 13 czerwonych, M5 podgląd 1, M4 AI↔AI zerwanieZaufanie 1). Testy diplomacji (glob diplo*/diplomacy-*/ai-ai-treaty-*/hard-diplomacy*, 270 uruchomień z dublami globa): 236 zielone, 34 czerwone — WSZYSTKIE to testy *-live-* / real-render (wymagają Chromium; brak w środowisku), zero czerwonych testów logiki.
OCENA ZARZUTÓW: 1 (ai.ts ×k granica_kara) — ROZWIĄZANY w kandydacie: ai.ts:1479 używa scalePenaltyForWarLevel; pozycja jawnie w ZADANIU (2), więc odstępstwo od allowlisty uznane za zasadne, odnotowane. 4 i 5 — rozwiązane (W12 na realnym podglądzie, W10b; mutanty M5/M4 czerwone). 6 — akceptowalne, brak regresji logiki. 7 — uwaga projektowa, nie blokuje (poziom ustawiany jawnie przy starcie i wczytaniu w main.ts; stary zapis = Łatwa). 2 i 3 — NIE ZMIERZONO (Chromium niedostępny; runner bez haka poziomu), patrz niżej.
BLOKADY: brak blokad kodowych. NIE ZMIERZONO: (a) dowód z żywego Chromium (ZADANIE 4), (b) bieg 90 tur seed 4242 x3 poziomy i odpowiedź, czy na Trudnej powstają sojusze AI↔AI (ZADANIE 5). Luki wynikają z ograniczeń środowiska, nie z wady kodu; Łatwa (domyślna) jest bit-w-bit jak dziś.
RUNDY: FC po rundzie 2/5
UWAGI-DLA-ORKIESTRATORA: (1) przed deployem na ROBOCZĄ wykonać zaległy pomiar 90 tur x3 poziomy i żywy dowód (VERIFY-LIVE) w środowisku z Chromium; (2) ocena tabeli pomiarów przez właściciela wymaga tego pomiaru; (3) integrować kod z kandydata 379cf050d (sprawdzić merge-base).
NASTĘPNY KROK: integracja orkiestratora; pomiar + żywy dowód jako temat następny.
DEPLOY/PUSH: NIE WYKONANO
