STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CAPITAL-SPACING-FIX-Q1
GOAL: A+B (stolica najblizej centroidu; sep stolic proporcjonalny do krotszego boku, podloga = tabela).
RUNDA: 2/5 (obrona zarzutow Evaluatora r1)

ODPOWIEDZI NA ZARZUTY
1. Parity (BLOKER) - PRZYJMUJE. `gra/tools/ai-avoid-polar-player-parity-test.cjs`: fixture BASE przegenerowany na HEAD A+B (te same 30 map/ziarna/parametry), naglowek z adnotacja. Wynik same=30/30 maxDist=0 PASS. Allowlista jawnie rozszerzona o ten plik (fixture + komentarz).
2. cluster-start-test (BLOKER) - PRZYJMUJE. `gra/tools/cluster-start-test.cjs` (Standard ~:768-772, Duza ~:805-815): oczekiwania 15->18, 17->20, 16->25, 16->27 z komentarzem (0,15 x krotszy bok 120/168 = 18/25; minDystansObcyOdGracza = sep+2 = 20/27; podloga tabeli 15/16 bez zmian). Wynik 477 pass / 3 fail (baza 448/8).
3. Nieprawdziwe liczby Pangea 30% - PRZYJMUJE, raport r1 byl bledny. Pomiar r2 (capital-spacing-measure, Standard, --types pangea --lf 0.30, ziarna 1-5, to samo narzedzie, --gra baza vs HEAD): baza capMedianOfMin=15, efektywny minSep 15, warn 0; HEAD capMedianOfMin=16, efektywny minSep 15 (sufit wykonalnosci scisnal do podlogi tabeli, nie do 18), warn 5 (po poprawce pkt 4; wczesniej 15), placed 5/5, para<25 w 100% map przed i po. Wniosek: na Pangea 30% wariant B praktycznie nic nie daje (sufit); zysk A: mapsBufViol 1->0, mpMpMinOfMin 3->5. Wartosci "18" i "0 ostrzezen" z r1 wycofane.
4. Spam logu - PRZYJMUJE. `gra/src/map/clusters.ts`: `capitalMinSeparationForMap` jest czysta (bez console.warn); ostrzezenie `[clusters] capital-sep: ... niewykonalne` emitowane RAZ na `computeClusters` (gdy minCapitalSep < propSep). Zmierzone: 15 -> 5 ostrzezen na 5 map (1/mape). tsc czysto.
5. Oslabienie asercji - PRZYJMUJE. `gra/tools/capital-sep-unit-test.cjs` (~:81-90): `>= 16` zastapione dokladnymi `=== 25` (sep Duza oraz max(12,sep)) + `>= capitalMinSeparation('ogromna')`; jawna adnotacja w komentarzu. 44/44.
6. map-gen-params-loader.ts poza allowlista - PRZYJMUJE jako ujawnione; 8 linii (getter `mapGenCapitalSepShortSideCoef`), konieczne do odczytu parametru z JSON; prosze FC o akceptacje. Bez cyklu importow (tsc, testy).
7. seaDist stolic obcych - ODRZUCAM jako regres, z dowodem. `pickCapitalHexInRegion` (clusters.ts ~:2325-2340) przy braku kandydata z seaDist>=10 w regionie schodzi po `seaDistRescueLadder` (FALA 188, "unikaj dropu civ"); A zmienia tylko sortowanie PO tym filtrze. Pomiar 30 map Standard (kontynenty/pangea/wyspy x 10 ziaren, gracz grecy, 6 rywali, 8 typow): baza 64/210 stolic obcych ponizej min (17/30 map), HEAD 70/210 (18/30 map); roznica w granicach szumu zmiany geometrii srodkow klastrow (sep+2), dominuja Wyspy (prawie wszystkie 8 w obu wersjach). Test sprawdza jedno ziarno, wiec liczba padajacych typow skacze 2<->3. Pre-istniejace, asercji nie luzowano.
8. NIE_ZMIERZONO (Duzy/Ogromny/Malenki, czasy) - ODRZUCAM jako zarzut kodu; w r2 nie powtarzalem pomiaru. Tabela r1 pochodzi z tego samego narzedzia: `node gra/tools/capital-spacing-measure.cjs --sizes <rozmiar> --types kontynenty,pangea,wyspy --lf def --seeds 1,2,3,4,5 --gra <korzen gra>` (przed: --gra z `git archive 97dbcb416`). Sep Duzej = 25 potwierdzaja capital-sep-unit i cluster-start-test.

ZMIANY r2: clusters.ts (warn raz), ai-avoid-polar-player-parity-test.cjs, cluster-start-test.cjs, capital-sep-unit-test.cjs, ten raport, gate-tests-r2.txt.
TESTY: gate-tests-r2.txt (tsc czysto; capital-sep-unit 44/44; pangea 3/3; mp-spawn-ration 16/16; cluster-spread 5/5; prop-test ALL PASS; polar pick 16/16, sim onPolar=0; q2-smoke 16/16; recovery2 29/29; parity 30/30; cluster-start-test 477/3 vs baza 448/8).
BLOKADY: 3 padajace asercje seaDist w cluster-start-test - pre-istniejace (pkt 7).
NASTEPNY KROK: Evaluator r2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
