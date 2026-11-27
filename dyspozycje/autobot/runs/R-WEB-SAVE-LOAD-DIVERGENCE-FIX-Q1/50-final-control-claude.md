STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: wczytanie zapisu z pauzy daje przebieg B==A co najmniej 6 tur; zgodnosc wsteczna; mutacja czerwona.
ZMIANY-COMMIT: kandydat 51d7b0b3bb1760e21771b0a16f5fd8e4da3878b2; baza 87a8d6e81 jest przodkiem (merge-base --is-ancestor OK). diff --stat: 16 plikow, +1480/-129; kod gry tylko gra/src/main.ts (+37/-?, nowa liczba: funkcja liveMapDiffersFromSave, klauzula w loadGameFromSlot, hak civTest loadJsonAsPauseLoad), reszta: tools/save-load-continuity-live.cjs, dokument analizy, run-dir (10/30, dane/*.json). Allowlista zachowana (gra/data, rust-port, WERSJE.md nietkniete). Przyczyna: przy wczytaniu z pauzy zostawala ZYWA mapa (zmieniona po zapisie) zamiast mapSnapshot.
TESTY (wlasne, surowe wyjscia, node_modules z npm ci, tsc 5.9.3):
- tsc --noEmit: 0 bledow
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- ai-test 297 passed 0 failed; ai-city-order-need-wiring-test 267/0 (= "wiring 267/0")
- society-breakdown 56/0; culture-religion-level 108/0; ai-plus10-culture 72/0; ai-plus10-matrix 190/0; ai-city-rebellion-gate 37/0; ai-city-rebellion-news 24/0; diplo-world-news 67/0
- Test ciaglosci live (build vite do /tmp, maks. poziom: cfg max = Trudny, Wysoki x4, dyplomacja trudna, kultura trudny/AI trudny), max/4242/zapis po t3/K=6: PASS, 6/6 tur OK, pageErrors 0, sciezka produkcyjna loadGameFromSlot(slot,true), rebuild=false (przebudowa z powodu liveMapDiffersFromSave).
- Mutacja 1 (--restore plain = restoreJson bez mapy): 6/6 ROZJAZD (expect=diff PASS).
- Mutacja 2 NIEZALEZNA, wlasna: usunieta w loadGameFromSlot klauzula liveMapDiffersFromSave, przebudowa dist: 6/6 ROZJAZD (expect=diff PASS; pierwsze uruchomienie SIGSEGV Chromium, ponowienie OK). To zamyka zarzut 2: mutacja produkcyjnego warunku CZERWIENI test, bo hak wola produkcyjne loadGameFromSlot (nie duplikuje warunku; diff pokazuje hak liczy warunek tylko do raportu).
- Zrodlo po mutacji przywrocone (git checkout), drzewo czyste.
- Dane Operatora/Obrony (r4-*.json) nie powtorzone w calosci: seed 4242 t10 i aionly/7/t3, legacy bez mapSnapshot -> przyjete z raportow 10/30, NIE ZMIERZONO przeze mnie.
OCENA ZARZUTOW EVALUATORA:
1 (macierz 4 z 16): ODDAL/uwaga - przyczyna wspolna (zywa mapa), 3 komorki + mutant Operatora/Obrony i 1 komorka moja; ryzyko niskie, NIE ZMIERZONO reszta.
2 (hak duplikuje warunek): ODRZUCONY dla wersji 51d7b0b3b - hak wola produkcyjne loadGameFromSlot; wlasna mutacja produkcyjnego warunku zaczerwienila test. Zostaje: klik UI menu i render NIE ZMIERZONO.
3 (brak pola w serializacji): ODRZUCONY - przyczyna to zywa mapa, mapSnapshot juz jest w zapisie; poprawka bez zmiany formatu = zgodnosc wsteczna z definicji.
4 (wiring 267): ROZSTRZYGNIETY - ai-city-order-need-wiring-test 267/0 uruchomiony, zielony.
5 (test live poza bramka): uwaga, nie blokuje; dluzszy test (~4 min/komorka) - propozycja wpiecia w bramki dla orkiestratora.
6 (A==A'): uwaga; ai-test 297/0 bez zmian, determinizm ciagly NIE ZMIERZONO osobno.
BLOKADY: brak blokujacych. NIE ZMIERZONO: pelna macierz 16 komorek, klik UI pauzy, render 3D, A==A' osobno, determinism-save-load-resume-live i ai-plus10-live-roundtrip (nie uruchomione przeze mnie; Operator/Obrona raportuja zielone).
RUNDY: FC r4 (po FC r3 FAIL); zuzyte 4/5 rund.
NASTEPNY KROK: integracja orkiestratora (merge 51d7b0b3b, ewentualnie FALA); decyzja czy wpiac save-load-continuity-live w bramki.
UWAGI-DLA-ORKIESTRATORA: (a) wpiecie testu live w R-PROC-AUTOBOT sec.6 (poza allowlista); (b) kandydat BLAD-GRY zamkniety: gra z pauzy wczytywala zywa mape.
DEPLOY/PUSH: NIE WYKONANO
