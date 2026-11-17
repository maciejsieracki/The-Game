STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko narzedzie pomiarowe i dowody; gra/src bez zmian)
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1 (#435)
GOAL: narzedzie gra/tools/save-load-old-save-compat-live.cjs sprawdza w Chromium zgodnosc wsteczna starego zapisu (sprzed FAL 760-762), exit 1 przy FAIL.
ZMIANY/COMMIT: kandydat 05f7197c7881656539c6e2a7c41a98dc80b9f7da; potomek bazy 95907fc52 (merge-base --is-ancestor: TAK). Diff vs baza: 15 plikow, wylacznie gra/tools/save-load-old-save-compat-live.cjs + runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/** (allowlista OK, brak zmian gra/src). git diff --check czysty. git merge-tree z origin/main (ef6e8ea1e) czysty (drzewo ba348102).
TESTY (wlasny przebieg FC, surowe wyjscie):
- npm ci OK; tsc --noEmit: 0 bledow.
- vite build poza repo OK; narzedzie --phase new na zapisie save-old-6t.json: "WYNIK: brak FAIL", exit 0 (A0 PASS: 0 z 5 pol meta, resourceLedgerHistory=6; dziennik 6=6; miasta 42=42; jednostki 61=61; eko gracza = metryki zapisu; isAwaitingFirstPlayerCity=false; Zakoncz ture tury [7,8,9,10]; dziennik 6->9; brak pageerror).
- 5 bramek referencyjnych: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 (wszystkie exit 0; kod gry identyczny z baza).
- Dowody w evidence/ (odczytane): nocity-new-run.txt WYNIK FAIL=3 (symulacja 0 miast: cannot-end), mutant-new-run.txt FAIL=2 ("ke is not iterable"), mutant-run.sh odtwarzalny.
ZARZUTY:
1 (brak asercji "zapis jest stary") - ODDAL: obrona dodala A0; w moim przebiegu A0 PASS.
2 (NZM "Skad zapasy" bledne) - ODDAL: A5 dziennik 6=6, po tickach 6->9; zmierzone.
3 (scenariusz 0 miast) - ODDAL jako pomiar wykonany (SYMULACJA JSON, FAIL=3). Wynik = ograniczenie heurystyki FALI 761 / ewentualnie zamierzony stan oczekiwania na stolice: DO DECYZJI CZLOWIEKA (pytanie ABC), nie wada narzedzia.
4 (mutacja nieodtwarzalna) - ODDAL: mutant-run.sh + mutant-new-run.txt + mutant-result.json w evidence.
5 (klik DOM niezmierzony) - ODDAL: uczciwie NIE_ZMIERZONO (ta sama funkcja loadGameFromSlot).
6 (pole turn null) - ODDAL: naprawione.
7 (waskie pokrycie ekonomii) - ODDAL: uczciwie NIE_ZMIERZONO (mapy zamowien puste w zapisie); granica pokrycia.
Zadne NAPRAW -> brak FAIL.
BLOKADY: brak.
RUNDY: FC 1 (tej roli); temat lacznie 3/5.
UWAGI-DLA-ORKIESTRATORA: (a) stary zapis gracza z 0 miast po wczytaniu blokuje "Zakoncz ture" (main.ts ~40685, canPlayerInitiateEndTurn/isAwaitingFirstPlayerCity) - decyzja ABC czy zamierzone, ewentualnie osobny R-WEB-*; (b) NIE_ZMIERZONO: klik DOM menu Wczytaj, niepuste mapy zamowien.
NASTEPNY KROK: integracja orkiestratora kandydata 05f7197c7 (potomek bazy, merge czysty) + rejestry. Commit raportu nie zmienia kodu.
DEPLOY/PUSH: NIE WYKONANO
