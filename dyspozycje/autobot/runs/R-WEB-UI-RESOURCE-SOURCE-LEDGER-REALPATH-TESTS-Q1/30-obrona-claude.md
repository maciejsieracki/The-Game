STATUS: PASS-WITH-NOTES (4 zarzuty Evaluatora: 2 PRZYJETE z poprawką, 1 PRZYJETA z dowodem luki bez naprawy, 1 PRZYJETA jako uwaga bez zmiany kodu)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-REALPATH-TESTS-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora r1 (commit 09897ff67, raport 20-evaluator-claude.md) poprawkami z dowodem albo dowodem luki; kandydat bazowy 2ee7214ff.
ZMIANY/COMMIT: baza 2ee7214ffba0ba121ff8708939785ea980c97ebf (r1). Zmieniono tylko pliki allowlisty:
- gra/tools/resource-ledger-realpath-live-test.cjs: (zarzut 1) domyslnie `--turns 30` zamiast `30,60`; nowa asercja `rozmiar: kazdy zadany pomiar tur osiagniety bez przerwania endTurn` (kazdy pomiar: doneTurns >= targetTurns i brak `stuck`; liczba pomiarow = liczba celow). Przerwany endTurn daje FAIL, nie zielono.
- gra/tools/resource-ledger-realpath-mutation-test.cjs: (zarzut 3) dodana mutacja m09b (pominiecie zapisu odbiorcy daru: `recordStockDeltaToPending(toOwnerId, ledgerToBeforeB,`), oraz m17 (zarzut 2: bunt w petli tury zamieniony na gola zmiane wlasciciela `city.ownerId = REBEL_FACTION_OWNER_ID;`).
- gra/src/main.ts: NIE ZMIENIONO (sprawdzone: git status czysty po mutacjach, runner przywraca plik).
- Commit: SHA w polu sha odpowiedzi (commit tylko tych trzech plikow i tego raportu).

ODPOWIEDZI NA ZARZUTY:
Zarzut 1 (rozmiar po ~60 turach, test zielony mimo timeoutu): PRZYJMUJĘ, poprawka wykonana.
  - Dowod, `--part size` (domyslnie 30 tur, seed 7): `rozmiar po 30 turach (tura gry 31): pamiec wszyscy=121882 B (119.0 KB), POLE ZAPISU=16821 B (16.4 KB)`; `RESULT: 4 passed, 0 failed` (w tym `kazdy zadany pomiar tur osiagniety` ok).
  - Dowod negatywny, `--part size --turns 30,60`: `PRZERWANO: endTurn timeout at turn 31`; `FAIL rozmiar: kazdy zadany pomiar tur osiagniety bez przerwania endTurn :: [{"target":60,"turnsDone":30,"stuck":"endTurn timeout at turn 31"}]`; `RESULT: 3 passed, 1 failed`; exit 1.
  - Stan: pomiar po 30 turach ZMIERZONO. Pomiar po ~60 turach NIE ZMIERZONO (endTurn wisi przy turze 31 w tej scenie; czesc B). Wartosc 107-122 KB pamieci dla wszystkich wlascicieli nadal dotyczy tylko 12/30 tur i nie jest dowodem dla 60.
  - Znany kosmetyczny efekt: po przerwaniu druga linia logu raportuje `tura gry 1` (odczyt po timeoutcie); flaga PRZERWANO jest poprawna. NIE NAPRAWIANE (bez wplywu na werdykt).

Zarzut 2 (wywolanie buntu w petli tury main.ts nie jest pokryte; mutacja gola zmiany wlasciciela przezyje): PRZYJMUJĘ jako LUKE; NIE NAPRAWIONE w tej rundzie.
  - Dowod, `--part sources --only bunt` po mutacji m17 (`transferCityToRebelFactionWithLedger(city);` -> `city.ownerId = REBEL_FACTION_OWNER_ID;`, main.ts ~41917): `[m17] PRZEZYLA (test zielony mimo mutacji!)`; `MUTACJE: zabite=0 przezyly/bledy=1`. Potwierdzenie zarzutu, mutacja nie jest zabita.
  - Dlaczego nie naprawione: test moze wejsc w petle tury tylko przez wymuszenie buntu (updateRevoltGrace + porzadek publiczny w pętli, main.ts ~41861-41917). Wymaga to osobnego haka sterujacego porzadkiem publicznym miasta w realnej turze, czego ten temat nie dostarcza. Dopisanie samej asercji bez haka dawaloby falszywy dowod. ZALOZENIE: luka pozostaje otwarta do decyzji FC/orkiestratora (kandydat do osobnego tematu testowego).

