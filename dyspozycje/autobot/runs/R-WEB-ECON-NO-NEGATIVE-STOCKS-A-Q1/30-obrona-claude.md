STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-A-Q1
GOAL: Projekcja skarbca i spichlerza państwa PO ticku (tylko odczyt), zgodna z realnym tickiem; obrona na zarzuty Evaluatora r1.
ZMIANY-COMMIT: kod 08568c7de (gra/src/game/no-negative-stocks.ts, gra/tools/no-negative-stocks-projection-test.cjs). Baza kandydat 4bd48899b. Ten plik jest commitowany osobno.

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (skarbiec: porównanie to tautologia, brak realnego endTurn, brak kolejki rekrutacji/budowy): PRZYJMUJĘ W CZĘŚCI.
- Dowód: w gra/tools/no-negative-stocks-projection-test.cjs runScenario liczy realSkarbiec = sc.skarbiec + income - u, czyli tę samą arytmetykę co projectTreasuryAfterTick. Porównanie skarbca jest więc odtworzeniem wzoru, nie wynikiem realnego ticku. Zarzut jest trafny.
- Realny blok main.ts (src/main.ts ok. 39673-39771) nie da się uruchomić w teście węzłowym (main.ts nie jest importowalny, a allowlista go nie obejmuje). Nie zamykam tego w tym temacie.
- Kolejka rekrutacji/budowy: w bloku „Bank treasury” (main.ts 39686-39700) nie ma składnika kolejki. Kolejka dotyka skarbca w innym miejscu (main.ts:23034, nie sprawdzałem szczegółowo). Projekcja nie zawiera więc członu kolejki i test go nie pokrywa. Ta luka pozostaje otwarta.
- Dla spichlerza porównanie z realnym advanceEmpireFood na prawdziwym stanie jest prawdziwe (bez zmian).
- NIE_POKRYTE: realny endTurn skarbca z main.ts w teście. Domknięcie wymaga wyciągnięcia arytmetyki banku do czystej funkcji w turn-economy.ts (poza obecną allowlistą; decyzja orkiestratora) albo testu na poziomie przeglądarki.

Zarzut 2 (rozbieżność źródła dochodu: sumEconomyForPlayerCities w main.ts vs sumEconomyForOwner w projekcji): PRZYJMUJĘ, POPRAWIONE w 08568c7de.
- Dowód rozbieżności: main.ts:39689 dla fotela człowieka używa sumEconomyForPlayerCities(econ, cities, hOid); blok AI (main.ts ok. 39742) używa sumEconomyForOwner.
- Poprawka: projectTreasuryAfterTick(skarbiec, econ, ownerId, cities?). Gdy cities jest podane, dochód = sumEconomyForPlayerCities (fotel człowieka); w przeciwnym razie sumEconomyForOwner (AI).
- Test (d) w no-negative-stocks-projection-test.cjs: stary zapis z miastem „duch” (ownerId 1, poza listą miast gracza). AI daje 180, człowiek 150. Oba wyniki sprawdzone.

Zarzut 3 (wydajność O(owners^2), NIE_ZMIERZONO): ODRZUCAM jako defekt bieżący, PRZYJMUJĘ jako uwagę na przyszłość.
- Dowód: grep po gra/src poza gra/src/game/no-negative-stocks.ts nie znajduje żadnego wywołania projectNnsAfterTick, projectEmpireFoodAfterTick ani projectTreasuryAfterTick. Projekcja nie działa w grze, więc koszt w grze wynosi zero.
- Klonowanie stanu wszystkich właścicieli przy wywołaniu per owner ma znaczenie dopiero po podpięciu w podtematach B i C. Nie zmierzono (NIE_ZMIERZONO) i nie jest kryterium tematu A.
- Rekomendacja: przy podpinaniu w B/C mierzyć koszt albo liczyć projekcję raz na turę dla wszystkich właścicieli.

TESTY (surowe wyjścia z tej sesji, po poprawce):
- npx tsc --noEmit: exit 0.
- no-negative-stocks-projection-test.cjs: 49 passed, 0 failed (exit 0).
- no-negative-stocks-test.cjs: 25 passed, 0 failed (exit 0).
- gold-deficit-test.cjs: 55 pass, 0 fail (exit 0).
- empire-food-b5-test.cjs: 34 pass, 0 fail (exit 0).
- logic-test.cjs: LOGIC OK (213/213) (exit 0).
- tech-tree-test.cjs: 20 pass, 0 fail (exit 0).
- research-test.cjs: PASSED 33 / FAILED 0 (exit 0).
- unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21) (exit 0).
- combat-test.cjs: All sanity checks passed (exit 0).
- mgla-sciezka-inwariant-test.cjs: exit 1, FAIL [1] (ai.ts:3741, 3776, 3777, 3824 niezaklasyfikowane). Zgodne z zarzutem Evaluatora: dług bazowy, nie regresja. Nie dotykałem ai.ts. Nie zweryfikowałem tego ponownie na c43597936.
- Bramka bez zmian: npm ci --ignore-scripts, bez npm run build/dev. Brak git add -A.

BLOKADY:
- NIE_POKRYTE: realny endTurn skarbca z main.ts (zarzut 1).
- NIE_POKRYTE: człon kolejki rekrutacji/budowy w projekcji i teście (zarzut 1).
- NIE_ZMIERZONO: koszt wydajności (zarzut 3).
- Dług bazowy: mgla-sciezka-inwariant 41/1 (poza allowlistą).

RUNDY: 1/5 obrony (odpowiedź na zarzuty Evaluatora r1).
NASTĘPNY KROK: Evaluator r2 na 08568c7de (i ten raport). Decyzja orkiestratora: czy wyciągnąć arytmetykę banku do czystej funkcji (poza allowlistą) przed integracją.
UWAGI-DLA-ORKIESTRATORA: brak. Nie zakładano sesji ani zadań.
DEPLOY/PUSH: NIE WYKONANO
