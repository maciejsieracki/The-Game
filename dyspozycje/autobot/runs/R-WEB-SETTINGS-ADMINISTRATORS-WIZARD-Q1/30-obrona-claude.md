STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1
GOAL: Opcja „Administratorzy” w kreatorze nowej gry zamiast przełącznika automatyzacji; stare zapisy bez cichej zmiany zachowania.
ZMIANY/COMMIT: start 1f9481f49; poprawki w gra/src/game/auto-build-gate.ts, gra/src/main.ts, gra/tools/administrators-wizard-test.cjs, gra/tools/newgame-defaults-test.cjs, gra/tools/newgame-menu-reorder-layout-test.cjs (komentarze); SHA końcowy = commit zawierający ten plik.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. shouldShowLegacyAutomationMigration(meta, hadHiredAdministrator): zapis bez pola administratorsEnabled + (autoBuildEnabled===true LUB gracz miał zatrudnionego administratora miasta/ulepszeń) => powiadomienie. main.ts liczy hadHiredAdministrator PRZED kasowaniem administratorów. Test: autoBuildEnabled=false + administrator => true; nowe pole + administrator => false; sonda źródła main.ts.
   Założenie: zwrotu kosztu zatrudnienia nie ma (poza zakresem; komunikat wskazuje nową grę z opcją).
2. ODRZUCAM jako zmianę zakresu (niski): sekcja (A) testuje bramkę behawioralnie; wczytanie zapisu żyje w monolicie main.ts bez hooka testowego, więc pozostaje sonda źródła + czysta funkcja decyzyjna (teraz z parametrem). NIE_ZMIERZONO: realne wczytanie starego zapisu w przeglądarce.
3. ODRZUCAM (niski): powiadomienie pokazuje się, dopóki zapis nie zostanie ponownie zapisany; po zapisie meta.administratorsEnabled jest boolean => shouldShow=false (jednorazowość w sensie trwałym; test „zapis już z nowym polem”). Powtórzenie przy ponownym wczytaniu tego samego pliku jest zamierzone (komunikat obowiązkowy, brak cichej zmiany).
4. PRZYJMUJĘ do wiadomości (informacyjny): baza 09ddc9345 vs origin/main 733db93d1; merge + ewentualna regeneracja wikiBundle.json należą do orkiestratora (nie integruję).
5. PRZYJMUJĘ: zaktualizowano komentarze w newgame-defaults-test.cjs i newgame-menu-reorder-layout-test.cjs.

TESTY (surowe wyjścia): tsc --noEmit exit 0; administrators-wizard-test 58 passed/0 failed; city-administrator-test 58/0 (ostatnia linia wyjścia); improvement-administrator-test 53/0; newgame-defaults-test 62 pass/0 fail.
BLOKADY: brak. NIE_ZMIERZONO: Chromium/Playwright; pełny zestaw bramek z raportu Evaluatora (logic, tech-tree itd.) nie powtarzany — zmiana dotyka tylko bramki migracji.
RUNDY: obrona po rundzie 1
NASTĘPNY KROK: Final Control, potem integracja orkiestratora (merge z origin/main, regeneracja wikiBundle jeśli konflikt)
DEPLOY/PUSH: NIE WYKONANO
