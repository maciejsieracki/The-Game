# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator LunaHigh, runda 4

STATUS: naprawa blokujących błędów typowania z FC r3 wykonana; oczekuje na niezależną kontrolę FC/evaluatora r4.
DATA: 2026-11-10
ZAKRES: wyłącznie dwa odczyty znaku `match[0]` zgłoszone jako TS2532 w `50-final-control-r3.md`; bez rozszerzania mapowań lub zmian funkcjonalnych.

## Zmiana

W `gra/src/ui/entityCards/unitAdapter.ts` w callbackach dla `Bonus vs Spearman` (obecnie linia 119) i `Bonus vs Mount` (obecnie linia 128) zastąpiłem `match[0]` wyrażeniem `match.charAt(0)`. W projekcie z `noUncheckedIndexedAccess` indeksowanie stringa daje typ potencjalnie `undefined`; `charAt(0)` zwraca zawsze string, a dla pustego wejścia `''`. Regexy tych callbacków wymagają niepustego prefiksu, więc dla rzeczywistych dopasowań pierwszy znak jest obecny. Porównanie case i dobór tłumaczenia zachowują dotychczasowe zachowanie; nie użyto non-null assertion ani type assertion.

Nie zmieniłem żadnej frazy, mapowania, danych Top3 ani komentarzy. Poza `unitAdapter.ts` zmieniono wyłącznie wpis zakresu/statusu w `00-dispatch.md` i ten raport.

## Kontrole

- `cd gra && npm run typecheck` — PASS (`tsc --noEmit`, exit 0).
- `node gra/tools/unit-top3-player-language-test.cjs` — PASS; rzeczywisty adapter i renderer sprawdzają wszystkie 75 niepustych sekcji Top3, zachowanie nieznanego tekstu i niezmienione dane źródłowe.
- `git diff --check` dla zakresu — PASS.
- Bez browsera, buildu i commita.

Final Control r3 odnotował dwa TS2532 i uznał batch za niegotowy. Ta runda usuwa wyłącznie wskazane błędy kompilacji typów; batch pozostaje w oczekiwaniu na kontrolę r4. Audyt nadrzędny tekstów UI/CIVPEDII nadal jest CZĘŚCIOWY.
