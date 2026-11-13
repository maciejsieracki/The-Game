# Niezależny re-evaluator R2-H — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**Werdykt: PASS-WITH-NOTES. Etap ewaluacji: zakończony.** Sprawdziłem commit
`2340e5ddc6e9c82787c2caed532ae3ae848b1933`, implementację w
`gra/src/battle/battleScene.ts`, raport R2-H i dołączone evidence. Nie zmieniałem
produktu ani nie integrowałem gałęzi.

## Potwierdzone

- Test przeglądarkowy używał produkcyjnej sceny bitwy 28v28; skład gracza miał 20
  jednostek dystansowych i 8 konnych/rydwanów. 28 rozkazów ruszyło przez kolejkę
  aktywacji, a po pierwszym cyklu zbiór `_queuedOrderUnitIds` był pusty.
- W rundzie 2 operator wybrał przez produkcyjną kartę rosteru nieaktywną jednostkę
  `atk27`, następnie kliknął pusty heks przez canvas. Rewalidacja przed kliknięciem
  wykazała rundę 2, `turnIdx=13`, jednostkę nadal nieaktywną i jej indeks 27 dalej w
  kolejce. Kod produktu kieruje natychmiastowy rozkaz przez `_issueBattleMove` i
  `_executeUnitsImmediate`; filtr odrzucający jednostki z kolejki nie odrzucił jej,
  bo zbiór po pierwszym cyklu był pusty. Rozkaz `move` został zapisany, jednostka
  zmieniła pozycję `(30,72) → (31,70)`, a kolejka pozostała pusta.
- Rozbieżność klikniętego pola `(31,72)` i `playerOrder (31,68)` jest zgodna z
  istniejącym algorytmem offsetu formacji (`_moveTargetForUnit`), który przesuwa cel
  o `formationOffset`. Evidence nie zapisuje jednak samego `formationOffset` dla
  `atk27`; traktuję więc to wyjaśnienie jako zgodne z kodem, ale nie bezpośrednio
  potwierdzone dla tej konkretnej jednostki.
- Deterministyczny probe wywołuje produkcyjne `_activateNext` i `_activateUnit`;
  jedynym stubem jest scheduler. Nieżywy kandydat zostaje pominięty i jego ID
  usunięte z kolejki, a następna żywa jednostka jest aktywowana. Pole
  `deadActivated` w raporcie ma mylącą nazwę: wyrażenie `!dead.acted && dead.dead`
  oznacza, że martwa jednostka nie została aktywowana.
- Niezależnie uruchomione kontrole: `node --check` dla testu, `npm run typecheck`
  oraz `git diff --check 6069f2e2^ 2340e5dd` — wszystkie PASS.

## Uwagi do dalszej bramki

Od kliknięcia rozkazu do potwierdzenia ruchu upłynęło około 22 sekund; podczas tego
czasu `turnIdx` przeszedł z 13 do 28. Rozkaz pointerowy i zmianę pozycji potwierdzono,
ale evidence nie rozdziela jednoznacznie wykonania przez ścieżkę natychmiastową od
wykonania, gdy jednostka doszła do swojej zwykłej aktywacji. Zbiór pusty przed
rozkazem potwierdza usunięcie starych ID po pierwszym cyklu, ale przed Final Control
warto dopisać jawny probe wykazujący czas/ścieżkę wykonania natychmiastowego oraz
zapisać `groupId` i `formationOffset` dla `atk27`.

Nie blokuję poprawki w zakresie jej głównego celu: aktywowane i pominięte jednostki
nie pozostawiają starych ID, które mogłyby zatkać filtr późniejszych rozkazów.
Rekomenduję przekazanie do Final Control jako PASS-WITH-NOTES; ograniczenia muszą
pozostać jawne.
