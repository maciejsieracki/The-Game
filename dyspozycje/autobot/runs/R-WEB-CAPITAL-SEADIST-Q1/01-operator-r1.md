STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SEADIST-Q1
GOAL: cluster-start-test 0 fail bez zmniejszania liczby asercji, rozproszenie stolic nie gorsze od odniesienia.
ZMIANY/COMMIT: tylko gra/tools/cluster-start-test.cjs (blok "stolice obcych typow >= minSeaDist na Standard", ok. l.757-785). Zero zmian w gra/src i data. SHA: patrz git log (commit "test(mapa): seaDist stolic obcych typow..."). Logi: gate-*.txt w katalogu runu.
TESTY:
- Odtworzenie: node gra/tools/cluster-start-test.cjs -> 3 FAIL (l.762 testu przed zmiana): inkowie seaDist=8, chinczycy=8, sumer=6 (min 10), mapa generateMap(168,120,4242,'kontynenty'), 8 typow.
- Przyczyna (pomiar, tymczasowe logi w clusters.ts, cofniete): Standard ma 5562 hexow ladu, tylko 615 (11%) z seaDist>=10. minDystKlastrow=25, sep stolic runtime=23. Losowy pakunek zachlanny (300 prob) hexow seaDist>=10: max 6 punktow przy sep 25 i 23, 7 przy 20, 9 przy 15. Wiec 8 stolic >=10 od morza przy sep 23-25 jest geometrycznie niewykonalne na tej mapie; 5 srodkow wchodzi w strefe (seaDist 10-11), 3 ostatnie schodza po seaDistRescueLadder (clusters.ts:1769, pickCapitalHexInRegion l.2327) do 8/6 - to zamierzone miekkie ladowanie (FALA 188), a w regionach inkow/chinczykow/sumeru nie ma ani jednego hexa seaDist>=10 (sea10=0). Wariant (b) (poprawa wyboru hexa w regionie) nie ma przestrzeni: region nie zawiera kandydata; zmiana wymagalaby zmniejszenia rozproszenia (zakazane kryterium).
- Rozstrzygniecie: wariant (a) zmodyfikowany. Asercja per stolica obcego typu (liczba asercji bez zmiany) przyjmuje seaDist<min wylacznie, gdy zaden hex ladu o seaDist>=min nie spelnia sep (sepGate-1 = margines) wzgledem pozostalych stolic, tj. brak zmarnowanego slotu srodladowego. Wynik: 3x "wolnych slotow srodladowych=0" (INFO w logu). Prog 10 nietkniety dla stolicy gracza (osobne asercje) i dla stolic ze slotem.
- cluster-start-test: 481 passed, 0 failed, EXIT=0 (przed: 478 ok/3 fail; ta sama liczba 481).
- capital-spacing-prop-test: ALL PASS (0 failed). ai-avoid-polar-player-parity-test: PARITY same=30/30, PASS.
- Rozproszenie: gra/src i data niezmienione => pomiar odniesienia (10 map, para <25: 0/10, mediana 25,5) bez zmian z konstrukcji; pomiaru capital-spacing-measure.cjs NIE_ZMIERZONO ponownie. BASE parity nieprzegenerowany (parity przeszlo).
- tsc --noEmit: nie uruchomiono, bo zmieniony tylko plik .cjs (poza tsconfig); NIE_ZMIERZONO.
BLOKADY: Zywa weryfikacja w Chromium nie wykonana (brak zmian w kodzie gry, nie wymaga buildu). Znane ryzyko: zalozenie testu "brak wolnego slotu" jest szacunkiem sep z innym landCount (24 vs 23 runtime, kompensowane -1). Uwaga procesowa: pelny cluster-start-test trwa ok. 25 min (rzeki), nie miesci sie w jednym wywolaniu 590 s - uruchamiany odczepiony i odpytywany.
ZALOZENIE: zmiana oczekiwania w tescie zamiast w clusters.ts, bo kod robi to, co zamierzono (rescue ladder); dispatch dopuszcza (a) z uzasadnieniem pomiarem.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (czy zastapienie progu twardego warunkiem "brak wolnego slotu" nie oslabia progow; opcjonalnie osobny temat: czy 8 typow na Standard powinno liczyc tylko 6 srodladowych).
DEPLOY/PUSH: NIE WYKONANO
