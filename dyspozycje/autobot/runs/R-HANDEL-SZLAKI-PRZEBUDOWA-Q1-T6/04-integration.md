# 04 — INTEGRACJA (orkiestrator)

```
STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6
GOAL: Rozkład dochodu per trasa (dystans osobno od 5%) + jawne wskazanie, gdy 5% czeka na budynek
ZMIANY/COMMIT: main 2e6aac59 (merge non-ff origin/autobot/HANDEL-T6-Q1 8048460b)
TESTY: tsc/vite build czyste na main po merge; 13 testów tematu + 5 bramek referencyjnych zielone (niezależnie, po merge)
BLOKADY: brak
RUNDY: 1/5 (zamknięte)
NASTĘPNY KROK: zbiorczy deploy ROBOCZA (T1+T2+T2b+T3+T4+T6)
DEPLOY/PUSH: git push WYKONANO (main); deploy ROBOCZA jeszcze NIE WYKONANO (osobny krok)
```

## Werdykty ról

Operator PASS-WITH-NOTES → PASS (autotreść: brak uwag blokujących, `NASTĘPNY KROK: Evaluator`
w raporcie operatora pisze `RUNDY: 1/5` bez `-WITH-NOTES`, ale finalny status łańcucha wg
Evaluator/Final Control jest PASS-WITH-NOTES na wszystkich trzech poziomach — patrz
`01-operator.md`/`02-evaluator.md`/`03-final-control.md`). Evaluator: PASS-WITH-NOTES (N1-N5).
Final Control: PASS-WITH-NOTES, z jawnym warunkiem integracyjnym na N1.

## Ocena PASS-WITH-NOTES wg §3b

Final Control: „PASS-WITH-NOTES, z jednym warunkiem dla integracji: N1 (...) powinno zostać
poprawione (...) przed lub w ramach integracji do main (...) — to czysta zmiana treści
komentarza/tekstu w już-allowlistowanych plikach, zero ryzyka logicznego, nie wymaga pełnej
nowej rundy Operator→Evaluator. Orkiestrator decyduje, czy zrobić to jako mikro-poprawkę przy
integracji, czy jako osobny mikro-dispatch — obie ścieżki są bezpieczne."

N1 dotyka technicznie „gotowości do integracji" (§3b), więc formalnie mógłby wymagać nowej
rundy — ALE Final Control (rola z pełnym mandatem oceny gotowości integracyjnej w tym procesie)
jawnie i świadomie skwalifikował TREŚĆ tej konkretnej uwagi jako czysto kosmetyczną (zmiana
stringów/docstringa, zero logiki/liczb/testów) i jawnie autoryzował rozwiązanie bez nowej rundy.
Orkiestrator wybrał ścieżkę „integration micro-fix": poprawka wykonana NA GAŁĘZI TEMATU
(`autobot/HANDEL-T6-Q1`, commit `8048460b`), zweryfikowana pełnym zestawem bramek PRZED mergem
(nie tylko przy integracji) — czyli spełnia intencję §3b silniej niż wymagane minimum: nie jest
to "wolna uwaga zostawiona w raporcie", jest to skorygowany, przetestowany kod scalony do main
i udokumentowany tu oraz w `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md`.

N2-N5: jawnie zakwalifikowane przez obie role kontrolne jako informacyjne, bez wymaganego
działania. Zapisane w decyzji dla przyszłej referencji, nie wymagają osobnego tematu.

## N1 — micro-fix (wykonany przed mergem)

5 miejsc poprawionych (4 wskazane przez Evaluator/Final Control + 1 dodatkowe tej samej
kategorii znalezione przy naprawie, linia 3289 tooltip wiersza SUMA w zakładce Handel):

- `gra/src/ui/empireDetailPanel.ts:809-812` — tooltip trasy bez budynku (`routeBonusSplitHtml`)
- `gra/src/ui/empireDetailPanel.ts:815` — tooltip trasy z budynkiem (`routeBonusSplitHtml`)
- `gra/src/ui/empireDetailPanel.ts:2124` — podpis zakładki Miasto (`renderMiastoSection`)
- `gra/src/ui/empireDetailPanel.ts:3288-3289` — tooltip wiersza SUMA (`renderHandelSection`)
- `gra/src/ui/empireDetailTypes.ts:451-455` — docstring `EmpireTradeRouteRow.budynekOdblokowany`

Wzorzec zmiany: „w Twoim mieście" / „miasto ma Targowisko/Port" → „po obu stronach trasy
(Twoje miasto i miasto partnera)" / „które mają Targowisko/Port po obu stronach" — dokładnie
redakcja zaproponowana przez Evaluatora, potwierdzona przez Final Control.

Weryfikacja PRZED mergem (worktree `/home/user/wt-HANDEL-T6`, commit `8048460b`): `tsc --noEmit`
0 błędów, `vite build` (C-001) czysty 846 modułów, `trade-routes-income-test` 107/0,
`empire-panel-miasto-obywatele-content-test` 115/0, `empire-trade-route-split-real-render-test`
58/0, `trade-routes-test` 65/0, `trade-grant-test` 62/0, 5 bramek referencyjnych zielone.

## Weryfikacja integracji (po merge do main, commit 2e6aac59)

Merge-base `origin/main` przed mergem = `601508dd` = HEAD gałęzi tematu przed commitem N1 —
potwierdza zero dryfu main w trakcie pracy nad tematem. Diffstat: 7 plików, +948/−21
(zawiera N1 fix). `git diff --check` czysty.

Po merge, na `main`: `tsc --noEmit` 0 błędów, `vite build` (C-001) czysty 846 modułów.
Testy: `trade-routes-income-test` 107/0, `empire-panel-miasto-obywatele-content-test` 115/0,
`empire-trade-route-split-real-render-test` 58/0, `trade-routes-test` 65/0, `trade-grant-test`
62/0, `zloto-szlak-test` 54/0, `cuda-handel-test` 25/0, `mennica-uspienie-test` 49/0.
5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33,
`unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.

`git push -u origin main` → `601508dd..2e6aac59  main -> main`.

## Zamknięcie serii

T1+T2+T2b+T3+T4+T6 wszystkie ZINTEGROWANE do `main`. `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md`
zaktualizowany (status header + wpis T6). Następny krok: zbiorczy deploy ROBOCZA obejmujący
całą serię, zgodnie ze standingową dyspozycją właściciela.
