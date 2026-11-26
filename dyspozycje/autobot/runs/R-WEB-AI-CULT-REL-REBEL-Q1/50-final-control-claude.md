STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-REBEL-Q1 (AICULTREBEL)
GOAL: wyjaśnić liczbami i kodem, dlaczego przy „Kultura i religia: trudny” miasta AI w buncie skrajnym nie przechodzą w rebelię; tylko diagnoza, zero zmian reguł.
ZMIANY/COMMIT: kandydat f7c0ffa045744117e977aa6cf2d4deabb5028502 (baza 0e4790cd14dc0f83adc3da30aa641b8333a349b4; `git merge-base --is-ancestor` = TAK). `git diff --stat` baza..kandydat: 5 plików, +318/-2: gra/src/main.ts (+19/-2, wyłącznie liczniki odczytu w `cityStateTurn`, bez zapisu do stanu gry), dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md, 10-operator-claude.md, 30-obrona-claude.md, pomiar-t2-60-wyprowadzony.csv. Wszystko w allowliście; brak zmian reguł, parametrów, gra-robocza, WERSJE.md.
TESTY (własne, na f7c0ffa04, npm ci w worktree): tsc --noEmit exit 0 (bez błędów); logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/0; combat-test 6/6; ai-test 297 passed 0 failed; society-breakdown-test 56 OK 0 FAIL; ai-city-order-need-wiring-test 231/0; unit-replace-test 21/21. Biegów przeglądarkowych 60 tur nie powtarzano (surowe JSONL poza repo); liczby t60 sprawdzone przeciwko CSV w repo: s4242 149/57/51/7/49/8/0, s7 149/75/70/18/55/20/0, zgodne z dokumentem.
WERYFIKACJA KODU: main.ts:45113-45123 (gałąź immunitetu osiedla zeruje łaskę), 45127 (updateRevoltGrace dla każdego właściciela), 45137 (`shouldTriggerRebellion && isHuman(city.ownerId)`: bramka tylko dla człowieka, z komentarzem o świadomej decyzji), society-breakdown.ts:481 i :1203, society-params.json hard: próg 14%, łaska 2 tury. Potwierdzone. Spójność: krytyczne = osiedle + ostrzeżenie (57=49+8, 75=55+20).
OCENA ZARZUTÓW:
1. Surowe pliki poza repo: ODDAL (uwaga). Obrona wyprowadziła dane do CSV w repo z SHA surowych; tabele t60 zgodne z CSV. Pełna weryfikowalność tylko na poziomie pochodnym, nie blokuje diagnozy strukturalnej.
2. Tautologia rebeliaDozwolona: ODDAL. Wiersz usunięty z dokumentu. Uwaga: pole `rebeliaDozwolona` zostaje w haku main.ts (zawsze 0 dla AI, odczyt za civTest); kosmetyka, bez wpływu na grę.
3. Etykieta poCapture/migracja: ODDAL. Etykieta poprawiona, migracja jawnie NIE ZMIERZONO.
4. Rozjazd s4242 (149/57 vs 153/60): ODDAL jako NIE ROZSTRZYGNIĘTE. Uczciwie opisane (bieg wznowiony ze slotu t20); wniosek strukturalny od tego nie zależy.
5. Punkt 3 dispatchu częściowy: ODDAL. Garnizon vs potrzeba i rebelia gracza NIE ZMIERZONO opisane; garnizon nie jest bramką rebelii, a bramka isHuman jest strukturalna.
Żaden zarzut nie wymaga NAPRAW.
BLOKADY: brak blokad procesu. Otwarte NIE ZMIERZONO: garnizon vs potrzeba, rebelia miasta gracza w buncie skrajnym, przyczyna rozjazdu s4242, wstrzymanie migracji w haku.
RUNDY: Final Control 1/5 (Operator 1/5, obrona 1/5).
NASTĘPNY KROK: integracja orkiestratora (dokumentacja + hak odczytu, bez deployu). Pytanie ABC do właściciela (C-018, bez nazw technicznych): czy miasta AI, którym skończył się czas na uspokojenie w buncie skrajnym, mają móc się zbuntować (A zostawić; B zezwolić, w 60. turze dotyczyłoby 7-18 miast AI).
UWAGI-DLA-ORKIESTRATORA: wynik ZAMIERZONE w kodzie, nie BŁĄD. Przy ewentualnym B potrzebny nowy pomiar na poziomie maksymalnym (łaska hard = 2 tury, nie 3 jak w dispatchu).
DEPLOY/PUSH: NIE WYKONANO
