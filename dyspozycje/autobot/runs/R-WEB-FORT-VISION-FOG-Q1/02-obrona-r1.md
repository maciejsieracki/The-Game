STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-FORT-VISION-FOG-Q1
GOAL: Posterunek (r=3) i fort (r=5) gracza odkrywają i oświetlają całe koło swojego terytorium, tak jak miasto.

ODPOWIEDŹ NA ZARZUTY (baza kodu: `1107cf51a`, kod nietknięty w obronie; zmiana tylko `gra/tools/fort-vision-live.cjs` + katalog runu)
1. PRZYJMUJĘ, pomiar wykonany w żywej grze. Bundle `vite.js build --outDir <scratch poza repo>` (dozwolone wg R-PROC §9 poz. 1) z `420d97ffe` (PRZED) i z `1107cf51a` (PO), Chromium `?playtest=mapa`, haki `__fortTerritoryTestDebug` + `__hotSeatTestDebug.snapshotVisibleState().exploredKeysForActive` (odczyt bez efektów ubocznych). Fort gracza 20 pól od miasta, koło 91 pól, mgła przeliczona realnym ruchem jednostki (`startAnimatedMove` -> `refreshFog`):
   - PRZED: 91/91 pól koła nieodkryte (explored 469).
   - PO: 0/91 nieodkrytych (explored 560).
   Dowód: `evidence/live2-before.json`, `evidence/live2-after.json`. Uwaga: pierwsza próba (automat stawiający fort, 40 tur i wariant 11 miast) nie zbudowała żadnego fortu ani przed, ani po; porzucona na rzecz haka `placeFort`.
2. PRZYJMUJĘ. `autoimprove-live-hooks-test.cjs` uruchomiony (nie wymaga Chromium, tylko esbuild): 37 passed, 0 failed, `gate-live-hooks.txt` EXIT=0.
3. PRZYJMUJĘ częściowo, test behawioralny na żywo dla ścieżki zdobycia/utraty:
   - Zdobycie fortu obcego przez moją jednostkę (`sweepCaptures` -> `sweepFortCaptures`, bez żadnego innego przeliczenia mgły): PO 0/91 nieodkrytych, PRZED 91/91. To dowodzi wywołania `refreshFog` w ścieżce zdobycia.
   - Utrata fortu (wrogi oddział na forcie): nieodkryte 0 przed i 0 po, pola zostają odkryte.
   - Fort obcego nie odsłania mapy: 75 nieodkrytych przed i po (75, nie 91, bo koła fortów 7 pól od siebie nakładają się o 16 pól).
   - NIE_ZMIERZONO: wywołania `refreshFog` w budowie i cofnięciu fortu przez realny panel budowy gracza (main.ts:15087, :14875). Hak `placeFort` omija ten kod; pozostaje przegląd kodu (to samo wywołanie, jedna linia). Brak haka odczytu BIEŻĄCEJ widoczności (tylko `explored`), więc zniknięcie widoczności po utracie pokrywa test jednostkowy `fort-vision-test` (15/0), nie żywa gra.
4. PRZYJMUJĘ, pomiar wpływu na AI. Widoczność AI (`getOwnerVisibleKeysSize`, `currentVisibleForOwner`) dla właściciela z jednym miastem: 91 pól; po postawieniu mu fortu r=5 (rozłączne koło) 182 pól; przed poprawką ta liczba nie zmieniała się (91 i 91). Zmiana jest dokładnie koło fortu, bez efektów ubocznych poza tym. Wpływ na wyniki rozgrywki AI (wygrane, tempo) NIE_ZMIERZONO; pojedynczy bieg 40 tur z wariantem 11 miast nie stawia fortów, więc nie ma na czym porównać. Uzasadnienie zmiany: spójność (AI z fortem widzi jego koło jak z miastem); `ai-fog.ts` bez zmian.
5. POTWIERDZAM i domykam dowodem: `ai-fog-test.cjs` na bazie `420d97ffe` (`git checkout 420d97ffe -- gra/src`) pada identycznie (a3 `toQ` 4 zamiast 6), `gate-ai-fog-baza-420d97ffe.txt`; na `1107cf51a` tak samo (`gate-ai-fog.txt`). Wcześniej istniejąca porażka, niezwiązana z tematem.

TESTY (świeże, ta runda): fort-vision-test 15/0; autoimprove-live-hooks 37/0; żywa gra przed/po jw. Bez zmian względem rundy 1: auto-fort-claim 63/0, auto-fort-diag 17/0, fort-outpost-hard-territory 80/0, river-fog-visibility 31/0, tsc EXIT=0 (kod nietknięty).

DO ŻYWEJ WERYFIKACJI ORKIESTRATORA: ten sam skrypt na bundlu orkiestratora: `ROBOCZA_HTML=<index.html> node gra/tools/fort-vision-live.cjs po`; oczekiwane S1 nieodkryte_po_przeliczeniu_mgly=0, S3 0, S4 0, S2 bez zmian.

BLOKADY: brak. RUNDY: 2/5
NASTĘPNY KROK: Evaluator, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
