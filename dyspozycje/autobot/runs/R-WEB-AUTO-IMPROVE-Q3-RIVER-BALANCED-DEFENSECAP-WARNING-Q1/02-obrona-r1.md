STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-IMPROVE-Q3-RIVER-BALANCED-DEFENSECAP-WARNING-Q1
ROLA: Operator (obrona), runda 1/5, baza bbc255280

Zarzut 1 PRZYJMUJE: nowa `disableOnlyWorkedFilterForOwnerCities` (auto-improvements.ts) wywolywana z `onUnspentBudgetDisableFilter` (main.ts) wylacza filtr tez w miastach gracza z override. Test (4b) auto-improve-q3-test.cjs na prawdziwym `resolveEffectiveUlepszenia`: PRZED miasto override ma ON, PO zadne.
Zarzut 2: zostaje decyzja orkiestratora (luka zywa; brak scenariusza Chromium w tej rundzie).
Zarzut 3 ODRZUCAM: proba kalibracji (pominiecie drog/fort/posterunek w liczniku) nie zmienila wyniku (87 -> 87), wiec nie drogi zawyzaja licznik, tylko inne klucze realnie czekajace na filtr. Zmiana cofnieta.
Zarzuty 4, 5, 6: ograniczenia jawnie opisane, poza allowlista lub decyzja wlasciciela; decyzja orkiestratora (osobny temat: save rejestru wycietych heksow).
TESTY: auto-improve-q3 50 OK / 0 FAIL; tsc EXIT=0; regresje (6 testow) EXIT=0.
DEPLOY/PUSH: NIE WYKONANO
