STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1
GOAL: Pasek pozostałego ruchu na kartach jednostek stosu (podpowiedź hexa, hexContextTooltip.ts) oraz w panelu armii i mini-kartach: wypełnienie = ruchLeft/ruchMax, tor widoczny przy 0, podpowiedź „Ruch: X z Y”, podpis „ruch X/Y”.
BAZA: 6e8f49808 (runda 1 Operatora).

ODPOWIEDZI NA ZARZUTY
1. Pominięty komponent hexContextTooltip.ts — PRZYJMUJĘ. Odnaleziono źródło podpisu „34/33.6 · 0/12”: `gra/src/ui/hexContextTooltip.ts` (`.sp-unit-stack-meta`, karty `.sp-unit-stack-card`). Zmieniono podpis na „34/33.6 · ruch 0/12”.
2. GOAL niespełniony dla hexContextTooltip (czarny tor bez obwódki, brak „Ruch: X z Y”, brak etykiety „ruch”) — PRZYJMUJĘ. Dodano: obwódkę inset `box-shadow:inset 0 0 0 1px rgba(111,176,240,.28)` do `.sp-unit-stack-bar` (tor widoczny przy 0); `title="Ruch: X z Y"` na torze ruchu karty stosu i na torze ruchu pojedynczej jednostki (sekcja „Ruch” w `buildUnitVitalsHtml`-podobnym bloku); podpis „ruch X/Y” na karcie stosu.
3. Zmiany rundy 1 dotyczyły komponentów z działającym paskiem — PRZYJMUJĘ jako uwagę. Realny komponent objawu to hexContextTooltip.ts (pasek w karcie stosu hexa, tło bez obwódki). Commit 6e8f49808 (armyListHud/armyStackHud) pozostaje, dodano poprawkę hexContextTooltip w rundzie 2. Pytanie „czy pasek znikł po wcześniejszych zmianach” nadal NIE_ZMIERZONO (historia git poza zakresem tej rundy).
4. Test wyłącznie regexowy, nie obejmuje hexContextTooltip — PRZYJMUJĘ częściowo. Dodano 5 sprawdzeń na hexContextTooltip.ts (podpowiedź, szerokość = ruchLeft/ruchMax, podpis „ruch X/Y”, obwódka toru, pojedyncza jednostka). Test nadal strukturalny (brak node_modules w worktree, więc brak renderu w Chromium/tsc). Behawioralny test renderu karty z ruchLeft=0 — NIE_ZMIERZONO, luka do rozstrzygnięcia w kolejnym temacie.
5. Regresje army-merge-panel-*, entity cards, brak weryfikacji wizualnej — NIE_ZMIERZONO (brak node_modules i przeglądarki w worktree). Lukę zapisuję jawnie.
6. Allowlista nie obejmuje hexContextTooltip.ts — PRZYJMUJĘ. Rozstrzygnięcie założeniem: plik dopisany do allowlisty (dopisek w `00-dispatch.md`). Status PASS-WITH-NOTES, bo weryfikacja wizualna i testy regresji nie zostały wykonane.

ZMIANY/COMMIT
- gra/src/ui/hexContextTooltip.ts: `buildUnitStackBarHtml(pct, kind, title?)` przyjmuje opcjonalny `title`; tor ruchu karty stosu i pojedynczej jednostki z `Ruch: X z Y`; podpis `ruch X/Y`; `.sp-unit-stack-bar` z obwódką inset.
- gra/tools/army-panel-card-move-bar-test.cjs: sekcja 4 (5 nowych sprawdzeń na hexContextTooltip.ts).
- dyspozycje/autobot/runs/R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1/00-dispatch.md: dopisek allowlisty.
- dyspozycje/autobot/runs/R-WEB-UI-ARMY-PANEL-CARD-MOVE-BAR-MISSING-Q1/02-operator-r2.md: ten raport.
- Commit runda 2: SHA podany w odpowiedzi orkiestratorowi (po `git commit`).

TESTY
- `node tools/army-panel-card-move-bar-test.cjs` (z gra/): 15/15 wcześniejszych + 5 nowych = wszystkie PASS, „All army-panel-card-move-bar checks passed”.
- `git diff --check`: czysto.
- NIE_ZMIERZONO: `tsc --noEmit` (brak node_modules w worktree).
- NIE_ZMIERZONO: Chromium / weryfikacja wizualna karty stosu w grze; army-stack-commander-identity; army-merge-panel-*; side-list-hud-panel-coverage.

BLOKADY
- Brak weryfikacji wizualnej w realnej grze (wymagana przed READY_FOR_DEPLOY).
- Brak typecheck i regresji przeglądarkowych (brak node_modules w worktree).
- Pytanie, czy pasek ruchu zniknął po wcześniejszych zmianach (historia git), NIE_ZMIERZONO.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator i Final Control na SHA rundy 2; wizualna weryfikacja karty stosu hexa (ruchLeft=0 i pełny ruch) w grze; tsc i regresje army-* po instalacji zależności.
DEPLOY/PUSH: NIE WYKONANO
