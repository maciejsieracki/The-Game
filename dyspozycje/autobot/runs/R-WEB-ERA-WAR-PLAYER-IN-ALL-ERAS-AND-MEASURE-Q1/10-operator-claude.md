STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: Runda 4/5 (integracyjna): scalić FC 91d66249c (runda 3) z origin/main 2127238ac i rozstrzygnąć konflikty w dwóch testach main-guard.
ZMIANY/COMMIT: merge --no-ff 91d66249c na bazie 2127238ac; SHA scalenia 1f47ff15adbe3f94ffc657313d2ca42e6bb0ea38 (merge), commit raportu dopisany poniżej. Konflikty rozstrzygnięte na wersję main (finalizePeaceBody) w gra/tools/forced-war-iron-main-guard-test.cjs i gra/tools/forced-war-stone-main-guard-test.cjs; zmiana okna 6000 z FC odrzucona w tych dwóch asercjach; pozostałe hunki FC zachowane (auto-merge). Ancestry: 2127238ac OK, 2bcb3c780 OK. main.ts scalił się automatycznie.
TESTY (surowe wyniki):
- tsc --noEmit (bez flag): exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-archer-slinger: 51 OK, 0 FAIL; unit-replace-full-cost: 40/0; unit-replace-army-multi-select: 36 OK, 0 FAIL (panel Chromium NIE_ZMIERZONO)
- combat-test: 6/6
- era-war-engine-scenario: 27 OK / 0 FAIL
- era-war-player-included: 10 OK / 0 FAIL
- era-war-defer-not-cancel: 29/0
- era-war-delays: 55 OK / 0 FAIL
- era-war-ignore-treaties: 22/0
- era-war-bronze-player-target: 44/0
- forced-war-bronze: 48/0; forced-war-iron: 55/0; forced-war-stone: 31/0; forced-war-reguly-multi-turn: 48/0
- main-guardy: forced-war-iron-main-guard 36 PASS / 0 FAIL; forced-war-stone-main-guard 15 PASS / 0 FAIL; forced-war-bronze-main-guard 22 PASS / 0 FAIL
- war-rules-multiwar-main-guard: 16 PASS / 5 FAIL (baza 2127238ac na tym samym teście: 18 PASS / 3 FAIL). Dwa NOWE czerwone: asercje 'wypowiedz_wojne: licznik epoki per cywilizacja' i 'werdykt != ok -> continue' szukają jednolinijkowego `if (...) continue;`, a FC w main.ts (l.47152, 47165) owinął to w `{ emRej(...); continue; }`. Zachowanie bramki nie zmienione (continue jest). Plik testu NIE jest w allowliście tej rundy — NIE naprawiono; do zrobienia w TESTDEBTQ13 albo osobnym tematem.
- Dług przedistniejący (jw. na bazie): 'klaster państw-miast: interCivWarBlockedForAi PRZED wypowiedzeniem' i 'applyAllianceObligationsOnWar: bramka sojusznika' — 2 czerwone na bazie, nie naprawiano.
BLOKADY: brak dla scalenia. Dyski: podlinkowany node_modules (ln -s /home/user/meas/gra/node_modules), bez npm ci. Bieg dymny i pomiar z rund 2–3 nie są przedmiotem tej rundy i nie były uruchamiane.
RUNDY: 4/5 (integracyjna; Operator HAIKU 5.5)
NASTĘPNY KROK: orkiestrator — decyzja o war-rules-multiwar-main-guard (16/5 vs baza 18/3) przed merge do main; ewentualna naprawa regexów w TESTDEBTQ13.
UWAGI-DLA-ORKIESTRATORA: scratch z eksportem bazy 2127238ac w katalogu scratchpad/base-r4 (do posprzątania przez orkiestratora; nie usuwano).
DEPLOY/PUSH: NIE WYKONANO
