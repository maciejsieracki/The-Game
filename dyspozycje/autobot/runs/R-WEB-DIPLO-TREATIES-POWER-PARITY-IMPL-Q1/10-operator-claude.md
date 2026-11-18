STATUS: FAIL (runda 2/5 częściowa — punkt 1 zrobiony, punkty 2–5 do rundy 3)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły i ceny ×10 dla 6 traktatów (rozejm, nap, granice, sojusz_defensywny, sojusz_pelny, wasal). Runda 2: punkt 1 (rozejm z parytetem, X = 2000×(1−L), płaci słabsza) zrobiony dla autora-gracza; punkty 2 (ścieżka AI), 4 (panel/tooltipy), 5 (Civpedia/wiki) NIE zrobione w tej rundzie.
ZMIANY-COMMIT: baza kandydat 749ee84d5 (potomek origin/main 2b950566f; `git merge origin/main` = już aktualne). Pliki: gra/data/diplomacy-acceptance-points.json (rozejm: `parytet: true`, `platnik: "slabsza"`, uwaga zaktualizowana); gra/src/game/diplomacy-proposals.ts (nowe eksporty treatyParityEnabled / treatyWearinessLevelOf / treatyParityBaseX; treatyParityPowerGate przyjmuje L; treatyPnGate z flagą skipTruceFlatGate — rozejm z parytetem nie idzie bramką pokoju z nieskalowaną bazą; w case 'rozejm' basePn = X(L) i pkPowerSplit także dla rozejmu, gdy autor = gracz i ctx.treatyPower podane); gra/tools/diplo-rozejm-parity-test.cjs (nowy, 25 asercji); gra/tools/diplo-truce-r1-test.cjs (2 zmiany uzasadnione: P8 zapłata złotem 400 → 4000 = skala ×10 bazy rozejmu 200→2000; M3 kotwica mutacji dopasowana do nowej linii bramki pokoju). Commit: SHA w polu sha raportu orkiestratora.
TESTY:
- tsc --noEmit: exit 0, 0 błędów.
- Bramki: logic-test PASS [213]; tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test OK (15 cywilizacji); combat-test "All sanity checks passed".
- diplo-json-descriptions-sync-test 46/46 OK, FAIL 0.
- diplo-rozejm-parity-test (nowy): 25 pass 0 fail — kontrakt danych; X = 2000×(1−L) dla L = 0 / 0,5 / 1; L z warState (turnsAtWar 20 → 0,5); słabszy (100 vs 400) bez PW: odrzucony, kwota D = 3750 (nie 7500); silniejszy (400 vs 100): brak „Brakuje” i „parytetu”; brak treatyPower = bez bramki parytetu; L 0,25 → X = 1500 → D = 5625; wzór S/W/D rozejmu przy X = 1000 dla r = 1/1,5/5/10 i moc słabszej 0; r = 1 → D = 0.
- diplo-treaties-power-parity-test 43/0 (runda 1, bez zmian).
- diplomacy-acceptance-points-test 304/0 (bez zmian).
- diplo-truce-r1-test 31/0 (po 2 uzasadnionych zmianach, patrz ZMIANY).
- Regresja zielona: diplo-truce-impl-test 94/0; diplo-truce-until-turn-test 15/0; diplo-truce-n6-saveload-test 8/0; diplo-peace-balance-accept-test 32/0; diplo-peace-price-wiring-test 14/0; diplo-peace-price-decay-test 13/0; diplo-peace-weaker-seeks-city-only-test 35/0; diplo-peace-winner-proposal-flow-test 49/0; diplo-war-peace-sim-test 25/0; diplo-weariness-city-only-test 26/0; diplo-peace-pw-power-ratio-test 47/0; diplo-peace-ai-ai-nonnegative-test 21/0; diplo-war-peace-gate-test 24/0; diplo-wiki-weariness-rate-consistency-test PASS.
- Mutacje (kopia pliku) dla sojuszu i rozejmu: NIE WYKONANO w tej rundzie (do rundy 3).
- Chromium: NIE ZMIERZONO (brak panelu, żywy test nieuzasadniony przed punktem 4).

