STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-REALPATH-TESTS-Q1
GOAL: domknięcie kryteriów (a)-(e): testy realnej ścieżki nowych źródeł księgi „Skąd zapasy”, zapis na realnym buildzie, rozmiar N=10, wycinka gracza.
ZMIANY/COMMIT: kandydat 9d55b8871da9997f1b348f1a27d1850d1668dbce (potomek bazy 119b6b23f i 2ee7214ff, `git merge-base --is-ancestor` = tak). Diff vs 119b6b23f: resource-ledger.ts (keepOwner), main.ts (hak ?civTest=1, funkcja transferCityToRebelFactionWithLedger, zapis tylko ludzi), tools/*ledger* (realpath-live, realpath-mutation, trade-test), raporty runs/. Wszystko w allowliście; `git diff --check` czysty.
TESTY (surowe wyniki, własne uruchomienie FC na 9d55b8871):
- npm ci exit 0; tsc --noEmit: 0 błędów
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6 (5 bramek referencyjnych zielone, brak czerwonych do porównania z bazą)
- resource-ledger 1030/0; engine 20/0 (linie FAIL w wyjściu to oczekiwane mutacje wewnętrzne); consume 30/0; trade 27/0; owner-delta 8/0; save-history 15/0; skad-dom 9/0; skad-ui 18/0
- vite build poza repo: OK
- realpath-live --part sources: 45/0; --part save: 8/0; --part size (30 tur): 4/0 (pole zapisu 16821 B = 16,4 KB, pamięć wszystkich 121882 B)
- --part size --turns 30,60: 3 passed, 1 failed (FAIL: endTurn timeout at turn 31) — test poprawnie czerwony, gdy pomiar nie jest wykonalny
- mutacje: m01-m16 oraz m09b ZABITE (17 z 18); m17 (bunt w pętli tury) PRZEŻYŁA — udokumentowana luka
Chromium: realne uruchomienie headless Chromium na buildzie vite (test realnej ścieżki).
ORZECZENIE ZARZUTÓW:
1. Rozmiar po ~60 turach NIE ZMIERZONO — ODDAL. Zarzut „zielony test bez pomiaru” naprawiony przez Obronę (asercja „każdy zadany pomiar osiągnięty”; domyślnie 30 tur; --turns 30,60 = czerwono, zweryfikowane). Pomiar do 60 jest zablokowany zwisem endTurn w turze ~31 (diagnoza endTurn wprost poza zakresem: część B). Dziennik jest pierścieniem N=10 ticków, nasyca się około tury 10, więc 16,4 KB (limit 50 KB) to rozsądny wniosek, ale nie pomiar: NIE ZMIERZONO.
2. Bunt w pętli tury bez testu realnej ścieżki — ODDAL. Pętla wywołuje tę samą funkcję transferCityToRebelFactionWithLedger co hak (jedno wywołanie; m17 przeżywa); realny test wymaga haka sterującego porządkiem publicznym w pętli tury, osobny temat. Księgowanie samej funkcji testowane realnie (m08 ZABITA).
3. Mutacje jednostronne — m09b (strona odbiorcy daru) dodana i ZABITA; druga strona przyłączenia ma asercje obu stron, ryzyko małe — ODDAL.
4. Testy realnej ścieżki poza automatyczną bramką — ODDAL (uwaga, nie wada kodu).
Żaden zarzut nie wymaga NAPRAWY w tej rundzie, więc brak FAIL.
Uwaga zachowania: zapis gry zawiera teraz dziennik tylko właścicieli-ludzi (karta czyta tylko człowieka); dziennik AI nie przeżywa zapisu/wczytania. Decyzja Operatora, udokumentowana, spójna z GOAL pkt 3.
BLOKADY: brak blokujących. NIE ZMIERZONO: rozmiar pola po 60 turach (zwis endTurn, część B).
RUNDY: Final Control po rundzie 2/5
NASTĘPNY KROK: integracja orkiestratora SHA 9d55b8871 (merge-tree z aktualnym origin/main 08b7f67b4; kandydat zmienia main.ts, możliwe konflikty), potem część B.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (1) zwis endTurn przy turze 31 w scenie pomiaru rozmiaru: część B; (2) kandydat na osobny temat: hak do testu buntu w pętli tury (m17); (3) origin/main jest już 08b7f67b4, nowszy niż baza 119b6b23f; (4) realpath-live-test nie jest w żadnej automatycznej bramce.
