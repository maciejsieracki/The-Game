# R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — obrona Operatora (runda 3/5, odpowiedź na zarzuty Evaluatora z 86b3bd820)

STATUS: BLOCK
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: bez zmian względem dispatchu (P·r / P/r wg POWER, D = S − W dopłaca słabsza miastami, bez sufitu). Start: a7f3030fd (kandydat r2). Baza: origin/main ba2d59d17 (zgodnie z DODATKIEM 2).

ZMIANY-COMMIT: zob. SHA w polu `sha` wyniku (commit tej rundy). Pliki:
- gra/src/game/war-weariness.ts: + `peacePowerSidesForPair` (konwencja powerPlayer = moc gracza, powerOther = moc drugiej strony, niezależnie od autora), + `peaceAiAiPaymentPn` (D słabszego przegranego; 0 gdy przegrany silniejszy lub równy).
- gra/src/main.ts (allowlista DODATEK 2): `diploProposalWarState` używa `peacePowerSidesForPair(ME(), proposerId, responderId, objectivePowerForOwner)` (usunięte martwe zmienne `playerSideId`/`otherSideId`); dwie ceny AI↔AI (runAiAiPeaceTick ~l. 39084 i tick war-weariness ~l. 39173) liczą `requiredPn = peaceAiAiPaymentPn(wearinessPeaceCashPn(L), moc przegranego, moc zwycięzcy)` (rozejm bez zmian).
- gra/tools/diplo-peace-pw-power-ratio-test.cjs: +P1a–c, P2a–f, P3a–b (29 PASS).
- gra/tools/diplo-peace-price-wiring-test.cjs: zmiana 2 asercji regex (W3) — patrz niżej.

ODPOWIEDŹ NA ZARZUTY:
1. CZĘŚCIOWO PRZYJMUJĘ. Zrobione: AI↔AI (oba tory cenowe w main.ts) — kwota = D słabszego, cena bazowa P = wearinessPeaceCashPn(L) (D1), planCityPeacePayment dostaje D jako requiredPn (c: słabsza AI tylko ze stolicą → plan niepełny → wait; d: miasto 12000 ≥ D 11520 → accept_paid). NIE ZROBIONE: ścieżka ofert AI do gracza (AI jako autor pokoju w evaluateProposal) — gap dla autora AI nadal liczony starą formułą i tylko informacyjnie. planAiOfferOnTable to dedup stołu (nie wycena) i loserDespair to etap desperacji (nie cena) — nie zmieniano ich, bo nie liczą PW.
2. PRZYJMUJĘ — NIE WYKONANO. Panel PW (diplomacyAcceptanceBalance.ts) i tooltipy (diplomacyAudience.ts, diplomacyTipText.ts) nie pokazują mocy obu stron, r, S, W, D ani etykiety „(po rabacie relacji)”. Komunikat blokady w evaluateProposal zawiera już S, W, r, D i „po rabacie relacji” (powerSplitNote), ale to nie jest panel ani tooltip.
3. PRZYJMUJĘ — NIE WYKONANO. Civpedia (docs/encyklopedia) i wikiBundle nie zaktualizowane o P·r / P/r.
4. PRZYJMUJĘ, CZĘŚCIOWO ZAMKNIĘTE. Wiring wyciągnięty do czystej funkcji `peacePowerSidesForPair` (test P1a–c woła ją i evaluateProposal bez ręcznego ustawiania mocy po stronie gracza). main.ts nie jest uruchamialny w node-teście; P3a sprawdza statycznie, że main.ts woła helper z tymi argumentami. To nie jest pełny test end-to-end main.ts — uczciwie oznaczone.
5. PRZYJMUJĘ i NAPRAWIONE. Było: powerPlayer = objectivePowerForOwner(proposerId). Jest: powerPlayer = moc ME() (gracz), powerOther = moc drugiej strony (helper). Martwe zmienne usunięte. Test P1a (AI proponuje → powerPlayer = 6969) i P1b (gracz proponuje → ta sama konwencja).
6. ODRZUCAM w części z dowodem, pozostaje NIE_ZMIERZONO. `evaluateProposalImpl` ustawia `pnOpts.playerOwnerId: 0` (diplomacy-proposals.ts:1193) i wszystkie bramki używają tego samego zera (np. l. 1531, 1622, 1691). Wiring używa ME() (main.ts). W grze jednoosobowej zakładam ME() = 0 — NIE ZMIERZONO (brak Chromium, brak sprawdzenia `humanSeats.activeHumanOwnerId` przy starcie). Przy ME() ≠ 0 podział PW działa tylko dla autora-właściciela 0, a zachowanie jest jak w bazie (fallback): ryzyko cichego pominięcia, bez błędu. Do decyzji orkiestratora (propozycja: użyć 0 spójnie albo ME() w obu miejscach).
7. ZAŁOŻENIE (bez zmiany, zgodnie z ROZSTRZYGNIĘCIEM DODATKU 2): rabat relacji stosuje się do D (`effectiveTreatyPnRequired(D, relTotal)`). Właściciel potwierdza w grze. Przykład: D 12000 → 1200 PW przy silnie dodatniej relacji (test I2b).
8. PRZYJMUJĘ jako zweryfikowane: obie ceny AI↔AI (main.ts) używają `wearinessPeaceCashPn(L)` jako P. Dowód: test diplo-peace-price-decay-test 13/0, diplo-peace-price-production-paths-test 15/0, diplo-peace-price-wiring-test 14/0. Ścieżka tick war-weariness.ts nie zmieniona (price pochodzi z main.ts).

