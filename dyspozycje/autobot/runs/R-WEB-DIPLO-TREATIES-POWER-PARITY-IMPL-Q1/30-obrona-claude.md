STATUS: BLOCK (obrona rundy 2: zarzuty 1, 7 częściowo; zarzuty 2, 3, 5, 6 przyjęte, niewykonane; zarzut 4 częściowo odrzucony)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły i ceny x10 dla 6 traktatów (rozejm, nap, granice, sojusz_defensywny, sojusz_pelny, wasal). Ta runda domyka zarzuty testowe i część zarzutu o bramce autora-gracza. Rozejm, ścieżka AI, panel, wiki zostają na rundę 3.
ZMIANY-COMMIT: baza kandydata 06cccb961 (obrona startuje od niego). Zmienione pliki: gra/tools/diplomacy-acceptance-points-test.cjs (aktualizacja asercji, patrz niżej), gra/tools/diplo-treaties-power-parity-test.cjs (+21 asercji), ten raport. Kod gry (src/, data/) bez zmian. SHA: patrz pole sha w StructuredOutput.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ, NAPRAWIONE. diplomacy-acceptance-points-test: 255/49 -> 304/0 (baza 2b950566f: 304/0). Zmiany wyłącznie w asercjach zależnych od starych cen: 49 literałów przeskalowanych x10 (NAP 200->2000, sojusz_pelny 500->5000, sojusz_defensywny 420->4200, granice 60->600, wasal 350->3500, pochodne: efektywna cena przy rel 151 302->3020, bilans sojuszu rel 160 +300->+3000, scenariusze U1/U2 i NAP+złoto). Jedna asercja (U2 NAP @ rel 61) miała błędną wartość w komunikacie („122−200"): rzeczywisty bilans to 0 − 2000×0,39 = −780, poprawiono na −780. Asercje 'NIEZMIENIONY' (sojusz/granice/wasal bez czasu) przeskalowane bez zmiany logiki.
2. PRZYJMUJĘ, NIE WYKONANO. Rozejm zostaje z parytet: false. Powód: X rozejmu = 2000x(1-L) wynika z mnożnika zmęczenia (r5Gate.priceMultiplier w case 'rozejm', diplomacy-proposals.ts ~1454–1560), którego bramka parytetu (treatyParityPowerGate) nie widzi. Wymaga przekazania L do kontekstu i testów pokoju. Odkładam na rundę 3.
3. PRZYJMUJĘ, NIE WYKONANO. Ścieżka AI (ai.ts, diplomacy-ai-offer-balance.ts, planAiOfferOnTable, aiPeaceSignals, AI<->AI) nadal bez wzoru S/W/D. Zakres zbyt duży na tę rundę. Runda 3.
4. CZĘŚCIOWO ODRZUCAM, CZĘŚCIOWO PRZYJMUJĘ. Odrzucenie: dla nap/sojusz_defensywny/sojusz_pelny/granice/wasal treatyBaseFairnessGap NIE jest wywoływane. Dowód: grep wywołań daje diplomacy-proposals.ts:1654 (wewnątrz case 'pokoj'/'rozejm', linie 1453–1765) i :1937 (case 'umowa_handlowa'/'umowa_szlakow', od linii 1895). treatyPnGate (linie 857–990) dla nie-pokojowych akcji liczy tylko pnDealAcceptedByAi(givePn, receivePn, relTotal), bez X. Czyli silniejszy gracz z koszykiem przy sojuszu/NAP nie dostaje „Brakuje" z X. Dodany test (zarzut 7). Przyjęcie: 1654 dla rozejmu używa X bez S/W/D — to część zarzutu 2, NIE wykonana.
5. PRZYJMUJĘ, NIE WYKONANO. Panel PW (diplomacyAcceptanceBalance.ts), diplomacyAudience.ts, diplomacyTipText.ts bez zmian. Runda 3.
6. PRZYJMUJĘ, NIE WYKONANO. Civpedia/wikiBundle wymagają generatora po merge z main. Runda 3.
7. CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO NIE WYKONANO. Dodane w diplo-treaties-power-parity-test.cjs: (a) wzór S/W/D z X z KONFIGU dla każdego z 5 traktatów z parytetem przy r = 1 / 1,5 / 2,67 / 5 (20 asercji); (b) silniejszy gracz z koszykiem PW nie dostaje blokady „parytetu" (1 asercja). Wynik: 43 pass / 0 fail (wcześniej 22/0). NIE dodane: słabszy z ofertą >= D (przyjęty) i < D (blokada z kwotą) — wymaga fixture PW miast; sojusz/granice/wasal przez evaluateProposal z ofertą; AI słabsze bez miast; AI<->AI; regresja pokoju; mutacja dla pozostałych traktatów; Chromium — NIE ZMIERZONO.

TESTY (surowe wyniki tej rundy):
- npx tsc --noEmit: bez błędów (brak wyjścia).
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.
- diplo-json-descriptions-sync-test: WYNIK 46/46 OK, FAIL: 0
- diplomacy-acceptance-points-test: 304 pass, 0 fail
- diplo-treaties-power-parity-test: 43 pass, 0 fail
- dyplo-bilans-gate-n-e1 (dług bazowy z raportu ewaluatora): nie uruchamiano ponownie w tej rundzie.

BLOKADY: zarzuty 2, 3, 5, 6 i rozszerzenia 7 wymagają pracy poza tą rundą (patrz wyżej). Brak blokad infrastrukturalnych (npm ci --ignore-scripts wykonane).
RUNDY: obrona rundy 2/5 tego samego ID.
NASTĘPNY KROK: runda 3/5: (a) rozejm parytet z przekazaniem L do bramki i testem; (b) ścieżka AI (oferty AI, AI<->AI, planAiOfferOnTable); (c) panel PW i tooltipy; (d) testy: słabszy >= D / < D z kwotą, sojusz/granice/wasal przez evaluateProposal, mutacja dla każdego traktatu; (e) Civpedia/wiki po merge z main.
UWAGI-DLA-ORKIESTRATORA: ewaluator słusznie wskazał, że rozejm jest w szóstce z dispatchu. Zarzut 4 nie dotyczy szóstki poza rozejmem (patrz odpowiedź). Dług bazowy dyplo-bilans-gate-n-e1 (21/1) nie badany w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO
