STATUS: FAIL
DOMAIN: GAME (pomiar; zero zmian logiki)
TEMAT: R-WEB-DIPLO-WAR-CONCURRENCY-MEASURE-Q1
GOAL: pomiar wojen epoki vs naturalnych, >=3 ziarna x >=150 tur; stan wyjsciowy PRZED regula 1+1.
ZMIANY-COMMIT: kandydat eb7be5d3e3fc8f38d2f437be4b3f7484b8876ca0. is-ancestor b2d5b4e51 -> OK. diff --stat: 10 plikow, +1505, same pliki z allowlisty (main.ts +70 hak odczytowy, 2 narzedzia .cjs, raporty, dowody). Zero zmian ai/diplomacy/forced-war/war-rules/dane. Hak __warConcurrencyMeasure przejrzany: tylko odczyt (get*, evaluateInterCivWarGate wywolywany na hipotetycznych danych, bez zapisu stanu).
TESTY (wlasne, surowe wyjscie): tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; node --check obu narzedzi OK. Nowego biegu gry nie uruchamialem (poza zakresem werdyktu; obrona tez go nie wykonala).
OCENA ZARZUTOW (obrona PRZYJELA wszystkie 7, zadnego nie obalila):
1 NAPRAW: cel 3x150 niespelniony (4242: t2-t76, 7: t2-t67, 1234: brak). Zasadniczy powod FAIL.
2 NAPRAW: (e) liczba odrzuconych prob niezmierzona; gateProbe to probe stanu, nie pomiar prob. Zmiana ai/main zakazana dispatchem, wiec do ABC.
3 NAPRAW: stall canEnd t76 seed 4242 niezbadany (mozliwy defekt gry, blokuje bieg do 150).
4 NAPRAW: oba ziarna daja ta sama jedyna wojne epoki 0-25 (braz, t40); n=1 para, hipoteza wlasciciela nie rozstrzygnieta ani potwierdzona.
5 ODDAL (uwaga): narzedzie naprawione (cityStateOwners, glowneBezWojnyEpoki), ale dane niepoliczone ponownie; wynik wymaga nowego biegu, wiec wchodzi w zarzut 1.
6 ODDAL (uwaga): kierunek zdarzenia (c) seed 7 t50 nierozstrzygniety; wymaga logu deklaracji (decyzja ABC).
7 ODDAL (uwaga): JSONL > 1 MB poza repo; wycinki wystarczaja jako dowod czesciowy.
Obrona runda 2 nie zawiera nowego dowodu pomiarowego, wiec PARTIAL nie moze byc PASS.
BLOKADY: seed 1234 brak; 150 tur nieosiagniete; stall t76; (e) odrzucone proby; kierunek (c); puste seed4242.* w dowody/ (do sprzatniecia przez orkiestratora).
RUNDY: 2/5 (FC po rundzie 2)
NASTEPNY KROK: runda 3 do tego samego ID: (1) zbadac stall t76 (canPlayerInitiateEndTurn/healStaleEndTurnBlockers) lub obejsc go wznowieniem; (2) bieg 3 ziaren (4242, 7, 1234) do 150 tur w kawalkach <590 s z nowymi hakami; (3) ABC dla wlasciciela: czy dopisac log deklaracji wypowiedzen (kierunek (c) i liczba prob (e)); to jedyna czesc wymagajaca decyzji, reszta techniczna. Wartosc czesciowa: jedyne zdarzenie (c) (seed 7 t50, X=25 w wojnie epoki z graczem, druga strona 37) jest pojedyncze i niepotwierdzone na 3 ziarnach.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: pelny bieg ok. 2-4 h wall-clock; SEGV Chromium przy wznowieniach ze slotu. Obrona R2 odpowiedziala bez nowych danych: rozwaz skrocenie rundy 3 do samego biegu pomiarowego.
