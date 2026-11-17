# R-WEB-TEST-DEBT-HARNESS-CSS-RAW-LOADER-Q1 — obrona Operatora (runda 2, odpowiedzi na zarzuty Evaluatora 8760554d4)

STATUS: PASS-WITH-NOTES (kod naprawiony i zweryfikowany; cztery testy z zakresu nadal pada z innych przyczyn, opisanych niżej)
DOMAIN: PROCESS/GAME (wyłącznie gra/tools; gra/src nietknięte)
TEMAT: R-WEB-TEST-DEBT-HARNESS-CSS-RAW-LOADER-Q1
GOAL: harnessy esbuild w gra/tools nie wywalają się na imporcie `*?raw` (Vite-only) z src/ui/brandTokenVars.ts; zero zmian w gra/src.
BAZA: e4a3e6eb7 (origin/main) → kandydat 5187c3733 (runda 1) → commit rundy 2: **db1ef644e507bb964eb7612f3fa8225095c14871** (ancestor e4a3e6eb7: OK, `git show --check`: OK).

## ODPOWIEDZI NA ZARZUTY

1. **PRZYJMUJĘ.** `battle-commander-star-reset-test.cjs` jest w diffie (dodany helper). Wynik po zmianie: `node tools/battle-commander-star-reset-test.cjs` → `Wynik: 10 PASS, 0 FAIL`, exit 0. Raport rundy 1 milczał o tym teście — błąd raportowania, naprawiony.

