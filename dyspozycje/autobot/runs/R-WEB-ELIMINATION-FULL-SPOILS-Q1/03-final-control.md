STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ELIMINATION-FULL-SPOILS-Q1
GOAL: Przy eliminacji cywilizacji zwycięzca przejmuje cały majątek państwa; okno „Bilans zdobycia" pokazuje komplet.
ZMIANY/COMMIT: weryfikowany SHA b88ace31b (baza ae292911f; commity 2d1bf8a6d, 8a10a3229, b88ace31b). Allowlista OK: capital-capture.ts, main.ts (blok raportu, akcesory Spichlerza, wywołanie wokół runCapitalCapturePlunder), nowy gra/tools/elimination-full-spoils-test.cjs, pliki runu. Zero zmian w gra-robocza/**, WERSJE.md, rust-port/**. git diff --check czysty.
TESTY (odtworzone samodzielnie po npm ci --ignore-scripts): tsc --noEmit EXIT=0; elimination-full-spoils-test.cjs 114 passed / 0 failed EXIT=0 (mutacje czerwienią). Logi gate-*.txt (10 plików, jedna linia EXIT=) obecne w runie: capital-capture, elimination-toast-merge, miasto-zdobycie-raport = 0; conquest-stability, hud-skarbiec, barb-city-capture-cluster, ai-zdobycie-miasta-adiacencja, rekrutacja-skarbiec-only = 1 (padają także na bazie wg operatora, obrony i evaluatora; kod poza diffem; nie uruchamiałem ich ponownie na bazie, polecenie złożone zablokowane).
ZARZUTY:
1. Brak gate-*.txt: ODDAL (naprawione w b88ace31b).
2. Brak odtworzenia w Chromium: ODDAL jako akceptowalna luka (NIE_ZMIERZONO). Hooki civTest nie obejmują zdobycia/skarbca/Spichlerza, rozszerzenie wymagałoby zmian main.ts poza allowlistą. Rdzeń i wiersze okna pokryte testem na prawdziwych funkcjach; wiązanie main.ts sprawdzone po źródle. Zalecenie: wizualna weryfikacja po integracji.
3. Objaw „tylko Glina i Ruda": ODDAL jako nota. Surowce jadą z miastem (City.surowce); realna luka to żywność Spichlerza, naprawiona.
4. Martwa pętla remaining: ODDAL (usunięta w obronie, mutacja przestawiona). Ułamki/floor: ODDAL, bez zmiany zachowania (opisane w komentarzu).
5. Wchłonięcie dyplomatyczne (annexCityStateToOwner) bez transferu majątku: ODDAL poza zakres (to nie eliminacja przez zdobycie; dispatch zabrania zmiany zasad). Sugerowany osobny temat po decyzji właściciela.
6. Długość raportu: ODDAL.
Zarzutów NAPRAW: 0.
BLOKADY: NIE_ZMIERZONO Chromium; ryzyko konfliktu w main.ts z innymi tematami (zmiany lokalne).
RUNDY: 3/5 (FC)
NASTĘPNY KROK: integracja orkiestratora: cherry-pick 2d1bf8a6d, 8a10a3229, b88ace31b (+ commit z tym raportem) na origin/rust-port/parity-v2 PO zintegrowaniu tematów dotykających main.ts; konflikty w main.ts rozwiązać zachowując trzy bloki tego tematu (raport, akcesory Spichlerza, wywołanie runCapitalCapturePlunder). Następnie bramki tsc + spoils test.
DEPLOY/PUSH: NIE WYKONANO
