STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SEADIST-Q1
GOAL: cluster-start-test 0 fail bez zmniejszenia liczby asercji; rozproszenie stolic bez pogorszenia.

WERDYKTY ZARZUTOW (0 x NAPRAW):
1. Pomiar nieodtwarzalny - ODDAL. Skrypt gra/tools/capital-seadist-measure.cjs + gate-seadist-measure.txt dodane; FC uruchomil samodzielnie: ten sam wynik (land runtime 5562, seaDist>=10: 659, sepGate=23, pakunek max 6 przy sep 22/23/25, 7 przy 20, 9 przy 15). Roznica 615 vs 659 w raporcie Operatora: obowiazuje 659 (zmierzone dwukrotnie); nie zmienia wniosku.
2. Asercja luzna / brak testu negatywnego - ODDAL. Dodana kontrola negatywna (relaxed tylko ze stolica gracza => >0 slotow). Test szuka slotu po calej mapie, runtime tylko w regionie, wiec test jest ostrzejszy niz runtime. Kwestia produktowa "8 typow na Standard, srodladowo miesci sie 6" - poza zakresem, do ABC orkiestratora (nie DO DECYZJI w tym temacie; asercja i progi runtime niezmienione).
3. Brak niezaleznego uruchomienia - ODDAL. FC: tsc --noEmit EXIT=0 (npm ci --ignore-scripts, node_modules usuniety), capital-seadist-measure odtworzony. Pelny cluster-start-test (~25 min) NIE uruchomiony przez FC; opieram sie na logu gate-cluster-start.txt (484 passed, 0 failed, EXIT=0, 3 linie INFO wolnych slotow=0), capital-spacing-prop ALL PASS, parity polar 30/30 - logi spojne ze soba i z diffem.
4. Baza/sepGate-1 - ODDAL. Baza obrony = main 943c6afba (po slodkiej wodzie), margines -1 usuniety, sepGate liczony jak runtime (clusters.ts:3517-3529) = 23. Linia 787 (=== 25 bez argumentow) zamierzona.
5. Chromium / capital-spacing-measure - ODDAL jako BLOKADA/NIE_ZMIERZONO: zmiana wylacznie w .cjs, gra/src i gra/data bez zmian (git diff --stat 943c6afba..HEAD -- gra/src gra/data puste).

ALLOWLISTA: OK. Diff 943c6afba..08fb5a95a: gra/tools/cluster-start-test.cjs, gra/tools/capital-seadist-measure.cjs (dozwolone: capital-seadist-*.cjs), katalog runu. git diff --check czysty. Brak push/deploy.

TESTY: wg logow gate-*.txt (484/0, prop ALL PASS, parity 30/30, tsc EXIT=0 - tsc potwierdzone samodzielnie).
BLOKADY: Chromium (zmiana tylko testowa); pelny cluster-start-test niezalezny NIE_ZMIERZONO przez FC.
RUNDY: FC 1/5 (po obronie r1)
SHA DO INTEGRACJI: 08fb5a95a (gałąź worktree-wf_a851ba34-9e9-3, baza 943c6afba = aktualny main); + commit z tym raportem na gałęzi -4.
KOLEJNOSC: 08fb5a95a jest oparty na main 943c6afba; origin/rust-port/parity-v2 nie dotyka gra/tools - integrowac niezaleznie, dowolna kolejnosc wzgledem parity-v2 (cherry-pick/merge; brak kolizji plikow). Po integracji na main puscic cluster-start-test ponownie.
NASTEPNY KROK: integracja orkiestratora; ABC o liczbie typow stolic srodladowych na Standard.
DEPLOY/PUSH: NIE WYKONANO
