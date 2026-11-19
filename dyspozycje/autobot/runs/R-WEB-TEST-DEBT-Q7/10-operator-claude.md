STATUS: PASS
DOMAIN: GAME (tylko test)
TEMAT: R-WEB-TEST-DEBT-Q7
GOAL: Przywrócić zielony ai-ai-coalition-test (8/8 + nowy mutant preferowanyCel) bez zmian gra/src/**.

ZMIANY/COMMIT: gra/tools/ai-ai-coalition-test.cjs. Baza 3f616db7c.
- M1 kotwica: `const premia = maPremieKoalicji(p, t, input.koalicja);` już nie istnieje (FALA 852 dopisała `|| (input.preferowanyCel ...)`). Nowa kotwica: `const premia = maPremieKoalicji(p, t, input.koalicja) ||` -> `const premia = false ||`.
- Nowy check K7b: planer z haczykiem preferowanyCel (zerowe zaufanie) wybiera cel 4 nad wyższą willingness 3.
- Nowy mutant M9: usunięcie `|| (input.preferowanyCel?.(p, t) ?? false)` czerwieni K7b.
- Diagnoza: kotwica M1 była kruchą linią-literałem; to usterka testu, nie gry.

TESTY (surowe wyjścia):
- Przed zmianą: ai-ai-coalition-test WYNIK CZERWONE, mutanty 7/8 (M1 anchor missing).
- Po zmianie: ai-ai-coalition-test testy bazowe błędy=0, mutanty wykryte=9/9, WYNIK ZIELONE, exit 0.
- ai-ai-alliance-tick-test: suite 19/19 OK, mutants 8/8, exit 0.
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33/0.
- unit-replace-test: 21/21.
- combat-test: 6/6.
- Dodatkowo ai-unit-replace-same-rules-test: 45 passed, 0 failed.

BLOKADY: brak.

KRUCHE TESTY MUTACYJNE (bez przepisywania):
1. ai-ai-alliance-tick-test.cjs ok. linia 302: brak kotwicy mutanta liczy się jako DETECTED (`detected: true`). To fałszywa zieloność; zalecana zmiana na false.
2. ai-ai-alliance-measure-hook-test.cjs (MUTANTS, linie 116+): kotwice to pełne fragmenty linii w main/tick; zmiana formatowania zrywa mutanta.
3. diplo-war-declare-zero-trust-test.cjs ok. linie 184-190: warunki oparte na `src.includes(...)` całych fragmentów main.ts; mutacje przez `replace` bez sprawdzenia, czy zaszły.
4. ai-ai-coalition-test.cjs: kotwice z końcówką `;` lub `||` są kruche przy każdej edycji linii w ai-ai-alliance-tick.ts.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje mutant M9 i kotwicę M1 oraz uruchamia bramki; orkiestrator decyduje o punkcie 1 (fałszywa zieloność).
DEPLOY/PUSH: NIE WYKONANO
