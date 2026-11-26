# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Kod gry: gra/src/main.ts (truceEndPorts, enqueueTruceEndOffer, truceEndWindowFor, settleTruceEndPrice, humanPeaceRejectReason, port transferBasketItems), gra/src/game/diplomacy-peace-lock.ts (truceEndTickPair, truceEndToWarCore, truceEndAiAccepts, truceEndWindowOpen), gra/src/game/diplomacy-truce-end-price.ts (truceEndPriceRule, pickTruceEndSettlementPlan, executeTruceEndSettlement). Istniejące testy czystych funkcji: gra/tools/truce-end-peace-price-test.cjs (72/0), truce-end-window-test.cjs, truce-end-settle-exec-test.cjs, war-limit-truce-count-test.cjs — NIE pokrywają okablowania w main.ts (FC TRUCEPRICE/2/3: „test okablowania jest tylko źródłowy / brak testu okablowania main.ts”). Wzorzec testów okablowania: gra/tools/alliance-label-clean-test.cjs, break-treaties-status-test.cjs (wycinanie ciała funkcji z main.ts i wykonanie w new Function lub dopasowanie kotwic).
## Zadanie
1. Zmapuj węzły okablowania (tabela: węzeł | linia main.ts | co woła | co ustawia).
2. Napisz gra/tools/truce-end-main-wiring-test.cjs: dla każdego węzła — wykonaj ciało funkcji wycięte z main.ts na atrapach portów (preferowane nad regexem), sprawdź efekty: oferta trafia do kolejki gracza/AI, cena 0 → opłata symboliczna 1 Pn (klucz pokojPoRozejmie.minimalnaOplataSymbolicznaPn), płatnik zgodny z regułą (≤20%: przegrywający surowcami; >20%: słabszy płaci miastem, a surowcami gdy brak cedowalnego), flaga forbidden (stolica/ostatnie miasto) wyklucza miasto, przelew koszyka przez transferBasketItems po obu stronach, wygaśnięcie oferty po 1 turze = wojna trwa.
3. Mutacje czerwone (min. 8): usunięcie wywołania enqueueOffer, zamiana payer/receiver, pominięcie transferBasketItems, brak filtra forbidden, brak opłaty symbolicznej przy cenie 0, zła kolejność declareWarAfterTruce/finalizePeace, pominięcie wygaśnięcia, port finalizePeace bez wywołania. Każda mutacja na kopii main.ts (nie git checkout).
4. Test live w przeglądarce (okno propozycji gracza po rozejmie): jeśli Chromium stabilny w 2 próbach — zrzut i odczyt; w przeciwnym razie NIE ZMIERZONO z opisem (SIGSEGV ≠ błąd gry).
5. Jeśli test ujawni rzeczywisty błąd gry — NIE poprawiaj kodu gry, wpisz do raportu (UWAGI-DLA-ORKIESTRATORA) z minimalnym odtworzeniem.
## Allowlista
nowy gra/tools/truce-end-main-wiring-test.cjs, dyspozycje/analizy/TRUCETEST-2026-11-26.md (tabela węzłów), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-TRUCE-WIRING-Q1/**. Zero zmian gra/src i gra/data.
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-limit-truce-count 19/0; truce-end-peace-price 72/0; truce-end-window; truce-end-settle-exec; nowy test zielony z mutacjami czerwonymi. Zacommituj i zwróć SHA.
## Binarne kryterium
Test wiąże i wykonuje węzły okablowania; ≥8 mutacji czerwonych; zero zmian gra/src; bramki zielone; live wykonane lub jawnie NIE ZMIERZONO.
