STATUS: BLOCK
DOMAIN: GAME (tylko pomiar i narzędzie; kod gry NIE zmieniony)
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1 (#435)
GOAL: narzędzie gra/tools/save-load-old-save-compat-live.cjs sprawdzające w Chromium wczytanie starego zapisu (sprzed FAL 760-762) na bieżącym kodzie; asercje A1-A4 + wynik w evidence/.
BAZA: 459354a12e00eb04cc8365c5ac03a03c2ffec999 (origin/main, detached).

ZMIANY-COMMIT:
- nowy: gra/tools/save-load-old-save-compat-live.cjs (faza old: nowa gra, stolica, N tur, eksport civ-autosave z OPFS; faza new: wstawienie zapisu do OPFS, "Wczytaj grę", asercje; tryb --strip-from-current usuwa 5 pól meta + resourceLedgerHistory = SYMULACJA).
- nowy: dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence/old-result.json (wynik ostatniego uruchomienia fazy old).
- nowy: dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/10-operator-claude.md (ten raport).
- Nie zmieniono: gra/src, gra/data, WERSJE.md, manifest, gra-robocza/, rust-port/.

TESTY (ZMIERZONO):
- tsc --noEmit (gra/): exit 0 (surowe wyjście puste).
- Build bundla bazowego commita f6b09c76b POZA repo (git archive do scratchpad, vite build): OK, 21.06 s, index.html 14 802 kB.
- Build bieżącego kodu (459354a12) POZA repo do scratchpad/new-dist: OK, 23.20 s.
- Live faza old na bundlu f6b09c76b (uruchomienie 2, z diagnostyką): PASS stolica gracza zakładana (foundPlayerStartCity=true); po założeniu stolicy: turn 1, cities 1, units 2, awaiting=false. PASS brak pageerror. FAIL tura 1 nie przechodzi (timeout 240 s po kliknięciu [data-end]). FAIL brak autozapisu civ-autosave-N.json w OPFS (bo tura nie przeszła). Stan odczytany na końcu fazy old: turn 1, cities 0, units 0 (NIEWYJAŚNIONE; nie zbadane).
- Uruchomienie 1 (przed poprawką diagnostyki): te same objawy (tura 1 bez przejścia).

WYNIKI ASERCJI:
- A1 brak pageerror/błędów konsoli: ZMIERZONO tylko dla fazy old (PASS); faza new NIE uruchomiona.
- A2 liczba miast/jednostek po wczytaniu = zapis: NIE ZMIERZONO (brak zapisu z fazy old).
- A3 isAwaitingFirstPlayerCity()=false przy miastach: NIE ZMIERZONO w fazie new; w fazie old zmierzono awaiting=false przy cities=1 (informacyjnie).
- A4 "Zakończ turę" 3 tury: NIE ZMIERZONO (tura 1 nie przechodzi na bundlu bazowym w tym harnessie).
- Pieniądz/spichlerz, dziennik "Skąd zapasy", scenariusz 0 miast, mutacja Array.isArray: NIE ZMIERZONO (brak haka odczytu ekonomii w dumpState; brak osobnego zapisu 0 miast; mutacja wymagałaby zmian poza allowlistą).

BLOKADY:
1. Harness nie przechodzi tury 1. Zgodnie z dispatchami #414/#415/#417 bramka "Zakończ turę" (NNS) blokuje endTurn w turze 1. Hak nnsGateBlocked istnieje w obiekcie debug, ale wynik nie został odczytany w tym przebiegu (diagnostyka zwróciła "brak haka" - do sprawdzenia nazwy obiektu). Bez przejścia tury nie ma autozapisu z ticków, więc nie da się wyeksportować zapisu "w turze 6".
2. Po założeniu stolicy stan w dumpState na końcu fazy old pokazuje 0 miast (niewyjaśnione; wymaga diagnozy w przeglądarce).
3. Faza new nie została uruchomiona, bo nie ma zapisu wejściowego.

RUNDY: 1/5 (Operator, Haiku 5.5). Brak rund Evaluatora/FC.
NASTĘPNY KROK: (a) zdiagnozować w Chromium przyczynę blokady tury 1 i zniknięcia miast (konsola [EndTurn]/[NNS]); (b) ustalić właściwy hak stanu bramki i pola ekonomii (Pieniądz, spichlerz) w dumpState lub użyć haka civTest (#417); (c) uruchomić fazę old, potem fazę new na bieżącym kodzie; (d) dopiero potem mutacja Array.isArray na kopii poza repo.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md nie istnieje w origin/main (ścieżka jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); użyto DODATKU z tej gałęzi.
- Po założeniu stolicy w fazie old dumpState raportuje cities=1, a po kolejnych oczekiwaniach cities=0 (patrz BLOKADY 2).
