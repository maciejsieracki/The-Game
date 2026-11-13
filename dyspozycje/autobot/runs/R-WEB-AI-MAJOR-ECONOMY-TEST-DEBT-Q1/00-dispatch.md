# 00 — Dispatch

STATUS: OPERATOR
DOMAIN: GAME / TEST DEBT
TEMAT: R-WEB-AI-MAJOR-ECONOMY-TEST-DEBT-Q1
GOAL: Przywrócić wykonywalność `ai-major-economy-test.cjs`, zachowując asercje bieżących reguł AI i ekonomii. Usunąć wyłącznie kontrakt, który produkt celowo wycofał w bounded release PR141, o ile potwierdzą to kod, decyzje i niezależne pokrycie obecnego zachowania.
BAZA: `main` @ `ab7507706d712f1ae675e6fef57459083399191b`; test uruchomiony z `gra/`.
ALLOWLISTA:

- `gra/tools/ai-major-economy-test.cjs`
- `dyspozycje/autobot/runs/R-WEB-AI-MAJOR-ECONOMY-TEST-DEBT-Q1/00-dispatch.md`
- `dyspozycje/autobot/runs/R-WEB-AI-MAJOR-ECONOMY-TEST-DEBT-Q1/10-operator.md`

## Zakres i decyzje

- Istniejący dispatch/run o tym ID nie został znaleziony; jest to unikalne ID z kolejki test-debt. Istniejące wcześniejsze wyniki tej bramki pozostają dowodem historycznym, nie zastępują bieżącego reprodu.
- Kod produkcyjny i helpery są read-only. Nie wolno przywracać usuniętego helpera ani modyfikować zachowania AI w ramach długu testowego.
- Sprawdzić dla każdej asercji, czy nadal opisuje aktywną regułę. Zachować wszystkie asercje bieżących zachowań. Nie pomijać scenariuszy ani nie osłabiać oczekiwań w celu uzyskania zielonego wyniku.
- Historyczny kontrakt `computeMajorArchetypeMilitaryFraction` (60/40 z `ai-params`) może być wycofany wyłącznie po powiązaniu dokładnej zmiany źródła z zatwierdzonym bounded release PR141 i wskazaniu istniejącego testu obecnego kontraktu.
- F-04: weryfikować rozdział source approval, bounded consumer acceptance i acceptance produktu. Samo zatwierdzenie 360 surowych wartości ani bounded activation nie oznacza pełnego PR141/93×15, runtime lub gameplay acceptance.

## Plan / kryteria

1. Zapisać rzeczywisty wynik `cd gra && node tools/ai-major-economy-test.cjs` przed zmianą, bez wcześniejszej edycji pliku.
2. Potwierdzić status wymienionego helpera w aktualnym `gra/src/game/ai.ts`, commit źródłowy zmiany i decyzje PR141.
3. Jeśli asercja jest przestarzała, udokumentować jej dokładną supersesję, zachować bieżące asercje i oprzeć się na już istniejącym, aktualnym pokryciu zamiast dublować testy źródłowe.
4. Uruchomić zmieniony target i istniejący test aktualnego profilu produkcji AI. Zapisać dokładny wynik i `git diff --check`.
5. Nie zmieniać produkcji, danych, F-04 ledgerów, rejestru globalnego, dispatchów innych tematów, nie budować, nie publikować i nie commitować.

Model operatora: Codex `gpt-6-luna` / `high`. Runda 1/5. Następny krok: niezależny Evaluator na zapisanym diffie i dowodach.
