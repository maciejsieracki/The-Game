STATUS: PASS-WITH-NOTES
DOMAIN: GAME (POMIAR; kod gry NIE zmieniany)
TEMAT: R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1
GOAL: pomiar 3 poziomów „Dyplomacja i wojna” (latwa/normalna/trudna), seed 4242 i 7, 90 tur, co 5; dokument analizy; pin B2b.
ZMIANY-COMMIT: kod runnera i testu B2b były w e5edebb45 (bez zmian w tej rundzie). Ta runda: dyspozycje/analizy/POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md (nowy), 6 plików runs/R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1/seed<S>-all1-lvl-<poziom>.jsonl.gz (dane surowe, 18 wierszy na bieg), ten raport. Commit: patrz SHA w odpowiedzi.

ODPOWIEDZI NA ZARZUTY EWALUATORA (1f26e88ec):
1. Brak dokumentu POMIAR-... — PRZYJMUJĘ; dokument powstał (dyspozycje/analizy/POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md).
2. Tylko 1 z 6 biegów, do tury 75 — PRZYJMUJĘ; wykonano wszystkie 6 biegów do tury 90 (4242 i 7 × latwa/normalna/trudna).
3. Brak dowodu bramek — PRZYJMUJĘ; zmierzono ponownie na bieżącym bundlu (wyniki poniżej).
4. Chromium pada przy --diplo-level normalna/trudna — PRZYJMUJĘ; awarie są przerywane (SIGSEGV przy starcie nowej gry lub wczytaniu slotu), ale NIE są specyficzne dla poziomu: latwa tą samą ścieżką również padał (6–15 komunikatów BLAD na bieg). Obejście: MEASURE_CHROME_ARGS="--mute-audio" i ponawianie odcinka ze slotu co 5 tur. Przyczyna źródłowa NIE ZMIERZONO.

TESTY (surowe wyniki):
- tsc --noEmit: EXIT 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- diplomacy-harder-measure-hook-test (bundle z main): WYNIK 21 zielonych, 0 czerwonych (B2b zielony: domyślnie ON)
- diplomacy-all-flags-measure-hook-test (bundle): WYNIK TESTU 35 zielonych, 0 czerwonych
- diplomacy-measure-resume-test: część P 8/8 zielonych; części R i C NIE ZMIERZONO (dwie próby --run 1 przerwane awarią Chromium przy pierwszym świeżym biegu)

WYNIK POMIARU (tury 30/60/90; szczegóły w dokumencie analizy):
- Sojusze AI↔AI w szczycie: Łatwa 12 (4242) i 11 (7); Normalna 0 i 7; Trudna 0 i 2.
- Trudna: sojusze AI↔AI powstają tylko w ziarnie 7 (2 pary, tura 90).
- Zerwania zero-zaufania (kumulatywnie, tura 90): Trudna 104 / 22, Normalna 38 / 22, Łatwa 22 / 2.
- Wojny w turze 60: Trudna 7 / 5, Normalna 4 / 4, Łatwa 4 / 2; w turze 90 zbliżone. Brak jednoznacznego kierunku.
- Wyeliminowane cywilizacje: 0 w każdym biegu.

BLOKADY: brak blokady merytorycznej. Ograniczenia: 2 ziarna, 1 bieg na poziom, próbkowanie co 5 tur; pełna część R/C testu wznowienia NIE ZMIERZONO; przyczyna awarii Chromium NIE ZMIERZONO.
DYSK: df / przed startem 8,1 GB (po budowie bundle 8,1 GB). node_modules podlinkowany ln -s z /home/user/meas/gra/node_modules (poza commitem). Bundle i dane robocze w scratchpad, nie w repo.

RUNDY: 2/5 (runda 1 BLOCK, runda 2 obrona)
NASTĘPNY KROK: orkiestrator — ponowny Evaluator/Final Control na tym SHA; pytanie właściciela z KOLEJKI o sojusze AI↔AI na Trudnej pozostaje otwarte (dane: tak, w jednym z dwóch ziaren).
DEPLOY/PUSH: NIE WYKONANO
