## RAPORT FINAL CONTROL — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6
GOAL: Rozkład dochodu per trasa (dystans osobno od 5%) + jawne wskazanie, gdy 5% czeka na budynek
ZMIANY/COMMIT: weryfikacja niezależna 8d72e54f (origin/autobot/HANDEL-T6-Q1), własny worktree /home/user/wt-fc-T6, merge-base 601508dd = origin/main (potwierdzone `git merge-base`)
TESTY: wszystkie bramki uruchomione niezależnie w moim worktree, identyczne wyniki jak Operator/Evaluator
BLOKADY: brak — N1 wymaga poprawki tekstu przed/podczas integracji, nie blokuje
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (z warunkiem — patrz niżej)
DEPLOY/PUSH: NIE WYKONANO
```

### Co zweryfikowałem samodzielnie (własny worktree, własne komendy)

1. **Izolacja/zakres**: `git worktree add /home/user/wt-fc-T6 origin/autobot/HANDEL-T6-Q1 --detach`. `git merge-base origin/main HEAD` = `601508dd` = dokładnie `origin/main` (potwierdzone `git rev-parse`, nie z pamięci). Diffstat 7 plików +946/−21, `git diff --check` czysty, `git status` czysty, `gra/data/`/`WERSJE.md` nietknięte.
2. **`trade-routes.ts`** — przeczytałem cały diff wprost: `tradeRouteBuildingBonusForRoute()` jest bit-identyczna ekstrakcją starego ciała pętli (`0.05 * baseIncome` → `TRADE_ROUTE_BUILDING_BONUS_RATE * tradeRouteTotalDistanceIncome(...)`), agregat T4 woła tę funkcję, oba `continue` zostały celowo. Akceptuję odstępstwo od allowlisty — uzasadnione, nietykalne T3/T4 pozostają nietknięte logicznie.
3. **Spójność matematyczna z T3/T4** (dispatch żądał tu szczególnej dokładności) — przeczytałem bezpośrednio `turn-economy.ts:2072/2100` (`pieniadz: pieniadzPoWealth + pieniadzZTras` — czysto, bez korupcji/mnożników) i `economy.ts:961-975` (`premiaTrasHandlowych` addytywnie do `handelBrutto`, PRZED korupcją i mnożnikiem Waluta/Mennica). Potwierdzam: dwa różne strumienie, sumowanie ich w UI byłoby czwartą, nieprawdziwą liczbą. Decyzja Operatora „nie sumujemy" jest poprawna.
4. **`premiaBudynku` liczone od `base`** (bez bonusu cudów) — potwierdzone w `main.ts:14055-14063`; wywołania agregatu (`main.ts:13054`, `:31517`) też nie dodają bonusu cudów — zgodność z silnikiem potwierdzona.
5. `node_modules/.bin/tsc --noEmit`: **0 błędów**. `vite build` binarką (C-001) do `/tmp/fc-t6-build`: **czysty, 846 modułów**. Artefakt zawiera `civ-emp-route-split`, „brak budynku", „5% budynek" i NIE zawiera podpisu sprzed T1 (`grep` na zbudowanym `index.html`).
6. Testy uruchomione niezależnie, identyczne liczby jak w obu raportach: `trade-routes-income-test` 107/0, `empire-panel-miasto-obywatele-content-test` 115/0, `empire-trade-route-split-real-render-test` 58/0, `trade-routes-test` 65/0, `trade-grant-test` 62/0, `zloto-szlak-test` 54/0, `cuda-handel-test` 25/0.
7. **5 bramek referencyjnych, uruchomione samodzielnie**: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
8. `trade-ilosc-test`: 35/5 w tym worktree — uruchomiłem ten sam test także na `/home/user/The-Game/gra` (baseline `main`): **też 35/5, identyczne asercje**. Potwierdzam niezależnie: pre-istniejące, niezwiązane z T6.

### Ocena N1–N5 Evaluatora

Zweryfikowałem N1 samodzielnie i **potwierdzam jako realne**: `trade-routes-test.cjs:143-146` (`routeOneSided`) dowodzi wprost, że `budynekOdblokowany` wymaga wolnego slotu po OBU stronach. Ponieważ `tradeRoutes` to zawsze pary gracz↔obca cywilizacja (komentarz w `main.ts`), partner to zawsze miasto AI — gracz nie ma nad nim kontroli. Nowy tekst „w Twoim mieście" (tooltip trasy, `empireDetailPanel.ts:809-810`) i „miasto ma Targowisko/Port" (podpis zakładki Miasto, `:2124`) są więc realnie mylące w przypadku, gdy to miasto AI brakuje slotu — gracz dostaje błędną instrukcję co budować. **Dodatkowo znalazłem trzecie miejsce tej samej nieścisłości**, którego Evaluator nie wymienił: docstring `EmpireTradeRouteRow.budynekOdblokowany` w `empireDetailTypes.ts` („czy ta trasa ma pokrycie budynkiem handlowym **w mieście gracza**"). Wyłącznie tekst/komentarze — zero wpływu na logikę, liczby, testy.

N2 (przesadzone zdanie raportu Operatora) — potwierdzone niezależnie: asercja absolutnego zera dotyczy wyłącznie komórki DOCHÓD (`cellOverflow <= 1`, linia 486); pozostałe kolumny mają asercję względną `otherOverflowPx <= ref.otherOverflowPx` (linia 500) — nie absolutne zero. Zgadzam się z Evaluatorem: to nieścisłość raportu, nie defekt kodu.

N3–N5 Evaluatora: potwierdzam jego ocenę, informacyjne, bez zastrzeżeń.

### Werdykt

Mechanika, matematyka i zgodność z T3/T4 są poprawne i niezależnie zweryfikowane od zera — trzeci niezależny render/test nie był tu potrzebny do powtórzenia (Evaluator już to zrobił solidnie, 32/32 własnym skryptem), skupiłem się na weryfikacji na poziomie kodu/silnika/bramek, którą dispatch podkreślił jako priorytet. Nie znalazłem żadnego nowego problemu logicznego ani regresji. **PASS-WITH-NOTES**, z jednym warunkiem dla integracji: **N1 (trzy miejsca tekstu — dwa UI stringi + jeden docstring typu) powinno zostać poprawione na wersję uwzględniającą obie strony trasy** (proponowana przez Evaluatora redakcja: „…budynek handlowy po obu stronach trasy (Twoje miasto i miasto partnera)") **przed lub w ramach integracji do `main`** — to czysta zmiana treści komentarza/tekstu w już-allowlistowanych plikach (`empireDetailPanel.ts`, `empireDetailTypes.ts`), zero ryzyka logicznego, nie wymaga pełnej nowej rundy Operator→Evaluator. Orkiestrator decyduje, czy zrobić to jako mikro-poprawkę przy integracji, czy jako osobny mikro-dispatch — obie ścieżki są bezpieczne, żadna nie blokuje zbiorczego deployu ROBOCZA po T1-T6.

**Ścieżki:** worktree Final Control `/home/user/wt-fc-T6` (czysty, HEAD `8d72e54f`) · build artefakt `/tmp/fc-t6-build/index.html`.
