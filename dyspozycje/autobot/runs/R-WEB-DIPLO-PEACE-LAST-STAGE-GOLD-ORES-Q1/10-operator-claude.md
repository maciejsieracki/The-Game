# R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 — Operator, RUNDA 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1
GOAL: ogon ceny pokoju po miastach (złoto → brąz → żelazo → rudy) w ścieżce gracza; ABC A/B/C/D właściciela z 2026-11-18. Zrobione: punkt 1 (ścieżka gracza, ogon w ocenie propozycji), punkt 2 w części (gracz + zapas płatnika), punkt 3 (wycofanie zakazu dla pokoju). NIE zrobione: punkty 2 (ścieżka AI, AI↔AI), 4 (tooltip w diplomacyAcceptanceBalance.ts), 5 (Civpedia + wikiBundle). Brak PASS.
ZMIANY/COMMIT: baza 052259c68 (origin/main, merge bez zmian). Diff: gra/src/game/diplomacy-proposals.ts (zakaz złota/surowców tylko dla rozejmu; ogon: PEACE_TAIL_ORDER, kontrola zapasu ctx.payerStock; r5Gate stronger liczy miasto + ogon, ogon także przy odrzuceniu); gra/src/main.ts (+1 pole: payerStock = ownerResourceStock dla kluczy ogona proponującego, 3 linie + import); gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs (asercja d1 przestawiona na nowe ABC A — nie osłabiona, sprawdza brak odrzucenia słodzikiem); NOWY gra/tools/diplo-peace-tail-proposal-test.cjs (6 asercji ścieżki gracza). Commit: SHA w polu sha wyniku.
TESTY (ZMIERZONO w tej worktree, npm ci --ignore-scripts wykonany):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: 21/21
- combat-test: All sanity checks passed
- diplo-peace-tail-proposal-test (nowy): 6 pass / 0 fail
- diplo-peace-weaker-seeks-city-only-test: 35 pass / 0 fail (po przestawieniu d1)
- diplo-peace-last-stage-payment-test (runda 1): OK, mutanty M1-M3 wykryte
- diplo-peace-pw-power-ratio: 48 PASS / 0 FAIL
- diplo-peace-price-wiring: PASS=14 FAIL=0
- diplo-peace-price-decay: PASS=13 FAIL=0
- diplo-peace-balance-accept: 32 pass / 0 fail
- diplo-winner-proposal-table: SUMA PASS=77 FAIL=0
- diplomacy-sensible-deals: 63 passed, 0 failed
- diplo-weariness-city-only: PASS=26 FAIL=0
- diplo-wiki-weariness-rate-consistency: asercje OK 18, FAIL 0
- diplomacy-proposal-test: 200/200 PASS
- NIE ZMIERZONO: diplo-war-peace-sim (nie uruchamiany w tej rundzie), pomiar AI↔AI ≥3×150 tur, Chromium.
BLOKADY:
- ścieżka AI (ai.ts aiPeaceCityDuePn / oferta miasta z ogonem) — NIE zaimplementowana: plan miast nie dostaje zapasów płatnika ani ogona; wymaga przekazania zapasów przez wejście ai.ts i obsługi komendy w main.ts.
- AI↔AI (diplomacy-ai-forced-peace.ts runAiAiPeaceTick, planCityPeacePayment → settlePeaceDue) — NIE zaimplementowana: PeacePaymentPlan i d.pay nie znają ogona.
- zapas płatnika: ctx.payerStock to suma zapasów MIAST gracza (ownerResourceStock), a nie Skarbiec/Spichlerz państwa (ABC C). Złoto jako surowiec w mieście, nie ¤ Skarbca. Do potwierdzenia przez właściciela.
- wycena: ogon liczony przez resolveProposalPn (diplomacyPnZloto / diplomacySumPn), a nie przez peaceTailPnPerUnit z round 1. Do ujednolicenia z round 1 w rundzie 3.
- tooltip „Dopłata: X złota, Y rudy żelaza” w diplomacyAcceptanceBalance.ts — NIE zrobione.
- Civpedia rozejm-pokoj.md + wikiBundle (generator) — NIE zrobione.
- Brak weryfikacji kolejności ogonu w ocenie (dozwolone każde złożenie złoto/surowce z PEACE_TAIL_ORDER; kolejność nie jest wymuszana).
- Stal: nie sprawdzano resources.json w tej rundzie (poza ogonem, nie weszła).
RUNDY: 2/5 (runda 2 po FC FAIL rundy 1; Operator Haiku, licznik porażek Haiku = 1).
NASTĘPNY KROK: runda 3 tego samego ID — (a) ścieżka AI: zapasy płatnika i ogon w aiPeaceCityDuePn / oferta miasta z dopłatą; (b) AI↔AI: settlePeaceDue w runAiAiPeaceTick z d.pay obsługującym ogon; (c) tooltip „Dopłata” w diplomacyAcceptanceBalance.ts; (d) Civpedia rozejm-pokoj.md + wikiBundle generatorem (zachować „2,5% na turę”); (e) potwierdzić zapas z ABC C (Skarbiec/Spichlerz vs ctx.payerStock).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: worktree /home/user/The-Game/.claude/worktrees/wf_baa1af81-36a-1 zawiera gra/node_modules (npm ci) — do sprzątnięcia po FC. Brak zmian poza allowlistą (diplomacy-proposals.ts, main.ts [tylko payerStock], testy, raport).
