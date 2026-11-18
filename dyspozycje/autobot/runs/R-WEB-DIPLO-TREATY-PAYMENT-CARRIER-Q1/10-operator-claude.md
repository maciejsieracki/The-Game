STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: nośnik dopłaty D traktatów (NAP, sojusz obronny/pełny, przemarsz, wasal): technologie -> złoto -> brąz -> żelazo -> rudy; r3 = naprawa kierunku AI->gracz (realna akceptacja oferty AI przelewa pozycje z zapasów gracza).
ZMIANY/COMMIT: baza 0991da945 (Operator SONNET po 2 nieudanych rundach Haiku). SHA commita w polu `sha` wyniku (czubek pracy).
- gra/src/game/diplomacy-proposals.ts: `resolvePlayerAcceptsAiPending` dostaje `opts.carrierCtx`; po akceptacji oferty AI-traktatu (autor != gracz, akcje z TREATY_CARRIER_ACTIONS) wywołuje `treatyParityPowerGate` (brak środków => odmowa z tym samym powodem co okno) i `attachTreatyCarrier` (ta sama funkcja planująca co wiersz okna) => wynik niesie `treatyCarrier` (side=responder).
- gra/src/main.ts: 7 wywołań resolvePlayerAcceptsAiPending dostaje `carrierCtx: buildProposalEvalContext(...)` (poza handlem surowcami AI, l.~25038); przelew robi istniejący `treatyCarrierPayloadPatch` + `transferBasketItems`. Techy nośnika filtrowane `techIdsWithPrereqsMetForRecipient` (inaczej Murarstwo bez prerekwizytu było liczone w PN, a grantTechToOwner je odrzucał — zmierzone live). Hooki testowe w `__cityCessionTestDebug`: treatyPaySetHoldingsForTest, treatyPayHoldingsForTest, treatyPayAcceptAiPendingForTest, treatyPayProposeAsPlayerForTest (wołają realne funkcje).
- gra/tools/diplo-treaty-payment-live-test.cjs (nowy): Chromium, build poza repo, pięć traktatów x 2 kierunki, stan PO.
TESTY (surowe wyniki):
- tsc --noEmit: exit 0 (npm ci --ignore-scripts, df 7,5 GB).
- 5 bramek: logic 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6.
- live nowy: 149/149. AI->gracz: NAP, sojusz obronny (osobna asercja), sojusz pełny, przemarsz, wasal — zaakceptowano, carrier=[tech Obróbka drewna, złoto], płatnik -dokładnie pozycje, odbiorca +, nigdy <0, tech tylko niewłasna odbiorcy i z prerekwizytem; nośnik akceptacji == wiersz okna (NAP/sojusze/przemarsz). Gracz->AI: NAP, sojusz obronny, sojusz pełny zaakceptowane z nośnikiem side=proposer, stan PO zgodny.
- mutanty live wykryte: L1 usunięty przelew (126/150), L2 zamiana kierunku (126/150), L3 brak filtra techów drugiej strony (141/157), L4 brak nośnika w akceptacji AI (60/75).
- regresje bez zmian: carrier 11/0, wiring 468/0, power-parity 50/0, ai-parity 80/0, rozejm-parity 25/0, peace-tail-integration 42/0, tail-proposal 9/0, war-peace-sim 25/0, last-stage OK. Tabela przed/po: identyczne (przed r2 = po r3).
BLOKADY / NIE ZMIERZONO:
- gracz->AI przemarsz i wasal: AI odmawia wcześniej (Respekt >=55 / >=70; słabszy gracz nie spełni) — nośnik nie dochodzi do skutku, zgodnie z zasadą; NIE ZMIERZONO live.
- wasal AI->gracz: okno oferty odrzuca z bramki Respekt, więc zgodność z wierszem okna NIE ZMIERZONO (realna akceptacja niesie nośnik).
- w live nośnik pokrywa złoto (+1 tech); drabina brąz/żelazo/rudy tylko w testach czystych (carrier 11/0, wiring 468/0). Render wiersza w Chromium NIE ZMIERZONO. Praca/pieniądze poza zakresem (rano).
RUNDY: 3/5
NASTĘPNY KROK: Evaluator.
UWAGI-DLA-ORKIESTRATORA: akceptacja oferty AI z parytetem bez wystarczających zapasów jest teraz odmawiana (wcześniej przechodziła za darmo). Kopie do sprzątnięcia: worktree .claude/worktrees/wf_715b93b3-518-1 (gra/node_modules), /tmp/tpay, /tmp/tpay-live.log, /tmp/tpay-m-*.log.
DEPLOY/PUSH: NIE WYKONANO
