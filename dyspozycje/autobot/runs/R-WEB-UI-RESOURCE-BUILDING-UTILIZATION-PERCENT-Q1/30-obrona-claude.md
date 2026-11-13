STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1
GOAL: procent wykorzystania mocy budynku surowcowego w nastepnej turze (z prognozy silnika) w panelu imperium
ZMIANY/COMMIT: start 984160c21; poprawka zarzutu 3 w gra/src/game/converters.ts (summarizeBuildingUtilization: cykle<maxCykle nigdy nie daje 100%, cap 99) + test A2 w gra/tools/resource-building-utilization-test.cjs (+4 asercje). SHA koncowy: patrz pole sha zwrotki.
TESTY (surowe wyjscie, po poprawce): tsc --noEmit 0 bledow; resource-building-utilization-test 52 passed / 0 failed (bylo 48/0); logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; converters-test 49/0; converter-era-scaling-test 117/0. Nie mierzono: ponownego przebiegu Chromium (zmiana nie dotyka renderu; zrzuty z rundy 1 bez zmian).
ODPOWIEDZI NA ZARZUTY:
1 (converters.ts poza allowlista): PRZYJMUJE jako uwage — zmiana tylko dodaje pola/funkcje podsumowania, bez zmiany regul produkcji; do akceptacji orkiestratora. Dowod: git diff --name-only 75f4183bb 984160c21; converters-test 49/0.
2 (skrypt *-live.cjs poza wzorcem): ODRZUCAM — narzedzie Chromium wymagane kryterium 3 dispatchu, nie dotyka kodu gry. Do akceptacji orkiestratora.
3 (Math.round 199/200 = 100%): PRZYJMUJE — poprawka: pct=99 gdy cykle<maxCykle, limitedBy zachowany. Dowod: test A2 (199/200->99, 200/200->100, 100/200->50), 52/0; test spojnosci B (+-0 pkt z realna tura) nadal zielony.
4 (etykieta "uspiony" dla kazdego wlaczonego konwertera bez wpisu): ODRZUCAM — brak wpisu = bramka runtime budynku (komentarz building-toggle.ts:158, kind 'asleep'); silnik nie udostepnia przyczyny, a dispatch zabrania zmiany regul/turn-economy poza eksportem. Przyszly temat informacyjny.
5 (wspolna pula liczona kolejno): ODRZUCAM — zgodnosc z silnikiem (kryterium 1), potwierdzone testem B (100/50/0 dla 75 gliny); Evaluator uznal za nie-blad.
BLOKADY: brak
RUNDY: obrona po rundzie 1
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
