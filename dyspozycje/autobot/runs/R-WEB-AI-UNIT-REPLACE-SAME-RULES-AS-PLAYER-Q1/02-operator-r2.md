STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1
GOAL: AI zamienia jednostki wg tych samych zasad co gracz, przez jedną wspólną implementację, za pełny koszt (Pieniądz + surowce).
ZMIANY/COMMIT: runda 2 (odpowiedź na zarzuty Evaluatora). Baza: e5c81f15a (r1). Allowlista: gra/src/game/ai-unit-replace-plan.ts, gra/src/main.ts, gra/tools/ai-unit-replace-same-rules-test.cjs, ten raport.
ZARZUT 1 (rezerwa zakupu AI przy zamianie): PRZYJMUJĘ. Zamiana AI przechodzi regułę rezerwy utrzymania identyczną z zakupem (shouldAIPurchaseUnit: skarbiec po zapłaceniu >= rezerwaTur * utrzymanie po zamianie, netto >= minDochodNetto; parametry 10/3/0 per poziom). Przy braku danych rezerwy (tura 1) zostaje dawna reguła: skarbiec >= cena. Nowy helper aiReplaceReserveOk w ai-unit-replace-plan.ts; brama w upgradeAiUnitsForEra = wspólna brama Super + rezerwa; aiPurchaseReserveInputs(ownerId, typ, replacesTypeId) liczy przyrost utrzymania dla ZAMIANY (jedna jednostka zmienia typ, nie dodaje jednostki).
ZARZUT 1, część o KOLEJNOŚCI: JAWNE ODSTĘPSTWO. Zamiana nadal wykonywana jest na starcie tury właściciela (przed rekrutacją i zakupami AI), a nie po nich jak wymagał dispatch. Powód: przeniesienie wywołania w pętli ownerLoop wiąże się z obsługą wznowienia po animacji bitwy (isCommandResume) i jest zbyt ryzykowne w tej rundzie. Kompensacja: rezerwa jest sprawdzana względem bieżącego skarbca przy każdej zamianie (setTreasury zmniejsza skarbiec przed następną), a późniejsze zakupy AI sprawdzają własną rezerwę. Skutek: zamiana może w danej turze zabrać środki, które zakup dostałby później, ale nie zejdzie poniżej rezerwy. Do decyzji w kolejnym temacie: przeniesienie wywołania za zakupy.
ZARZUT 2 (limit 10% jako stała, nie parametr w danych): PRZYJMUJĘ JAKO ZNANE ZAŁOŻENIE, bez zmiany. Stała AI_UNIT_REPLACE_MAX_FRACTION = 0,1 w ai-unit-replace-plan.ts. Do decyzji: czy przenieść do ai-params.json.
ZARZUT 3 (brak testu wykonania upgradeAiUnitsForEra): NIE_ZMIERZONO. Pomiar headless przebiegu AI nie został wykonany (main.ts nie da się zbundlować bez DOM). Dodane asercje źródłowe i testy samego helpera.
TESTY (worktree, node_modules tymczasowe, usunięte po testach):
- ai-unit-replace-same-rules-test 41/0 (sekcja I: 7 asercji reguły rezerwy + 3 okablowania)
- unit-replace-test 15/15
- unit-replace-full-cost-test 40/0
- unit-replace-army-multi-select-test 36/36
- super-unit-limit-one-test 40/0
- ai-era-unit-promotion-test 17/0
- ai-test 296/0
- tsc --noEmit: brak błędów w zmienionych plikach (poza znanymi `three`, `filePlayer`)
- git diff --check: czysto
BLOKADY: brak (poza NIE_ZMIERZONO z zarzutu 3 i odstępstwem kolejności z zarzutu 1).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
