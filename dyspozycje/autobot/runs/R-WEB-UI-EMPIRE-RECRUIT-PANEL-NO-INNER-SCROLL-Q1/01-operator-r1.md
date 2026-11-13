STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1
GOAL: Lista jednostek w panelu „Rekrutacja — cała cywilizacja” bez wewnętrznego paska przewijania; jedno zewnętrzne przewijanie całego panelu; przyciski „Rekrutuj wszystkie” widoczne (sticky); brak regresji liczników (domyślnie 0).
BAZA: origin/main = ab1188446 (FALA 582, ROBOCZA). Dispatch wskazywał bazę po FALA 576; kod po FALA 576 zawiera się w tej bazie.
ZMIANY/COMMIT: 
- gra/src/ui/empireRecruitPanel.ts — CSS: `#civ-empire-recruit-panel` ma `overflow-y:auto` (jedyne przewijanie); `.erp-list` bez `overflow-y:auto` i bez limitu wysokości (`flex:none`); nagłówek „Zamknij” i górny „Rekrutuj wszystkie” zgrupowane w `.erp-stick` (`position:sticky; top:0`); pozycja przewijania panelu zachowana przy przebudowie DOM (`root.scrollTop`) zamiast `.erp-list.scrollTop`.
- gra/tools/empire-recruit-panel-no-inner-scroll-test.cjs — nowy test (Chromium + esbuild, 30 typów, okna 900x560 i 360x640, mutant `EMPIRE_RECRUIT_UI_MUTANT=inner-scroll`).
- dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1/01-operator-r1.md (ten raport).
- Poza zakresem (nie zmieniano): gra/src/ui/cityPanel.ts. Listy rekrutacji w panelu miasta używają osobnego mechanizmu `createScrollList`/`.list-scroll` (wspólny z innymi listami, pokryty testami recruit-list-visibility-*); to nie jest ta sama lista co w panelu zbiorczym, więc zgodnie z zasadą „tylko jeśli ta sama lista” pozostawiono bez zmian. Założenie do decyzji orkiestratora: jeśli właściciel chce też suwak usunąć z list miast, to osobny temat.
TESTY:
- empire-recruit-panel-no-inner-scroll-test.cjs (Chromium 141 /opt/pw-browsers/chromium): 17 PASS / 0 FAIL. Sprawdzone: overflow-y listy visible; scrollHeight==clientHeight; wysokość listy >= suma wierszy; 30/30 pozycji w DOM; panel overflow-y auto i treść wyższa niż okno; przewinięcie panelu do końca pokazuje ostatnią pozycję; „Rekrutuj wszystkie” (góra) widoczne po przewinięciu; liczniki domyślnie 0; „+” na ostatniej pozycji działa; wąski ekran 360 px: bez poziomego scrolla panelu i dokumentu; reset sesji; brak błędów konsoli.
- Mutant inner-scroll (przywrócony overflow-y:auto + max-height na liście): 6 FAIL — test wykrywa regresję.
- empire-recruit-panel-real-render-test.cjs: 26 PASS / 0 FAIL.
- empire-recruit-all-test.cjs: 31 PASS / 0 FAIL.
- empire-recruit-plan-test.cjs: 17 PASS / 0 FAIL.
- empire-recruit-live-test.cjs: NIE_ZMIERZONO — test wymaga pełnego `vite build` gry (vite.config.ts używa vite-plugin-singlefile i pełnego zestawu zależności gra/); w tym worktree brak instalacji gra/node_modules, a pełna instalacja/build w gra/ jest poza dozwolonym zakresem tematu (zakaz build w gra/). Zmiana dotyczy wyłącznie CSS/DOM panelu i nie zmienia wiringu main.ts.
- Wizualnie: zrzut ekranu nie wykonany w tym temacie (NIE_ZMIERZONO); dowód strukturalny i behawioralny z Chromium jak wyżej.
- git diff --check: czysto.
BLOKADY: brak blokad kodu. Środowisko: gra/node_modules nie istnieje w worktree (użyto tymczasowego symlinka do instalacji poza repo, usuniętego przed commitem). Test live NIE_ZMIERZONO (patrz wyżej).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu i testu; Final Control po PASS; orkiestrator decyduje o cityPanel (lista miasta z suwakiem) jako osobnym tematem, jeśli właściciel tego chce.
DEPLOY/PUSH: NIE WYKONANO
