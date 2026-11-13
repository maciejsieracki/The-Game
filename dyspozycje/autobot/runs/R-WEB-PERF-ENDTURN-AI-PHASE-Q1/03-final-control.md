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

---
## RUNDA 3/5 - Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-ENDTURN-AI-PHASE-Q1
GOAL: JS konca tury >= 2x nizej: NIE osiagniety, zmierzone 1,25x (mediana 5693 -> 4571 ms, n=9/9, load 3,9-9,6, rozrzut par 1,03-1,67x). Dopuszczone przez dispatch R2(d)/R3(c) jako PASS-WITH-NOTES. Wyniku NIE traktowac jako potwierdzonego przyspieszenia (slaba moc statystyczna, wspoldzielony host).
ZMIANY/COMMIT: SHA kodu do integracji: 99272adf8348d7cf518f03c714a73f4884dc1ca1 (rodzic 3f09ecd81 kandydat Operatora, baza eeb668b72). Allowlista: main.ts, okolica.ts, units/setup.ts, 3 testy w gra/tools, runs/** - OK; zero zmian w render/, data/, WERSJE.md, rust-port, src-tauri, ai*.ts. Commit FC dokłada tylko ten plik raportu.
Kolejnosc: merge-base z origin/rust-port/parity-v2 = f4c89d008; merge-tree bez konfliktow. Integrowac PO parity-v2 (merge na parity-v2, potem ponowne bramki).

ROZSTRZYGNIECIE ZARZUTOW:
1. GOAL 1,25x - DO DECYZJI ORKIESTRATORA (nie FAIL): akceptacja PASS-WITH-NOTES zgodnie z dispatchem; osobny temat render/HUD (syncUnitsRender, renderLoop, syncStatChips ok. 2 s).
2. visibleDiskKeys - ODDAL: obrona dodala test wartosciowy (400 stanow, 0 roznic, mutacje wykryte) i obnizyla limit do sight<24. Moj pomiar pamieci (3000 wpisow): sight 3 = 2,8 MB, 6 = 6,5 MB, 10 = 6,8 MB, 20 = 22,5 MB; realne promienie <= ~10 -> kilka MB. NIE_ZMIERZONO: sam blok w boot() (test na kopii 1:1).
3. Baza testu = HEAD - ODDAL (naprawione BASE_REF, domyslnie eeb668b72; potwierdzone: 0 roznic, 4 mutacje wykryte).
4. Resztki /tmp - ODDAL: nie dotyczy repo; katalogi naleza do innych tematow.
5. Numeracja linii 8119/8132 - ODDAL (szum).
Brak zarzutu NAPRAW.

TESTY (wlasne, na 99272adf8):
- tsc --noEmit EXIT=0
- logic-test 213/213 EXIT=0
- ai-test 274 passed / 20 failed EXIT=1; zbior linii FAIL identyczny z gate-ai-test-def-r3.txt i bazą
- perf-endturn-r3-equiv-test: collator 23994/0, assignWorkedTiles 220/0, sibling 1320/0, path/reachable 240/0; mutacje 191/440/163/229 wykryte; EXIT=0
- perf-endturn-r3-visdisk-test: PASS, mutacja kolizji 26 roznic, EXIT=0
- NIE powtarzano: A/B, profil CDP, hashe war-allin, 87 testow regresji (wg logow Operatora: hash d28c8b7ffce7a3ec identyczny, 15 tych samych FAIL na bazie i kandydacie).

BLOKADY: brak (NIE_ZMIERZONO jak wyzej).
RUNDY: 3/5
NASTEPNY KROK: orkiestrator - integracja 99272adf8 po parity-v2 z ponownymi bramkami; decyzja o temacie render/HUD konca tury.
DEPLOY/PUSH: NIE WYKONANO
