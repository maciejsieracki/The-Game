STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PANGEA-LAND-FRACTION-OTHER-Q1
GOAL: Faktyczny udział lądu Pangea w ±2 pp deklaracji dla 30–70% (20% w ±3 pp), bez zmiany hashy Kontynenty/Wyspy/Ziemia i bez regresu Pangea 60%.

ZMIANY/COMMIT: SHA końcowy do integracji `73fd44bda` (baza `fe395c927` -> `420d97ffe`). Diff względem `420d97ffe` mieści się w allowliście: `gra/src/map/gen-helpers.ts` (tylko `topUpPangeaLandFraction` + 2 stałe), nowe `gra/tools/pangea-land-other-*.cjs`, katalog runu. `generator.ts`, `map-gen-params.json`, `newGameMapDefaults.ts` bez zmian. Bez pusha.

WERDYKTY ZARZUTÓW:
1. Mały 70% poza ±2 pp: ODDAL (naprawione w `73fd44bda`, faza 3). Własny pomiar: 70,27 / 70,16 / 70,31% (ziarna 1/42/99), Mały 20%: 19,99% x3, EXIT=0.
2. Decyzja o polityce marginesu: ODDAL. Poprawka mieści się w allowliście, polityka bez zmian, nowy dispatch zbędny.
3. `map-gen-regression` niezmierzony: ODDAL jako uwaga. Zmieniają się tylko mapy Pangea Mały (poza 60% niezmienione bajt-w-bajt dla Standardowego); część rzeczna Pangea Mały zmierzona przez Obronę (462/462 tras, 284/284 rzek, `gate-regr-pangea-maly-rivers-r2.txt` EXIT=0). Pełny test (>24 min) NIE_ZMIERZONO — do ewentualnego uruchomienia przy integracji.
4. Kształt/weryfikacja wizualna: ODDAL jako uwaga (1 masa lądu, `pangea-land-shape` PASS wg logu Obrony). Przeglądarkowa ocena wizualna NIE_ZMIERZONO.
5. Mały 60% zmieniony celowo (57,4 -> 60,0): nie zarzut.
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

TESTY (własne, na `73fd44bda`):
- `pangea-land-other-measure maly` (70 i 20%): PASS, EXIT=0.
- `tsc --noEmit`: EXIT=0.
- `pangea-land-determinism`: EXIT=0; 16 linii (hash+land) identyczne ze stanem `420d97ffe` (diff = IDENT), w tym Pangea Standardowy 59,15–59,68%.
- `pangea-land-fraction`, `capital-sep-pangea`, `cluster-spread`: EXIT=0.
- Zaufane logom Obrony (każdy z jedną linią `EXIT=0`, zweryfikowane grepem): measure Standardowy/Mały, ai-city-yield, ai-avoid-polar-parity (30/30), pangea-land-shape.
- `pangea-land-shape` własny przebieg przerwany po >590 s (nie ukończony): NIE_ZMIERZONO samodzielnie.
- `map-gen-regression` pełny: NIE_ZMIERZONO.

BLOKADY: brak.
RUNDY: 1/5 (Obrona po FAIL Evaluatora; Final Control PASS-WITH-NOTES).
NASTĘPNY KROK: integracja orkiestratora. Kolejność względem `origin/rust-port/parity-v2` (9a6bf6ee): zmiana dotyczy wyłącznie `gra/` (web), nie `rust-port/**`; integrować do `main` niezależnie, a parity-v2 nie wymaga rebase na ten commit. Przy integracji opcjonalnie uruchomić pełny `map-gen-regression`.
DEPLOY/PUSH: NIE WYKONANO
