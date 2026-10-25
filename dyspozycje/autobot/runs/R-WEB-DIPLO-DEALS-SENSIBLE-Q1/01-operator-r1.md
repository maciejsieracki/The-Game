# R-WEB-DIPLO-DEALS-SENSIBLE-Q1 — Operator, runda 1/5

STATUS: BLOCK (zakres częściowy: punkty 3, 4-pomiar i 5 z dispatchu NIE wykonane w tej rundzie — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-DEALS-SENSIBLE-Q1
GOAL: propozycje handlowe AI są sensowne i zawsze możliwe do rozpatrzenia przez gracza; opcja nowej gry wymusza rozpatrzenie oferty przed końcem tury.
BAZA: origin/main @ 0ffe3c0488e144c53cc8f18c89161fd597229dfc (detached, worktree wf_3fb946c3-d29-1)
ZMIANY/COMMIT: patrz sekcja COMMIT na końcu (SHA podany wprost po commicie)
- nowe: gra/src/game/diplomacy-sensible-deals.ts (moduł pure, flaga DIPLO_SENSIBLE_DEALS_ENABLED=true)
- nowe: gra/src/game/diplomacy-sensible-deals.config.json (progi: deficitTurns=10, surplusMultiple=20, usePerTurnFallbackPakiety=1)
- nowe: gra/tools/diplomacy-sensible-deals-test.cjs
- zmiana: gra/src/main.ts (+45 linii): (a) pickResourceTradeRelOffer — bramki niedobór/nadwyżka + pole reason; (b) enqueueNegotiationFromAiCmd — filtr bilansu PW gracza < 0 dla typów handlowych (zaproponuj_handel, zaproponuj_umowe_handlowa, zaproponuj_handel_surowiec)
- NIE dotknięto: logiki ticku zaufania/hamulca wojny (diplomacy tick), trimProposalForZeroBalance, pokoju/trybutu.

## Co zrobiono (wymagania z dispatchu)
1. Filtr bilansu: AI nie składa oferty handlowej, gdy aiProposalPlayerBenefitSurplus(payload) < 0 (ta sama konwencja co trimProposalForZeroBalance: dodatnia = korzyść gracza). Odrzucenie z logiem `[Dyplomacja] ... odrzucone (bilans PW gracza < 0)`. Pokój/trybut są świadomie wyłączone (żądania jednostronne z natury).
2. Sens ofert: AI kupuje tylko przy niedoborze (zapas < deficitTurns x zużycie), sprzedaje tylko przy nadwyżce (zapas > surplusMultiple x zużycie). Brak niedoboru i brak nadwyżki = brak oferty (return null). Pole `reason` (tradeOfferReason) dołączone do wyniku pickResourceTradeRelOffer.
3. Progi w JSON: gra/src/game/diplomacy-sensible-deals.config.json.
4. Flaga DIPLO_SENSIBLE_DEALS_ENABLED: gdy false, wszystkie bramki zwracają wartość bazową (true) i filtr bilansu jest wyłączony (sensibleBalanceFilterApplies). Brak testu równości hasha stanu z bazą (patrz BLOKADY).
5. Testy: gra/tools/diplomacy-sensible-deals-test.cjs — 30 PASS / 0 FAIL. Mutacje: (a) `>= 0` -> `> 0` na granicy bilansu: 1 FAIL (złapana); (b) wyłączenie członu `enabled &&` w filtrze: 1 FAIL (złapana); oba przywrócone.

## ZAŁOŻENIA (luki w dispatchu, przyjęte domyślnie)
- Z1: zużycie na turę nie jest modelowane w ścieżce handlu; przyjęto usePerTurn = pakietWielkosc x 1.
- Z2: deficitTurns=10 użyte TYLKO jako bramka dla zakupu (nie poszerza wyboru deficytu; istniejąca pickResourceDeficitForOwnerPair nadal używa progu „zapas < pakiet”, więc bramka 10-turowa jej nie rozszerza, tylko może odrzucić). Świadoma decyzja: nie poszerzać wolumenu ofert w tej rundzie.
- Z3: warunek (b) dispatchu „nadwyżka X + niedobór Y” jako wymiana w naturze NIE jest zaimplementowany; sprzedaż nadwyżki nadal płatna złotem/pracą (zaplataPerTura). Do decyzji Evaluatora / kolejnej rundy.
- Z4: filtr bilansu dotyczy tylko typów handlowych; pokój i trybut są poza zakresem.
- Z5: przy odrzuceniu oferta jest po prostu pomijana (nie re-trymowana). Na Trudnym trimProposalForZeroBalance celuje celowo w undershoot -3 PN, więc część ofert zostanie odrzucona; częstość do zmierzenia w pomiarze live.
- Z6: „zużycie” i „zapas” czytane z goodsProposer (tradableGoodsForAiDiplo) — ten sam indeks co wybór oferty, bez nowego źródła danych.

## TESTY
- node tools/diplomacy-sensible-deals-test.cjs: 30 passed, 0 failed (nowy).
- tsc --noEmit -p tsconfig.json: exit 0, 0 linii błędów.
- Bramki regresji (na tym commicie):
  - endturn-battle-deadlock-test: 38 pass, 0 fail (oczekiwane 38/0) OK
  - endturn-battle-deadlock-exec-test: 46 pass, 0 fail (oczekiwane 46/0) OK
  - load-game-regression-test: 34 PASS / 0 FAIL OK
  - logic-test: LOGIC OK (213/213) OK
  - ai-test: 18 linii FAIL (oczekiwane 18 niepowodzeń, 276 pass; liczba pass nie została odczytana z logu) — zgodne z bazą co do liczby, NIE zweryfikowano listy nazw względem bazy.
  - diplomacy*-test (53 pliki): 48 zielonych, 5 czerwonych: diplomacy-audience-close-flush, diplomacy-lista-podglad-przed-wizyta, diplomacy-negotiation-table, diplomacy-package-ai-counter-actionable (ReferenceError: isMe), diplomacy-proposal. Wszystkie 5 PADA TAKŻE NA BAZIE origin/main (zweryfikowane przez tymczasowe przywrócenie main.ts z origin/main) — błędy pre-existing, nie wynikają z tej zmiany.
- Baseline diplomacy-ai-offer-balance-test: 29/0 (przed zmianą i po — nie regresja).

## BLOKADY (niewykonane w R1)
- B1 (pkt 3 dispatchu): opcja „Wymagaj rozpatrzenia ofert handlowych przed końcem tury” w ekranie nowej gry — NIE zrobiona (wymaga UI nowej gry, zapisu w save, starsze zapisy = OFF).
- B2: blokada canPlayerInitiateEndTurn dla oczekującej oferty AI→gracz oraz zwolnienie (accept/modify/reject) i siatka przeciw osieroconej blokadzie w healStaleEndTurnBlockers — NIE zrobione.
- B3 (pkt 4): dowód „OFF = hash jak baza” — NIE wykonany (brak testu równości hasha stanu).
- B4 (pkt 5): pomiar w prawdziwej grze w Chromium wg wzorca gra/tools/*-live-test.cjs (>=2 seedy x >=40 tur, liczby ofert przed/po, powody, czas tury <= x1,10) — NIE wykonany.
- B5: Z3 (wymiana w naturze) — NIE zrobione.
- Vite build do katalogu tymczasowego — NIE wykonany w tej rundzie.

## NASTĘPNY KROK
Runda 2 Operatora: B1+B2 (UI nowej gry, save, blokada tury z siatką bezpieczeństwa), B3 (test hasha), B4 (live Chromium), następnie Evaluator i Final Control. Wspólne pliki dyplomacji z R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 — rebase przed integracją.
DEPLOY/PUSH: NIE WYKONANO

## COMMIT
(uzupełniany po commicie — SHA w odpowiedzi orkiestratora)
