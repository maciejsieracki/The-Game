STATUS: DECISION_REQUIRED (kod i pomiar na czysto gotowe; 2 oryginalne asercje nadal czerwone, czeka na właściciela)
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: każde miasto AI trzyma min. 1 jednostkę bojową także w pokoju; garnizon nie dołącza do armii.
ZMIANY-COMMIT: 28bace9bb (garrisonReserveMaxCitiesFromParams w ai-city-garrison.ts, wpięcie w main.ts, testy H11a-f). Baza r4 = 6d64be34c. Czubek pracy: commit raportu (pole sha).
TESTY (surowe, 28bace9bb): tsc 0 błędów; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat ALL OK; min-one 38/0; ai-war-city-garrison 21/0; defend-home 30/0; civilian-filter 8/0; seeks-army 22/0; siege-ai 17/0; sortie 71/0; siege-relief 23/0; home-defense-vs-barbarians 50/2 (T2(b), T4(b) ORYGINAŁ); army-concentration 56/2 (sc.4 "<10", "<=6").
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Bramka nie spełniona; rozstrzyga ABC: (A) zastąpić oryginały nowymi scenariuszami (rekomendacja) albo (B) dopuścić marsz jedynej jednostki (sprzeczne z regułą (f)).
2. ODRZUCAM jako kryterium: DODATEK 3 pkt 2 ma próg tylko dla t60 (≤10%); próg t30 nie istnieje. Fakt: t30 pokój 36/96 (37,5%), przyczyna częściowo (dowody-r4/pomiar-po-r4-diag.txt). Naprawa = ekonomia/NNS AI, poza allowlistą.
3. PRZYJMUJĘ, naprawione pomiarem: czysty bieg 28bace9bb (seed 4242, świeży start, bez instrumentacji): t30 36/96; t60 razem 16/188 (8,5%), zgodnie z biegiem diag (16/188). Dowód: dowody-r4/pomiar-po-28bace9bb-czysty-analyze.txt. Jedno ziarno; wariancji nie zmierzono.
4. PRZYJMUJĘ, zmierzone PRZED/PO (dowody-r4/pomiar-koszt-PRZED-PO-r4.txt; PRZED = 04f870acd, baza bez garnizonu, odtwarza audyt 78/91 i 131/154): utrzymanieJednostekPieniadz AI t30 228 -> 436; t60 2760 -> 3148 (+14%). Skarbiec AI t60 50237 -> 52604. Porównania r3->r4 nie zmierzono osobno.
5. PRZYJMUJĘ jako decyzję, nie błąd kodu. homeDefenderPool (ai.ts:3412) NIEZMIENIONY. Zmiana w ai-war-home-defense.ts wyklucza garnizon z puli planHomeWar (konsument homeDefenderPool, ai.ts:4239/5434) z reguły (f). Zmniejsza reakcję domową przed barbarzyńcami: DECISION_REQUIRED, ta sama decyzja co zarzut 1.
6. PRZYJMUJĘ i NAPRAWIONE: odczyt sufitu w czystej funkcji garrisonReserveMaxCitiesFromParams; testy H11c (wartość 5 -> 5) wykrywają literówkę klucza, bo fallback to 3.
7. PRZYJMUJĘ, bez naprawy: 16 pustych miast t60 (wł. 1: 4 przy skarbcu 11963). Przyczyna częściowo (nnsHold, surowce); naprawa poza allowlistą.
POMIAR PRZED->PO (t60, pokój+wojna, seed 4242): 167/193 (86,5%) -> 16/188 (8,5%); kryterium t60 ≤10% SPEŁNIONE.
BLOKADY: decyzje ABC: testy T2(b)/T4(b) i sc.4; homeDefenderPool / garnizon poza domem (zarzuty 1, 5).
RUNDY: 4/5 (obrona r4; kolejna dopiero po decyzji właściciela)
NASTĘPNY KROK: Evaluator (28bace9bb: H11 + czysty pomiar); Final Control; ABC (zarzuty 1, 5, 7).
DEPLOY/PUSH: NIE WYKONANO
