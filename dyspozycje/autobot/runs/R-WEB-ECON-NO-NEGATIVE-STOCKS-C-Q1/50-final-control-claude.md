# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — Final Control (runda 3/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1
GOAL: od tury 11 skarbiec i spichlerz AI >= 0 po każdej turze, równoważenie przed końcem tury, bez eliminacji cywilizacji.

ZMIANY-COMMIT: kandydat do integracji = cad44581aa0e8a8a3cdce27ccf030f9f3f719127 (kod = 233f2c4cb; cad44581a dodaje tylko raport obrony). Jest potomkiem origin/main f9d8948ba (`git merge-base --is-ancestor origin/main cad44581a` = tak) i bazy 7ba58f0ec. Diff vs origin/main: no-negative-stocks.ts (+150), main.ts (+450/-2), 4 testy/runner w gra/tools, raporty runu. ai.ts niezmieniony. Ten raport = osobny commit (tylko ten plik).

TESTY (surowe wyjścia, własne uruchomienie na cad44581a):
- tsc --noEmit: rc=0.
- no-negative-stocks-test 25/0; projection 49/0; ai 8/0; c2 43/0; endturn 19/0.
- 5 bramek referencyjnych + moc: logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0. Wszystkie zielone na kandydacie, więc porównanie z bazą nie było potrzebne (brak czerwonych).
- c3-turn-test (własny build vite poza repo, Chromium): 16 passed, 0 failed (ON: skarbiec 16,2, glod=false; OFF: skarbiec -163, glod=true).
- MUTACJA WŁASNA (zarzut 3): zamiana wywołania nnsAiPreTickBalance w main.ts na no-op, rebuild, c3-turn-test: 10 passed, 6 failed (ON skarbiec -148, kary deficytu weszły). Zmiana cofnięta, drzewo czyste.
- Pomiar 15x3x150 nie powtarzany (godzina na komórkę); opieram się na pomiar-r3/summary.json (NIE_ZMIERZONO samodzielnie).

WERDYKT PER ZARZUT:
1. DO DECYZJI CZŁOWIEKA (nieblokujące). Kryterium (a) dopuszcza "listę wyjątków z przyczyną". 445/450 to dług odziedziczony z tur wolnych 1–10 (wyjątek zadany przez właściciela); od T31 0 naruszeń w 3 komórkach. 5 "nowych minusów" (<=4 jednostek, głównie państwa-miasta) ma przyczynę "brak dźwigni" zgodną z projektem (obrońców i wodzów nie ruszamy). Realna decyzja produktowa: czy AI ma równoważyć się od tury 1 (opcje A/B/C z raportu operatora, rekomendacja B = parytet z graczem). Nie jest to defekt kodu do naprawy w tej rundzie.
2. ODDAL. Ziarno 22 zawiesza generację świata (poza zakresem); 44 w zastępstwie; interpretacja civTypesCount=15 jawna w raporcie.
3. ODDAL. Dowód uzupełniony realną mutacją (obrona oraz moja niezależna, wyżej). Mutacja flagą OFF rzetelna.
4. ODDAL. Hak __nnsMeasureDebug jest bramkowany ?civTest=1 (w produkcji brak powierzchni), 47 odwołań civTest w main.ts to precedens; zmiana w pętli tury AI zgodna z allowlistą. Zgłoszone jawnie w raporcie operatora.
5. ODDAL. Niedeterminizm to znane #373; wniosek dotyczy własności ">=0".
6. ODDAL. Pole wstrzymania? w NnsAiLeverInput jest testowane (ai-test) i nieszkodliwe; produkcja nie ma atrap. Kosmetyka: urwana linia separatora komentarza przed nagłówkiem B w no-negative-stocks.ts (bez wpływu).
7. ODDAL. 375–395 ms/turę łącznie dla wszystkich AI (~1,4% czasu tury headless) akceptowalne; po T90 NIE_ZMIERZONO.

BLOKADY: brak. Decyzja ABC właściciela (dług tur 1–10) może być osobnym tematem po integracji.
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora cad44581a (FF/merge-tree), rejestry, ABC właściciela o AI od tury 1; deploy tylko po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: (1) ABC: AI równoważy od tury 1? (2) ziarno 22 zawiesza generację — osobny temat R-WEB-*; (3) czas tury >T90 (PERF-LATE-GAME); (4) odrodzenie gracza po wczytaniu zapisu: playerEverOwnedCityByOwner nie jest w zapisie.
