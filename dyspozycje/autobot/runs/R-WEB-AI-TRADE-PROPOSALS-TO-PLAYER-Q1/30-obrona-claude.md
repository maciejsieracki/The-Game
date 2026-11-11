STATUS: PASS-WITH-NOTES (obrona zarzutow Evaluatora; werdykt koncowy nalezy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1
GOAL: AI sama skuada graczowi uczciwa, obustronnie korzystna propozycje cyklicznej wymiany surowcow (deficyt AI + najbardziej brakujacy surowiec gracza), cooldown 15 tur, osobny klucz odrzucenia.
ZMIANY-COMMIT:
- Kandydat (baza): f20b81654 (origin/codex/trade-resume), 638e90bea jako baza kandydata.
- Poprawka obrony: b920196b617c34f43021b982df3c90222db72b9e (gałąź lokalna obrona/ai-trade-proposals-claude, worktree wf_7955f3b3-b10-2).
- Allowlista poprawki: gra/src/main.ts (5 linii, 2 wstawienia/usuniecia), gra/tools/ai-trade-proposal-to-player-test.cjs (+35), gra/tools/ai-trade-proposal-branch-test.cjs (nowy, 10 asercji). Brak zmian w WERSJE.md, gra-robocza/, istniejacych testach (bez oslabiania), ai-params, regułach wyceny/uczciwosci.
- Czysty merge poprawki z origin/main (261e736de): `git merge-tree --write-tree origin/main HEAD` rc=0, tree 99c0ccae06c77b9a37b2b0c6a7d2b86e666faafd. Kandydat f20b81654 jest przodkiem HEAD (`merge-base --is-ancestor` = tak). Merge nie wykonany w drzewie (tylko merge-tree).
- Commit raportu: patrz sekcja DEPLOY-PUSH / SHA w odpowiedzi orkiestratorowi.

ODPOWIEDZI NA ZARZUTY:
1. Pokrycie kryteriow dispatchu - PRZYJETE CZESCIOWO.
   - PRZYJETE: brak oferty bez technologii Wymiana/kontaktu/w wojnie; brak oferty gdy AI nie ma deficytu; brak oferty gdy gracz nie ma deficytu/nadwyzki; zakres AI->gracz (partnerId != '0' nie generuje oferty); cooldown 14/15/16 na realnej funkcji decideAIDiplomacy (nie na helperze). Dowod: tools/ai-trade-proposal-branch-test.cjs, wynik "10 passed, 0 failed" (ponizej). Mutacja bramki contactEstablished (usuniecie `rel.contactEstablished === true`): test B = FAIL (zabity).
   - PRZYJETE: negatywne przypadki selektora (brak deficytu AI, brak deficytu gracza, brak nadwyzki gracza) dodane do tools/ai-trade-proposal-to-player-test.cjs.
   - ODRZUCONE (NIE_ZMIERZONO, poza zakresem tej rundy): "realny tick pierwszej dostawy" - test nadal uzywa transferSurowiecIlosc (ta sama funkcja, ktorej uzywa cykliczny tick), a nie tickCyclicResourceTradeDeals; "akceptacja przez realny handler UI" - brak harnessu UI, Chromium nie uruchamiano; "stare zapisy" - pole meta.aiResourceBarterLastProposalTurn jest opcjonalne, ladowanie jest w `if (savedResourceBarterCooldown?.length)` (main.ts, przy wczytywaniu zapisu), brak testu runtime. Zostaja jako NIE_ZMIERZONO i ZALOZENIE: wiring main.ts (pickAiPlayerCyclicBarter, dedup, enqueue) nie ma testu jednostkowego.
2. Slabe asercje (rezerwa, guard) - PRZYJETE.
   - Rezerwa: nowy przypadek baseAi (zapas 2030, rezerwa 2000, 10 tur -> 3 szt/turę -> krok 10 -> 0 -> brak oferty) + kontrola (rezerwa 0 -> giveQty 200). Mutacja `Math.max(0, give.reserve)` -> `0` w src/game/ai-trade-proposal.ts: test FAIL "AI does not release stock below its own reserve" (zabity). Plik przywrocony (git checkout), status czysty.
   - Guard konwertera: 3 asercje aiCommandToPendingProposal (giveQty 0, receiveQty 0, zamiana tego samego surowca -> null).
   - Test "AI nie oddaje ponizej minimum" = przypadek rezerwy powyzej.
3. Cooldown stemplowany przed filtrami - PRZYJETE (BLAD POPRAWIONY).
   - Przed: main.ts enqueueDiplomacyPendingFromCmd ustawial aiResourceBarterLastProposalTurn.set(ownerId, turn) przed filtrami enqueueNegotiationFromAiCmd (wojna, dedup, bilans PW, exact preview, cooldown odrzucenia) - oferta odrzucona cicho zuzywala 15 tur.
   - Po: stemplowanie przeniesione do enqueueNegotiationFromAiCmd, bezposrednio po negotiationTable.push(entry) w bloku `if (workingCmd.type === 'zaproponuj_wymiane_cykliczna')`. Usunieto stary wpis z enqueueDiplomacyPendingFromCmd.
   - Dowod kodowy: `git show b920196b6 -- gra/src/main.ts`.
   - Dowod testowy: NIE_ZMIERZONO na poziomie main.ts (brak harnessu boot()). Zmiana logiki sprawdzona przez przegląd i tsc.
4. Brak raportow Operatora i ZALOZEN - PRZYJETE. Zalozenia spisane nizej (sekcja ZALOZENIA).

ZALOZENIA (do akceptacji przez FC/wlasciciela; zrodlo: kod kandydata f20b81654):
- Deficyt AI / gracza: `deficit = deficitSet.has(key) || classifyTradeNeedNet(stock, netRate, pack) === 'deficit'`, gdzie deficitSet = resourceDeficitKeysForOwner(owner) (istniejaca funkcja).
- Nadwyzka: `surplus = classifyTradeNeedNet(...) === 'surplus'` (istniejacy klasyfikator).
- Rezerwa zapasu: `reserve = SENSIBLE_DEALS_THRESHOLDS.surplusMultiple * pack` (istniejace progi, bez nowej definicji).
- Ilosc na ture (AI oddaje): floor_krok(((stock - reserve) / turns) + max(0, netRate)); ilosc gracza (AI otrzymuje): min(floor_krok((stock_gracza - reserve_gracza)/turns + max(0,netRate_gracza)), floor_krok(max(krok, ceil(-netRate_AI)))).
- Kolejnosc wyboru: najpierw surowiec, ktorego najbardziej brakuje graczowi (stock / max(1,-netRate) rosnaco, remis po kluczu); potem para z AI-deficytem; iteracja w dol po kroku katalogu; pierwsza para przechodzaca handelFairnessGate (mnoznik 1) i evaluateProposal jest wynikiem.
- Tolerancja uczciwosci: istniejaca handelFairnessGate (relTotal relacji, mnoznik 1), bez nowych progow.
- Czas: AI_RESOURCE_TRADE_DEFAULT_TURNS, typ per_turn.

TESTY (surowe wyniki, uruchomione w tej rundzie w gra/, po npm ci --ignore-scripts; bez npm run build/dev):
- tsc --noEmit: rc=0 (wyjscie puste).
- ai-trade-proposal-to-player-test.cjs: 25 assertions passed (bylo 16).
- ai-trade-proposal-branch-test.cjs (nowy): 10 passed, 0 failed.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (15/15).
- combat-test: COMBAT TEST 6/6 pass.
- ai-test: 296 passed, 0 failed.
- diplomacy-resource-cyclic-trade-test: 53 pass, 0 fail.
- diplomacy-rejection-cooldown-test: 14 pass, 0 fail.
- diplomacy-treaties-test: 17/17 PASS.
- Uwaga: w pętli uruchomień kod wyjścia był mierzony na `tail` (nie na node), więc rc każdej bramki z tej pętli NIE jest dowodem; dowodem są linie wyniku, które wyżej przytoczono z surowego wyjścia.
- Mutacje (zrobione i cofnięte): contact gate -> FAIL (zabity); reserve -> FAIL (zabity). Nie mierzono pozostałych mutacji z raportu Evaluatora (fairnessGate, cooldown key, filtr deficytu AI) w tej rundzie.
- Chromium/UI: NIE_ZMIERZONO.

BLOKADY: brak blokad procesowych. Otwarte luki pokrycia (NIE_ZMIERZONO): wiring main.ts (pickAiPlayerCyclicBarter, dedup, enqueue, stempel cooldownu po filtrach), realny tickCyclicResourceTradeDeals, akceptacja w UI, ladowanie starych zapisow.

RUNDY: 1/5 (obrona). Werdykt: do Final Control.

NASTEPNY KROK: Evaluator (ponowna ocena poprawki b920196b6 i pokrycia wiringu main.ts) -> Final Control; FC decyduje, czy luki NIE_ZMIERZONO sa akceptowalne.

DEPLOY/PUSH: NIE WYKONANO
