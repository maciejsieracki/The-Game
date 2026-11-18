STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1
GOAL: Sojusze AI↔AI (cel min. 1, limit 2 na cywilizację) za flagą torSojuszyAktywny=false; zachowanie gry bez zmian.
ZMIANY/COMMIT: baza e29f8c8b3 (ancestor of origin/main: OK). Pliki: gra/src/game/ai-ai-alliance-tick.ts (nowy, czysta logika), gra/src/game/ai-ai-treaty-tick.ts (NIE zmieniony), gra/data/ai-ai-treaty-params.json (torSojuszyAktywny=false, maxSojuszyNaCywilizacje=2, alliancePonowneProbyTur=8), gra/src/main.ts (+98: import, tickAiAiAllianceRequests ~L25467 z bramką flagi, wołanie po NAP ~L47383, hak __truceTestDebug.aiAiAllianceTickForTest ~L31370), gra/tools/ai-ai-alliance-tick-test.cjs (nowy), ten raport. SHA: patrz pole sha.
TESTY:
- tsc --noEmit: EXIT 0, 0 linii błędów.
- ai-ai-alliance-tick-test.cjs: suita 17/17 OK; mutanty 6/6 wykryte (M1 limit, M2 bramka wojny, M3 duplikaty, M4 kadencja, M5 odwrócone willingness, M6 skarbiec).
- logic-test: LOGIC OK 213/213. tech-tree-test: 20 pass / 0 fail. research-test: 33/0. unit-replace-promotion-table: PASS. unit-replace-multitype-walk: 25 OK / 0 FAIL. unit-replace-archer-slinger: 51 OK / 0 FAIL. combat-test: All sanity checks passed.
- unit-replace-full-cost-test: 39 passed / 1 failed (performUnitReplace gracz) — IDENTYCZNIE na bazie e29f8c8b3 (zweryfikowane w osobnym worktree; poza zakresem).
- ai-ai-treaty-evaluate-test: PASS (A1–A19 + mutanty). ai-ai-treaty-nap-wiring-test: rc=0, mutant wykryty.
- ai-ai-treaty-live-proof-wiring-test / -breach-test: rc=2 (wymagają katalogu wyniku i przeglądarki) — NIE_ZMIERZONO.
- Bieg dymny 30 tur seed 4242 z flagą true (hak): NIE_ZMIERZONO — brak bundla dist i przeglądarki Playwright w piaskownicy.
- Runner/analizator (econ-measure-style) dla sojuszy: NIE dostarczone — bez przeglądarki nie da się ich uruchomić/zweryfikować.
- Długie biegi 150 tur × 3 ziarna: orkiestrator (zgodnie z dispatchem).
BLOKADY: brak. Brak gotowej listy „Układy w świecie” w src (grep: 0 trafień) — UI w panelu dyplomacji NIE zrobione (zgodnie z dispatchem: nie tworzyć nowego UI).
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: Evaluator (weryfikacja mutantów i założeń), potem pomiar 150 tur × 3 ziarna z flagą true przez hak aiAiAllianceTickForTest.setEnabled(true) oraz runner w przeglądarce.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Założenia (brak rozstrzygnięcia w dispatchu): akcja E1 = 'sojusz_pelny' (wspólna obrona i atak); limit liczy wyłącznie sojusze AI↔AI między owners (sojusze z graczem poza limitem); wybór celu = najwyższa willingnessAlly, remis → wspólny wróg, remis → najniższe id; kandydat z wojną/rozejmem/sojuszem pomijany przed evaluate.
2. Ścieżka zawarcia: dispatch każe wpiąć się w ścieżkę sojuszu gracz↔AI. Ta to applyProposalOutcomeImpl (main.ts ~L26475–26476: applyAcceptedProposal + syncRelationFromDeals). Krok AI↔AI zawiera sojusz jak NAP i sojusz siostrzany (addTreaty rodzaj 'sojusz_pelny', wygasaTura null, + syncRelationFromDeals) — NIE przez applyAcceptedProposal, bo wymaga ono wyniku z UI gracza. Odchyłka odnotowana.
3. Po włączeniu flagi sojusze uruchomią istniejącą kaskadę wezwania do wojny (alliance-war-obligation.ts) — efekt do zmierzenia, nie zweryfikowany.
4. Nie zmieniano reguł akceptacji E1, ai-ai-treaty-tick.ts, ani flagi domyślnie (false).
5. Pliki spoza allowlisty nie dotknięte (rust-port, gra-robocza, WERSJE.md, manifest — brak zmian).
