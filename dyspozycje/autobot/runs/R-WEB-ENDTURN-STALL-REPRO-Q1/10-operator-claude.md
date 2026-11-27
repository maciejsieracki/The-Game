STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-STALL-REPRO-Q1 (tag ENDSTALL)
GOAL: odtworzyć i zdiagnozować zatrzymanie końca tury z VLIVE3 (t12, FORTRING ON, maksimum, seed 4242).
ZMIANY/COMMIT: baza origin/main 659e2d01c. Zmiany w gra/src i gra/data: brak. Nowy plik: gra/tools/endstall-fortring-live.cjs (kopia runnera VLIVE3 z ziarnem z ENDSTALL_SEED i diagnostyką stop/konsoli). Analiza: dyspozycje/analizy/KONIEC-TURY-ZAWIESZENIE-2026-11-27.md. Dane: dyspozycje/autobot/runs/R-WEB-ENDTURN-STALL-REPRO-Q1/dane/ (36 logów *.txt + tally-przebiegi.txt). SHA commita: wpisany przez orkiestratora po commicie (patrz sekcja SHA niżej).
TESTY:
- Przebiegi: 36 uruchomień runnera na Chromium headless (rc=0 we wszystkich, pageerror 0, SIGSEGV 0, round-trip zapisu równy 36/36).
- FORTRING ON maksimum, seed 4242: 24 przebiegi, 15 zatrzymań (przegrana gracza), 9 dokończonych 20 tur.
- FORTRING ON maksimum, seed 7: 4 przebiegi, 2 zatrzymania. Seed 778899: 4 przebiegi, 2 zatrzymania.
- FORTRING OFF maksimum, seed 4242: 4 przebiegi, 3 zatrzymania (pierścień nie wpływa na zatrzymanie).
- Każde zatrzymanie: ostatnia blokada = gameOver; inProg=false (nowszy runner, 4 zrzuty stanu), canEnd=false, brak modala i bitwy; w logu [Victory] PRZEGRANA (tura N) gracz=0 rodzaj=przegrana.
- Zatrzymanie nie jest zawieszeniem końca tury. Błąd gry NIE potwierdzony. Przyczyna utraty miasta (bitwa auto / AI / barbarzyńcy) NIE ZMIERZONO (brak logu bitew).
- Bramki: npx tsc --noEmit rc=0. Logic (213) i ai-test (297/0) NIE URUCHOMIONO: brak zmian w kodzie gry; w gra/package.json nie ma skryptów o tych nazwach.
- Niższy poziom kosztów (porównanie z dispatchu): NIE ZMIERZONO, zgodnie z regułą testowania na poziomie maksymalnym.
- vite build: NIE uruchomiono; runner używa bundla esbuild do katalogu poza repo. npm run build/dev w gra/: NIE uruchomiono.
BLOKADY: brak blokad procesu. Chromium nie padł w żadnym przebiegu. Harness: runner klasyfikuje gameOver jako cannot-end (defekt klasyfikacji, nie zawieszenia).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o dwóch tematach poza tym zakresem (patrz UWAGI-DLA-ORKIESTRATORA): (1) poprawka runnera rozpoznająca gameOver jako wynik przebiegu, (2) sprawdzenie zapisu/odczytu po przegranej (miasta=1 po wczytaniu). Pytania o balans obrony gracza przy maksimum: tylko przez ABC.
DEPLOY/PUSH: NIE WYKONANO

SHA: ustalany przy commicie (git rev-parse HEAD po commicie).

UWAGI-DLA-ORKIESTRATORA:
1. Trzy z pięciu zatrzymań dotyczą przegranej w turach 8–12 przy pasywnym graczu (runner nie buduje obrony, bitwy zamyka w trybie auto). Jeżeli orkiestrator chce mieć 20-turowe pomiary przy maksimum, runner powinien traktować gameOver jako wynik, a nie błąd.
2. Anomalia do osobnego sprawdzenia: po przegranej w d3-4242-r1 round-trip zapisu (persistSaveToSlot + loadGameFromSlot) zwraca `[Diag:load] OK tura=9 miasta=1`, mimo że snapshot przed zapisem ma `owners=[]`. Może to być artefakt haka, może błąd zapisu/odczytu po porażce. NIE ZBADANO.
3. Zapis w scratchpadzie (poza repo), zgodnie z zasadą. Dispatch wskazywał /tmp; użyto katalogu scratchpad sesji. Tymczasowe logi tsc w /tmp/claude-0/endstall-tsc.log (do usunięcia przy sprzątaniu).
4. node_modules w gra/ (ignorowany przez git, npm ci --ignore-scripts) zostaje do sprzątania worktree.
