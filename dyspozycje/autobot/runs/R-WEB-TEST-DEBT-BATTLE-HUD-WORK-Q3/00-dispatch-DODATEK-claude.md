# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (b0b0e3f86). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: WYŁĄCZNIE gra/tools/*-test.cjs (i pliki pomocnicze testów), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/**. ZAKAZ zmian gra/src/**, JSON balansu, WERSJE.md, rust-port (realne defekty tylko opisz w raporcie). Testy bitew (battle-*) uruchamiaj POJEDYNCZO z limitem 280 s; równolegle chodzą W26/W27 w tych samych plikach źródłowych — nie dotykaj gra/src/battle.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; Chromium przez Vite HTTP (build poza repo). Nie integrujesz, nie pushujesz.

## DODATEK (runda 2/5, 2026-11-12) — FC FAIL r1 → NAPRAW
BAZA: kandydat d0c667c856d4366f26634d403b7739672433e48c (web-wip/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3), NAJPIERW merge origin/main (6b9bcaf2b). MODEL: Operator HAIKU, Obrona HAIKU.
NAPRAW 1: battle-attack-move-pointer — statyczny serwer harnessu zwraca 404 na /favicon.ico, test liczy to jako błąd strony; dodaj odpowiedź 204 dla /favicon.ico w harnessie (FC potwierdził: kopia z 204 daje exit 0, 5/5 PASS). Tylko plik testu/harnessu.
NAPRAW 2: battle-ranged-approach-regression — exit 124 po 280 s także na bazie; dokończ klasyfikację: uruchom z dłuższym limitem (do 600 s, pojedynczo) albo zmierz czas, zapisz wynik i klasyfikację (timeout środowiska | realny defekt) w raporcie z surowymi liczbami.
NAPRAW 3: 10-operator-claude.md ma zawierać SHA kandydata i PEŁNĄ tabelę 12 testów: test | wynik na bazie | wynik po poprawce | klasyfikacja.
ZAKAZ zmian gra/src/**. Pozostałe 10 testów już zielone — nie ruszać.
