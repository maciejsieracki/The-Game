STATUS: FAIL
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-ENDTURN-AI-PHASE-Q1
GOAL: JS konca tury (137 miast / 321 jednostek) >= 2x nizej niz 55e098dc5 - NIE osiagniety, NIE zmierzony.
ZMIANY/COMMIT: kandydat R2 aa9d5d1cea0941d299d1fc4698821ac7d49609a3 (rodzic 24186ef52). Diff do allowlisty: resource-access.ts, nowy test, runs/** - OK (bez render/, gra/data, WERSJE.md, rust-port). Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0): merge-base f4c89d008, merge-tree bez konfliktow; integrowac PO parity-v2, ale dopiero po R3 - obecny SHA nie nadaje sie do integracji.
WERDYKT ZARZUTOW:
1. GOAL niezmierzony - NAPRAW (R3, srodowisko z Chromium).
2. Brak profilu CDP top-15 / tabeli udzialow (warunek d dispatchu) - NAPRAW (R3).
3. Jedna naprawa, reszta nieruszona; tyAll (FC nr 8) bez testu dynamicznego - NAPRAW (R3, po profilu).
4. Mikro-benchmark syntetyczny - ODDAL jako zarzut samodzielny (wchodzi w pkt 5).
5. NOWE (dowod wlasny): getResourceAccessForCity nie ma zadnego wywolania w gra/src (grep: tylko definicja i komentarze). Zmiana R2 to martwa optymalizacja, efekt na koniec tury = 0. Goracy wolajacy: gra/src/main.ts:3391 (empireActiveResourceLabelsForOwnerRaw) uzywa getCityResourceAccessForCity i czyta tylko .active - to wlasciwy cel; main.ts:8119 (panel miasta) czyta .potential, nie ruszac. NAPRAW: przelaczyc main.ts:3391 na wariant tylko-active (main.ts w allowliscie); udzial potwierdzic profilem (wynik cache'owany per owner).
6. Regresje/hashe war-allin przyjete z logow (pre-existing 11 FAIL, identyczne baza/kandydat) - ODDAL.
Samodzielnie: diff i grep zweryfikowane; testow nie powtarzano (FC nie zmienia kodu). Wyniki Operatora/Obrony: tsc EXIT=0, equiv 300 przypadkow/0 roznic, 3/3 mutacje.
DECYZJA PRODUKTOWA: brak.
BLOKADY: brak Chromium w srodowisku Operatora (INFRA); R3 musi isc tam, gdzie jest przegladarka i zapis duzej gry.
RUNDY: 2/5
NASTEPNY KROK: R3 (Operator): main.ts:3391 na active-only, profil CDP top-15 z tabela udzialow, A/B/A/B n>=5, naprawa dominujacych.
DEPLOY/PUSH: NIE WYKONANO
