# R-WEB-MEASURE-WARS-4242-VERIFY-Q1 — jeden ciągły bieg seed 4242: weryfikacja limitu wojen (FALA 896) i wojen epoki (FALA 891)

DOMAIN: GAME (pomiar) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 6fe46acefbdb1cb64eb82d8ab40baa7b4cde6339. Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst
Dwie rzeczy NIE ZMIERZONO po wdrożeniu: (1) FALA 896 — limit 1 wojny naturalnej na cywilizację także przy wciąganiu sojuszników (przed poprawką AI 28 miało 2 wojny w turach 60–67, seed 4242); (2) FALA 891 — wojny epoki: sojusz nie blokuje, parowanie do skutku (przed: pending Brązu stał 68 tur, 24× pairing-unresolved, seed 4242). Narzędzia: gra/tools/limits-measure.cjs (analizator JSONL), era-war-measure-run.cjs (runner wojen epoki, hak __eraWarMeasure), diplomacy-harder-measure-run.cjs (runner dyplomacji; stan flag --all-flags). Poprzedni pomiar i dane: dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md, runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/dane/. UWAGA: wznawianie biegu ze slotu daje SIGSEGV Chromium (temat #90 w toku) — rób bieg CIĄGŁY do tury 67 (ok. 10 min), nie wznawiaj; jeden Chromium naraz.
## Zadanie
1. Zbuduj bundle POZA repo (node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny-katalog> --emptyOutDir; to wyjątek C-001 — dozwolone; nie używaj npm run build/dev) z origin/main.
2. Wykonaj ciągły bieg seed 4242 do tury 67 z flagami domyślnymi (bez --all-flags) zapisując JSONL; policz limits-measure.cjs: maksimum wojen naturalnych na AI, naruszenia limitu (cel: 0 naruszeń w turach 60–67; porównaj z danymi sprzed poprawki), sojusze AI↔AI (limit 2).
3. Z tego samego lub drugiego biegu (era-war-measure-run.cjs, seed 4242, 120 tur jeśli czas pozwala, inaczej 90) zmierz wojny epoki: czy pending Brązu jest parowany (liczba tur pairing-unresolved, tura startu wojny Brązu po wejściu napastnika w epokę); porównaj z wartością sprzed FALI 891 (24×/68 tur).
4. Zapisz wyniki w dyspozycje/analizy/POMIAR-WOJNY-4242-PO-FALACH-891-896-2026-11-25.md (tabela: co | przed | po | werdykt DZIAŁA/NIE DZIAŁA/NIE ZMIERZONO + powód) oraz dane JSONL gz + SHA256 w runs/.../dane. Naruszenie lub niedziałanie → NIE naprawiaj; opisz minimalne odtworzenie (seed, tura, ścieżka) jako kandydata R-WEB-*.
## Allowlista
nowe pliki w dyspozycje/analizy/ (powyższy dokument), dyspozycje/autobot/runs/R-WEB-MEASURE-WARS-4242-VERIFY-Q1/** (w tym dane/), ewentualnie nowy gra/tools/wars-4242-verify.cjs (analiza/spięcie runnerów, bez zmian istniejących).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Po pracy pkill własnych chrome; usuń bundle z /tmp i gra/node_modules. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0 (kod gry bez zmian). Zacommituj (dokument + dane) i zwróć SHA.
## Binarne kryterium
Dokument z tabelą PRZED/PO i werdyktem dla limitu wojen i wojen epoki; dane JSONL z SHA256 w repo; albo NIE ZMIERZONO z konkretnym powodem i śladem prób.
