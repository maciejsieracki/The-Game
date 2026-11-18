# R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 — obrona (runda 2, Operator HAIKU)

STATUS: BLOCK
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły dla rozejmu, nap, granic, sojuszy i wasala (S/W/D, płaci słabsza, bez sufitu) w bramce gracza, ścieżce AI, panelu i Civpedii; pokój nietknięty.
ZMIANY-COMMIT: 5b2e86311 (wiersz podziału PW dla 6 traktatów: `treatyPowerSplit` w evaluateProposal, main.ts, UI panelu, test + mutacja sojuszu). Start: 513339a4c. Baza main 2b950566 jest przodkiem HEAD, więc merge nie był potrzebny.
TESTY (surowe wyniki tej rundy):
- tsc --noEmit: bez błędów.
- logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; unit-replace-test 21/21; combat-test: All sanity checks passed.
- diplo-treaties-power-parity-test 50/0 (po zmianach). MUTACJA sojusz_pelny parytet=false: 45 pass / 5 FAIL. JSON przywrócony.
- diplo-rozejm-parity-test 25/0; diplo-truce-r1-test 31/0; diplo-peace-pw-power-ratio-test 47/0; diplomacy-acceptance-points-test 304/0; diplo-json-descriptions-sync-test 46/46; diplo-wiki-weariness-rate-consistency-test PASS.
- dyplo-bilans-gate-n-e1-reprodukcja-test: 21 PASS / 1 FAIL (asercja (0), patrz zarzut 6). Test zapisuje PNG do `dowody/`; zmiany cofnięte `git checkout`.
- NIE ZMIERZONO: Chromium.

ODPOWIEDZI NA ZARZUTY:
1. Punkt 2 (ścieżka AI): PRZYJMUJĘ, NIE WYKONANO w tej rundzie. ai.ts i diplomacy-ai-offer-balance.ts bez zmian. Zostaje na rundę 3.
2. Panel PW dla szóstki: PRZYJMUJĘ, WYKONANE. `treatyPowerSplit` (evaluateProposal, funkcja attachTreatyPowerSplit) → main.ts previewNegotiationEntryImpl → responderPreview → peacePowerSplitRowHtml w diplomacyAcceptanceBalance.ts. Dowód: asercje „sojusz słabszy/silniejszy/bez treatyPower/umowa_handlowa” w diplo-treaties-power-parity-test (50/0). Chromium NIE ZMIERZONO.
3. Civpedia i wikiBundle: PRZYJMUJĘ, NIE WYKONANO. Brak zmian w docs/encyklopedii i wikiBundle; generator nieuruchomiony. Zostaje na rundę 3.
4. Testy i mutacje sojuszu: PRZYJMUJĘ, CZĘŚCIOWO WYKONANE. Mutacja sojuszu (parytet=false) daje 5 FAIL. Brak testów AI-słabsze-bez-miast i AI↔AI (zależą od zarzutu 1).
5. Ryzyko regresji rozejmu AI: PRZYJMUJĘ, NIE ZMIERZONO. Nie mierzono wpływu na częstość rozejmów AI i AI↔AI.
6. Dług dyplo-bilans-gate: ODRZUCAM jako dług tej rundy. Jedyny FAIL to asercja (0) „TREATY_GATED_NEGOTIATION_ACTIONS === {pokoj, umowa_szlakow, umowa_handlowa}”. Zbiór w main.ts:21526 (stan 2b950566) ma już `'pokoj', 'rozejm', 'umowa_szlakow', 'umowa_handlowa'`, dodany przez f2f6c7cea (R-WEB-TRUCE-Q1 r5), który jest przodkiem main. Test jest nieaktualny od tamtej zmiany, nie od tego tematu. Test leży poza allowlistą (`dyplo-`, nie `diplo-`). Nie naprawiałem; decyzja dla orkiestratora.

TABELA S/W/D (X = punkty z configu, L = 0; r z wzoru peacePwPointsByPowerRatio):
- rozejm, nap (X=2000): r=1 → 2000/2000/0; r=1,5 → 3000/1333/1667; r=2,67 → 5338/749/4589; r=5 → 10000/400/9600.
- granice (600): r=1 → 600/600/0; r=1,5 → 900/400/500; r=2,67 → 1601/225/1376; r=5 → 3000/120/2880.
- sojusz_defensywny (4200): r=1 → 4200/4200/0; r=1,5 → 6300/2800/3500; r=2,67 → 11210/1574/9636; r=5 → 21000/840/20160.
- sojusz_pelny (5000): r=1 → 5000/5000/0; r=1,5 → 7500/3333/4167; r=2,67 → 13345/1873/11472; r=5 → 25000/1000/24000.
- wasal (3500): r=1 → 3500/3500/0; r=1,5 → 5250/2333/2917; r=2,67 → 9342/1311/8031; r=5 → 17500/700/16800.

BLOKADY: punkty 1, 3 i 5 (ścieżka AI, Civpedia/wiki, regresja AI) nieukończone. Bez nich PASS nie jest możliwy.
RUNDY: 2/5. Poprzedni werdykt FC: FAIL (runda 1). Decyzja wymagana: brak.
NASTĘPNY KROK: runda 3. Punkt 2: ai.ts (AI słabsze płaci D miastami albo nie składa oferty; AI silniejsze żąda miasta ≥ D; AI↔AI), testy AI. Punkt 3: Civpedia i generator wikiBundle. Mutacja NAP/rozejmu w ścieżce AI.
UWAGI-DLA-ORKIESTRATORA: (a) po `npm ci` na `/` zostało ok. 3,0 GB wolnego miejsca, poniżej progu 4 GB dla web. (b) Test dyplo-bilans-gate zapisuje PNG w `dowody/` przy każdym uruchomieniu. (c) Nie użyto spawn_task, create_session ani run_in_background.
DEPLOY/PUSH: NIE WYKONANO
