STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-MARCH-BEFORE-40-Q1
GOAL: Przed turą 40 kontekst wojenny/marsz AI otwarty tylko dla pary w aktywnej wojnie epoki Brązu/Żelaza; Kamień i zwykłe wojny zablokowane (R1).
ZMIANY/COMMIT: kod e4ebfc035 (baza 5dd53e60f = merge-base z origin/main; origin/main = 9733ea8b0, ahead tylko o tools-only TEST-DEBT-B). Allowlista zachowana: war-rules-multiwar.ts, main.ts, war-rules-multiwar-main-guard-test.cjs, nowy era-war-march-before-40-test.cjs, raport runu. git diff --check czysty.
TESTY (powtórzone przez FC; tsc przez cudzy node_modules, tymczasowo podlinkowany i usunięty):
- era-war-march-before-40-test: 18 OK / 0 FAIL
- war-rules-multiwar-test: 57 OK / 0 FAIL
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- era-war-delays-test: 41 OK / 0 FAIL
- logic-test: LOGIC OK (213/213)
- tsc --noEmit: z pożyczonym TS/vite błędy wyłącznie środowiskowe (filePlayer, baseUrl); w zmienionych plikach i funkcjach 0 błędów. exit 0 potwierdzone przez Operatora i Obronę przy własnym npm ci.
- NIE_ZMIERZONO: war-rules-multiwar-live-test (timeout), ai-test, war-allin-capital-test (znane 2 FAIL bazy; ai.ts niezmieniony).
ZARZUTY:
1. Brak testu behawioralnego warAllInContextFor (wiring regex): ODDAL. Dispatch: "jeśli możliwe"; predykat testowany na realnym kodzie N-1/N/N+1; przegląd potwierdził, że engage filtruje cele w buildWarCityTargets (ai-war-target-select.ts:51), więc zawężenie działa; luka odnotowana.
2. Live test niezmierzony: ODDAL jako notatka (r1Closed=false => engage bez zmian dla tury >=40 i barbarzyńców). Zalecenie: uruchomić live test rozbity ON/OFF poza limitem 590 s przy ERAWARLIVE.
3. Wojna epoki z graczem otwiera marsz AI przed 40: ODDAL, zgodne z GOAL (po tagu pary); brak decyzji produktowej.
NAPRAW: brak.
BLOKADY: brak.
RUNDY: 1/5, werdykt PASS-WITH-NOTES
NASTĘPNY KROK: integracja orkiestratora (merge e4ebfc035 do main; main.ts współdzielony z innymi tematami, sprawdzić konflikty), potem deploy ROBOCZA w FALA 548 po osobnej autoryzacji. Względem origin/rust-port/parity-v2: niezależne (zmiana wyłącznie webowa gra/); parity-v2 nie blokuje i nie jest blokowane; dług REPIN Rust: odzwierciedlić isWarMarchOpenForPair.
DEPLOY/PUSH: NIE WYKONANO
