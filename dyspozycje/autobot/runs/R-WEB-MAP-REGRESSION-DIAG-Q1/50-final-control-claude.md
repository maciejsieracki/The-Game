STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; zero zmian gra/src, gra/data, gra/tools)
TEMAT: R-WEB-MAP-REGRESSION-DIAG-Q1
GOAL: lista naruszeń kandydat MAPFIX (f781bbd0a) vs baza (690947a2a), klasyfikacja NOWE/ISTNIEJĄCE, jednoznaczny wniosek o wdrożeniu MAPFIX.
ZMIANY/COMMIT: kandydat 6d45998aabf7ea4a4a1ee5a1405a34c12fdd8d62. Weryfikacja: `git merge-base --is-ancestor 690947a2a 6d45998aa` = TAK. `git diff --name-only 690947a2a 6d45998aa` = 11 plików, wszystkie w allowliście (dyspozycje/analizy/MAPREGDIAG-2026-11-26.md, dyspozycje/analizy/map-regression-diag/*, dyspozycje/autobot/runs/R-WEB-MAP-REGRESSION-DIAG-Q1/10-operator, 30-obrona). Zmiany w gra/, rust-port/, gra-robocza/, gra-kanon/, WERSJE.md: 0 plików. Raport FC: commit tylko tego pliku.
TESTY (własna weryfikacja FC):
- tsc i 5 bramek referencyjnych NIE uruchomione: diff kandydata względem bazy nie zawiera żadnego pliku poza dyspozycje/ (git diff --stat -- gra = pusty), więc wyniki bramek są tożsame z bazą; w worktree brak gra/node_modules, dysk 5,6 GB. Uzasadnienie: temat diagnostyczny bez zmian kodu.
- Spójność danych surowych (z plików w repo): cand-results.tsv 87 linii; osierocone > 0 w dokładnie 6 przypadkach B (wyspy; medium 777=6, 7=24, 2026=1; high 123=4, 777=10, 7=18; suma 63); base-results.tsv: 0 przypadków z osieroconymi. cand-repeat.tsv: 6 linii identycznych z pierwszym przebiegiem (determinizm). trace-nopurge.tsv: 777/medium/wyspy orphan 0 po wyłączeniu purge (z 6). def-results.tsv: 777/high MAPFIX orphan 10, samotne lądy 0, 3 heksy rzeki zamienione; wariant V1 orphan 0, samotne lądy 3; 7/high MAPFIX 18/0/1 heks; V1 0/1. Liczby zgodne z MAPREGDIAG i 30-obrona.
- Weryfikacja stanu main: `git show origin/main:gra/src/map/generator.ts` -> purgeOpenOceanLandSpecks(hexes) w liniach 463 i 743 (MAPFIX z purge JEST w main).
- Sumy: baza 5 twardych naruszeń (1 A + 4 C), kandydat 11 (1 A + 6 B + 4 C), delta +6 NOWE.
- Poziom maksymalny: rivers=high uznany za maksimum gęstości rzek (pomiary obrony); sekcja B w głównym pomiarze obejmuje medium i high.
- Nie powtarzałem pomiarów sam (~6-12 min na przypadek, brak node_modules): NIE ZMIERZONO przez FC; opieram się na surowych plikach oraz na niezależnym powtórzeniu Evaluatora (3 z 6 przypadków) i powtórzeniu obrony (2 przypadki).
OCENA ZARZUTÓW EVALUATORA (bez etykiet ról):
1. Mechanizm nie prześledzony na poziomie heksu: ODDAL (uwaga). Obrona dała klucze 3+1 heksów rzeki zamienionych w morze, ablacja zeruje osierocone; wniosek wystarczający do decyzji, pełne śledzenie sąsiedztwa to dalsza praca.
2. Poprawka nie mierzona: obrona zmierzyła V1 (pomijanie heksów rzek): orphan 0, ale samotne lądy 3 i 1, czyli V1 odpada. Wariant "purge przed ensureRiverOutlets" NIE ZMIERZONO: ODDAL (osobny temat, to nie cel diagnozy).
3. Brak metryki samotnych lądów: domknięte dla 2 przypadków high; medium NIE ZMIERZONO: ODDAL.
4. MAPFIX już w main: FAKT potwierdzony (generator.ts:743, :463). Decyzja orkiestratora, nie wada diagnozy: ODDAL.
5. Baza kandydata f781 = 1bb77a7a0: ODDAL; różnice gra/src/map to 3 pliki MAPFIX, porównanie generatora czyste.
6. Pomiar powtórzony częściowo: ODDAL (ograniczenie jawnie zapisane; spójność sum sprawdzona przez FC).
7. Kosmetyka (literówka naprawiona w obronie; pliki .entry/.bundle nie w commicie): ODDAL, zamknięte.
Żaden zarzut nie wymaga NAPRAW: diagnoza jest rzetelna w granicach zasięgu i nie zawiera zmian kodu.
WNIOSEK MERYTORYCZNY: MAPFIX (f781bbd0a, już w origin/main) powoduje 6 NOWYCH naruszeń "osierocone heksy sieci rzecznej" na mapach typu "wyspy" (63 heksy), deterministycznie; 5 naruszeń (1 A, 4 pangea C) jest ISTNIEJĄCYCH. Najprostsza poprawka (purge pomija rzeki) łamie cel "0 samotnych lądów".
BLOKADY: brak blokad procesu. Otwarte (NIE ZMIERZONO): wariant purge przed ensureRiverOutlets; samotne lądy dla rivers=medium; powtórzenie sekcji A/C/D/E.
RUNDY: 1/5
NASTĘPNY KROK: integracja dokumentacji diagnozy (bez deployu, zero zmian gra/). UWAGI-DLA-ORKIESTRATORA: (a) main zawiera regresję map "wyspy" (6 z 6 przypadków wysp w sieci rzek nie przechodzi bramki map-gen-regression) — rekomendowany nowy temat R-WEB-* naprawczy bez pytania do właściciela (błąd webowy wykryty testem, stała zgoda): zmierzyć warianty (purge przed ensureRiverOutlets; purge z przywróceniem lądu w sąsiedztwie heksu rzeki; zamiana samotnego lądu w morze po rzekach z odtworzeniem ścieżki) łącznie metryką orphanCount + samotne lądy na sekcji B (medium i high); (b) pangea bboxFill 4/5 jest istniejące już na bazie — osobny temat/decyzja progu; ten drugi punkt może wymagać pytania ABC o wygląd map, jeśli ma zmieniać próg.
DEPLOY/PUSH: NIE WYKONANO
