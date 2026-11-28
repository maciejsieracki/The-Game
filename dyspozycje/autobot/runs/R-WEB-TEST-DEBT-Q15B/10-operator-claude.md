STATUS: PASS
DOMAIN: PROCESS/GAME (dług testowy; zero zmian gra/src)
TEMAT: R-WEB-TEST-DEBT-Q15B (tag TDQ15B)
GOAL: pin 6a–6c karty eliminacji zgodny z regułą R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1 (wariant A, gra bez zmian); mutacja event-lifetime czerwona; lista innych testów z tym pinem.
ZMIANY/COMMIT: gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs (sekcja 6: dodana (6pre), 6a/6b/6c przekształcone, komentarz z regułą i liniami kodu); dyspozycje/analizy/DLUG-TESTOWY-Q15-2026-11-27.md (sekcja 5 Q15B); dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q15B/10-operator-claude.md. Baza: 7d8cf0664 (origin/main). gra/src i gra/data: bez zmian.
TESTY:
- tsc --noEmit -p gra: exit 0
- node tools/logic-test.cjs: LOGIC OK (213/213), exit 0
- node tools/ai-test.cjs: ai-test: 297 passed, 0 failed, exit 0
- node tools/wydarzenia-eliminacja-podboj-karta-test.cjs (baza, po zmianie): 29 pass, 0 fail (przed zmianą: 25 pass, 3 fail)
- Mutacja: w gra/src/game/event-lifetime.ts (isEventLiveInTurn) dodano zachowanie dla id startsWith("elim-cs-") -> 27 pass, 2 fail (FAIL 6a: wpis elim-cs-1-1 nadal w warEventLog; FAIL 6c: linkFor zwraca civ-elim/Szczegóły). Plik przywrócony z kopii; grep MUTACJA = 0.
- Inne testy z pinem „karta eliminacji przeżywa turę”: grep elim-cs / civElimEventDetails w gra/tools/*test.cjs nie znalazł pinu. Jedno zdanie w opisie asercji miasto-zdobycie-raport-test.cjs (~linia 398, 9b) mówi „przeżywa koniec tury, jak elim-cs-*”; asercja tego nie sprawdza (tylko bezpośredni zapis do warEventLog). Nie zmieniano (poza zakresem; do oceny).
BLOKADY: brak
RUNDY: 1/5 (pierwsza runda; ostatni werdykt: n/d)
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu allowlisty, mutacji i bramek; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: znalezisko miasto-zdobycie-raport-test.cjs:398 (opis asercji 9b) — kandydat na drobną korektę tekstu, bez wpływu na wynik.
