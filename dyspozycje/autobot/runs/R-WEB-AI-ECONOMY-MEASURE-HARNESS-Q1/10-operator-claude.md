STATUS: FAIL (kryteria a, b, d zielone; kryterium c — wznowienie = skrót ciągły — CZERWONE; przyczyna po stronie gry, poza allowlistą)
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; bez zmian logiki gry)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: (1) metryki ekonomii AI per owner per tura w haku civTest; (2) runner wznawialny 100+ tur z zapisem co N tur; (3) obejście bramki NNS gracza z jawnym licznikiem; (4) dowód 100 tur ×2 ziarna + test wznowienia; (5) instrukcja uruchomienia dla #415.
BAZA: 5f18f4d42a872dd6f425227142f75afc97bb6e6e (origin/main, FALA 746). Kod operatora: commit na gałęzi detached, SHA w polu sha raportu (git log -1).

ZMIANY/COMMIT:
- gra/src/main.ts — WYŁĄCZNIE nowy blok `window.__aiEconomyMeasure` (metrics(), tylko odczyt) wewnątrz istniejącego bloku `if (civTest=1)` przed `__nnsMeasureDebug`. Bez ?civTest=1 brak obiektu (test negatywny zielony). Zero zmian logiki gry.
- gra/tools/ai-economy-measure-run.cjs — runner wznawialny (start newgame przez __nnsMeasureDebug.startGame; checkpoint quickSave co --every tur; wznowienie loadSlot; obejście bramki NNS przez grantPlayerGold/grantPlayerFood z licznikami; wykonanie auto-bitew jako gracz z licznikiem battlesAuto; wyłączenie zwycięstwa suppressVictoryForTest; tryb --resume-test).
- gra/tools/ai-economy-measure-hook-test.cjs — test haka (kształt, kontrola negatywna, mutacja czerwona).
- gra/tools/ai-economy-measure-README.md — jedno polecenie + ograniczenia.
- dyspozycje/autobot/runs/R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1/evidence/ — JSONL 100 tur ×2 ziarna, summary, log testu haka, wynik testu wznowienia i diff migawki tury 41.
- NIE zmieniano: WERSJE.md, manifest, gra-robocza/, rust-port/, gra/data, logika gry, `npm run build/dev` (build wyłącznie vite do katalogu w scratchpad).

TESTY:
(a) hook — tools/ai-economy-measure-hook-test.cjs: 4/4 ZIELONE (kształt 7 właścicieli z komplet pól i typami; niezmierzone zawiera przychodNaTure; brak haka bez ?civTest=1; mutacja z nieistniejącym polem CZERWONA). Log: evidence/hook-test.log.
(b) przebieg 100 tur ×2 ziarna (start: prawdziwa nowa gra __nnsMeasureDebug.startGame, bez scenariusza playtest; z wznowieniem po turze 50):
    | seed | tura końcowa | tury z aktywną bramką NNS gracza | dosypki | auto-bitwy | czas (suma przebiegów) |
    | 4242 | 100 | 0 | 0 | 0 | 58 s (30 s + 28 s, dwa wywołania) |
    | 777  | 100 | 0 | 0 | 0 | 64 s (31 s + 33 s, dwa wywołania) |
    JSONL: evidence/seed4242-100t.jsonl (99 wierszy, tury 2..100, ciągłe), evidence/seed777-100t.jsonl (99 wierszy, 2..100, ciągłe).
    Uwagi: w pierwszym przebiegu bez suppressVictory gra kończyła się zwycięstwem w turze ~49/80 (timeout endTurn); po wyciszeniu zwycięstwa (jak trade-runner) przebiegi domykają 100 tur. Przebieg jednorazowo zatrzymał się w turze 2 na oknie bitwy auto (cannot-end) — dodano rozstrzyganie okien bitew jak gracz (licznik battlesAuto); w obu finalnych przebiegach 0 takich zdarzeń.
    Wynik wzgl. dispatchu: bramka NNS NIE była aktywna w żadnej turze (0/99 na każdym ziarnie) przy domyślnych podatkach 30/60/10 i starcie newgame; dispatch opisywał blokadę w t1 (sprzed zmian w prognozie) — NIE ZMIERZONO, czy bramka blokuje w innym ustawieniu. Ścieżka dosypek NIE została przez to uruchomiona w przebiegu na żywo (bypass applied = 0): działanie dosypek NIE ZMIERZONO.
    Turn 57 (t57 timeout z dispatchu): w tych przebiegach nie wystąpił (przebiegi do 100 bez timeoutu endTurn). Pierwotna przyczyna t57 — NIE ZMIERZONO (nie badano w tym temacie; patrz #418).
(c) wznowienie — tools/ai-economy-measure-run.cjs --resume-test 1 (seed 4242, zapis w turze 40, porównanie tur 41..50): 0/10 zgodnych (allEqual=false). Skróty ciągłe = skróty z przebiegu referencyjnego (tury 2..40 identyczne 39/39, więc zwykła deterministyczność przebiegu jest zielona). Po wznowieniu rozjazd od tury 41.
    Diagnoza (migawka tury 41, evidence/resume-t41-snapshot-diff.txt): 4 różnice:
      * cities[0]/podzialPracy — brak po wznowieniu (zapis gry nie zawiera city.podzialPracy; grep: brak w src/game/save.ts),
      * cities[0]/wealthState/pula 1.82 vs 1.26,
      * gracze[0][1]/nauka 112 vs 112.5, skarbiec 251 vs 254.
    Wniosek: zapis/odczyt gry nie odtwarza podziału pracy miasta, co zmienia ekonomię od pierwszej tury po wznowieniu. To błąd po stronie gry (save.ts / odczyt miasta), NIE harnessu, i jest poza allowlistą tematu (logika gry). Harness nie maskuje różnicy.
    Mutacja (dosypka 1 zł po wznowieniu): NIE URUCHOMIONA — czerwień jest już osiągnięta realnym porównaniem; mutacja nie wnosiłaby informacji. Flaga --mutant 1 zostaje w runnerze.
(d) bramki referencyjne (po npm ci w worktree, gra/):
    - tsc --noEmit: EXIT 0 (bez błędów)
    - logic-test.cjs: LOGIC OK (213/213)
    - tech-tree-test.cjs: 20 pass, 0 fail
    - research-test.cjs: PASSED 33 / FAILED 0 / TOTAL 33
    - unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21)
    - combat-test.cjs: COMBAT TEST 6/6 pass
    - resource-ledger-hook-gate-test: NIE ZMIERZONO — skrypt nie istnieje w bazie 5f18f4d42 (grep po repo: brak pliku; występuje tylko w dispatchu).
    - git diff --check: patrz sekcja poniżej (wykonane przed commitem).

