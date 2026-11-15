# R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1 — obrona Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora 3f901679b)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1
GOAL: żetony widoku miasta min. 12 px; przy wąskim oknie (1280–1366 px) zawijanie do max 2 linii zamiast kurczenia; 1920 bez regresji.
BAZA: b97287c88 (origin/main 392aa14c1 ma go jako przodka). Kandydat startowy: a731491091dfe7e64baab09fd72c05d5f87bed92.
ZMIANY/COMMIT:
- 52274ce01 — gra/tools/city-view-layout-test.cjs (jedyny plik kodu zmieniony w tej obronie). cityUxFrame.ts NIE zmieniony względem kandydata.
- Allowlista: gra/tools/city-view-layout-test.cjs i ten raport.
- gra/node_modules w tym worktree to symlink do node_modules worktree wf_49b458b2-768-2 (git-ignorowany, nie commitowany).

ODPOWIEDZI NA ZARZUTY:
1. (zawijanie przy normal 1280/1366) — ODRZUCAM z założeniem. Kryterium właściciela (ABC 2026-11-15, A): żetony „układają się w drugiej linii zamiast się kurczyć do ~11 px". Przy fixture normal żetony mają 15.0 px (1280) i 16.2 px (1366) w jednej linii — nic nie kurczy się poniżej 12 px, więc zawijanie nie jest potrzebne. Dowód: INFO 1280x720/normal „zeton 15.0 px”, 1366x768/normal „zeton 16.2 px” (oba PASS). Założenie: kryterium (b) czytam jako „zawijanie zamiast kurczenia w wąskim oknie”. Do decyzji właściciela (nie blokuje): czy zawijać zawsze przy 1280/1366, nawet bez kurczenia.
2. (osłabione asercje) — PRZYJMUJĘ częściowo. Dodano asercję wymuszającą zawijanie przy 1280x720/big i 1366x768/big: co najmniej jeden baner ma 2 linie (check „wąskie okno, duże liczby — co najmniej jeden baner zawinięty do 2 linii”). Limit 92 px dla paneli przy 2 liniach zostaje (zmierzone 84 px i 76 px). Asercja „jedna linia” od 1600 px zostaje.
3. (mutant bez progu 12 px) — PRZYJMUJĘ. Dodano tryb `--mutant-min`. Uwaga: sam próg 12 px nie jest widoczny w fixture (etap 2 zawija, zanim żeton zejdzie poniżej 12 px; usunięcie samego progu daje 13.7 px i 16.2 px, PASS). Dlatego mutant wyłącza próg ORAZ zawijanie (TOP_CHIP_MIN_PX=0, TOP_CHIP_MAX_ROWS=1), czyli stan sprzed poprawki, tak jak mutant Evaluatora.
4. (informacyjny: SHA bazy) — przyjęte do wiadomości. Baza = b97287c88 (przodek origin/main). Nie powtarzałem merge-tree z origin/main.

TESTY (surowe wyniki, uruchomione w tej rundzie):
- `node tools/city-view-layout-test.cjs` (kod = kandydat, test po zmianie): PASS=168 FAIL=0
- `node tools/city-view-layout-test.cjs --mutant-min`: PASS=165 FAIL=3. FAIL: 1366x768/big „co najmniej jeden baner zawinięty” ({"L":1,"R":1}); 1366x768/big i 1280x720/big „żetony nie mniejsze niż 12 px” ({"px":10.9824}). INFO 11.0 px, skala 0.44.
- `node tools/city-view-layout-test.cjs --mutant` (bez klasy zawijania): PASS=164 FAIL=4 (dwie asercje wrapu i dwie asercje 12 px przy 1366/1280 big).
- `npx tsc --noEmit` (gra/): exit 0.
- `git diff --check`: exit 0.
- Nie uruchamiałem ponownie bramek logicznych ani testów cityUxFrame/side-panels. Kod gry nie zmienił się względem kandydata, który Evaluator zmierzył zielono (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, city-side-panels 61/0, left-banner-overflow 74/0, kolor-surowce 34/34, hud-miasto-stock 71/0). To założenie oparte na raporcie Evaluatora, nie na pomiarze tej rundy.

BLOKADY: brak. Dług bazowy poza zakresem (Evaluator): build-panel-ulepszenia-scroll-real-render-test G2b, 1 FAIL, ten sam wynik bez zmian kandydata.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control na 52274ce01 (kod gry = a731491, test = 52274ce01).

UWAGI-DLA-ORKIESTRATORA:
- Nie mierzono: pełna gra w turze, zmiana rozmiaru okna w locie, zrzuty do oglądu (w tej rundzie nie generowano nowych zrzutów).
- Decyzja właściciela otwarta (nie blokuje): normal 1280/1366 zostają w jednej linii (15–16 px); zawijanie tylko przy kurczeniu.
- Dispatch podaje bazę 8df0bc275, która nie jest przodkiem kandydata; orkiestrator decyduje przy integracji.
- Sprzątanie po integracji: symlink gra/node_modules w worktree wf_49b458b2-768-3 (wskazuje na node_modules w wf_49b458b2-768-2).
- DEPLOY/PUSH: NIE WYKONANO
