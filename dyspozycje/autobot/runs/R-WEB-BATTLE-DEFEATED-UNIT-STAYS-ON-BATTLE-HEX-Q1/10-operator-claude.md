STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEATED-UNIT-STAYS-ON-BATTLE-HEX-Q1
GOAL: Przegrana grupa w polu, gdy kierunek odwrotu wprost od zwyciezcy jest zablokowany, ma odskoczyc na inne pole (2 heksy, potem 1 heks), a nie zostawac na heksie bitwy.
ZMIERZONA PRZYCZYNA (test S1, stary kod, surowe dane): obroncy (11,22), zwyciezca (11,23). Kierunek wprost (12,21) zajety przez obca jednostke zwyciezcy, 2. heks (13,20) nieprzechodni. Stary fallback: krok 1 zajety, krok 2 nieprzechodni -> przerwanie -> po=11,22 (ZOSTAJE). Kierunek (11,21)->(11,20) byl wolny, ale nie byl brany pod uwage.
ZMIANY-COMMIT: gra/src/game/post-battle-map.ts (retreatDirectionCascade, tryRetreatCascade; placeFanOutGroup dla pola uzywa kaskady); gra/tools/battle-defeat-retreat-blocked-direction-test.cjs (nowy); gra/tools/battle-defeat-survivor-retreat-two-hex-test.cjs (asercja testu 4 skorygowana: dawne "<=1" zakladalo zostanie przy zablokowanym kierunku, teraz 2 heksy na inny kierunek); ten raport.
TESTY (po poprawce, surowe wyniki):
- battle-defeat-retreat-blocked-direction-test: 12 pass, 0 fail. Dane: S1 11,22->11,20 (dist 2); S2 ->11,21 (dist 1); S3 zostaje 11,22; S4 ->11,20; S5 kontrola ->13,20.
- Mutacja (stare wywolanie tryTwoHexRetreat w pliku zrodlowym, przywrocenie z kopii, cmp OK): 7 pass, 5 fail (czerwien). Przed poprawka S1 czerwona.
- battle-defeat-survivor-retreat-two-hex-test: 44 pass, 0 fail (przed poprawka 42/2; test 4 skorygowany).
- battle-retreat-limit-test 43/0; pre-battle-defender-retreat-test OK; pre-battle-retreat-exhausted-test 37/0; retreat-garnizon-fortyfikacja-test 27/0.
- tsc --noEmit exit 0. logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN (bez wypisanej liczby); unit-replace-test 21/21; combat-test "All sanity checks passed" (bez wypisanej liczby 6/6).
- NIE ZMIERZONO: battle-banner-retreat-overlap-live-test (przegladarka) przerwany timeoutem 300 s; battle-defeat-survivor-retreat-browser-test i zywy Chromium (zrzut PRZED/PO) nie uruchomione.
- NIE ZMIERZONO: zwyciezca z 71 jednostkami (hipoteza A z dodatku). Test uzywa jednej jednostki zwyciezcy blokujacej heks; liczebnosc nie byla odtwarzana.
BLOKADY: brak blokad kodu. Odwrot ATAKUJACEGO po przegranej (retreatAtkRosterToStart) nadal ma jeden kierunek; poza zakresem tematu, kandydat na osobny temat.
RUNDY: 1/5
NASTEPNY KROK: Evaluator: przeglad diffu post-battle-map.ts i testu; decyzja o zywym Chromium i o odwrocie atakujacego.
UWAGI-DLA-ORKIESTRATORA: (1) 1-heksowe odskoki kaskady dopisywane sa do retreatedTwoHexIds (sciezka mgly w main.ts); nazwa pola zostaje, semantyka = przemieszczone. (2) Interpretacja "x18" z dodatku 2 (przegrana armia wroga, 18 ocalalych) nie wymagala zmian kodu.
DEPLOY/PUSH: NIE WYKONANO
