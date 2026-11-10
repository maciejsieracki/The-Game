STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-CERAMICS-ANALYSIS-Q1
GOAL: Audyt read-only: czy ceramika może być kosztem UTRZYMANIA budynków. Zero zmian kodu gry.
ZMIANY-COMMIT: kod operatora 83ae0e6c5 (potomek 54a7c6d6f, potomek 5d7ff15e6). Diff 5d7ff15e6..83ae0e6c5: 3 pliki w runie (01-operator-r1.md, 02-kandydaci-utrzymanie-ceramika.csv, 03-operator-r2-odpowiedzi-na-zarzuty.md), +180, zero zmian w gra/. git diff --check czysty. Plus ten plik (03-final-control.md).
TESTY: NIE_ZMIERZONO (brak symulacji salda ceramiki; audyt odczytowy). Samodzielnie zweryfikowano w bazie 5d7ff15e6: tech.json Garncarstwo prereq "—", Poziom 2, koszt 40, odblokowuje Spichlerz/Garncarnia/Cegielnia; economy-upkeep.ts: płaskie 5/typ z koszt_surowce; building-resource-gate.ts: SPICHLERZ_DRAIN_CERAMIKA_PER_TURN=25, drenaż bramkowany >=25 (całość albo nic); econ-params.json:409 "39 budynków" vs 42 wpisy w buildings.json; ai.ts:2407 ceramika->garncarnia.
BLOKADY: brak.
RUNDY: 2/5

WERDYKTY PER ZARZUT
1. Prereq Garncarstwa (błąd faktyczny) - ODDAL (zarzut uwzględniony w r2). Operator r2 koryguje: baza = brak prereq, prereq pochodzi z niewdrożonego R-WEB-TECH-POTTERY-FIFTH; ryzyko przeliczone osobno dla obu stanów. Uwaga: 01-operator-r1.md pozostaje bez zmian i zawiera błędne twierdzenie; r2 jest jawnym erratum i dokumentem rozstrzygającym. Przy ABC opierać się na sekcji "Propozycje i pytania ABC (poprawione)" z r2, nie z r1.
2. Spichlerz/zakleszczenie - ODDAL. Poprawione w r2; Studnia/Targowisko sprawdzone, brak twardego zakleszczenia w bazie. CSV nadal ma uwagi "ryzyko zakleszczenia"; r2 każe czytać je jako "ryzyko deficytu przed producentem" (nota, nie blokada).
3. Mechanizm 5/typ, drenaż Spichlerza, AI - ODDAL. r2 wylicza 8x5=40/t (nie 12/t), wymóg nowego pola utrzymanie_surowce i zmiany kodu, bramkowanie drenażu, CONVERTER_FOR_RESOURCE po koszcie budowy. Zgodne z kodem.
4. Pomiar vs arytmetyka - ODDAL. "Saldo strukturalnie ujemne" oznaczone HIPOTEZA/NIE_ZMIERZONO; dryf "39 budynków" potwierdzony.
Brak NAPRAW -> PASS-WITH-NOTES.

KOLEJNOŚĆ INTEGRACJI
SHA końcowy do integracji: commit tego pliku (potomek 83ae0e6c5; podany w raporcie końcowym). Temat dokumentacyjny, bez gra/ - kolejność względem origin/rust-port/parity-v2 (43f4064b0) nie ma znaczenia merytorycznego; merge-base 83ae0e6c5 z parity-v2 = 1a355346e, brak konfliktu plikowego (nowe pliki w runie). Integracja do gałęzi dokumentacyjnej claude/sprawdzenie-funkcjonalnosci-ek4ra0 (HEAD 23f1d4fcf; 83ae0e6c5 NIE jest jeszcze jej przodkiem - wymaga integracji orkiestratora).

NASTĘPNY KROK: ABC właściciela (A/B/C z r2, rekomendacja A); jeśli B/C - osobny dispatch implementacyjny i pomiar salda; dryf "39 budynków" jako osobny temat dokumentacyjny.
DEPLOY-PUSH: NIE WYKONANO
