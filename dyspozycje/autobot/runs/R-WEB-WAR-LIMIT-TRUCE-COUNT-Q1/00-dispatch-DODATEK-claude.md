# R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1 — DODATEK (runda 1/5, Operator HAIKU 5.5)

## Kontekst (ustalone z kodu orkiestratora)
- gra/src/main.ts: `warTypesForOwner` (~26134) buduje wiersze `WarPairRow` z `atWar = getDiploRelation(owner, oid).status === 'wojna'` i `meta: atWar ? getDiploPairMeta(...) : undefined`; `warLimitPermits` (~26166) woła `warLimitAllows(typ, typyAtakującego, typyOfiary)` z gra/src/game/diplomacy-war-limit.ts. Para w rozejmie ma status 'pokoj', więc limit jej NIE widzi — w rozejmie można zacząć drugą wojnę naturalną, a wznowienie starej po rozejmie (declareWarAfterTruce, main.ts ~13154 / truceEndToWarCore w diplomacy-peace-lock.ts) łamie limit.
- Typ wojny trzymany jest w meta pary (parseTypWojny; brak tagu = 'naturalna'). Ustal, czy meta przeżywa rozejm (finalizePeace/ustawienie rozejmu może czyścić pola) — jeśli czyści typ, zachowaj typ wojny na czas rozejmu (np. pole w meta ustawiane przy zawarciu rozejmu) tak, by wojna epoki w rozejmie liczyła się jako wojna epoki.
- Wiersze limitu używają też countActiveWars… (tylko ZACHOWANIE bramki limitu zmieniasz; countActiveWarsForOwner dla sojuszniczych zobowiązań i barbarzyńców NIE ruszaj).

## Zadanie
1. W `warTypesForOwner` traktuj parę jako „w wojnie na potrzeby limitu”, gdy status === 'wojna' LUB (status === 'pokoj' i meta.truceUntilTurn != null lub meta.truceEndOffer != null). Typ wojny z meta (zachowany przez rozejm). Nie zmieniaj niczego poza liczeniem limitu.
2. declareWarAfterTruce / truceEndToWarCore: wznowienie wojny po rozejmie NIE przechodzi przez bramkę limitu (to ta sama wojna) — upewnij się, że żadna bramka limitu ani przedłużanie rozejmu tego nie blokuje (zero kodu z WARBYPASS). Zachowaj wpis „Rozejm wygasł, wojna wraca” (FALA 904).
3. Sprawdź i opisz (bez zmian, jeśli bezpieczne): czy pokój (finalizePeaceTreatyBetween) zwalnia limit (para przestaje być liczona po zniknięciu truceUntilTurn/truceEndOffer i statusu 'pokoj' bez rozejmu) — test na tym.
4. Test behawioralny gra/tools/war-limit-truce-count-test.cjs (wzorzec: war-limit-ai-natural-test.cjs / diplomacy-war-limit-unit): (a) cywilizacja w rozejmie z wojną naturalną X: druga wojna naturalna jest odrzucona; (b) po pokoju (rozejm zniknął, status pokój bez rozejmu) druga wojna dozwolona; (c) wojna epoki w rozejmie liczy się jako wojna epoki, naturalna dalej dozwolona; (d) wznowienie po rozejmie przy pełnym limicie nie jest blokowane. Mutacja czerwona na rdzeniu (usunięcie warunku rozejmu → test (a) czerwony). Jeśli rdzeń trzeba wydzielić do czystej funkcji w diplomacy-war-limit.ts (zalecane, jak warLimitAllows), zrób to i dodaj do bramek.
5. Wartości liczbowe (limit 1/1) bez zmian.

## Allowlista
gra/src/game/diplomacy-war-limit.ts, gra/src/game/diplomacy-peace-lock.ts (tylko jeśli konieczne dla zachowania typu wojny w rozejmie), gra/src/main.ts (TYLKO warTypesForOwner i ewentualne zachowanie typu wojny przy rozejmie), nowy gra/tools/war-limit-truce-count-test.cjs, dyspozycje/autobot/runs/R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 4 GB; usuń node_modules po bramkach.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; war-rules-multiwar 57/0; war-rules-multiwar-main-guard 21/0 (okna tekstowe main.ts — sprawdź po zmianie); war-limit-ai-natural 15/0; diplomacy-war-limit-unit 57/0; alliance-war-obligation 14/0; diplo-truce-*, truce-end-war-notice-test; nowy test. Zacommituj i zwróć SHA.
## Binarne kryterium
(a)–(d) zielone z mutacją czerwoną; limit 1/1 bez zmian; brak kodu blokującego wznowienie po rozejmie; bramki zielone.
## Poza zakresem (NIE rób)
Przebudowa końca rozejmu na pokój z ceną — czeka na odpowiedź właściciela (R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1). Wojna wymuszona (bunt/przejęcie) ponad limit — osobne pytanie.
