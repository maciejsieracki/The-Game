# R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 — obrona Operatora (runda 2, Haiku 5.5)

STATUS: BLOCK
DOMAIN: GAME (render)
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 (RIVTHICKIMPL, #184)
GOAL: trzy poziomy rzek (main / medium / tributary) wyraźnie różne i grubsze; hierarchia main > medium > tributary; dowód wizualny PRZED/PO i pomiar pikseli 8×.
BAZA: origin/main 690947a2a; kandydat 77602c918 (odtworzony detached).

## Odpowiedzi na zarzuty Evaluatora (e9319bfbe)

### Zarzut 1 — brak dowodu wizualnego (zrzuty 2×/4×/8×, pomiar pikseli, FPS 5×20 s, pageErrors)
PRZYJMUJĘ, NIE DOMKNIĘTE w tej rundzie.
- Skryptu `rivers-live-measure.cjs` i katalogu `dyspozycje/analizy/rzeki-render-r3a/` nadal nie ma w tej gałęzi; nie napisano ich w tej rundzie.
- Zrobione: build kandydata poza repo (`vite build --outDir <scratchpad>/rivbuild/cand`, 24,87 s, zielony); serwer statyczny + Chromium `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` uruchamia grę (`?civTest=1&civSeed=4242`), ekran startowy wyrenderowany, pageErrors = 0 (wynik surowy: `pageErrors 0 []`). Zrzut startowy: `<scratchpad>/rivshot-cand-0.png`.
- NIE ZMIERZONO: zrzuty PRZED (baza 690947a2a) i PO (kandydat) w zbliżeniach 2×/4×/8×, pomiar pikseli rzek per poziom w kadrze 8×, FPS PRZED/PO. Powód: przejście ekranu startowego do mapy i sterowanie kamerą wymaga osobnego runnera (wzorzec: `gra/tools/ai-economy-measure-run.cjs` i helper `_live-ready.cjs`), którego nie zbudowano w tej rundzie.
- Ocena czytelności grubszych rzek w zbliżeniach: NIE OCENIONO. Według dispatchu wymaga to zrzutów, więc nie wolno jej uznać za zrobioną.

### Zarzut 2 — docs/obieg/MAPA-RZEKI-SPEC.md linia 76 podaje dopływ 50%
PRZYJMUJĘ i POPRAWIONO.
- Zmieniono wiersz tabeli `tributary` z „**50%** (2× cieńszy)” na „**0,45 szerokości głównej** (stałe; patrz akapit RIVTHICKIMPL niżej)”.
- Dowód: `git diff -- docs/obieg/MAPA-RZEKI-SPEC.md` pokazuje jedną zmienioną linię, a akapit RIVTHICKIMPL (linie 81–83) zostaje bez zmian.

### Zarzut 3 — nagłówek/nazwa asercji „tributary ≥ 0,3” w river-render-levels-test.cjs
PRZYJMUJĘ i POPRAWIONO.
- Nazwę asercji w sekcji [C] zmieniono na: „dla każdej długości: main > medium > tributary == short; tributary ≥ 0,3 (dolna granica, dokładną wartość 0,45 sprawdza bandOk)”.
- Nie osłabiono żadnej asercji: `t < 0.3` nadal jest w pętli, a `bandOk` nadal wymusza dokładnie 0,45 i medium = 0,7 × main.

## Bramki w tej rundzie (surowe wyniki)
- `node gra/tools/river-render-levels-test.cjs` → `WYNIK: 19 OK / 0 FAIL`, exit 0.
- Mutacja czerwona: w `gra/src/render/scene.ts` zamieniono `return 0.45;` na `return 0.7 * main;` → `WYNIK: 16 OK / 3 FAIL` (FAIL: order, bandOk, „len=20: main 1.010 > medium 0.707 > tributary 0.707”). Plik scene.ts przywrócono (`git checkout --`), w commicie scene.ts NIE występuje.
- `git diff --check` → czysto.
- Nie uruchamiano pełnych bramek ogólnych dispatchu (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, river-fog-visibility-test). Nie wykonano w tej rundzie, więc NIE ZMIERZONO.

## Zmiany w commicie
- gra/tools/river-render-levels-test.cjs (nazwa asercji, bez osłabienia)
- docs/obieg/MAPA-RZEKI-SPEC.md (wiersz tabeli dopływu)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/30-obrona-claude.md (ten raport)
- Brak zmian w gra/src/render/scene.ts względem kandydata (poprawka tylko tekstowa; wartości 0,45 i 0,7 były już w kandydacie).

## Blokady
1. Brak dowodu wizualnego (zrzuty PRZED/PO 2×/4×/8×, pomiar pikseli, FPS, czytelność) — wymaga runnera PRZED/PO, którego nie ma w repo.
2. Brak pełnych bramek ogólnych dispatchu w tej rundzie.
3. Porządek: `gra/node_modules` zainstalowano w worktree (`npm ci`, nie w repo, ignorowane) — do usunięcia przy sprzątaniu.

RUNDY: 2/5 (runda obrony po FAIL Evaluatora; runda 1 = implementacja, kandydat 77602c918)
NASTĘPNY KROK: zbudować runner `rivers-live-measure.cjs` (PRZED = 690947a2a, PO = ta gałąź) z zrzutami 2×/4×/8× i pomiarem pikseli per poziom oraz FPS 5×20 s; następnie Evaluator ponownie na dowodach; ewentualnie DECISION_REQUIRED, jeśli grubsze rzeki zasłaniają miasta w zbliżeniu.
DEPLOY/PUSH: NIE WYKONANO
