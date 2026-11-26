# R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 — Operator, runda 2/5 (dowód wizualny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render, dowód)
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 (RIVTHICKIMPL #184)
GOAL: dowód wizualny i pomiar pikseli dla grubszych rzek (kod z rundy 1: medium = 0,7 × główna, tributary/short = 0,45) — uzupełnienie braków FC r1 (brak zrzutów PRZED/PO, brak FPS, brak pomiaru per poziom).

## Baza i kod
- Baza kodu: 59ad2debe (FC tip r1). riverWidthMulForKind w gra/src/render/scene.ts bez zmian w tej rundzie.
- Build PRZED: origin/main 690947a2a (git archive gra/, build poza repo, w scratchpad).
- Build PO: 59ad2debe (git archive gra/, build poza repo, w scratchpad).
- Mapy: ten sam seed 1, Standardowy, kontynenty. Diff gra/src/map + gra/data między 690947a2a a 59ad2debe: 0 linii (generator nietknięty).

## Skrypty
- Skopiowane bez zmian z commita cebb33416 (RIVVISUAL) do dyspozycje/analizy/rzeki-render-r3a/: rivers-live-measure.cjs, bluecount.cjs.
- Playwright: z gra/node_modules. W worktree to dowiązanie symboliczne do node_modules innego worktree; NIE commitowane.
- Przeglądarka: chromium.launch headless z --no-sandbox (ścieżka domyślna skryptu; który wariant launch faktycznie użył, NIE ZMIERZONO). Playwright nie był instalowany.

## Wyniki zrzutów i pomiarów (liczby z surowego wyjścia)
Zrzuty: runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/{PRZED,PO}-{cala-mapa,zblizenie-2x,zblizenie-4x,zblizenie-8x}.png oraz PO-S1 / PO-S2 (izolacja poziomów, riverStage=1 / 2).

Pomiar pikseli rzek (bluecount.cjs; progi b>=170, r<=110, b-r>=90; miara ILOŚCI tuszu, nie szerokości):

| kadr | PRZED (RIVERS3A, baza) | PO (kod r1) |
|---|---|---|
| cała mapa | 153 | 153 |
| zbliżenie 4× | 407 | 421 |
| zbliżenie 8× | 5015 | 5818 (+16,1%) |

Poziomy w 8× (tylko PO, izolacja riverStage):
- tylko główne (riverStage=1): 3152
- główne + średnie (riverStage=2): 4847 (średnie dodają +1695, czyli +54% względem głównych)
- wszystkie (riverStage=3, domyślnie): 5818 (dopływy dodają +971, czyli +20% względem główne + średnie)

NIE ZMIERZONO: poziomy w bazie PRZED per poziom (riverStage=1/2 dla bazy nie wykonano); pomiar per poziom w 4×; szerokości w pikselach (mierzona jest ilość tuszu).

FPS (SwiftShader, orientacyjnie, 5 × 20 s w zbliżeniu 8×):
- PRZED: 0,685 / 0,691 / 0,782 / 0,732 / 0,749 fps (średnia ok. 0,73)
- PO: 0,769 / 0,799 / 0,767 / 0,753 / 0,751 fps (średnia ok. 0,77)
Różnica mieści się w szumie; brak dowodu regresji. Liczby SwiftShader nie są miarą GPU.

pageErrors: PRZED 0, PO 0, PO-S1 0, PO-S2 0 (pole errors w wynik.json puste).

## Czytelność (ocena wizualna)
Porównano PO-zblizenie-8x.png z PRZED-zblizenie-8x.png: rzeki w PO wyraźnie grubsze i bardziej widoczne; miasta i jednostki w centrum kadru nie są zasłonięte. Ocena dotyczy zrzutu 8× jednego kadru (seed 1). Zrzutów 4× i całej mapy nie oceniono wizualnie w tej rundzie. Brak podstaw do DECISION_REQUIRED w tej rundzie.

## Testy
- tsc (gra/tsconfig.json --noEmit): brak wyjścia błędów.
- node gra/tools/river-render-levels-test.cjs: WYNIK 19 OK / 0 FAIL (exit 0). Mutacja czerwona nie była ponownie uruchamiana w tej rundzie (kod nie zmieniany).
- node gra/tools/river-fog-visibility-test.cjs: 31 pass, 0 fail (exit 0).
- Pozostałe bramki ogólne (logic, tech-tree, research, unit-replace, combat, ai-test) NIE URUCHAMIANO: kod gra/src nie zmieniał się w tej rundzie.

## Zmiany w commicie
- dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs (nowy, z cebb33416)
- dyspozycje/analizy/rzeki-render-r3a/bluecount.cjs (nowy, z cebb33416)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/10-operator-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/ — PNG i JSON zrzutów i wyników (PRZED-*, PO-*, PO-S1-*, PO-S2-*)
Kod gra/src i gra/tools nie zmieniony.

## BLOKADY
- Brak pomiaru per poziom w bazie PRZED (wymagałby dwóch dodatkowych biegów).
- FPS tylko SwiftShader (orientacyjnie).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch r2 wskazywał skrypty z cebb33416 jako źródło; skopiowano bez zmian.
- Liczba asercji river-render-levels-test to 19 (dispatch podawał 18); test zielony.

RUNDY: 2/5
NASTĘPNY KROK: orkiestrator ocenia dowód wizualny (FC r2). Pomiar per poziom w bazie PRZED opcjonalnie, jeśli FC zażąda.
DEPLOY/PUSH: NIE WYKONANO
