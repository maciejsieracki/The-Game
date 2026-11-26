STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render, wygląd rzek)
TEMAT: R-WEB-MAP-RIVER-RENDER-LEVELS-Q1 (RIVERS3A, odp. 14C część A)
GOAL: domyślnie widoczne trzy poziomy rzek: główne (najgrubsze), średnie (cieńsze), trzeci poziom dopływów (najcieńsze); zero zmian generatora map i pinów.
ZMIANY-COMMIT: baza 7148b2f4e (origin/main). Pliki: gra/src/render/scene.ts (stała RIVER_RENDER_DEFAULT_STAGE=3; getRiverRenderStage zwraca ją domyślnie; riverWidthMulForKind; filterRiverPathsForStage wyeksportowane); gra/tools/river-render-levels-test.cjs (nowy); dyspozycje/autobot/runs/R-WEB-MAP-RIVER-RENDER-LEVELS-Q1/10-operator-claude.md. Brak zmian w gra/src/map/** (git diff = 0 linii).

## Co zmieniono
1. Domyślny etap renderu rzek: 2 -> 3 (main + medium + tributary/short). Kod NIE zapisuje klucza localStorage civ-river-render-stage (zweryfikowane grepem), więc zapisana wartość może pochodzić tylko z jawnego wyboru gracza i jest nadal respektowana (?riverStage=N i localStorage dalej działają). Stary etap 2 zostaje dostępny jako jawny wybór.
2. Grubość (mnożnik mainHalfWidth; widthMul):
   - main: bez zmian: min(1,35; 0,85 + len·0,008) (0,85–1,35).
   - medium: max(0,35; 0,7 × dotychczasowa reguła długości). Wartości: len<10 -> 0,35 (było 0,4 -> 0,28, klamrowane); len 10–17 -> 0,385 (było 0,55); len>=18 -> 0,49 (było 0,7).
   - tributary/short: stała 0,30 (było 0,4/0,55/0,7 — identycznie z medium).
   Odchylenie od dispatchu: dispatch prosił o tributary ≈ 0,5 × main. Przy 0,5 (≈0,425–0,675) dopływy są grubsze lub równe średnim przy długich trasach (medium 0,49), co łamie binarne kryterium „trzy różne grubości”. Dlatego przyjęto 0,30 (≈22–35% main) i medium min 0,35. Do decyzji orkiestratora/właściciela, czy wolno podnieść tributary wyżej kosztem ustawienia medium.
3. Mgła (river-fog-visibility) i okno skrętu (river-turn-window): nie zmieniano. Dopływy idą tą samą ścieżką batch (batchAll) co short/medium; test river-fog-visibility sekcja B i C obejmuje scalony batch z medium/short/tributary i przechodzi (31/0). Okno skrętu dotyczy generatora (river-turn-window 10/0 zielone).

## TESTY (surowe wyniki w tej rundzie)
- tsc --noEmit (gra/tsconfig.json): EXIT 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- combat-test: All sanity checks passed (EXIT 0)
- unit-replace-test: EXIT 0 (bez liczby w linii końcowej; kod wyjścia 0)
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- river-fog-visibility-test: 31 pass, 0 fail
- river-turn-window-test: 10 pass, 0 fail
- medium-river-test: 38 pass, 0 fail
- river-render-levels-test (NOWY): 11 OK / 0 FAIL
- MUTACJA 1 (RIVER_RENDER_DEFAULT_STAGE = 2): test CZERWONY, 5 FAIL / 6 OK, exit 1. Przywrócono plik (cp z kopii).
- MUTACJA 2 (tributary width 0,3 -> 0,6): test CZERWONY, 2 FAIL / 9 OK, exit 1. Przywrócono plik.
- Po przywróceniu: grep potwierdza stałe 3 i 0,3 w pliku.

## NIE ZMIERZONO
- Zrzut z żywego Chromium (viewport 1280x800, mapa 84x60 seed 1, trzy poziomy): NIE ZMIERZONO. Powód: w tej rundzie nie uruchamiano przeglądarki (brak budowy vite do /tmp i brak bramki wizualnej); dispatch dopuszcza tylko z powodem. Wymagane przed READY_FOR_DEPLOY dla tematu wizualnego (R-PROC-AUTOBOT §9).
- Wizualna różnica grubości na ekranie: NIE ZMIERZONO (ocena po zrzucie).

## BLOKADY
- Brak zrzutu z Chromium (jw.). Nie blokuje testów jednostkowych; blokuje tylko bramkę wizualną.

## UWAGI-DLA-ORKIESTRATORA
- Decyzja o tributary 0,30 vs 0,5 (patrz wyżej) — wartość renderu, nie balansu gry; zgodnie z dispatchem zmiana w zakresie.
- localStorage: brak automatycznego zapisu klucza, więc nie ma potrzeby migracji; stary wpis '2' (jeśli istnieje) to jawny wybór.
- node_modules w gra/ zainstalowane na czas bramek (npm ci) i do usunięcia po commicie (gitignored).

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora po Operatorze -> Evaluator -> Final Control; zrzut Chromium jako osobna bramka wizualna przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
