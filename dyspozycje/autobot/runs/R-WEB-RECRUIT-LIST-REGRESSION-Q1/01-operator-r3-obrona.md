STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RECRUIT-LIST-REGRESSION-Q1 (Operator, odpowiedz na zarzuty Evaluatora r3, obrona)
GOAL: Brak surowca wyszarza element (jednostka/budynek/Zastap), nie ukrywa go. Odpowiedz na zarzuty 1-6 z oceny Evaluatora dla c95bef36 (baza 3219ec2a, origin/main fcd86933).

ZMIANY/COMMIT: Kod nie zmieniony w tej obronie. Badany commit: c95bef36. Commit obrony zawiera tylko ten plik.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE. Przyczyna z dowodem: ukrywanie po zapasie Braz/Zelazo wprowadzone w daacd43a (empireStockHas(ctx.empireResourceStock, 'braz'|'zelazo') w availableProduction), Drewno w 5682c066 (BUG-BRAMKA-DREWNO-BRAK). Nie z 9b38334f. Naprawa: flaga showStockGatedUnits (production.ts ok. 1041-1053, 1154-1160), ustawiana tylko w panelu i Zastap (main.ts:6592, cityPanel.ts:8214). Plik raportu zapisany tym dokumentem.
2. PRZYJMUJE jako dlug z bazy, ODRZUCAM jako regresje. Zmierzone: recruitment-no-upkeep-gate-test 22 pass / 14 fail na fcd86933 i na c95bef36 (identycznie). deposit-building-gate-test 46 pass / 1 fail na fcd86933 i na c95bef36. Oba poza zakresem N1.
3. PRZYJMUJE, z poprawka faktu. Sciezka stuba to gra/tools/.stubs/recruit-list-visibility-ui-brandAssets-stub.ts (nie w gra/tools/ wprost). Pliki spoza dosłownej allowlisty, z uzasadnieniem:
   - gra/src/game/production.ts: TU jest przyczyna (filtr zapasu w purchasableUnits/availableReplacementsFor). Wymagane przez dispatch.
   - gra/src/main.ts (wiring widoku Zastap, showStockGatedUnits:true) i gra/src/ui/unitReplacePicker.ts (wyszarzenie opcji z blockedReason): wymagane, by naprawic UI Zastap, ktory tez ukrywal. Zgodne z zasada wlasciciela "zawsze na budynkach czy jednostkach". WYMAGA AKCEPTACJI ORKIESTRATORA.
   - gra/tools/.stubs/recruit-list-visibility-ui-brandAssets-stub.ts: stub dla testu UI w Chromium. Wymagany, bez zmian logiki.
   - gra/src/ui/cityPanel.ts: szew testowy (eksport renderBuildList) i flaga budowy. Miesci sie w allowliscie.
4. PRZYJMUJE jako zbadane. Grep na c95bef36: punkty ukrywania po zapasie to: production.ts 963-967 (budowa, za flaga showResourceGatedBuildings), 1041-1053 i 1154-1160 (jednostki, za showStockGatedUnits), 2373-2378 (katalog eraBuildingCatalog, tylko status resourceOk, bez ukrycia). Cuda i ulepszenia nie maja osobnego filtra po surowcach w grep (pelna sciezka cudow nie przesledzona szczegolowo: NIE_ZMIERZONO).
5. PRZYJMUJE jako otwarte. Operator nie wykonal zrzutow ekranu. Weryfikacja: DOM w headless Chromium (recruit-list-visibility-ui-test 15/15, building-resource-visibility-ui-test 8/8). Realny wyglad, zrzut i ocena wizualna: ZOSTAJE DO FINAL CONTROL.
6. ODRZUCAM. Dispatch podaje "np. brak drewna (50)" jako przyklad. Obecny tekst "50 Drewno (brak)" zawiera nazwe zasobu i ilosc, czyli spelnia wymaganie. Bez zmiany.

TESTY (wlasne, na c95bef36, gra/ npm ci --ignore-scripts):
- recruit-list-visibility-test: 9 pass / 0 fail
- building-resource-visibility-test: 15 pass / 0 fail
- building-stock-visibility-test: 7 pass / 0 fail
- unit-replace-test: 13/13
- logic-test: 213/213
- tsc --noEmit: exit 0
- recruitment-no-upkeep-gate-test: 22/14 (pre-existing, jak na main)
- deposit-building-gate-test: 46/1 (pre-existing, jak na main)

BLOKADY: brak. Otwarte: pkt 3 (akceptacja allowlisty main.ts/unitReplacePicker.ts), pkt 5 (wizualna weryfikacja w przegladarce, zrzut).

RUNDY: 3/5 (obrona w tej rundzie to r3, bez zmian kodu).
NASTEPNY KROK: Evaluator ponownie na tym raporcie, potem Final Control na c95bef36 z wizualna weryfikacja w Chromium i akceptacja allowlisty przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
