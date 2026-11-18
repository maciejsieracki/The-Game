STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: pokój wg „P·r / P/r" (Power) we wszystkich ścieżkach (gracz, AI→gracz, AI↔AI), panel/tooltipy, Civpedia/wikiBundle
ZMIANY/COMMIT: start 7f26a28b2 + merge origin/main (zmiany: ai.ts, main.ts [tylko przekazanie mocAI/mocPartner + typ], war-weariness.ts [PeacePowerSplitInfo], diplomacy-proposals.ts [powerSplit w wearinessInfo], diplomacyAcceptanceBalance.ts + diplomacyAudience.ts [tooltip], docs/encyklopedia/pojecia/rozejm-pokoj.md, wikiBundle.json [generator], test diplo-peace-pw-power-ratio-test.cjs, ten raport). SHA: patrz pole sha zwrotu.
TESTY (surowe wyjście):
- tsc --noEmit: 0 błędów.
- diplo-peace-pw-power-ratio-test: 47 PASS / 0 FAIL (U1-U7 wzór, I1-I6 gracz, P1-P3 wiring/AI↔AI, A0-A9 AI jako autor, T1-T5 tooltip, M1 i M2 mutacje czerwienieją, S1).
- Istniejące: price-decay 13/0, balance-accept 32/0, war-peace-sim 25/0, winner-proposal-table 77/0, sensible-deals 63/0, weariness-city-only 26/0, weaker-seeks 35/0, price-production-paths 15/0, peace-gate-military-strength 14/0, ai-war-weariness-peace 96/0. Asercje nie zmieniane (bez ścieżki mocy zachowanie bez zmian).
- 5 bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6.
- Chromium / żywa gra: NIE ZMIERZONO (brak sesji przeglądarkowej w tej rundzie); hotseat NIE ZMIERZONO (main.ts zawsze ME(), silnik z fallbackiem 0 jak w bazie).
BLOKADY: brak.
RUNDY: 3/5.
P2 (AI): ai.ts — nowe pola rel.mocAI/mocPartner (Power) i aiPeaceCityDuePn (jedno miejsce: peaceAiAiPaymentPn → peacePwPointsByPowerRatio). AI słabsze mocą: oferta miast musi pokryć D (aiPlanMiastaDoOddania z D); brak pokrycia/stolica/ostatnie => brak oferty. AI silniejsze: żąda miasta gracza o wartości >= D (zada_miasto_za_pokoj). AI↔AI: bez zmian z r2 (D słabszej, przegrany-silniejszy 0). main.ts przekazuje moce w obu relacjeDip.push. Bez mocy => stary kontrakt (samo P).
P3 (panel): evaluateProposal zwraca wearinessInfo.powerSplit {moce, r, S, W, D, D po rabacie, playerStronger}; tooltip bilansu (peacePowerSplitRowHtml) pokazuje moce, r, S, W, D i „(po rabacie relacji)"; na wierzchu bez zmian (werdykt + brakujące PW).
P4: hasło rozejm-pokoj.md (wzór, r=1 => D=0, przykład, droga wymuszona), wikiBundle regenerowany generatorem (bundle-wiki-for-game.cjs); zdanie „2,5% na turę" zachowane.
NASTĘPNY KROK: Evaluator r3.
UWAGI-DLA-ORKIESTRATORA:
(a) r = 1 => D = 0: pokój bez dopłaty (konsekwencja wzoru; AI w obu rolach nie składa wtedy oferty/żądania miasta; pokój zapada drogą wymuszoną przy 100% zmęczenia).
(b) Przykład z kodu: moc 6969/2611, P = 4320 => r ≈ 2,669, S = 11 530, W = 1 619, D = 9 911 (test U3).
(c) Słabsza strona bez czym zapłacić D (stolica/ostatnie miasto chronione): odmowa/brak oferty tą drogą; pokój wymuszony przy 100% zmęczenia (cena 0) bez zmian (testy A1, A5, P2d, P2e).
ZAŁOŻENIA: rabat relacji gracza stosowany do D (zatwierdzone w DODATKU 2); AI-silniejsze żąda jednego miasta gracza o wartości >= D (bez kombinacji miast; gdy żadne pojedyncze nie pokrywa D — brak żądania; ABC właściciela może rozszerzyć); AI↔AI przegrany-silniejszy dopłata 0 (R2). Test wiringu main.ts jest źródłowy (R3), bez wykonania main.ts.
DEPLOY/PUSH: NIE WYKONANO
