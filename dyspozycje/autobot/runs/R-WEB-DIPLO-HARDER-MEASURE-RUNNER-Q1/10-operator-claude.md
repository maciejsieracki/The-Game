# R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe + hak odczytowy; zero zmian zasad, progów, balansu; flaga OFF domyślnie)
TEMAT: R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1
GOAL: runner i analizator pomiaru „twardszej dyplomacji” OFF vs ON w żywej grze, do decyzji ABC o włączeniu flagi.
BAZA: 6b6d866aa (origin/main), detached.

ZMIANY-COMMIT: SHA w polu sha wyniku. Pliki:
- gra/src/main.ts: hak `window.__diploHarderMeasure` (tylko ?civTest=1): `setEnabled` (jedyny zapis: setHarderDiplomacyEnabledForTest), `isEnabled`, `metrics` (tylko odczyt). Import +1 symbol. Brak zmian w logice tury.
- gra/tools/diplomacy-harder-measure-run.cjs: wrapper; eksporty z ai-economy-measure-run.cjs (plik NIE zmieniany); flaga `--harder` ustawiana po startGame, przed endTurn.
- gra/tools/diplomacy-harder-measure-analyze.cjs: porównanie OFF/ON, tabela po polsku.
- gra/tools/diplomacy-harder-measure-hook-test.cjs: test haka.
- raport oraz dowody/ (wycinki, summary, wynik analizy).

TESTY (surowe wyniki):
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213). tech-tree-test: 20 pass, 0 fail. research-test: 33/0. unit-replace-test: 21/21. combat-test: 6/6. diplomacy-harder-unit-test: PASS 50 FAIL 0. diplomacy-test: 149 passed, 0 failed.
- diplomacy-harder-measure-hook-test: 14 zielonych, 0 czerwonych (A1–A7 walidator, mutacje A2–A7 odrzucone; B1–B4 w przeglądarce, bundle poza repo).
- Bundle: vite build do katalogu poza repo (exit 0); `npm run build/dev` nie użyte.
- Bieg dymny seed 4242, 20 tur, --harder 0 i --harder 1: 19 wierszy (tury 2–20), stop=null, brak NaN w jsonl (grep: 0). Wall 144 s / 118 s. Wycinki w dowody/.

BLOKADY: brak blokad kodu. Ograniczenia:
- NIE_ZMIERZONO: efekt ON vs OFF na Zaufanie, wojny i NAP nad 20 turami — bieg dymny nie sięga tur 25/50/75/100, więc analizator pokazuje NIE_ZMIERZONO.
- NIE_ZMIERZONO: w smoke brak sąsiadów (`sasiad`=0 w t20) i brak wojen — wartości sąsiadów nieobserwowane.
- Tura sąsiedztwa i kara z napięciem liczone przez analizator z ciągu wierszy (formula zgodna z napieciePenaltyZaTure, sprawdzona: tura 24 → −5), NIE z licznika gry.
- Zazdrość lidera (A3) poza metrykami.

- Pary w wierszu: tylko z kontaktem/statusem innym niż neutralny lub sąsiedzi; liczba pominiętych w polu `pominietePary`.

RUNDY: 1/5. Ostatni werdykt: brak (pierwsza runda).

NASTĘPNY KROK (orkiestrator, nie Operator):
1. Przed biegami: `CHROME_PATH=/usr/bin/google-chrome` (w środowisku nie ma /usr/bin/chromium); jeden Chromium naraz.
2. Długie biegi (100 tur × 3 ziarna × OFF/ON), każdy osobno:
   `setsid nohup node tools/diplomacy-harder-measure-run.cjs --dist <abs-dist> --out <abs-out-off-S> --profile <abs-prof-off-S> --seed S --turns 100 --harder 0 > <abs-log> 2>&1 < /dev/null &`
   (ON: `--harder 1`). Tempo zmierzone: ok. 6 s/turę, ~2 min start; 100 tur ≈ 11–12 min na bieg, 6 biegów ≈ 70 min sekwencyjnie.
3. Analiza: `node tools/diplomacy-harder-measure-analyze.cjs --off <abs-out-off> --on <abs-out-on> --json <abs-plik>`; katalog wyjścia OFF/ON zawiera wszystkie ziarna.
4. Decyzja ABC o włączeniu flagi — dopiero po tych biegach.

DEPLOY-PUSH: NIE WYKONANO
