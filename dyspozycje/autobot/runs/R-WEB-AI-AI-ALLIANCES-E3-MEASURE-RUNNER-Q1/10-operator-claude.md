STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe i minimalny hak; zero zmian zasad, progów i balansu)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1
GOAL: runda 2 — rozwiązanie konfliktu scalenia main.ts z FALĄ 849 (koalicja antylidera) z zachowaniem obu zmian oraz histogram powodów odmów toru sojuszy AI↔AI.
BAZA: origin/main 472d1e01e3bb227c151a343e9c8eb1766ae04120 (`git merge-base --is-ancestor` = prawda po scaleniu).
ZMIANY/COMMIT: gałąź `r2-ai-alliances-measure` od kodu r1 (aaffff2ef) + `git merge origin/main`; commit scalenia 632235045 (kod + dowody). Commit raportu: SHA w polu sha.
 - gra/src/main.ts: konflikt rozwiązany — zachowany hak `aiAiAllianceTickForTest.state` (r1) ORAZ `setCoalitionEnabled` / `getLiderStan` (FALA 849). Dodany skumulowany histogram powodów odmów (`aiAiAllianceOdmowyPowody`) w `aiAiAllianceMeasureState()` -> `diag.sojusze.powodyOdmow`.
 - gra/src/game/ai-ai-alliance-tick.ts: planer zwraca `powodyOdmow` (klucz = powód E1 z liczbami zastąpionymi przez N). Logika, progi i kolejność bez zmian. ai-ai-coalition.ts nietknięty.
 - gra/tools/ai-ai-alliance-measure-analyze.cjs: sekcja „Powody odmów toru”.
 - gra/tools/ai-ai-alliance-measure-hook-test.cjs: H10a-c, mutanty M8-M9 (łącznie H1..H10c, M1..M9).
 - dowody: dyspozycje/autobot/runs/R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1/dowody/smoke-r2-alliances1-seed4242-t30.{jsonl,summary.json,analyze.txt}.
TESTY (liczby z surowego wyjścia):
 - tsc --noEmit: exit 0.
 - logic-test: LOGIC OK (213/213). tech-tree: 20 pass, 0 fail. research: 33/33. unit-replace-test: 21/21. combat-test: 6/6.
 - ai-unit-replace-same-rules-test: 45/0 (dodatkowy).
 - ai-ai-alliance-tick-test: suite 19/19 OK, mutanty 8/8.
 - ai-ai-coalition-test: błędy 0, mutanty 8/8, WYNIK ZIELONE.
 - ai-ai-alliance-measure-hook-test: WYNIK ZIELONY, wszystkie mutanty wykryte.
 - ai-ai-treaty-evaluate-test: 21 pass / 0 fail, mutanty niewykryte 0.
 - Bieg dymny: `--alliances 1 --seed 4242 --turns 30` na scalonym kodzie, bundle zbudowany poza repo (vite, outDir w scratchpad). Wynik: exit 0, 29 wierszy jsonl, NaN = 0, błędy/wyjątki w logu = 0; flaga=true, wymuszona=true; sojusze AI↔AI = 0; wojny AI↔AI = 0; próby 302, odmowy 302.
 - Histogram powodów odmów (skumulowany, 30 tur): 300 × „gotowość N poniżej progu N” (próg gotowości progSojuszWillingnessMin = 0,54 wg gra/data/diplomacy.json); 2 × „brakuje N PN w skarbcu płatnika”. Zero odmów z: wojna, duplikat, granica, Relacja/Zaufanie, sojusz z wrogiem.
BLOKADY: brak techniczny.
NIE ZMIERZONO: rozkład wartości gotowości (willingness) per para — histogram liczy tylko powód, nie wartość; OFF (--alliances 0) w tej rundzie nie uruchamiany; biegi 100–150 tur nie uruchamiane (zakaz >30 tur w Operatorze).
WNIOSEK (do decyzji FC/orkiestratora, bez zmiany progów): w dymnym biegu 100% odmów to bramka gotowości (willingnessAlly < 0,54). Sojusze nie powstają, bo gotowość par nie osiąga progu w 30 turach. To jest wynik pomiaru, nie błąd haka.
RUNDY: 2/5
NASTĘPNY KROK: Final Control (weryfikacja scalenia: `git diff origin/main` ogranicza się do haka, histogramu i narzędzi; bramki jak wyżej).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
 - Długie biegi (robi orkiestrator, setsid nohup, poza Bash pierwszego planu; ziarna 4242, 777, 9001 — propozycja; 150 tur, OFF i ON, osobne --out i --profile per ziarno):
   setsid nohup node tools/ai-ai-alliance-measure-run.cjs --alliances 0 --dist <abs-dist-OFF> --profile <abs-profil-OFF-S> --out <abs-OFF-S> --seed <S> --turns 150 > <abs-log> 2>&1 &
   setsid nohup node tools/ai-ai-alliance-measure-run.cjs --alliances 1 --dist <abs-dist-ON> --profile <abs-profil-ON-S> --out <abs-ON-S> --seed <S> --turns 150 > <abs-log> 2>&1 &
   Analiza: node tools/ai-ai-alliance-measure-analyze.cjs --off <abs-OFF-S> --on <abs-ON-S>
 - Bundle: node ./node_modules/vite/bin/vite.js build --outDir <POZA repo> --emptyOutDir (w gra/, po npm ci --ignore-scripts).
