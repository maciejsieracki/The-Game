# Operator — rejestracja i reprodukcja

**Status przed poprawką: DEFECT CONFIRMED.** Bazowe odtworzenie z niezależnego runu bitwy już zapisuje pełną produkcyjną scenę: po grupowym Shift-click ruchu i Spacji wszystkie 28 przyjaznych jednostek zakończyło pierwszą aktywację (`round=1`, `turnIdx=28`, `acted=28`), 8 zmieniło pozycję, ale `_queuedOrderUnitIds` nadal zawierał 28 ID. Artefakt źródłowy: `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1/evidence-defense/manual-full-roster-pointer-orders.json`.

Przegląd produkcyjnej ścieżki ujawnił, że `_executeUnitsImmediate()` odfiltrowuje ID będące w `_queuedOrderUnitIds`. Bezpośrednie `_issueBattleMove` i `_issueBattleAttack` kasują ID bieżącego podzbioru przed tą ścieżką, więc samo stwierdzenie „drugi rozkaz musi być blokowany” nie było jeszcze dowiedzione. OperatorDefense-test ma odtworzyć kolejny rzeczywisty pointer rozkaz po aktywacji, żeby odróżnić potwierdzone nieaktualne oznaczenie kolejki od hipotezy pominięcia komendy.

## Minimalna zmiana

Po zakończeniu rzeczywistej aktywacji jednostki, jeśli jej ID pozostaje w zbiorze oczekujących, usunąć tylko to ID i odświeżyć render kolejki. Nie kasować oczekujących rozkazów innych jednostek.

## Wynik pracy

Po zmianie test potwierdzi dwie czynności w tym samym produkcyjnym BattleScene: pełny batch 28 jednostek przez Spację/kolejkę aktywacji i drugi natychmiastowy rozkaz podzbioru przez canvas pointer. Następnie niezależny evaluator powinien powtórzyć test.
