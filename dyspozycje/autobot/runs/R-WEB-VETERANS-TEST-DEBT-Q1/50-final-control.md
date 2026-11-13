# Final control — R-WEB-VETERANS-TEST-DEBT-Q1

**Wynik: PASS**

Uruchomiono z `gra/`: `node tools/weterani-test.cjs` — **79 PASS, 0 FAIL**.
Sekcja 10 potwierdza nominalną Moc Konnicy równą **98** i Moc po premii
weterana **116**. Obie wartości pochodzą z bieżących helperów i danych
jednostki; wynik M w sekcji 9 oraz wynik tabliczki po skalowaniu są zgodne.

Kontrola zmian sekcji 10: usunięto nieaktualną stałą `49` na rzecz istniejącej
wartości bazowej `mRekrut`; porównania wyniku nominalnego, wyniku weterana,
parytetu z auto-M i wzrostu ponad wartość nominalną pozostały. Asercje źródłowe
sprawdzające wstrzyknięcie `combatPowerFullDisplayDefFor` i istnienie funkcji
również pozostały. Nie stwierdzono osłabienia asercji.

Zakres decyzji `R-MOC-TABLICZKA-VS-CIVPOWER-Q1` jest zachowany: tabliczka nad
żetonem używa pełnej Mocy efektywnej, a panel pre-battle nadal używa nominalnej
definicji przez `unitDefFor` i `armyFieldPower`.

To jest wyłącznie regresja jednostkowa harnessu weteranów. Nie uruchamiano
pełnej bitwy, builda ani Chromium.
