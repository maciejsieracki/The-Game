STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: nośnik dopłaty D w traktatach (NAP, sojusz obronny, sojusz pełny, przemarsz, wasal): technologie -> złoto -> brąz -> żelazo -> rudy; płaci słabsza strona wg Power; przelew faktyczny po akceptacji, w obu kierunkach.
ZMIANY/COMMIT: kandydat ee6a6e6cc6b1636e9d2f3f5374573db9b98a6c82 jest potomkiem bazy 0991da945 (merge-base --is-ancestor: tak). Diff vs baza: gra/src/main.ts, gra/src/game/diplomacy-proposals.ts, gra/tools/diplo-treaty-payment-live-test.cjs, dwa raporty runs/** (wszystko w allowliście). Raport FC: ten plik. integration_sha = ee6a6e6cc6b1636e9d2f3f5374573db9b98a6c82.
TESTY (surowe wyjście, własny przebieg na czystym npm ci --ignore-scripts, kandydat ee6a6e6cc):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- carrier 11/0 (mutanty niewykryte 0); wiring 468/0; power-parity 50/0; ai-parity 80/0; rozejm-parity 25/0
- peace-tail-integration 42/0; tail-proposal 9/0; war-peace-sim 25/0; last-stage-payment OK (M2, M3 wykryte)
- LIVE (Chromium, bundle Vite poza repo /tmp/fcb/b, ?playtest=mapa): 149/149 passed, exit 0; 2 pozycje NIE ZMIERZONO (znane luki, niżej).
- Własny mutant: usunięcie carrierCtx z wrappera -> FAIL S1 i S2 (wykryty); main.ts przywrócony (git checkout).
ZARZUT 1 (test live omija produkcyjne miejsca wywołania): ODDAL (naprawione w kandydacie). Wszystkie akceptacje oferty AI przez gracza w main.ts idą przez jedną funkcję resolvePlayerAcceptsAiPendingWired (carrierCtx tylko tam). Grep: jedyne bezpośrednie wywołanie resolvePlayerAcceptsAiPending( poza wrapperem to applyAiAiHandelSurowiecCmd (AI<->AI handel surowcem, poza zakresem, nie traktat). Hak testowy i realne przyciski wołają ten sam wrapper; statyczna bramka S1/S2 w teście live łapie usunięcie kontekstu. Pierwotny mutant (usunięcie carrierCtx z 7 miejsc) nie jest już możliwy bez zmiany wrappera, a ta zmiana jest wykrywana.
ZARZUT 2 (przemarsz/wasal gracz->AI bez przelewu live; wasal AI->gracz): częściowo ODDAL, resztę DO DECYZJI CZŁOWIEKA. Zmierzone live: AI->gracz wszystkie pięć traktatów (w tym przemarsz i wasal, z asertowaną precondycją Respektu) przelewa zgodnie z wierszem okna; gracz->AI NAP i oba sojusze przelewają. Pozostaje: każda akcja gracz->AI, gdy gracz jest silniejszy (płatnikiem powinna być AI), przechodzi bez nośnika, zapasy AI nietknięte; planer obsługuje tylko gracza jako płatnika. Dla przemarszu i wasala (progi Respektu wymuszają silniejszego gracza) to jedyny wariant gracz->AI. Czy AI ma płacić D ze swoich zapasów to realna decyzja produktowa (nowy planer z zapasami/technologiami AI, ryzyko dla ekonomii AI) - nie była rozstrzygnięta w dispatchu. Nie jest to regresja (zachowanie sprzed tematu).
BLOKADY: brak (df 7,4 GB, instalacja pełna).
RUNDY: FC po r4 (obrona); zużyte 4/5 rund.
UWAGI-DLA-ORKIESTRATORA: (1) ABC do właściciela: czy płatnik-AI (gracz silniejszy) płaci D z zapasów AI; do czasu decyzji luka gracz->AI przy silniejszym graczu = traktat bez dopłaty (stan jak przed tematem). Integracja kandydata jest bezpieczna bez tej decyzji, ale temat nie jest w pełni zamknięty. (2) Stopnie praca/pieniądze nadal poza zakresem (decyzja 3b). (3) Do sprzątnięcia: worktree .claude/worktrees/wf_715b93b3-518-4 (gra/node_modules), /tmp/fcb, /tmp/fc_*.log.
NASTĘPNY KROK: integracja orkiestratora ee6a6e6cc -> main, deploy ROBOCZA wg reguł; ABC dla płatnika-AI.
DEPLOY/PUSH: NIE WYKONANO