ZMIANY UZASADNIONE (testy, każda z powodem):
- diplo-truce-r1-test P8: rozejm ze złotem 400 był akceptowany przy bazie 200; po skali ×10 (ABC A, baza 2000) ta sama zapłata byłaby za mała. Zapłata skalowana ×10 (4000), asercja „zostaje zaakceptowany” bez zmiany sensu.
- diplo-truce-r1-test M3: mutacja szukała starej linii bramki pokoju; linia zmieniona na bramkę z wyłączeniem rozejmu z parytetem — kotwica dopasowana, mutacja nadal wykrywana (M3 → P10).

BLOKADY / NIEZROBIONE (lista dla rundy 3):
1. Ścieżka AI (punkt 2): oferty AI → gracz, AI↔AI, planAiOfferOnTable, ai.ts, aiPeaceSignals — parytet NIE policzony dla autora-AI (treatyParityPowerGate zwraca null, gdy proponentem nie jest gracz). Rozejm autorstwa AI nadal liczy X = 2000 bez (1−L) dla pwBalance; AI bez czym zapłacić D nie ma odmowy z formuły.
2. Panel PW i tooltipy (punkt 4): diplomacyAcceptanceBalance.ts / diplomacyAudience.ts — wiersz „moc/r/S/W/D/rabat” dotąd tylko dla pokoju (warunek actionId==='pokoj'); dla rozejmu wiersz pojawi się przez wearinessInfo.powerSplit (ustawiany w pkPowerSplit), ale NIE zweryfikowane w UI.
3. Civpedia/wikiBundle (punkt 5): hasła traktatów nieaktualne (ceny ×10, reguła parytetu); generator dopiero po merge z main.
4. Pozostałe z rundy 1 bez zmian: sojusz/NAP/granice/wasal — ścieżka autora-gracza działa (testy 43/0), ścieżka AI nie.
5. Pokój i pokój wymuszony: nietknięte (zgodnie z zakazem).

UWAGI-DLA-ORKIESTRATORA:
- Tabela S/W/D rozejmu (X = 2000×(1−L); dla L = 0 → X = 2000; przykład L = 0,5 → X = 1000) przy r = 1 / 1,5 / 2,67 / 5 (X = 1000): r1 S1000 W1000 D0 | r1,5 S1500 W667 D833 | r2,67 S2670 W375 D2295 | r5 S5000 W200 D4800. Dla X = 2000: r1 D0 | r1,5 D1667 | r2,67 D4589 | r5 D9600.
- Pozostałe traktaty z szóstki (X bez L) — tabela z rundy 1 aktualna (nap/sojusz/granice/wasal), nie zmieniona w tej rundzie.
- Wpływ na AI↔AI i częstość zawierania traktatów: NIE ZMIERZONO. Ścieżka AI↔AI nadal nie stosuje parytetu.
- Świadoma konsekwencja ABC „bez sufitu”: przy dużym r słabszy gracz nie zawrze rozejmu/sojuszu bez bardzo dużej zapłaty PW — widoczne w testach (D = 3750 przy r = 4, L = 0,5).
- Dług zgłoszony: test dyplo-bilans-gate-n-e1-reprodukcja (rzekomo 1 FAIL na stałej TREATY_GATED z rozejmem) nie był uruchomiony w tej rundzie.

NASTĘPNY KROK: runda 3/5 tego samego ID — punkt 2 (ścieżka AI: aiPeaceCityDuePn / planAiOfferOnTable z X i parytetem, AI słabsze bez miast = odmowa, AI↔AI słabsza płaci D), punkt 4 (panel PW i tooltipy dla szóstki), mutacje sojuszu i rozejmu, potem punkt 5 (Civpedia/wiki po merge z main). Baza rundy 3: SHA commita tej rundy.
DEPLOY/PUSH: NIE WYKONANO
