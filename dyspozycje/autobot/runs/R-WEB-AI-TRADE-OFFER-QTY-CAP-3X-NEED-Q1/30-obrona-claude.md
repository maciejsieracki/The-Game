STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1
GOAL: ilość odbioru AI w ofercie handlowej do gracza = min(nadwyżka gracza, 3 × potrzeba AI); stały sufit iteracji w pętli ilości; mnożnik i sufit w ai-params.json; uczciwość wyceny, cooldown 15 i limit 1 oferty bez zmian.
BAZA: kandydat c754ccaf4 (rodzic 45ded9579; origin/main 08b7f67b4 nie zmienia plików tematu). Kod źródłowy NIE zmieniony w tej obronie; zmiana tylko w testach i raporcie.

ODPOWIEDZI NA ZARZUTY EVALUATORA (3b2cb46d8):
- Z1 (okno ±3 kroki estymaty, ryzyko dla wyceny blokowej #416): ODRZUCAM jako regresję, PRZYJMUJĘ jako notę ryzyka. Dowód: w gra/src/game/ai-trade-proposal.ts `giveSet = new Set(giveQtys)` i dopiero potem dokładane są kandydaty z okna; okno tylko DODAJE kandydatów, więc nie usuwa żadnego kandydata, który sama lista by znalazła. Ograniczenie gęstości (lista ≤64 na oś) to kompromis zaakceptowany przez właściciela (dispatch: „stały sufit”). Wycena blokowa (#416) NIE ZMIERZONA w tej rundzie.
- Z2 (brak testu chroniącego estymatę): PRZYJMUJĘ. Dodano sekcję G do gra/tools/ai-trade-qty-cap-test.cjs (G0 oferta znaleziona, G1 oferta uczciwa |oddanie − 600×odbiór| ≤ 5, G2 odbiór = 30). Cena liniowa 600:1, gate |g−r| ≤ 5, zapas 1e9, nadwyżka 1000, potrzeba 10. Mutacja (`if (false && k >= 1 ...)` w oknie estymaty): qty-cap G0/G1/G2 FAIL (15 passed, 3 failed). Po przywróceniu: 18 passed, 0 failed.
- Z3 (osłabiona asercja A2 need-from-surplus): PRZYJMUJĘ jako notę dla FC; zmiana uzasadniona. Stara A2 („ściśle rosnąco”) kodowała semantykę FALI 730 (odbiór = cała nadwyżka), którą decyzja właściciela 3× zastępuje sufitem. Dowód czułości (odtworzony): zdjęcie sufitu 3× (`feasibleReceiveMax = receiveMax`) → ai-trade-need-from-surplus-test 11 passed, 1 failed; ai-trade-qty-cap-test 15 passed, 3 failed. Po przywróceniu: need-from-surplus 12/0, qty-cap 18/0.
- Z4 (bench stubowy, 57 ms zimne): PRZYJMUJĘ. Zmierzono porównanie przed/po na tym samym benchu (bench przyjmuje ścieżkę modułu). Pomiary na stubowej wycenie (cena = surowa ilość), NIE czas w grze. Realnej wyceny NIE mierzyłem; liczby 0,05–0,12 ms z zarzutu cytuję jako raport Evaluatora, NIE ZWERYFIKOWANE przeze mnie.
- Z5 (docs/encyklopedia, wikiBundle nie regenerowane): ODRZUCAM jako wymóg. Dowód: grep „nadwy” w docs/encyklopedia trafia tylko w „nadwyżkę pracy” (ulepszenia); gra opisu oferty AI nie zawiera. docs/encyklopedia/pojecia/handel-surowcami-dyplomacja.md opisuje handel z miastami-państwami i koszyk PN, nie ilość oferty cyklicznej AI→gracz. Regenerację wikiBundle zostawiam FC jako decyzję.
- Z6 (mgla-sciezka-inwariant 41/1, json-descriptions-sync 17/2): ODRZUCAM jako zarzut wobec tematu. Dowód: git diff --stat 45ded9579 c754ccaf4 nie obejmuje ai.ts ani testu mgla. NIE ZMIERZONO tych dwóch testów na czystym 45ded9579 w tej obronie.
- Z7 (dług Rust REPIN): PRZYJMUJĘ jako notę dla orkiestratora (patrz UWAGI). Kodu Rust nie zmieniano.

ZMIANY-COMMIT: gra/tools/ai-trade-qty-cap-test.cjs (sekcja G, +27 linii) oraz ten raport. Allowlista zachowana.

POMIAR CZASU (bench gra/tools/ai-trade-qty-cap-bench.cjs, stub wyceny, surowe wyjście):
- kandydat c754ccaf4: Z=20000 czas=7.1 ms, wywołania bramki=4001, receiveQty=5; Z=100000 czas=5.2 ms, wywołania bramki=4001, receiveQty=5
- baza 45ded9579: Z=20000 czas=15.2 ms, wywołania bramki=19996, receiveQty=5; Z=100000 czas=39.5 ms, wywołania bramki=99996, receiveQty=5
- Wniosek: liczba wywołań bramki przestaje rosnąć z zapasem (4001 zamiast 19996/99996). Czas w stubie jest niski i szumny; nie traktować jako pomiaru w grze.

TESTY (surowe wyniki z tej obrony, katalog gra/):
- npx tsc --noEmit: EXIT 0 (0 błędów)
- node tools/ai-trade-qty-cap-test.cjs: 18 passed, 0 failed
- node tools/ai-trade-need-from-surplus-test.cjs: 12 passed, 0 failed
- node tools/ai-trade-oneshot-overpay-limit-test.cjs: 10 assertions passed
- node tools/ai-trade-proposal-branch-test.cjs: 10 passed, 0 failed
- node tools/ai-trade-proposal-to-player-test.cjs: 25 assertions passed
- git diff --check: czysto (brak wyjścia)
- mutacje: okno estymaty off → qty-cap 15 passed, 3 failed; zdjęcie capu 3× → qty-cap 15/3 FAIL, need-from-surplus 11/1 FAIL; po cofnięciu zielono.
- NIE ZMIERZONO w tej rundzie: ai-trade-wiring-e2e-live-test (Chromium; Evaluator podał timeout 200 s, Operator r2 podał 46/0 — niezweryfikowane przeze mnie), bramki referencyjne (kod źródłowy nie zmieniony od rundy operatora; nie powtarzane), mgla-sciezka-inwariant i json-descriptions-sync na bazie.

BLOKADY:
- Brak blokad po stronie kodu.
- Wycena blokowa (#416) i realny pomiar czasu w grze: NIE ZMIERZONO.
- E2E live Chromium: NIE ZMIERZONO w tej obronie.

RUNDY: 3/5 (r1 FC PASS-WITH-NOTES na 9d515ae76, konflikt przy integracji; r2 port na origin/main c754ccaf4, Evaluator PASS-WITH-NOTES; obrona r3 = ten raport).

UWAGI-DLA-ORKIESTRATORA:
- Dług Rust REPIN: ai-params.json dodaje klucze propozycja_wymiany_surowcow_ilosc_mnoznik_potrzeby (3) i propozycja_wymiany_surowcow_sufit_iteracji (64); do zaplanowania po wdrożeniu.
- Ryzyko przy integracji z #416 (TRADE-ERA): okno estymaty zakłada prawie liniową wycenę; przy blokach 10/50/100 może nie objąć uczciwej oferty. Okno tylko dodaje kandydatów (nie zabiera), ale jakość przy blokach trzeba zmierzyć po merge z #416.
- ai-trade-qty-cap-test ma teraz 18 asercji (sekcja G); FC do potwierdzenia zgodności G z oczekiwaniem właściciela.
- Sprzątanie: gra/node_modules zainstalowane na potrzeby testów w worktree; usunięte po commicie.

NASTĘPNY KROK: Evaluator (SONNET) r3 na commicie obrony; ewentualnie ai-trade-wiring-e2e-live-test przy FC, jeśli dostępny czas.
DEPLOY/PUSH: NIE WYKONANO
