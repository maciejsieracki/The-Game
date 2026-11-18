STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe i minimalny hak; zero zmian zasad, progów i balansu)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1
GOAL: hak odczytowy sojuszy AI↔AI, runner i analizator OFF vs ON, test haka oraz bieg dymny z flagą wymuszoną na czas pomiaru (flaga w danych i w kodzie pozostaje false).
ZMIANY/COMMIT: baza d1dae2355 (origin/main). Kod operatora: commit podany w polu sha w StructuredOutput.
 - gra/src/main.ts: liczniki prób/odmów (skumulowane), `aiAiAllianceMeasureState()` (flaga, wymuszenie, lista sojuszy, sojusze per cywilizacja, wojny AI↔AI), hak `aiAiAllianceTickForTest.state()`, pole `diag.sojusze` w `__aiEconomyMeasure.metrics()` (trafia do każdego wiersza jsonl), wymuszenie pomiaru `window.__civAiAllianceMeasureForce` honorowane WYŁĄCZNIE pod ?civTest=1 (nadpisanie przez setAiAiAllianceTickEnabledForTest).
 - gra/src/game/ai-ai-alliance-tick.ts: tylko liczniki `proby` i `odmowy` w wyniku planera (bez zmiany logiki).
 - gra/tools/ai-ai-alliance-measure-run.cjs (NOWY): wrapper `--alliances 0|1`; uruchamia runner w procesie potomnym z NODE_OPTIONS=--require (łata chromium.launchPersistentContext, init-script ustawia flagę tylko przy 1).
 - gra/tools/ai-ai-alliance-measure-analyze.cjs (NOWY): tabela po polsku, `--off <dir> --on <dir>` albo `--in <dir>`; brak pola = NIE ZMIERZONO, brak zdarzenia = "brak".
 - gra/tools/ai-ai-alliance-measure-hook-test.cjs (NOWY): test statyczny H1..H7 + mutanty M1..M7 (wszystkie wykryte).
 - dowody: dyspozycje/autobot/runs/R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1/dowody/ (jsonl 29 wierszy, summary, run.log).
TESTY:
 - tsc --noEmit: exit 0.
 - logic-test: LOGIC OK (213/213).
 - tech-tree-test: 20 pass, 0 fail.
 - research-test: 33/33.
 - unit-replace-test: 21/21.
 - combat-test: 6/6.
 - ai-ai-alliance-tick-test: suite 19/19, mutanty 8/8.
 - ai-ai-alliance-measure-hook-test: ZIELONY, mutanty wykryte.
 - Bieg dymny: `--alliances 1 --seed 4242 --turns 30` (przez wrapper, bundle poza repo): exit 0, 29 wierszy jsonl, NaN = 0, błędy w run.log = 0. Wynik: flaga=true, wymuszona=true, sojusze AI↔AI = 0 w turach 1-30, próby toru = 302, odmowy = 302 (wszystkie próby odrzucone przez E1 w tym biegu). Wojny AI↔AI = 0.
 - Analizator na tym biegu: "brak" sojuszu i wojny, max sojuszy/cyw. = 0, limit 2 OK.
 - NIE ZMIERZONO: OFF (--alliances 0) nie był uruchamiany w tej rundzie; powody odmów E1 nie są zliczane osobno (tylko łączna liczba); bieg 100-150 tur nie był uruchamiany (zgodnie z zakazem >30 tur).
BLOKADY: brak techniczny. Uwaga: 100% odmów w 30 turach przy domyślnych parametrach sugeruje, że pomiar 100-150 tur jest potrzebny, zanim cokolwiek zaleci się właścicielowi.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (weryfikacja haka, wrappera i analizatora; porównanie OFF vs ON).
DEPLOY/PUSH: NIE WYKONANO

(6) Długie biegi (robi orkiestrator, setsid nohup, poza Bash pierwszego planu; 3 ziarna × 150 tur, OFF i ON, ten sam --profile per ziarno, osobne --out):
  setsid nohup node tools/ai-ai-alliance-measure-run.cjs --alliances 0 --dist <abs-dist-OFF> --profile <abs-profil-OFF-S> --out <abs-OFF> --seed <S> --turns 150 > <abs-log> 2>&1 &
  setsid nohup node tools/ai-ai-alliance-measure-run.cjs --alliances 1 --dist <abs-dist-ON> --profile <abs-profil-ON-S> --out <abs-ON> --seed <S> --turns 150 > <abs-log> 2>&1 &
  Analiza: node tools/ai-ai-alliance-measure-analyze.cjs --off <abs-OFF> --on <abs-ON>
  Ziarna: 4242, 777, 9001 (propozycja). Przebieg wznawialny: ponowne wywołanie z tym samym --out i --profile.
