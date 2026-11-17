STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-DESPAIR-SHOW-FORMULA-IMPL-Q1
GOAL: panel gracz↔AI pokazuje desperację przeciwnika = wynik loserDespair (bez bramki 50% zmęczenia); 0% gdy przeciwnik nie jest wyraźnie słabszy (udział > udzialWyraznie); czytelne podpisy wierszy (nazwa cywilizacji); poprawione komentarze i tooltip; test parytetu + mutacja.
ZMIANY-COMMIT: baza 61c7b64cb (origin/main). Gałąź lokalna autobot/R-WEB-DIPLO-DESPAIR-SHOW-FORMULA-IMPL-Q1. Pliki: gra/src/game/war-weariness-view.ts (usunięta bramka isWarWeary w gałęzi 'ai'; komentarze ~12, ~28, ~56, ~112), gra/src/game/diplomacy-display.ts (tooltip „Desperacja” z liczbami z war-weariness-params.json przez import JSON; funkcja warDespairTooltipPl), gra/src/ui/diplomacyAudience.ts (wiersze podpisane st.playerCivName zamiast „Ty”), gra/tools/diplo-weariness-display-test.cjs (E4a zmieniona celowo; nowe E5 = tabela parytetu), gra/tools/diplo-panel-aiai-both-labels-test.cjs (A6: „Ty” → nazwa cywilizacji). Nie zmieniono: war-weariness.ts, war-weariness-params.json, ai.ts, main.ts, WERSJE.md. Commit: SHA w polu sha (kod + ten raport).
TESTY (surowe wyniki):
- npm ci --ignore-scripts w gra/: OK (node_modules gitignored, do sprzątania przez orkiestratora)
- npx tsc --noEmit: exit 0
- diplo-weariness-display-test: PASSED 53 / FAILED 0 (w tym E4a, E5 24/24 zgodnych)
- mutacja (przywrócona bramka isWarWeary): FAIL E4a i E5 (E5 14/24 zgodnych), exit 1; po przywróceniu 53/0
- diplo-weariness-stages-view-test: 22 pass / 0 fail
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass / 0 fail; research-test: PASSED 33 / FAILED 0; unit-replace-test: 21/21; combat-test: 6/6
- diplomacy-display-test 45 OK / 0 FAIL; diplo-weariness-pw-row-ui-test 15/0; diplo-weariness-20-turns-test 31/0; diplomacy-relacje-ai-ai-audiencja-test 20/0; diplomacy-audience-status-banner-test 14/0; ids-leak-audit-test 1725/0; polish-language-audit-q1-guard-test 7497/0; json-descriptions-sync-test 19/0; diplo-weariness-forced-peace-test 14/0
- diplo-panel-aiai-both-labels-test: przed zmianą 16 OK / 1 FAIL (A6 — asercja „Ty”, zmiana celowa); po poprawce 17 OK / 0 FAIL
BLOKADY: dowód live w Chromium (zrzut panelu z wierszami Zmęczenie/Desperacja, hak civTest) NIE ZMIERZONO w tej rundzie — brak czasu/zasobów na harness przeglądarkowy; pokrycie wyłącznie testami statycznymi na bundlu (esbuild).
ODCHYLENIE OD DISPATCHU (tabela parytetu): udział 0,6 nie jest udziałem przegrywającego (strona o udziale > 0,5 wygrywa), więc tabela ma udziały przegrywającego 0,27 i 0,45 × poziom (tury 0/11/20/40) × utracone miasta (0/1/3) = 24 przypadki. Dla remisu test sprawdza brak desperacji (obie strony „rowny”).
ZAŁOŻENIA: (1) „udział > udzialWyraznie → 0%” zachowany przez loserDespair (nie dodawano osobnej gałęzi). (2) Podpis wiersza = nazwa cywilizacji gracza (st.playerCivName już istnieje w stanie audiencji; nie zmieniano main.ts). (3) Liczby w tooltipie czytane z war-weariness-params.json (wagaZmeczenia, wagaSily, wagaStrat, stratyNasycenie, udzialWyraznie).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) — ocena zgodności z GOAL, weryfikacja mutacji i parytetu; ewentualny dowód live w Chromium (NIE ZMIERZONO) jako osobny krok lub odnotowany wyjątek.
UWAGI-DLA-ORKIESTRATORA: dispatch (00-dispatch.md) istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie w origin/main; audyt 50-final-control jest w origin/main. Katalog gra/node_modules (gitignored) do usunięcia przy sprzątaniu worktree. Poza zakresem (nie ruszano): #513 DIPLO-1 (City27 w ofercie), #515 DIPLO-3 (wyjaśnienie skali w Civpedii) — mogą wymagać dopasowania tekstów tooltipu.
DEPLOY/PUSH: NIE WYKONANO
