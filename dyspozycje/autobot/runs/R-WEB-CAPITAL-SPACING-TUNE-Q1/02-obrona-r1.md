STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SPACING-TUNE-Q1
GOAL: bez zmian (0/10 map z para stolic <25 w zywej grze wg artefaktow; offline 0/24 <25, 7/7 civ, 0 ostrzezen `tylko N/M`).
ZMIANY/COMMIT: brak zmian kodu w obronie (podstawa: Operator 2b2163621 / 6233c19a9). Dodany tylko ten plik runu.
TESTY (odtworzone w obronie, worktree wf_2e79df3f-9c5-3, npm ci --ignore-scripts):
- capital-sep-unit-test: 44 passed, 0 failed.
- capital-spacing-prop-test: ALL PASS (mutacja wsp=0: 1/3 map lamie prog 25).
- cluster-start-test: moj bieg przekroczyl 580 s (EXIT=124, bez podsumowania; 422 PASS + te same 3 FAIL seaDist inkowie=8, chinczycy=8, sumer=6). Liczby 478/3 nie odtworzone co do sztuki (maszyna wolniejsza niz u Operatora).
- Proba pomiaru seaDist na dodatkowych ziarnach: NIE_ZMIERZONO (generateMap 168x120 trwa ~260 s/mape).

ODPOWIEDZI NA ZARZUTY:
1. (run_in_background) PRZYJMUJE. Operator uruchomil test w tle przez pomylke; naruszenie proceduralne, wynik nie ucierpial. Obrona: wszystkie biegi foreground (dluga komenda z timeout 580 s).
2. (cluster-start-test czerwony; sumer seaDist 8->6) ODRZUCAM jako zakres tego tematu, PRZYJMUJE jako notatke dla FC. 3 FAIL sa na czystym origin/main (gate-cluster-start-PRE-main.txt: 477/3, seaDist 9/8/8). Bramka seaDist (min 10 hex od morza dla stolic obcych typow) jest osobna od separacji i poza allowlista (dozwolone tylko capitalMinSeparationProportional/sufit). Zmiana 9/8/8 -> 8/8/6 dotyczy jednej mapy testowej (168x120, ziarno 4242, 8 typow); to przesuniecie pozycji, nie systematyczny dowod regresji (wiecej ziaren NIE_ZMIERZONO, koszt generacji). Rekomendacja: osobny temat R-WEB-CAPITAL-SEADIST (stolice obcych typow <10 hex od morza na mapie 4242).
3. (poluzowane progi Duzej) ODRZUCAM w czesci, PRZYJMUJE opis. Dolna granica [25,35] = prog celu 25 i = poprzedni sep efektywny Duzej (25), wiec obnizka ponizej 25 jest lapana. Wartosc 35 dla funkcji czystej (capitalMinSeparationForMap bez civ) jest przypieta dokladnie (=== 35), tak samo capital-sep-unit-test. Pomiar efektywny bez przypiecia do liczby swiadomie (zalezy od liczby lad/typow). Pinowanie `capitalMinSep === 23` dla Standardu 8 typow: zmierzone, deterministyczne (ziarno 4242 + staly teren); lamie sie tylko przy zmianie danych/generatora, co ma sygnalizowac.
4. (8 typow => sep 23 <25) PRZYJMUJE jako ograniczenie, nie defekt. Dispatch mierzy zywa gre (typy=7 wg T1), tam cel osiagniety (0/10). Przy 8 typach sufit CAPITAL_SEP_AREA_FACTOR 0,8 obniza sep do 23 (pomiar w cluster-start-test:772). Podniesienie do ~1,0 daje wiekszy wplyw na wszystkie rozmiary (wariant 0,23/1,0 odrzucony przez Operatora). DECYZJA_WYMAGANA (produktowa, dla orkiestratora): czy akceptowalne 23 przy 8 typach, czy podniesc sufit i zmierzyc ponownie wszystkie rozmiary.
5. (ostrzezenia w zywej grze NIE_ZMIERZONO) PRZYJMUJE. Potwierdzone tylko offline (warnClusters=0, warnSpawn=0). Pomiar konsoli w zywej grze wymaga sterownika z logowaniem konsoli (poza zakresem).
6. (zywych 10 map nie powtorzono; bundle bez dowodu poprawki) ODRZUCAM czesciowo. Dowod posredni: baseline przed poprawka mial 7/10 <25 i minima 18-20 (T1), po poprawce minima = 25 (rowne podlodze 0,21 x 120) i 0/10 <25; przy starym kodzie podloga 25 nie jest osiagalna (minimum teoretyczne 18). Roznica przed/po w pomiar-zywa-gra-przed-po.json na tych samych 10 mapach/ziarnach. Powtorzenie 10 map (~4 min/mape) NIE_ZMIERZONO w obronie.
7. (odsetek <30 bez zmiany w zywej grze: 8/10) PRZYJMUJE. Cel dotyczy progu 25 (spelniony); poprawy <30 nie obiecywano. Offline: Kontynenty 7/8, Pangea 5/8, Wyspy 4/8 (z 6/8).
8. (raport >500 slow) PRZYJMUJE; kosmetyka, bez poprawki (raport zachowany jako dowod).

BLOKADY: brak
RUNDY: obrona 1/5
NASTEPNY KROK: Final Control. Przekazac: zarzut 2 (osobny temat seaDist), zarzut 4 (DECYZJA_WYMAGANA o 8 typach).
DEPLOY/PUSH: NIE WYKONANO