BLOKADY:
1. Kryterium (c): wznowienie nie odtwarza stanu gry — przyczyna: podzialPracy miasta nie w zapisie (patrz diagnoza). Wymaga decyzji właściciela/tematu gry (zapis + odczyt podziału pracy, ewentualnie domyślna wartość przy odczycie). DECISION_REQUIRED: czy domyślny podział po wczytaniu ma być zgodny z zapisanym (wymaga zmiany save.ts — poza tym tematem).
2. Bramka NNS: 0 aktywnych tur w 2 ziarnach — nie potwierdzono zjawiska z dispatchu; ścieżka dosypek nieprzetestowana na żywo.
3. Właściciele AI: w obu przebiegach 0 miast i 0 jednostek przez 100 tur (sprawdzone w JSONL). Pomiar obejmuje realnie tylko gracza. Przyczyna NIE ZBADANA (AI owners istnieją w info().aiOwners, brak osad). Bez tego #415 (utrzymanie armii AI) nie da się zmierzyć.
4. Przychód/utrata na turę: NIE ZMIERZONO (brak zweryfikowanego źródła w grze; oznaczone w polu niezmierzone).

NASTĘPNY KROK:
- Orkiestrator: (a) zdecydować o temacie naprawy zapisu podziału pracy (save.ts) — to warunek kryterium (c); (b) osobny temat diagnozy AI bez osad w harnessie (#415 zależy od tego).
- Po zmianie zapisu: ponowić `--resume-test 1 --turns 50 --save-at 40` (oczekiwane allEqual=true).

DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi detached; bez push na main).

SPRZĄTANIE: gra/node_modules i katalogi buildu w scratchpad usuwane po zapisaniu commita (patrz końcowy komunikat).

UWAGI-DLA-ORKIESTRATORA:
- Nie utworzono żadnych sesji, zadań ani harmonogramów.
- Tryb przeglądarki: /usr/bin/chromium (Chromium 141) przez playwright (bez pobierania przeglądarki).
- Zapis migawek (SNAP_DUMP) służy wyłącznie diagnostyce; w domyślnym uruchomieniu nie zapisuje plików poza --out.
- Znalezisko poza zakresem: hak __nnsMeasureDebug.setPlayerGranary wymieniony w dispatchu NIE istnieje w tym bazowym commicie (nie użyto).
