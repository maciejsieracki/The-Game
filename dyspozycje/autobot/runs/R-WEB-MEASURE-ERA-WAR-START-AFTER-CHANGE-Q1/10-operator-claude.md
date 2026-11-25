STATUS: BLOCK
DOMAIN: GAME (pomiar; zero zmian gry)
TEMAT: R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1
GOAL: zmierzyć w pełnej grze po FALACH 906 i 908 start, czas trwania i koniec wojen epoki (Brąz/Żelazo), seed 4242 i 7, do tury 120; porównać z regułami 906/908.
ZMIANY/COMMIT: tylko ten raport. Zero zmian w gra/src, gra/data, gra/tools. Dokument dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md NIE został utworzony.
BAZA: origin/main 069de0d41f8fee134579ec286028ede02cb9e002 (worktree HEAD = ta sama baza).
BUNDLE: zbudowany poza repo (kopia gra/ bez node_modules, prepare ai-city-live-measure.cjs, hook ai-war-weariness-live-audit-hook.cjs, npm ci, vite build --outDir poza repo). Patche potwierdzone grep-em: __wwDump 1, __aiCityCountDebug 1. Build: built in 17.40s, index.html 15 019,85 kB.
TESTY:
- Pomiar pełnej gry: runner gra/tools/war-duration-measure.cjs (--pw /opt/node-tools, seed 4242 i 7, --turns 120), dwa procesy w tle (setsid nohup timeout 9000). Stan przy zakończeniu: 0 rekordów w war-kontynenty-4242.jsonl i war-kontynenty-7.jsonl; procesy Node i Chromium żyją, CPU ok. 1% (faza startu świata), brak ERROR/DONE. Wynik: NIE ZMIERZONO.
- Analiza wojen (summarize), tabela oczekiwane vs zmierzone: NIE ZMIERZONO (brak danych).
- tsc / logic / ai-test: nie uruchamiano (brak zmian kodu).
BLOKADY:
1. Czas: pomiar 120 tur x 2 ziarna to ok. 70-90 min pracy Chromium na ziarno. W tej sesji oczekiwanie (Monitor, sleep) nie dało realnego postępu, a foreground sleep jest blokowany. Biegi nie doszły do pierwszej zarejestrowanej tury.
2. Procesy uruchomione poza repo (scratchpad/run/out). Do domknięcia potrzebny kolejny odcinek (wznowienie przez --stop-at z tym samym --out lub ponowny start) oraz zapis danych do dane/ z SHA256SUMS.
3. Ograniczenie metody (nagłówek runnera): wznowienia reseedują PRNG, więc odcinki nie są bit-identyczne z biegiem ciągłym.
RUNDY: 1/5 (BLOCK z powodu czasu i startu biegu, nie z powodu błędu gry).
NASTĘPNY KROK: orkiestrator: (a) kolejna runda Operatora "kontynuuj pomiar" (wznowienie, dane, dokument analizy), albo (b) zaakceptować zakres jako NIE ZMIERZONO. Dane częściowe: scratchpad/run/out (poza repo).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: biegi w tle działają do timeout 9000 s; nie kończyć ich bez sprawdzenia.
