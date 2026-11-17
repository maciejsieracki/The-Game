STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko narzędzie pomiarowe i dowody; gra/src NIE zmieniony — 0 linii diffu względem 3b1fa6d9a)
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1 (#435), obrona Operatora po zarzutach Evaluatora (20-evaluator-claude.md, 364482fde)
GOAL: narzędzie gra/tools/save-load-old-save-compat-live.cjs (jedno polecenie, exit 1 przy FAIL) sprawdza w Chromium zgodność wsteczną zapisu sprzed FAL 760–762; wyniki i FAIL-e z liczbami z surowego wyjścia.
BAZA: 3b1fa6d9a (kandydat r2); gra/src identyczne z 95907fc52 / 459354a12.

ZMIANY-COMMIT:
- gra/tools/save-load-old-save-compat-live.cjs (zmiany: A0 asercja „zapis wejściowy jest STARY”; A5 dziennik „Skąd zapasy” po wczytaniu i po tickach przez __ledgerRealPathDebug; NZM mapy zamówień tylko gdy puste; poprawka pola tury w wyniku; poprawka tautologii „miasta gracza = metryki zapisu”; usunięty NZM „Skąd zapasy” i NZM „mutacja” (mutacja ma własny skrypt)).
- dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence/make-nocity-save.cjs (nowy: SYMULACJA scenariusza 0 miast przez usunięcie miast gracza z zapisu).
- evidence/mutant-run.sh (nowy: powtarzalna mutacja Array.isArray) + mutant-new-run.txt, mutant-result.json.
- evidence/new-run.txt, new-result.json (przebieg główny, zapis STAREGO kodu), old-run.txt, old-result.json, old-save-metrics.json, save-old-6t.json.gz (zapis wejściowy, do odtworzenia).
- evidence/nocity-new-run.txt, nocity-result.json (scenariusz 0 miast).
- 10-operator-claude.md i 20-evaluator-claude.md NIE zmienione.
- Nie zmieniono: gra/src, gra/data, WERSJE.md, manifest, gra-robocza/, rust-port/. Brak `npm run build/dev` w gra/; bundle zbudowany vite POZA repo (scratchpad/dist-new, 17,79 s, index.html 14 803 548 B = rozmiar bundla bieżącego kodu z r2). Brak `git add -A`.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. PRZYJMUJĘ (poprawka + dowód). Dodana asercja A0 w fazie new: brak 5 pól meta FAL 760–761 w zapisie wejściowym. Wynik: `PASS NEW zapis wejsciowy jest STARY ... :: {"obecne":[],"resourceLedgerHistoryWZapisie":6}` (new-run.txt). Dla scenariusza 0 miast: ten sam PASS (nocity-new-run.txt).
2. PRZYJMUJĘ (zarzut słuszny: hak istnieje, NZM z r2 był uzasadniony błędnie). Dodane A5: `PASS NEW dziennik „Skad zapasy" po wczytaniu = wpisy zapisu :: {"got":6,"want":6}` i `PASS NEW dziennik „Skad zapasy" rosnie po tickach (lub limit) :: {"przed":6,"po":9,"limit":10}`. Hak: window.__ledgerRealPathDebug (main.ts ok. 31617–31729: savedHistory, historyForSave, historyN). Pamięć dziennika po wczytaniu: 6 (pamiecWszyscy w INFO).
3. PRZYJMUJĘ (zmierzone). Scenariusz 0 miast przeprowadzony na zapisie STAREGO kodu (save-old-6t.json.gz): z zapisu usunięto miasto gracza (ownerId 0; `make-nocity-save.cjs`: miasta 42 → 41, flaga playerEverOwnedCityByOwner nieobecna). SYMULACJA: w grze nie wykonano utraty miast, zmieniono JSON. WYNIK NA BIEŻĄCYM KODZIE — FAIL=3:
   - `FAIL NEW tura 1 zatrzymana: cannot-end :: {"stop":"cannot-end","tura":7,...}`
   - `FAIL NEW „Zakoncz ture" dziala 3 razy :: [7,null]`
   - `FAIL NEW dziennik „Skad zapasy" rosnie po tickach :: {"przed":6,"po":6,"limit":10}` (konsekwencja: brak tur)
   - INFO po wczytaniu: `myCities 0, awaiting true`. Przyczyna z kodu: main.ts:40685 `canPlayerInitiateEndTurn()` zwraca false przy `isAwaitingFirstPlayerCity()` (main.ts:40692 log „[EndTurn] blocked: awaitingFirstPlayerCity”). Flaga nie jest odtwarzana, bo stary zapis jej nie ma, a heurystyka z unii nie daje podstaw przy 0 miastach. To jest defekt #433 w tej wersji kodu. Kandydat FAIL: patrz UWAGI-DLA-ORKIESTRATORA. Nie naprawiałem (poza allowlistą: gra/src).
4. PRZYJMUJĘ (mutacja powtarzalna z repo). `evidence/mutant-run.sh`: kopia bundla, sed `if(Array.isArray(ke))for` → `if(true)for` (dokładnie 1 wystąpienie, inaczej skrypt przerywa), potem narzędzie --phase new na zapisie STAREGO kodu. Wynik (mutant-new-run.txt): EXIT=1, `WYNIK: FAIL=2`: `FAIL NEW ekonomia gracza ... [{"k":"spichlerz","zapis":203,"wczytane":0}]` oraz `FAIL NEW brak pageerror ... CONSOLE [Diag:load] ke is not iterable`. Zgodne z zarzutem (spichlerz 0 vs 203; „ke is not iterable”). Usunięty ręczny NZM z narzędzia.
5. PRZYJMUJĘ jako ograniczenie (NIE ZMIERZONO, bez zmiany kodu). Ścieżka DOM klik „Wczytaj grę” nie została zmierzona. Dowód różnicy: onLoad w menu wywołuje `loadGameFromSlot(slotId, fromInGamePause)` (main.ts:27492), a hak `loadSlot` wywołuje `loadGameFromSlot(slot, false)` (main.ts:30586 i pokrewne). Ta sama funkcja, ale inny argument, gdy wczytanie idzie z pauzy w grze. Zostaje NZM w narzędziu (komentarz nagłówka).
6. PRZYJMUJĘ (poprawka). `turn: obj.tura ?? obj.turn ?? null`. W logu zapisu: `OLD zapis zapisany do pliku ... "turn":7` (old-run.txt). Uwaga: w `old-result.json` klucz `turn` pochodzi z tablicy wyników, nie z zapisu; pola tury zapisu nie mylić z tym.
7. PRZYJMUJĘ jako ograniczenie zmierzone w narzędziu. Mapy orderMultByCity / orderGrowthMultByCity / orderValueByCity są w tym zapisie puste (`[]`/`{}`), co jest sprawdzane w kodzie narzędzia (EMPTY_MAPS); dryf przy niepustych mapach = NIE ZMIERZONO (wynik: `NIE_ZMIERZONO NEW dryf ekonomii przy niepustych mapach zamowien :: w tym zapisie puste: ...`). Nie wprowadzam nowej gry z zleceniami (poza zakresem r2).

Dodatkowo (znalezisko własne przy powtórnym przebiegu): asercja „miasta gracza = metryki zapisu” była tautologią, gdy brak pliku metryk (PASS z want null). Naprawiona: wykonuje się tylko przy istniejących metrykach. Wpływ na wyniki r2: brak (dla zapisu z metrykami wynik identyczny).

TESTY (surowe wyjścia, pliki w evidence/):
- `node --check gra/tools/save-load-old-save-compat-live.cjs` → OK; `git diff --check` → czysto.
- Faza old (bundle f6b09c76b, 6 tur, seed 4242): `WYNIK: brak FAIL` (old-run.txt). Zapis: `turn 7`, 42 miasta, 61 jednostek; eko gracza w chwili zapisu: skarbiec 188, spichlerz 203, miasta 1, obywatele 1, rekruci 2000, wojsko 1, cywilne 1, utrzymanie budynków 0, garnizon 4. Uwaga: old-run.txt zawiera pole `noFound:false` z wersji narzędzia z przejściową opcją --no-found (domyślna ścieżka identyczna; opcja usunięta).
- Faza new na zapisie STAREGO kodu (new-run.txt): `WYNIK: brak FAIL`. PASS: A0 (brak 5 pól meta; resourceLedgerHistory 6 wpisów), dziennik po wczytaniu 6=6, miasta 42=42, jednostki 61=61, miasta gracza 1=1, ekonomia gracza po wczytaniu = metryki zapisu (pusta lista różnic), isAwaitingFirstPlayerCity()=false, „Zakończ turę” 3 razy [7,8,9,10], dziennik po tickach 6→9 (limit 10), brak pageerror i błędów konsoli. NIE ZMIERZONO: mapy zamówień niepuste.
- Scenariusz 0 miast (nocity-new-run.txt): `WYNIK: FAIL=3` — opisane w punkcie 3 wyżej.
- Mutant (mutant-new-run.txt): `WYNIK: FAIL=2` — punkt 4.
- tsc i 5 testów referencyjnych NIE uruchomiono: zmiana obejmuje tylko gra/tools/*.cjs i runs/**, gra/src nie zmieniony (diff 0). Uczciwie: bramki TS nie były ponownie mierzone w tej rundzie.

BLOKADY: brak blokad wykonania narzędzia. Defekt 0 miast (punkt 3) to FAIL do rozstrzygnięcia przez orkiestratora (nowy temat R-WEB-*), nie blokada tego tematu.

RUNDY: 2/5 (Operator obrona, Haiku 5.5). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (r2, 364482fde). Ta odpowiedź: runda obrony, nie nowy przebieg Evaluatora.

NASTĘPNY KROK: Evaluator (runda 3) weryfikuje commit obrony: asercje A0/A5, make-nocity-save.cjs + nocity-result.json (FAIL=3), mutant-run.sh + mutant-result.json (FAIL=2), poprawkę tautologii i wpis w NZM. Orkiestrator decyduje o kandydacie R-WEB dla defektu 0 miast (punkt 3).

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- KANDYDAT R-WEB (FAIL, do osobnego tematu, NIE w tym temacie): „stary zapis gracza z 0 miast blokuje „Zakończ turę” po wczytaniu”. Repro: `node dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence/make-nocity-save.cjs <save-old-6t.json> <save-old-nocity.json>` (zapis rozpakować: `gunzip -c evidence/save-old-6t.json.gz > ...`), potem `node gra/tools/save-load-old-save-compat-live.cjs --phase new --new-dist <bundle> --save-in <save-old-nocity.json>` → FAIL=3. Miejsce: gra/src/main.ts:40685–40692 (canPlayerInitiateEndTurn → isAwaitingFirstPlayerCity), odtwarzanie flagi playerEverOwnedCityByOwner (FALA 761, heurystyka z unii). Zakres naprawy do decyzji orkiestratora (pytanie ABC: czy gracz bez miast po wczytaniu ma mieć „Zakończ turę” czynne, czy stan oczekiwania na stolicę jest zamierzony?).
- Hak __ledgerRealPathDebug użyty w A5 działa tylko z ?civTest=1 (narzędzie tak otwiera stronę).
- Mutant i bundle były budowane w scratchpad (`dist-old`, `dist-new`); po zakończeniu usunięto symlink gra/node_modules (wskazywał na node_modules innego worktree) i katalogi bundli. Worktree nie sprzątany (robi orkiestrator).
- Nie zakładano sesji, zadań, harmonogramów ani webhooków (zakaz z dispatchu).
