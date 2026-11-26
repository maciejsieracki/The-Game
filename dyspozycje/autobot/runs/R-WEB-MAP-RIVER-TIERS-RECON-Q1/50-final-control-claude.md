STATUS: PASS-WITH-NOTES
DOMAIN: GAME (recon, zero zmian gra/**)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2x źródeł)
ZMIANY/COMMIT: kandydat b7647c336ca6884cac3fcb67ab4fb907961b55f5 (baza bcee4f3a5ee1d607abd2591e753c209cb092c86f). `git merge-base --is-ancestor` baza->kandydat: OK. `git diff --name-only`: 7 plików, wszystkie w allowliście (dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md, 4 skrypty river-count-*/river-tests-run.cjs w dyspozycje/analizy/, 10-operator i 30-obrona w runs/<ID>). `git diff --stat -- gra rust-port dyspozycje/WERSJE.md` = pusto (zero zmian kodu gry). `git diff --check`: OK.
TESTY: Bramki kodu (tsc, 5 bramek referencyjnych) NIE URUCHOMIONE — kandydat nie zmienia żadnego pliku poza dyspozycje/, więc wyniki identyczne z bazą (uzasadnienie: brak diffu w gra/**). Niezależny pomiar własny (kopia scratch obrony, bundle z bazy): 84x60 s1 V0 = {"ms":11021,"main":47,"medium":25,"tributary":8,"hex":425/273/98,"total":80,"visibleDefault":72,"nonAdjacentPaths":0} — zgodne z tabelą 3.1 i sekcją 9; 84x60 s1 V3 (RIVER_PATHSEP=1) = main 92 / medium 15 / tributary 2, hex 912/166/18, visibleDefault 107, nonAdjacentPaths 0 — zgodne z tabelą 3.1 (92/15/2, widoczne 107). Czas 11,0 s vs dokument 11,9 s (sekcja 9) — spójne.
OCENA ZARZUTÓW (bez etykiet ról):
 1. Podparcie hexów: przypis naprawiony, sekcja 9 zawiera surowe wyjścia (V0 84x60, V0/V3 168x120 s42); sekcja 3.1 jawnie mówi, że pozostałe hexy NIE ZMIERZONO. Odpowiedź obrony wystarczająca -> ODDAL (uwaga).
 2. Pkt 6 niepełny (8 testów nieuruchomionych): zarzut słuszny, dokument przyznaje to w sekcjach 6 i 8, lista pinów jawnie oznaczona jako niepełna; zastępcza asercja sąsiedztwa (0 naruszeń) potwierdzona własnym przebiegiem na 2 mapach. Nie zmienia wniosków dla właściciela (main/medium/tributary, odstęp 3->1) -> uwaga, domknięcie przy temacie wdrożeniowym (RIVERS3), nie FAIL.
 3. Czasy kierunkowe: dokument oznacza je jako kierunkowe (sekcje 3.2, 9) -> ODDAL.
 4. Pangea V2 / brak rekomendacji ilościowej 2x dla map stałych: oznaczone NIE ZMIERZONO, rekomendacja ograniczona do odstępu na mapach kreatora -> ODDAL.
 5. "+12% RIVMOUTH": dokument stwierdza NIE POTWIERDZONE (nie obalone), bez twierdzenia przeciwnego -> ODDAL.
BLOKADY: brak blokujących. Niedomknięte (uwagi): 8 testów z pkt 6 nieuruchomionych; hexy 168x120 poza s42 i 240x168 nie zmierzone; V3+RIVMOUTH i wpływ na piny map-zależne NIE ZMIERZONO; Pangea V2 NIE ZMIERZONO.
RUNDY: FC r3 (max 5)
NASTĘPNY KROK: integracja orkiestratora (dokument i skrypty z dyspozycje/analizy); decyzje dla właściciela (wariant A/B/C trzeciego poziomu, odstęp 1 = rzeki w sąsiednich heksach, widoczność dopływów) wg ZASAD ABC; pełny pomiar pinów jako część RIVERS3.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: najważniejszy wynik recon: zmniejszenie siatki źródeł nie podwaja rzek (0,95-1,02x), skuteczny jest tylko odstęp ścieżek 3->1 (2,06x main, ale medium -17%, dopływy -67%); "trzeci poziom" istnieje w kodzie jako tributary (ukryty w renderze od FALA 174, ta sama szerokość co medium). Brak zapisanej decyzji o trzecim poziomie (NIE ZNALEZIONO).
