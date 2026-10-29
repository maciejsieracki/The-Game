STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-A-Q1
GOAL: REPIN krok 4b czesc A: port zmian weba edb8fb56->91dc998a dla manpower/economy/production/turn-economy/work-tax do Rust.
ZMIANY/COMMIT: Final Control nie zmienia kodu. Oceniany HEAD befa1f75 (baza 07c7920f / 6b67b256). Ten plik: commit FC na befa1f75.
TESTY (zmierzone przeze mnie): p6_5b_manpower 14/14, p6_5b_replenish 1/1, p6_repin_a_costmult 6/6 zielone. Mutacja K06 (`if false && unit_cost == 0.0`, recruitment.rs:2745) WYKRYTA (2 testy p6_repin_a_costmult FAILED), cofnieta (git checkout). git diff --check czysty (poprzedni etap), src/ i gra/ bez zmian poza dokumentacja/testami: diff 6b67b256..HEAD to tylko tests/, dyspozycje/. Pelnego cargo test/clippy nie powtarzalem: NIE_ZMIERZONO przeze mnie, opieram sie na gate-*-r3.log (EXIT=0, 1272/0).

ROZSTRZYGNIECIE ZARZUTOW:
- Z1 NAPRAW. Obrona sama przyjmuje: economy.ts (329 linii diffu), production.ts (271), turn-economy.ts (259), work-tax.ts (77) nieprzeportowane po 3 rundach; dispatch zabrania uzasadniania budzetem i wymaga partii <=4. Audyt Obrony (4 hunki wykonalne: buildingWorkCost, food balance x3; cityYieldPerTurn/work-tax = nowy port) jest dobry, ale nie jest portem. Decyzja o zakresie cityYieldPerTurn/work-tax to ZAZALOZENIE: wchodza do zakresu (dispatch je wymienia), partiami <=4.
- Z2 ODDAL (zrobione w a45f46b1, d6d61847).
- Z3 ODDAL (K06 wykryta, potwierdzone przeze mnie).
- Z4 ODDAL (liczby skorygowane 5/4 w dossier). UWAGA formalna: pomiary-r3-a/b.log zawieraja tylko K01-K03,K08,K09; wyniki K04-K07 po R3 nie sa w logu (K06 potwierdzilem sam). NAPRAW w R4: dolozyc brakujace K04,K05,K07 do logu.
- Z5 ODDAL (6 testow costMult, K04/K05 wg Obrony wykryte; do potwierdzenia logiem, patrz Z4).
- Z6 ODDAL: 4 pliki p6_5b poprawione; p6_7a bez meta.pin; generator gen-p65b-vectors.mjs lezy w runs/R-RUSTPORT-P6-5B-.../ czyli POZA allowlista tego tematu. ZAZALOZENIE: R4 moze skopiowac generator do runs/R-RUSTPORT-REPIN-EKONOMIA-A-Q1/ z pinem 91dc998a.
- Z7 ODDAL: weryfikator Python modeluje logike edb8fb56, wiec jego wynik nie dowodzi 91dc998a; zastepczy dowod to regeneracja z git archive 91dc998a (4/4 bajt-w-bajt wg Obrony). None w replenish zgodne z webem wg Obrony (nie weryfikowalem NIE_ZMIERZONO).
- Z8 ODDAL: skalowanie_min martwe pole (tylko test ksztaltu p6_5b_tables.rs:44); usuniecie wymaga edycji istniejacego JSON poza allowlista. ZAZALOZENIE: pole zostaje, odnotowane w dossier.

WERDYKT: jeden NAPRAW (Z1, plus doprecyzowanie logu K04-K07 z Z4) -> FAIL. Nie jest to FAIL jakosci portu manpower (ten jest zaakceptowany), lecz niedomiar zakresu.
BLOKADY: brak technicznych.
RUNDY: 3/5 zuzyte; wraca do Operatora na runde 4 (potem Evaluator, Final Control).
NASTEPNY KROK (R4, Operator): port 4 hunkow production.ts:521->562 i turn-economy.ts:1645/1652/1685 (partie <=4, commit po kazdej, test + mutacja na kazdej nowej galezi); nastepnie R5: economy.ts/work-tax.ts partiami; uzupelnic log K04,K05,K07; wektory z weba 91dc998a. Realnie 2 rundy zostaly: jesli zakres cityYieldPerTurn/work-tax nie miesci sie w R5, orkiestrator decyduje o podziale na A-Q2 (LIMIT-5 wg kontraktu).
SHA DO INTEGRACJI: BRAK (temat nie jest PASS). Kolejnosc wzgledem origin/rust-port/parity-v2: gdy PASS, rebase na parity-v2 i integracja PRZED M06A5 nie jest wymagana; derived.rs dopisek na koncu, konflikt z M06A5 rozwiazuje orkiestrator. Na dzis nic do integracji.
DEPLOY/PUSH: NIE WYKONANO
