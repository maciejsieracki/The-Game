STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1
GOAL: po kapitulacji obleganego miasta oblegajaca armia wchodzi na heks miasta.
ZMIANY/COMMIT: weryfikowano cbb6a122a3b282cb95805b4f5021be980a6c55aa (rodzic b4a97ae4b, baza c4a541a27). Allowlista OK: gra/src/main.ts (+7), nowy gra/src/game/siege-enter-city.ts, nowy gra/tools/siege-surrender-enter-city-test.cjs, runs/<ID>/**. Brak WERSJE.md, ai.ts, rust-port, gra-robocza. git diff --check czysty.
TESTY (odtworzone przez FC): nowy test 32 OK / 0 FAIL EXIT=0; tsc --noEmit EXIT=0. node_modules usuniety.
WERDYKTY ZARZUTOW:
1. Brak Chromium/integracji resolveSiegeSurrender: ODDAL do orkiestratora (wykonac lub swiadomie zaakceptowac przed READY_FOR_DEPLOY); nie jest wada kodu.
2. Obca/sojusznicza jednostka blokuje wejscie: ODDAL (konserwatywne, po kapitulacji nieosiagalne, utrwalone testem).
3. Tylko jednostki z oblegaCityId: ODDAL (dosłowna tresc dispatchu).
4. Czerwone barb-city-capture-cluster / siege-tower-breach-everywhere: ODDAL (dlug poprzedzajacy, identyczny na bazie).
Zero NAPRAW. Brak DO DECYZJI CZLOWIEKA.
INTEGRACJA: origin/main = 488d94364 (ahead of base o 2 linie main.ts); git merge-tree cbb6a122a z origin/main -> czyste scalenie bez konfliktow. Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0, merge-base f4c89d008): web idzie do main niezaleznie; parity-v2 wymaga pozniej REPIN Rust (kapitulacja/oblezenie) po wdrozeniu -- web NAJPIERW, parity-v2 PO.
BLOKADY: brak. NIE_ZMIERZONO: Chromium ?civTest=1.
RUNDY: Final Control 1/5
NASTEPNY KROK: integracja orkiestratora cbb6a122a (cherry-pick b4a97ae4b+cbb6a122a lub merge) na origin/main, ponowna bramka tsc+test, potem READY_FOR_DEPLOY po decyzji ws. Chromium.
DEPLOY/PUSH: NIE WYKONANO
