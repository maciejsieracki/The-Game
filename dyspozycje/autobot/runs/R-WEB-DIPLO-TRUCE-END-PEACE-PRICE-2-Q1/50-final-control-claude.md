STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1
GOAL: (1) pokój gracza po rozejmie przyjmowany przez AI wg truceEndPriceRule; (2) płatność settleTruceEndPrice pokryta testem wykonawczym; (3) cena 0 -> brak oferty, wpis "Rozejm wygasł, wojna wraca".
ZMIANY-COMMIT: kandydat b49a48566 (baza 8ad1d555dd210a29256de5da60979e2b26c79370; merge-base --is-ancestor: TAK). git diff --stat: 7 plików, +395/-12: runs/10-operator-claude.md, runs/30-obrona-claude.md, diplomacy-peace-lock.ts (+6), diplomacy-truce-end-price.ts (+18), main.ts (17), truce-end-peace-price-test.cjs, nowy truce-end-settle-exec-test.cjs. Allowlista: wszystkie pliki w allowliście (brak diplomacy-proposals.ts / diplomacy-pn-engine.ts / gra-robocza / WERSJE.md).
TESTY (własny przebieg, surowe wyjście): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-test 297/0; diplo-truce-impl 93/0; truce-end-peace-price 62/0; truce-end-settle-exec 30/0; truce-end-war-notice PASS; war-limit-truce-count 19/0; diplo-human-peace-no-war 13/0; diplo-war-tribute-once 8/0; war-rules-multiwar-main-guard 21/0. NIE ZMIERZONO: żywa gra, ścieżka pokoju gracza w negocjacjach.
OCENA ZARZUTÓW:
- #1 TRAFNY (decydujący): pkt (1) niezrealizowany; kod nie wpina rachunku w propozycję pokoju gracza (case 'pokoj' w diplomacy-proposals.ts, pole okna w diplomacy-pn-engine.ts) — pliki poza allowlistą, co Operator słusznie zgłosił jako BLOCK zamiast rozszerzać zakres. Binarne kryterium "(1)-(3) spełnione" niespełnione.
- #2 trafny częściowo, obrona wystarczająca: dodano przypadek płatnika ME()=0; wykonanie przez executeTruceEndSettlement (transfer raz, tylko gdy plan ma pozycje); realny transferBasketItems nadal tylko tsc + regex wiringu (ograniczenie, nie blokada).
- #3 AI↔AI: odrzucenie obrony zasadne (gałąź w bloku isHuman, test d0b); NaN quotePn traktowane jako cena 0 = ZAŁOŻENIE/zmiana zachowania (test d0c) — do wiadomości właściciela przy edge-temacie.
- #4 nietrafny jako wada: zmiana asercji wiring koduje zmianę kontraktu, pickTruceEndSettlementPlan nadal wołana w executorze; nie osłabienie.
BLOKADY: pkt (1) wymaga edycji plików spoza allowlisty; decyzja domyślna A (cena 0 = wojna) niepotwierdzona przez właściciela.
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: orkiestrator: (a) rozszerzyć allowlistę o gra/src/game/diplomacy-proposals.ts i diplomacy-pn-engine.ts i wystawić rundę 3 na pkt (1) (baza b49a48566), albo (b) wydzielić pkt (1) do nowego tematu, a pkt (2)-(3) z b49a48566 zintegrować jako PASS-WITH-NOTES (kod pkt 2-3 poprawny, bramki zielone, pokoje poza oknem bez zmian). Rekomendacja: (b) tylko jeśli właściciel akceptuje niepełny GOAL; inaczej (a).
UWAGI-DLA-ORKIESTRATORA: node_modules zainstalowano (npm ci --ignore-scripts) i usunięto po bramkach; pliki tymczasowe gra/tools/.truce-end-*.cjs powstają przy przebiegu testów mutacyjnych (nieskomitowane).
DEPLOY/PUSH: NIE WYKONANO
