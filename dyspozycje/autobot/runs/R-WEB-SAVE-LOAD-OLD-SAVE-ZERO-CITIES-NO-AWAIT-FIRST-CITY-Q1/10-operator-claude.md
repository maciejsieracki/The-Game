STATUS: FAIL (częściowo: flaga naprawiona i zweryfikowana w żywo; kryterium A4 „Zakończ turę działa 3 razy” NIE zaliczone)
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-ZERO-CITIES-NO-AWAIT-FIRST-CITY-Q1
GOAL: stary zapis (bez pola playerEverOwnedCityByOwner) z turą > 1 nigdy nie wraca do „czekam na pierwsze miasto” (ABC A, 2026-11-16).
BAZA: origin/main ef6e8ea1ee7c3d1019a537546153f53af9f4b115

ZMIANY/COMMIT:
- gra/src/main.ts, restoreGameFromSave (~l. 49265): nowa gałąź `else if (saved.tura > 1)` po odczycie pola meta; dodaje do playerEverOwnedCityByOwner fotele z saved.humanOwnerIds oraz saved.activeHumanOwnerId. Pole obecne -> bez zmian. Tura 1 -> bez zmian (nowa gra nadal wymaga stolicy).
- gra/tools/save-load-player-owned-city-test.cjs: 4. warunek statyczny (OLD_SAVE_RE) + mutant kopii „bez uzupełnienia starego zapisu” (wykryty).
- gra/tools/save-load-old-save-compat-live.cjs + dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1/evidence/*: przywrócone z refs/keep/OLDSAVE-r2-obrona (wg dispatchu).
- Heurystyka bezpieczna: gracz po turze 1 już przeszedł założenie stolicy, więc uzupełnienie flagi dla fotela z zapisu o turze > 1 nie zmienia zachowania tury 1 ani nowych zapisów (z polem).

TESTY:
- tsc --noEmit: EXIT 0.
- save-load-player-owned-city-test.cjs: RESULT PASS (4 warunki statyczne OK; 3 mutacje kopii wykryte).
- load-game-regression-test.cjs: 34 PASS / 0 FAIL.
- save-load-roundtrip-state-drift-test.cjs: warstwa statyczna OK (10/10); warstwa dynamiczna NIE ZMIERZONO (przekroczenie 580 s, bez wyniku).
- vite build poza repo (scratchpad dist-fix): OK.
- Live save-load-old-save-compat-live.cjs --phase new na zapisie 0 miast (make-nocity-save.cjs, SYMULACJA z save-old-6t): A1 brak błędów PASS; A2 miasta 41=41 PASS; jednostki 61=61 PASS; A5 dziennik „Skąd zapasy” 6=6 PASS; isAwaitingFirstPlayerCity po wczytaniu: false PO poprawce (wcześniej true wg evidence); tura 7 -> 8 po pierwszym „Zakończ turę” (ZMIERZONO).
  A4 FAIL: drugi klik „Zakończ turę” w turze 8 zwrócił cannot-end (flagi bitwy wszystkie false). Przyczyna NIE ZIDENTYFIKOWANA; prawdopodobny kandydat: bramka NNS (nnsGateForPlayer, dług harnessu #417) — NIE ZWERYFIKOWANE.
- Ekonomia po wczytaniu = zapis: NIE ZMIERZONO (brak pliku metryk zapisu).
- Mutacja na kopii w wariancie live: NIE ZMIERZONO (tylko statyczna mutacja).
- Tura 1 nowej gry blokuje „Zakończ turę” do stolicy (test c): NIE ZMIERZONO.
- 5 bramek referencyjnych po npm ci: NIE ZMIERZONO (npm ci wykonane, bramki nie uruchamiane).
- git diff --cached --check: OK.
- git merge-tree z origin/main: NIE ZMIERZONO po commicie.

BLOKADY:
- A4 (3x Zakończ turę) nie przechodzi; to kryterium akceptacji. Wymaga diagnozy przyczyny cannot-end w turze 8.
- Dynamiczna warstwa testu roundtrip nie zmierzona (limit czasu).

RUNDY: 1/5
NASTĘPNY KROK: diagnoza cannot-end po turze 8 w zapisie 0 miast (który warunek canPlayerInitiateEndTurn zwraca false, np. nnsGateForPlayer), potem runda 2 Operatora.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- origin/main nie zawiera pliku 00-dispatch.md dla tego tematu; dispatch wzięto z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md i 00-dispatch-DODATEK-claude.md).
- Sprzątanie do zrobienia po integracji: gra/node_modules w worktree, build w katalogu scratchpad, pliki tymczasowe poza repo (plik logu npm-ci w katalogu nadrzędnym worktrees).
