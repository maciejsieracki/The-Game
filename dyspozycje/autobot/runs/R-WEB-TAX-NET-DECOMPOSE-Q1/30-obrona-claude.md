STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza ekonomii, zero zmian gry)
TEMAT: R-WEB-TAX-NET-DECOMPOSE-Q1 (tag TAXNET)
GOAL: rozłożyć 20 Podatku z zamiany 100 Żywności (Targowisko, kurs 0,2) na składniki i ocenić, czy netto +6 w skarbcu jest zgodne z intencją.
ZMIANY/COMMIT: dyspozycje/analizy/TARGOWISKO-NETTO-PODATEK-2026-11-27.md (wersja 2, poprawki wg zarzutów) oraz ten raport. Baza obrony: c4cbac45a. gra/src i gra/data bez zmian. Nowy runner gra/tools/taxnet-decompose-live.cjs NIE utworzono (patrz BLOKADY).
PODSTAWA: checkout --detach c4cbac45a, `git diff --name-only` w tej rundzie: tylko doc i raport.

ODPOWIEDZI NA ZARZUTY (1–6):
1. PRZYJMUJĘ. Brak biegu live i runnera rozkładu. Powód: brak haka odczytu składników (perCity.nauka, wealthState) w __settingsLive, a dispatch zakazuje zmian w gra/src bez decyzji orkiestratora. Składniki Nauki i Zamożności NIE ZMIERZONO.
2. PRZYJMUJĘ. Brak pomiarów na 2–3 ustawieniach stawek lub epok. Hak ownerRatesLive zwraca 4 / 8,8 w obu ramionach VLIVE3 (dane vlive3-targowisko-1tura-max-stdout.txt, linie "rates"), więc nie pokazuje wpływu podatku w kolejce i nie służy do rozkładu. Kolejne biegi wymagają nowego uruchomienia przeglądarki i decyzji o haku (§7 doc).
3. PRZYJMUJĘ. Błąd w doc §2.6 (wersja 1): mnożnik Wealth pochodzi z wt = advanceWealth(prevWealth, luksus, pieniądz) tego samego ticku (turn-economy.ts:3087-3102), a nie z samego prevWealth. Poprawiono. W mierzonej turze awansu nie ma (próg 4,5 × 2 × epoka ≥ 9 > pula po ticku), więc mnożnik = ×1 (wealth.ts:81, 133-135, 177-179). Dopisano też mnożniki macierzy cywilizacji (mul_proc, Rzymianie = 0 = neutralne, civ-matrix.json:818-826) i trasy (pieniadzZTras).
4. PRZYJMUJĘ. Wersja 1 podawała 6 jako wynik modelu. Poprawiono: model daje Skarb 5–7 (pula B − pula A = 19 lub 20 jednostek zależnie od ułamka puli bazowej A, suwak 30%). Składnik bazowy A = 1 nie został rozbity. Wynik 6 jest zgodny z modelem, nie wyprowadzony z pomiaru.
5. PRZYJMUJĘ (uchybienie procesowe, naprawione w tej rundzie). npm ci --ignore-scripts w gra/ (71 pakietów, 2,1 s). Wyniki z surowego wyjścia:
   - npx tsc --noEmit: rc 0 (plik: .../scratchpad/tsc-taxnet.txt)
   - node tools/logic-test.cjs: "LOGIC OK (213/213)", rc 0
   - node tools/ai-test.cjs: "ai-test: 297 passed, 0 failed", rc 0
   Ścieżka scratchpad: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/
6. CZĘŚCIOWO ODRZUCAM z dowodem: stała −30 pkt proc. na budynek jest w kodzie (economy.ts:1275 KORUPCJA_REDUKCJA_NA_BUDYNEK = 0,30; sufit economy.ts:1283 KORUPCJA_REDUKCJA_SUFIT = 0,60). Suwak Skarbu 60% (Nauka 30 / Skarb 60 / Zamożność 10) → 11 zweryfikowany aryt. metodą największych reszt (udziały z puli 19: 5,7 / 11,4 / 1,9; części całkowite 5 / 11 / 1; reszty 0,7 / 0,4 / 0,9 → +1 dla Zamożności i Nauki → Nauka 6 / Skarb 11 / Zamożność 2). Mennica ok. 8,2 używa wartości globalnej 1,38 (econ-params.json:648); wartość per cywilizacja NIE SPRAWDZONA, oznaczono w doc jako NIE ZMIERZONO / NIE SPRAWDZONO. Stąd nie odrzucam w całości: część „Mennica ok. 8,2" pozostaje założeniem.

TESTY:
- Bramki (w tej rundzie): tsc --noEmit rc 0; logic 213/213; ai-test 297 passed / 0 failed.
- Nowy bieg live: NIE WYKONANO (brak haka odczytu składników; zmiana hooka wymaga decyzji orkiestratora).
- Pomiar: tylko poziom hard (Trudny), suwaki domyślne, jedno miasto, bez Mennicy. Dane z VLIVE3 (bez nowego biegu).

BLOKADY:
- Rozkład składników (Nauka 11 / Skarb 6 / Zamożność 2) w żywej grze: NIE ZMIERZONO. Wymaga read-only haka w __settingsLive (perCity nauka, wealthState po turze), testowego pod ?civTest=1, bez wpływu na grę. DECISION_REQUIRED dla orkiestratora.
- Pula bazowa A nie rozbita.
- Poziomy inne niż hard, Mennica per cywilizacja, suwaki inne niż domyślne: wyliczenia z kodu, NIE ZMIERZONO.

DECISION_REQUIRED (jednozdaniowo, skutek dla gracza): czy Żywność zamieniona na Podatek ma trafiać do Skarbu zgodnie z suwakiem (dziś około 6 z 20 w tej turze, reszta do Nauki i Zamożności), czy mieć osobny, stały udział bezpośrednio do Skarbu.
Dodatkowa decyzja: zgoda na test-only hak odczytu (pod ?civTest=1) do pomiaru rozkładu składników.

RUNDY: 2/5 (runda 1 = c4cbac45a, runda obrony = ten raport)
WYNIK ANALIZY: 20 → Nauka 11 / Skarb 6 / Zamożność 2 (model z kodu, suma 19; 1 utracone na korupcji 1% i zaokrągleniu). Skarb z kolejki 5–7 w modelu, zmierzone 6. Zgodne z kodem i intencją (suwak, komentarze economy.ts:956-958, work-tax.ts:63/83). Brak rozjazdu z dokumentacją. Rozkład składników w grze NIE ZMIERZONO.
NASTĘPNY KROK: orkiestrator decyduje (a) czy zlecić hak odczytu składników i bieg live (test-only), (b) czy przekazać DECISION_REQUIRED z doc §7 właścicielowi jako pytanie ABC (wariant A zgodny z kodem obecnie).
UWAGI-DLA-ORKIESTRATORA: VLIVE3 zgłasza przerwany bieg ON w turze 12 (endTurnInProgress), poza zakresem tego tematu; kandydat na osobny temat (nie zakładano z tego poziomu). Pliki npm: gra/node_modules utworzono w worktree (npm ci --ignore-scripts), nieśledzone w git; do usunięcia przy sprzątaniu worktree.
DEPLOY/PUSH: NIE WYKONANO
