# R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 — przywrócić pas polarny w generatorze map „Kontynenty” (decyzja właściciela A1, zgoda na start 2026-11-25)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA KODU = origin/main aa96cfc618de124e48b74408870115854293e6c5 (FALA 890, ROBOCZA MD5 668f6110). Deploy na ROBOCZĄ jako FALA 891 po Final Control.

## Kontekst (zmierzone w analizie dyspozycje/analizy/MAP-POLAR-ZERO-2026-11-20.md — czytaj: git show origin/main:dyspozycje/analizy/MAP-POLAR-ZERO-2026-11-20.md)
Od commita 40a29e4c6 (FALA 142) mapa typu „kontynenty” (seed 42, standardowy) ma 0 heksów TerenBazowy.Polarny; do 9c4320be0 było 81. Przyczyna ustalona eksperymentem: trzy hunki w gra/src/map/gen-helpers.ts (applyLandFractionByScore ~l.3132; applyLandFractionByContinent ~l.3206 i ~l.3229) zamieniły filtr „!== Morze” na isDryLandTerrain(...) (= nie Morze i nie Wybrzeże), co wypycha ląd z pasa polarnego (wiersze 6–11 i 108–113 dla H=120). Cofnięcie tych trzech hunków przywraca 81 i identyczne polarRows, ale cofa też zamierzoną semantykę „land% = suchy ląd” (suwak lądu; enforceTargetDryLandFraction).
Test gra/tools/climate-band-test.cjs (asercja polar > 0 dla generujSwiat(42,'standardowy','kontynenty',…)) jest dziś CZERWONY i ma zostać NIEZMIENIONY (nie osłabiaj asercji).

## Decyzja właściciela (wiążąca): A1
Przywrócić pas polarny w generatorze dla map „kontynenty” (i innych typów, które go miały przed 40a29e4c6 — poza „ziemia”, gdzie brak Antarktydy jest zamierzony). Zachować semantykę suwaka lądu (land% = suchy ląd) tam gdzie to możliwe.

## Zadanie
1. Znajdź MINIMALNĄ poprawkę generatora (preferencja: osobny warunek chroniący ląd pasa polarnego przed erozją/odliczeniem w trzech miejscach albo przywrócenie filtra tylko dla pasa polarnego; bez cofania całej semantyki isDryLandTerrain), tak aby: climate-band-test przechodził bez zmian; polar > 0 dla seedów 1, 7, 42, 4242 × standardowy kontynenty (pomiar surowy, tabela w raporcie) oraz malenki; typ „ziemia” bez zmian (0 polarnych jak dziś); pangea bez regresji.
2. Testy suwaka lądu (land% / enforceTargetDryLandFraction) i inne testy generatora muszą zostać zielone. Wolno RE-PINOWAĆ hashe/liczby w istniejących testach map/determinizmu TYLKO gdy różnica pochodzi z przywróconego pasa polarnego — każdy re-pin uzasadnij w raporcie (przed/po, dlaczego).
3. Nowy test dowodowy gra/tools/map-polar-continents-test.cjs: seedy 1, 7, 42, 4242 (kontynenty, standardowy) mają polar > 0 i polar ≤ rozsądny sufit z pomiaru (podaj w raporcie); mutacja (cofnięcie poprawki) → czerwony — pokaż.
4. NIE zmieniaj logiki AI/osadnictwa (AI unikanie miast polarnych jest osobnym, wdrożonym tematem).

## Allowlista
gra/src/map/gen-helpers.ts, gra/src/map/generator.ts (tylko jeśli konieczne), gra/tools/map-polar-continents-test.cjs (nowy), istniejące testy generatora/map/hash TYLKO re-pin z uzasadnieniem, dyspozycje/autobot/runs/R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (tylko vite build --outDir poza repo), osłabianie climate-band-test, zmiana zasad gry poza pasem polarnym, rm/rmdir/unlink plików repo, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; npm ci w gra/ w swoim worktree (usuń node_modules po bramkach).

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; climate-band-test PASS; wszystkie testy map/generatora (gra/tools/*map*-test.cjs, *generator*, *land*, *relief*, *climate*, *determinism*) — uruchom i podaj surowe liczby; nowy test zielony z mutacją czerwoną. ZACOMMITOWAĆ (git add tylko allowlista) i zwrócić SHA.

## Binarne kryterium
PRAWDA: climate-band-test zielony bez zmiany asercji; polar > 0 dla czterech seedów kontynentów; „ziemia” bez polarnych; testy suwaka lądu zielone; bramki zielone.

## DODATEK orkiestratora (runda 1)
Środowisko: worktree izolowany od kandydata (git checkout --detach <cand>); w gra/ uruchom `npm ci` (brak wspólnego node_modules). Zgoda właściciela na start: „realizuj po kolei” (2026-11-25). Raport: dyspozycje/autobot/runs/R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1/10-operator-claude.md. Uwagi spoza zakresu wpisz do UWAGI-DLA-ORKIESTRATORA. Model: Operator HAIKU 5.5.
