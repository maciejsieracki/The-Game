STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiary, priorytet 2)
TEMAT: R-WEB-VERIFY-LIVE-3-Q1 (tag VLIVE3)
GOAL: trzy pomiary NIE ZMIERZONO na żywej grze na poziomie maksymalnym. Wynik: 0 z 3 zmierzonych w pełni. Pozycja 1 (Targowisko) i 2 (cesja) bez przebiegu na żywo. Pozycja 3 (FORTRING) częściowo, do tury 34 z 60, na ustawieniach domyślnych, nie maksymalnych.
ZMIANY-COMMIT: allowlista zachowana. Zmieniono tylko `dyspozycje/analizy/VERIFY-LIVE-3-2026-11-27.md` oraz `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/**` (raport i dane). Brak zmian w `gra/src`, `gra/tools`, `gra/data`. Lokalny `gra/node_modules` (npm ci --ignore-scripts, ignorowany przez git) i bundle w `/tmp/vlive3-dist` (usunięty po pracy).
Baza: `git rev-parse HEAD` na starcie = 3608af1ce2aae306c6fa2f77413f8817d2c7bed0 (origin/main). Commit z raportem: patrz sekcja SHA poniżej.
TESTY:
- Build live (poza repo): `node ./node_modules/vite/bin/vite.js build --outDir /tmp/vlive3-dist --emptyOutDir` = built in 29.88s (rc 0). Nie użyto `npm run build`/`dev`.
- Stała targowiska z danych: `data/econ-params.json` `targowisko_zywnosc_na_podatek_kurs` = easy 0,2 / normal 0,2 / hard 0,2.
- FORTRING ON, seed 4242, runner `gra/tools/fortring-measure.cjs --variant on --turns 60`: 7 wywołań zakończonych rc=0 (kolejne porcje do tury 6, 9, 12, 16, 21, 27, 34), 4 wywołania rc=1 (Chromium: `Target page, context or browser has been closed`), każde ponowione ze slotu. Wynik: forts=0 w każdym z 33 wierszy tur (t2–t34). Round-trip: `roundTrip: null`, nie wykonano.
- Bramki (tsc, logic, tech-tree, research, unit-replace, combat, ai-test): NIE URUCHOMIONO. Powód: brak zmian w kodzie gry i testach; dispatch wiąże bramki ze zmianą kodu.
BLOKADY:
1. Targowisko na żywo: brak haka civTest wywołującego realną akcję Żywność→Podatek w jednej turze. Hak `adminSetup` może postawić Targowisko, ale akcji nie uruchamia. Nie podjęto.
2. Cesja >1 miasta na żywo: brak haka do negocjowanego pokoju z cesją. Test `peace-city-cession-negotiated-test.cjs` jest statyczny. Nie podjęto.
3. FORTRING: (a) start domyślny, nie maksymalny — `startGame({seed})` ustawia Normalny i koszty jednostek `niski`; (b) brak haka wymuszającego fort (`fortCount` tylko odczyt), więc 0 fortów i wpływ ON vs OFF nie do zmierzenia; (c) 4 zamknięcia Chromium, retry ze slotu; (d) wariant OFF i round-trip nie wykonane.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje, czy zlecić: (1) runner FORTRING z ustawieniami maksymalnymi i hakiem wymuszenia fortu, (2) hak civTest dla akcji Żywność→Podatek, (3) hak lub skrypt negocjacji pokoju z cesją. Każdy jako osobny temat.
UWAGI-DLA-ORKIESTRATORA:
- Obserwacja: 0 fortów przez 34 tury na seedzie 4242 przy ustawieniach domyślnych. Nie potwierdzony błąd gry. Do sprawdzenia w osobnym temacie, czy fort może powstać w tym ustawieniu.
- Dane częściowe FORTRING: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/fortring-on-seed4242.rows.jsonl` i `.state.json`. Pełny bieg w scratchpadzie (poza repo), nie kopiowany.
- Nie wykonano żadnych spawn_task, create_session, create_trigger, send_later ani run_in_background.
DEPLOY/PUSH: NIE WYKONANO

SHA: patrz wynik StructuredOutput (commit z tym raportem i dokumentem).
