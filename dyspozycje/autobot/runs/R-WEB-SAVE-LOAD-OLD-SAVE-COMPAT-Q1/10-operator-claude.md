STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiar i narzędzie; kod gry NIE zmieniony)
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1 (#435), runda 2/5
GOAL: narzędzie gra/tools/save-load-old-save-compat-live.cjs (jedno polecenie, exit 1 przy FAIL) sprawdzające w Chromium, że zapis sprzed FAL 760–762 wczytuje się na bieżącym kodzie bez błędu i bez dryfu ekonomii.
BAZA: kandydat 95907fc52 (gra/src identyczne z 459354a12; `git merge-tree` z origin/main ef6e8ea1e: czysto, exit 0).

ZMIANY/COMMIT:
- gra/tools/save-load-old-save-compat-live.cjs (przepisane; r1 blokował przez brak ?civTest=1 i zły zapis slotu).
- dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/10-operator-claude.md (ten raport).
- dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence/{old-result.json,new-result.json,old-save-metrics.json,new-run.txt}.
- Nie zmieniono: gra/src, gra/data, WERSJE.md, manifest, gra-robocza/, rust-port/. Brak `npm run build/dev`, brak `git add -A`.

ZBUDOWANE POZA REPO (vite build, scratchpad): bundle starego commita f6b09c76b (FALA 754) 27,14 s, index.html 14 802 227 B; bundle bieżący 95907fc52 28,46 s, index.html 14 803 548 B.

PRZEBIEG (ZMIERZONO):
- Faza old (bundle f6b09c76b, prawdziwy stary kod, bez symulacji): seed 4242, nowa gra, stolica założona, 6 tur (tura 1→7). Bramka NNS obejściem dosypek (bypass tylko w turze 2; tury 3–7 bez blokady). Zapis przez __truceSaveLoadTestDebug.quickSave → IndexedDB thegame-saves/kv/thegame.save.compat-test (1 023 935 znaków). Wynik: PASS wszystkie; brak pageerror.
- Zapis STAREGO kodu nie zawiera pól FAL 760–761 (nnsAiOverrides, orderMultByCity, orderGrowthMultByCity, orderValueByCity, playerEverOwnedCityByOwner: 0 wystąpień) i ma resourceLedgerHistory (1 wystąpienie). Nie była to symulacja.
- Eko gracza w chwili zapisu (tura 7): skarbiec 188, spichlerz 203, miasta 1, obywatele 1, rekruci 2000, wojsko 1, cywile 1, utrzymanie budynków 0, garnizon 4. Świat: 42 miasta, 61 jednostek (dumpState).
- Faza new (bieżący bundle 95907fc52), wczytanie przez __truceSaveLoadTestDebug.loadSlot (ta sama funkcja co „Wczytaj grę", zgodnie z komentarzem hooka): WYNIK brak FAIL.

WYNIKI ASERCJI (ostatni przebieg, gra/tools/…; log: evidence/new-run.txt):
- A1 brak pageerror i błędów konsoli: PASS. Jedyny wpis konsoli (404 favicon.ico z serwera python) odfiltrowany jako środowiskowy, nie błąd gry.
- A2 liczba miast (wszyscy właściciele) po wczytaniu = zapis: PASS (42 = 42). Liczba jednostek: PASS (61 = 61).
- A2e ekonomia gracza po wczytaniu = metryki zapisu (skarbiec, spichlerz, miasta, obywatele, rekruci, wojsko, utrzymanie): PASS, brak różnic.
- A3 isAwaitingFirstPlayerCity()=false przy miastach gracza: PASS (miasta 1, awaiting false).
- A4 „Zakończ turę" 3 razy: PASS, tury 7→8→9→10 (każde kliknięcie +1).

NIE ZMIERZONO:
- Dziennik „Skąd zapasy" pusty po wczytaniu i rosnący po tickach: brak haka odczytu dziennika w UI. Zapis zawiera resourceLedgerHistory, ale nie odczytano go po wczytaniu.
- Scenariusz 0 miast (stary zapis bez flagi playerEverOwnedCityByOwner, „Zakończ turę" przy 0 miastach): nie wygenerowano takiego zapisu. Ten przypadek wymaga osobnego przebiegu i nie jest pokryty.
- Wczytanie przez klik w menu „Wczytaj grę" (ścieżka DOM) NIE ZMIERZONO: użyto loadSlot (ta sama funkcja wg hooka). Zapis trafia do IndexedDB, a nie do autozapisu FSA civ-autosave-N.json z r1.

MUTACJA (wykonana poza narzędziem, na kopii bundla w scratchpad, bez zmian w repo):
- Usunięty guard `if (Array.isArray(savedOrderMult))` w odczycie orderMultByCity (main.ts, deserializacja meta).
- Wynik narzędzia na kopii: FAIL=2 — spichlerz 0 zamiast 203 (dryf ekonomii) oraz pageerror/konsola „ke is not iterable". Narzędzie wykrywa regresję. Wpis NIE ZMIERZONO w evidence opisuje tę mutację jako ręczną.

BLOKADY: brak blokad wykonania. Ograniczenia: patrz NIE ZMIERZONO.
Przyczyna BLOCK z r1 (dla orkiestratora): tura 1 blokowana bramką NNS, bo r1 odpalał grę bez ?civTest=1, więc __aiTradeWiringTestDebug (nnsGateBlocked) nie istniał („brak haka"); dodatkowo r1 zakładał miasto przed zakończeniem tworzenia świata (miasta 0). r2 czeka na overlay „Tworzenie świata" i używa __nnsMeasureDebug.startGame, jak runner pomiaru.

RUNDY: 2/5 (Operator, Haiku 5.5). Brak rund Evaluatora/FC.
NASTĘPNY KROK: Evaluator (Sonnet) do weryfikacji narzędzia i ewentualnego zamknięcia NIE ZMIERZONO (0 miast; Skąd zapasy; klik w menu). Opcjonalnie drugi przebieg z --strip-from-current nie jest potrzebny, bo prawdziwy stary zapis już nie zawiera pól 760–761.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md nie istnieje w origin/main (tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); użyto DODATKU z tej gałęzi oraz raportu r1.
- Mały znaleziony problem środowiskowy (nie gry): python http.server nie ma favicon.ico, więc przeglądarka zgłasza 404. Odfiltrowane w narzędziu. Jeśli bramka ma być ścisła, dodaj favicon do bundla.
- Nie zakładano sesji, zadań ani harmonogramów.
