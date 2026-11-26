# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 — Final Control (Sonnet 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1
GOAL: po wygaśnięciu rozejmu AI składa ofertę pokoju z ceną, pokój nie jest za darmo, odmowa = wojna.
ZMIANY/COMMIT: kandydat b0f909f5d140f87e3bcf2430fa8b36a23552f5c0; baza e70abe718fc962b4d87f3c154dd58e2c2f7f49de jest przodkiem (merge-base --is-ancestor = tak). 8 plików (+862/-105): diplomacy-truce-end-price.ts (nowy), diplomacy-peace-lock.ts, main.ts, truce-end-peace-price-test.cjs (nowy), diplo-truce-impl-test.cjs, truce-end-war-notice-test.cjs, 10-operator, 30-obrona. Wszystko w allowliście; brak gra-robocza/WERSJE/rust-port.

TESTY (własne, surowe wyjścia): tsc --noEmit exit 0; truce-end-peace-price 54 PASS/0 FAIL; diplo-truce-impl 93/0; truce-end-war-notice PASS; diplo-human-peace-no-war 13/0; diplo-war-tribute-once 8/0; war-rules-multiwar-main-guard 21/0; logic 213/213; tech-tree 20/0; research 33/0; combat 6/6; unit-replace 21/21; ai-test 297/0; diplo-truce-n6-saveload 8/0; r1 31/0; r4-ai 24/0; until-turn 15/0; war-limit-truce-count 19/0; diplomacy-war-limit-unit 57/0.
Własne mutacje na pickTruceEndSettlementPlan: zdjęcie bramki ceny<=0 -> 50 PASS/4 FAIL (M-FREE czerwony); zdjęcie bramki plan.full -> 50/4 (M-FULL czerwony). Pliki przywrócone.

OCENA ZARZUTÓW (bez etykiet ról):
1 (płatność nietestowana wykonawczo) — wybór planu wydzielony do czystej funkcji pokrytej mutacjami; sam przelew (transferBasketItems w main.ts) nadal bez testu wykonawczego: ODDAJ (uwaga).
2 (oferta bez ceny) — naprawione, treść niesie kierunek, walutę i wartość: OK.
3 (pkt 6: pokój proponowany przez gracza po rozejmie) — NIE zrobione; idzie ogólną ścieżką evaluateProposal. Nie wchodzi w kryteria (a)-(f) ani w warunek "brak pokoju za darmo" po stronie oferty AI: ODDAJ jako osobny temat (wymaga definicji "stanu po rozejmie").
4 (pokój za darmo przy cenie 0) — naprawione (cena<=0 = wojna), test + mutant M-FREE. ZAŁOŻENIE do potwierdzenia.
5 (brak cedowalnego miasta) — naprawione wg założenia dispatchu pkt 4 (wariant surowcowy), mutant M-FALL.
6 (zgoda gracza jako płatnika nietestowana live) — truceEndAcceptCore testowany atrapami; live Chromium NIE ZMIERZONO: ODDAJ.

BLOKADY: brak blokujących. Uwagi: (i) przy cenie 0 oferta i tak trafia do skrzynki gracza, a akceptacja kończy się wojną (zły UX; cenę 0 trzeba wykryć przy składaniu oferty) — osobny temat; (ii) płatność gracza bez środków = wojna bez kary (zgodne z dispatchem).
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: orkiestrator: integracja b0f909f5d + ten raport; osobne tematy: pkt 6 (pokój gracza po rozejmie), oferta przy cenie 0, test wykonawczy przelewu; testy live NIE ZMIERZONO; pytanie ABC (język skutku dla gry) o założenia: cena 0 = wojna, wariant surowcowy gdy brak cedowalnego miasta.
UWAGI-DLA-ORKIESTRATORA: patrz BLOKADY (i) i NASTĘPNY KROK.
DEPLOY/PUSH: NIE WYKONANO