Zarzut 3 (mutacje jednostronne; m09 tnie tylko nadawce daru): PRZYJMUJĘ, poprawka wykonana.
  - Dodana m09b (strona odbiorcy: `recordStockDeltaToPending(toOwnerId, ledgerToBeforeB,`).
  - Dowod, `--ids m09b` na realnym buildzie (bundle vite w scratchpadzie): `[m09b] ZABITA (exit 1) — pominiecie daru/umowy (strona odbiorcy) :: FAIL dar: odbiorca ma wpis „Dar od …” (dar)`; `MUTACJE: zabite=1 przezyly/bledy=0`.

Zarzut 4 (test realnej sciezki nie wchodzi do zadnej automatycznej bramki; trade-test bez 7j/7k): PRZYJMUJĘ jako UWAGE, bez zmiany kodu.
  - Zgadzam sie, ze regresje wycinki i zrodel wykrywa tylko reczne uruchomienie `resource-ledger-realpath-live-test.cjs` (Chromium + bundle vite). Dodanie do bramki wymaga decyzji orkiestratora (koszt czasu i Chromium). Zostaje w UWAGI-DLA-ORKIESTRATORA.

TESTY (liczby z surowego wyjscia, uruchomione w tej rundzie na 2ee7214 + poprawki):
- npm ci w gra/: `added 71 packages`, exit 0.
- `npx tsc --noEmit`: brak wyjscia, exit 0 (0 bledow).
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test: `All sanity checks passed.`, exit 0.
- resource-ledger-test: `1030 passed, 0 failed`; engine: `20 passed, 0 failed`; consume: `30 passed, 0 failed`; trade: `RESULT: 27 passed, 0 failed`; owner-delta: `RESULT 8 passed, 0 failed`; save-history: `15 passed, 0 failed`; skad-dom: `9 passed, 0 failed`; skad-ui: `18 passed, 0 failed` (wszystkie exit 0).
- vite build (bez npm run build, poza repo, scratchpad): exit 0, `built in 29.03s`.
- realpath `--part sources` (realny build): `RESULT: 45 passed, 0 failed`, exit 0.
- realpath `--part size` (domyslnie 30): `RESULT: 4 passed, 0 failed`, exit 0.
- realpath `--part size --turns 30,60`: `RESULT: 3 passed, 1 failed`, exit 1 (oczekiwane, patrz zarzut 1).
- mutacje: m09b ZABITA; m17 PRZEZYLA (oczekiwane, zarzut 2).
- NIE PONOWIONO: m01–m16 z r1 (czesci sources/wycinka/save bez zmian kodu testu; m16 uzywa `--turns 12` i nowa asercja nie moze jej uratowac). Wyniki r1 nie sa tu zmierzone ponownie.
- wycinka i save: NIE URUCHAMIANO ponownie w tej rundzie (nie zmieniono ich czesci; wyniki r1: wycinka 5/0, save 8/0).
- git diff --check: czysty (exit 0).
- git status przed commitem: tylko 2 pliki allowlisty + ten raport.

BLOKADY:
- Pomiar rozmiaru po ~60 turach: NIE ZMIERZONO (endTurn timeout przy turze 31 w scenie gracz + 5 AI; czesc B).
- Luka mutacyjna m17 (bunt w petli tury): NIE NAPRAWIONA; wymaga haka sterujacego porzadkiem publicznym.
- Bramka: realpath-live-test nie jest automatyczna (zarzut 4, uwaga).

RUNDY: 2/5 (po r1 Operator, runda obrony odpowiada na zarzuty Evaluatora r1)
NASTĘPNY KROK: Evaluator r2: sprawdzic (a) poprawke asercji rozmiaru (`--part size` zielono, `--turns 30,60` czerwono), (b) m09b ZABITA, (c) m17 PRZEZYLA jako udokumentowana luka; decyzja FC czy luka m17 blokuje.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Pomiar 60 tur (czesc B) nadal wymaga diagnozy zwisu endTurn przy turze ~31 (ziarno 7) i ~45 (ziarno 2024).
2. Luka m17 (bunt w petli tury): kandydat na osobny temat testowy z hakiem sterujacym porzadkiem publicznym miasta w realnej turze.
3. Realpath-live-test nie jest w zadnej automatycznej bramce; decyzja o wpieciu (czas, Chromium) po stronie orkiestratora.
4. Scieżka: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/civ-ledger-dist (bundle) i .../civ-ledger-mut (mutacje) sa poza repo; do usuniecia po FC.