2. **PRZYJMUJĘ.** Skan całości (339 harnessów esbuild + battleScene|src/ui, timeout 40 s, po poprawce) — wynik surowy:
   - `grep` po `tokens.css?raw` / `Cannot import`: **0 trafień** (przed poprawką: 20 w tym star-reset; 3 trafienia w pierwszym skanie to 2 prawdziwe + 1 fałszywy: `technology-discovery-card-visual-test` wypisuje tekst PASS z nazwą pliku tokens.css, exit 0).
   - Rozkład exit po skanie: 258 × exit 0, 67 × exit 1, 12 × exit 124 (timeout 40 s), 2 × exit 2. Katalog: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/scan2/`.
   - Wszystkie 19 testów z zarzutu 2 — stan po poprawce:
     - exit 0: battle-attack-dir-per-selection, battle-attack-move-order, battle-collision-manual-unselected, battle-dead-units-removed, battle-flank-close-formation, battle-large-mixed-doctrine-matrix, battle-manual-orders-routing, battle-melee-attack-doctrine, battle-pace-latch, battle-ranged-mounted-doctrine, battle-dead-unit-disappearance, battle-manual-orders-full-move, battle-defeat-survivor-retreat-two-hex (13 w skanie).
     - exit 124 w skanie (timeout 40 s pod obciążeniem 4 równoległych), ale standalone exit 0: battle-cap-500 (`PASS 59 asercji`, 45 s), battle-pace-equal-line-live (`23 pass, 0 fail`, 294 s), battle-line-advance-uniform (`PASS`, exit 0).
     - exit 1, przyczyna **inna niż ?raw** (zob. sekcja „Pozostałe”): battle-standoff-two-warriors (błąd fixture), auto-battle-simultaneous (błąd fixture), army-stack-limit (asercja F8), bitwa-auto-atak-wielojednostkowy-evaluation (asercja „Atak keeps the archer behind infantry”).

3. **PRZYJMUJĘ.** Mutacja (kryterium d): z `battle-deploy-cavalry-flanks-test.cjs` usunięty wpis helpera (`plugins: [{`):
   - `Error: Build failed with 1 error: src/ui/brandTokenVars.ts:7:27: ERROR: Cannot import "src/ui/icons/brand/tokens.css?raw" ...`, exit 1.
   - Po przywróceniu pliku z helperem: `PASS: default start placement keeps cavalry/chariots on the wings ... (536 checks, max distance to own unit 3)`, exit 0.
   - Dowód dla pozostałych nie robiony osobno (ten sam wzorzec, zmierzone skanem: 0 trafień ?raw po poprawce).

4. **PRZYJMUJĘ.** Wspólny helper: `gra/tools/lib/esbuild-raw-plugin.cjs` (onResolve `/\?raw$/` → namespace `raw-css-stub` → `export default ""`). Podpięcie jednowierszowe: `plugins: [require('./lib/esbuild-raw-plugin.cjs'), {...}]`. Pięć inline stubów z 5187c3733 (w 3 stylach) usunięte i zastąpione helperem.

5. **ODRZUCAM (dowód).** Zarzut „battle-formation-rules-test czerwony — regresja FALI 788 vs dług” — nie jest skutkiem tego tematu:
   - Test i `gra/src` są identyczne między bazą a kandydatem: `git diff e4a3e6eb7 -- gra/src` = 0 bajtów; `gra/tools/battle-formation-rules-test.cjs` nie jest w diffie.
   - Uruchomienie na **bazie e4a3e6eb7** (tymczasowy worktree): `node tools/battle-formation-rules-test.cjs` → `AssertionError [ERR_ASSERTION]: terrain/collision fallback keeps mounted units inside wing bands in setup and deploy reset`, exit 1. Ta sama asercja, ten sam wynik co na kandydacie. Worktree usunięty (`git worktree remove --force`).
   - Wniosek: dług bazowy, nie regresja tematu. Zarzut Evaluatora „na bazie test nie buduje się z powodu ?raw” NIE potwierdza się na e4a3e6eb7 — na bazie test buduje się i pada na asercji.
   - Uwaga o „71 pakietach”: `npm ci --ignore-scripts` w gra/ dał `added 71 packages`; katalogów najwyższego poziomu w node_modules: 57. Oba liczby zgodne z raportem Evaluatora, bez wpływu na wynik.

## ZMIANY/COMMIT
- db1ef644e — `test(tools): wspólny plugin esbuild dla importu ?raw w harnessach battle-*`:
  - nowy: `gra/tools/lib/esbuild-raw-plugin.cjs`
  - zmienione (25 plików `gra/tools/*-test.cjs`): army-stack-limit, auto-battle-simultaneous, battle-attack-dir-per-selection, battle-attack-move-order, battle-cap-500, battle-cavalry-flank-default, battle-cavalry-front-flank-placement, battle-collision-manual-unselected, battle-commander-star-reset, battle-dead-unit-disappearance, battle-dead-units-removed, battle-defeat-survivor-retreat-two-hex, battle-deploy-cavalry-flanks, battle-flank-close-formation, battle-initial-placement-runtime, battle-large-mixed-doctrine-matrix, battle-line-advance-uniform, battle-manual-orders-full-move, battle-manual-orders-routing, battle-melee-attack-doctrine, battle-pace-equal-line-live, battle-pace-latch, battle-ranged-mounted-doctrine, battle-standoff-two-warriors, bitwa-auto-atak-wielojednostkowy-evaluation.
  - `git diff --stat e4a3e6eb7 db1ef644e` → 26 plików (1 nowy + 25 zmienionych), 38+/33-, wszystko w `gra/tools`.
- Ten plik raportu — osobny commit (SHA końcowy w polu `sha` wyniku).
- Nie dotknięto: `gra/src/**`, `gra/data/**`, `gra-robocza/**`, `WERSJE.md`. Nie uruchamiano `npm run build/dev`.

## TESTY (surowe wyniki, kandydat db1ef644e, `gra/`)
- `npx tsc --noEmit`: exit 0.
- Bramki referencyjne (exit 0 każda): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.`
- Cztery testy z dispatchu + dwa z diffu (standalone, exit 0):
  - battle-commander-star-reset: `Wynik: 10 PASS, 0 FAIL`
  - battle-deploy-cavalry-flanks: `PASS ... (536 checks, max distance to own unit 3)`
  - battle-initial-placement-runtime: `PASS ... old wide fallback mutation caught 4/4`
  - battle-cavalry-flank-default: `PASS ... (960 checks)`
  - battle-cavalry-front-flank-placement: `battle-cavalry-front-flank-placement-test: PASS (163 checks)`
  - battle-line-advance-uniform: `PASS mixedSpeed/atk ...`, `PASS mixedSpeed/def ...`
  - battle-dead-unit-disappearance: `PASS — killed unit detached immediately; routed unit still flees visibly`
  - battle-manual-orders-full-move: `passed`
- Pełny skan (339, po poprawce): patrz odpowiedź 2.

## POZOSTAŁE (poza zakresem ?raw — NIE naprawiane, bez zmian w src)
- battle-standoff-two-warriors-test, auto-battle-simultaneous-test: `TypeError: Cannot read properties of undefined (reading 'clear')` w `_BattleScene._computeManualArbitrationClaims (battleScene.ts:78797)` ← `_beginTurn`. Harness tworzy scenę bez nowego pola (`_queuedOrderUnitIds`) — dług fixture po FALI arbitrażu. Naprawa w teście możliwa, ale to inny temat (nie ?raw).
- army-stack-limit-test: `AssertionError: F8 trasa ruchu AI jest przycinana do miejsca w stosie (pełny stos = brak ruchu)`.
- bitwa-auto-atak-wielojednostkowy-evaluation-test: `[FAIL] Atak keeps the archer behind infantry when the front tile is occupied`.
- Osiem harnessów z `brandAssets.ts → menu-emblem.svg?raw` (army-panel-general-label-multiselect, army-stack-commander-identity, empire-armia-produkcja, empire-miasta-table, empire-panel-miasto-obywatele-content, escape-overlay-real-panels, side-panel-unit-cycle-arrows, sidepanel-events-toolbar): sprawdziłem wpięcie helpera — po nim NIE przechodzą: `import.meta.glob is not a function` (3 testy) oraz `Build failed with 20 errors` (3 testy). Zmiany cofnięte (nie wpięte w commit), bo nie usuwają przyczyny. Osobny temat (Vite-only `import.meta.glob` + stuby brandAssets).
- budynek-garnizon-test: `Multiple exports with the same name "renderBuildList"`; tech-unlock-units-test: `No matching export in "stub:stub:brandAssets" for import "brandIconSvg"`; ui-language-count-renderer-test: `Build failed with 27 errors` (stub brand-assets) — inne przyczyny, poza zakresem.
- Timeouty 40 s w skanie (cap-500, pace-equal-line-live, line-advance) — przy obciążeniu 4 równoległe; standalone przechodzą (zob. wyżej). `battle-pace-equal-line-live-test` trwa ok. 294 s — do rozważenia w harnessie CI.

## ŚRODOWISKO / SPRZĄTANIE
- Uruchomienia testów zapisywały artefakty do `dyspozycje/` i `gra/tools/` (zmiany tracked PNG/JSON). Cofnięte `git checkout --`, NIE są w commicie.
- Pozostają untracked w worktree (generowane przez testy, NIE commitowane): `gra/tools/.empire-recruit-all-bundle.js`, `.shots-et-turn-lbl/`, `.tax-slider-bundle-legacy.cjs`, `.tax-slider-scale-bundle-legacy.cjs`, `_fort-chain-shots/`. Do usunięcia przez orkiestratora (zakaz rm dla Operatora).
- `gra/node_modules` — zainstalowane lokalnie w worktree (`npm ci --ignore-scripts`), gitignored.
- Tymczasowy worktree bazy (e4a3e6eb7) usunięty.

## BLOKADY
Brak blokad dla zakresu ?raw. Cztery testy z pozostałych przyczyn (zob. POZOSTAŁE) wymagają osobnych tematów.

## RUNDY
Runda 2 (Operator, obrona) do tego samego ID. Evaluator r1: FAIL (zarzuty 1–5).

## NASTĘPNY KROK
Evaluator r2 na db1ef644e + ten raport (sprawdzić: star-reset w diffie i PASS, skan 0 trafień ?raw, mutacja, helper). Ewentualne osobne tematy: (a) fixture `_queuedOrderUnitIds` w standoff/auto-battle; (b) asercje F8 i archer-behind; (c) brandAssets svg?raw + import.meta.glob.

DEPLOY/PUSH: NIE WYKONANO
