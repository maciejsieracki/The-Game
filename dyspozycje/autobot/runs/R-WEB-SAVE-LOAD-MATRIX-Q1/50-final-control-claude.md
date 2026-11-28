STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1
GOAL: macierz zapisu/wczytania na maksimum (rivals=9, civTypesCount=14 dla Brazu, barbarzyncy Trudny), B==A >=6 tur, klik UI, A==A' >=10 tur x2 ziarna, render po wczytaniu.
ZMIANY/COMMIT: kandydat 819d43beaf3a036ce866ee365b0fd6588f02deb2. Zweryfikowano: baza 193fadc8 jest przodkiem kandydata (merge-base --is-ancestor = tak). Wzgledem ca61257d (merge r2) zmiany poza dyspozycje/ to tylko gra/tools/save-load-continuity-live.cjs i save-load-continuity-ui-live.cjs; gra/src i gra/data bez zmian wzgledem ca61257d (diff --stat). Allowlista zachowana. Duzy diff wzgledem 193fadc8 pochodzi z merge'a ca61257d (dozwolony krokiem 0 dispatchu).
TESTY: gra/src bez zmian wzgledem bazy merge, wiec tsc/logic/ai-test nie uruchamiane (powod pominiecia). Odczytano r3-READBACK-rivals9.txt: cfgUsed {barbariansLevel trudny, difficulty Trudny, rivals 9, civTypesCount 14}; max/4242/t3, max/4242/t10, max/7/t3, max/7/t10 PASS 6/6, pageErrors 0 (wg pliku; wlasnego pomiaru na zywo nie powtarzano).
OCENA ZARZUTOW (bez etykiet rol):
 1. Uzasadniony, czesciowo naprawiony: na rivals=9 zmierzono 4 z 13 komorek; 8 komorek (bunt, aionly) NIE ZMIERZONO na maksimum. Kryterium (>=10 komorek na maksimum) NIESPELNIONE. NAPRAW.
 2. Uzasadniony, naprawiony (15 -> 14 dla Brazu, zgodnie z civs.json). ODDAL.
 3. Uzasadniony, nienaprawiony: bunt/t10 B!=A bez minimalnego odtworzenia i testu czerwony->zielony; pkt 5 dispatchu niespelniony. Wymaga decyzji orkiestratora (cities.ts poza allowlista albo akceptacja reprezentacji). NAPRAW/DECYZJA.
 4. Uzasadniony: dirty3 FAIL od t7 niezdiagnozowany; hipoteza artefaktu PRNG harnessu niesprawdzona. NAPRAW.
 5. Uzasadniony: klik UI na rivals=9 NIE ZMIERZONO (harness UI ma rivals=2). Pkt 2 niespelniony. NAPRAW.
 6. Uzasadniony: render po wczytaniu NIE ZMIERZONO. Pkt 4 niespelniony. NAPRAW.
 7. Uzasadniony, naprawiony w dokumencie.
 8. Uwaga: A==A' tylko na rivals=2; pkt 3 na maksimum NIE ZMIERZONO. NAPRAW.
WNIOSEK: poprawne ustawienia maksimum i 4 komorki PASS to realny postep, lecz kryterium binarne (>=10 komorek, klik UI x2, A==A' x2 ziarna, render) jest niespelnione, a bunt/t10 B!=A pozostaje nierozstrzygniete. Brak zmian w kodzie gry, brak naruszen granic.
BLOKADY: 8 komorek bunt/aionly na rivals=9; bunt/t10 B!=A (decyzja o cities.ts); klik UI na rivals=9; A==A' na rivals=9; render; dirty3.
RUNDY: 3/5 (FC); pozostaja rundy 4-5.
NASTEPNY KROK: orkiestrator rozstrzyga bunt/t10; runda 4 (Operator): 8 komorek na rivals=9, runner UI na rivals=9 (2 komorki), A==A' 10 tur na max/4242 i max/7, render + PNG, diagnoza dirty3 (zasiew PRNG po wczytaniu).
DEPLOY/PUSH: NIE WYKONANO
