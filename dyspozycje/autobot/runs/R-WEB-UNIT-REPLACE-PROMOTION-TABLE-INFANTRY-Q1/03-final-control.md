STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1
GOAL: Wąska tabela awansów piechoty (pole "Zastąp specjalnie" w units.json), tylko dane + test.
ZMIANY/COMMIT: kod operatora 4dc002e96, obrona d6341c5e1 (potomek 4dc002e96 i bazy 7b201afcd). Diff 7b201afcd..d6341c5e1 = units.json (21 wierszy), unit-replace-promotion-table-test.cjs, 01-operator-r1.md; w allowliście. git diff --check czysto. Merge próbny z origin/main 6dbe57e62: bez konfliktów.
TESTY: unit-replace-promotion-table-test PASS na d6341c5e1 (23 źródła, 53 krawędzie, brak cykli; przypina pełną zawartość tabeli). Testy silnika (unit-replace 15/15, full-cost 40/0, army-multi-select 36/36, ai-era-unit-promotion 17/0, ai-unit-replace-same-rules 41/0) potwierdzone przez Evaluatora na tych samych danych; nie powtarzane. Chromium/live: NIE_ZMIERZONO. Build nie uruchamiany (dysk 3,6 GB).
ZARZUTY: 1 Włócznik: ODDAL do orkiestratora/ABC (decyzja produktowa: dispatch vs reguła epoki/klasy). 2 Test bez przypięcia: obrona naprawiła (d6341c5e1). 3 Bramki nacji dla celów generycznych: ODDAL, bramka istnieje w production.ts passesAvailabilityGates, test widoczności per nacja poza zakresem.
BLOKADY: brak technicznych. Do ABC przed deployem: akceptacja tabeli, Włócznik, luki bez celu (Sherden, szekelesz, Gaesatae, Soldurii, Miecznik galijski, Drużynnik, Garnizon Harappy, Gwardia hetycka, Piechota neobabilońska, Tyrski miecznik, Gwardia Tyreńska, khopesh, Mur tarcz, iButho).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (SHA końcowy kodu: d6341c5e1; zmiana tylko dane/test web, niezależna od origin/rust-port/parity-v2 43f4064b0, kolejność dowolna), ABC właściciela, READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
