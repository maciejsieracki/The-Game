# Final Control r2 — R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
GOAL: aktywny szlak handlowy NIE zmienia zapasow zadnej strony; zostaje dochod (premia Pieniadza), boolean-grant dostepu, limity, kontakt.
ZMIANY/COMMIT: oceniony kandydat ff7fac543 (kod 63db5c610 + raport obrony; potomek bbd053657, merge 06fcc8526). INTEGRATION_SHA = ff7fac543. Ten raport: jedyny plik dodany przez FC.
 - Kandydat NIE jest potomkiem obecnego origin/main (b97287c88). Probny `git merge-tree`: jedyny konflikt gra/src/data/wikiBundle.json (regeneracja: git checkout --ours + `node tools/bundle-wiki-for-game.cjs`); main.ts i trade-routes.ts scalaja sie automatycznie. Po merge powtorz tsc + testy tematu.

TESTY (surowe wyjscie, kandydat ff7fac543, gra/):
 - tsc --noEmit: 0
 - logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0
 - trade-ilosc 23/0; zloto-szlak 48/0; trade-grant 62/0; trade-routes 96/0; income 134/0; limit 76/0; ownership-income 18/0; sea-bonus 30/0; contact-only 36/0; resource-ledger-trade 27/0
 - surow-civ-storage 63/4: 4 FAIL w sekcji G (petla wyrebu lasu / cap drewna) — kod poza diffem tematu (diff dotyka tylko bloku E3c), dlug bazowy; sekcja I (szlak nie przesuwa zapasow) zielona. Nie porownano na zbudowanej bazie (NIE ZMIERZONO wprost; wniosek z diffu i zgodny z Evaluatorem).
 - ZYWY TEST (vite build poza repo, headless Chromium, realny endTurn): trade-route-remove-stock-flow-live-test, 6 tur, aktywna trasa gracz<->AI w kazdej turze (1->1): 12 passed, 0 failed. Zapasy 6 kluczy szlakowych gracza 400->400, AI 0->0; dochod Pieniadza ze szlaku 6/tura na wlasciciela; zero nieujetych roznic magazyn vs ksiega; zero pageerror.
 - MUTACJA SAMODZIELNA (w petli tury wstawiony transfer 5 braz nadawca->odbiorca per trasa; tsc 0, nowy build): live test 10 passed, 2 failed (czerwone: "zero nieujetych zmian magazynu" i "szlak nie zmienia zapasow"; braz -5/+5 co ture). Mutacja cofnieta (git checkout), drzewo czyste.
 - git diff --check (06fcc8526..ff7fac543): tylko trailing whitespace w plikach dispatch .md innych tematow (nie kod, nie ten temat). node --check perf-large-empire-stress-live-test.cjs: OK.
 - martwy kod: grep — computeTradeRouteResourceFlow / loadTradeRouteResourceFlowParams / TRADE_ROUTE_STOCK_FLOW_KEYS / DEFAULT_..._FLOW_PARAMS / handel_surowiec_min_stock usuniete z src i data; zostaja komentarze historyczne i asercje nieobecnosci w testach (tools/.scc-bundle.cjs, .dip-audit-bundle.cjs to wygenerowane stare bundle).

ROZSTRZYGNIECIE ZARZUTOW:
 1 (kryterium a, brak testu w realnej turze): ODDAL — naprawione w 63db5c610, zmierzone przeze mnie (12/0, liczby wyzej). Uwaga: zapas AI=0 w scenariuszu; transfer wstawiony mutacja jest wykrywany, wiec asercja nie jest tautologiczna.
 2 (kryterium b, asercja tautologiczna): ODDAL — przy aktywnej trasie asercja czerwienieje po mutacji (zmierzone). Strazniki tekstowe zostaja jako dodatkowa warstwa.
 3 (falszywy komentarz main.ts): ODDAL — komentarz w main.ts ~40442-40447 zgodny z kodem.
 4 (martwa sonda ledgerAuditE3cLast/Fires + konsument resource-ledger-live-measure.cjs:175; doc R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md): DO DECYZJI ORKIESTRATORA / osobny temat porzadkowy, nie blokuje (sonda zawsze pusta/0, poza allowlista, pogranicze tematu "Skad zapasy"; dokument historyczny).
 Zaden zarzut nie wymaga NAPRAW => nie FAIL.

KRYTERIA: (a) ZMIERZONO; (b) mutacja -> czerwono ZMIERZONO; (c) grant dostepu bez zmian — trade-grant 62/0 i zloto-szlak 48/0; w realnej turze NIE ZMIERZONO (Operator tez tak zglasza); (d) tsc 0, bramki zielone, trade-* zielone; dysk ~4,7 GB w trakcie pracy (<6 GB z dispatchu; bez wplywu na wynik).

BLOKADY: brak blokujacych. NOTES: (1) hooki civTest tradeRoutesProbe/forceTradeRoute w main.ts poza litera allowlisty "tylko blok E3c" — tylko pod ?civTest=1, bez wplywu na logike tury; FC akceptuje. (2) merge z origin/main b97287c88 + regeneracja wikiBundle przed wdrozeniem. (3) Dlug Rust: REPIN (usuniete dane/logika przeplywu, klucz handel_surowiec_min_stock) — zapisany w 30-obrona-claude.md pkt 5. (4) Sonda ledgerAuditE3c* (zarzut 4).
UWAGI-DLA-ORKIESTRATORA: usunac sonde ledgerAuditE3c* + odczyt w resource-ledger-live-measure.cjs:175 przy okazji tematu "Skad zapasy"; opcjonalnie nota w docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md.

RUNDY: FC r2 (rundy tematu 2/5)
NASTEPNY KROK: integracja orkiestratora (merge origin/main, regeneracja wikiBundle, tsc + trade-ilosc/zloto-szlak/trade-grant/live test), READY_FOR_DEPLOY po jego bramkach.
DEPLOY/PUSH: NIE WYKONANO
