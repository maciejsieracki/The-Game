STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-STADNINA-NO-HEX-FALSE-NEGATIVE-Q1
GOAL: Stadnina nie pokazuje fałszywego „Brak heksów w twoim terytorium", gdy złoże konia jest w terytorium gracza, a odmowa podaje prawdziwy powód.
ZMIANY/COMMIT: e88103e0d61fe6d7985c801bc2a01851d6800379 (baza 1099bdac2 == origin/main). Diff do allowlisty: 3 pliki (gra/src/map/improvement-build.ts, gra/tools/stadnina-hex-candidates-test.cjs, 01-operator-r1.md); zero zmian w gra-robocza, WERSJE.md, rust-port. `git diff --check` czysty.

WERDYKT ZARZUTÓW (jedyny zarzut: brak blokujących): ODDAL. Zero NAPRAW.
Uwagi nieblokujące:
1. Wzgórze/Las: ODDAL. Złoże konia i Las wykluczają się w danych, reguła terenu Łąka/Równina nie zmieniana (dispatch zabrania). Stadnina na wzgórzu = decyzja produktowa, do oceny orkiestratora (nie ABC z FC).
2. Pomiar w Chromium NIE_ZMIERZONO (zakaz vite build). Przyczyna dowiedziona realnymi funkcjami + mutacją; udowodniona tylko dla scenariusza posterunku/fortu, brak dowodu że to przypadek ze zrzutów właściciela.
3. Brak plików *livestock*/*resource-access* w gra/tools: pokrycie pośrednie (zielone).
4. Skan AI w ai.ts per miasto, bez terytorium fortów: poza zakresem, osobny temat.
5-6. Opisane uczciwie.

TESTY (samodzielnie, na e88103e0d, po npm ci --ignore-scripts):
- stadnina-hex-candidates-test: pass=15 fail=0, EXIT=0 (w tym sekcja E, mutacja).
- tsc --noEmit: EXIT=0.
- Regresje EXIT=0: stadnina-las, stadnina-kon-koszt, hex-tooltip-stadnina-kopalnia-cyny, map-improvement-qualify, improvement-territory-gate, oboz-lowiecki-wymaga-tartaku, hodowla-las, food-hodowla, auto-improvements, ai-improvements, pending-improvements, improvement-adapter-resource-note.
- oboz-lowiecki-las-test: 19 FAIL na 1099bdac2 i na e88103e0d (identycznie); deposit-building-gate-test: 1 FAIL na obu. Błędy istniejące przed zmianą.
- auto-fort-claim: nie uruchomiony przeze mnie (brak potwierdzenia pliku w tej rundzie); zgłoszony przez Operatora jako EXIT=0.
- gra/node_modules usunięty po pracy.
BLOKADY: brak, poza NIE_ZMIERZONO w Chromium.
RUNDY: 3/5 (Operator r1, Obrona r2, FC)
KOLEJNOŚĆ INTEGRACJI: origin/main == 1099bdac2 (baza commita), więc e88103e0d fast-forward na main. Względem origin/rust-port/parity-v2 (6b3882cad): gałąź niezależna, dotyka tylko gra/ (TS) i dyspozycji; brak kolizji z rust-port/**; integrować do main niezależnie od parity-v2, kolejność dowolna.
SHA DO INTEGRACJI: e88103e0d61fe6d7985c801bc2a01851d6800379 (plus commit z tym raportem FC)
NASTĘPNY KROK: integracja orkiestratora, READY_FOR_DEPLOY po jego bramkach
DEPLOY/PUSH: NIE WYKONANO
