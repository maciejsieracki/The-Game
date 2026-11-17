# R-WEB-TEST-DEBT-HARNESS-CSS-RAW-LOADER-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-HARNESS-CSS-RAW-LOADER-Q1
GOAL: Naprawić budowanie testów battle-* importujących `brandTokenVars.ts` (`tokens.css?raw`, Vite-only) w gra/tools, bez zmian w src, tak aby testy mogły się wykonać (odblokowanie dowodu uruchomieniowego dla AMBUSH-DEPLOY, GENSTAR, CAVFLANK).
BAZA: e4a3e6eb72b4cc4d53f090cc03d90597341cf6d0 (origin/main, FALA 788), detached HEAD w worktree.

## ZMIANY-COMMIT

Allowlista (tylko gra/tools, bez src):
- gra/tools/battle-cavalry-flank-default-test.cjs — stub `tokens.css?raw` (pusty moduł) w esbuild.
- gra/tools/battle-deploy-cavalry-flanks-test.cjs — ten sam stub.
- gra/tools/battle-cavalry-front-flank-placement-test.cjs — onResolve + onLoad w namespace wirtualnym dla `tokens.css?raw`.
- gra/tools/battle-line-advance-uniform-test.cjs — wpis `[/tokens\.css\?raw$/, ...]` w tablicy stubów.
- gra/tools/battle-initial-placement-runtime-test.cjs — onResolve/onLoad `css-stub` dla `tokens.css?raw`.

Zakres: 5 plików testowych, dopisane 7 linii, zero usunięć logiki asercji. Brak zmian w `gra/src`. `git diff --check` czysty.

Przyczyna: esbuild nie obsługuje importu `?raw` z `src/ui/brandTokenVars.ts:7` (`Cannot import "...tokens.css?raw" into a JavaScript file without an output path configured`). Wzorzec naprawy zgodny z `budynek-garnizon-test.cjs` (pusty stub CSS).

Uwaga o liczbie testów: dispatch mówił o 4 testach. Zmierzone: 5 testów kończyło się błędem budowania na tym samym imporcie (cztery z dispatchu + `battle-cavalry-front-flank-placement-test`, który też miał ten sam błąd po wejściu w brandTokenVars). Wszystkie pięć naprawione.

## TESTY (surowe wyniki z tej rundy, uruchomienie z `gra/`)

Naprawione (build przeszedł, asercje zielone):
- battle-cavalry-flank-default-test — PASS: 960 checks.
- battle-deploy-cavalry-flanks-test — PASS: 536 checks, max distance to own unit 3.
- battle-cavalry-front-flank-placement-test — PASS: 163 checks (exit 0).
- battle-line-advance-uniform-test — exit 0, wszystkie PASS (m.in. frozen q=14, mixedSpeed spread 0 ≤ 2).
- battle-initial-placement-runtime-test — exit 0: `PASS: forced mounted fallback ... old wide fallback mutation caught 4/4`.

Dodatkowo zweryfikowane przy okazji (bez zmian kodu):
- battle-full-move-strike-test — `8/8 pass, mutacje wykryte 4/4` (wymaga >80 s).
- battle-pursuit-move-behavior-test — `13/13 pass, mutacje wykryte 6/6` (wymaga >80 s).
- battle-manual-choice-contract-test — exit 0.
- battle-mode-choice-labels-test — PASS.

Cel orkiestratora — testy AMBUSH-DEPLOY (`gra/tools/ambush-deploy-*`):
- ambush-deploy-geometry-test — 20 OK / 0 FAIL.
- ambush-deploy-scene-test — 26 OK / 0 FAIL.
- ambush-deploy-line-width-test — PASS (240 checks).
- ambush-deploy-wiring-test — 15 OK / 0 FAIL.
- ambush-deploy-zone-visual-test — 11 OK / 0 FAIL.
- ambush-deploy-identity-test — SKIP: wymaga env `AMBUSH_BASE_GRA` (katalog gra/ bazy 1c452ec35). Nie zmierzono tożsamości; to nie jest błąd budowania ani asercji.

Czerwone, poza zakresem naprawy budowania (NIE RUSZANE, src nietknięte):
- battle-formation-rules-test — AssertionError: `terrain/collision fallback keeps mounted units inside wing bands in setup and deploy reset`. To błąd asercji (src/logika), nie build. Numer asercji nie został wyodrębniony, pierwszy czerwony komunikat jak wyżej. Wymaga decyzji orkiestratora/kolejnego tematu.

GENSTAR: w `gra/tools` nie znaleziono pliku testowego o nazwie GENSTAR (grep `genstar` trafia tylko w `.cluster-start-bundle.cjs` i `mapgen-rivers-seed22-diag-run.cjs`). NIE ZMIERZONO — orkiestrator musi wskazać właściwy skrypt.

CAVFLANK: odblokowane trzy testy `battle-cavalry-*` / `battle-deploy-cavalry-flanks` (powyżej), wszystkie zielone.

## BLOKADY
- Brak. Build i asercje naprawionych testów zielone.
- Nie zmierzono: GENSTAR (brak wskazanego skryptu), identity AMBUSH (SKIP bez env).
- Czerwony `battle-formation-rules-test` (asercja w src) — poza zakresem tematu.

## RUNDY
1/5 — PASS-WITH-NOTES (bez FC: runda Operatora).

## DODATKOWE UWAGI
- Testy zapisują pliki dowodowe (`dyspozycje/.../evidence/*`) przy uruchomieniu; zmiany wygenerowane przez `battle-line-advance-uniform-test` przywrócono `git checkout`, do commita nie weszły.
- `gra/node_modules` zainstalowano w worktree (`npm ci --ignore-scripts`, 71 pakietów, z lockfile) — do posprzątania przez orkiestratora po integracji (zasada sprzątania node_modules po temacie).
- Nie wykonano `npm run build`/`dev` w `gra/` (zakaz).

## NASTĘPNY KROK
Evaluator: przegląd diffu 5 plików tools (tylko stuby CSS, bez zmian asercji) oraz powtórzenie 5 testów z listy powyżej. Orkiestrator: decyzja co do battle-formation-rules-test (asercja src) i wskazanie skryptu GENSTAR.

DEPLOY/PUSH: NIE WYKONANO
