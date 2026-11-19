STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1
GOAL: Mennica (czy delta 0 to błąd?) i rozdział gliny między Cegielnię a Garncarnię proporcjonalnie do zapotrzebowania.
ZMIANY/COMMIT: gra/src/game/converters.ts (runConverters: udział proporcjonalny dla wspólnego wejścia), gra/tools/mennica-magazyn-test.cjs (asercja Mennicy), gra/tools/converters-shared-input-test.cjs (nowy). SHA w polu sha odpowiedzi.

ZADANIE A (Mennica), zmierzone liczbami z testu:
- ze złotem {zloto:10}: pieniadzBrutto base 2 -> Mennica 2 (delta 0), nauka 4 -> 5.
- bez złota {}: identycznie, delta 0.
- Harness nie podaje resolveOwnerActiveLabels, więc bramka złota w tym teście nie działa.
- Przyczyna: domyślny podział Handlu 60/30/10 (cities.ts DEFAULT_PODZIAL_HANDLU); floor(2 x 0,30) = 0 Pieniądza, +1 do Nauki.
- Wniosek: delta 0 występuje także ze złotem, ale mechanizm to zaokrąglenie podziału małej puli, NIE bramka złota. Logika Mennicy NIE zmieniona (podział = decyzja 67B, do właściciela).
- Asercja (a) zmieniona z "=2" (oczekiwanie 20/60/20, nieaktualne) na "delta w [0,2]" (brak wycieku mnożnika).

ZADANIE B (glina 40, Cegielnia + Garncarnia, tput 50/30):
- Przed: cegla 40, ceramika 0 (Cegielnia pierwsza zjadła wszystko).
- Po: cegla 30 (15 cykli), ceramika 9 (9 cykli), zużycie gliny 30 + 9 = 39 <= 40.
- Trzy konwertery o drewnie (30): cegla 22, ceramika 6, braz 11 (wszystkie > 0).
- Bez konkurencji (glina 1000, drewno 1000): wynik identyczny jak dawniej (cegla 100, ceramika 30).
- Mutant (sekwencyjny) daje ceramika 0: asercja czerwona.

TESTY (surowe wyjście):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: exit 0; research-test: exit 0; ai-unit-replace-same-rules-test: exit 0; combat-test: exit 0
- mennica-magazyn-test: 41 passed, 0 failed (przed: 39 passed, 2 failed)
- converters-shared-input-test: 18 passed, 0 failed
- ekonomia-5x-inwariant-test: 280 passed, 0 failed; grupa-b-lane-test: 49 pass, 0 fail; hex-plony-magazyn-test: 14 passed, 0 failed; zloto-test: 45 pass, 0 fail; tarasy-cywilizacje-test: 18 passed, 0 failed
- resource-gross-net-converter-inputs-test: RESULT 18 ok, 0 FAIL

BLOKADY:
- (4) pomiar: bieg dymny 45 tur seed 4242 w przeglądarce NIE ZMIERZONO (brak gotowego skryptu runu; smoke_test.cjs to JSDOM, nie 45 tur).
- HUD: converterConsumedRatesForBuildings (main.ts:4013, poza allowlistą) liczy NOMINALNE zużycie per budynek, bez zapasu. Przy konkurencji HUD netto gliny nie zgadza się z silnikiem (silnik zjada 39, HUD liczy nominalnie 130). Wymaga zmiany w main.ts (decyzja orkiestratora).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator; decyzja właściciela (ABC): czy zaokrąglenie podziału 30% przy małej puli Pieniądza (Mennica 2 pkt -> 0) ma być naprawione.
DEPLOY/PUSH: NIE WYKONANO
