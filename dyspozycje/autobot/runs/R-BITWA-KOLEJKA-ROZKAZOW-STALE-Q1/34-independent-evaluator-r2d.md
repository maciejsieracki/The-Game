# Niezależny Evaluator — interpretacja R2-D i wykonalny kontrakt drugiego rozkazu

**Werdykt: PASS-WITH-NOTES wyłącznie dla pierwszej kolejki; całość pozostaje 5/11.**
R2-D poprawnie potwierdza realną aktywację 28/28 oddziałów po wydaniu rozkazów myszą
i Spacji. Nie jest to jeszcze dowód drugiego rozkazu ani obsługi martwego ID.

## Weryfikacja produkcyjnego przepływu

Niezależny przegląd `BattleScene` potwierdza, że `_battleAwaitingOrders` jest fazą
początkowego planowania (ustawianą przy starcie lub po przejściu AUTO → RĘCZNY).
`_kickoffBattleTurn()` ją kasuje. Po wyczerpaniu `turnOrder`, `_activateNext()` planuje
`_beginTurn()`, który zwiększa `roundNo`, odświeża `acted`/ruch, buduje nową kolejkę
i natychmiast wywołuje `_activateNext()`. Nie tworzy kolejnej fazy `_battleAwaitingOrders`.
Zatem warunek R2-D `roundNo >= 2 && _battleAwaitingOrders && !finished` nie jest
osiągalnym stanem normalnego przepływu bitwy. Timeout 240 s nie dowodzi blokady gry ani
awarii kolejki; jest błędem oczekiwania w harnessie.

## Dowód zachowania i pozostałe braki

Ślad `operator-r2d-execution-trace.json` wykazuje przez produkcyjny Chromium i pointer UI:
pełny roster 28v28, poprawne ustawienie tempa handlerem klawisza `V`, 28/28 aktywacji
po Space, 8 ruchów, `queueRemaining=0`, zero błędów JS/console. To silny dowód, że ID
żywych oddziałów z tej partii zostają wyczyszczone po aktywacji.

Brakuje nadal testu nowego rozkazu po pierwszej partii oraz krawędzi zabitego/pominiętego
ID. Osobny deterministyczny test `_activateNext()` może sprawdzić martwego queued
kandydata dokładnie pod `turnOrder[turnIdx]`, żywego następnego kandydata i usunięcie
ID; stubować wolno tylko `_schedule`, pozostawiając `_activateNext`, `_activateUnit`
i właściwy Set produkcyjne.

## Minimalny wykonalny follow-up

1. Zostawić prawdziwą pierwszą partię 28v28 bez sztucznego resetowania fazy.
2. Po jej zakończeniu zejść do 1× i obserwować aktywną drugą rundę, bez oczekiwania na
   nieistniejące `_battleAwaitingOrders`.
3. Gdy prawdziwy `turnOrder` ma jednostki gracza jeszcze `!acted`, wybrać przez mysz
   jeden oddział późno w kolejce i wydać zwykły (nie Ctrl/Shift) rozkaz ruchu. Wymagać
   nowego `playerOrder.type === 'move'`, `acted === true`, zmiany `q/r` i braku tego ID
   w `_queuedOrderUnitIds`. Wariant przed poprawką powinien blokować ten nowy rozkaz
   starym ID; aktualna poprawka powinna go dopuścić. Jest to realna interakcja podczas
   aktywnej rundy, a nie udawana faza planowania.
4. Osobno wykonać deterministyczną kontrolę martwego ID według powyższego kontraktu.

Po PASS tych dwóch brakujących dowodów ponowić niezależną ocenę uwag, następnie Defense
i Final Control. Nie rekomenduję integracji produktu na podstawie samego R2-D; obecny
test-first-cycle jest PASS, ale żądany follow-up nie został jeszcze sprawdzony.

Nie modyfikowałem kodu produktu ani nie integrowałem, wdrażałem lub wypychałem zmian.
