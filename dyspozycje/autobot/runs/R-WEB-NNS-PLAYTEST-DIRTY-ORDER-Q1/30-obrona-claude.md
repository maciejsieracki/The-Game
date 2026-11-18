# R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora, runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1
GOAL: (1) K1 markCityStateDirty w presecie playtest=mapa; (2) K2 kolejność zerowania empireEconDirty; (3) newgame i pozostałe presety bez zmian.
START: d1860cfa3bd17314f26976ea649bed7aea4c7f42 (raport Operatora 10-operator-claude.md; kod gra/ identyczny z bazą 0c12240a3)
KANDYDAT EVALUATORA: d96817d04befdc17eb194944026866820f7d1d6a (20-evaluator-claude.md)

## Odpowiedzi na zarzuty

**Zarzut 1 (brak mutacji i testu żywego w raporcie Operatora): PRZYJMUJĘ część dot. mutacji, ODRZUCAM wymóg testu żywego w tej rundzie.**
- Mutację wykonuję teraz (kopie w scratchpad, `gra/src/main.ts` w worktree nietknięty; `git status` czysty). Ważna uwaga metodologiczna: zamiana `markCityStateDirty();` na komentarz zawierający ten sam tekst NIE działa, bo test liczy tokeny (uzyskałem wtedy fałszywe 10/0). Poprawna mutacja: `void 0; /* MUT */`.
- Wynik l.49798 (preset playtest=mapa, `doStartPlaytestMapaSwiata`): `playtest-mapa-dirty-forecast-test.cjs <mut>` = **7 pass, 3 fail** (FAIL: brak wywołania po cities.push; brak przed startRenderLoop; liczba=0). Exit 1.
- Wynik l.49559 (preset playtest=miasto, `doStartPlaytestMiastoEkonomia`): **7 pass, 3 fail**, exit 1.
- Oryginał `gra/src/main.ts`: **10 pass, 0 fail**, exit 0.
- Test żywy (prognoza t1 `!= null` w Chromium): NIE ZMIERZONO. GOAL dopuszcza „test żywy lub hakowy”; dowodem hakowym jest test statyczny z mutacją powyżej. Live wymagałby npm ci, build vite i Chromium, a dispatch zakazuje testów w tle w tej rundzie. Nie uruchamiano.

**Zarzut 2 (mapowanie presetów w raporcie Operatora): PRZYJMUJĘ.**
Raport 10-operator-claude.md błędnie przypisał l.~49557 do presetu `playtest=mapa`. Poprawne mapowanie (potwierdzone nagłówkiem testu i grep-em):
- l.49559 `markCityStateDirty()` → `doStartPlaytestMiastoEkonomia` (preset `playtest=miasto`, funkcja zaczyna się l.49431);
- l.49798 `markCityStateDirty()` → `doStartPlaytestMapaSwiata` (preset `playtest=mapa`, funkcja zaczyna się l.49661).
Oba presety mają wywołanie, więc wniosek K1 (już w bazie, f3bf2cc67) pozostaje prawdziwy. Korekta tylko opisowa; nie zmieniam pliku Operatora, korekta jest tutaj.

**Zarzut 3 (doStartPlaytestWalkaMapy, l.49296–49303, cities.push bez markCityStateDirty): ODRZUCAM jako zakres tej rundy.**
- GOAL (3) wymaga, by zachowanie pozostałych presetów było bez zmian; dodanie wywołania w `doStartPlaytestWalkaMapy` zmieniłoby inny preset.
- K1 w dispatchu dotyczy wyłącznie presetu `playtest=mapa`.
- Nie zmierzono, czy ten brak ma wpływ na prognozę (brak testu). Zgłaszam jako UWAGA-DLA-ORKIESTRATORA, nie ruszam.

## Ustalenia Operatora po weryfikacji Evaluatora
- K1: już w bazie (f3bf2cc67, przodek 0c12240a3). Brak zmiany kodu.
- K2: zerowanie `empireEconDirty = false` w `refreshLiveEmpireRates` (gra/src/main.ts l.23252) jest PRZED `refreshLiveEmpireRatesUnsafe()`. Ciało Unsafe nie zapisuje flagi, więc nie ma realnej utraty dirty. Brak zmiany kodu.

## ZMIANY-COMMIT
- Jedyna zmiana w tej rundzie: ten plik (`dyspozycje/autobot/runs/R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1/30-obrona-claude.md`).
- `gra/` bez zmian (poza allowlistą nic nie zmieniono). Brak nowego testu.

## TESTY
- Bramki odtworzone z kodu bazy (gra/ identyczne z d1860cfa3): zgodnie z raportem Evaluatora (tsc 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; playtest-mapa-dirty-forecast 10/0). W tej rundzie uruchomiono tylko test statyczny (oryginał 10/0 i dwie mutacje). Pełnych 5 bramek nie powtarzano, bo kod nie zmienił się względem bazy (NIE ZMIERZONO w tej rundzie).
- Mutacje (dowód K1): 7/3 (l.49798, mapa), 7/3 (l.49559, miasto); oryginał 10/0.

## BLOKADY
Brak blokad. Nie zainstalowano `gra/node_modules` w tej kopii (worktree wf_49a71131-8c7-3 jest czysty poza tym raportem).

## RUNDY
1/5. Operator uważa temat za zamknięty bez zmiany kodu (K1 w bazie, K2 bez efektu).

## UWAGI-DLA-ORKIESTRATORA
- Pozycja #492 (K1) w rejestrze: zamknąć jako „w bazie f3bf2cc67”.
- Pozycja #501 (K2): zamknąć jako „brak efektu” z uzasadnieniem powyżej.
- Ewentualny osobny temat (niski priorytet): `doStartPlaytestWalkaMapy` (~l.49296–49303) bez markCityStateDirty po cities.push. Nie zbadano wpływu na prognozę.
- Worktree evaluatora ma `gra/node_modules` (npm ci) do sprzątnięcia; w tej kopii go nie ma.

NASTĘPNY KROK: orkiestrator decyduje o zamknięciu K1/K2 w rejestrze i integracji (bez deployu).
DEPLOY/PUSH: NIE WYKONANO
