STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), dług testowy, bez zmian w gra/src
TEMAT: R-WEB-TEST-DEBT-MISC-Q5
GOAL: Spłata długu testowego (klasa A) bez zmiany zachowania gry.

ZMIANY/COMMIT: do integracji e8b5d621a (nad a3dbc6a5d; baza 45ea4b67a). Ten raport: commit na gałęzi r-debt-misc-q5-fc nad e8b5d621a.
Allowlista zweryfikowana samodzielnie: 7 plików gra/tools/*-test.cjs + dyspozycje/autobot/runs/R-WEB-TEST-DEBT-MISC-Q5/**. Zero zmian w gra/src, WERSJE.md, rust-port, src-tauri, battle. git diff --check OK.

TESTY (własne, e8b5d621a, npm ci --ignore-scripts, pierwszy plan):
- end-turn-modal-sequencing 41/0 EXIT=0
- growthmult-compound 24/0 EXIT=0
- barb-city-capture-cluster 97/0 EXIT=0
- spichlerz-wzrost 14/0 EXIT=0
- spichlerz-widocznosc 45/0 EXIT=0
- recruitment-no-upkeep-gate 37/0 EXIT=0
- koniec-tury-f1-f4-runda3 39/0 EXIT=0
Mutacja: economy-upkeep.ts:654 R_STAWKI_FALA2_MULT -> 1 : growthmult 17/7 EXIT=1; cofnięta (git status czysty). Mutacje evaluatora/obrony (koniec-tury, end-turn) przyjęte jako zgodne po dwóch niezależnych odtworzeniach.
NIE_ZMIERZONO przeze mnie: bramki niezmieniane (siege-tower-breach, cities-buildings, deposit-building-gate, g1-g2-runda4, hud-topbar, simple-food) - opieram się na gate-po-*.txt Operatora i uruchomieniu Obrony; tsc --noEmit tak samo.

WERDYKT ZARZUTÓW:
1-4 (allowlista, bramki, mutacje, brak osłabienia): ODDAL (potwierdzone).
5 (niezmierzone bramki): ODDAL - nie dotyczą zmienionych plików.
6 (stare liczby w komunikatach): ODDAL - literał w spichlerz-widocznosc naprawiony w e8b5d621a; reszta opisuje dane wejściowe.
7 (kruchość grep na main.ts): ODDAL - styl sprzed tematu, poza zakresem.
8 (baza vs origin/main): ODDAL, informacja dla integracji - Obrona nałożyła pliki na origin/main 037e6be36, 7/7 zielone; po integracji ponowić testy main.ts-zależne.
NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak (założenie: kanoniczne dane = obecne units.json/buildings.json).

BLOKADY: brak.
RUNDY: 3/5 (Operator, Obrona, Final Control)
NASTĘPNY KROK: integracja orkiestratora: cherry-pick/merge e8b5d621a (zawiera a3dbc6a5d) na origin/rust-port/parity-v2 lub main po origin/main 037e6be36; kolejność - dowolna względem parity-v2 (zmiany tylko w gra/tools), po scaleniu uruchomić 7 testów. Następnie READY_FOR_DEPLOY przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
