# R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1 — raport Final Control (Claude, Sonnet 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1
GOAL: para w rozejmie (pokoj + truceUntilTurn albo truceEndOffer) liczy się w limicie wojen jako wojna swojego typu; pokój bez rozejmu zwalnia limit; wznowienie po rozejmie nie jest blokowane limitem.

## ZMIANY/COMMIT
Kandydat: 0add98529746128d49953947177ba02a591c9b88; baza 45e48f965631584e0efd5353bc376d63fe9e3489 = origin/main; `git merge-base --is-ancestor` baza -> kandydat: TAK.
git diff --stat: 4 pliki, +166/-3: diplomacy-war-limit.ts (+11, czysta funkcja isWarForLimit), main.ts (+6/-3, tylko warTypesForOwner + import), nowy gra/tools/war-limit-truce-count-test.cjs (+104), raport Operatora (+45).
Allowlista zachowana (brak zmian w gra-robocza, WERSJE.md, rust-port, diplomacy-peace-lock.ts). Kod blokujący wznowienie (WARBYPASS) nieobecny; declareWarAfterTruce nietknięty (nie woła bramki limitu), wpis „Rozejm wygasł, wojna wraca” zachowany. Limit 1/1 bez zmian.

## TESTY (własne uruchomienie na kandydacie, surowe wyniki)
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6
- ai-test 297 passed / 0 failed
- war-limit-truce-count 19/0; mutacja (isWarForLimit zwraca false dla rozejmu): 13 pass / 6 fail (czerwone a i c); po przywróceniu 19/0
- era-war-pairing-alliance 19/0; war-rules-multiwar 57/0; war-rules-multiwar-main-guard 21/0; war-limit-ai-natural 15/0; diplomacy-war-limit-unit 57/0; alliance-war-obligation 14/0
- truce-end-war-notice PASS; diplo-truce-until-turn 15/0; diplo-truce-r1 31/0; diplo-truce-impl 91/0; diplo-truce-r4-ai 24/0
- NIE ZMIERZONO: zachowanie w żywej grze (przeglądarka); test (d) to guard tekstowy źródła, nie behawioralny.

## ZARZUTY
Evaluatora: brak przekazanych. Obrony: brak. Własne uwagi (ODDAL, nie FAIL):
1. pendingPrincipalCounts i countActiveWarsForOwner nadal liczą tylko status 'wojna' (zgodnie z dispatchem). Wojna oczekująca a rozejm — ewentualny osobny temat.
2. Test (d) to guard tekstowy (1500 znaków po `declareWarAfterTruce: (a, b) => {`) — kruchy względem refaktoru, poprawny dziś.
3. Zachowanie w biegu gry nie zmierzone.

## BLOKADY
brak

## RUNDY
1/5 (FC: PASS-WITH-NOTES)

## UWAGI-DLA-ORKIESTRATORA
- Zmiana dotyka gra/src, więc po integracji deploy na ROBOCZĄ jako FALA. Następny: TRUCEPRICE (#141).

NASTĘPNY KROK: integracja orkiestratora (FF z kandydatem), deploy/push osobną autoryzacją.
DEPLOY/PUSH: NIE WYKONANO
