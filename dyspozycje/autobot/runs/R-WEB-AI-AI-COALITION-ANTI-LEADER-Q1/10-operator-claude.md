STATUS: PASS-WITH-NOTES
DOMAIN: GAME (nowa funkcja AI, za flagą koalicjaAntyLiderAktywna=false)
TEMAT: R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1
GOAL: B2 audyt kaskady wezwania sojuszników (odczyt) + B4 wykrycie lidera i premia koalicji antylidera w torze sojuszy AI↔AI, za flagą OFF.
BAZA: 3f679097a (origin/main, merge-base OK). HEAD operatora: patrz pole sha w raporcie strukturalnym.

ZMIANY-COMMIT (allowlista):
- gra/src/game/ai-ai-coalition.ts (nowy): czysta logika lidera (aktualizujLidera, histereza minTur, remis=brak lidera), maPremieKoalicji, hak setAiAiCoalitionEnabledForTest.
- gra/src/game/ai-ai-alliance-tick.ts: opcjonalne pole koalicja; premia wyprzedza willingness TYLKO w wyborze celu; progi E1 i limity bez zmian.
- gra/data/ai-ai-treaty-params.json: koalicjaAntyLiderAktywna=false, liderProgPrzewagi=1.5, liderMinTur=5.
- gra/src/main.ts (minimalne wpięcie): import, stan lidera, blok `if (isAiAiCoalitionEnabled())` w tickAiAiAllianceRequests, hak aiAiAllianceTickForTest.setCoalitionEnabled/getLiderStan.
- gra/tools/ai-ai-coalition-test.cjs (nowy).
- dyspozycje/autobot/runs/R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1/10-operator-claude.md.

AUDYT B2 (kaskada, odczyt, bez zmian kodu):
- Wejście: applyAllianceObligationsOnWar (main.ts:25800) z ownerDeclareWarOn (main.ts:14185) i processDiploCrisisQueue (main.ts:12552). Obowiązki: declared_war (sojusz_pelny napastnika, cel=ofiara) i attacked (sojusz obronny/pełny ofiary, cel=napastnik) — diplomacy-treaties.ts:324-362.
- Sojusznik AI↔AI DOŁĄCZA: joinAllyToWar (main.ts:25710) ustawia wojnę z celem, także gdy cel jest graczem (wtedy pendingPlayer/kolejka ABC).
- Warunki odmowy: ai.ts:6869 -> shouldHonorAllianceWarObligation (alliance-war-obligation.ts:41-55): ratio siły >= 0,55 (0,75 pokojowy), activeWarCount < 1, zaufanie do wzywającego >= 20.
- Blokady: filterAllianceObligationsRespectingPeaceLock (blokada karencji/era), interCivWarBlockedForAi (R1/R2, tylko flaga multiwar).
- LUKI: (1) brak sprawdzenia dystansu; (2) zwykły POKÓJ (bez karencji) z celem nie blokuje dołączenia — joinAllyToWar ustawia wojnę; (3) activeWarCount liczy też barbarzyńców z cities/aiStartHexes (intencja wg komentarza main.ts:25) — gdy barbarzyńca ma miasto, AI-sojusznik prawie zawsze odmawia; (4) licznik 1 wojny jest globalny, nie per epoka. Nie naprawiałem — poza zakresem; do decyzji właściciela.
- Reguła "1 wojna epoki + 1 naturalna": NIE jest tu zaimplementowana (tylko maxWars=1 globalnie).

B4 TESTY:
- node tools/ai-ai-coalition-test.cjs: testy bazowe błędy=0; mutanty wykryte=8/8; WYNIK: ZIELONE (K1-K11).
- node tools/ai-ai-alliance-tick-test.cjs: suite 19/19 OK; mutants detected 8/8; exit 0.
- node tools/ai-ai-treaty-evaluate-test.cjs: 21 pass / 0 fail; mutanty niewykryte: 0.
- node tools/logic-test.cjs: LOGIC OK (213/213). tech-tree-test: 20 pass, 0 fail. research-test: 33/33. ai-unit-replace-same-rules-test: 45/0. unit-replace-test: 21/21. combat-test: 6/6.
- npx tsc --noEmit: exit 0, 0 linii wyjścia.
- Bieg dymny ≤30 tur: NIE WYKONANO (zgodnie z dispatchem). NIE_ZMIERZONO: wpływ koalicji na rozgrywkę.
- Pomiar do zrobienia (opis): metryka tura pierwszej koalicji = pierwsza tura z accepted sojuszem, którego para jest wrogiem lidera (log `[Dyplomacja] AI↔AI Sojusz`); liczba AI w koalicji wobec lidera = liczba owners będących wrogami lidera ze sojuszem AI↔AI z innym wrogiem lidera; porównanie flaga ON/OFF na ziarnach.

BLOKADY: brak. Założenia: brak histerezy wyjścia z lidera (jedna tura poniżej progu zeruje serię); średnia 0 = brak lidera; premia tylko gdy oba są wrogami lidera; gdy premiowany cel odrzucony przez E1, brak fallbacku (jak dziś).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — przegląd diffu i testów; decyzja właściciela o lukach B2 (pokój bez karencji, barbarzyńcy w activeWarCount).
UWAGI-DLA-ORKIESTRATORA: pliki diagnostyczne poza worktree w /home/user/The-Game/.claude/worktrees/ (scratch-npm.log, tsc-out.txt, gate-*.txt) — nie usuwałem (zakaz rm), nie są w commicie.
DEPLOY/PUSH: NIE WYKONANO
