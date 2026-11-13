# R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1 — dispatch

## Cel

Po wykonaniu rozkazu z planowania przez kolejkę aktywacji jednostka nie może pozostać oznaczona jako nadal oczekująca w `_queuedOrderUnitIds`. Wykonany rozkaz znika z oznaczenia kolejki. Następny bezpośredni rozkaz dla wybranego podzbioru musi być wykonywalny i nie może zostać odfiltrowany jako nadal zakolejkowany.

## Reprodukcja bazowa

Niezależny evaluator w `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1/41-evaluator-round2.md` odtworzył po 28 rozkazach ruchu i pierwszej aktywacji: `round=1`, `turnIdx=28`, `acted=28`, 8 zmienionych pozycji, lecz `_queuedOrderUnitIds.size=28`. Ta rejestracja rozdziela cykl życia znacznika kolejki od bazowego testu dużej bitwy.

## Zakres / allowlista

- `gra/src/battle/battleScene.ts`
- `gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs`
- `dyspozycje/autobot/runs/R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1/**`

Bez zmian w innych plikach, integracji, merge, deployu ani pushu. Nie dotykać nieśledzonych plików w równoległych worktree.

## Kryteria akceptacji

1. Na produkcyjnym `BattleScene`, mieszana armia 28v28 wydaje rozkaz ruchu całej grupie przez Shift-click, a Spacja uruchamia realną kolejkę aktywacji.
2. Po aktywacji identyfikatory wykonanych jednostek są usunięte z `_queuedOrderUnitIds`.
3. W tej samej scenie operator odtwarza drugi bezpośredni rozkaz dla wskazanej jednostki/podzbioru przez pointer route; wykona się, a nie zostanie odfiltrowany jako stale queued.
4. Przed poprawką test odtwarza stale queued state; po poprawce test przechodzi. Test zachowuje rzeczywistą trasę UI/pointer i nie zastępuje produkcyjnych metod rozkazów.
5. Typecheck, składnia testu i `git diff --check` przechodzą; zapisany jest evidence i raport Operator.

## Etap

0/11 → rejestracja i reprodukcja. Następny: operator reprodukuje drugi cykl, wdraża najmniejszą poprawkę w lifecycle kolejki, następnie przekazuje do niezależnej ewaluacji.
