# R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1 — raport Operatora (runda 1/5, HAIKU 5.5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1
GOAL: para w rozejmie (status 'pokoj' z truceUntilTurn albo truceEndOffer) liczy się w limicie wojen jako wojna tego typu co przed rozejmem; pokój (bez rozejmu) zwalnia limit; wznowienie po rozejmie nie jest blokowane limitem.

## ZMIANY
- gra/src/game/diplomacy-war-limit.ts: nowa czysta funkcja `isWarForLimit(status, meta)` (wojna albo pokój z rozejmem/ofertą po rozejmie).
- gra/src/main.ts: `warTypesForOwner` używa `isWarForLimit` zamiast `status === 'wojna'`; import dopisany. Reszta main.ts bez zmian.
- gra/tools/war-limit-truce-count-test.cjs: nowy test (a)–(e).
- Typ wojny przeżywa rozejm: ustawienie rozejmu (main.ts ~13011) robi `...metaT`, więc typWojny zostaje; truceEndTickPair i clearTruceEndOfferCore też kopiują meta. Bez zmian w diplomacy-peace-lock.ts.
- declareWarAfterTruce / truceEndToWarCore: nie wołają bramki limitu (potwierdzone źródłowo, test (d)). Wpis „Rozejm wygasł, wojna wraca” nietknięty.
- Pokój (finalizePeaceTreatyBetween) zwalnia limit: po finalizacji nie ma truceUntilTurn ani truceEndOffer, status 'pokoj' → isWarForLimit=false (test (b)).

## TESTY
- tsc --noEmit: exit 0
- war-limit-truce-count-test.cjs: 19 pass / 0 fail. Mutacja (isWarForLimit bez gałęzi rozejmu): 13 pass / 6 fail, czerwone (a) i (c); po przywróceniu 19/0.
- diplomacy-war-limit-unit-test: 57/0
- war-limit-ai-natural-test: 15/0
- war-rules-multiwar-main-guard-test: 21/0
- war-rules-multiwar-test: 57/0
- alliance-war-obligation-test: 14/0
- truce-end-war-notice-test: 15/0
- diplo-truce-until-turn-test: 15/0
- diplo-truce-r1-test: 31/0
- era-war-pairing-alliance-test: 19/0
- logic-test: 213/213
- tech-tree-test: 20/0
- research-test: ALL GREEN
- ai-test: 297 passed / 0 failed
- NIE ZMIERZONO: combat (6), testy live w przeglądarce (brak wymogu w dispatchu dla tego tematu; zachowanie w biegu gry nie sprawdzone).

## BLOKADY
brak

## RUNDY
1/5 (ostatni werdykt: brak; to pierwsza runda)

## UWAGI-DLA-ORKIESTRATORA
- Zakres tylko liczenia limitu; wartości 1/1 bez zmian; kandydat WARBYPASS (0a9e260ac) nieużyty.
- Luka do rozważenia przez FC: `pendingPrincipalCounts` i `countActiveWarsForOwner` nadal liczą tylko status 'wojna' (zgodnie z dispatchem: nie ruszane).

NASTĘPNY KROK: Evaluator, potem Obrona/Final Control.
DEPLOY/PUSH: NIE WYKONANO
