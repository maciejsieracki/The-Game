STATUS: BLOCK
DOMAIN: GAME (pomiar na żywo; bez zmian logiki gry)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (f) kalibracja stosunku sił r; (d) hak ceny pokoju i ogon złoto→brąz/żelazo/rudy; (a) render wiersza D w oknie traktatu.
ZMIANY-COMMIT: baza f8f30135a; commit z kodem = czubek gałęzi detached (SHA podany w polu sha odpowiedzi). Zmieniony plik: gra/tools/diplo-treaty-pay-ladder-live-verify-test.cjs (nowa stała R_TARGET=1,3; ustawianie bonusu z nachyleniem 2: bonus=(r·gracz−base)/2; asercja R1 ±0,05 w każdym przypadku). Dowód: runs/.../dowody/lv2-run-krok1.log. Brak zmian w gra/src/main.ts (hak NIE dodany). Brak zmian logiki gry.
TESTY:
- Krok 1 (f): ladder-live-verify (vite build poza repo, Chromium) → 19/19 OK. Zmierzone r: 1,300 (ai=3702, gracz=2847); 1,301 (ai=1206, gracz=927) w przypadkach L-B i L-C. R1 OK we wszystkich trzech.
- tsc --noEmit: exit 0.
- NIE ZMIERZONO w tej rundzie: logic-test, tech-tree-test, research-test, unit-replace-test, combat-test (nie uruchamiane — zmiana dotyczy tylko narzędzia testowego, ale bramki NIE zostały wykonane).
- Okno traktatu (wiersz r w tooltipie) NIE ZMIERZONO — pomiar w tym kroku czytał getPowers, nie DOM okna.
BLOKADY:
- KROK 2 (d, hak civTest ceny pokoju >0 + pomiar ogona): NIE ZROBIONE w tej rundzie. Powód: czas/zakres rundy, nie przeszkoda techniczna. Punkt wejścia do następnej rundy: peace-tail / plan pokoju w main.ts (szukać peacePlan).
- KROK 3 (a, zrzut okna D + asercje tekstu + mutacja): NIE ZROBIONE.
- (f) przyczyna: potwierdzona wcześniej jako współczynnik 2 (power-objective.ts:257); w tej rundzie zweryfikowana kalibracja, nie ponownie diagnozowana.
- Wariant „Oddajesz: miasta": NIE ZMIERZONO.
- Zrzuty: brak (żaden PASS nie jest podany bez zrzutu).
RUNDY: 2/5 (Operator). Ostatni werdykt FC runda 1: FAIL (kod nie powstał).
NASTĘPNY KROK: runda 3 — KROK 2 (hak civTest w gra/src/main.ts, WYŁĄCZNIE blok __cityCessionTestDebug/__truceTestDebug) i KROK 3 (render okna D).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: środowisko — gra/node_modules zainstalowane przez `npm ci --ignore-scripts` w worktree (gitignored); bundle Vite w katalogu scratchpad sesji (poza repo). Procesy w tle nie były uruchamiane. Bez spawn_task/create_session.
