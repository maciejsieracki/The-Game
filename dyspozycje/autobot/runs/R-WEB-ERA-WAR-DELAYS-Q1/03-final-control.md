STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-DELAYS-Q1
GOAL: Kamień za bramką R1 (tura 40); Brąz i Żelazo 20 tur od wejścia ownera w epokę, bez R1; zwykłe wypowiedzenie pod R1.
ZMIANY/COMMIT: oceniono 4878ff5cf (kod 2e37619e5, baza a8823b16b). Diff do allowlisty: czysty (JSON, war-rules-multiwar.ts, forced-war-bronze/iron.ts, main.ts, 4 istniejące testy, nowy era-war-delays-test.cjs, katalog runu). Zero zmian w gra-robocza, WERSJE.md, rust-port, forced-war-stone.ts, ai.ts. git diff --check czysty.
TESTY (odtworzone przez FC po npm ci, node_modules usunięte): tsc --noEmit 0; era-war-delays 41/0; forced-war-bronze 48/0; forced-war-iron 55/0; multi-turn-simulation 48/0; main-guard 21/0; war-rules-multiwar 57/0; era-war-all-eras 10/0; era-war-ignore-treaties 22/0; logic-test 213/213; ai-test 274/20 (= baza). Dowód w pętli main.ts w grze: NIE_ZMIERZONO.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Komentarze "25 tur" w forced-war-bronze/iron: ODDAL (poprawione w 4878ff5cf, zweryfikowane diffem).
2. Headless F1/F2 używa lokalnego filtra puli, nie main.ts: ODDAL (znane ograniczenie, wymagałoby eksportu z main.ts; okablowanie pokryte regexem main-guard i przeglądem diffu FC: wszystkie trzy pule mają `era`, eraTag w bramkach poprawny).
3. warAllInContextFor (main.ts 33417-33418) zwraca undefined dla AI przed turą 40: DO DECYZJI CZŁOWIEKA (orkiestrator/właściciel). Wojna Brązu/Żelaza wybucha po 20 turach, ale mechanika all-in (marsz na stolicę) startuje od tury 40; poza tym AI działa dotychczasową logiką. To decyzja produktowa, nie błąd tego tematu; ewentualny osobny temat.
Zero zarzutów NAPRAW.
BLOKADY: brak.
RUNDY: 2/5 (FC po rundzie 2)
NASTĘPNY KROK: integracja orkiestratora: merge 4878ff5cf (lub gałęzi web-wip/eradelay-r1) do main. Kolejność względem origin/rust-port/parity-v2 (f97001337): brak zależności i konfliktów (zmiany tylko w gra/ i runie, rust-port nietknięty); dowolna kolejność. Po integracji REPIN ai/war-params w Rust jest długiem (nowe klucze eraForcedWarStartTurnsFromEra, eraForcedWarIgnoreR1).
DEPLOY/PUSH: NIE WYKONANO
