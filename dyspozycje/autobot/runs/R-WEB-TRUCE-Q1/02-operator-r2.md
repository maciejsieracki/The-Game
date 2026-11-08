STATUS: INTEGRATION_PENDING (runda 2/5, odpowiedź na FAIL r1; NIE PASS)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRUCE-Q1
GOAL: rozejm jako propozycja stołu (5/10/15 tur), baza PW 200 (ZAŁOŻENIE), bramki wspólne z pokojem, wygaśnięcie bez kary, złamanie w oknie, AI, UI, zapis/odczyt. Runda 2 domyka zarzuty r1 w zakresie allowlisty; zakres main.ts/AI/UI/zapis pozostaje otwarty (patrz niżej).
ZMIANY/COMMIT: baza ebf750795 (Operator r1) -> commit r2 (SHA w raporcie orkiestratora). Zmienione: gra/src/game/diplomacy-proposals.ts (treatyPnGate: `pokoj || rozejm`), gra/tools/diplo-truce-r1-test.cjs (P10, P11, L10, N1, M3-M5), ten raport.

ODPOWIEDZI NA ZARZUTY:
1. Zakres GOAL niepełny: PRZYJMUJĘ. Brak main.ts (akceptacja, status, tik, kara za złamanie), ai.ts, UI, zapis/odczyt, zrzutu. Nie zrobione w r2 (wymaga osobnych plików i zakresu rundy 3 po rozstrzygnięciu allowlisty z pkt 2). Helpery truceUntilTurn/isTruceActive/truceExpiryAction/isTruceBreach: PRZYJMUJĘ, martwe do czasu podpięcia main.ts (gra/src/game/diplomacy-peace-lock.ts:58-104).
2. Waluta w wojnie (PEACE_CURRENCY_ACTION_IDS bez 'rozejm'): PRZYJMUJĘ, NIE ZMIENIONO. Plik gra/src/game/diplomacy-war-gates.ts:10 jest poza allowlistą. ZAŁOŻENIE do zatwierdzenia: dodać diplomacy-war-gates.ts (jedna linia: dodać 'rozejm') i diplomacy.ts (zdarzenie 'rozejm') do allowlisty. Bez tego P8 nadal omija walutę.
3. Gałąź pokoju treatyPnGate nie obejmuje rozejmu: PRZYJMUJĘ, NAPRAWIONO. gra/src/game/diplomacy-proposals.ts:733 `if (actionId === 'pokoj' || actionId === 'rozejm')`. Dowód: P10 (rozejm i pokój z ujemnym pwBalance odrzucone komunikatem bramki PW pokoju), M3 wykrywa cofnięcie poprawki. Pozostałe miejsca 'pokoj' (diplomacy-proposals.ts:1954-1972 AI-oferty, :2600 SWEETENER_COUNTER_ELIGIBLE bez 'rozejm', diplomacyAcceptanceBalance.ts, UI): NIE_ZBADANE w r2, ZAŁOŻENIE do rundy 3.
4. Długość 5/10/15 nie trafia do silnika: PRZYJMUJĘ, NIE NAPRAWIONO. Walidacja jest; utrwalenie wymaga pola w DiploPairMeta (diplomacy-pn-engine.ts, poza allowlistą) i wywołania w main.ts (startPeaceTreatyLock ma już parametr lockTurns, main.ts ~10608). ZAŁOŻENIE: rozszerzyć allowlistę o diplomacy-pn-engine.ts.
5. Testy progów/NaN/mutacje granicy: PRZYJMUJĘ, NAPRAWIONO. Dodano: L10 (N-1/N/N+1 dla 5/10/15), N1 (NaN/Infinity/undefined), P11 (turns=NaN odrzucone), mutanty M4 (wygaśnięcie w N+1: peace-lock.ts `>` zamiast `>=`) i M5 (aktywność w N: `<=` zamiast `<`). Wszystkie mutanty zastosowane dokładnie raz (check (0)) i wykryte.

TESTY (runda 2):
- npx tsc --noEmit: exit 0.
- git diff --check: czysty.
- diplo-truce-r1-test: 29 pass / 0 fail (r1: 22/0).
- Mutanty: M1, M2, M3, M4, M5 wykryte.
- Regresja: diplo-war-peace-gate 11/0; diplomacy-peace-lock 9/0; diplo-war-peace-d7 8/0; diplomacy-test 148/0; diplo-aggressor-unit 73/0; diplomacy-ai-offer-balance 29/0; diplo-war-peace-profile-unit 198/0.
- Zrzut Chromium: NIE_ZROBIONO (brak UI).

BLOKADY:
1. main.ts nie podpięte (akceptacja, status, tik, kara). Nie wystawiać rozejmu w UI.
2. Allowlista: diplomacy-war-gates.ts, diplomacy.ts, diplomacy-pn-engine.ts (ZAŁOŻENIE o rozszerzeniu).
3. ai.ts, UI, zapis/odczyt: NIE_ZROBIONO.

RUNDY: 2/5 (ostatni werdykt r1: FAIL, Evaluator/Final Control)
NASTĘPNY KROK: orkiestrator rozstrzyga ZAŁOŻENIA allowlisty (pkt 2 i 4) -> runda 3: main.ts, diplomacy.ts, war-gates, ai.ts, UI, zapis, zrzut.
DEPLOY/PUSH: NIE WYKONANO
