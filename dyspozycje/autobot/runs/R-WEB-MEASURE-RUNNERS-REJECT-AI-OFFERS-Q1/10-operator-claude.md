STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe, bez zmian gra/src)
TEMAT: R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1
GOAL: wspólne odrzucanie wiszących ofert AI->gracz przed sprawdzeniem canEnd w runnerach pomiarowych ekonomii (i wrapperach econ/alliance); liczniki potwierdzone vs próby rozdzielone.
ZMIANY-COMMIT: baza 12da9f405. Nowe: gra/tools/measure-reject-offers.cjs (rejectAwaitingAiOffers -> {attempts, confirmed}), gra/tools/measure-reject-offers-test.cjs. Zmienione: gra/tools/diplomacy-harder-measure-run.cjs (używa wspólnej funkcji, to samo wywołania reject), gra/tools/ai-economy-measure-run.cjs (odrzucenie przed canEnd, druga próba gdy canEnd=false, liczniki aiOffersRejected / aiOffersRejectAttempts w ctxState, summary i wierszu jsonl). ai-ai-alliance-measure-run.cjs i econ-measure-run.cjs nie wymagały zmian (delegują do ai-economy-measure-run.cjs). SHA: patrz pole sha w odpowiedzi orkiestratorowi.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-economy-measure-hook-test: 23/23 zielone
- diplomacy-harder-measure-hook-test: 15 zielonych, 0 czerwonych
- measure-reject-offers-test (nowy): 8 OK, 0 FAIL; mutacja kopii (potwierdzenie zawsze =1): 7 OK, 1 FAIL (asercja 4 "proba bez skutku: confirmed=0", confirmed=1) -> czerwona
- Seed 1234, ai-economy, PRZED (runner z 12da9f405): cannot-end w t18 (reason cannot-end, tura 18, brak bitew/modali, pending 0)
- Seed 1234, ai-economy, PO: t18 przeszła; dojście do t40 bez stop (stop=null), 39 wierszy jsonl (t2..t40); jedyny wiersz z ofertą: t19 aiOffersRejected=1, aiOffersRejectAttempts=1
- Parytet seed 4242, 20 tur, PRZED vs PO: 19 wierszy, 0 różnic po pominięciu pól czasowych (sec, load1) i pól ofert; oferty 0/0 we wszystkich turach
BLOKADY: brak. Uwagi: bundle zbudowany poza repo (scratchpad, vite build --outDir); npm ci --ignore-scripts wykonany w gra/ (node_modules, nieśledzone). Nie usunięto node_modules ani katalogów scratchpad (rm zakazane przez dispatch) — sprzątanie po stronie orkiestratora.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (zgodność ze spec, mutacja, parytet); decyzja pomiarowa „pasywny gracz odrzuca oferty” pozostaje do ABC właściciela (nie zmieniana).
UWAGI-DLA-ORKIESTRATORA:
- Semantyka zmieniona w diplomacy-harder-measure-run.cjs: pole aiOffersRejected = potwierdzone odrzucenia (wcześniej: liczba prób). Zachowanie gry w runnerze bez zmian; nowe pole aiOffersRejectAttempts.
- W ai-economy-measure-run.cjs: liczniki aiOffersRejected/aiOffersRejectAttempts dopisane do COUNTER_KEYS (nowe pola w state/slotCounters, dla starych slotów startują od 0).
- Pozostały poza zakresem: ewentualna dalsza analiza analizatorów (econ-measure-analyze.cjs) nie czyta nowych pól; nie zmieniano.
DEPLOY/PUSH: NIE WYKONANO
