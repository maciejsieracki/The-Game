STATUS: DECISION_REQUIRED
DOMAIN: PROCESS/GAME (dług testowy; zero zmian gra/src)
TEMAT: R-WEB-TEST-DEBT-Q15
GOAL: obrona po Evaluatorze (b86fd46a): przyjąć/odrzucić 4 zarzuty z dowodem; ustalić przyczyny 0.5c i 6a–6c z linią; formalnie zapisać decyzję dla 6a–6c; uruchomić bramki tsc/logic/ai-test.
ZMIANY/COMMIT: gra/tools/unit-upkeep-cost-pace-test.cjs (skaner: wrapper liczy się tylko z tempem jako drugim argumentem; warunek \bpace\b zawężony do pozycji argumentu; komentarze /* i /**); gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs (0.5c: seedEvents -> setCivElimDetails -> closeAll; asercje bez zmian); dyspozycje/analizy/DLUG-TESTOWY-Q15-2026-11-27.md (poprawiony); ten raport. Commit: SHA w polu sha odpowiedzi.
TESTY:
- tsc --noEmit: exit 0
- logic-test.cjs: LOGIC OK (213/213)
- ai-test.cjs: 297 passed, 0 failed
- unit-upkeep-cost-pace-test: po poprawce skanera 81 ok / 0 FAIL (diagnostyka: calls 26, missing 0). Mutacje: main.ts:34616 (ownerId, 1) -> 80 ok / 1 FAIL; main.ts:34617 (ownerId, undefined) -> 80 ok / 1 FAIL; obie naraz -> 80 ok / 1 FAIL. main.ts przywrócony z kopii.
- wydarzenia-eliminacja-podboj-karta-test: po poprawce 25 pass / 3 fail. (0.5c) OK. (6a), (6b), (6c) FAIL, asercje nietknięte (patrz analiza pkt 2b).
  Mutacja 0.5c: civElimNotice.ts domyślny kicker 'Dyplomacja' -> 'Podbój' => FAIL (0.5c) "Podbój"; plik przywrócony z kopii, brak zmian w gra/src.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTE i naprawione. Wrapper paceUtrzymaniaWlasciciela liczy się jako tempo tylko gdy drugi argument jest tempem: regex paceUtrzymaniaWlasciciela\(\s*[^,()]+,\s*(?:kosztJednostekPace\w*|pace\b|\w*Pace\b). Mutacje (ownerId, 1) i (ownerId, undefined) są czerwone (dowód w TESTY).
2. PRZYJĘTE i naprawione. Usunięto luźny warunek \bpace\b w całym tekście wywołania; zostało [(,]\s*pace\s*[,)] (pace jako argument). Skan: 26 wywołań, 0 bez tempa (poprzednio 27, z jednym fałszywym alarmem z komentarza /**).
3. PRZYJĘTE, przyczyny ustalone:
   - (0.5c) PRZYCZYNA: hak seedEvents (gra/src/main.ts:31358) wykonuje civElimEventDetails.clear(). Test wołał setCivElimDetails przed seedEvents, więc szczegóły znikały; karta miała klasę sp-no-link i linkFor === null. Naprawa w teście: kolejność seed -> details -> closeAll (closeAll przerenderowuje panel). Minimalne odtworzenie: diagnostyka w kopii testu (usunięta) pokazała sp-no-link przed closeAll i civ-elim po closeAll.
   - (6a)-(6c) PRZYCZYNA: nie eot-event-defer (hipoteza z rundy 1 była błędna). Wpis elim-cs-1-1 (turnCreated = 1) jest usuwany przy turn++ przez expireInformationalEventsBeforeTurn (gra/src/main.ts:43933) -> expireEventsBeforeTurn (gra/src/game/event-lifetime.ts:43-53), zgodnie z regułą właściciela R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1 (2026-11-04, nagłówek event-lifetime.ts). Wpis eot-hint-2-0 to wpis nowej tury. Pin 6a-6c sprawdza log PO turn++ i zakłada przeżycie: to konflikt pinu z regułą, nie drobna regresja.
   - Asercji 6a-6c nie zmieniono (zakaz osłabiania). Formalnie: DECISION_REQUIRED, dwa warianty w analizie pkt 2b.
4. PRZYJĘTE i naprawione. Analiza zawiera wyniki logic 213/213 i ai-test 297/0. Tabela skanu nadal obejmuje 18 testów, nie wszystkie ~200 (zadeklarowane jawnie).
BLOKADY: DECISION_REQUIRED (jedno zdanie): czy karta eliminacji (elim-cs-*) ma znikać przy przejściu tury jak inne wydarzenia dziennika (wariant A: pin 6a-6c do aktualizacji na asercję wygaśnięcia), czy zostawać do kliknięcia (wariant B: zmiana event-lifetime.ts dla elim-cs-*, gra/src). Pozostałe bramki zielone.
RUNDY: 2/5 (runda obrony po Evaluatorze b86fd46a)
NASTĘPNY KROK: orkiestrator: decyzja A/B (pytanie ABC wg zasad) albo zgłoszenie do właściciela; po decyzji ponowny Final Control.
UWAGI-DLA-ORKIESTRATORA: 0.5c zamknięty w teście; nie wymaga zmiany gra/src. Hak seedEvents czyszczący civElimEventDetails (gra/src/main.ts:31358) to pułapka dla przyszłych testów; nie ruszany (zakaz gra/src).
DEPLOY/PUSH: NIE WYKONANO
