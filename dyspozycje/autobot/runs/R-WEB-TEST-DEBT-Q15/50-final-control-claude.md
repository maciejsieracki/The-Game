STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME (dług testowy; zero zmian gra/src)
TEMAT: R-WEB-TEST-DEBT-Q15
GOAL: niezależny werdykt Final Control dla kandydata aa9c79f5be5aef1740c7488b6158aac55833379c (baza 22f69d901f6cdad09df024225e3105553e3f177d)
ZMIANY/COMMIT: kandydat aa9c79f5b; merge-base --is-ancestor 22f69d901 -> aa9c79f5b = TAK. git diff --stat: 5 plików (+140/-6): DLUG-TESTOWY-Q15-2026-11-27.md, runs/.../10-operator-claude.md, 30-obrona-claude.md, gra/tools/unit-upkeep-cost-pace-test.cjs, gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs. Allowlista zachowana, zero zmian gra/src i gra/data.
TESTY (własny bieg, npm ci --ignore-scripts, detached aa9c79f5b):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); ai-test: 297 passed, 0 failed
- tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0
- unit-upkeep-cost-pace-test: 81 ok / 0 FAIL. Mutacja main.ts:34616 (ownerId,1) + :34617 (ownerId,undefined) naraz -> 80 ok / 1 FAIL (czerwone); po przywróceniu 81/0; git status czysty.
- wydarzenia-eliminacja-podboj-karta-test: 25 pass / 3 fail (dwa biegi identyczne). (0.5c) zielone; czerwone (6a)(6b)(6c). Test nie ma suwaków trudności, reguła poziomu maksymalnego nie dotyczy.
OCENA ZARZUTÓW:
1. Słaby warunek skanera (sam token wrappera): NAPRAWIONE w aa9c79f5b (regex wymaga drugiego argumentu = tempo); mutacje z zarzutu potwierdzone jako czerwone.
2. Luźne \bpace\b: NAPRAWIONE (zawężone do [(,]\s*pace\s*[,)]).
3. 6a-6c nadal czerwone: ODDAL (uwaga). Przyczyna zweryfikowana z linii: gra/src/game/event-lifetime.ts:35-57 (expireEventsBeforeTurn usuwa wpisy z turnCreated < turn; wołane z gra/src/main.ts:43933), zgodnie z regułą właściciela 2026-11-04 (R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1, rejestr l.8955). Pin 6a-6c zakłada przeżycie karty po turn++ = konflikt pinu z regułą; rozstrzygnięcie A/B jest decyzją produktową (wyjątek od one-turn dla karty eliminacji), nie inżynierską. (0.5c): hak seedEvents czyści civElimEventDetails (main.ts:31358), naprawa w teście; (0.5c) zielone w moim biegu.
4. Niepełność dokumentu (logic/ai-test): NAPRAWIONE w dokumencie; własne pomiary zgodne (213/213, 297/0).
BLOKADY: brak blokad kodu. DECISION_REQUIRED (do orkiestratora, bez rekomendacji): A) karta eliminacji znika przy przejściu tury jak inne wydarzenia (pin 6a-6c do zmiany na asercję wygaśnięcia, gra bez zmian). B) karta eliminacji zostaje do kliknięcia (wyjątek w event-lifetime.ts, zmiana gra/src). Do decyzji 3 asercje (6a-6c) pozostają czerwone i są jawnie opisane w dokumencie.
RUNDY: FC 1/5 dla tego kandydata
NASTĘPNY KROK: integracja kandydata przez orkiestratora (poprawki testów i dokument są poprawne); osobno decyzja A/B dla 6a-6c.
UWAGI-DLA-ORKIESTRATORA: hak seedEvents czyszczący civElimEventDetails (main.ts:31358) to pułapka dla przyszłych testów.
DEPLOY/PUSH: NIE WYKONANO
