# 20 — Independent evaluator

STATUS: PASS
OBRONA: POMINIĘTA
DOMAIN: GAME / TEST DEBT
TEMAT: R-WEB-AI-MAJOR-ECONOMY-TEST-DEBT-Q1

## Werdykt

Akceptuję ograniczoną zmianę testu. Usunięte dwie asercje sekcji C sprawdzały wycofany kontrakt 60/40, a nie aktywną regułę produkcji AI. Dowód decyzji produktowej wiąże usunięcie helpera z zatwierdzonym bounded release PR141; niezależny, istniejący test sprawdza aktualne priorytety profilu. Pozostałe asercje `ai-major-economy-test.cjs` pozostały bez zmian.

## Dowody

- `b4d37d9f8` (`Prepare bounded PR141 ROBOCZA release`, pełny SHA `b4d37d9f81686b5b21bb256087a55e3a592721f0`) usuwa `computeMajorArchetypeMilitaryFraction`, implementację dawnego biasu produkcji i jego użycie w `chooseCityProduction`. W tym commicie wyliczany fraction zostaje ustawiony na `0.5`; kod wskazuje priorytety profilu macierzy jako aktywne źródło. Helper nie istnieje też w bieżącym `gra/src/game/ai.ts`.
- Ten sam commit zawiera istniejący `gra/tools/ai-production-priority-test.cjs`. Jego scenariusze sprawdzają wpływ wysokich priorytetów nauki i wojska na wybór Biblioteki/Koszar, wybór Akademii po Bibliotece oraz obliczanie i składanie bieżących bonusów priorytetów Panelu D. To test zachowania konsumenta `chooseCityProduction`, a nie kopia dawnego wyliczenia 60/40.
- Zmiana w `gra/tools/ai-major-economy-test.cjs` ogranicza się do usunięcia dwóch importów helpera i dwóch asercji 60/40 oraz dodania komentarza wyjaśniającego supersesję. Sekcje A, B, D–M zachowują wcześniejsze asercje.
- `R-PR141-CODEX-FULL-RELEASE-20261020/evidence/release-verification-report.md` stwierdza, że nie wykonano browser/gameplay acceptance i nie deklaruje 93×15 gameplay acceptance. Ta ocena nie przypisuje temu ograniczonemu release'owi pełnej akceptacji PR141.

## Weryfikacja

Uruchomione niezależnie w `gra/`:

- `node tools/ai-major-economy-test.cjs` — exit 0, `31 passed, 0 failed`.
- `node tools/ai-production-priority-test.cjs` — exit 0, `9 passed, 0 failed`.
- `git diff --check -- gra/tools/ai-major-economy-test.cjs` — exit 0.
- Zakres diffu testu: wyłącznie `gra/tools/ai-major-economy-test.cjs` (5 insertions, 9 deletions).

## Granice werdyktu

PASS dotyczy wyłącznie usunięcia przestarzałego kontraktu testowego i zachowania wykonywalności wskazanego testu. Nie stanowi akceptacji gameplay, runtime ani pełnego PR141/93×15. Nie dokonano zmian źródła produktu ani nie wykonano commita.