ZMIANA ASERCJI (uzasadnienie): gra/tools/diplo-peace-price-wiring-test.cjs (W3) — dwie asercje regex pinowały starą postać `relBasedPn > 0 ? wearinessPeaceCashPn(...) : 0`. Po zmianie cena AI↔AI to `peaceAiAiPaymentPn(wearinessPeaceCashPn(...))` (dopłata D na bazie P). Regex zaktualizowany do nowej postaci; sprawdzana jest nadal ta sama ścieżka (P bez zmian, rozejm bez zmian). Przed zmianą: 2 FAIL (rc 1); po: 14/0 (rc 0).

WERYFIKACJA (surowe wyniki tej rundy):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/diplo-peace-pw-power-ratio-test.cjs`: `Wynik: 29 PASS, 0 FAIL`, rc 0.
- logic-test rc 0; tech-tree-test rc 0; research-test rc 0; unit-replace-test rc 0; combat-test rc 0 („All sanity checks passed.").
- diplo-peace-price-decay-test: PASS=13 FAIL=0; diplo-peace-price-production-paths-test: PASS=15 FAIL=0; diplo-peace-winner-proposal-flow-test: SUMA PASS=49 FAIL=0; diplo-weariness-city-only-test: PASS=26 FAIL=0; diplo-peace-price-wiring-test: PASS=14 FAIL=0 (po zmianie asercji W3); pozostałe (balance-accept, war-peace-sim, weaker-seeks-city-only, ai-ai-nonnegative) rc 0.
- vite build (poza repo): `node ./node_modules/vite/bin/vite.js build --outDir /tmp/claude-0/pwbuild/out --emptyOutDir` → `✓ built in 16.54s`, rc 0.
- Chromium / żywa tura wojny: NIE ZMIERZONO.
- Zainstalowano gra/node_modules (`npm ci --no-audit --no-fund`, ignorowany przez git; nie w commicie).

UWAGI-DLA-ORKIESTRATORA:
(a) r = 1 ⇒ D = 0 (pokój bez dopłaty), zgodnie z wzorem właściciela; nie zmieniano.
(b) Przykład z kodu: moc 6969/2611, P = 4320 → r ≈ 2,669, S = 11530, W = 1619, D = 9911 (U3).
(c) Słabsza strona bez czego zapłacić D: odmowa (I4, c-AI P2d/P2e). Pokój wymuszony przy 100% zmęczenia (cena 0, FORCEDPEACE) nie ruszany.
(d) AI↔AI: przegrany silniejszy → dopłata 0 (dopłaca zwycięzca — tor AI↔AI tego nie modeluje; to świadoma decyzja, do potwierdzenia).
(e) Konsekwencja dla gry: AI↔AI z dużą dysproporcją mocy będzie wymagać miast o wartości ~D (np. 11520 PW przy r = 3); część par nie dojdzie do pokoju, dopóki nie pojawi się wystarczające miasto. To zachowanie wynika z wzoru, nie z błędu — do obserwacji w grze.

WYMAGANE DO ZAMKNIĘCIA (następna runda, ten sam ID):
- P3: panel PW + tooltipy (moc obu stron, r, S, W, D, rabat, „(po rabacie relacji)").
- P4: Civpedia + wikiBundle generatorem (po P3).
- P2 dokończenie: ścieżka AI jako autor pokoju w evaluateProposal (czy AI słabsza ma w ofercie D) — decyzja orkiestratora, czy to blokuje AI czy tylko informuje.
- Zarzut 6: decyzja orkiestratora, 0 czy ME() jako id gracza (spójnie w engine i w wiringu).

RUNDY: 3/5 (r1 PASS-WITH-NOTES; r2 BLOCK; r3 BLOCK — P1 i zarzut 5 domknięte, P2 częściowo, P3/P4 nie)
NASTĘPNY KROK: runda 4 (ten sam ID): P3 → P4 → P2 (AI jako autor) → decyzja o ME()/0.
DEPLOY/PUSH: NIE WYKONANO
