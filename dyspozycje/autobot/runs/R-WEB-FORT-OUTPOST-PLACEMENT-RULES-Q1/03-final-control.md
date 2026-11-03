STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1
GOAL: Posterunek tylko na wlasnym terytorium przy granicy (wspolny predykat), fort gdziekolwiek.
ZMIANY/COMMIT: weryfikowany 3f7972629d21eeac90fb7f72f2f7ada9e5d51ecb (baza ca0ed6b66 -> 23dd158e9). Diff 23dd158e9..3f7972629 w allowliscie poza gra/src/map/improvement-build.ts (wspolny kwalifikator panelu+automatu; odstepstwo uzasadnione, do jawnej akceptacji orkiestratora) i gra/tools/fort-outpost-placement-measure.cjs (harness pomiarowy, dozwolony). Zero zmian w gra-robocza, WERSJE.md, rust-port, auto-improvements.ts. git diff --check czysty.
TESTY (samodzielnie, EXIT=0): tsc --noEmit; fort-outpost-placement-rules-test 40/0; ai-improvements-test 56/0; fort-strazniaca-zasieg-zakladania 85/0; auto-fort-claim; auto-fort-diag; fort-vision; fort-outpost-hard-territory; fort-nodes-save-load; autoimprove-stages-q1; city-defense-terrain-gate; ai2-heks-po-heksie. Mutacje wlasne: (1) petla 2 AI bez predykatu, (2) predykat bez warunku granicy -> test pada. NIE_ZMIERZONO: hotseat-etap5-no-leak, ai4-popyt-obywatele, grupa-b-lane (pada tak samo na bazie wg Evaluatora), live test przegladarkowy, pelna gra.
WERDYKT ZARZUTOW: 1 improvement-build.ts poza allowlista -> ODDAL (akceptacja orkiestratora). 2 wygaszenie ekspansji AI -> naprawione w obronie (petla 2, posterunek przy granicy, wspolny predykat; zweryfikowane C5-C10 + mutacja). 3 pomiar PRE pokazuje posterunki -> ODDAL (wynik pomiaru). 4 etykiety testu -> naprawione. 5 brak testu UI/live -> ODDAL (NIE_ZMIERZONO, strazniki tekstowe).
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (cherry-pick ca0ed6b66 + 3f7972629 + ten commit; mozliwe konflikty z Q2 w ai.ts/main.ts, tylko planExpansionFortBuilding i bloki fort/posterunek).
DEPLOY/PUSH: NIE WYKONANO
