# Obrona Operatora — R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1, runda 3 (odpowiedź na zarzuty Evaluatora 9755504217)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: zamknąć zarzuty Evaluatora r3 (widok etapów, tekst okna pokoju wymuszonego, testy h5b/h6b, mutacje, pomiary) albo jawnie uzasadnić odrzucenie.
BAZA: 1931a420b (kandydat r3, potomek fadf21af9; fadf21af9 jest przodkiem HEAD).
SHA KODU: eb96ccfd6 (commit z kodem i testami). SHA tego raportu: w commicie raportu (podany w odpowiedzi orkiestratorowi).

## Odpowiedź na zarzuty

| Nr | Zarzut Evaluatora | Decyzja | Dowód |
|---|---|---|---|
| 1 | Brak pomiaru symulacyjnego ≥3 ziarna × ≥150 tur | NIE ZMIERZONO (z uzasadnieniem) | Pomiar wymaga buildu vite kopii gra/ poza repo, Playwright i headless Chromium (`ai-war-weariness-live-audit-measure.cjs`) oraz 3×150 sekwencyjnych tur. Każde wywołanie Bash ma limit 590 s, run_in_background jest zakazany, na dysku zostało 7,7 GB. Nie wykonano w tej rundzie; dług do osobnego tematu pomiarowego. |
| 2 | Okno gracza i wpis „Ważne” bez testu; tekst okna odbiega od DODATKU 1 | PRZYJMUJĘ częściowo | Tekst okna wyniesiony do czystej funkcji `forcedPeaceModalTextPl` (war-weariness-view.ts), zgodnej z DODATKIEM 1: „Wojna z X osiągnęła 100% zmęczenia — pokój wymuszony.”, „Oddajesz: <nazwy miast>.” / „Otrzymujesz: <nazwy>.” / „Pokój bez wymiany miast.”. Lista nazw zamiast liczby (main.ts: `cityNames` z `o.plan.items`). Testy mt1–mt3 w diplo-weariness-stages-view-test (22/0). Wpis „Ważne” i samo okno DOM bez testu w Node: NIE ZMIERZONO (Chromium); wiring z main.ts pokryty tylko przez tsc. |
| 3 | Widok etapów tylko w tooltipie; błąd odmiany „Za 1 tur”, „Za 2 tur” | PRZYJMUJĘ | Odmiana po liczebniku przez `formatTurCountAcc` (1 turę / 2 tury / 5 tur / 12 tur; testy gr1–gr4). Pełna lista etapów dopisana do tooltipa przez `warWearinessStagesSummaryPl` („Etapy: 50% — chęć pokoju; 80% — AI proponuje pokój z miastami; 100% — pokój wymuszony.”), testy sm1, lb3. Nowego elementu DOM w panelu nie dodawano. |
| 4 | h5b i h6b osłabione do negatywnych | PRZYJMUJĘ | h6b: asercja pozytywna, 40 tur, słabsza AI, 6 miast → dokładnie jedna `oferuj_miasto_za_pokoj` (rodzaj pokoj), brak bezwarunkowego (sonda: `[{"type":"oferuj_miasto_za_pokoj",...,"rodzaj":"pokoj"}]`). h5b: ścisła asercja `length === 0` (sonda: `[]`). Czułość h5b: ta sama konfiguracja dla słabszej AI przy 32 turach daje pozytywną ofertę (h6), więc mutacja „AI zawsze pusta” łamie h6/h6b. Test: 35/0. |
| 5 | Mutacje ceil→floor i klamry migracji niezreprodukowane | PRZYJMUJĘ (wykonane) | M1 ceil→floor w `warWearinessTurnsToLevel`: diplo-weariness-stages-view-test → FAIL tr4 (0,99 → 100% = 1 tura), 21/1. M2 usunięcie `if (st.peak > level) st.peak = level;` (war-weariness.ts:285): diplo-weariness-migration-peak-test → FAIL m1, m2, m3, PASS=4 FAIL=3. Oba pliki przywrócone; zmiany w worktree wyłącznie z commita eb96ccfd6. |

## Zmiany (commit eb96ccfd6)
- gra/src/game/war-weariness-view.ts: odmiana „Za N tur”, `warWearinessStagesSummaryPl`, `forcedPeaceModalTextPl`, import formatTurCountAcc z ui/formatPl.
- gra/src/game/diplomacy-display.ts: tooltip zmęczenia = podpowiedź + pełna lista etapów.
- gra/src/ui/diplomacyAudience.ts: showForcedPeaceModal korzysta z forcedPeaceModalTextPl (opcje ForcedPeaceTextInput, `cityNames`).
- gra/src/main.ts: `cityNames` z planu pokoju w wywołaniu showForcedPeaceModal.
- gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs: h5b ścisła, h6b pozytywna.
- gra/tools/diplo-weariness-stages-view-test.cjs: eksport nowych funkcji, testy gr1–gr4, sm1, lb3, mt1–mt3.

## TESTY (surowe wyniki, ten commit)
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- Bramki referencyjne: logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21); combat-test 6/6 pass.
- diplo-weariness-stages-view-test: 22 pass / 0 fail.
- diplo-peace-weaker-seeks-city-only-test: 35 pass / 0 fail.
- diplo-weariness-forced-peace-wiring-test: 13 pass / 0 fail (bez zmian kodu wiringu).
- diplo-weariness-migration-peak-test: PASS=7 FAIL=0 (bazowo); mutacja M2: PASS=4 FAIL=3.
- diplo-war-peace-profile-unit-test: 198 pass / 0 fail.
- diplo-weariness-display-test: exit 0.
- Mutacja M1 (ceil→floor): stages-view 21/1 (FAIL tr4).
- NIE URUCHOMIONO w tej rundzie: load-game-regression, determinizm (wymagają pełnego harnessu). Znany dług: load-game-blockers-exec-test czerwony także na bazie fadf21af9 (dług bazowy, nie regresja).

## BLOKADY
- Pomiar symulacyjny 3×150 tur (zarzut 1): NIE ZMIERZONO, patrz tabela.
- Chromium: okno gracza, wpis „Ważne”, panel etapów 1280×720: NIE ZMIERZONO.
- `gra/node_modules` zainstalowane w worktree przez `npm ci --ignore-scripts` (bez Playwrighta); nie jest częścią commita.

## RUNDY
- Runda 3/5 (obrona po FC r3).

## NASTĘPNY KROK
Evaluator: ponowny przegląd eb96ccfd6 względem zarzutów 2–5 (przyjęte) i 1 (NIE ZMIERZONO z uzasadnieniem). Final Control decyduje, czy pomiar 1 staje się długiem.

## UWAGI-DLA-ORKIESTRATORA
- Dług pomiarowy (zarzut 1) i Chromium (zarzut 2) do osobnego tematu z własnym pomiarem; wymaga czasu poza jednym wywołaniem Bash.
- Tekst okna używa wzorca „Wojna z <nazwa> osiągnęła 100% zmęczenia” (nazwa bez odmiany, jak w istniejących oknach dyplomacji). Ewentualna odmiana do decyzji ABC.

DEPLOY/PUSH: NIE WYKONANO
