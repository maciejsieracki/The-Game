# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — niezależna weryfikacja rundy 4

STATUS: PASS — błąd TS2532 usunięty, zachowanie mapowań zachowane  
DATA: 2026-11-10  
ZAKRES: wyłącznie dwa zastąpienia `match[0]` przez `match.charAt(0)` w callbackach formattera Top3 oraz ponowna kontrola bramki typów i testu DOM. Bez przeglądarki, zmian źródeł ani commitów.

## Wynik

Poprawka w `gra/src/ui/entityCards/unitAdapter.ts:118-128` jest bezpieczna typowo i nie zmienia zachowania. Oba callbacki dostają niepusty, dopasowany fragment, ponieważ wzorce zawierają dosłowny prefiks `Bonus vs Spearman` albo `Bonus vs Mount`. Dla tych dopasowań `match.charAt(0)` zwraca ten sam pierwszy znak co `match[0]`; porównanie wielkości litery i wybór polskiej etykiety pozostają takie same. `charAt` zwraca typ `string`, więc usuwa problem wynikający z `noUncheckedIndexedAccess`, bez rzutowania ani non-null assertion.

Niezależnie uruchomiłem:

- `cd gra && npm run typecheck` — PASS (`tsc --noEmit`, exit 0).
- `cd gra && node tools/unit-top3-player-language-test.cjs` — PASS; DOM renderera sprawdza wszystkie 75 wypełnionych sekcji Top3, zatwierdzone mapowania, fallback `UnknownLabel`, niemutowanie danych oraz historię Evocati i iButho.
- `git diff --check` dla kontrolowanego zakresu — PASS.

Nie widzę zastrzeżenia do samej poprawki ani do zachowania istniejących mapowań. Ta runda usuwa wyłącznie dwie przyczyny TS2532 wskazane w Final Control r3. Akceptacja dotyczy opisanej, ograniczonej zmiany kart jednostek; pełny audyt tekstów UI/CIVPEDII nadal pozostaje CZĘŚCIOWY.

**OBRONA POMINIĘTA:** brak osobnego zarzutu wymagającego odpowiedzi.
