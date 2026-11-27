STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1
GOAL: ustalić liczbami, ile testów live blokuje ekran powitalny / bramka „Zakończ turę”, i naprawić je wspólnym helperem. WYNIK: w próbce 26 testów (25 z kliknięciem w koniec tury + test bramki) ekran powitalny nie blokował żadnego; nie było czego naprawiać. Dokument wyników: dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md.
ZMIANY/COMMIT: allowlista — tylko dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md oraz ten raport. Zero zmian w gra/src, gra/data i gra/tools (_live-ready.cjs i *-test.cjs bez zmian). SHA: czubek brancha operatora (podany w odpowiedzi).
TESTY: pomiar przed (baza 6319eaf66, build vite poza repo, testy bez zmian):
  PASS 3 (build-panel rc0; diplo-forced-peace-pending rc0; diplo-peace-auto-stale PASS=15 FAIL=0)
  FAIL z powodem ekran/bramka: 0
  FAIL inny powod: 12 (end-turn-block-event; end-turn-gameplay-runtime [brak WORLD_GEN_REQUEST_FILE]; end-turn-input-stability; era-change-toast; forced-war x3 [endTurn nie ustabilizowal sie]; general-quick-follow [asercja]; improvement-build [ENOENT konfiguracji]; perf-large-empire [kotwica]; perf-late-game [straznik builda]; end-turn-gate [2/9 PASS])
  Brak startu kreatora (.civ-newgame .start): 4 (hotseat x4)
  TIMEOUT 280 s: 7 (defeat-screen, diplo-truce, hotseat-etap6a, live-nns-gate-smoke, sidepanel-diplo, war-era-counter, war-rules-multiwar)
  Crash Chromium (SIGSEGV): 0 w tej probce
  Logi: „civ-welcome” w 0 z 26 logow; brak „intercepts pointer events”.
  Po naprawie: NIE DOTYCZY (brak naprawy).
  Mutacja helpera (bez dismissWelcome -> czerwony test): NIE WYKONANO — brak testu zablokowanego ekranem.
BLOKADY: brak blokad procesu. Luki: pomiar obejmuje 26 testow z ok. 369 kandydatow live (pozostale NIE ZMIERZONO); ekran powitalny pojawia sie przy pierwszym kontakcie — tury po kontakcie NIE ZMIERZONO; poziom maksymalny ustawien NIE ZMIERZONO (testy nie wystawiaja wspolnego suwaka; domyslne seedy 11/4242).
RUNDY: 1/5
NASTEPNY KROK: orkiestrator decyduje o osobnych tematach: KANDYDAT-1 (endTurn nie stabilizuje sie w 60 s, headless); KANDYDAT-2 (selektor .civ-newgame .start w hotseat); KANDYDAT-3 (end-turn-gate: netMax=0 na starcie — stan testu czy bramka?); KANDYDAT-4 (7 TIMEOUT bez przyczyny w logu). Pytanie do wlasciciela nie jest potrzebne (decyzje inzynierskie/testowe).
UWAGI-DLA-ORKIESTRATORA: (1) dispatch prosil build w /tmp/<unikalny>; uzyto katalogu scratchpad i usunieto po pomiarze. (2) W worktree zainstalowano zaleznosci gra/ (npm ci --ignore-scripts); gra/node_modules usuniete po pracy. (3) Dwa polecenia przeniesione przez harness w tlo; wynik zebrano z plikow .res, nie z tla.
DEPLOY/PUSH: NIE WYKONANO
