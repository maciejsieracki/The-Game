STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1
GOAL: Niezależny werdykt końcowy dla kandydata e5f13068c66138a842f473572ca26677fc788027 (baza 6ff29f840de7ef17b5e01b9b55c4638b8588d145): 12 testów live przepiętych na helper closeCivWelcome, zero zmian w kodzie gry.
ZMIERZONE GRANICE WERDYKTU: kandydat jest bezpieczny do integracji (zmiany addytywne, bramki zielone), ale NIE dowodzi poprawy żadnego testu. Cel zadania #108 (ile z ~102 testów blokuje ekran powitalny, tabela >=20 testów, mutacja czerwono-zielona na realnym teście, poziom maksymalny) NIE jest osiągnięty i #108 ma zostać otwarte.
ZMIANY/COMMIT: kandydat e5f13068c = 6ff29f840 + jeden plik raportu obrony r3 (git diff --stat: 1 file, 35 insertions). Łącznie 6319eaf66..e5f13068c: 12 testów gra/tools/*-live-test.cjs (po 2 linie: import + `await closeCivWelcome(page);`), dokument TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md, skrypt migracyjny dyspozycje/analizy/migrate-live-welcome-q1.cjs, artefakty runs/ (raporty, logi, sondy). gra/src i gra/data: 0 plików. gra/tools/_live-ready.cjs: bez zmian. `git diff --check`: czysto. Wszystko w allowliście. `git merge-base --is-ancestor 6ff29f840 e5f13068c`: tak.
TESTY (własne, surowe wyjście, node_modules z `npm ci`, worktree detached na e5f13068c):
- tsc --noEmit: rc=0, 0 błędów.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: 21/21.
- combat-test: 6/6.
- forced-war-player-target-live-test (test przepięty, własny pomiar przed/po, seed domyślny testu, ?playtest=mapa, ustawienia wbudowane testu, 280 s limit): kandydat rc=1 po 142 s, `fast-forward: endTurn #1 nie ustabilizował się` (A2, po 3 OK w A); baza 6319eaf66 (plik cofnięty do wersji sprzed migracji) rc=1, identyczny błąd w tym samym miejscu. Wynik przed = po. Pliki przywrócone do stanu kandydata, node_modules i dist testu usunięte.
- Poziom maksymalny: NIE ZMIERZONO. Testy ?playtest=mapa używają ustawień wbudowanych, ich zmiana wymaga haka w gra/src (poza zakresem). Uznaję za maksimum wg dispatchu: Dyplomacja Trudna, Koszty jednostek Wysoki x4, Kultura i religia trudny, największa mapa dostępna w teście; żaden z pomiarów go nie obejmuje.
- Pozostałe 11 przepiętych testów przed/po: NIE ZMIERZONO przeze mnie (łącznie ze zmierzonymi wcześniej: end-turn-gate 2/9 = 2/9, era-change-toast 11/9 = 11/9, forced-war-player-target rc=1 = rc=1 — wszystkie bez zmiany wyniku).
OCENA ZARZUTÓW EVALUATORA (bez etykiet ról):
1. Brak dowodu zmiany wyniku — ZASADNY i potwierdzony moim pomiarem (3 testy, 3 razy przed = po). ODDAL (uwaga): helper usuwa realną blokadę kliknięć (sonda r1/r2: przechwycenie przez #civ-welcome-screen-root, 9/9), ale testy padają wcześniej z innego powodu (bramka tury/żywność/skarbiec w ?playtest=mapa). Zgodne z pkt 3 dodatku r3 — „nie szukaj na siłę”.
2. Brak mutacji na realnym teście — ZASADNY. Nie do wykonania na żadnym zmierzonym teście, bo z helperem nie jest zielony. Zastępnik (sonda) jest słabszym dowodem; zapisane jako luka. ODDAL.
3. Pomiar 2–3 z 12 — ZASADNY; ja dołożyłem 1 (3 z 12 łącznie). Pozostałe 9 NIE ZMIERZONO. ODDAL: dopisane jako dług, bez wpływu na bezpieczeństwo integracji (zmiana 2 linie na test, `node --check` OK, brak zmiany asercji).
4. sidepanel-diplo: przed rc=1, po timeout 280 s bez logu — ZASADNY. Regresja czasowa NIE WYKLUCZONA (closeCivWelcome dodaje jedno oczekiwanie; mało prawdopodobne, ale niezmierzone). Uwaga dla orkiestratora: ponowić pomiar tego testu przy cichej maszynie przed uznaniem za zielony.
5. Poziom maksymalny nie zmierzony — ZASADNY, powód: brak haka ustawień w ?playtest=mapa. ODDAL (osobny temat).
6. Brak inwentaryzacji/tabeli >=20 — ZASADNY. Wymóg #108 niespełniony. ODDAL: temat pozostaje otwarty.
7. gateInfo/canEnd tylko dla end-turn-gate — ZASADNY. Dla forced-war-player-target przyczyna z logu: endTurn #1 nie stabilizuje się w ?playtest=mapa (bramka tury, nie ekran); pełny odczyt gateInfo NIE ZMIERZONO. ODDAL.
8. end-turn-input-stability nie przepięty — ZASADNY formalnie; uzasadnienie (harness DOM setContent) wiarygodne, niezmierzone. ODDAL.
9. prepareEndTurnGate niewpięty / brak haka — CZĘŚCIOWO ODRZUCAM obronę-odrzucenie: wpięty w live-nns-gate-smoke-test.cjs (zgoda z obroną), ale w 12 przepiętych testach nie; hak __nnsMeasureDebug tylko pod ?civTest=1. Naprawa wymaga gra/src — poza tematem. Kandydat BŁĄD-GRY/scenariusza ma minimalne odtworzenie tylko dla end-turn-gate (seed 4242/11, Mały, a@t1 „netMax=0”; b@t1 brak blokady); dla ?playtest=mapa: forced-war-player-target, seed domyślny testu, endTurn #1 nie stabilizuje się.
BLOKADY: brak blokad technicznych integracji. Nierozstrzygnięte (nie blokują integracji, blokują zamknięcie #108): 9 testów bez pomiaru przed/po, brak mutacji na realnym teście, brak poziomu maksymalnego, brak inwentaryzacji 102 testów, sidepanel-diplo bez werdyktu.
RUNDY: 3/5 (kandydat po obronie r3; FC r3).
NASTĘPNY KROK: (a) integracja orkiestratora jako PASS-WITH-NOTES (jeśli orkiestrator uzna wartością samą naprawę kliknięć; ryzyko minimalne) albo odrzucenie kandydata, jeśli polityka wymaga dowodu zmiany wyniku — decyzja orkiestratora; (b) #108 NIE zamykać; osobny temat R-WEB-*: hak setPlayerGranary/setPlayerTreasury (lub ustawień) w ?playtest=mapa albo przeniesienie testów na ?civTest=1 — wtedy dopiero mutacja czerwono-zielona i pomiar na maksimum; (c) pomiar 9 pozostałych testów + sidepanel-diplo na cichej maszynie.
UWAGI-DLA-ORKIESTRATORA: wzorzec *.log w .gitignore utrudnia commit logów testów live (używać .txt). Surowe wyjścia moich pomiarów forced-war-player-target były w scratchpadzie (nie w repo, zgodnie z poleceniem commita tylko raportu); liczby przepisane powyżej z surowego wyjścia.
DEPLOY/PUSH: NIE WYKONANO
