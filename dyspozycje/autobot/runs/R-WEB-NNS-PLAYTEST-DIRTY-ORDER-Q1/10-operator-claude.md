# R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1
GOAL: (1) K1 markCityStateDirty w presecie playtest=mapa; (2) K2 kolejność zerowania empireEconDirty; (3) newgame i pozostałe presety bez zmian.
BAZA: 0c12240a356e6430dcba6aac3044d6a48b2bad4d (origin/main, potwierdzone `merge-base --is-ancestor`).

## Wynik

- **K1 — już w bazie, brak zmiany kodu.** Poprawka weszła wcześniej jako f3bf2cc67 (R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1, runda 2). W `gra/src/main.ts` ~l.49557 (`doStartPlaytestMiastoEkonomia`, po `cities.push`) stoi `markCityStateDirty()`; ten sam wzorzec jest w `doStartPlaytestMapaSwiata`. Dispatch zakładał stan sprzed tej poprawki.
- **K2 — brak realnego efektu, nie zmieniono.** `refreshLiveEmpireRates()` (main.ts l.23250) zeruje `empireEconDirty = false` PRZED `refreshLiveEmpireRatesUnsafe()`, a w ciele `refreshLiveEmpireRatesUnsafe()` (od l.23265) nie ma ani `markCityStateDirty()`, ani zapisu do `empireEconDirty`. Zerowanie przed przeliczeniem jest poprawną kolejnością dla flagi dirty: jeśli coś ustawi flagę w trakcie przeliczenia, zostanie ona `true` i następny trigger przeliczy ponownie. Zerowanie po przeliczeniu zgubiłoby takie zdarzenie. Jedyne miejsce ustawiające `true` poza triggerem to `catch` (l.~3256), które przywraca retry po wyjątku.

## TESTY (liczby z surowego wyjścia, ten sam kod co baza)

| Bramka / test | Wynik |
|---|---|
| `npx tsc --noEmit` (gra/) | exit 0, bez błędów |
| `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| `node tools/tech-tree-test.cjs` | 20 pass, 0 fail |
| `node tools/research-test.cjs` | PASSED: 33 / FAILED: 0 / TOTAL: 33 |
| `node tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `node tools/combat-test.cjs` | COMBAT TEST: 6/6 pass |
| `node tools/playtest-mapa-dirty-forecast-test.cjs` (istniejący test K1, statyczny) | 10 pass, 0 fail |

Przed/po: brak zmiany kodu, więc wyniki „przed” = „po”. Nie uruchamiano mutacji (usunięcie `markCityStateDirty()` nie było wykonywane w tym worktree); dowód mutacyjny K1 jest w istniejącym teście statycznym, a nie w tej rundzie.

NIE ZMIERZONO: test żywy w przeglądarce (prognoza t1 `!= null` w presecie playtest=mapa). Nie uruchamiano Chromium.

## ZMIANY-COMMIT

Jedyna zmiana: ten plik raportu (`dyspozycje/autobot/runs/R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1/10-operator-claude.md`). `gra/src/main.ts` i testy bez zmian. Brak nowego testu `nns-playtest-dirty-test.cjs` (niepotrzebny, bo K1 już pokrywa test statyczny).

## BLOKADY

Brak. Instalacja `npm ci --ignore-scripts` wykonana w worktree (`gra/node_modules`), do sprzątania przez orkiestratora. Build vite nie wykonywany.

## RUNDY

1/5. Werdykt: PASS-WITH-NOTES (bez zmian kodu).

## UWAGI-DLA-ORKIESTRATORA

- Pozycja #492/#501 w rejestrze („K1 do zrobienia”) jest nieaktualna: K1 zamknięte przez f3bf2cc67. Warto zamknąć w rejestrze jako „w bazie”.
- K2 można zamknąć jako „brak efektu” z tym uzasadnieniem.
- Worktree zostaje do sprzątania (node_modules w `gra/`).

NASTĘPNY KROK: integracja orkiestratora (wpis w rejestrze, decyzja o zamknięciu K2).
DEPLOY/PUSH: NIE WYKONANO
