STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q2
GOAL: domknąć pozycje 1–2 (limity wojen z graczem i sojuszy AI↔AI) na maksimum (Trudna, Wysoki ×4, flagi ON, Kultura trudny) na bazie origin/main e6f3fd4b6; pozycje 3–5 → VLIVE3; dane w repo; bramki uruchomione.
BAZA: origin/main e6f3fd4b6d98799a2d622546a1863af77541552a. `git merge-base --is-ancestor e6f3fd4b6d98799a2d622546a1863af77541552a HEAD` = tak (HEAD = czubek obrony, patrz ZMIANY-COMMIT).
ZMIANY-COMMIT: patrz sekcja „Odpowiedzi na zarzuty” i commit podany w polu sha. Zmiany: przeniesione pliki pracy z 522f5cb929f121cfc5b680d7305591f6c3fea1b3 (runner gra/tools/diplomacy-harder-measure-run.cjs z opcjami --unit-pace/--culture i readbackiem; dokument dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md; katalog dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/ z danymi starej bazy 01795c329), korekta dokumentu, ten raport. Zero zmian gra/src, gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.
TESTY (własne, surowe wyjście, na e6f3fd4b6; gra/ po `npm ci`, 71 pakietów):
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`
- Live (runner, seed 4242/7, 150 tur na e6f3fd4b6): NIE ZMIERZONO — patrz BLOKADY.

Odpowiedzi na zarzuty Evaluatora:
1. Kandydat identyczny z bazą (0 plików). PRZYJMUJĘ. Commit obrony zawiera pliki pracy przeniesione z 522f5cb92 (zgodnie z KOREKTĄ BAZY w dispatchu). Diff względem e6f3fd4b6 jest niezerowy i ograniczony do allowlisty.
2. Brak dokumentu dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md w main. PRZYJMUJĘ. Dokument przeniesiony z 522f5cb92 i skorygowany (baza, poziom kultury, sekcja KOREKTA). Dokument jest w tym commicie.
3. Brak surowych danych rundy 2 w main. PRZYJMUJĘ, z zastrzeżeniem: przeniesione dane (katalog dane/) pochodzą z bazy 01795c329, NIE z e6f3fd4b6. Są oznaczone jako „stara baza” i NIE liczą się jako wynik rundy 2 na bieżącej grze.
4. Brak pomiarów pozycji 1–2 na e6f3fd4b6 (seed 4242 i 7, t150, Łatwa/Normalna t100). PRZYJMUJĘ jako NIE ZMIERZONO z powodem (patrz BLOKADY). Nie podaję żadnego wyniku liczbowego dla e6f3fd4b6.
5. Brak raportu bramek na kandydacie. PRZYJMUJĘ. Bramki uruchomione na e6f3fd4b6 (wyżej, surowe wyjście).
6. Runner w main bez rozszerzeń z 522f5cb92 (--unit-pace/--culture, pole deklarującego). PRZYJMUJĘ dla opcji --unit-pace/--culture (przeniesione, readback w openGame, domyślne wartości = dotychczasowe zachowanie). Pole deklarującego wojnę: NIE DA SIĘ dodać w runnerze. Dowód: `DiploPairMeta` (gra/src/game/diplomacy-pn-engine.ts:74) przechowuje tylko `wojnaOdTury` (turę ostatniego wypowiedzenia), bez identyfikatora deklarującego; hak `__diploHarderMeasure.metrics()` (gra/src/main.ts:34411–34450) nie zwraca deklarującego. Dodanie pola wymaga zmiany gra/src (zakazane w tym temacie) → osobna decyzja.

Dodatkowe korekty (wykryte przy weryfikacji danych):
- Obrona R1 twierdziła, że `culture=trudny` jest w run-seg-t20.txt i run-seg-t120b.txt dla seeda 4242. PRZYJMUJĘ FC: grep po katalogu dane/ pokazuje `culture=trudny` tylko w seed7-max-trudny/run-seg-t20.txt i run-seg-t40.txt (2 wystąpienia). Twierdzenie o seedzie 4242 było błędne i zostaje wycofane. Seed 4242 w danych starej bazy był na Kulturze „latwy”.
- Pozycja 1 (41 tur z >1 wojną naturalną z graczem, t40–80): nie rozstrzygnięta. Bez pola deklarującego nie da się odróżnić wojny wypowiedzianej przez autopilota gracza od wojny AI. Wynik to obserwacja, nie dowód naruszenia.

BLOKADY:
- Pomiary na e6f3fd4b6 (pozycje 1–2) — NIE ZMIERZONO, powód: (a) obciążenie maszyny: `uptime` 08:09:48 load 8,80; 08:10:27 load 7,25; 08:11:29 load 8,82 (ponad próg 8 z dispatchu: „przy load > 8 poczekaj/przełóż pomiar, nie wymuszaj”); (b) bieg 150 tur wymaga segmentowania ≤25 tur z wznowieniami przy SIGSEGV Chromium (dispatch), a w tej rundzie nie uruchomiono ani jednego segmentu na e6f3fd4b6 — przełożone na następną rundę.
- Porównanie Łatwa/Normalna do t100 — NIE ZMIERZONO (ten sam powód co wyżej).
- Pole deklarującego wojnę — NIE ZMIERZONO, powód techniczny: brak danych w grze (patrz zarzut 6); wymaga zmiany gra/src → decyzja orkiestratora (osobny temat).
- Pozycje 3–5 — → VLIVE3 (osobny temat), zgodnie z dispatchem rundy 2.
- Wynik analizy `analiza-limitow-q2.py` na danych starej bazy: patrz dokument, oznaczone jako „stara baza”.

RUNDY: 2/5 (runda obrony Operatora po FC r1 FAIL; ta runda nie zamyka pozycji 1–2).
NASTĘPNY KROK: (1) FC ponownie: sprawdzić allowlistę i bramki; (2) osobny temat VLIVE2-LIVE na e6f3fd4b6 (wykonać seed 4242 i 7 t2–150 z `--diplo-level trudna --all-flags 1 --unit-pace wysoki --culture trudny`, segmenty ≤25 tur, start tylko przy load ≤8); (3) decyzja orkiestratora: czy dopisać pole deklarującego (zmiana gra/src: DiploPairMeta + hak metrics) — wymaga decyzji, bo dispatch zakazuje zmian gra/src; (4) VLIVE3 dla pozycji 3–5.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (a) `npm ci` w gra/ wykonano w worktree (node_modules nie jest w commicie); (b) log ai-test zapisany poza repo i usunięty; (c) status BLOCK, nie PASS: pozycje 1–2 bez pomiaru na bieżącej bazie.
