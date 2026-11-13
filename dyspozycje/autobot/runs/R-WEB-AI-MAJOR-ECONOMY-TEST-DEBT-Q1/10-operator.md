# 10 — Operator

STATUS: PASS-WITH-NOTES
DOMAIN: GAME / TEST DEBT
TEMAT: R-WEB-AI-MAJOR-ECONOMY-TEST-DEBT-Q1
GOAL: Przywrócić wykonywalność testu długu bez zmiany produktu, zachowując asercje aktywnych reguł i usuwając wyłącznie historyczny kontrakt, który został celowo wycofany.
ZMIANY/COMMIT: Zmieniono wyłącznie `gra/tools/ai-major-economy-test.cjs` oraz własne artefakty `00-dispatch.md` i `10-operator.md`. Bez commita.
TESTY:

- Przed zmianą, `HEAD=ab7507706d712f1ae675e6fef57459083399191b`, `node v24.19.0`, komenda z `gra/`: `node tools/ai-major-economy-test.cjs` → exit `1`. Sekcje A i B przechodzą, sekcja C przerywa proces: `TypeError: computeMajorArchetypeMilitaryFraction is not a function` (`tools/ai-major-economy-test.cjs:147`). To wynik przed jakąkolwiek modyfikacją testu.
- Wcześniejszy niezależny snapshot `R-WEB-FULL-REGRESSION-MAIN-Q1` zawiera identyczny TypeError zarówno w `logs-ref/gate-tools_ai-major-economy-test.cjs.txt`, jak i `logs/gate-tools_ai-major-economy-test.cjs.txt`; failure nie jest nową regresją w bieżącym dirty tree.
- Po zmianie: `node tools/ai-major-economy-test.cjs` → exit `0`, `31 passed, 0 failed`. Zachowano wszystkie asercje aktywnych sekcji A, B, D–M. Usunięte zostały dwie asercje wyłącznie dawnego 60/40 helpera.
- Istniejący test bieżącego profilu: `node tools/ai-production-priority-test.cjs` → exit `0`, `9 passed, 0 failed`. Pokrywa aktualne priorytety profilu, wybór produkcji dla wysokiego priorytetu militarnego/naukowego oraz ich kompozycję.
- `git diff --check -- gra/tools/ai-major-economy-test.cjs` → exit `0`. Po sprzątnięciu plików tymczasowych status targetu pokazuje tylko zmianę `gra/tools/ai-major-economy-test.cjs`.

## Uzasadnienie supersesji sekcji C

Sekcja C asertowała publiczny helper `computeMajorArchetypeMilitaryFraction` i oczekiwała ~60%/40% wojskowego udziału wyprowadzonego z `ai-params`. Jej awaria wynika z braku eksportu w obecnym kodzie, a nie z różnicy wartości.

Dowód źródłowy jest dokładny: commit `b4d37d9f8` (`Prepare bounded PR141 ROBOCZA release`, pełny SHA `b4d37d9f81686b5b21bb256087a55e3a592721f0`) usuwa `computeMajorArchetypeMilitaryFraction`, dawną mapę/priorities `ai-params` oraz użycie wyliczonego fraction w `chooseCityProduction`; ścieżka ustawia `majorMilFrac = 0.5` i opisuje matrix-backed civilization profile jako źródło priorytetów. Funkcji nie ma w aktualnym `gra/src/game/ai.ts`. W tym samym commitcie `ai-production-priority-test.cjs` jest już obecny. Bounded PR141 source release (`R-PR141-CODEX-FULL-RELEASE-20261020`) wyraźnie nie deklaruje pełnego PR141/93×15 gameplay acceptance; test ten nie przywraca ani nie zakłada wycofanego zachowania.

Aktualny zastępczy kontrakt ma istniejące, odrębne pokrycie `ai-production-priority-test.cjs`: po zmianie uruchomiony zielono, 9/9. Nie dublowałem testu ani nie dodawałem asercji odtwarzającej implementację. Pozostałe zachowane scenariusze `ai-major-economy-test.cjs` po zmianie uruchamiają się i przechodzą.

## Granica F-04 / PR141

`docs/decyzje/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018.md` zatwierdza dokładnie 360 wartości źródłowych, ale jawnie nie zatwierdza konsumentów, zachowania gry ani product acceptance. Odrębne runy akceptują tylko bounded zakresy: m.in. dziewięć Yields consumerów (`R-PR141-CODEX-F04-YIELDS-ACTIVATION-20261018/07-final-control.md`, lokalnie przyjęte w `08-integration.md`) i pojedyncze `prod_szybkosc_budynku_proc`; ich raporty wykluczają pełne runtime/visual/93×15 acceptance. Nie przypisuję statusu F-04 ani całości PR141 temu testowi.

ZMIANY PRODUKTOWE: brak. Nie zmieniono helperów, `gra/src`, danych, globalnego rejestru ani acceptance ledgerów.
BLOKADY: Brak w ograniczonym celu testowym. Pełna akceptacja PR141/93×15 pozostaje poza tym zakresem i niewykazana.
RUNDY: 1/5.
NASTĘPNY KROK: Niezależny Evaluator powinien sprawdzić podstawę supersesji sekcji C, zachowanie wszystkich aktywnych assertions i wynik testów na aktualnym diffie.
DEPLOY/PUSH: NIE WYKONANO.
